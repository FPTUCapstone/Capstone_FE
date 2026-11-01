'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';

import {
  PAYOUT_MESSAGES,
  formatPeriodRange,
  formatRequestedAt,
  formatVnd,
  validatePeriodRange,
} from '../payout-records/payoutRecords';
import {
  SETTLEMENT_MESSAGES,
  SETTLEMENT_STATUSES,
  defaultSettlementSearch,
  formatSettlementStatus,
  parseSettlementSearch,
  serializeSettlementSearch,
  type SettlementQueue,
  type SettlementSearch,
  type SettlementStatus,
} from './payoutSettlement';
import { PayoutSettlementError, fetchSettlementQueue } from './payoutSettlementService';
import { Field, PageButton, StatusBadge, SummaryCard, inputClass } from './settlementUi';

type LoadState = 'loading' | 'ready' | 'forbidden' | 'invalid-request' | 'unavailable';

export function PayoutSettlementQueueScreen() {
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  return <QueueContent key={queryKey} queryKey={queryKey} />;
}

function QueueContent({ queryKey }: { queryKey: string }) {
  const { push, replace } = useRouter();
  const applied = useMemo(() => parseSettlementSearch(new URLSearchParams(queryKey)), [queryKey]);
  const [draft, setDraft] = useState<SettlementSearch>(applied);
  const [data, setData] = useState<SettlementQueue | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [invalidMessage, setInvalidMessage] = useState<string | null>(null);
  const [periodError, setPeriodError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchSettlementQueue(applied, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) { setData(response); setState('ready'); }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
        if (error instanceof PayoutSettlementError && error.status === 401) {
          replace(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.payoutSettlement)}`);
          return;
        }
        if (error instanceof PayoutSettlementError && error.status === 403) setState('forbidden');
        else if (error instanceof PayoutSettlementError && error.status === 400) {
          setInvalidMessage(error.errorMessage ?? null);
          setState('invalid-request');
        } else setState('unavailable');
      });
    return () => controller.abort();
  }, [applied, reloadKey, replace]);

  const reload = () => { setState('loading'); setData(null); setReloadKey((value) => value + 1); };

  const navigate = (next: SettlementSearch) => {
    const query = serializeSettlementSearch(next).toString();
    push(`${ROUTES.admin.payoutSettlement}${query ? `?${query}` : ''}`);
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

  const field = <K extends keyof SettlementSearch>(key: K, value: SettlementSearch[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#006b5f]">Financial governance</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#00152a]">Payout Settlement</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#486581]">
            Authorize approved payouts. The system then sends each transfer to the bank automatically.
          </p>
        </div>
        {state === 'ready' ? (
          <button
            type="button"
            onClick={reload}
            className="rounded-xl border border-[#9fb3c8] px-4 py-2 text-sm font-bold text-[#243b53] hover:bg-[#edf2f7]"
          >
            Refresh
          </button>
        ) : null}
      </header>

      {data ? (
        <section aria-label="Settlement summary" className="mb-6 grid gap-4 sm:grid-cols-2">
          <SummaryCard label="Records" value={data.totalCount} />
          <SummaryCard label="Total Net Payout" value={formatVnd(data.totalAmount)} />
        </section>
      ) : null}

      <form role="search" onSubmit={submit} className="mb-6 rounded-2xl border border-[#d7e2ef] bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Keyword">
            <input aria-label="Keyword" value={draft.keyword} maxLength={200} onChange={(e) => field('keyword', e.target.value)} className={inputClass} placeholder="Payout code or operator name" />
          </Field>
          <Field label="Status">
            <select aria-label="Status" value={draft.status} onChange={(e) => field('status', e.target.value as SettlementStatus)} className={inputClass}>
              {SETTLEMENT_STATUSES.map((status) => (
                <option key={status} value={status}>{formatSettlementStatus(status)}</option>
              ))}
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
          <button
            type="button"
            onClick={() => { const next = defaultSettlementSearch(); setDraft(next); setPeriodError(''); navigate(next); }}
            className="rounded-xl border border-[#9fb3c8] px-5 py-2.5 text-sm font-bold text-[#243b53] hover:bg-[#edf2f7]"
          >
            Clear
          </button>
        </div>
      </form>

      {state === 'loading' ? <div role="status" className="rounded-2xl border border-[#d7e2ef] bg-white p-8 text-center text-[#486581]">Loading settlement queue…</div> : null}
      {state === 'forbidden' ? <FeedbackAlert tone="error" title="Access denied">{SETTLEMENT_MESSAGES.forbidden}</FeedbackAlert> : null}
      {state === 'invalid-request' ? <FeedbackAlert tone="error" title="The settlement queue could not be retrieved with the submitted filters">{invalidMessage ?? SETTLEMENT_MESSAGES.unavailable}</FeedbackAlert> : null}
      {state === 'unavailable' ? (
        <FeedbackAlert tone="error" title="Unable to load the settlement queue">
          <p>{SETTLEMENT_MESSAGES.unavailable}</p>
          <button type="button" onClick={reload} className="mt-2 rounded-lg border border-current px-3 py-1 font-bold">Retry</button>
        </FeedbackAlert>
      ) : null}
      {state === 'ready' && data?.items.length === 0 ? <FeedbackAlert title="No payouts in this queue">{SETTLEMENT_MESSAGES.empty}</FeedbackAlert> : null}

      {state === 'ready' && data && data.items.length > 0 ? (
        <>
          <div className="max-w-full overflow-x-auto rounded-2xl border border-[#d7e2ef] bg-white shadow-sm" tabIndex={0} aria-label="Settlement queue table; scroll horizontally on small screens">
            <table className="min-w-[960px] w-full border-collapse text-left text-sm">
              <caption className="sr-only">Payouts for Administrator settlement</caption>
              <thead className="bg-[#00152a] text-xs uppercase tracking-wide text-white">
                <tr>{['Payout Code', 'Tour Operator', 'Settlement Period', 'Gross Revenue', 'Commission', 'Net Payout', 'Requested Date', 'Status', 'Action'].map((heading) => <th key={heading} scope="col" className="px-4 py-3">{heading}</th>)}</tr>
              </thead>
              <tbody>
                {data.items.map((payout) => {
                  const actionable = payout.status === 'ApprovedForSettlement';
                  const verb = actionable ? 'Review' : 'View';
                  return (
                    <tr key={payout.payoutId} className="border-t border-[#e6edf5]">
                      <td className="px-4 py-3 font-mono font-bold text-[#00152a]">{payout.payoutCode}</td>
                      <td className="px-4 py-3 font-medium">{payout.operator.companyName}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatPeriodRange(payout.periodStart, payout.periodEnd)}
                        {payout.periodCount > 1 ? (
                          <span className="ml-1.5 text-[11px] font-semibold text-slate-500">· {payout.periodCount} months</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{formatVnd(payout.grossRevenue)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{formatVnd(payout.commissionAmount)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-bold text-[#00152a]">{formatVnd(payout.netAmount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatRequestedAt(payout.requestedAtUtc)}</td>
                      <td className="px-4 py-3"><StatusBadge status={payout.status} /></td>
                      <td className="px-4 py-3">
                        <Link
                          href={ROUTES.admin.payoutSettlementDetails(payout.payoutId)}
                          aria-label={`${verb} for ${payout.payoutCode}`}
                          className="rounded-lg border border-[#9fb3c8] px-3 py-1.5 text-xs font-bold text-[#243b53] hover:bg-[#edf2f7]"
                        >
                          {verb}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-col gap-3 text-sm text-[#486581] sm:flex-row sm:items-center sm:justify-between">
            <p>{data.totalCount} payout record{data.totalCount === 1 ? '' : 's'} · Page {data.pageNumber} of {Math.max(data.totalPages, 1)}</p>
            <div className="flex gap-2">
              <PageButton disabled={data.pageNumber <= 1} onClick={() => navigate({ ...applied, pageNumber: data.pageNumber - 1 })}>Previous</PageButton>
              <PageButton disabled={data.pageNumber >= data.totalPages} onClick={() => navigate({ ...applied, pageNumber: data.pageNumber + 1 })}>Next</PageButton>
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}
