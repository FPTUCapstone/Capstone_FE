import React from 'react';
import type { BookingStatus, CheckInStatus } from '../types/bookingLifecycle';
import { bookingEn } from '../resources/en';

interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

export function BookingStatusBadge({ status, className = '' }: BookingStatusBadgeProps) {
  switch (status) {
    case 'Confirmed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          {bookingEn.statuses.Confirmed}
        </span>
      );
    case 'PendingPayment':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/60 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
          {bookingEn.statuses.PendingPayment}
        </span>
      );
    case 'Cancelled':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200/60 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden="true" />
          {bookingEn.statuses.Cancelled}
        </span>
      );
    case 'Completed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200/60 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" aria-hidden="true" />
          {bookingEn.statuses.Completed}
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ${className}`}
        >
          {status}
        </span>
      );
  }
}

interface CheckInStatusBadgeProps {
  status: CheckInStatus;
  className?: string;
}

export function CheckInStatusBadge({ status, className = '' }: CheckInStatusBadgeProps) {
  if (status === 'CheckedIn') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/60 ${className}`}
      >
        <span className="material-symbols-outlined text-[14px]">done</span>
        {bookingEn.checkInStatuses.CheckedIn}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500 border border-slate-200 ${className}`}
    >
      <span className="material-symbols-outlined text-[14px]">schedule</span>
      {bookingEn.checkInStatuses.NotCheckedIn}
    </span>
  );
}
