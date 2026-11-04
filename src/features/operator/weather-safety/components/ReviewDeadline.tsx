import React from 'react';
import type { WeatherSafetyReviewStatus } from '../types';

interface ReviewDeadlineProps {
  deadlineUtc: string | null;
  status: WeatherSafetyReviewStatus;
  className?: string;
}

export function ReviewDeadline({ deadlineUtc, status, className = '' }: ReviewDeadlineProps) {
  if (!deadlineUtc) {
    return <span className={`text-slate-400 text-xs ${className}`}>Không có hạn SLA</span>;
  }

  const isEscalated = status === 'Escalated';
  const formattedDate = new Date(deadlineUtc).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex items-center gap-1.5 text-xs ${isEscalated ? 'text-rose-700 font-semibold' : 'text-slate-600'} ${className}`}>
      <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
        {isEscalated ? 'alarm_on' : 'schedule'}
      </span>
      <span>Hạn xử lý:</span>
      <time role="time" dateTime={deadlineUtc} className="font-medium">
        {formattedDate} (ICT)
      </time>
      {isEscalated && (
        <span className="ml-1 inline-flex items-center text-rose-700 font-bold bg-rose-100 px-1.5 py-0.5 rounded text-[11px]">
          Quá hạn phản hồi
        </span>
      )}
    </div>
  );
}
