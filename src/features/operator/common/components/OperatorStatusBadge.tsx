import { operatorVi } from '../resources/vi';

export interface OperatorStatusBadgeProps {
  status: string;
  label?: string;
  showDot?: boolean;
  className?: string;
}

interface StatusStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
  defaultLabel: string;
}

const STATUS_MAP: Record<string, StatusStyle> = {
  Approved: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    defaultLabel: operatorVi.statuses.approved,
  },
  Confirmed: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    defaultLabel: operatorVi.statuses.confirmed,
  },
  Settled: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    defaultLabel: operatorVi.statuses.settled,
  },
  Active: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    defaultLabel: operatorVi.statuses.active,
  },
  Pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    defaultLabel: operatorVi.statuses.pending,
  },
  PendingReview: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    defaultLabel: operatorVi.statuses.pendingReview,
  },
  InReview: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    defaultLabel: operatorVi.statuses.pendingReview,
  },
  Draft: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    defaultLabel: operatorVi.statuses.draft,
  },
  Open: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    defaultLabel: operatorVi.statuses.open,
  },
  Closed: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    defaultLabel: operatorVi.statuses.closed,
  },
  Inactive: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    defaultLabel: operatorVi.statuses.inactive,
  },
  Rejected: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    defaultLabel: operatorVi.statuses.rejected,
  },
  Cancelled: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    defaultLabel: operatorVi.statuses.cancelled,
  },
  Failed: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    defaultLabel: 'Thất bại',
  },
};

export function OperatorStatusBadge({
  status,
  label,
  showDot = true,
  className = '',
}: OperatorStatusBadgeProps) {
  const style = STATUS_MAP[status] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-500',
    defaultLabel: status,
  };

  const displayText = label || style.defaultLabel;

  return (
    <span
      data-testid="operator-status-badge"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap shrink-0 ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      {showDot && (
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      )}
      <span>{displayText}</span>
    </span>
  );
}
