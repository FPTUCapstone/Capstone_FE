'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';
import {
  PAYOUT_MESSAGES,
  PAYOUT_STATUSES,
  defaultPayoutsSearch,
  formatPeriodRange,
  formatRequestedAt,
  formatVnd,
  parsePayoutsSearch,
  serializePayoutsSearch,
  validatePeriodRange,
  type PayoutsResponse,
  type PayoutsSearch,
} from './payoutRecords';
import { PayoutRecordsError, fetchPayoutRecords } from './payoutRecordsService';

type LoadState = 'loading' | 'ready' | 'forbidden' | 'invalid-request' | 'unavailable';

export function PayoutRecordsScreen() {
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  return <PayoutRecordsContent key={queryKey} queryKey={queryKey} />;
}

function PayoutRecordsContent({ queryKey }: { queryKey: string }) {
  const { push, replace } = useRouter();
  const applied = useMemo(() => parsePayoutsSearch(new URLSearchParams(queryKey)), [queryKey]);
  const [draft, setDraft] = useState<PayoutsSearch>(applied);
  const [data, setData] = useState<PayoutsResponse | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [invalidMessage, setInvalidMessage] = useState<string | null>(null);
  const [periodError, setPeriodError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchPayoutRecords(applied, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) { setData(response); setState('ready'); }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
        if (error instanceof PayoutRecordsError && error.status === 401) {
          replace(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.payouts)}`);
          return;
        }
        if (error instanceof PayoutRecordsError && error.status === 403) setState('forbidden');
        else if (error instanceof PayoutRecordsError && error.status === 400) {
          setInvalidMessage(error.errorMessage ?? null);
          setState('invalid-request');
        }
        else setState('unavailable');
      });
    return () => controller.abort();
  }, [applied, retryKey, replace]);

  const navigate = (next: PayoutsSearch) => {
    const query = serializePayoutsSearch(next).toString();
    push(`${ROUTES.admin.payouts}${query ? `?${query}` : ''}`);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validatePeriodRange(draft.periodFrom, draft.periodTo)) {
      setPeriodError(PAYOUT_MESSAGES.invalidRange);
      return;
    }
    setPeriodError('');
    navigate({ ...draft, keyword: draft.keyword.trim(), pageNumber: 1 });
  };

  const field = <K extends keyof PayoutsSearch>(key: K, value: PayoutsSearch[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#006b5f]">Administrator finance</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[#00152a]">Payout Records</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#486581]">Review backend-calculated payout records for Tour Operators. Amounts are read-only.</p>
      </header>

      {data ? <section aria-label="Payout summary" className="mb-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Pending Requests" value={data.summary.pendingRequests} alert={data.summary.pendingRequests > 0} />
        <SummaryCard label="Total Requested Amount" value={formatVnd(data.summary.totalRequestedAmount)} />
        <SummaryCard label="Total Confirmed Amount" value={formatVnd(data.summary.totalConfirmedAmount)} />
      </section> : null}

      <form role="search" onSubmit={submit} className="mb-6 rounded-2xl border border-[#d7e2ef] bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Keyword">
            <input aria-label="Keyword" value={draft.keyword} maxLength={200} onChange={(e) => field('keyword', e.target.value)} className={inputClass} placeholder="Payout code or operator name" />
          </Field>
          <Field label="Status">
            <select aria-label="Status" value={draft.status} onChange={(e) => field('status', e.target.value as PayoutsSearch['status'])} className={inputClass}>
              <option value="">All</option>
              {PAYOUT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </Field>
          <Field label="Period From">
            <input aria-label="Period From" aria-describedby={periodError ? 'period-error' : undefined} type="date" value={draft.periodFrom} onChange={(e) => field('periodFrom', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Period To">
            <input aria-label="Period To" aria-describedby={periodError ? 'period-error' : undefined} type="date" value={draft.periodTo} onChange={(e) => field('periodTo', e.target.value)} className={inputClass} />
          </Field>
        </div>
        {periodError ? <p id="period-error" role="alert" className="mt-3 text-sm font-semibold text-[#8c1030]">{periodError}</p> : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="submit" className="rounded-xl bg-[#006b5f] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#005048]">Apply Filters</button>
          <button type="button" onClick={() => { const next = defaultPayoutsSearch(); setDraft(next); setPeriodError(''); navigate(next); }} className="rounded-xl border border-[#9fb3c8] px-5 py-2.5 text-sm font-bold text-[#243b53] hover:bg-[#edf2f7]">Clear</button>
        </div>
      </form>

      {state === 'loading' ? <div role="status" className="rounded-2xl border border-[#d7e2ef] bg-white p-8 text-center text-[#486581]">Loading payout records…</div> : null}
      {state === 'forbidden' ? <FeedbackAlert tone="error" title="Access denied">{PAYOUT_MESSAGES.forbidden}</FeedbackAlert> : null}
      {state === 'invalid-request' ? <FeedbackAlert tone="error" title="The payout records could not be retrieved with the submitted filters">{invalidMessage ?? PAYOUT_MESSAGES.unavailable}</FeedbackAlert> : null}
      {state === 'unavailable' ? <FeedbackAlert tone="error" title="Unable to load payout records"><p>{PAYOUT_MESSAGES.unavailable}</p><button type="button" onClick={() => { setState('loading'); setData(null); setRetryKey((value) => value + 1); }} className="mt-2 rounded-lg border border-current px-3 py-1 font-bold">Retry</button></FeedbackAlert> : null}
      {state === 'ready' && data?.items.length === 0 ? <FeedbackAlert title="No payout records">{PAYOUT_MESSAGES.empty}</FeedbackAlert> : null}

      {state === 'ready' && data && data.items.length > 0 ? <>
        <div className="max-w-full overflow-x-auto rounded-2xl border border-[#d7e2ef] bg-white shadow-sm" tabIndex={0} aria-label="Payout records table; scroll horizontally on small screens">
          <table className="min-w-[1120px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#00152a] text-xs uppercase tracking-wide text-white">
              <tr>{['Payout Code', 'Tour Operator', 'Settlement Period', 'Gross Revenue', 'Commission', 'Net Payout', 'Requested Date', 'Status', 'Action'].map((heading) => <th key={heading} scope="col" className="px-4 py-3">{heading}</th>)}</tr>
            </thead>
            <tbody>{data.items.map((payout) => <tr key={payout.payoutId} className="border-t border-[#e6edf5]">
              <td className="px-4 py-3 font-mono font-bold text-[#00152a]">{payout.payoutCode}</td>
              <td className="px-4 py-3 font-medium">{payout.operator.companyName}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatPeriodRange(payout.periodStart, payout.periodEnd)}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">{formatVnd(payout.grossRevenue)}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">{formatVnd(payout.commissionAmount)}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap font-bold text-[#00152a]">{formatVnd(payout.netAmount)}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatRequestedAt(payout.requestedAtUtc)}</td>
              <td className="px-4 py-3"><Badge alert={payout.status === 'Rejected'}>{payout.status}</Badge></td>
              <td className="px-4 py-3">
                <button type="button" disabled title={PAYOUT_MESSAGES.viewDetailsDisabled} aria-label={`${PAYOUT_MESSAGES.viewDetails} for ${payout.payoutCode}`} className="rounded-lg border border-[#9fb3c8] px-3 py-1.5 text-xs font-bold text-[#64748b] disabled:cursor-not-allowed disabled:opacity-50">
                  {PAYOUT_MESSAGES.viewDetails}
                </button>
              </td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-col gap-3 text-sm text-[#486581] sm:flex-row sm:items-center sm:justify-between">
          <p>{data.totalCount} payout record{data.totalCount === 1 ? '' : 's'} · Page {data.pageNumber} of {Math.max(data.totalPages, 1)}</p>
          <div className="flex gap-2">
            <PageButton disabled={data.pageNumber <= 1} onClick={() => navigate({ ...applied, pageNumber: data.pageNumber - 1 })}>Previous</PageButton>
            <PageButton disabled={data.pageNumber >= data.totalPages} onClick={() => navigate({ ...applied, pageNumber: data.pageNumber + 1 })}>Next</PageButton>
          </div>
        </div>
      </> : null}
    </main>
  );
}

const inputClass = 'mt-1 w-full rounded-xl border border-[#bcccdc] bg-white px-3 py-2.5 text-sm text-[#102a43] outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#71f8e4]/40';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-xs font-bold uppercase tracking-wide text-[#334e68]">{label}{children}</label>;
}

function SummaryCard({ label, value, alert = false }: { label: string; value: string | number; alert?: boolean }) {
  return <div className={`rounded-2xl border bg-white p-5 shadow-sm ${alert ? 'border-[#f3a79d]' : 'border-[#d7e2ef]'}`}>
    <p className="text-xs font-bold uppercase tracking-wide text-[#627d98]">{label}</p>
    <p className={`mt-2 text-2xl font-extrabold ${alert ? 'text-[#b42318]' : 'text-[#00152a]'}`}>{value}</p>
  </div>;
}

function Badge({ children, alert = false }: { children: React.ReactNode; alert?: boolean }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${alert ? 'bg-[#fdecef] text-[#8c1030]' : 'bg-[#e6f7f0] text-[#085b3e]'}`}>{children}</span>;
}

function PageButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className="rounded-lg border border-[#9fb3c8] px-4 py-2 font-bold text-[#243b53] disabled:cursor-not-allowed disabled:opacity-40">{children}</button>;
}
