import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('./refundsOperatorService', () => ({
  fetchOperatorRefundDetail: vi.fn(),
  reportOperatorRefundReturn: vi.fn(),
  RefundsOperatorError: class extends Error {
    constructor(public status: number, public errorCode?: string, title?: string) { super(title); }
  },
}));

import { fetchOperatorRefundDetail, RefundsOperatorError, reportOperatorRefundReturn } from './refundsOperatorService';
import { ConfirmBookingRefundScreen } from './ConfirmBookingRefundScreen';

const awaitingReturn = {
  refundId: 501, bookingId: 42, bookingCode: 'BK-20261022-00042', tourName: 'Ha Long Bay 3D2N',
  departureDate: '2026-12-01', paidAmount: 5_000_000, referenceCode: 'CXL-00042', refundAmount: 5_000_000,
  operatorReturnShare: 3_500_000, returnDeadlineAtUtc: '2026-12-05T03:00:00Z', returnReference: null,
  returnReportedAtUtc: null, status: 'AwaitingPartnerReturn' as const,
};

describe('ConfirmBookingRefundScreen', () => {
  beforeEach(() => {
    replace.mockClear();
    vi.mocked(fetchOperatorRefundDetail).mockReset().mockResolvedValue(awaitingReturn);
    vi.mocked(reportOperatorRefundReturn).mockReset().mockResolvedValue(undefined);
  });

  it('shows the cancellation-created obligation and deadline without a confirmation action', async () => {
    render(<ConfirmBookingRefundScreen refundId={501} />);
    expect(await screen.findByText('BK-20261022-00042')).toBeTruthy();
    expect(screen.getByText('AwaitingPartnerReturn')).toBeTruthy();
    expect(screen.getByText(/5 Dec 2026/i)).toBeTruthy();
    expect(screen.getByLabelText('Bank Transfer Reference')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Confirm Refund' })).toBeNull();
  });

  it('does not show a bank-transfer form for a zero-share automatic refund', async () => {
    vi.mocked(fetchOperatorRefundDetail).mockResolvedValue({ ...awaitingReturn, operatorReturnShare: 0, returnDeadlineAtUtc: null, status: 'Pending' });
    render(<ConfirmBookingRefundScreen refundId={501} />);
    await screen.findByText('Pending');
    expect(screen.queryByLabelText('Bank Transfer Reference')).toBeNull();
  });

  it('blocks a blank reference before any request is sent', async () => {
    render(<ConfirmBookingRefundScreen refundId={501} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm Return' }));
    expect(await screen.findByText('A bank transfer reference is required.')).toBeTruthy();
    expect(reportOperatorRefundReturn).not.toHaveBeenCalled();
  });

  it('reports the transfer and re-fetches the committed status', async () => {
    render(<ConfirmBookingRefundScreen refundId={501} />);
    await screen.findByRole('button', { name: 'Confirm Return' });
    fireEvent.change(screen.getByLabelText('Bank Transfer Reference'), { target: { value: 'FT-998877' } });
    vi.mocked(fetchOperatorRefundDetail).mockResolvedValueOnce({ ...awaitingReturn, status: 'ReturnReported', returnReference: 'FT-998877', returnReportedAtUtc: '2026-12-02T03:00:00Z' });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Return' }));
    await waitFor(() => expect(reportOperatorRefundReturn).toHaveBeenCalledWith(501, 'FT-998877'));
    expect(await screen.findByText('ReturnReported')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Confirm Return' })).toBeNull();
  });

  it('redirects to sign-in on a 401 while loading', async () => {
    vi.mocked(fetchOperatorRefundDetail).mockRejectedValue(new RefundsOperatorError(401, undefined, 'Session expired.'));
    render(<ConfirmBookingRefundScreen refundId={501} />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith(expect.stringContaining('/sign-in')));
  });

  it('shows a retry affordance on an unavailable load failure', async () => {
    vi.mocked(fetchOperatorRefundDetail).mockRejectedValueOnce(new RefundsOperatorError(503, undefined, 'Unavailable.'));
    render(<ConfirmBookingRefundScreen refundId={501} />);
    const retryButton = await screen.findByRole('button', { name: 'Retry' });
    vi.mocked(fetchOperatorRefundDetail).mockResolvedValueOnce(awaitingReturn);
    fireEvent.click(retryButton);
    expect(await screen.findByText('AwaitingPartnerReturn')).toBeTruthy();
  });
});
