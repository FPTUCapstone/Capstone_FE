'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { OperatorApprovalStatus } from '@/types/tour-operator-application';

interface ApplicationHeaderProps {
  userId: number;
  companyName: string;
  applicationStatus: OperatorApprovalStatus;
  onOpenApprove: () => void;
  onOpenReject: () => void;
}

export function ApplicationHeader({
  userId,
  companyName,
  applicationStatus,
  onOpenApprove,
  onOpenReject,
}: ApplicationHeaderProps) {
  const isPending = applicationStatus === 'PendingApproval';
  const isApproved = applicationStatus === 'Approved';
  const isRejected = applicationStatus === 'Rejected';

  return (
    <div className="mb-6 rounded-2xl border-2 border-slate-300 bg-white p-6 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-3">
          <Link
            href="/admin/tours"
            className="inline-flex items-center text-xs font-bold text-teal-700 hover:text-teal-900 transition"
          >
            ← Back to Admin Console
          </Link>
          <span className="text-slate-300">•</span>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Application #{userId}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl tracking-tight">
            {companyName || `Tour Operator #${userId}`}
          </h1>

          {isPending && <StatusBadge tone="warning">Pending Approval</StatusBadge>}
          {isApproved && <StatusBadge tone="teal">Approved & Active</StatusBadge>}
          {isRejected && <StatusBadge tone="danger">Rejected</StatusBadge>}
        </div>
      </div>

      {isPending && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenReject}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-rose-300 bg-white px-5 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 hover:border-rose-400 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            ✕ Reject Application
          </button>
          <button
            type="button"
            onClick={onOpenApprove}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700 transition focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            ✓ Approve Application
          </button>
        </div>
      )}
    </div>
  );
}
