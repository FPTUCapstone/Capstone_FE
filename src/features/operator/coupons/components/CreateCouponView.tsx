'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type {
  CreateCouponPayload,
  DiscountType,
  EligibleTourDto,
} from '../types/couponLifecycle';
import {
  resolveCouponReturnUrl,
} from '../routes';
import {
  createCoupon,
  getTodayDateString,
  validateCreateCoupon,
} from '../services/operatorCouponService';
import { couponEn } from '../resources/en';

interface CreateCouponViewProps {
  eligibleTours: EligibleTourDto[];
  currentUserId?: number | string;
  isDemo?: boolean;
  operatorName?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function CreateCouponView({
  eligibleTours,
  currentUserId,
  isDemo = false,
  operatorName = 'Han River Travel',
}: CreateCouponViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = resolveCouponReturnUrl(searchParams?.get('returnUrl'), isDemo);

  // Form states
  const [couponCode, setCouponCode] = useState('');
  const [name, setName] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('Percentage');
  const [discountValue, setDiscountValue] = useState<string>('15');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>('500000');
  const [minSpend, setMinSpend] = useState<string>('1000000');
  const [usageLimit, setUsageLimit] = useState<string>('100');
  const [usageLimitPerTraveler, setUsageLimitPerTraveler] = useState<string>('1');

  // Dates (default to today and 30 days later in Asia/Ho_Chi_Minh)
  const [validFrom, setValidFrom] = useState(() => getTodayDateString());
  const [validTo, setValidTo] = useState(() =>
    getTodayDateString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  );

  // Scope
  const [appliesToAllTours, setAppliesToAllTours] = useState(true);
  const [selectedTourIds, setSelectedTourIds] = useState<string[]>([]);

  // Submission & Validation
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverNotice, setServerNotice] = useState<{
    tone: 'error' | 'success' | 'pending';
    message: string;
  } | null>(null);

  const toggleTourSelection = (tourId: string) => {
    setSelectedTourIds((prev) =>
      prev.includes(tourId) ? prev.filter((id) => id !== tourId) : [...prev, tourId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerNotice(null);

    const payload: CreateCouponPayload = {
      couponCode: couponCode.trim().toUpperCase(),
      name: name.trim(),
      discountType,
      discountValue: discountValue.trim() !== '' ? Number(discountValue) : 0,
      maxDiscountAmount: maxDiscountAmount.trim() !== '' ? Number(maxDiscountAmount) : null,
      minSpend: minSpend.trim() !== '' ? Number(minSpend) : null,
      usageLimit: usageLimit.trim() !== '' ? Number(usageLimit) : 0,
      usageLimitPerTraveler:
        usageLimitPerTraveler.trim() !== '' ? Number(usageLimitPerTraveler) : null,
      validFrom,
      validTo,
      appliesToAllTours,
      appliedTourIds: appliesToAllTours ? [] : selectedTourIds,
    };

    const ownedTourIds = eligibleTours.map((t) => t.id);
    const clientErrors = validateCreateCoupon(payload, { ownedTourIds });

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }
    setErrors({});

    // Production Truthfulness: If not in demo mode, do not simulate fake save
    if (!isDemo) {
      setServerNotice({
        tone: 'pending',
        message: couponEn.create.notices.productionPending,
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await createCoupon(payload, {
        allowDemo: true,
        currentUserId,
      });
      if (res.status === 'SUCCESS') {
        setServerNotice({
          tone: 'success',
          message: res.message || couponEn.create.notices.success,
        });
        setTimeout(() => {
          router.push(returnUrl);
        }, 800);
      } else if (res.status === 'VALIDATION_ERROR' && res.errors) {
        setErrors(res.errors);
        setServerNotice({
          tone: 'error',
          message: res.message || couponEn.create.notices.genericError,
        });
      } else {
        setServerNotice({
          tone: 'error',
          message: res.message || couponEn.create.notices.genericError,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back / Navigation Header */}
      <div className="flex items-center gap-3">
        <Link
          href={returnUrl}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
          aria-label={couponEn.create.backAria}
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-[#00152A] sm:text-2xl">
            {couponEn.create.title}
          </h1>
          <p className="text-xs text-slate-500">{couponEn.create.subtitle}</p>
        </div>
      </div>

      {/* Production Truthfulness Notice */}
      {!isDemo && (
        <div
          role="status"
          className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-xs text-blue-900 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] text-blue-600 shrink-0">
              info
            </span>
            <div className="space-y-1">
              <p className="font-extrabold">{couponEn.list.banners.productionTitle}</p>
              <p className="text-blue-700 leading-relaxed">
                {couponEn.create.notices.productionPending}
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* 2-Column Responsive Layout */}
      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Form Fields (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: General Info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-[#00152A] border-b border-slate-100 pb-3">
              1. {couponEn.create.sections.general}
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Coupon Code */}
              <div>
                <label
                  htmlFor="couponCode"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  {couponEn.create.fields.couponCode} <span className="text-rose-600">*</span>
                </label>
                <input
                  id="couponCode"
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder={couponEn.create.fields.couponCodePlaceholder}
                  aria-invalid={Boolean(errors.couponCode)}
                  aria-describedby={errors.couponCode ? 'couponCode-error' : 'couponCode-desc'}
                  className={`w-full rounded-xl border px-3.5 py-2.5 font-mono text-xs font-bold tracking-wider uppercase transition focus:outline-hidden focus:ring-2 focus:ring-[#006B5F] ${
                    errors.couponCode ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-white'
                  }`}
                />
                <p id="couponCode-desc" className="mt-1 text-[11px] text-slate-400">
                  {couponEn.create.fields.couponCodeHelp}
                </p>
                {errors.couponCode && (
                  <p id="couponCode-error" role="alert" className="mt-1 text-xs font-bold text-rose-600">
                    {errors.couponCode}
                  </p>
                )}
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
                  placeholder={couponEn.create.fields.namePlaceholder}
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

            {/* Discount Type Segments */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {couponEn.create.fields.discountType} <span className="text-rose-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setDiscountType('Percentage')}
                  className={`rounded-lg py-2 text-xs font-bold transition ${
                    discountType === 'Percentage'
                      ? 'bg-white text-[#006B5F] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {couponEn.create.fields.discountTypePercentage}
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('Flat')}
                  className={`rounded-lg py-2 text-xs font-bold transition ${
                    discountType === 'Flat'
                      ? 'bg-white text-[#006B5F] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {couponEn.create.fields.discountTypeFlat}
                </button>
              </div>
            </div>

            {/* Discount Values & Caps */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="discountValue" className="block text-xs font-bold text-slate-700 mb-1">
                  {couponEn.create.fields.discountValue} <span className="text-rose-600">*</span>
                </label>
                <input
                  id="discountValue"
                  type="number"
                  min="1"
                  max={discountType === 'Percentage' ? 100 : undefined}
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

              {discountType === 'Percentage' && (
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
                    placeholder={couponEn.create.fields.maxDiscountAmountPlaceholder}
                    aria-invalid={Boolean(errors.maxDiscountAmount)}
                    aria-describedby={errors.maxDiscountAmount ? 'maxDiscountAmount-error' : undefined}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs transition focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]"
                  />
                  {errors.maxDiscountAmount && (
                    <p id="maxDiscountAmount-error" role="alert" className="mt-1 text-xs font-bold text-rose-600">
                      {errors.maxDiscountAmount}
                    </p>
                  )}
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
                  placeholder={couponEn.create.fields.minSpendPlaceholder}
                  aria-invalid={Boolean(errors.minSpend)}
                  aria-describedby={errors.minSpend ? 'minSpend-error' : undefined}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs transition focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]"
                />
                {errors.minSpend && (
                  <p id="minSpend-error" role="alert" className="mt-1 text-xs font-bold text-rose-600">
                    {errors.minSpend}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Validity & Usage Limits */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-[#00152A] border-b border-slate-100 pb-3">
              2. {couponEn.create.sections.validity}
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="usageLimit" className="block text-xs font-bold text-slate-700 mb-1">
                  {couponEn.create.fields.usageLimit} <span className="text-rose-600">*</span>
                </label>
                <input
                  id="usageLimit"
                  type="number"
                  min={1}
                  step={1}
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="100"
                  aria-invalid={Boolean(errors.usageLimit)}
                  aria-describedby={errors.usageLimit ? 'usageLimit-error' : undefined}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-bold transition focus:outline-hidden focus:ring-2 focus:ring-[#006B5F] ${
                    errors.usageLimit ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-white'
                  }`}
                />
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
                <input
                  id="usageLimitPerTraveler"
                  type="number"
                  min={1}
                  step={1}
                  value={usageLimitPerTraveler}
                  onChange={(e) => setUsageLimitPerTraveler(e.target.value)}
                  placeholder={couponEn.create.fields.usageLimitPerTravelerPlaceholder}
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
                  {couponEn.create.fields.validFrom} <span className="text-rose-600">*</span>
                </label>
                <input
                  id="validFrom"
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  aria-invalid={Boolean(errors.validFrom)}
                  aria-describedby={errors.validFrom ? 'validFrom-error' : undefined}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs transition focus:outline-hidden focus:ring-2 focus:ring-[#006B5F] ${
                    errors.validFrom ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-white'
                  }`}
                />
                {errors.validFrom && (
                  <p id="validFrom-error" role="alert" className="mt-1 text-xs font-bold text-rose-600">
                    {errors.validFrom}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="validTo" className="block text-xs font-bold text-slate-700 mb-1">
                  {couponEn.create.fields.validTo} <span className="text-rose-600">*</span>
                </label>
                <input
                  id="validTo"
                  type="date"
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

          {/* Card 3: Eligible Tour Scope */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-[#00152A]">
                3. {couponEn.create.sections.scope}
              </h2>
            </div>

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

        {/* Right Column: Visual Preview & Submit Controls (Span 1) */}
        <div className="space-y-6">
          {/* Visual Coupon Card Preview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Coupon Preview
            </h2>

            {/* Gradient Voucher Card */}
            <div className="rounded-2xl bg-gradient-to-br from-[#006B5F] to-[#004D40] p-5 text-white shadow-md space-y-3">
              <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest text-emerald-200">
                <span>{operatorName}</span>
                <span>Voucher</span>
              </div>

              <div className="py-2 text-center">
                <span className="font-mono text-2xl font-black tracking-widest">
                  {couponCode || 'COUPON_CODE'}
                </span>
                <p className="mt-1 text-xs font-medium text-emerald-100">
                  {discountType === 'Percentage'
                    ? `${discountValue || 0}% Off${
                        maxDiscountAmount
                          ? ` (Up to ${formatCurrency(Number(maxDiscountAmount))})`
                          : ''
                      }`
                    : `${formatCurrency(Number(discountValue) || 0)} Off`}
                </p>
              </div>

              <div className="border-t border-emerald-500/40 pt-2 text-center text-[10px] text-emerald-200">
                Validity: {formatDate(validFrom) || '--'} to {formatDate(validTo) || '--'}
              </div>
            </div>

            {/* Simulated Savings Box */}
            <div className="rounded-xl bg-slate-50 p-3.5 text-xs space-y-2 border border-slate-100">
              <p className="font-bold text-slate-700">Example: 2,000,000 ₫ booking</p>
              <div className="flex justify-between text-slate-500">
                <span>Estimated discount:</span>
                <span className="font-bold text-[#006B5F]">
                  {discountType === 'Percentage'
                    ? `-${formatCurrency(
                        Math.min(
                          (2000000 * (Number(discountValue) || 0)) / 100,
                          maxDiscountAmount ? Number(maxDiscountAmount) : Infinity
                        )
                      )}`
                    : `-${formatCurrency(Math.min(2000000, Number(discountValue) || 0))}`}
                </span>
              </div>
              <div className="flex justify-between text-slate-700 font-bold border-t border-slate-200 pt-1.5">
                <span>Customer pays:</span>
                <span>
                  {discountType === 'Percentage'
                    ? formatCurrency(
                        Math.max(
                          0,
                          2000000 -
                            Math.min(
                              (2000000 * (Number(discountValue) || 0)) / 100,
                              maxDiscountAmount ? Number(maxDiscountAmount) : Infinity
                            )
                        )
                      )
                    : formatCurrency(Math.max(0, 2000000 - (Number(discountValue) || 0)))}
                </span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <button
              type="submit"
              disabled={submitting || eligibleTours.length === 0}
              className="w-full rounded-xl bg-[#006B5F] py-3 text-xs font-bold text-white shadow-xs hover:bg-[#005249] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? couponEn.create.actions.submitting
                : couponEn.create.actions.submit}
            </button>

            <Link
              href={returnUrl}
              className="block w-full text-center rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              {couponEn.create.actions.cancel}
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
