'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';
import { defaultPlatformBookingsSearch, formatVietnamDateTime, formatVnd, parsePlatformBookingsSearch, PLATFORM_BOOKING_STATUSES, PLATFORM_PAYMENT_STATUSES, serializePlatformBookingsSearch, validBookedRange, type PlatformBookingsResponse, type PlatformBookingsSearch } from './platformBookings';
import { fetchPlatformBookings, PlatformBookingsError } from './platformBookingsService';

type LoadState = 'loading' | 'ready' | 'forbidden' | 'invalid' | 'unavailable';

export function PlatformBookingsScreen() {
  const params = useSearchParams(); const key = params.toString();
  return <PlatformBookingsContent key={key} queryKey={key} />;
}

function PlatformBookingsContent({ queryKey }: { queryKey: string }) {
  const { push, replace } = useRouter();
  const applied = useMemo(() => parsePlatformBookingsSearch(new URLSearchParams(queryKey)), [queryKey]);
  const [draft, setDraft] = useState<PlatformBookingsSearch>(applied);
  const [data, setData] = useState<PlatformBookingsResponse | null>(null);
  const [state, setState] = useState<LoadState>('loading'); const [rangeError, setRangeError] = useState(''); const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetchPlatformBookings(applied, controller.signal).then((response) => { if (!controller.signal.aborted) { setData(response); setState('ready'); } }).catch((error: unknown) => {
      if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
      if (error instanceof PlatformBookingsError && error.status === 401) { replace(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.bookings)}`); return; }
      setState(error instanceof PlatformBookingsError && error.status === 403 ? 'forbidden' : error instanceof PlatformBookingsError && error.status === 400 ? 'invalid' : 'unavailable');
    });
    return () => controller.abort();
  }, [applied, replace, retry]);
  const navigate = (next: PlatformBookingsSearch) => { const query = serializePlatformBookingsSearch(next).toString(); push(`${ROUTES.admin.bookings}${query ? `?${query}` : ''}`); };
  const field = <K extends keyof PlatformBookingsSearch>(key: K, value: PlatformBookingsSearch[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (!validBookedRange(draft.bookedFrom, draft.bookedTo)) { setRangeError('The booking end date must be on or after the start date.'); return; } setRangeError(''); navigate({ ...draft, keyword: draft.keyword.trim(), pageNumber: 1 }); };
  return <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
    <header className="mb-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#006b5f]">Staff commercial operations</p><h1 className="mt-2 text-3xl font-extrabold text-[#00152a]">Platform Bookings</h1><p className="mt-2 max-w-3xl text-sm text-[#486581]">Find tour bookings, verify their current booking and payment states, and investigate support requests. Payment credentials and gateway records are never shown here.</p></header>
    <form role="search" onSubmit={submit} className="mb-6 rounded-2xl border border-[#d7e2ef] bg-white p-4 shadow-sm"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Field label="Search"><input aria-label="Search" value={draft.keyword} maxLength={200} onChange={(event) => field('keyword', event.target.value)} className={inputClass} placeholder="Booking, traveler, tour, operator" /></Field>
      <Field label="Booking status"><select aria-label="Booking status" value={draft.status} onChange={(event) => field('status', event.target.value as PlatformBookingsSearch['status'])} className={inputClass}><option value="">All statuses</option>{PLATFORM_BOOKING_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></Field>
      <Field label="Payment status"><select aria-label="Payment status" value={draft.paymentStatus} onChange={(event) => field('paymentStatus', event.target.value as PlatformBookingsSearch['paymentStatus'])} className={inputClass}><option value="">All payments</option>{PLATFORM_PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></Field>
      <Field label="Booked from"><input aria-label="Booked from" type="date" value={draft.bookedFrom} onChange={(event) => field('bookedFrom', event.target.value)} className={inputClass} /></Field>
      <Field label="Booked to"><input aria-label="Booked to" type="date" value={draft.bookedTo} onChange={(event) => field('bookedTo', event.target.value)} className={inputClass} /></Field>
    </div>{rangeError ? <p role="alert" className="mt-3 text-sm font-semibold text-[#8c1030]">{rangeError}</p> : null}<div className="mt-4 flex gap-3"><button type="submit" className={primaryButton}>Apply filters</button><button type="button" onClick={() => { const next = defaultPlatformBookingsSearch(); setDraft(next); setRangeError(''); navigate(next); }} className={secondaryButton}>Clear</button></div></form>
    {state === 'loading' ? <div role="status" className={panel}>Loading platform bookings…</div> : null}
    {state === 'forbidden' ? <FeedbackAlert tone="error" title="Access denied">You do not have permission to access this function.</FeedbackAlert> : null}
    {state === 'invalid' ? <FeedbackAlert tone="error" title="The submitted filters are invalid">Review the filters and try again.</FeedbackAlert> : null}
    {state === 'unavailable' ? <FeedbackAlert tone="error" title="Unable to load platform bookings"><p>Please check your connection and try again.</p><button type="button" onClick={() => { setState('loading'); setRetry((value) => value + 1); }} className="mt-2 rounded-lg border border-current px-3 py-1 font-bold">Retry</button></FeedbackAlert> : null}
    {state === 'ready' && data?.items.length === 0 ? <FeedbackAlert title="No bookings found">Try adjusting the filters or search phrase.</FeedbackAlert> : null}
    {state === 'ready' && data && data.items.length > 0 ? <><div className="max-w-full overflow-x-auto rounded-2xl border border-[#d7e2ef] bg-white shadow-sm" tabIndex={0}><table className="min-w-[1180px] w-full text-left text-sm"><caption className="sr-only">Platform bookings register</caption><thead className="bg-[#00152a] text-xs uppercase tracking-wide text-white"><tr>{['Booking', 'Traveler', 'Tour operator', 'Departure', 'Amount', 'Booking', 'Payment', 'Booked at'].map((heading) => <th key={heading} scope="col" className="px-4 py-3">{heading}</th>)}</tr></thead><tbody>{data.items.map((booking) => <tr key={booking.bookingId} className="border-t border-[#e6edf5]"><td className="px-4 py-3"><p className="font-mono font-bold text-[#00152a]">{booking.bookingCode}</p><p className="mt-1 text-xs text-[#627d98]">{booking.tour.title}</p></td><td className="px-4 py-3"><p className="font-medium">{booking.traveler.fullName}</p><p className="text-xs text-[#627d98]">{booking.traveler.email ?? 'No email available'}</p></td><td className="px-4 py-3">{booking.tour.operatorName}</td><td className="px-4 py-3 whitespace-nowrap">{formatVietnamDateTime(booking.tour.startAtUtc)}</td><td className="px-4 py-3 text-right whitespace-nowrap"><p className="font-bold">{formatVnd(booking.totalAmount)}</p>{booking.discountAmount > 0 ? <p className="text-xs text-[#627d98]">Discount {formatVnd(booking.discountAmount)}</p> : null}</td><td className="px-4 py-3"><Badge value={booking.status} /></td><td className="px-4 py-3"><Badge value={booking.paymentStatus} /></td><td className="px-4 py-3 whitespace-nowrap">{formatVietnamDateTime(booking.bookedAtUtc)}</td></tr>)}</tbody></table></div><footer className="mt-4 flex flex-col gap-3 text-sm text-[#486581] sm:flex-row sm:items-center sm:justify-between"><p>{data.totalCount} booking{data.totalCount === 1 ? '' : 's'} · Page {data.pageNumber} of {Math.max(data.totalPages, 1)}</p><div className="flex gap-2"><button type="button" disabled={data.pageNumber <= 1} onClick={() => navigate({ ...applied, pageNumber: data.pageNumber - 1 })} className={secondaryButton}>Previous</button><button type="button" disabled={data.pageNumber >= data.totalPages} onClick={() => navigate({ ...applied, pageNumber: data.pageNumber + 1 })} className={secondaryButton}>Next</button></div></footer></> : null}
  </main>;
}

const inputClass = 'mt-1 w-full rounded-xl border border-[#bcccdc] bg-white px-3 py-2.5 text-sm text-[#102a43] outline-none focus-visible:border-[#006b5f] focus-visible:ring-2 focus-visible:ring-[#71f8e4]/40';
const primaryButton = 'rounded-xl bg-[#006b5f] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#005048]';
const secondaryButton = 'rounded-xl border border-[#9fb3c8] px-4 py-2 text-sm font-bold text-[#243b53] hover:bg-[#edf2f7] disabled:cursor-not-allowed disabled:opacity-40';
const panel = 'rounded-2xl border border-[#d7e2ef] bg-white p-8 text-center text-[#486581]';
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="text-xs font-bold uppercase tracking-wide text-[#334e68]">{label}{children}</label>; }
function Badge({ value }: { value: string }) { return <span className="inline-flex rounded-full bg-[#e6f7f0] px-2.5 py-1 text-xs font-bold text-[#085b3e]">{value}</span>; }
