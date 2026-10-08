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
    return <section className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[#c3c6ce] bg-white shadow-[0_24px_72px_rgba(0,21,42,0.14)]" aria-live="polite">
      <div className="bg-[#00152a] px-6 py-7 text-white sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9ff2e2]">Coupon activated</p>
        <h2 className="mt-2 font-[family-name:var(--font-jakarta)] text-3xl font-bold tracking-tight">{createdCode} is ready to use</h2>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[#d1e4ff]">It is active for the selected tours during the validity window you chose.</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f2f4f7] px-6 py-5 sm:px-8">
        <Link className="text-sm font-bold text-[#005047] underline-offset-4 hover:underline" href={ROUTES.partner.dashboard}>Back to dashboard</Link>
        <button type="button" className="rounded-lg bg-[#006b5f] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#005047] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006b5f]" onClick={() => { setForm((current) => ({ ...defaultForm(), selectedTourIds: current.selectedTourIds })); setCreatedCode(null); }}>Create another coupon</button>
      </div>
    </section>;
  }

  const inputClass = 'mt-1.5 w-full rounded-lg bg-[#f2f4f7] px-3.5 py-2.5 text-sm text-[#191c1e] outline-none ring-1 ring-transparent transition placeholder:text-[#74777e] focus:bg-white focus:ring-[#006b5f]';
  const fieldErrorsForDiscount = Object.entries(fieldErrors).filter(([key]) => ['discountValue', 'maxDiscountAmount', 'minOrderAmount'].includes(key));

  return <form onSubmit={submit} className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[#c3c6ce] bg-white shadow-[0_24px_72px_rgba(0,21,42,0.12)]" noValidate>
    <header className="relative overflow-hidden bg-[#00152a] px-5 py-6 text-white sm:px-8 sm:py-7">
      <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#006b5f]/30 blur-2xl" aria-hidden="true" />
      <div className="relative flex gap-3.5">
        <span className="material-symbols-outlined flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#006b5f]/35 text-[24px] text-[#9ff2e2]" aria-hidden="true">confirmation_number</span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9ff2e2]">Partner promotion</p>
          <h2 className="mt-1 font-[family-name:var(--font-jakarta)] text-2xl font-bold tracking-tight sm:text-3xl">Create a new promotional coupon</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#d1e4ff]">Set a clear discount rule for your approved tours. Customers can only use it during the period you publish.</p>
        </div>
      </div>
    </header>

    <div className="space-y-7 px-5 py-6 sm:px-8 sm:py-7">
      {error && <div role="alert" className="rounded-xl border border-[#ffdad6] bg-[#fff3f1] p-4 text-sm text-[#93000a]">{error}</div>}

      <section>
        <div className="flex items-center justify-between gap-3"><label className="text-sm font-bold text-[#00152a]" htmlFor="coupon-code">Coupon code <span aria-hidden="true" className="text-[#ba1a1a]">*</span></label><button type="button" onClick={() => set('code', generatedCode())} className="inline-flex items-center gap-1 text-sm font-bold text-[#006b5f] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006b5f]"><span className="material-symbols-outlined text-[17px]" aria-hidden="true">casino</span>Generate code</button></div>
        <div className="relative"><input id="coupon-code" aria-label="Coupon code" value={form.code} onChange={(event) => set('code', event.target.value.toUpperCase())} className={`${inputClass} pr-11 font-mono font-bold uppercase tracking-widest`} placeholder="SUMMERTOUR2026" aria-invalid={!!fieldErrors.code} aria-describedby="coupon-code-help" /><span className="material-symbols-outlined pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#006b5f]" aria-hidden="true">verified</span></div>
        {fieldErrors.code && <p className="mt-1 text-sm text-[#ba1a1a]">{fieldErrors.code}</p>}<p id="coupon-code-help" className="mt-1.5 text-xs leading-5 text-[#5f6368]">Use 3–30 letters, numbers, or hyphens. A short memorable code is easier to enter at checkout.</p>
      </section>

      <fieldset>
        <legend className="text-sm font-bold text-[#00152a]">Discount type <span className="text-[#ba1a1a]">*</span></legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className={`cursor-pointer rounded-xl border-2 p-4 transition ${form.discountType === 'Percentage' ? 'border-[#006b5f] bg-[#ecfaf7]' : 'border-transparent bg-[#f2f4f7] hover:border-[#c3c6ce]'}`}><input aria-label="Percentage discount" type="radio" name="discountType" value="Percentage" checked={form.discountType === 'Percentage'} onChange={() => set('discountType', 'Percentage')} className="sr-only" /><span className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#006b5f] font-bold text-white">%</span><span className="font-bold text-[#00152a]">Percentage discount</span><span className="ml-auto h-5 w-5 rounded-full border-2 border-[#006b5f] p-1">{form.discountType === 'Percentage' && <span className="block h-full w-full rounded-full bg-[#006b5f]" />}</span></span><span className="mt-2 block text-sm leading-5 text-[#43474d]">Reduce the tour price by a percentage.</span></label>
          <label className={`cursor-pointer rounded-xl border-2 p-4 transition ${form.discountType === 'Flat' ? 'border-[#006b5f] bg-[#ecfaf7]' : 'border-transparent bg-[#f2f4f7] hover:border-[#c3c6ce]'}`}><input aria-label="Fixed amount" type="radio" name="discountType" value="Flat" checked={form.discountType === 'Flat'} onChange={() => set('discountType', 'Flat')} className="sr-only" /><span className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e0e3e6] font-bold text-[#43474d]">₫</span><span className="font-bold text-[#00152a]">Fixed amount</span><span className="ml-auto h-5 w-5 rounded-full border-2 border-[#74777e] p-1">{form.discountType === 'Flat' && <span className="block h-full w-full rounded-full bg-[#006b5f]" />}</span></span><span className="mt-2 block text-sm leading-5 text-[#43474d]">Subtract a fixed VND amount from the tour price.</span></label>
        </div>
      </fieldset>

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-[#00152a]">{form.discountType === 'Percentage' ? 'Discount (%)' : 'Discount amount'}<div className="relative"><input aria-label={form.discountType === 'Percentage' ? 'Discount (%)' : 'Discount amount'} inputMode="decimal" value={form.discountValue} onChange={(event) => set('discountValue', event.target.value)} className={`${inputClass} pr-14`} aria-invalid={!!fieldErrors.discountValue} /><span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#74777e]">{form.discountType === 'Percentage' ? '%' : 'VND'}</span></div></label>
        {form.discountType === 'Percentage' ? <label className="text-sm font-bold text-[#00152a]">Maximum discount<div className="relative"><input aria-label="Maximum discount (VND)" inputMode="decimal" value={form.maxDiscountAmount} onChange={(event) => set('maxDiscountAmount', event.target.value)} className={`${inputClass} pr-14`} aria-invalid={!!fieldErrors.maxDiscountAmount} /><span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#74777e]">VND</span></div><span className="mt-1 block text-xs font-normal text-[#5f6368]">Required for percentage discounts.</span></label> : <label className="text-sm font-bold text-[#00152a]">Minimum order<div className="relative"><input aria-label="Minimum order (VND)" inputMode="decimal" value={form.minOrderAmount} onChange={(event) => set('minOrderAmount', event.target.value)} className={`${inputClass} pr-14`} aria-invalid={!!fieldErrors.minOrderAmount} /><span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#74777e]">VND</span></div></label>}
        {form.discountType === 'Percentage' && <label className="text-sm font-bold text-[#00152a]">Minimum order<div className="relative"><input inputMode="decimal" value={form.minOrderAmount} onChange={(event) => set('minOrderAmount', event.target.value)} className={`${inputClass} pr-14`} aria-invalid={!!fieldErrors.minOrderAmount} /><span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#74777e]">VND</span></div></label>}
        {fieldErrorsForDiscount.length > 0 && <div className="sm:col-span-2">{fieldErrorsForDiscount.map(([key, value]) => <p key={key} className="mt-1 text-sm text-[#ba1a1a]">{value}</p>)}</div>}
      </section>

      <section className="border-t border-[#e0e3e6] pt-7"><h3 className="text-sm font-bold text-[#00152a]">Availability and limits</h3><p className="mt-1 text-sm text-[#5f6368]">Dates use your device time and are saved as an exact UTC instant.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-[#00152a]">Starts<input type="datetime-local" value={form.validFrom} onChange={(event) => set('validFrom', event.target.value)} className={inputClass} /></label><label className="text-sm font-bold text-[#00152a]">Ends<input type="datetime-local" value={form.validTo} onChange={(event) => set('validTo', event.target.value)} className={inputClass} aria-invalid={!!fieldErrors.validTo} /></label><label className="text-sm font-bold text-[#00152a]">Total redemptions<div className="relative"><input inputMode="numeric" value={form.usageLimit} onChange={(event) => set('usageLimit', event.target.value)} className={`${inputClass} pr-14`} placeholder="Unlimited" /><span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#74777e]">uses</span></div></label><label className="text-sm font-bold text-[#00152a]">Per customer<div className="relative"><input inputMode="numeric" value={form.usageLimitPerUser} onChange={(event) => set('usageLimitPerUser', event.target.value)} className={`${inputClass} pr-14`} placeholder="Unlimited" /><span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#74777e]">uses</span></div></label></div>{fieldErrors.validTo && <p className="mt-1 text-sm text-[#ba1a1a]">{fieldErrors.validTo}</p>}{fieldErrors.usageLimit && <p className="mt-1 text-sm text-[#ba1a1a]">{fieldErrors.usageLimit}</p>}{fieldErrors.usageLimitPerUser && <p className="mt-1 text-sm text-[#ba1a1a]">{fieldErrors.usageLimitPerUser}</p>}
      </section>

      <section className="border-t border-[#e0e3e6] pt-7"><div className="flex flex-wrap items-baseline justify-between gap-2"><div><h3 className="text-sm font-bold text-[#00152a]">Applicable tours <span className="text-[#ba1a1a]">*</span></h3><p className="mt-1 text-sm text-[#5f6368]">Only tours that are approved and owned by you are listed.</p></div><span className="text-sm font-bold text-[#006b5f]">{form.selectedTourIds.length} selected</span></div>
        <div className="relative mt-4"><span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777e]" aria-hidden="true">search</span><input value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputClass} mt-0 pl-10`} placeholder="Search approved tours" aria-label="Search approved tours" /></div>
        {loadingTours ? <div className="mt-4 space-y-2" aria-label="Loading approved tours"><div className="h-14 animate-pulse rounded-lg bg-[#f2f4f7]" /><div className="h-14 animate-pulse rounded-lg bg-[#f2f4f7]" /></div> : tourLoadFailed ? <div className="mt-4 rounded-xl border border-[#ffdad6] bg-[#fff3f1] p-4 text-sm text-[#93000a]"><p>We could not load your approved tours.</p><button type="button" onClick={() => { void loadTours(); }} className="mt-2 font-bold underline underline-offset-4">Retry loading tours</button></div> : <ul className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-[#e0e3e6] bg-[#fdfdfd]">{visibleTours.map((tour) => <li key={tour.id} className="border-b border-[#e0e3e6] last:border-0"><label className="flex cursor-pointer gap-3 p-4 transition hover:bg-[#ecfaf7]"><input type="checkbox" checked={form.selectedTourIds.includes(tour.id)} onChange={() => toggleTour(tour.id)} className="mt-0.5 h-4 w-4 accent-[#006b5f]" /><span className="min-w-0"><span className="block font-semibold text-[#00152a]">{tour.title}</span><span className="mt-0.5 block text-sm text-[#5f6368]">{tour.destination ?? 'Destination not specified'} · {currency(String(tour.basePrice))}</span></span></label></li>)}</ul>}
        {!loadingTours && !tourLoadFailed && visibleTours.length === 0 && <p className="mt-4 text-sm text-[#5f6368]">No approved tours match this search.</p>}{fieldErrors.selectedTourIds && <p className="mt-2 text-sm text-[#ba1a1a]">{fieldErrors.selectedTourIds}</p>}
      </section>
    </div>

    <footer className="flex flex-col-reverse items-center justify-between gap-3 border-t border-[#e0e3e6] bg-[#f2f4f7] px-5 py-4 sm:flex-row sm:px-8"><p className="text-xs leading-5 text-[#5f6368]">The coupon becomes active immediately after creation.</p><button disabled={submitting || loadingTours} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#006b5f] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#005047] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006b5f]"><span className="material-symbols-outlined text-[18px]" aria-hidden="true">check_circle</span>{submitting ? 'Creating coupon…' : 'Create and activate coupon'}</button></footer>
  </form>;
}
