'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { PageHeader } from '@/components/layout/PageHeader';
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
  return (
    <main className="mx-auto w-full max-w-7xl py-2">
      <PageHeader
        className="mb-6"
        eyebrow="Staff Commercial Operations"
        title="Platform Bookings"
        description="Find tour bookings, verify their current booking and payment states, and investigate support requests. Payment credentials and gateway records are never shown here."
      />
      <form role="search" onSubmit={submit} className="mb-6 rounded-2xl border border-[#DCE2DD] bg-white p-4 shadow-xs">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr_0.95fr_0.95fr]">
          <Field label="Search"><input aria-label="Search" value={draft.keyword} maxLength={200} onChange={(event) => field('keyword', event.target.value)} className={inputClass} placeholder="Booking, traveler, tour, operator" /></Field>
          <Field label="Booking status"><select aria-label="Booking status" value={draft.status} onChange={(event) => field('status', event.target.value as PlatformBookingsSearch['status'])} className={inputClass}><option value="">All statuses</option>{PLATFORM_BOOKING_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></Field>
          <Field label="Payment status"><select aria-label="Payment status" value={draft.paymentStatus} onChange={(event) => field('paymentStatus', event.target.value as PlatformBookingsSearch['paymentStatus'])} className={inputClass}><option value="">All payments</option>{PLATFORM_PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></Field>
          <Field label="Booked from"><input aria-label="Booked from" type="date" value={draft.bookedFrom} onChange={(event) => field('bookedFrom', event.target.value)} className={inputClass} /></Field>
          <Field label="Booked to"><input aria-label="Booked to" type="date" value={draft.bookedTo} onChange={(event) => field('bookedTo', event.target.value)} className={inputClass} /></Field>
        </div>
        {rangeError ? <p role="alert" className="mt-3 text-sm font-semibold text-[#8C1030]">{rangeError}</p> : null}
        <div className="mt-4 flex gap-2.5">
          <button type="submit" className={primaryButton}>Apply filters</button>
          <button type="button" onClick={() => { const next = defaultPlatformBookingsSearch(); setDraft(next); setRangeError(''); navigate(next); }} className={secondaryButton}>Clear</button>
        </div>
      </form>
      {state === 'loading' ? <div role="status" className={panel}>Loading platform bookings…</div> : null}
      {state === 'forbidden' ? <FeedbackAlert tone="error" title="Access denied">You do not have permission to access this function.</FeedbackAlert> : null}
      {state === 'invalid' ? <FeedbackAlert tone="error" title="The submitted filters are invalid">Review the filters and try again.</FeedbackAlert> : null}
      {state === 'unavailable' ? <FeedbackAlert tone="error" title="Unable to load platform bookings"><p>Please check your connection and try again.</p><button type="button" onClick={() => { setState('loading'); setRetry((value) => value + 1); }} className="mt-2 rounded-lg border border-current px-3 py-1 font-bold">Retry</button></FeedbackAlert> : null}
      {state === 'ready' && data?.items.length === 0 ? <FeedbackAlert title="No bookings found">Try adjusting the filters or search phrase.</FeedbackAlert> : null}
      {state === 'ready' && data && data.items.length > 0 ? (
        <>
          <div className="max-w-full overflow-x-auto rounded-2xl border border-[#DCE2DD] bg-white shadow-xs" tabIndex={0}>
            <table className="w-full min-w-[840px] text-left text-xs">
              <caption className="sr-only">Platform bookings register</caption>
              <thead className="border-b border-[#DCE2DD] bg-[#F7F5EF] text-[10.5px] font-bold uppercase tracking-wider text-[#5B6E69]">
                <tr>
                  {[
                    { key: 'booking', label: 'Booking', pad: 'pl-3.5 pr-2' },
                    { key: 'traveler', label: 'Traveler', pad: 'px-2' },
                    { key: 'operator', label: 'Tour operator', pad: 'px-2' },
                    { key: 'departure', label: 'Departure', pad: 'px-2' },
                    { key: 'amount', label: 'Amount', align: 'right', pad: 'px-2' },
                    { key: 'bookingStatus', label: 'Booking status', pad: 'px-2' },
                    { key: 'payment', label: 'Payment', pad: 'px-2' },
                    { key: 'bookedAt', label: 'Booked at', pad: 'pl-2 pr-3.5' },
                  ].map((heading) => (
                    <th key={heading.key} scope="col" className={`${heading.pad} py-3 whitespace-nowrap${heading.align === 'right' ? ' text-right' : ''}`}>
                      {heading.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE2DD] text-[#1C2928]">
                {data.items.map((booking) => (
                  <tr key={booking.bookingId} className="transition-colors hover:bg-[#F7F5EF]/70">
                    <td className="pl-3.5 pr-2 py-3 max-w-[165px]">
                      <p className="font-mono text-[11.5px] font-bold text-[#1C2928] whitespace-nowrap">{booking.bookingCode}</p>
                      <p className="mt-0.5 truncate text-[11px] text-[#5B6E69]" title={booking.tour.title}>{booking.tour.title}</p>
                    </td>
                    <td className="px-2 py-3 max-w-[140px]">
                      <p className="font-semibold text-[#1C2928] truncate" title={booking.traveler.fullName}>{booking.traveler.fullName}</p>
                      <p className="truncate text-[11px] text-[#5B6E69]" title={booking.traveler.email ?? 'No email available'}>{booking.traveler.email ?? 'No email available'}</p>
                    </td>
                    <td className="px-2 py-3 max-w-[125px]">
                      <span className="block truncate text-[#1C2928]" title={booking.tour.operatorName}>{booking.tour.operatorName}</span>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-[11px] text-[#5B6E69]">{formatVietnamDateTime(booking.tour.startAtUtc)}</td>
                    <td className="px-2 py-3 text-right whitespace-nowrap">
                      <p className="font-mono font-bold text-[#1C2928]">{formatVnd(booking.totalAmount)}</p>
                      {booking.discountAmount > 0 ? <p className="text-[10.5px] text-[#5B6E69]">Discount {formatVnd(booking.discountAmount)}</p> : null}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap"><Badge value={booking.status} /></td>
                    <td className="px-2 py-3 whitespace-nowrap"><Badge value={booking.paymentStatus} /></td>
                    <td className="pl-2 pr-3.5 py-3 whitespace-nowrap text-[11px] text-[#5B6E69]">{formatVietnamDateTime(booking.bookedAtUtc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#DCE2DD] bg-white px-4 py-3 text-xs text-[#5B6E69] shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">{data.totalCount} booking{data.totalCount === 1 ? '' : 's'} · Page {data.pageNumber} of {Math.max(data.totalPages, 1)}</p>
            <div className="flex gap-2">
              <button type="button" disabled={data.pageNumber <= 1} onClick={() => navigate({ ...applied, pageNumber: data.pageNumber - 1 })} className={secondaryButton}>Previous</button>
              <button type="button" disabled={data.pageNumber >= data.totalPages} onClick={() => navigate({ ...applied, pageNumber: data.pageNumber + 1 })} className={secondaryButton}>Next</button>
            </div>
          </footer>
        </>
      ) : null}
    </main>
  );
}

const inputClass = 'mt-1 w-full rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] px-3 py-2 text-xs text-[#1C2928] outline-none transition focus:border-[#174B4A] focus:bg-white focus-visible:ring-2 focus-visible:ring-[#174B4A]/20';
const primaryButton = 'cursor-pointer rounded-xl bg-[#103B39] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#174B4A]';
const secondaryButton = 'cursor-pointer rounded-xl border border-[#DCE2DD] bg-white px-3.5 py-2 text-xs font-bold text-[#1C2928] transition hover:bg-[#F7F5EF] disabled:cursor-not-allowed disabled:opacity-40';
const panel = 'rounded-2xl border border-[#DCE2DD] bg-white p-8 text-center text-sm text-[#5B6E69] shadow-xs';
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="text-[11px] font-bold uppercase tracking-wider text-[#5B6E69]">{label}{children}</label>; }
function badgeTone(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized.includes('expired') || normalized.includes('cancel') || normalized.includes('fail') || normalized.includes('reject')) {
    return 'border-[#F7C9D3] bg-[#FDECEF] text-[#8C1030]';
  }
  if (normalized.includes('pending') || normalized.includes('unpaid') || normalized.includes('await') || normalized.includes('process') || normalized.includes('refund')) {
    return 'border-[#F2D8B3] bg-[#FBF3E8] text-[#8F5419]';
  }
  if (normalized.includes('confirm') || normalized.includes('paid') || normalized.includes('complet') || normalized.includes('succeed')) {
    return 'border-[#BCE0CD] bg-[#E7F2EC] text-[#1B5E3C]';
  }
  return 'border-[#DCE2DD] bg-[#F7F5EF] text-[#5B6E69]';
}
function Badge({ value }: { value: string }) {
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10.5px] font-bold ${badgeTone(value)}`}>{value}</span>;
}
