import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('./refundsOperatorService', () => ({
  fetchOperatorRefundDetail: vi.fn(),
  confirmOperatorRefund: vi.fn(),
  reportOperatorRefundReturn: vi.fn(),
  RefundsOperatorError: class extends Error {
    constructor(public status: number, public errorCode?: string, title?: string) {
      super(title);
    }
  },
}));

import {
  confirmOperatorRefund,
  fetchOperatorRefundDetail,
  RefundsOperatorError,
  reportOperatorRefundReturn,
} from './refundsOperatorService';
import { ConfirmBookingRefundScreen } from './ConfirmBookingRefundScreen';
import type { RefundDetail } from '../types/refundLifecycle';

const pending = {
  refundId: 501,
  bookingId: 42,
  bookingCode: 'BK-20261022-00042',
  tourName: 'Ha Long Bay 3D2N',
  departureDate: '2026-12-01',
  paidAmount: 5_000_000,
  referenceCode: 'CXL-00042',
  refundAmount: 5_000_000,
  operatorReturnShare: 3_500_000,
  returnDeadlineAtUtc: null,
  returnReference: null,
  returnReportedAtUtc: null,
  status: 'PendingOperatorConfirmation' as const,
};

describe('ConfirmBookingRefundScreen', () => {
  beforeEach(() => {
    replace.mockClear();
    vi.mocked(fetchOperatorRefundDetail).mockReset().mockResolvedValue(pending);
    vi.mocked(confirmOperatorRefund).mockReset().mockResolvedValue(undefined);
    vi.mocked(reportOperatorRefundReturn).mockReset().mockResolvedValue(undefined);
  });

  it('shows the booking summary and refund details fields', async () => {
    render(<ConfirmBookingRefundScreen refundId={501} />);
    expect(await screen.findByText('BK-20261022-00042')).toBeTruthy();
    expect(screen.getByText('Ha Long Bay 3D2N')).toBeTruthy();
    expect(screen.getByText('CXL-00042')).toBeTruthy();
    expect(screen.getByText('PendingOperatorConfirmation')).toBeTruthy();
  });

  it('shows [Confirm Refund] while PendingOperatorConfirmation', async () => {
    render(<ConfirmBookingRefundScreen refundId={501} />);
    expect(await screen.findByRole('button', { name: 'Confirm Refund' })).toBeTruthy();
  });

  it('hides [Confirm Refund] once the status has moved past PendingOperatorConfirmation', async () => {
    vi.mocked(fetchOperatorRefundDetail).mockResolvedValue({ ...pending, status: 'ReturnReported' });
    render(<ConfirmBookingRefundScreen refundId={502} />);
    await screen.findByText('ReturnReported');
    expect(screen.queryByRole('button', { name: 'Confirm Refund' })).toBeNull();
  });

  it('zero-share confirmation skips straight to settled, no Return area ever shown', async () => {
    render(<ConfirmBookingRefundScreen refundId={501} />);
    await screen.findByRole('button', { name: 'Confirm Refund' });
    vi.mocked(fetchOperatorRefundDetail).mockResolvedValueOnce({
      ...pending,
      status: 'Processing',
      operatorReturnShare: 0,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Refund' }));
    await waitFor(() => expect(confirmOperatorRefund).toHaveBeenCalledWith(501));
    expect(await screen.findByText('Processing')).toBeTruthy();
    expect(screen.queryByLabelText('Bank Transfer Reference')).toBeNull();
  });

  it('non-zero-share confirmation shows the Return area with the real re-fetched status', async () => {
    render(<ConfirmBookingRefundScreen refundId={501} />);
    await screen.findByRole('button', { name: 'Confirm Refund' });
    vi.mocked(fetchOperatorRefundDetail).mockResolvedValueOnce({ ...pending, status: 'AwaitingPartnerReturn' });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Refund' }));
    await waitFor(() => expect(confirmOperatorRefund).toHaveBeenCalledWith(501));
    expect(await screen.findByText('AwaitingPartnerReturn')).toBeTruthy();
    expect(screen.getByLabelText('Bank Transfer Reference')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Confirm Return' })).toBeTruthy();
  });

  it('[Confirm Return] blocks a blank reference client-side (MSG172) before any request is sent', async () => {
    vi.mocked(fetchOperatorRefundDetail).mockResolvedValue({ ...pending, status: 'AwaitingPartnerReturn' });
    render(<ConfirmBookingRefundScreen refundId={501} />);
    await screen.findByRole('button', { name: 'Confirm Return' });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Return' }));
    expect(await screen.findByText('A bank transfer reference is required.')).toBeTruthy();
    expect(reportOperatorRefundReturn).not.toHaveBeenCalled();
  });

  it('[Confirm Return] with a reference re-fetches and shows the reference read-only', async () => {
    vi.mocked(fetchOperatorRefundDetail).mockResolvedValue({ ...pending, status: 'AwaitingPartnerReturn' });
    render(<ConfirmBookingRefundScreen refundId={501} />);
    await screen.findByRole('button', { name: 'Confirm Return' });
    fireEvent.change(screen.getByLabelText('Bank Transfer Reference'), { target: { value: 'FT-998877' } });
    vi.mocked(fetchOperatorRefundDetail).mockResolvedValueOnce({
      ...pending,
      status: 'ReturnReported',
      returnReference: 'FT-998877',
      returnReportedAtUtc: '2026-12-02T03:00:00Z',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Return' }));
    await waitFor(() => expect(reportOperatorRefundReturn).toHaveBeenCalledWith(501, 'FT-998877'));
    expect(await screen.findByText('ReturnReported')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Confirm Return' })).toBeNull();
    expect(screen.getAllByText('FT-998877').length).toBeGreaterThan(0);
  });

  it('falls back to the generic retry message for an unrecognised error code', async () => {
    // refund.payment_not_verified was removed: UC-42 domain guarantees PendingOperatorConfirmation
    // refunds always come from a verified payment (UC-41 BR-143); unverified → Reconciliation directly.
    // Any unknown 4xx code (past or future) must degrade gracefully to the generic message.
    render(<ConfirmBookingRefundScreen refundId={501} />);
    await screen.findByRole('button', { name: 'Confirm Refund' });
    vi.mocked(confirmOperatorRefund).mockRejectedValueOnce(
      new RefundsOperatorError(409, 'refund.unknown_future_code', 'Some future error.'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Refund' }));
    expect(await screen.findByText(/could not be completed/i)).toBeTruthy();
    expect(screen.getByText('PendingOperatorConfirmation')).toBeTruthy(); // local status unchanged, no re-fetch on failure
  });

  it('maps refund.request_not_pending (409) to the "no longer pending" message', async () => {
    render(<ConfirmBookingRefundScreen refundId={501} />);
    await screen.findByRole('button', { name: 'Confirm Refund' });
    vi.mocked(confirmOperatorRefund).mockRejectedValueOnce(
      new RefundsOperatorError(409, 'refund.request_not_pending', 'Not pending.'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Refund' }));
    expect(await screen.findByText('This refund request is no longer pending your confirmation.')).toBeTruthy();
  });

  it('shows a generic retry message on a 500/persist failure', async () => {
    render(<ConfirmBookingRefundScreen refundId={501} />);
    await screen.findByRole('button', { name: 'Confirm Refund' });
    vi.mocked(confirmOperatorRefund).mockRejectedValueOnce(new RefundsOperatorError(500, 'refund.status_persist_failed', 'Failed.'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Refund' }));
    expect(await screen.findByText('The request could not be completed. Please try again.')).toBeTruthy();
  });

  it('redirects to sign-in on a 401 while loading', async () => {
    vi.mocked(fetchOperatorRefundDetail).mockRejectedValue(new RefundsOperatorError(401, undefined, 'Session expired.'));
    render(<ConfirmBookingRefundScreen refundId={501} />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith(expect.stringContaining('/sign-in')));
  });

  it('shows a forbidden message on a 403 while loading', async () => {
    vi.mocked(fetchOperatorRefundDetail).mockRejectedValue(new RefundsOperatorError(403, undefined, 'Forbidden.'));
    render(<ConfirmBookingRefundScreen refundId={501} />);
    expect(await screen.findByRole('alert')).toBeTruthy();
  });

  it('shows a retry affordance on an unavailable (network/5xx) load failure', async () => {
    vi.mocked(fetchOperatorRefundDetail).mockRejectedValueOnce(new RefundsOperatorError(503, undefined, 'Unavailable.'));
    render(<ConfirmBookingRefundScreen refundId={501} />);
    const retryButton = await screen.findByRole('button', { name: 'Retry' });
    vi.mocked(fetchOperatorRefundDetail).mockResolvedValueOnce(pending);
    fireEvent.click(retryButton);
    expect(await screen.findByText('PendingOperatorConfirmation')).toBeTruthy();
  });

  // U03: an earlier reload's response, resolving after a later reload already committed its own
  // result, must not overwrite that newer result.
  it('ignores a stale reload response superseded by a newer reload before it resolves', async () => {
    vi.mocked(fetchOperatorRefundDetail).mockReset().mockResolvedValueOnce(pending);
    let resolveSecondFetch: (value: RefundDetail) => void = () => {};
    vi.mocked(fetchOperatorRefundDetail).mockImplementationOnce(
      () => new Promise((resolve) => { resolveSecondFetch = resolve; }),
    );
    vi.mocked(fetchOperatorRefundDetail).mockResolvedValueOnce({ ...pending, status: 'ReturnReported' });

    render(<ConfirmBookingRefundScreen refundId={501} />);
    await screen.findByRole('button', { name: 'Confirm Refund' });

    // First action's own re-fetch (2nd call) is slow and stays pending.
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Refund' }));
    await waitFor(() => expect(confirmOperatorRefund).toHaveBeenCalledTimes(1));

    // Force a second reload while the first is still in flight, which resolves immediately.
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm Refund' }));
    await waitFor(() => expect(fetchOperatorRefundDetail).toHaveBeenCalledTimes(3));

    // The stale 2nd fetch now resolves late — it must not revert the screen.
    resolveSecondFetch({ ...pending, status: 'AwaitingPartnerReturn' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByText('ReturnReported')).toBeTruthy();
    expect(screen.queryByText('AwaitingPartnerReturn')).toBeNull();
  });
});
