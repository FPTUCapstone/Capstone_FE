import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('./refundsAdminService', () => ({
  fetchEscalatedRefunds: vi.fn(),
  resolveEscalatedRefund: vi.fn(),
  RefundsAdminError: class extends Error {
    constructor(public status: number, public errorCode?: string, title?: string) {
      super(title);
    }
  },
}));

import { fetchEscalatedRefunds, resolveEscalatedRefund, RefundsAdminError } from './refundsAdminService';
import { EscalatedRefundsMonitorScreen } from './EscalatedRefundsMonitorScreen';

const escalatedItem = {
  refundId: 501,
  bookingCode: 'BK-20261022-00042',
  tourOperatorUserId: 7,
  amount: 500_000,
  returnReference: null,
  returnReportedAtUtc: null,
  status: 'Escalated' as const,
  attemptCount: 4,
  lastErrorCode: 'gateway_timeout',
};

const reconciliationItem = {
  refundId: 502,
  bookingCode: 'BK-20261101-00099',
  tourOperatorUserId: 9,
  amount: 1_200_000,
  returnReference: null,
  returnReportedAtUtc: null,
  status: 'Reconciliation' as const,
  attemptCount: null,
  lastErrorCode: null,
};

describe('EscalatedRefundsMonitorScreen', () => {
  beforeEach(() => {
    replace.mockClear();
    vi.mocked(fetchEscalatedRefunds).mockReset().mockResolvedValue({
      pageNumber: 1,
      pageSize: 20,
      totalCount: 2,
      items: [escalatedItem, reconciliationItem],
    });
    vi.mocked(resolveEscalatedRefund).mockReset().mockResolvedValue(undefined);
  });

  it('lists both Escalated and Reconciliation rows with distinct, unambiguous treatment', async () => {
    render(<EscalatedRefundsMonitorScreen />);
    await screen.findByText('BK-20261022-00042');
    expect(screen.getByText('Escalated')).toBeTruthy();
    expect(screen.getByText('Reconciliation')).toBeTruthy();
    // Escalated row shows its real attempt/error fields.
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('gateway_timeout')).toBeTruthy();
    // Reconciliation row never fabricates those fields.
    const notApplicable = screen.getAllByText('Not applicable');
    expect(notApplicable.length).toBe(2);
  });

  it('shows the empty state when nothing needs manual resolution', async () => {
    vi.mocked(fetchEscalatedRefunds).mockResolvedValue({ pageNumber: 1, pageSize: 20, totalCount: 0, items: [] });
    render(<EscalatedRefundsMonitorScreen />);
    expect(await screen.findByText('No refunds currently need manual resolution.')).toBeTruthy();
  });

  it('[View Details] opens the resolve form, which resolves the refund and re-fetches', async () => {
    render(<EscalatedRefundsMonitorScreen />);
    const viewDetailsButtons = await screen.findAllByRole('button', { name: 'View Details' });
    fireEvent.click(viewDetailsButtons[0]);
    fireEvent.change(screen.getByLabelText('Gateway Reference'), { target: { value: 'GW-998877' } });
    vi.mocked(fetchEscalatedRefunds).mockResolvedValueOnce({ pageNumber: 1, pageSize: 20, totalCount: 1, items: [reconciliationItem] });
    fireEvent.click(screen.getByRole('button', { name: 'Resolve' }));
    await waitFor(() => expect(resolveEscalatedRefund).toHaveBeenCalledWith(501, 'GW-998877'));
    await waitFor(() => expect(screen.queryByText('gateway_timeout')).toBeNull());
  });

  it('blocks a blank gateway reference client-side', async () => {
    render(<EscalatedRefundsMonitorScreen />);
    const viewDetailsButtons = await screen.findAllByRole('button', { name: 'View Details' });
    fireEvent.click(viewDetailsButtons[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Resolve' }));
    expect(await screen.findByText('A gateway reference is required.')).toBeTruthy();
    expect(resolveEscalatedRefund).not.toHaveBeenCalled();
  });

  it('shows a forbidden message on a 403', async () => {
    vi.mocked(fetchEscalatedRefunds).mockRejectedValue(new RefundsAdminError(403, undefined, 'Forbidden.'));
    render(<EscalatedRefundsMonitorScreen />);
    expect(await screen.findByRole('alert')).toBeTruthy();
  });
});
