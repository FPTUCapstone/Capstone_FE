'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';
import {
  defaultPayoutSettlementsSearch,
  formatRunDate,
  formatVnd,
  parsePayoutSettlementsSearch,
  PAYOUT_SETTLEMENT_STATUSES,
  serializePayoutSettlementsSearch,
  validRunDateRange,
  type PayoutSettlementsResponse,
  type PayoutSettlementsSearch,
} from './payoutSettlements';
import { fetchPayoutSettlements, PayoutSettlementsError } from './payoutSettlementsService';

type LoadState = 'loading' | 'ready' | 'forbidden' | 'unavailable';
type ViewerRole = 'Staff' | 'Administrator';

/** UC-72 (SRS v12 §3.9.9.1). `viewerRole` decides whether a `SettlementFailed` row links to
 * Screen 2 (UC-73) — Administrator only; Staff sees the row with no link, per the spec's
 * read-only access for that role. */
export function PayoutSettlementsScreen({ viewerRole }: { viewerRole: ViewerRole }) {
  const params = useSearchParams();
  const key = params.toString();
  return <PayoutSettlementsContent key={key} queryKey={key} viewerRole={viewerRole} />;
}

function PayoutSettlementsContent({ queryKey, viewerRole }: { queryKey: string; viewerRole: ViewerRole }) {
  const { push, replace } = useRouter();
  const applied = useMemo(() => parsePayoutSettlementsSearch(new URLSearchParams(queryKey)), [queryKey]);
  const [draft, setDraft] = useState<PayoutSettlementsSearch>(applied);
  const [data, setData] = useState<PayoutSettlementsResponse | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [rangeError, setRangeError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchPayoutSettlements(
      {
        status: applied.status || undefined,
        runDateFrom: applied.runDateFrom || undefined,
        runDateTo: applied.runDateTo || undefined,
        pageNumber: applied.pageNumber,
      },
      controller.signal,
    )
      .then((response) => {
        if (!controller.signal.aborted) {
          setData(response);
          setState('ready');
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
        if (error instanceof PayoutSettlementsError && error.status === 401) {
          replace(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.payoutSettlements)}`);
          return;
        }
        setState(error instanceof PayoutSettlementsError && error.status === 403 ? 'forbidden' : 'unavailable');
      });
    return () => controller.abort();
  }, [applied, replace, retry]);

  const navigate = (next: PayoutSettlementsSearch) => {
    const query = serializePayoutSettlementsSearch(next).toString();
    push(`${ROUTES.admin.payoutSettlements}${query ? `?${query}` : ''}`);
  };

  const field = <K extends keyof PayoutSettlementsSearch>(key: K, value: PayoutSettlementsSearch[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validRunDateRange(draft.runDateFrom, draft.runDateTo)) {
      setRangeError('Run Date To must be on or after Run Date From.');
      return;
    }
    setRangeError('');
    navigate({ ...draft, pageNumber: 1 });
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#006b5f]">Payout Management</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[#00152a]">Payout Settlements</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#486581]">
          View scheduled and completed settlements per booking. Read-only — amounts and statuses are never computed in the browser.
        </p>
      </header>

      <form role="search" onSubmit={submit} className="mb-6 rounded-2xl border border-[#d7e2ef] bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Status">
            <select
              aria-label="Status"
              value={draft.status}
              onChange={(event) => field('status', event.target.value as PayoutSettlementsSearch['status'])}
              className={inputClass}
            >
              <option value="">All statuses</option>
              {PAYOUT_SETTLEMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Run Date From">
            <input
              aria-label="Run Date From"
              aria-invalid={Boolean(rangeError)}
              type="date"
              value={draft.runDateFrom}
              onChange={(event) => field('runDateFrom', event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Run Date To">
            <input
              aria-label="Run Date To"
              aria-invalid={Boolean(rangeError)}
              type="date"
              value={draft.runDateTo}
              onChange={(event) => field('runDateTo', event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        {rangeError ? (
          <p role="alert" className="mt-3 text-sm font-semibold text-[#8c1030]">
            {rangeError}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="submit" className={primaryButton}>
            Apply Filter
          </button>
          <button
            type="button"
            onClick={() => {
              const next = defaultPayoutSettlementsSearch();
              setDraft(next);
              setRangeError('');
              navigate(next);
            }}
            className={secondaryButton}
          >
            Clear Filter
          </button>
        </div>
      </form>

      {state === 'loading' ? (
        <div role="status" className={panel}>
          Loading payout settlements…
        </div>
      ) : null}
      {state === 'forbidden' ? (
        <FeedbackAlert tone="error" title="Access denied">
          You do not have permission to access this function.
        </FeedbackAlert>
      ) : null}
      {state === 'unavailable' ? (
        <FeedbackAlert tone="error" title="Unable to load payout settlements">
          <p>Please check your connection and try again.</p>
          <button
            type="button"
            onClick={() => {
              setState('loading');
              setRetry((value) => value + 1);
            }}
            className="mt-2 rounded-lg border border-current px-3 py-1 font-bold"
          >
            Retry
          </button>
        </FeedbackAlert>
      ) : null}
      {state === 'ready' && data?.items.length === 0 ? <FeedbackAlert>No payout settlements match the filters</FeedbackAlert> : null}
      {state === 'ready' && data && data.items.length > 0 ? (
        <>
          <div className="max-w-full overflow-x-auto rounded-2xl border border-[#d7e2ef] bg-white shadow-sm" tabIndex={0}>
            <table className="min-w-[1100px] w-full text-left text-sm">
              <caption className="sr-only">Payout settlements</caption>
              <thead className="bg-[#00152a] text-xs uppercase tracking-wide text-white">
                <tr>
                  {['Booking', 'Tour Operator', 'Run Date', 'Kind', 'Payout Amount', 'Status', 'Transfer Reference', 'Actions'].map((heading) => (
                    <th key={heading} scope="col" className="px-4 py-3">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.settlementId ?? `awaiting-${item.bookingId}-${item.kind}`} className="border-t border-[#e6edf5]">
                    <td className="px-4 py-3 font-mono font-bold text-[#00152a]">{item.bookingId}</td>
                    <td className="px-4 py-3">{item.tourOperatorUserId}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.runDate ? formatRunDate(item.runDate) : 'Not yet scheduled'}</td>
                    <td className="px-4 py-3">{item.kind}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap font-bold">{formatVnd(item.payoutAmount)}</td>
                    <td className="px-4 py-3">
                      <Badge>{item.status}</Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.transferReference ?? 'Not available'}</td>
                    <td className="px-4 py-3">
                      {item.status === 'SettlementFailed' && viewerRole === 'Administrator' ? (
                        <Link
                          href={ROUTES.admin.payoutSettlementDetail(item.batchId!)}
                          className="inline-flex whitespace-nowrap rounded-lg border border-[#006b5f] px-3 py-2 font-bold text-[#006b5f] hover:bg-[#e6f7f0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006b5f]"
                        >
                          View Details
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="mt-4 flex flex-col gap-3 text-sm text-[#486581] sm:flex-row sm:items-center sm:justify-between">
            <p>
              {data.totalCount} settlement{data.totalCount === 1 ? '' : 's'} · Page {data.pageNumber} of {totalPages}
            </p>
            <div className="flex gap-2">
              <PageButton disabled={data.pageNumber <= 1} onClick={() => navigate({ ...applied, pageNumber: data.pageNumber - 1 })}>
                Previous
              </PageButton>
              <PageButton disabled={data.pageNumber >= totalPages} onClick={() => navigate({ ...applied, pageNumber: data.pageNumber + 1 })}>
                Next
              </PageButton>
            </div>
          </footer>
        </>
      ) : null}
    </main>
  );
}

const inputClass =
  'mt-1 w-full rounded-xl border border-[#bcccdc] bg-white px-3 py-2.5 text-sm text-[#102a43] outline-none focus-visible:border-[#006b5f] focus-visible:ring-2 focus-visible:ring-[#71f8e4]/40';
const primaryButton = 'rounded-xl bg-[#006b5f] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#005048]';
const secondaryButton = 'rounded-xl border border-[#9fb3c8] px-4 py-2 text-sm font-bold text-[#243b53] hover:bg-[#edf2f7] disabled:cursor-not-allowed disabled:opacity-40';
const panel = 'rounded-2xl border border-[#d7e2ef] bg-white p-8 text-center text-[#486581]';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-xs font-bold uppercase tracking-wide text-[#334e68]">
      {label}
      {children}
    </label>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-full bg-[#e6f7f0] px-2.5 py-1 text-xs font-bold text-[#085b3e]">{children}</span>;
}

function PageButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props} className={secondaryButton}>
      {children}
    </button>
  );
}
