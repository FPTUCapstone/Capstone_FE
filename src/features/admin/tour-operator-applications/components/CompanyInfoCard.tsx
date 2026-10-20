'use client';

import { TourOperatorApplicationDetailDto } from '@/types/tour-operator-application';
import { tourOperatorApplicationEn as copy } from '../resources/en';
import { formatApplicationDateTime } from '../utils/format';

interface CompanyInfoCardProps {
  detail: TourOperatorApplicationDetailDto;
}

export function CompanyInfoCard({ detail }: CompanyInfoCardProps) {
  const reviewedAt = formatApplicationDateTime(detail.reviewedAt) ?? copy.common.notAvailable;

  return (
    <div className="mb-6 rounded-2xl border-2 border-slate-300 bg-white p-6 shadow-sm">
      <h2 className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-100 pb-3.5 text-lg font-extrabold text-slate-900">
        <span className="flex items-center gap-2">
          <span aria-hidden="true">🏢</span> {copy.company.title}
        </span>
        <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {copy.company.userId(detail.userId)}
        </span>
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
            {copy.company.companyName}
          </span>
          <span className="text-base font-extrabold text-slate-900 break-words">
            {detail.companyName}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
            {copy.company.taxCode}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="rounded-lg border border-teal-300 bg-teal-50 px-3 py-1 font-mono text-base font-bold text-teal-800 shadow-xs break-all">
              {detail.taxCode}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
            {copy.company.businessLicense}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="rounded-lg border border-teal-300 bg-teal-50 px-3 py-1 font-mono text-base font-bold text-teal-800 shadow-xs break-all">
              {detail.businessLicenseNumber}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
            {copy.company.contactPhone}
          </span>
          <span className="text-sm font-bold text-slate-800">
            {detail.contactPhone || copy.common.notAvailable}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 md:col-span-2">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
            {copy.company.businessAddress}
          </span>
          <span className="text-sm font-bold text-slate-800 break-words">
            {detail.contactAddress || copy.common.notAvailable}
          </span>
        </div>

        {detail.reviewedBy && (
          <div className="mt-2 grid grid-cols-1 gap-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 md:col-span-3 md:grid-cols-2">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-emerald-800">
                {copy.company.reviewedBy}
              </span>
              <span className="text-sm font-extrabold text-emerald-900">
                {copy.company.reviewedById(detail.reviewedBy)}
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-emerald-800">
                {copy.company.reviewedAt}
              </span>
              <span className="text-sm font-semibold text-emerald-900">{reviewedAt}</span>
            </div>
          </div>
        )}

        {detail.rejectionReason && (
          <div className="mt-2 rounded-xl border-2 border-rose-300 bg-rose-50 p-4 md:col-span-3 shadow-xs">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-rose-800">
              {copy.company.rejectionReason}
            </span>
            <p className="text-sm font-semibold text-rose-950 whitespace-pre-wrap break-words">{detail.rejectionReason}</p>
          </div>
        )}
      </div>
    </div>
  );
}
