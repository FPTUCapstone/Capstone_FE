'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ROUTES } from '@/lib/routes';
import { OperatorApprovalStatus } from '@/types/tour-operator-application';
import { tourOperatorApplicationEn as copy } from '../resources/en';

interface ApplicationHeaderProps {
  userId: number;
  companyName: string;
  applicationStatus: OperatorApprovalStatus;
  isMissingMandatory?: boolean;
  onOpenApprove: () => void;
  onOpenReject: () => void;
}

export function ApplicationHeader({
  userId,
  companyName,
  applicationStatus,
  isMissingMandatory = false,
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
            href={ROUTES.admin.dashboard}
            className="inline-flex items-center text-xs font-bold text-teal-700 hover:text-teal-900 transition"
          >
            <span aria-hidden="true" className="mr-1">←</span>
            {copy.header.back}
          </Link>
          <span className="text-slate-300" aria-hidden="true">•</span>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {copy.header.applicationNumber(userId)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl tracking-tight">
            {companyName || copy.header.fallbackTitle(userId)}
          </h1>
          {isPending && <StatusBadge tone="warning">{copy.status.pending}</StatusBadge>}
          {isApproved && <StatusBadge tone="teal">{copy.status.approved}</StatusBadge>}
          {isRejected && <StatusBadge tone="danger">{copy.status.rejected}</StatusBadge>}
        </div>
      </div>

      {isPending && (
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onOpenReject}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-rose-300 bg-white px-5 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 hover:border-rose-400 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <span aria-hidden="true" className="mr-1.5">✕</span>
              {copy.header.reject}
            </button>
            <button
              type="button"
              disabled={isMissingMandatory}
              aria-describedby={isMissingMandatory ? 'approval-blocked-reason' : undefined}
              onClick={onOpenApprove}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700 transition focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 disabled:shadow-none"
            >
              <span aria-hidden="true" className="mr-1.5">✓</span>
              {copy.header.approve}
            </button>
          </div>
          {isMissingMandatory && (
            <p id="approval-blocked-reason" className="max-w-sm text-right text-xs font-semibold text-amber-800">
              {copy.header.approvalBlocked}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
