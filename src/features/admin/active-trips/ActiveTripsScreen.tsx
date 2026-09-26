'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';
import {
  ACTIVE_TRIPS_MESSAGES,
  defaultActiveTripsSearch,
  formatVietnamDateTime,
  getVietnamTodayDate,
  parseActiveTripsSearch,
  serializeActiveTripsSearch,
  validateDateRange,
  type ActiveTripsResponse,
  type ActiveTripsSearch,
} from './activeTrips';
import { ActiveTripsError, fetchActiveTrips } from './activeTripsService';

type LoadState = 'loading' | 'ready' | 'forbidden' | 'unavailable';

export function ActiveTripsScreen() {
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  return <ActiveTripsContent key={queryKey} queryKey={queryKey} />;
}

function ActiveTripsContent({ queryKey }: { queryKey: string }) {
  const { push, replace } = useRouter();
  const applied = useMemo(() => parseActiveTripsSearch(new URLSearchParams(queryKey)), [queryKey]);
  const [draft, setDraft] = useState<ActiveTripsSearch>(applied);
  const [data, setData] = useState<ActiveTripsResponse | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [dateError, setDateError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const maximumStartDate = useMemo(() => getVietnamTodayDate(), []);

  useEffect(() => {
    const controller = new AbortController();
    fetchActiveTrips(applied, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) { setData(response); setState('ready'); }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
        if (error instanceof ActiveTripsError && error.status === 401) {
          replace(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.activeTrips)}`);
          return;
        }
        setState(error instanceof ActiveTripsError && error.status === 403 ? 'forbidden' : 'unavailable');
      });
    return () => controller.abort();
  }, [applied, retryKey, replace]);

  const navigate = (next: ActiveTripsSearch) => {
    const query = serializeActiveTripsSearch(next).toString();
    push(`${ROUTES.admin.activeTrips}${query ? `?${query}` : ''}`);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateDateRange(draft.startDateFrom, draft.startDateTo)) {
      setDateError(ACTIVE_TRIPS_MESSAGES.invalidDates);
      return;
    }
    setDateError('');
    navigate({ ...draft, keyword: draft.keyword.trim(), destination: draft.destination.trim(), pageNumber: 1 });
  };

  const field = <K extends keyof ActiveTripsSearch>(key: K, value: ActiveTripsSearch[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#006b5f]">Administrator monitoring</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[#00152a]">Active Trips</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#486581]">Monitor trips that are navigating, exploring, or temporarily interrupted.</p>
      </header>

      {data ? <section aria-label="Active trip summary" className="mb-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Active Trips" value={data.summary.activeTrips} />
        <SummaryCard label="Trips with Open Alerts" value={data.summary.tripsWithOpenAlerts} alert={data.summary.tripsWithOpenAlerts > 0} />
        <SummaryCard label="Travelers on Trip" value={data.summary.travelersOnTrip} />
      </section> : null}

      <form role="search" onSubmit={submit} className="mb-6 rounded-2xl border border-[#d7e2ef] bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Keyword"><input aria-label="Keyword" value={draft.keyword} maxLength={200} onChange={(e) => field('keyword', e.target.value)} className={inputClass} placeholder="Trip code, group, or tour" /></Field>
          <Field label="Trip Type"><select aria-label="Trip Type" value={draft.tripType} onChange={(e) => field('tripType', e.target.value as ActiveTripsSearch['tripType'])} className={inputClass}><option value="">All</option><option value="SelfPlanned">Self-Planned</option><option value="Tour">Tour</option></select></Field>
          <Field label="Destination"><input aria-label="Destination" value={draft.destination} maxLength={300} onChange={(e) => field('destination', e.target.value)} className={inputClass} /></Field>
          <Field label="Start Date From"><input aria-label="Start Date From" aria-describedby={dateError ? 'date-error' : undefined} type="date" max={maximumStartDate} value={draft.startDateFrom} onChange={(e) => field('startDateFrom', e.target.value)} className={inputClass} /></Field>
          <Field label="Start Date To"><input aria-label="Start Date To" aria-describedby={dateError ? 'date-error' : undefined} type="date" max={maximumStartDate} value={draft.startDateTo} onChange={(e) => field('startDateTo', e.target.value)} className={inputClass} /></Field>
          <Field label="Alert State"><select aria-label="Alert State" value={draft.alertState} onChange={(e) => field('alertState', e.target.value as ActiveTripsSearch['alertState'])} className={inputClass}><option value="">All</option><option value="WithOpenAlerts">With Open Alerts</option><option value="WithoutOpenAlerts">Without Open Alerts</option></select></Field>
        </div>
        {dateError ? <p id="date-error" role="alert" className="mt-3 text-sm font-semibold text-[#8c1030]">{dateError}</p> : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="submit" className="rounded-xl bg-[#006b5f] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#005048]">Apply Filters</button>
          <button type="button" onClick={() => { const next = defaultActiveTripsSearch(); setDraft(next); setDateError(''); navigate(next); }} className="rounded-xl border border-[#9fb3c8] px-5 py-2.5 text-sm font-bold text-[#243b53] hover:bg-[#edf2f7]">Clear</button>
        </div>
      </form>

      {state === 'loading' ? <div role="status" className="rounded-2xl border border-[#d7e2ef] bg-white p-8 text-center text-[#486581]">Loading active trips…</div> : null}
      {state === 'forbidden' ? <FeedbackAlert tone="error" title="Access denied">{ACTIVE_TRIPS_MESSAGES.forbidden}</FeedbackAlert> : null}
      {state === 'unavailable' ? <FeedbackAlert tone="error" title="Unable to load active trips"><p>{ACTIVE_TRIPS_MESSAGES.unavailable}</p><button type="button" onClick={() => { setState('loading'); setData(null); setRetryKey((value) => value + 1); }} className="mt-2 rounded-lg border border-current px-3 py-1 font-bold">Retry</button></FeedbackAlert> : null}
      {state === 'ready' && data?.items.length === 0 ? <FeedbackAlert title="No active trips">{ACTIVE_TRIPS_MESSAGES.empty}</FeedbackAlert> : null}
      {state === 'ready' && data && data.items.length > 0 ? <>
        <div className="max-w-full overflow-x-auto rounded-2xl border border-[#d7e2ef] bg-white shadow-sm" tabIndex={0} aria-label="Active trips table; scroll horizontally on small screens">
          <table className="min-w-[1080px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#00152a] text-xs uppercase tracking-wide text-white"><tr>{['Trip Code','Trip Type','Current Status','Group or Traveler','Destination','Start Date','Current Day','Members','Open Alerts'].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead>
            <tbody>{data.items.map((trip) => <tr key={trip.tripId} className="border-t border-[#e6edf5]">
              <td className="px-4 py-3 font-mono font-bold text-[#00152a]">{trip.tripCode}</td>
              <td className="px-4 py-3"><Badge>{trip.tripType === 'SelfPlanned' ? 'Self-Planned' : 'Tour'}</Badge></td>
              <td className="px-4 py-3"><Badge alert={trip.currentState === 'Interrupted'}>{trip.currentState}</Badge></td>
              <td className="px-4 py-3 font-medium">{trip.groupOrTraveler}</td><td className="px-4 py-3">{trip.destination ?? 'Not available'}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatVietnamDateTime(trip.startedAtUtc)}</td><td className="px-4 py-3">{trip.currentDay ?? 'Not available'}</td>
              <td className="px-4 py-3">{trip.members}</td><td className={`px-4 py-3 font-bold ${trip.openAlerts ? 'text-[#b42318]' : 'text-[#486581]'}`}>{trip.openAlerts}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-col gap-3 text-sm text-[#486581] sm:flex-row sm:items-center sm:justify-between">
          <p>{data.totalCount} active trip{data.totalCount === 1 ? '' : 's'} · Page {data.pageNumber} of {Math.max(data.totalPages, 1)}</p>
          <div className="flex gap-2"><PageButton disabled={data.pageNumber <= 1} onClick={() => navigate({ ...applied, pageNumber: data.pageNumber - 1 })}>Previous</PageButton><PageButton disabled={data.pageNumber >= data.totalPages} onClick={() => navigate({ ...applied, pageNumber: data.pageNumber + 1 })}>Next</PageButton></div>
        </div>
      </> : null}
    </main>
  );
}

const inputClass = 'mt-1 w-full rounded-xl border border-[#bcccdc] bg-white px-3 py-2.5 text-sm text-[#102a43] outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#71f8e4]/40';
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="text-xs font-bold uppercase tracking-wide text-[#334e68]">{label}{children}</label>; }
function SummaryCard({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) { return <div className={`rounded-2xl border bg-white p-5 shadow-sm ${alert ? 'border-[#f3a79d]' : 'border-[#d7e2ef]'}`}><p className="text-xs font-bold uppercase tracking-wide text-[#627d98]">{label}</p><p className={`mt-2 text-3xl font-extrabold ${alert ? 'text-[#b42318]' : 'text-[#00152a]'}`}>{value}</p></div>; }
function Badge({ children, alert = false }: { children: React.ReactNode; alert?: boolean }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${alert ? 'bg-[#fdecef] text-[#8c1030]' : 'bg-[#e6f7f0] text-[#085b3e]'}`}>{children}</span>; }
function PageButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button type="button" {...props} className="rounded-lg border border-[#9fb3c8] px-4 py-2 font-bold text-[#243b53] disabled:cursor-not-allowed disabled:opacity-40">{children}</button>; }
