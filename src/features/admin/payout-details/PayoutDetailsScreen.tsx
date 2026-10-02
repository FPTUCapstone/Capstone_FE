'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';
import {
  PAYOUT_DETAIL_MESSAGES,
  formatPeriodRange,
  formatRequestedAt,
  formatVnd,
  type PayoutDetail,
} from './payoutDetails';
import { PayoutDetailsError, fetchPayoutDetails } from './payoutDetailsService';

type LoadState = 'loading' | 'ready' | 'not-found' | 'forbidden' | 'invalid-request' | 'unavailable';

export function PayoutDetailsScreen({ payoutId }: { payoutId: string }) {
  const { replace } = useRouter();
  const [detail, setDetail] = useState<PayoutDetail | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [invalidMessage, setInvalidMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const load = useCallback((signal: AbortSignal) => {
    fetchPayoutDetails(payoutId, signal)
      .then((response) => {
        if (!signal.aborted) { setDetail(response); setState('ready'); }
      })
      .catch((error: unknown) => {
        if (signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
        if (error instanceof PayoutDetailsError && error.status === 401) {
          replace(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(`${ROUTES.admin.payouts}/${payoutId}`)}`);
          return;
        }
        if (error instanceof PayoutDetailsError && error.status === 404) setState('not-found');
        else if (error instanceof PayoutDetailsError && error.status === 403) setState('forbidden');
        else if (error instanceof PayoutDetailsError && error.status === 400) {
          setInvalidMessage(error.errorMessage ?? null);
          setState('invalid-request');
        }
        else setState('unavailable');
      });
  }, [replace, payoutId]);

  const retry = () => { setState('loading'); setDetail(null); setRetryKey((value) => value + 1); };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, retryKey]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <header className="mb-6">
        <Link
          href={ROUTES.admin.payouts}
          className="inline-flex items-center gap-1 text-sm font-bold text-[#006b5f] hover:underline"
        >
          ← Back to Payout Records
        </Link>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-[#006b5f]">Administrator finance</p>
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
        {detail ? <p className="mt-2 text-sm text-[#486581]">{detail.operator.companyName}</p> : null}
      </header>

      {state === 'loading' ? <div role="status" className="rounded-2xl border border-[#d7e2ef] bg-white p-8 text-center text-[#486581]">Loading payout details…</div> : null}
      {state === 'not-found' ? <FeedbackAlert tone="error" title="Payout unavailable">
        <p>{PAYOUT_DETAIL_MESSAGES.notFound}</p>
        <Link href={ROUTES.admin.payouts} className="mt-2 inline-block rounded-lg border border-current px-3 py-1 font-bold">Back to Payout Records</Link>
      </FeedbackAlert> : null}
      {state === 'forbidden' ? <FeedbackAlert tone="error" title="Access denied">{PAYOUT_DETAIL_MESSAGES.forbidden}</FeedbackAlert> : null}
      {state === 'invalid-request' ? <FeedbackAlert tone="error" title="The payout details could not be retrieved">{invalidMessage ?? PAYOUT_DETAIL_MESSAGES.unavailable}</FeedbackAlert> : null}
      {state === 'unavailable' ? <FeedbackAlert tone="error" title="Unable to load the payout details"><p>{PAYOUT_DETAIL_MESSAGES.unavailable}</p><button type="button" onClick={retry} className="mt-2 rounded-lg border border-current px-3 py-1 font-bold">Retry</button></FeedbackAlert> : null}

      {state === 'ready' && detail ? <DetailSections detail={detail} /> : null}
    </main>
  );
}

function DetailSections({ detail }: { detail: PayoutDetail }) {
  return (
    <div className="space-y-6">
      <section aria-label="Payout header" className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
        <SectionTitle>Payout Header</SectionTitle>
        <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <HeaderItem label="Tour Operator" value={detail.operator.companyName} />
          <HeaderItem label="Settlement Period" value={formatPeriodRange(detail.periodStart, detail.periodEnd)} />
          <HeaderItem label="Requested Date" value={formatRequestedAt(detail.requestedAtUtc)} />
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[#627d98]">Status</dt>
            <dd className="mt-1"><Badge alert={detail.status === 'Rejected'}>{detail.status}</Badge></dd>
          </div>
        </dl>
      </section>

      <section aria-label="Amount breakdown" className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
        <SectionTitle>Amount Breakdown</SectionTitle>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Gross Revenue" value={formatVnd(detail.grossRevenue)} />
          <SummaryCard label="Commission Rate" value={`${detail.commissionRate}%`} />
          <SummaryCard label="Commission Amount" value={formatVnd(detail.commissionAmount)} />
          <SummaryCard label="Net Payout Amount" value={formatVnd(detail.netAmount)} emphasized />
        </div>
      </section>

      <section aria-label="Contributing bookings" className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
        <SectionTitle>Contributing Bookings</SectionTitle>
        {detail.bookings.length === 0 ? <p className="mt-2 text-sm text-[#486581]">{PAYOUT_DETAIL_MESSAGES.empty}</p> :
        <div className="mt-3 max-w-full overflow-x-auto rounded-xl border border-[#e6edf5]" tabIndex={0} aria-label="Contributing bookings table; scroll horizontally on small screens">
          <table className="min-w-[760px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#f0f5fa] text-xs uppercase tracking-wide text-[#334e68]">
              <tr>{['Booking Code', 'Tour Name', 'Paid Amount', 'Refunded Amount', 'Net Amount'].map((heading) => <th key={heading} scope="col" className="px-4 py-3">{heading}</th>)}</tr>
            </thead>
            <tbody>{detail.bookings.map((booking) => <tr key={booking.bookingId} className="border-t border-[#e6edf5]">
              <td className="px-4 py-3 font-mono font-bold text-[#00152a]">{booking.bookingCode}</td>
              <td className="px-4 py-3 font-medium">{booking.tourName ?? 'Not available'}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">{formatVnd(booking.paidAmount)}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">{formatVnd(booking.refundedAmount)}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap font-bold text-[#00152a]">{formatVnd(booking.netAmount)}</td>
            </tr>)}</tbody>
          </table>
        </div>
        }
      </section>

      <section aria-label="Actions" className="flex flex-wrap gap-3">
        <button type="button" disabled title={PAYOUT_DETAIL_MESSAGES.confirmSettlementDisabled} aria-label={PAYOUT_DETAIL_MESSAGES.confirmSettlement} className="rounded-xl bg-[#006b5f] px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {PAYOUT_DETAIL_MESSAGES.confirmSettlement}
        </button>
        <button type="button" disabled title={PAYOUT_DETAIL_MESSAGES.exportStatementDisabled} aria-label={PAYOUT_DETAIL_MESSAGES.exportStatement} className="rounded-xl border border-[#9fb3c8] px-5 py-2.5 text-sm font-bold text-[#243b53] disabled:cursor-not-allowed disabled:opacity-50">
          {PAYOUT_DETAIL_MESSAGES.exportStatement}
        </button>
      </section>
    </div>
  );
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-sm font-bold uppercase tracking-wide text-[#334e68]">{children}</h2>
);

function HeaderItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-[#627d98]">{label}</dt>
      <dd className="mt-1 font-semibold text-[#102a43]">{value}</dd>
    </div>
  );
}

function SummaryCard({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${emphasized ? 'border-[#7fe3d4] bg-[#f0fbf8]' : 'border-[#e6edf5]'}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-[#627d98]">{label}</p>
      <p className={`mt-1 text-lg font-extrabold ${emphasized ? 'text-[#085b3e]' : 'text-[#00152a]'}`}>{value}</p>
    </div>
  );
}

function Badge({ children, alert = false }: { children: React.ReactNode; alert?: boolean }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${alert ? 'bg-[#fdecef] text-[#8c1030]' : 'bg-[#e6f7f0] text-[#085b3e]'}`}>{children}</span>;
}
