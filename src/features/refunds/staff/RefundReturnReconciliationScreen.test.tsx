import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('../admin/refundsAdminService', () => ({
  fetchReturnReportedRefunds: vi.fn(),
  markRefundReturnReceived: vi.fn(),
  RefundsAdminError: class extends Error {
    constructor(public status: number, public errorCode?: string, title?: string) {
      super(title);
    }
  },
}));

import { fetchReturnReportedRefunds, markRefundReturnReceived, RefundsAdminError } from '../admin/refundsAdminService';
import { RefundReturnReconciliationScreen } from './RefundReturnReconciliationScreen';

const item = {
  refundId: 501,
  bookingCode: 'BK-20261022-00042',
  tourOperatorUserId: 7,
  amount: 3_500_000,
  returnReference: 'FT-998877',
  returnReportedAtUtc: '2026-12-02T03:00:00Z',
  status: 'ReturnReported' as const,
  attemptCount: null,
  lastErrorCode: null,
};

describe('RefundReturnReconciliationScreen', () => {
  beforeEach(() => {
    replace.mockClear();
    vi.mocked(fetchReturnReportedRefunds).mockReset().mockResolvedValue({ pageNumber: 1, pageSize: 20, totalCount: 1, items: [item] });
    vi.mocked(markRefundReturnReceived).mockReset().mockResolvedValue(undefined);
  });

  it('lists ReturnReported refunds with the spec field set', async () => {
    render(<RefundReturnReconciliationScreen />);
    expect(await screen.findByText('BK-20261022-00042')).toBeTruthy();
    expect(screen.getByText('FT-998877')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Confirm Receipt' })).toBeTruthy();
  });

  it('shows the empty state when there is nothing to reconcile', async () => {
    vi.mocked(fetchReturnReportedRefunds).mockResolvedValue({ pageNumber: 1, pageSize: 20, totalCount: 0, items: [] });
    render(<RefundReturnReconciliationScreen />);
    expect(await screen.findByText('No returns awaiting reconciliation.')).toBeTruthy();
  });

  it('[Confirm Receipt] calls the service and removes the row only after a successful re-fetch', async () => {
    render(<RefundReturnReconciliationScreen />);
    await screen.findByRole('button', { name: 'Confirm Receipt' });
    vi.mocked(fetchReturnReportedRefunds).mockResolvedValueOnce({ pageNumber: 1, pageSize: 20, totalCount: 0, items: [] });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Receipt' }));
    await waitFor(() => expect(markRefundReturnReceived).toHaveBeenCalledWith(501));
    expect(await screen.findByText('No returns awaiting reconciliation.')).toBeTruthy();
  });

  it('shows an inline row error and keeps the row when the action fails', async () => {
    render(<RefundReturnReconciliationScreen />);
    await screen.findByRole('button', { name: 'Confirm Receipt' });
    vi.mocked(markRefundReturnReceived).mockRejectedValueOnce(new RefundsAdminError(409, 'refund.request_not_pending', 'Already reconciled.'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Receipt' }));
    expect(await screen.findByText('Already reconciled.')).toBeTruthy();
    expect(screen.getByText('BK-20261022-00042')).toBeTruthy();
  });

  it('shows a forbidden message on a 403', async () => {
    vi.mocked(fetchReturnReportedRefunds).mockRejectedValue(new RefundsAdminError(403, undefined, 'Forbidden.'));
    render(<RefundReturnReconciliationScreen />);
    expect(await screen.findByRole('alert')).toBeTruthy();
  });

  it('redirects to admin sign-in on a 401', async () => {
    vi.mocked(fetchReturnReportedRefunds).mockRejectedValue(new RefundsAdminError(401, undefined, 'Session expired.'));
    render(<RefundReturnReconciliationScreen />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith(expect.stringContaining('/admin/login')));
  });
});
