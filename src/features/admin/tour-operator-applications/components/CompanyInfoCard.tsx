'use client';

import { TourOperatorApplicationDetailDto } from '@/types/tour-operator-application';

interface CompanyInfoCardProps {
  detail: TourOperatorApplicationDetailDto;
}

export function CompanyInfoCard({ detail }: CompanyInfoCardProps) {
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
          <div className="mt-2 rounded-xl border-2 border-rose-300 bg-rose-50 p-4 md:col-span-3 shadow-xs">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-rose-800">
              Rejection Reason
            </span>
            <p className="text-sm font-semibold text-rose-950">{detail.rejectionReason}</p>
          </div>
        )}
      </div>
    </div>
  );
}
