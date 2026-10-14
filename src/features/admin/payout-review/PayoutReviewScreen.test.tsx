import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PayoutReviewScreen } from './PayoutReviewScreen';
import type { PayoutDetail } from './payoutReview';
import { PayoutReviewError, approvePayout, fetchPayoutDetail, rejectPayout } from './payoutReviewService';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace }) }));
vi.mock('./payoutReviewService', () => ({
  fetchPayoutDetail: vi.fn(),
  approvePayout: vi.fn(),
  rejectPayout: vi.fn(),
  PayoutReviewError: class extends Error {
    constructor(public status: number, public errorCode?: string, public errorMessage?: string) { super(); }
  },
}));

const pendingDetail: PayoutDetail = {
  payoutId: '123',
  payoutCode: 'PO-123',
  status: 'PendingReview',
  settlementPeriod: { startDate: '2026-09-01', endDate: '2026-09-30' },
  tourOperator: { operatorId: '45', companyName: 'Hoi An Tours' },
  grossRevenue: 12000000,
  commissionRate: 0.1,
  commissionAmount: 1200000,
  netPayoutAmount: 10800000,
  requestedAtUtc: '2026-10-03T08:15:00Z',
  contributingBookings: [
    { bookingId: '9001', bookingCode: 'BK-9001', tourName: 'Marble Mountains', completedAtUtc: '2026-09-12T10:00:00Z', paidAmount: 500000, refundedAmount: 0, netAmount: 500000 },
  ],
  beneficiary: { bankName: 'Vietcombank', accountHolder: 'NGUYEN VAN A', maskedAccountNumber: 'XXXXXXXX1234' },
  rejectionReason: null,
};

describe('PayoutReviewScreen', () => {
  beforeEach(() => {
    replace.mockClear();
    vi.mocked(fetchPayoutDetail).mockReset().mockResolvedValue(pendingDetail);
    vi.mocked(approvePayout).mockReset();
    vi.mocked(rejectPayout).mockReset();
  });

  it('renders the detail sections and masked beneficiary for a PendingReview request', async () => {
    render(<PayoutReviewScreen payoutId="123" />);

    expect(await screen.findByRole('heading', { name: 'PO-123' })).toBeTruthy();
    expect(screen.getByText(/Hoi An Tours/)).toBeTruthy();
    expect(screen.getByText(/\(10%\)/)).toBeTruthy();
    expect(screen.getByText('XXXXXXXX1234')).toBeTruthy();
    expect(screen.getByText('BK-9001')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeTruthy();
  });

  it('shows "Not available" and never a fabricated number when the beneficiary snapshot is null', async () => {
    vi.mocked(fetchPayoutDetail).mockResolvedValue({
      ...pendingDetail,
      beneficiary: { bankName: null, accountHolder: null, maskedAccountNumber: null },
    });

    render(<PayoutReviewScreen payoutId="123" />);

    expect(await screen.findByText('Not available')).toBeTruthy();
  });

  it('hides Approve/Reject for a non-PendingReview status and shows the recorded reason', async () => {
    vi.mocked(fetchPayoutDetail).mockResolvedValue({
      ...pendingDetail,
      status: 'Rejected',
      rejectionReason: 'Bank details could not be verified.',
    });

    render(<PayoutReviewScreen payoutId="123" />);

    await screen.findByRole('heading', { name: 'PO-123' });
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reject' })).toBeNull();
    expect(screen.getByText(/Bank details could not be verified\./)).toBeTruthy();
  });

  it('redirects to sign-in with the detail returnUrl on 401', async () => {
    vi.mocked(fetchPayoutDetail).mockRejectedValue(new PayoutReviewError(401));
    render(<PayoutReviewScreen payoutId="123" />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Fpayouts%2F123'));
  });

  it('shows the not-found message on 404', async () => {
    vi.mocked(fetchPayoutDetail).mockRejectedValue(new PayoutReviewError(404));
    render(<PayoutReviewScreen payoutId="999" />);
    expect(await screen.findByText(/was not found/)).toBeTruthy();
  });

  it('shows the forbidden message on 403', async () => {
    vi.mocked(fetchPayoutDetail).mockRejectedValue(new PayoutReviewError(403));
    render(<PayoutReviewScreen payoutId="123" />);
    expect(await screen.findByText('Access denied')).toBeTruthy();
  });

  it('recovers through Retry after an unavailable response', async () => {
    vi.mocked(fetchPayoutDetail).mockRejectedValueOnce(new PayoutReviewError(500))
      .mockResolvedValueOnce(pendingDetail);
    render(<PayoutReviewScreen payoutId="123" />);
    const retry = await screen.findByRole('button', { name: 'Retry' });
    fireEvent.click(retry);
    expect(await screen.findByRole('heading', { name: 'PO-123' })).toBeTruthy();
  });

  it('approves on confirm, refreshes the detail, and shows a success message', async () => {
    vi.mocked(approvePayout).mockResolvedValue({ payoutId: '123', status: 'ApprovedForSettlement', decidedAtUtc: '2026-10-14T09:00:00Z' });
    render(<PayoutReviewScreen payoutId="123" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Confirm approval' }));

    await waitFor(() => expect(approvePayout).toHaveBeenCalledWith('123'));
    expect(await screen.findByText(/approved and moved to the settlement queue/)).toBeTruthy();
    expect(fetchPayoutDetail).toHaveBeenCalledTimes(2);
  });

  it('rejects on confirm with a valid reason, refreshes the detail, and shows a success message', async () => {
    vi.mocked(rejectPayout).mockResolvedValue({
      payoutId: '123', status: 'Rejected', decidedAtUtc: '2026-10-14T09:00:00Z',
      rejectionReason: 'Bank details could not be verified.',
    });
    render(<PayoutReviewScreen payoutId="123" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Reject' }));

    fireEvent.change(screen.getByLabelText('Reason for rejection'), {
      target: { value: 'Bank details could not be verified.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm rejection' }));

    await waitFor(() => expect(rejectPayout).toHaveBeenCalledWith('123', 'Bank details could not be verified.'));
    expect(await screen.findByText('The payout request was rejected.')).toBeTruthy();
  });

  it('blocks submission and shows MSG157 inline when the reason is below the minimum length', async () => {
    render(<PayoutReviewScreen payoutId="123" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Reject' }));

    fireEvent.change(screen.getByLabelText('Reason for rejection'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm rejection' }));

    expect(await screen.findByText(/Rejection reason must be between 10 and 500 characters\./)).toBeTruthy();
    expect(rejectPayout).not.toHaveBeenCalled();
  });

  it('keeps the entered reason and shows MSG157 when the server returns 400', async () => {
    vi.mocked(rejectPayout).mockRejectedValue(new PayoutReviewError(400, 'payout.rejection_reason_invalid'));
    render(<PayoutReviewScreen payoutId="123" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Reject' }));

    const textarea = screen.getByLabelText('Reason for rejection') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'A reason the server still rejects.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm rejection' }));

    expect(await screen.findByText(/Rejection reason must be between 10 and 500 characters\./)).toBeTruthy();
    expect(textarea.value).toBe('A reason the server still rejects.');
  });

  it('does not send a second approve request on a double click', async () => {
    let resolveApprove: (() => void) | undefined;
    vi.mocked(approvePayout).mockImplementation(() => new Promise((resolve) => {
      resolveApprove = () => resolve({ payoutId: '123', status: 'ApprovedForSettlement', decidedAtUtc: '2026-10-14T09:00:00Z' });
    }));
    render(<PayoutReviewScreen payoutId="123" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));
    const confirm = await screen.findByRole('button', { name: 'Confirm approval' });

    fireEvent.click(confirm);
    fireEvent.click(confirm);
    resolveApprove?.();

    await waitFor(() => expect(approvePayout).toHaveBeenCalledTimes(1));
  });

  it('shows a conflict message and refreshes the detail on a 409 approve response', async () => {
    vi.mocked(approvePayout).mockRejectedValue(new PayoutReviewError(409, 'payout.not_pending_review'));
    vi.mocked(fetchPayoutDetail)
      .mockResolvedValueOnce(pendingDetail)
      .mockResolvedValueOnce({ ...pendingDetail, status: 'Rejected', rejectionReason: 'Already decided.' });

    render(<PayoutReviewScreen payoutId="123" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm approval' }));

    await waitFor(() => expect(fetchPayoutDetail).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/no longer pending review/)).toBeTruthy();
  });
});
