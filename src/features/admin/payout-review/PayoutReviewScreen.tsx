'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';

import { formatPeriodRange, formatRequestedAt, formatVnd } from '../payout-records/payoutRecords';
import { PayoutApproveDialog } from './PayoutApproveDialog';
import {
  formatCommissionRate,
  isReviewable,
  type PayoutDetail,
} from './payoutReview';
import { PayoutReviewError, fetchPayoutDetail } from './payoutReviewService';
import { PayoutRejectDialog } from './PayoutRejectDialog';

const MESSAGES = {
  notFound: 'The requested payout record was not found.',
  forbidden: 'You do not have permission to access this function.',
  unavailable: 'TripMate is temporarily unable to process your request. Please check your connection and try again.',
  empty: 'No data is available for the selected criteria.',
  notAvailable: 'Not available',
} as const;

type LoadState = 'loading' | 'ready' | 'not-found' | 'forbidden' | 'unavailable';
type DialogState = 'none' | 'approve' | 'reject';

export function PayoutReviewScreen({ payoutId }: { payoutId: string }) {
  const { replace } = useRouter();
  const [detail, setDetail] = useState<PayoutDetail | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [retryKey, setRetryKey] = useState(0);
  const [dialog, setDialog] = useState<DialogState>('none');
  const [toast, setToast] = useState<{ tone: 'success' | 'warning'; message: string } | null>(null);

  const refreshDetail = useCallback((signal?: AbortSignal) => fetchPayoutDetail(payoutId, signal)
    .then((response) => {
      if (!signal?.aborted) setDetail(response);
      if (!signal?.aborted) setState('ready');
    })
    .catch((error: unknown) => {
      if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
      if (error instanceof PayoutReviewError && error.status === 401) {
        replace(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.payoutDetails(payoutId))}`);
        return;
      }
      if (error instanceof PayoutReviewError && error.status === 404) setState('not-found');
      else if (error instanceof PayoutReviewError && error.status === 403) setState('forbidden');
      else setState('unavailable');
    }), [payoutId, replace]);

  useEffect(() => {
    const controller = new AbortController();
    refreshDetail(controller.signal);
    return () => controller.abort();
  }, [refreshDetail, retryKey]);

  const retry = () => { setState('loading'); setDetail(null); setRetryKey((value) => value + 1); };

  const onApproved = () => {
    setDialog('none');
    setToast({ tone: 'success', message: 'The payout request was approved and moved to the settlement queue.' });
    void refreshDetail();
  };

  const onRejected = () => {
    setDialog('none');
    setToast({ tone: 'success', message: 'The payout request was rejected.' });
    void refreshDetail();
  };

  const onConflict = () => {
    setDialog('none');
    setToast({ tone: 'warning', message: 'This request is no longer pending review. The latest status has been reloaded.' });
    void refreshDetail();
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
      <header className="mb-6">
        <Link
          href={ROUTES.admin.payouts}
          className="inline-flex items-center gap-1 text-sm font-bold text-[#006b5f] hover:underline"
        >
          ← Back to Payout Records
        </Link>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-[#006b5f]">Staff finance</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-extrabold text-[#00152a]">{detail?.payoutCode ?? `PO-${payoutId}`}</h1>
          {detail ? <Badge alert={detail.status === 'Rejected'}>{detail.status}</Badge> : null}
          {state === 'ready' ? (
            <button
              type="button"
              onClick={retry}
              className="ml-auto rounded-xl border border-[#9fb3c8] px-4 py-2 text-sm font-bold text-[#243b53] hover:bg-[#edf2f7]"
            >
              Refresh
            </button>
          ) : null}
        </div>
        {detail ? (
          <p className="mt-2 text-sm text-[#486581]">
            {detail.tourOperator.companyName} · {formatPeriodRange(detail.settlementPeriod.startDate, detail.settlementPeriod.endDate)}
          </p>
        ) : null}
      </header>

      {toast ? <div className="mb-4"><FeedbackAlert tone={toast.tone}>{toast.message}</FeedbackAlert></div> : null}

      {state === 'loading' ? <div role="status" className="rounded-2xl border border-[#d7e2ef] bg-white p-8 text-center text-[#486581]">Loading payout details…</div> : null}
      {state === 'not-found' ? <FeedbackAlert tone="error" title="Payout unavailable">{MESSAGES.notFound}</FeedbackAlert> : null}
      {state === 'forbidden' ? <FeedbackAlert tone="error" title="Access denied">{MESSAGES.forbidden}</FeedbackAlert> : null}
      {state === 'unavailable' ? (
        <FeedbackAlert tone="error" title="Unable to load the payout details">
          <p>{MESSAGES.unavailable}</p>
          <button type="button" onClick={retry} className="mt-2 rounded-lg border border-current px-3 py-1 font-bold">Retry</button>
        </FeedbackAlert>
      ) : null}

      {state === 'ready' && detail ? <PayoutDetailSections
        detail={detail}
        onApprove={() => setDialog('approve')}
        onReject={() => setDialog('reject')}
      /> : null}

      <PayoutApproveDialog
        open={dialog === 'approve'}
        payoutId={payoutId}
        payoutCode={detail?.payoutCode ?? `PO-${payoutId}`}
        netPayoutAmount={detail?.netPayoutAmount ?? 0}
        onClose={() => setDialog('none')}
        onApproved={onApproved}
        onConflict={onConflict}
      />
      <PayoutRejectDialog
        open={dialog === 'reject'}
        payoutId={payoutId}
        payoutCode={detail?.payoutCode ?? `PO-${payoutId}`}
        onClose={() => setDialog('none')}
        onRejected={onRejected}
        onConflict={onConflict}
      />
    </main>
  );
}

function PayoutDetailSections({
  detail, onApprove, onReject,
}: { detail: PayoutDetail; onApprove: () => void; onReject: () => void }) {
  const reviewable = isReviewable(detail.status);

  return (
    <div className="space-y-6">
      <section aria-label="Amount breakdown" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard label="Gross Revenue" value={formatVnd(detail.grossRevenue)} />
        <StatusCard label="Commission" value={`${formatVnd(detail.commissionAmount)} (${formatCommissionRate(detail.commissionRate)})`} />
        <StatusCard label="Net Payout" value={formatVnd(detail.netPayoutAmount)} />
        <StatusCard label="Requested" value={formatRequestedAt(detail.requestedAtUtc)} />
      </section>

      {reviewable ? (
        <section aria-label="Review actions" className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#486581]">This request is pending Staff review.</p>
          <div className="ml-auto flex gap-3">
            <button
              type="button"
              onClick={onReject}
              className="min-h-11 rounded-xl border border-[#ba1a1a] px-4 text-sm font-bold text-[#ba1a1a] hover:bg-[#fdecef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ba1a1a]"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={onApprove}
              className="min-h-11 rounded-xl bg-[#006b5f] px-4 text-sm font-bold text-white hover:bg-[#005048] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006b5f]"
            >
              Approve
            </button>
          </div>
        </section>
      ) : (
        <section aria-label="Review actions" className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#486581]">
            This request is <strong className="text-[#00152a]">{detail.status}</strong> and can no longer be approved or rejected here.
          </p>
          {detail.rejectionReason ? (
            <p className="mt-2 min-w-0 whitespace-pre-wrap break-words text-sm text-[#486581]">
              Reason: {detail.rejectionReason}
            </p>
          ) : null}
        </section>
      )}

      <section aria-label="Contributing bookings" className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
        <SectionTitle>Contributing Bookings</SectionTitle>
        {detail.contributingBookings.length === 0 ? (
          <p className="mt-2 text-sm text-[#486581]">{MESSAGES.empty}</p>
        ) : (
          <ScrollableTable label="Contributing bookings table" headings={['Booking Code', 'Tour Name', 'Completed', 'Paid', 'Refunded', 'Net']}>
            {detail.contributingBookings.map((booking) => (
              <tr key={booking.bookingId} className="border-t border-[#e6edf5]">
                <td className="px-4 py-3 font-mono">{booking.bookingCode}</td>
                <td className="px-4 py-3 font-medium">{booking.tourName}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatRequestedAt(booking.completedAtUtc)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">{formatVnd(booking.paidAmount)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">{formatVnd(booking.refundedAmount)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap font-bold">{formatVnd(booking.netAmount)}</td>
              </tr>
            ))}
          </ScrollableTable>
        )}
      </section>

      <section aria-label="Beneficiary bank information" className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
        <SectionTitle>Beneficiary</SectionTitle>
        {detail.beneficiary.maskedAccountNumber === null ? (
          <p className="mt-2 text-sm text-[#486581]">{MESSAGES.notAvailable}</p>
        ) : (
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-[#627d98]">Bank Name</dt>
              <dd className="mt-1 text-sm text-[#102a43]">{detail.beneficiary.bankName}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-[#627d98]">Account Holder</dt>
              <dd className="mt-1 text-sm text-[#102a43]">{detail.beneficiary.accountHolder}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-[#627d98]">Account Number</dt>
              <dd className="mt-1 font-mono text-sm text-[#102a43]">{detail.beneficiary.maskedAccountNumber}</dd>
            </div>
          </dl>
        )}
      </section>
    </div>
  );
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-sm font-bold uppercase tracking-wide text-[#334e68]">{children}</h2>
);

const StatusCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
    <p className="text-xs font-bold uppercase tracking-wide text-[#627d98]">{label}</p>
    <p className="mt-2 text-lg font-extrabold text-[#00152a]">{value}</p>
  </div>
);

const Badge = ({ children, alert = false }: { children: React.ReactNode; alert?: boolean }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${alert ? 'bg-[#fdecef] text-[#8c1030]' : 'bg-[#e6f7f0] text-[#085b3e]'}`}>{children}</span>
);

const ScrollableTable = ({
  label, headings, children,
}: { label: string; headings: string[]; children: React.ReactNode }) => (
  <div className="mt-3 max-w-full overflow-x-auto rounded-xl border border-[#e6edf5]" tabIndex={0} aria-label={`${label}; scroll horizontally on small screens`}>
    <table className="min-w-[640px] w-full border-collapse text-left text-sm">
      <thead className="bg-[#f0f5fa] text-xs uppercase tracking-wide text-[#334e68]">
        <tr>{headings.map((heading) => <th key={heading} scope="col" className="px-4 py-3">{heading}</th>)}</tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);
