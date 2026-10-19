import React from 'react';
import type { CouponStatus } from '../types/couponLifecycle';
import { couponEn } from '../resources/en';

interface OperatorCouponStatusBadgeProps {
  status: CouponStatus;
  className?: string;
}

export function OperatorCouponStatusBadge({
  status,
  className = '',
}: OperatorCouponStatusBadgeProps) {
  let label: string = couponEn.statuses.unknown;
  let badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotStyles = 'bg-slate-400';

  switch (status) {
    case 'Active':
      label = couponEn.statuses.active;
      badgeStyles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      dotStyles = 'bg-emerald-500';
      break;
    case 'Scheduled':
      label = couponEn.statuses.scheduled;
      badgeStyles = 'bg-blue-50 text-blue-800 border-blue-200';
      dotStyles = 'bg-blue-500';
      break;
    case 'Inactive':
      label = couponEn.statuses.inactive;
      badgeStyles = 'bg-slate-100 text-slate-700 border-slate-300';
      dotStyles = 'bg-slate-400';
      break;
    case 'Expired':
      label = couponEn.statuses.expired;
      badgeStyles = 'bg-amber-50 text-amber-800 border-amber-200';
      dotStyles = 'bg-amber-500';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badgeStyles} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
