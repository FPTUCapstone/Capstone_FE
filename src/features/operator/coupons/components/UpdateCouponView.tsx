'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type {
  CouponDto,
  EligibleTourDto,
  UpdateCouponPayload,
} from '../types/couponLifecycle';
import {
  resolveCouponReturnUrl,
} from '../routes';
import {
  activateCoupon,
  deactivateCoupon,
  deriveCouponTemporalStatus,
  isCouponExpired,
  getOperatorCouponById,
  updateCoupon,
  validateUpdateCoupon,
} from '../services/operatorCouponService';
import { OperatorCouponStatusBadge } from './OperatorCouponStatusBadge';
import { DeactivateCouponDialog } from './DeactivateCouponDialog';
import { couponEn } from '../resources/en';
import { toVietnamDateTimeInput, vietnamDateTimeToUtc } from '../services/couponDateTime';

interface UpdateCouponViewProps {
  initialCoupon: CouponDto;
  eligibleTours: EligibleTourDto[];
  currentUserId?: number | string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

export function UpdateCouponView({
  initialCoupon,
  eligibleTours,
  currentUserId,
}: UpdateCouponViewProps) {
  const searchParams = useSearchParams();
  const returnUrl = resolveCouponReturnUrl(searchParams?.get('returnUrl'));

  const [coupon, setCoupon] = useState<CouponDto>(initialCoupon);
  const [now] = useState(() => Date.now());

  // Form states
  const [name, setName] = useState(coupon.name);
  const [discountValue, setDiscountValue] = useState<string>(String(coupon.discountValue));
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>(
    coupon.maxDiscountAmount !== undefined && coupon.maxDiscountAmount !== null
      ? String(coupon.maxDiscountAmount)
      : ''
  );
  const [minSpend, setMinSpend] = useState<string>(
    coupon.minSpend !== undefined && coupon.minSpend !== null ? String(coupon.minSpend) : ''
  );
  const [usageLimit, setUsageLimit] = useState<string>(coupon.usageLimit === null ? '' : String(coupon.usageLimit));
  const [usageUnlimited, setUsageUnlimited] = useState(coupon.usageLimit === null);
  const [usageLimitPerTraveler, setUsageLimitPerTraveler] = useState<string>(
    coupon.usageLimitPerTraveler ? String(coupon.usageLimitPerTraveler) : ''
  );
  const [perUserUnlimited, setPerUserUnlimited] = useState(coupon.usageLimitPerTraveler == null);
  const [validFrom, setValidFrom] = useState(coupon.validFromUtc ? toVietnamDateTimeInput(coupon.validFromUtc) : coupon.validFrom);
  const [validTo, setValidTo] = useState(coupon.validToUtc ? toVietnamDateTimeInput(coupon.validToUtc) : coupon.validTo);

  // Scope
  const [appliesToAllTours, setAppliesToAllTours] = useState(coupon.appliesToAllTours);
  const [selectedTourIds, setSelectedTourIds] = useState<string[]>(coupon.appliedTourIds || []);

  // Validation & feedback
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [serverNotice, setServerNotice] = useState<{
    tone: 'error' | 'success' | 'pending';
    message: string;
  } | null>(null);

  // Status Dialog (CR-05)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'deactivate' | 'activate'>('deactivate');
  const [dialogLoading, setDialogLoading] = useState(false);

  const toggleTourSelection = (tourId: string) => {
    setSelectedTourIds((prev) =>
      prev.includes(tourId) ? prev.filter((id) => id !== tourId) : [...prev, tourId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setServerNotice(null);

    const fromUtc = coupon.validFromUtc
      ? validFrom === toVietnamDateTimeInput(coupon.validFromUtc)
        ? coupon.validFromUtc : vietnamDateTimeToUtc(validFrom)
      : validFrom;
    const toUtc = coupon.validToUtc
      ? validTo === toVietnamDateTimeInput(coupon.validToUtc)
        ? coupon.validToUtc : vietnamDateTimeToUtc(validTo)
      : validTo;
    if (!fromUtc || !toUtc) {
      setErrors({ validTo: couponEn.errors.invalidVietnamDateTime });
      return;
    }

    const payload: UpdateCouponPayload = {
      name: name.trim(),
      discountType: coupon.discountType,
      discountValue: discountValue.trim() !== '' ? Number(discountValue) : 0,
      maxDiscountAmount: maxDiscountAmount.trim() !== '' ? Number(maxDiscountAmount) : null,
      minSpend: minSpend.trim() !== '' ? Number(minSpend) : null,
      usageLimit: usageUnlimited ? null : usageLimit.trim() !== '' ? Number(usageLimit) : 0,
      usageLimitPerTraveler:
        perUserUnlimited ? null : usageLimitPerTraveler.trim() !== '' ? Number(usageLimitPerTraveler) : 0,
      validFrom: fromUtc,
      validTo: toUtc,
      appliesToAllTours,
      appliedTourIds: appliesToAllTours ? [] : selectedTourIds,
    };

    const ownedTourIds = eligibleTours.map((t) => t.id);
    const clientErrors = validateUpdateCoupon(coupon, payload, { ownedTourIds });

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }
    setErrors({});

    setSaving(true);
    try {
      const res = await updateCoupon(coupon.id, payload, {
        currentUserId,
        eligibleTourIds: eligibleTours.map((tour) => tour.id),
      });

      if (res.status === 'SUCCESS' && res.data) {
        setConflict(false);
        setCoupon(res.data);
        setName(res.data.name);
        setDiscountValue(String(res.data.discountValue));
        setMaxDiscountAmount(res.data.maxDiscountAmount == null ? '' : String(res.data.maxDiscountAmount));
        setMinSpend(res.data.minSpend == null ? '' : String(res.data.minSpend));
        setUsageLimit(res.data.usageLimit == null ? '' : String(res.data.usageLimit));
        setUsageUnlimited(res.data.usageLimit === null);
        setUsageLimitPerTraveler(res.data.usageLimitPerTraveler == null ? '' : String(res.data.usageLimitPerTraveler));
        setPerUserUnlimited(res.data.usageLimitPerTraveler == null);
        setValidFrom(res.data.validFromUtc ? toVietnamDateTimeInput(res.data.validFromUtc) : res.data.validFrom);
        setValidTo(res.data.validToUtc ? toVietnamDateTimeInput(res.data.validToUtc) : res.data.validTo);
        setSelectedTourIds(res.data.appliedTourIds);
        setServerNotice({
          tone: 'success',
          message: coupon.status === 'Expired' && res.data.status === 'Inactive'
            ? couponEn.update.notices.expiredExtension
            : res.message || couponEn.update.notices.success,
        });
      } else if (res.status === 'VALIDATION_ERROR' && res.errors) {
        setErrors(res.errors);
        setServerNotice({
          tone: 'error',
          message: res.message || couponEn.update.notices.genericError,
        });
      } else {
        setConflict(res.status === 'CONFLICT');
        setServerNotice({
          tone: 'error',
          message: res.message || couponEn.update.notices.genericError,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReloadAfterConflict = async () => {
    const result = await getOperatorCouponById(coupon.id, { currentUserId });
    if (result.status !== 'SUCCESS' || !result.data) {
      setServerNotice({ tone: 'error', message: result.message || couponEn.update.notices.genericError });
      return;
    }
    const latest = result.data;
    setCoupon(latest);
    setName(latest.name);
    setDiscountValue(String(latest.discountValue));
    setMaxDiscountAmount(latest.maxDiscountAmount == null ? '' : String(latest.maxDiscountAmount));
    setMinSpend(latest.minSpend == null ? '' : String(latest.minSpend));
    setUsageLimit(latest.usageLimit == null ? '' : String(latest.usageLimit));
    setUsageUnlimited(latest.usageLimit === null);
    setUsageLimitPerTraveler(latest.usageLimitPerTraveler == null ? '' : String(latest.usageLimitPerTraveler));
    setPerUserUnlimited(latest.usageLimitPerTraveler == null);
    setValidFrom(latest.validFromUtc ? toVietnamDateTimeInput(latest.validFromUtc) : latest.validFrom);
    setValidTo(latest.validToUtc ? toVietnamDateTimeInput(latest.validToUtc) : latest.validTo);
    setSelectedTourIds(latest.appliedTourIds);
    setErrors({});
    setConflict(false);
    setServerNotice(null);
  };

  const handleConfirmStatusChange = async () => {
    setDialogLoading(true);
    try {
      const fn = dialogAction === 'deactivate' ? deactivateCoupon : activateCoupon;
      const res = await fn(coupon.id, {
        currentUserId,
      });

      if (res.status === 'SUCCESS' && res.data) {
        setCoupon(res.data);
        setDialogOpen(false);
        setServerNotice({
          tone: 'success',
          message: res.message || couponEn.update.notices.statusSuccess,
        });
      } else {
        setDialogOpen(false);
        setServerNotice({
          tone: 'error',
          message: res.message || couponEn.update.notices.genericError,
        });
      }
    } finally {
      setDialogLoading(false);
    }
  };

  const remainingUsages = coupon.usageLimit === null ? null : Math.max(0, coupon.usageLimit - coupon.usageCount);
  const expired = coupon.validToUtc ? Date.parse(coupon.validToUtc) <= now : isCouponExpired(coupon.validTo);
  const effectiveStatus = coupon.validFromUtc ? coupon.status : deriveCouponTemporalStatus(coupon);
  const startPassed = Boolean(coupon.validFromUtc && Date.parse(coupon.validFromUtc) <= now);

  return (
    <div className="space-y-6">
      {/* Back / Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={returnUrl}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
            aria-label={couponEn.update.backAria}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#00152A] sm:text-2xl">
                {couponEn.update.title.replace('{code}', coupon.couponCode)}
              </h1>
              <OperatorCouponStatusBadge status={effectiveStatus} />
            </div>
            <p className="text-xs text-slate-500">{couponEn.update.subtitle}</p>
          </div>
        </div>

        {/* Status Action Button */}
        {expired ? (
          <span
            role="status"
            className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800"
          >
            {couponEn.update.statusAction.expiredBlocked}
          </span>
        ) : coupon.status === 'Inactive' ? (
          <button
            type="button"
            onClick={() => {
              setDialogAction('activate');
              setDialogOpen(true);
            }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
          >
            {couponEn.update.statusAction.activate}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDialogAction('deactivate');
              setDialogOpen(true);
            }}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 transition"
          >
            {couponEn.update.statusAction.deactivate}
          </button>
        )}
      </div>

      {/* Server Notice Feedback */}
      {serverNotice && (
        <div
          role="alert"
          className={`rounded-2xl border p-4 text-xs font-bold ${
            serverNotice.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : serverNotice.tone === 'pending'
                ? 'border-blue-200 bg-blue-50 text-blue-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {serverNotice.message}
        </div>
      )}
      {conflict && (
        <button type="button" onClick={handleReloadAfterConflict}
          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100">
          {couponEn.update.actions.reloadLatest}
        </button>
      )}

      {/* Usage Information Metric Area */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {coupon.validFromUtc ? couponEn.update.metrics.occupied : couponEn.list.kpi.redemptions}
          </p>
          <p className="mt-1 text-xl font-black text-[#00152A] sm:text-2xl">
            {coupon.usageCount}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {coupon.usageLimit === null
              ? couponEn.update.metrics.unlimited
              : couponEn.update.metrics.limitMaximum.replace('{limit}', String(coupon.usageLimit))}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {couponEn.update.metrics.remaining}
          </p>
          <p className="mt-1 text-xl font-black text-[#006B5F] sm:text-2xl">
            {remainingUsages === null ? couponEn.update.metrics.unlimited : remainingUsages}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">{couponEn.update.metrics.available}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {couponEn.list.table.status}
          </p>
          <div className="mt-2">
            <OperatorCouponStatusBadge status={effectiveStatus} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {couponEn.list.table.validityPeriod}
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800 sm:text-base">
            {formatDate(coupon.validTo)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {couponEn.update.metrics.from.replace('{date}', formatDate(coupon.validFrom))}
          </p>
        </div>
      </div>

      {/* Booking Preservation Notice */}
      {coupon.usageCount > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0">
              history
            </span>
            <div className="space-y-1">
              <p className="font-extrabold">{couponEn.update.bookingPreservation.title}</p>
              <p className="text-amber-800 leading-relaxed">
                {coupon.validFromUtc
                  ? couponEn.update.bookingPreservation.occupied
                  : couponEn.update.bookingPreservation.redeemed.replace(
                    '{count}', String(coupon.usageCount)
                  )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Area */}
      <form
        onSubmit={handleSave}
        noValidate
        aria-label={couponEn.update.formAriaLabel}
        aria-busy={saving}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        {/* Left Column: Form Fields (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-[#00152A] border-b border-slate-100 pb-3">
              1. {couponEn.create.sections.general}
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Read-Only Coupon Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {couponEn.create.fields.couponCode}
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">lock</span>
                  <span className="font-mono text-xs font-black tracking-wider text-slate-800">
                    {coupon.couponCode}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {couponEn.update.couponCodeNote}
                </p>
              </div>

              {/* Coupon Name */}
              <div>
                <label htmlFor="couponName" className="block text-xs font-bold text-slate-700 mb-1">
                  {couponEn.create.fields.name} <span className="text-rose-600">*</span>
                </label>
                <input
                  id="couponName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'couponName-error' : undefined}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs transition focus:outline-hidden focus:ring-2 focus:ring-[#006B5F] ${
                    errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-white'
                  }`}
                />
                {errors.name && (
                  <p id="couponName-error" role="alert" className="mt-1 text-xs font-bold text-rose-600">
                    {errors.name}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs font-bold text-slate-700">
              {couponEn.update.discountTypeLabel}: <span className="font-mono text-slate-900">{coupon.discountType}</span>
              <span className="ml-2 text-slate-500">({couponEn.update.readOnly})</span>
            </p>

            {/* Discount Values */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="discountValue" className="block text-xs font-bold text-slate-700 mb-1">
                  {couponEn.create.fields.discountValue} <span className="text-rose-600">*</span>
                </label>
                <input
                  id="discountValue"
                  type="number"
                  min="1"
                  max={coupon.discountType === 'Percentage' ? 100 : undefined}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  aria-invalid={Boolean(errors.discountValue)}
                  aria-describedby={errors.discountValue ? 'discountValue-error' : undefined}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-bold transition focus:outline-hidden focus:ring-2 focus:ring-[#006B5F] ${
                    errors.discountValue ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-white'
                  }`}
                />
                {errors.discountValue && (
                  <p id="discountValue-error" role="alert" className="mt-1 text-xs font-bold text-rose-600">
                    {errors.discountValue}
                  </p>
                )}
              </div>

              {coupon.discountType === 'Percentage' && (
                <div>
                  <label htmlFor="maxDiscountAmount" className="block text-xs font-bold text-slate-700 mb-1">
                    {couponEn.create.fields.maxDiscountAmount}
                  </label>
                  <input
                    id="maxDiscountAmount"
                    type="number"
                    min="0"
                    step="10000"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs transition focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]"
                  />
                </div>
              )}

              <div>
                <label htmlFor="minSpend" className="block text-xs font-bold text-slate-700 mb-1">
                  {couponEn.create.fields.minSpend}
                </label>
                <input
                  id="minSpend"
                  type="number"
                  min="0"
                  step="50000"
                  value={minSpend}
                  onChange={(e) => setMinSpend(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs transition focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]"
                />
              </div>
            </div>
          </div>

          {/* Usage Limit & Validity */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-[#00152A] border-b border-slate-100 pb-3">
              2. {couponEn.create.sections.validity}
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Usage Limit with floor check */}
              <div>
                <label htmlFor="usageLimit" className="block text-xs font-bold text-slate-700 mb-1">
                  {couponEn.create.fields.usageLimit}
                </label>
                <label className="mb-2 flex items-center gap-2 text-xs text-slate-700">
                  <input type="checkbox" checked={usageUnlimited} onChange={(e) => setUsageUnlimited(e.target.checked)} />
                  {couponEn.update.usage.unlimited}
                </label>
                <input
                  id="usageLimit"
                  type="number"
                  min={Math.max(1, coupon.usageCount)}
                  step={1}
                  value={usageLimit}
                  disabled={usageUnlimited}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  aria-invalid={Boolean(errors.usageLimit)}
                  aria-describedby={errors.usageLimit ? 'usageLimit-error' : 'usageLimit-desc'}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-bold transition focus:outline-hidden focus:ring-2 focus:ring-[#006B5F] ${
                    errors.usageLimit ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-white'
                  }`}
                />
                <p id="usageLimit-desc" className="mt-1 text-[11px] text-slate-400">
                  {coupon.validFromUtc
                    ? couponEn.update.usage.occupiedMinimum.replace('{count}', String(coupon.usageCount))
                    : couponEn.update.usage.redeemedMinimum.replace('{count}', String(coupon.usageCount))}
                </p>
                {!usageUnlimited
                  && usageLimit.trim() !== ''
                  && Number(usageLimit) === coupon.usageCount && (
                  <p role="status" className="mt-1 text-[11px] font-semibold text-amber-700">
                    {couponEn.update.usage.currentlyFull}
                  </p>
                )}
                {errors.usageLimit && (
                  <p id="usageLimit-error" role="alert" className="mt-1 text-xs font-bold text-rose-600">
                    {errors.usageLimit}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="usageLimitPerTraveler"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  {couponEn.create.fields.usageLimitPerTraveler}
                </label>
                <label className="mb-2 flex items-center gap-2 text-xs text-slate-700">
                  <input type="checkbox" checked={perUserUnlimited} onChange={(e) => setPerUserUnlimited(e.target.checked)} />
                  {couponEn.update.usage.unlimitedPerTraveler}
                </label>
                <input
                  id="usageLimitPerTraveler"
                  type="number"
                  min={1}
                  step={1}
                  value={usageLimitPerTraveler}
                  disabled={perUserUnlimited}
                  onChange={(e) => setUsageLimitPerTraveler(e.target.value)}
                  aria-invalid={Boolean(errors.usageLimitPerTraveler)}
                  aria-describedby={
                    errors.usageLimitPerTraveler ? 'usageLimitPerTraveler-error' : undefined
                  }
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs transition focus:outline-hidden focus:ring-2 focus:ring-[#006B5F] ${
                    errors.usageLimitPerTraveler
                      ? 'border-rose-400 bg-rose-50/30'
                      : 'border-slate-200 bg-white'
                  }`}
                />
                {errors.usageLimitPerTraveler && (
                  <p
                    id="usageLimitPerTraveler-error"
                    role="alert"
                    className="mt-1 text-xs font-bold text-rose-600"
                  >
                    {errors.usageLimitPerTraveler}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="validFrom" className="block text-xs font-bold text-slate-700 mb-1">
                  {couponEn.create.fields.validFrom} {coupon.validFromUtc ? `(${couponEn.update.timezone})` : ''} <span className="text-rose-600">*</span>
                </label>
                <input
                  id="validFrom"
                  type={coupon.validFromUtc ? 'datetime-local' : 'date'}
                  value={validFrom}
                  disabled={startPassed}
                  onChange={(e) => setValidFrom(e.target.value)}
                  aria-invalid={Boolean(errors.validFrom)}
                  aria-describedby={errors.validFrom ? 'validFrom-error' : undefined}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs transition focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]"
                />
                {errors.validFrom && <p id="validFrom-error" role="alert" className="mt-1 text-xs font-bold text-rose-600">{errors.validFrom}</p>}
              </div>

              <div>
                <label htmlFor="validTo" className="block text-xs font-bold text-slate-700 mb-1">
                  {couponEn.create.fields.validTo} {coupon.validToUtc ? `(${couponEn.update.timezone})` : ''} <span className="text-rose-600">*</span>
                </label>
                <input
                  id="validTo"
                  type={coupon.validToUtc ? 'datetime-local' : 'date'}
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  aria-invalid={Boolean(errors.validTo)}
                  aria-describedby={errors.validTo ? 'validTo-error' : undefined}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs transition focus:outline-hidden focus:ring-2 focus:ring-[#006B5F] ${
                    errors.validTo ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-white'
                  }`}
                />
                {errors.validTo && (
                  <p id="validTo-error" role="alert" className="mt-1 text-xs font-bold text-rose-600">
                    {errors.validTo}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tour Scope */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-[#00152A] border-b border-slate-100 pb-3">
              3. {couponEn.create.sections.scope}
            </h2>

            {eligibleTours.length === 0 && (
              <div
                role="status"
                className="rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-900"
              >
                <p className="font-extrabold">{couponEn.create.fields.noEligibleToursTitle}</p>
                <p className="mt-1 text-amber-800 leading-relaxed">
                  {couponEn.create.fields.noEligibleToursHelp}
                </p>
              </div>
            )}

            <p className="text-xs text-slate-600">
              {couponEn.update.scopeSelection.replace(
                '{count}', String(appliesToAllTours ? eligibleTours.length : selectedTourIds.length)
              )}
            </p>

            <label
              className={`flex items-center gap-2.5 text-xs font-bold ${
                eligibleTours.length > 0
                  ? 'text-slate-800 cursor-pointer'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <input
                type="checkbox"
                checked={appliesToAllTours}
                disabled={eligibleTours.length === 0}
                onChange={(e) => setAppliesToAllTours(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#006B5F] focus:ring-[#006B5F] disabled:opacity-50"
              />
              <span>{couponEn.create.fields.appliesToAllTours}</span>
            </label>

            {!appliesToAllTours && (
              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {couponEn.create.fields.selectedToursCount.replace(
                    '{count}',
                    String(selectedTourIds.length)
                  )}
                </p>

                {eligibleTours.length > 0 && (
                  <div className="max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 p-2">
                    {eligibleTours.map((tour) => {
                      const isSelected = selectedTourIds.includes(tour.id);
                      return (
                        <label
                          key={tour.id}
                          className="flex items-center justify-between p-2 text-xs hover:bg-slate-50 rounded-lg cursor-pointer transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleTourSelection(tour.id)}
                              className="h-4 w-4 rounded border-slate-300 text-[#006B5F] focus:ring-[#006B5F]"
                            />
                            <div className="truncate">
                              <span className="font-bold text-slate-800">{tour.title}</span>
                              <span className="ml-2 font-mono text-[10px] text-slate-400">
                                ({tour.tourCode})
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 shrink-0 ml-2">
                            {formatCurrency(tour.basePrice)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {errors.appliedTourIds && (
              <p role="alert" className="text-xs font-bold text-rose-600">
                {errors.appliedTourIds}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              {couponEn.update.actions.sectionTitle}
            </h2>

            <button
              type="submit"
              disabled={saving || eligibleTours.length === 0}
              className="w-full rounded-xl bg-[#006B5F] py-3 text-xs font-bold text-white shadow-xs hover:bg-[#005249] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? couponEn.update.actions.saving : couponEn.update.actions.save}
            </button>

            <span role="status" aria-live="polite" className="sr-only">
              {saving ? couponEn.update.actions.saving : ''}
            </span>

            <Link
              href={returnUrl}
              className="block w-full text-center rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              {couponEn.update.actions.cancel}
            </Link>
          </div>
        </div>
      </form>

      {/* Confirmation Dialog (CR-05) */}
      <DeactivateCouponDialog
        open={dialogOpen}
        action={dialogAction}
        couponCode={coupon.couponCode}
        usageCount={coupon.usageCount}
        loading={dialogLoading}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  );
}
