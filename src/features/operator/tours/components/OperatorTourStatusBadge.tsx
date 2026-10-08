import type { TourLifecycleStatus } from '../types/tourLifecycle';

interface OperatorTourStatusBadgeProps {
  status: TourLifecycleStatus;
  className?: string;
}

export function OperatorTourStatusBadge({ status, className = '' }: OperatorTourStatusBadgeProps) {
  switch (status) {
    case 'Draft':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
          Bản nháp
        </span>
      );
    case 'Pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
          Chờ duyệt
        </span>
      );
    case 'Approved':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          Đã xuất bản (Hoạt động)
        </span>
      );
    case 'Rejected':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-800 border border-rose-200 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden="true" />
          Bị từ chối
        </span>
      );
    case 'Inactive':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold text-gray-600 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" aria-hidden="true" />
          Ngừng hoạt động
        </span>
      );
  }
}
