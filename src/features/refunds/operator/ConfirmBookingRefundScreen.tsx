'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';
import { formatDepartureDate, formatVietnamDateTime, formatVnd, validateReturnReference, type RefundDetail } from '../types/refundLifecycle';
import { confirmOperatorRefund, fetchOperatorRefundDetail, reportOperatorRefundReturn, RefundsOperatorError } from './refundsOperatorService';

type LoadState = 'loading' | 'ready' | 'forbidden' | 'unavailable';

/** UC-42: confirm the refund first. A transfer reference is required only for a non-zero operator
 * return share, and every action re-fetches the committed state. */
export function ConfirmBookingRefundScreen({ refundId }: { refundId: number }) {
  const { replace } = useRouter();
  const [detail, setDetail] = useState<RefundDetail | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [reloadToken, setReloadToken] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [returnReference, setReturnReference] = useState('');
  const [referenceInvalid, setReferenceInvalid] = useState(false);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchOperatorRefundDetail(refundId, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        setDetail(response);
        setState('ready');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
        if (error instanceof RefundsOperatorError && error.status === 401) {
          replace(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.partner.bookings)}`);
          return;
        }
        setState(error instanceof RefundsOperatorError && error.status === 403 ? 'forbidden' : 'unavailable');
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refundId, reloadToken]);

  function reload(message?: string) {
    setActionError(null);
    setSuccessMessage(message ?? null);
    setReloadToken((value) => value + 1);
  }

  function messageFor(error: unknown): string {
    if (error instanceof RefundsOperatorError) {
      if (error.errorCode === 'refund.request_not_pending') return 'This refund request is no longer pending your confirmation.';
      if (error.errorCode === 'refund.operator_not_owner') return 'You do not have permission to access this function.';
      if (error.errorCode === 'refund.return_reference_required') return 'A bank transfer reference is required.';
      if (error.errorCode === 'refund.payment_not_verified') return 'This refund is being reconciled by our team; no action is needed from you right now.';
    }
    return 'The request could not be completed. Please try again.';
  }

  async function handleConfirmRefund() {
    if (inFlight.current) return;
    inFlight.current = true;
    setConfirming(true);
    setActionError(null);
    try {
      await confirmOperatorRefund(refundId);
      reload('Refund confirmed. Submit the bank transfer reference after you have transferred the required amount to TripMate.');
    } catch (error) {
      setActionError(messageFor(error));
    } finally {
      inFlight.current = false;
      setConfirming(false);
    }
  }

  async function handleConfirmReturn(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;

    const validated = validateReturnReference(returnReference);
    if (!validated.ok) {
      setReferenceInvalid(true);
      return;
    }

    inFlight.current = true;
    setSubmittingReturn(true);
    setReferenceInvalid(false);
    setActionError(null);
    try {
      await reportOperatorRefundReturn(refundId, validated.value);
      reload('Bank transfer reference submitted successfully.');
    } catch (error) {
      setActionError(messageFor(error));
    } finally {
      inFlight.current = false;
      setSubmittingReturn(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#006b5f]">Booking Management</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[#00152a]">Confirm Booking Refund</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#486581]">
          Confirm the refund, then — if your return share is non-zero — report the bank transfer once you have paid TripMate back.
        </p>
      </header>

      {state === 'loading' ? <div role="status" className={panel}>Loading refund details…</div> : null}
      {state === 'forbidden' ? (
        <FeedbackAlert tone="error" title="Access denied">
          You do not have permission to access this function.
        </FeedbackAlert>
      ) : null}
      {state === 'unavailable' ? (
        <FeedbackAlert tone="error" title="Unable to load this refund request">
          <p>Please check your connection and try again.</p>
          <button type="button" onClick={() => reload()} className="mt-2 rounded-lg border border-current px-3 py-1 font-bold">
            Retry
          </button>
        </FeedbackAlert>
      ) : null}

      {state === 'ready' && detail ? <RefundDetailView detail={detail} /> : null}

      {successMessage ? (
        <div role="status" className="mt-4">
          <FeedbackAlert tone="success">{successMessage}</FeedbackAlert>
        </div>
      ) : null}
      {actionError ? (
        <div role="alert" className="mt-4">
          <FeedbackAlert tone="error">{actionError}</FeedbackAlert>
        </div>
      ) : null}

      {state === 'ready' && detail && detail.status === 'PendingOperatorConfirmation' ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" disabled={confirming} onClick={() => void handleConfirmRefund()} className={actionButton}>
            {confirming ? 'Confirming…' : 'Confirm Refund'}
          </button>
        </div>
      ) : null}

      {state === 'ready' && detail && detail.operatorReturnShare > 0 && detail.status !== 'PendingOperatorConfirmation' ? (
        <ReturnArea
          detail={detail}
          returnReference={returnReference}
          setReturnReference={setReturnReference}
          referenceInvalid={referenceInvalid}
          setReferenceInvalid={setReferenceInvalid}
          submitting={submittingReturn}
          onSubmit={handleConfirmReturn}
        />
      ) : null}

      <div className="mt-8 border-t border-[#e6edf5] pt-4">
        <a href={ROUTES.partner.bookings} className="text-sm font-bold text-[#006b5f]">
          ← Back
        </a>
      </div>
    </main>
  );
}

function RefundDetailView({ detail }: { detail: RefundDetail }) {
  return (
    <>
      <section className="mb-6 grid gap-4 rounded-2xl border border-[#d7e2ef] bg-white p-6 shadow-sm sm:grid-cols-3">
        <SummaryField label="Booking Code" value={detail.bookingCode} />
        <SummaryField label="Tour Name" value={detail.tourName} />
        <SummaryField label="Departure Date" value={formatDepartureDate(detail.departureDate)} />
        <SummaryField label="Paid Amount" value={formatVnd(detail.paidAmount)} />
        <SummaryField label="Cancellation / Complaint Reference" value={detail.referenceCode ?? 'Not available'} />
      </section>

      <section className="mb-6 grid gap-4 rounded-2xl border border-[#d7e2ef] bg-white p-6 shadow-sm sm:grid-cols-3">
        <SummaryField label="Refund Amount" value={formatVnd(detail.refundAmount)} />
        <SummaryField label="Tour Operator Share" value={formatVnd(detail.operatorReturnShare)} />
        <SummaryField label="Return Deadline" value={detail.returnDeadlineAtUtc ? formatVietnamDateTime(detail.returnDeadlineAtUtc) : 'Not applicable'} />
        <SummaryField label="Return Reference" value={detail.returnReference ?? 'Not reported yet'} />
        <SummaryField label="Status" value={<Badge status={detail.status} />} />
      </section>

      {detail.status === 'Reconciliation' ? (
        <FeedbackAlert tone="warning" title="Being reconciled">
          This refund is being reconciled by our team; no action is needed from you right now.
        </FeedbackAlert>
      ) : null}
    </>
  );
}

function ReturnArea({
  detail,
  returnReference,
  setReturnReference,
  referenceInvalid,
  setReferenceInvalid,
  submitting,
  onSubmit,
}: {
  detail: RefundDetail;
  returnReference: string;
  setReturnReference: (value: string) => void;
  referenceInvalid: boolean;
  setReferenceInvalid: (value: boolean) => void;
  submitting: boolean;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const editable = detail.status === 'AwaitingPartnerReturn';
  if (!editable) {
    return (
      <section className="mt-6 rounded-2xl border border-[#d7e2ef] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-[#627d98]">Bank Transfer Reference</p>
        <p className="mt-1 text-sm font-bold text-[#00152a]">{detail.returnReference ?? 'Not reported yet'}</p>
        {detail.returnReportedAtUtc ? (
          <p className="mt-1 text-xs text-[#486581]">Reported {formatVietnamDateTime(detail.returnReportedAtUtc)}</p>
        ) : null}
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 rounded-2xl border border-[#d7e2ef] bg-white p-6 shadow-sm">
      <label htmlFor="return-reference" className="block text-xs font-bold uppercase tracking-wide text-[#334e68]">
        Bank Transfer Reference
      </label>
      <input
        id="return-reference"
        type="text"
        value={returnReference}
        aria-invalid={referenceInvalid}
        aria-describedby={referenceInvalid ? 'return-reference-error' : undefined}
        onChange={(event) => {
          setReturnReference(event.target.value);
          if (referenceInvalid) setReferenceInvalid(false);
        }}
        className="mt-1 w-full rounded-xl border border-[#bcccdc] bg-white px-3 py-2.5 text-sm text-[#102a43] outline-none focus-visible:border-[#006b5f] focus-visible:ring-2 focus-visible:ring-[#71f8e4]/40"
      />
      {referenceInvalid ? (
        <p id="return-reference-error" role="alert" className="mt-2 text-xs font-semibold text-[#8c1030]">
          A bank transfer reference is required.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#006b5f] px-5 py-2 text-sm font-bold text-white hover:bg-[#005048] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Confirm Return'}
      </button>
    </form>
  );
}

const panel = 'rounded-2xl border border-[#d7e2ef] bg-white p-8 text-center text-[#486581]';
const actionButton = 'rounded-xl border border-[#006b5f] px-4 py-2 text-sm font-bold text-[#006b5f] hover:bg-[#e6f7f0] disabled:cursor-not-allowed disabled:opacity-50';
function SummaryField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-[#627d98]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#00152a]">{value}</p>
    </div>
  );
}

function Badge({ status }: { status: RefundDetail['status'] }) {
  return <span className="inline-flex rounded-full bg-[#e6f7f0] px-2.5 py-1 text-xs font-bold text-[#085b3e]">{status}</span>;
}
