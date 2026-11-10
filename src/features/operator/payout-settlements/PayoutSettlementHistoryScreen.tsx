'use client';

import { useEffect, useState } from 'react';

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
    <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#006b5f]">Payout Management</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[#00152a]">Payout Settlement History</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#486581]">Your scheduled and settled payouts, per booking.</p>
      </header>

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
          <div className="max-w-full overflow-x-auto rounded-2xl border border-[#d7e2ef] bg-white shadow-sm" tabIndex={0}>
            <table className="min-w-[800px] w-full text-left text-sm">
              <caption className="sr-only">Payout settlement history</caption>
              <thead className="bg-[#00152a] text-xs uppercase tracking-wide text-white">
                <tr>
                  {['Booking', 'Run Date', 'Kind', 'Payout Amount', 'Status', 'Transfer Reference'].map((heading) => (
                    <th key={heading} scope="col" className="px-4 py-3">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ownItems.map((item) => (
                  <tr key={item.settlementId ?? `awaiting-${item.bookingId}-${item.kind}`} className="border-t border-[#e6edf5]">
                    <td className="px-4 py-3 font-mono font-bold text-[#00152a]">{item.bookingId}</td>
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
          <footer className="mt-4 flex flex-col gap-3 text-sm text-[#486581] sm:flex-row sm:items-center sm:justify-between">
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
    </main>
  );
}

const panel = 'rounded-2xl border border-[#d7e2ef] bg-white p-8 text-center text-[#486581]';

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-full bg-[#e6f7f0] px-2.5 py-1 text-xs font-bold text-[#085b3e]">{children}</span>;
}

function PageButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="rounded-xl border border-[#9fb3c8] px-4 py-2 text-sm font-bold text-[#243b53] hover:bg-[#edf2f7] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
