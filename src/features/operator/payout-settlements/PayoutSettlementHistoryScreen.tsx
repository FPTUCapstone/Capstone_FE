'use client';

import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { formatRunDate, formatVnd, type PayoutSettlementsResponse } from './payoutSettlements';
import { fetchOperatorPayoutSettlementHistory, OperatorPayoutSettlementsError } from './payoutSettlementsService';

type LoadState = 'loading' | 'ready' | 'forbidden' | 'unavailable';
const PAGE_SIZE = 20;

/**
 * PD-13 (Payout Settlement History, Table 4.2 row 91): a Tour Operator's own settlements,
 * read-only, per booking. Rendered inside `PartnerRouteGuard` (route="dashboard", same check the
 * bank-account page at `/partner/payouts` already uses), so only an Approved Tour Operator ever
 * reaches this component. No filters — the SRS's one-line description does not ask for any (spec
 * Open question 6, undecided; add them later if confirmed, reusing Screen 1's filter bar).
 */
export function PayoutSettlementHistoryScreen() {
  const { context } = useWebSession();
  const [data, setData] = useState<PayoutSettlementsResponse | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [pageNumber, setPageNumber] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchOperatorPayoutSettlementHistory(pageNumber, PAGE_SIZE, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setData(response);
          setState('ready');
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
        setState(error instanceof OperatorPayoutSettlementsError && error.status === 403 ? 'forbidden' : 'unavailable');
      });
    return () => controller.abort();
  }, [pageNumber, reloadToken]);

  // Defence-in-depth (plan Task 7): the backend already scopes this query to the signed-in
  // operator; never trust a row whose operator id differs from the session's own.
  const ownItems = data?.items.filter((item) => item.tourOperatorUserId === context?.userId) ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <section className="w-full text-[#1C2928]">
      <PageHeader
        className="mb-6"
        eyebrow="Payout Management"
        title="Payout Settlement History"
        description="Your scheduled and settled payouts, per booking."
      />

      {state === 'loading' ? (
        <div role="status" className={panel}>
          Loading payout settlement history…
        </div>
      ) : null}
      {state === 'forbidden' ? (
        <FeedbackAlert tone="error" title="Access denied">
          You do not have permission to access this function.
        </FeedbackAlert>
      ) : null}
      {state === 'unavailable' ? (
        <FeedbackAlert tone="error" title="Unable to load payout settlement history">
          <p>Please check your connection and try again.</p>
          <button
            type="button"
            onClick={() => {
              setState('loading');
              setReloadToken((value) => value + 1);
            }}
            className="mt-2 rounded-lg border border-current px-3 py-1 font-bold"
          >
            Retry
          </button>
        </FeedbackAlert>
      ) : null}
      {state === 'ready' && ownItems.length === 0 ? <FeedbackAlert>No payout settlements to show.</FeedbackAlert> : null}
      {state === 'ready' && ownItems.length > 0 ? (
        <>
          <div className="max-w-full overflow-x-auto rounded-2xl border border-[#DCE2DD] bg-white shadow-xs" tabIndex={0}>
            <table className="min-w-[800px] w-full text-left text-sm">
              <caption className="sr-only">Payout settlement history</caption>
              <thead className="border-b border-[#DCE2DD] bg-[#F7F5EF] text-xs font-bold uppercase tracking-wider text-[#5B6E69]">
                <tr>
                  {['Booking', 'Run Date', 'Kind', 'Payout Amount', 'Status', 'Transfer Reference'].map((heading) => (
                    <th key={heading} scope="col" className={`px-4 py-3${heading === 'Payout Amount' ? ' text-right' : ''}`}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ownItems.map((item) => (
                  <tr key={item.settlementId ?? `awaiting-${item.bookingId}-${item.kind}`} className="border-t border-[#ECEEEB] transition hover:bg-[#F7F5EF]/50">
                    <td className="px-4 py-3 font-mono font-bold text-[#1C2928]">{item.bookingId}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.runDate ? formatRunDate(item.runDate) : 'Not yet scheduled'}</td>
                    <td className="px-4 py-3">{item.kind}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap font-bold">{formatVnd(item.payoutAmount)}</td>
                    <td className="px-4 py-3">
                      <Badge>{item.status}</Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.transferReference ?? 'Not available'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="mt-4 flex flex-col gap-3 text-sm text-[#5B6E69] sm:flex-row sm:items-center sm:justify-between">
            <p>
              {data!.totalCount} settlement{data!.totalCount === 1 ? '' : 's'} · Page {data!.pageNumber} of {totalPages}
            </p>
            <div className="flex gap-2">
              <PageButton disabled={pageNumber <= 1} onClick={() => setPageNumber((value) => value - 1)}>
                Previous
              </PageButton>
              <PageButton disabled={pageNumber >= totalPages} onClick={() => setPageNumber((value) => value + 1)}>
                Next
              </PageButton>
            </div>
          </footer>
        </>
      ) : null}
    </section>
  );
}

const panel = 'rounded-2xl border border-[#DCE2DD] bg-white p-8 text-center text-[#5B6E69]';

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-full border border-[#CBE0D4] bg-[#E8F0EA] px-2.5 py-0.5 text-xs font-bold text-[#103B39]">{children}</span>;
}

function PageButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="rounded-xl border border-[#DCE2DD] bg-white px-4 py-2 text-xs font-bold text-[#1C2928] transition hover:bg-[#F7F5EF] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
