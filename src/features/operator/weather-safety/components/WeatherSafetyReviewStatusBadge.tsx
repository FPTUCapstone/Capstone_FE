import React from 'react';
import type { WeatherSafetyReviewStatus } from '../types';

interface WeatherSafetyReviewStatusBadgeProps {
  status: WeatherSafetyReviewStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  WeatherSafetyReviewStatus,
  { label: string; bg: string; text: string; icon: string }
> = {
  PendingAcknowledgement: {
    label: 'Chờ xác nhận',
    bg: 'bg-amber-50 border border-amber-200',
    text: 'text-amber-800',
    icon: 'hourglass_empty',
  },
  Escalated: {
    label: 'Quá hạn xác nhận',
    bg: 'bg-rose-50 border border-rose-300',
    text: 'text-rose-800 font-bold',
    icon: 'warning',
  },
  Acknowledged: {
    label: 'Đã xem',
    bg: 'bg-blue-50 border border-blue-200',
    text: 'text-blue-800',
    icon: 'check_circle',
  },
  Closed: {
    label: 'Đã đóng',
    bg: 'bg-slate-100 border border-slate-200',
    text: 'text-slate-600',
    icon: 'archive',
  },
};

export function WeatherSafetyReviewStatusBadge({
  status,
  className = '',
}: WeatherSafetyReviewStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Closed;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} ${className}`}
      aria-label={`Trạng thái: ${config.label}`}
    >
      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
        {config.icon}
      </span>
      <span>{config.label}</span>
    </span>
  );
}
