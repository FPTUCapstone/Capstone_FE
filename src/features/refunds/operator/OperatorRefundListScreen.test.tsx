import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./refundsOperatorService', () => ({
  fetchOperatorRefunds: vi.fn(),
  RefundsOperatorError: class extends Error {
    constructor(public status: number, public errorCode?: string, title?: string) {
      super(title);
    }
  },
}));

import { OperatorRefundListScreen } from './OperatorRefundListScreen';
import { fetchOperatorRefunds, RefundsOperatorError } from './refundsOperatorService';

const item = {
  refundId: 501,
  bookingId: 42,
  bookingCode: 'BK-20261022-00042',
  amount: 500_000,
  status: 'PendingOperatorConfirmation' as const,
  operatorReturnShare: null,
  returnDeadlineAtUtc: null,
  requestedAtUtc: '2026-11-10T03:00:00Z',
};

describe('OperatorRefundListScreen', () => {
  beforeEach(() => {
    vi.mocked(fetchOperatorRefunds).mockReset().mockResolvedValue({ pageNumber: 1, pageSize: 20, totalCount: 1, items: [item] });
  });

  it('lists the operator refunds, each linking to its Confirm Booking Refund screen', async () => {
    render(<OperatorRefundListScreen />);
    const link = await screen.findByRole('link', { name: 'BK-20261022-00042' });
    expect(link.getAttribute('href')).toBe('/partner/refunds/501');
    expect(screen.getByText('Awaiting your confirmation')).toBeTruthy();
  });

  it('shows the empty state when there are no refund requests', async () => {
    vi.mocked(fetchOperatorRefunds).mockResolvedValue({ pageNumber: 1, pageSize: 20, totalCount: 0, items: [] });
    render(<OperatorRefundListScreen />);
    expect(await screen.findByText('No refund requests to show.')).toBeTruthy();
  });

  it('shows access denied on 403', async () => {
    vi.mocked(fetchOperatorRefunds).mockRejectedValue(new RefundsOperatorError(403, undefined, 'Denied'));
    render(<OperatorRefundListScreen />);
    expect(await screen.findByText('You do not have permission to access this function.')).toBeTruthy();
  });

  it('offers a retry that re-fetches after a load failure', async () => {
    vi.mocked(fetchOperatorRefunds).mockRejectedValueOnce(new RefundsOperatorError(503, undefined, 'Down'));
    render(<OperatorRefundListScreen />);
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(fetchOperatorRefunds).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('link', { name: 'BK-20261022-00042' })).toBeTruthy();
  });

  it('requests the next page', async () => {
    vi.mocked(fetchOperatorRefunds).mockResolvedValue({ pageNumber: 1, pageSize: 20, totalCount: 45, items: [item] });
    render(<OperatorRefundListScreen />);
    fireEvent.click(await screen.findByRole('button', { name: 'Next' }));
    await waitFor(() => expect(fetchOperatorRefunds).toHaveBeenLastCalledWith(2, 20, expect.anything()));
  });
});
