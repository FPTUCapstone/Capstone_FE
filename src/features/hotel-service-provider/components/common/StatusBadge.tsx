'use client';

import React from 'react';
import type { BookingRequestStatus, StatementStatus } from '../../types';
import { hotelProviderEn } from '../../resources/en';

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
      label: hotelProviderEn.statuses.pendingConfirmation,
      bg: 'bg-[#FEF3E2]',
      text: 'text-[#92400E]',
      border: 'border-[#FDE68A]',
      icon: 'schedule',
    },
    Confirmed: {
      label: hotelProviderEn.statuses.confirmed,
      bg: 'bg-[#E6F7F0]',
      text: 'text-[#065F46]',
      border: 'border-[#A7F3D0]',
      icon: 'check_circle',
    },
    Rejected: {
      label: hotelProviderEn.statuses.rejected,
      bg: 'bg-[#FDECEF]',
      text: 'text-[#991B1B]',
      border: 'border-[#FECDD3]',
      icon: 'cancel',
    },
    Cancelled: {
      label: hotelProviderEn.statuses.cancelled,
      bg: 'bg-[#F1F5F9]',
      text: 'text-[#475569]',
      border: 'border-[#CBD5E1]',
      icon: 'block',
    },
    Expired: {
      label: hotelProviderEn.statuses.expired,
      bg: 'bg-[#F1F5F9]',
      text: 'text-[#64748B]',
      border: 'border-[#CBD5E1]',
      icon: 'timer_off',
    },
    Completed: {
      label: hotelProviderEn.statuses.completed,
      bg: 'bg-[#E8F7F4]',
      text: 'text-[#103B39]',
      border: 'border-[#B2DFDB]',
      icon: 'verified',
    },
    NoShow: {
      label: hotelProviderEn.statuses.noShow,
      bg: 'bg-[#F1EBFE]',
      text: 'text-[#5B21B6]',
      border: 'border-[#DDD6FE]',
      icon: 'person_off',
    },

    // Statement statuses
    Issued: {
      label: hotelProviderEn.statuses.issued,
      bg: 'bg-[#EFF6FF]',
      text: 'text-[#1D4ED8]',
      border: 'border-[#BFDBFE]',
      icon: 'receipt_long',
    },
    PaymentReported: {
      label: hotelProviderEn.statuses.paymentReported,
      bg: 'bg-[#FEF3E2]',
      text: 'text-[#B45309]',
      border: 'border-[#FDE68A]',
      icon: 'hourglass_top',
    },
    Paid: {
      label: hotelProviderEn.statuses.paid,
      bg: 'bg-[#E6F7F0]',
      text: 'text-[#065F46]',
      border: 'border-[#A7F3D0]',
      icon: 'task_alt',
    },
    Overdue: {
      label: hotelProviderEn.statuses.overdue,
      bg: 'bg-[#FDECEF]',
      text: 'text-[#B91C1C]',
      border: 'border-[#FECDD3]',
      icon: 'warning',
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

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      <span className="material-symbols-outlined text-[13px] leading-none shrink-0" aria-hidden="true">
        {config.icon}
      </span>
      <span className="whitespace-nowrap">{config.label}</span>
    </span>
  );
}
