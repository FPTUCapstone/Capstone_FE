'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { ROUTES } from '@/lib/routes';
import {
  CouponApiError,
  createCoupon,
  getEligibleCouponTours,
  type EligibleCouponTour,
} from '../services/couponApi';

type DiscountType = 'Percentage' | 'Flat';

type FormState = {
  code: string;
  discountType: DiscountType;
  discountValue: string;
  maxDiscountAmount: string;
  minOrderAmount: string;
  usageLimit: string;
  usageLimitPerUser: string;
  validFrom: string;
  validTo: string;
  selectedTourIds: number[];
};

const maximumMoneyAmount = 9_999_999_999.99;

function isSupportedMoney(value: string, allowZero = false): boolean {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return false;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount <= maximumMoneyAmount && (allowZero ? amount >= 0 : amount > 0);
}

function localDateTimeValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultForm(): FormState {
  const starts = new Date();
  starts.setMinutes(0, 0, 0);
  starts.setHours(starts.getHours() + 1);
  const ends = new Date(starts);
  ends.setDate(ends.getDate() + 7);
  return {
    code: '', discountType: 'Percentage', discountValue: '', maxDiscountAmount: '', minOrderAmount: '0',
    usageLimit: '', usageLimitPerUser: '', validFrom: localDateTimeValue(starts), validTo: localDateTimeValue(ends), selectedTourIds: [],
  };
}

function currency(value: string): string {
  const number = Number(value);
  return Number.isFinite(number) && number > 0
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(number)
    : '—';
}

function generatedCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = crypto.getRandomValues(new Uint32Array(6));
  return `TRIP-${Array.from(values, (value) => chars[value % chars.length]).join('')}`;
}

function asOptionalPositiveInteger(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : Number.NaN;
}

export function CreateCouponForm() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [tours, setTours] = useState<EligibleCouponTour[]>([]);
  const [query, setQuery] = useState('');
  const [loadingTours, setLoadingTours] = useState(true);
  const [tourLoadFailed, setTourLoadFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const loadTours = useCallback(async () => {
    setLoadingTours(true);
    setTourLoadFailed(false);
    setError(null);
    try {
      const items = await getEligibleCouponTours();
      setTours(items);
    } catch (reason: unknown) {
      setTourLoadFailed(true);
      setError(reason instanceof CouponApiError ? reason.message : 'Unable to load your approved tours.');
    } finally {
      setLoadingTours(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const items = await getEligibleCouponTours();
        if (!cancelled) setTours(items);
      } catch (reason: unknown) {
        if (!cancelled) {
          setTourLoadFailed(true);
          setError(reason instanceof CouponApiError ? reason.message : 'Unable to load your approved tours.');
        }
      } finally {
        if (!cancelled) setLoadingTours(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const visibleTours = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return tours;
    return tours.filter((tour) => `${tour.title} ${tour.destination ?? ''}`.toLocaleLowerCase().includes(normalized));
  }, [query, tours]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      const remaining = { ...current };
      delete remaining[key];
      return remaining;
    });
  };

  const toggleTour = (tourId: number) => set('selectedTourIds', form.selectedTourIds.includes(tourId)
    ? form.selectedTourIds.filter((id) => id !== tourId)
    : [...form.selectedTourIds, tourId]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const discount = Number(form.discountValue);
    const minOrder = Number(form.minOrderAmount || '0');
    const total = asOptionalPositiveInteger(form.usageLimit);
    const perUser = asOptionalPositiveInteger(form.usageLimitPerUser);
    if (!/^[A-Za-z0-9-]{3,30}$/.test(form.code.trim())) next.code = 'Use 3–30 letters, digits, or hyphens.';
    if (!isSupportedMoney(form.discountValue) || (form.discountType === 'Percentage' && discount > 100)) next.discountValue = form.discountType === 'Percentage' ? 'Enter a percentage from 1 to 100 with at most 2 decimal places.' : 'Enter a discount in the supported currency range with at most 2 decimal places.';
    if (form.discountType === 'Percentage' && !isSupportedMoney(form.maxDiscountAmount)) next.maxDiscountAmount = 'A maximum discount is required and must have at most 2 decimal places.';
    if (!isSupportedMoney(form.minOrderAmount || '0', true)) next.minOrderAmount = 'Minimum order must be a non-negative amount with at most 2 decimal places.';
    if (form.discountType === 'Flat' && minOrder > 0 && discount > minOrder) next.discountValue = 'A fixed discount cannot exceed the minimum order.';
    if (Number.isNaN(total)) next.usageLimit = 'Enter a whole number greater than 0, or leave blank.';
    if (Number.isNaN(perUser)) next.usageLimitPerUser = 'Enter a whole number greater than 0, or leave blank.';
    if (!form.validFrom || !form.validTo || new Date(form.validTo) <= new Date(form.validFrom)) next.validTo = 'End time must be later than start time.';
    else if (new Date(form.validTo) <= new Date()) next.validTo = 'End time must be in the future.';
    if (form.selectedTourIds.length === 0) next.selectedTourIds = 'Select at least one approved tour.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setCreatedCode(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await createCoupon({
        code: form.code, discountType: form.discountType, discountValue: Number(form.discountValue),
        ...(form.discountType === 'Percentage' ? { maxDiscountAmount: Number(form.maxDiscountAmount) } : {}),
        minOrderAmount: Number(form.minOrderAmount || '0'), usageLimit: asOptionalPositiveInteger(form.usageLimit),
        usageLimitPerUser: asOptionalPositiveInteger(form.usageLimitPerUser), validFromUtc: new Date(form.validFrom).toISOString(),
        validToUtc: new Date(form.validTo).toISOString(), applicableTourIds: form.selectedTourIds,
      });
      setCreatedCode(result.code);
    } catch (reason) {
      setError(reason instanceof CouponApiError ? reason.message : 'Unable to create this coupon. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (createdCode) {
    return <section className="max-w-2xl rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm" aria-live="polite">
      <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">Coupon created</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-950">{createdCode} is ready to use</h2>
      <p className="mt-3 text-slate-600">It is active for the selected tours during the validity window you chose.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="rounded-xl bg-[#006b5f] px-4 py-3 font-semibold text-white hover:bg-[#00564c]" onClick={() => { setForm((current) => ({ ...defaultForm(), selectedTourIds: current.selectedTourIds })); setCreatedCode(null); }}>Create another coupon</button>
        <Link className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50" href={ROUTES.partner.dashboard}>Back to dashboard</Link>
      </div>
    </section>;
  }

  return <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]" noValidate>
    <div className="space-y-6">
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-7"><h2 className="text-lg font-bold">Coupon identity</h2>
        <label className="mt-4 block text-sm font-semibold">Coupon code
          <div className="mt-1 flex gap-2"><input value={form.code} onChange={(event) => set('code', event.target.value.toUpperCase())} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono uppercase" placeholder="SUMMER25" aria-invalid={!!fieldErrors.code} />
            <button type="button" onClick={() => set('code', generatedCode())} className="rounded-lg border border-[#006b5f] px-3 text-sm font-semibold text-[#006b5f] hover:bg-[#e8f7f4]">Generate</button></div>
        </label>{fieldErrors.code && <p className="mt-1 text-sm text-red-700">{fieldErrors.code}</p>}<p className="mt-2 text-sm text-slate-500">Customers enter this code at checkout. Use a short, memorable code.</p>
      </section>
      <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-7"><h2 className="text-lg font-bold">Discount</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Type<select value={form.discountType} onChange={(event) => set('discountType', event.target.value as DiscountType)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="Percentage">Percentage</option><option value="Flat">Fixed amount (VND)</option></select></label>
          <label className="text-sm font-semibold">{form.discountType === 'Percentage' ? 'Discount (%)' : 'Discount (VND)'}<input inputMode="decimal" value={form.discountValue} onChange={(event) => set('discountValue', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" aria-invalid={!!fieldErrors.discountValue} /></label>
          {form.discountType === 'Percentage' && <label className="text-sm font-semibold">Maximum discount (VND)<input inputMode="decimal" value={form.maxDiscountAmount} onChange={(event) => set('maxDiscountAmount', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" aria-invalid={!!fieldErrors.maxDiscountAmount} /></label>}
          <label className="text-sm font-semibold">Minimum order (VND)<input inputMode="decimal" value={form.minOrderAmount} onChange={(event) => set('minOrderAmount', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" aria-invalid={!!fieldErrors.minOrderAmount} /></label>
        </div>{Object.entries(fieldErrors).filter(([key]) => ['discountValue', 'maxDiscountAmount', 'minOrderAmount'].includes(key)).map(([key, value]) => <p key={key} className="mt-1 text-sm text-red-700">{value}</p>)}</section>
      <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-7"><h2 className="text-lg font-bold">Availability</h2><p className="mt-1 text-sm text-slate-500">Times are shown in your device’s local time and saved as an exact UTC instant.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Starts<input type="datetime-local" value={form.validFrom} onChange={(event) => set('validFrom', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="text-sm font-semibold">Ends<input type="datetime-local" value={form.validTo} onChange={(event) => set('validTo', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" aria-invalid={!!fieldErrors.validTo} /></label></div>{fieldErrors.validTo && <p className="mt-1 text-sm text-red-700">{fieldErrors.validTo}</p>}
        <details className="mt-5 rounded-lg bg-slate-50 p-4"><summary className="cursor-pointer font-semibold">Optional usage limits</summary><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Total redemptions<input inputMode="numeric" value={form.usageLimit} onChange={(event) => set('usageLimit', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Unlimited" /></label><label className="text-sm font-semibold">Per customer<input inputMode="numeric" value={form.usageLimitPerUser} onChange={(event) => set('usageLimitPerUser', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Unlimited" /></label></div></details>
      </section>
      <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-7"><div className="flex flex-wrap items-baseline justify-between gap-2"><div><h2 className="text-lg font-bold">Applicable tours</h2><p className="mt-1 text-sm text-slate-500">Only your approved tours can use this coupon.</p></div><span className="text-sm font-semibold text-[#006b5f]">{form.selectedTourIds.length} selected</span></div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Search approved tours" />
        {loadingTours ? <p className="mt-4 text-sm text-slate-500">Loading eligible tours…</p> : tourLoadFailed ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>We could not load your approved tours.</p><button type="button" onClick={() => { void loadTours(); }} className="mt-2 font-semibold underline">Retry loading tours</button></div> : <ul className="mt-4 max-h-72 divide-y overflow-y-auto rounded-lg border border-slate-200">{visibleTours.map((tour) => <li key={tour.id}><label className="flex cursor-pointer gap-3 p-3 hover:bg-slate-50"><input type="checkbox" checked={form.selectedTourIds.includes(tour.id)} onChange={() => toggleTour(tour.id)} className="mt-1 h-4 w-4" /><span><span className="block font-semibold">{tour.title}</span><span className="text-sm text-slate-500">{tour.destination ?? 'Destination not specified'} · {currency(String(tour.basePrice))}</span></span></label></li>)}</ul>}
        {!loadingTours && !tourLoadFailed && visibleTours.length === 0 && <p className="mt-4 text-sm text-slate-500">No approved tours match this search.</p>}{fieldErrors.selectedTourIds && <p className="mt-2 text-sm text-red-700">{fieldErrors.selectedTourIds}</p>}
      </section>
    </div>
    <aside className="h-fit rounded-2xl bg-[#001d35] p-5 text-white shadow-sm lg:sticky lg:top-4"><p className="text-xs font-bold uppercase tracking-wider text-[#83d9cc]">Customer preview</p><p className="mt-3 font-mono text-xl font-bold">{form.code.trim() || 'YOUR-CODE'}</p><p className="mt-3 text-sm text-slate-200">{form.discountType === 'Percentage' ? `${form.discountValue || '0'}% off, up to ${currency(form.maxDiscountAmount)}` : `${currency(form.discountValue)} off`}</p><p className="mt-2 text-sm text-slate-300">Minimum order: {currency(form.minOrderAmount)}</p><button disabled={submitting || loadingTours} className="mt-6 w-full rounded-xl bg-[#3ad1be] px-4 py-3 font-bold text-[#002e2a] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Creating coupon…' : 'Create coupon'}</button><p className="mt-3 text-xs leading-relaxed text-slate-300">Review the date range and tours before publishing. You cannot use an unapproved tour.</p></aside>
  </form>;
}
