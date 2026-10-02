'use client';

import { useState } from 'react';
import { TourOperatorApplicationDetailDto } from '@/types/tour-operator-application';

interface CompanyInfoCardProps {
  detail: TourOperatorApplicationDetailDto;
}

export function CompanyInfoCard({ detail }: CompanyInfoCardProps) {
  const [isReasonExpanded, setIsReasonExpanded] = useState(false);
  const hasLongRejectionReason = (detail.rejectionReason?.length ?? 0) > 240;

  return (
    <div className="mb-6 rounded-2xl border-2 border-slate-300 bg-white p-6 shadow-sm">
      <h2 className="mb-5 flex items-center justify-between border-b-2 border-slate-100 pb-3.5 text-lg font-extrabold text-slate-900">
        <span className="flex items-center gap-2">
          <span>🏢</span> Company Legal Profile
        </span>
        <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          User ID: #{detail.userId}
        </span>
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Company Name
          </span>
          <span className="text-base font-extrabold text-slate-900">
            {detail.companyName}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Tax Code (Mã Số Thuế)
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="rounded-lg border border-teal-300 bg-teal-50 px-3 py-1 font-mono text-base font-bold text-teal-800 shadow-xs">
              {detail.taxCode}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Business License No (GPKD)
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="rounded-lg border border-teal-300 bg-teal-50 px-3 py-1 font-mono text-base font-bold text-teal-800 shadow-xs">
              {detail.businessLicenseNumber}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Contact Phone
          </span>
          <span className="text-sm font-bold text-slate-800">
            {detail.contactPhone || 'N/A'}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 md:col-span-2">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Business Address
          </span>
          <span className="text-sm font-bold text-slate-800">
            {detail.contactAddress || 'N/A'}
          </span>
        </div>

        {detail.reviewedBy && (
          <div className="mt-2 grid grid-cols-1 gap-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 md:col-span-3 md:grid-cols-2">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-emerald-800">
                Reviewed By Admin ID
              </span>
              <span className="text-sm font-extrabold text-emerald-900">
                #{detail.reviewedBy}
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-emerald-800">
                Review Timestamp (UTC)
              </span>
              <span className="text-sm font-semibold text-emerald-900">
                {detail.reviewedAt ? new Date(detail.reviewedAt).toUTCString() : 'N/A'}
              </span>
            </div>
          </div>
        )}

        {detail.rejectionReason && (
          <div className="mt-2 min-w-0 overflow-hidden rounded-xl border-2 border-rose-300 bg-rose-50 p-4 shadow-xs md:col-span-3">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-rose-800">
              Rejection Reason
            </span>
            <p
              id="rejection-reason-content"
              className={`whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-rose-950 [overflow-wrap:anywhere] ${
                hasLongRejectionReason && !isReasonExpanded ? 'line-clamp-4' : ''
              }`}
            >
              {detail.rejectionReason}
            </p>
            {hasLongRejectionReason && (
              <button
                type="button"
                aria-controls="rejection-reason-content"
                aria-expanded={isReasonExpanded}
                onClick={() => setIsReasonExpanded((expanded) => !expanded)}
                className="mt-2 rounded-md px-1 py-1 text-xs font-bold text-rose-800 underline decoration-rose-300 underline-offset-4 hover:text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {isReasonExpanded ? 'Show less' : 'Show full reason'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
