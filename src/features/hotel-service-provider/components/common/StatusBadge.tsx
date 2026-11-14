'use client';

import React from 'react';
import type { BookingRequestStatus, StatementStatus } from '../../types';
import { hotelProviderVi } from '../../resources/vi';

interface StatusBadgeProps {
  status: BookingRequestStatus | StatementStatus | string;
  className?: string;
  size?: 'sm' | 'md';
}

interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: string;
}

export function StatusBadge({ status, className = '', size = 'md' }: StatusBadgeProps) {
  const configs: Record<string, StatusConfig> = {
    // Booking statuses
    PendingConfirmation: {
      label: hotelProviderVi.statuses.pendingConfirmation,
      bg: 'bg-[#FEF3E2]',
      text: 'text-[#92400E]',
      border: 'border-[#FDE68A]',
      icon: 'schedule',
    },
    Confirmed: {
      label: hotelProviderVi.statuses.confirmed,
      bg: 'bg-[#E6F7F0]',
      text: 'text-[#065F46]',
      border: 'border-[#A7F3D0]',
      icon: 'check_circle',
    },
    Rejected: {
      label: hotelProviderVi.statuses.rejected,
      bg: 'bg-[#FDECEF]',
      text: 'text-[#991B1B]',
      border: 'border-[#FECDD3]',
      icon: 'cancel',
    },
    Cancelled: {
      label: hotelProviderVi.statuses.cancelled,
      bg: 'bg-[#F1F5F9]',
      text: 'text-[#475569]',
      border: 'border-[#CBD5E1]',
      icon: 'block',
    },
    Expired: {
      label: hotelProviderVi.statuses.expired,
      bg: 'bg-[#F1F5F9]',
      text: 'text-[#64748B]',
      border: 'border-[#CBD5E1]',
      icon: 'timer_off',
    },
    Completed: {
      label: hotelProviderVi.statuses.completed,
      bg: 'bg-[#E8F7F4]',
      text: 'text-[#103B39]',
      border: 'border-[#B2DFDB]',
      icon: 'verified',
    },
    NoShow: {
      label: hotelProviderVi.statuses.noShow,
      bg: 'bg-[#F1EBFE]',
      text: 'text-[#5B21B6]',
      border: 'border-[#DDD6FE]',
      icon: 'person_off',
    },

    // Statement statuses
    Issued: {
      label: hotelProviderVi.statuses.issued,
      bg: 'bg-[#EFF6FF]',
      text: 'text-[#1D4ED8]',
      border: 'border-[#BFDBFE]',
      icon: 'receipt_long',
    },
    PaymentReported: {
      label: hotelProviderVi.statuses.paymentReported,
      bg: 'bg-[#FEF3E2]',
      text: 'text-[#B45309]',
      border: 'border-[#FDE68A]',
      icon: 'hourglass_top',
    },
    Paid: {
      label: hotelProviderVi.statuses.paid,
      bg: 'bg-[#E6F7F0]',
      text: 'text-[#065F46]',
      border: 'border-[#A7F3D0]',
      icon: 'task_alt',
    },
    Overdue: {
      label: hotelProviderVi.statuses.overdue,
      bg: 'bg-[#FDECEF]',
      text: 'text-[#B91C1C]',
      border: 'border-[#FECDD3]',
      icon: 'warning',
    },

    // POI & General statuses
    Active: {
      label: hotelProviderVi.statuses.active,
      bg: 'bg-[#E6F7F0]',
      text: 'text-[#065F46]',
      border: 'border-[#A7F3D0]',
      icon: 'check_circle',
    },
    Inactive: {
      label: hotelProviderVi.statuses.inactive,
      bg: 'bg-[#F1F5F9]',
      text: 'text-[#64748B]',
      border: 'border-[#CBD5E1]',
      icon: 'pause_circle',
    },
  };

  const config = configs[status] || {
    label: status,
    bg: 'bg-[#F1F5F9]',
    text: 'text-[#475569]',
    border: 'border-[#CBD5E1]',
    icon: 'info',
  };

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5';

  const iconSizes = size === 'sm' ? 'text-[13px]' : 'text-[15px]';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-2xs whitespace-nowrap select-none ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      <span className={`material-symbols-outlined shrink-0 ${iconSizes}`} aria-hidden="true">
        {config.icon}
      </span>
      <span>{config.label}</span>
    </span>
  );
}
