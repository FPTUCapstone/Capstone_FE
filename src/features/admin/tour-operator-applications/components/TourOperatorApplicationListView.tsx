'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ROUTES } from '@/lib/routes';
import { tourOperatorApplicationEn as copy } from '../resources/en';

export interface OperatorApplicationSummary {
  userId: number;
  companyName: string;
  taxCode: string;
  contactPhone: string;
  submittedAt: string;
  applicationStatus: 'Pending' | 'Approved' | 'Rejected';
  documentsCount: number;
  hasBusinessLicense: boolean;
}

interface TourOperatorApplicationListViewProps {
  initialApplications?: OperatorApplicationSummary[];
}

export function TourOperatorApplicationListView({ initialApplications = [] }: TourOperatorApplicationListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  const filteredApplications = useMemo(() => {
    return initialApplications.filter((app) => {
      const matchesStatus = statusFilter === 'All' || app.applicationStatus === statusFilter;
      const matchesSearch =
        searchTerm === '' ||
        app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.taxCode.includes(searchTerm) ||
        String(app.userId).includes(searchTerm);
      return matchesStatus && matchesSearch;
    });
  }, [initialApplications, searchTerm, statusFilter]);

  return (
    <div className="pb-16 text-[#1C2923]">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-6 rounded-2xl border border-[#2A3B33] bg-[#1C2923] p-6 text-[#F7F6F2] shadow-sm md:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#758B74] bg-[#273830] px-3 py-1 text-xs font-bold tracking-wider text-[#E8EFE9] uppercase">
                <span className="material-symbols-outlined text-[14px]">{'assignment_ind'}</span>
                <span>{copy.list.eyebrow}</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {copy.list.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#A3B3AB]">
                {copy.list.subtitle}
              </p>
            </div>
          </div>
        </header>

        {/* Filters and Controls */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#E6E4DD] bg-[#FFFFFF] p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label={copy.list.searchAriaLabel}>
            {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((status) => {
              const tabLabel =
                status === 'All'
                  ? copy.list.allTab
                  : status === 'Pending'
                  ? copy.list.pendingTab
                  : status === 'Approved'
                  ? copy.list.approvedTab
                  : copy.list.rejectedTab;

              return (
                <button
                  key={status}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                    statusFilter === status
                      ? 'bg-[#245747] text-white shadow-xs'
                      : 'bg-[#F7F6F2] text-[#4A5851] hover:bg-[#E8EFE9]'
                  }`}
                >
                  {tabLabel}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#74827B]">
              {'search'}
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={copy.list.searchPlaceholder}
              aria-label={copy.list.searchAriaLabel}
              className="w-full rounded-xl border border-[#D8D5CC] bg-[#F7F6F2] py-2 pl-9 pr-3 text-xs text-[#1C2923] placeholder-[#74827B] transition focus:border-[#245747] focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        {/* Applications Queue Table */}
        <div className="overflow-hidden rounded-2xl border border-[#E6E4DD] bg-[#FFFFFF] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label={copy.list.tableAriaLabel}>
              <thead className="border-b border-[#E6E4DD] bg-[#F0EFEA] text-[11px] font-bold uppercase tracking-wider text-[#4A5851]">
                <tr>
                  <th scope="col" className="px-5 py-3.5">{copy.list.colId}</th>
                  <th scope="col" className="px-5 py-3.5">{copy.list.colCompany}</th>
                  <th scope="col" className="px-5 py-3.5">{copy.list.colTax}</th>
                  <th scope="col" className="px-5 py-3.5">{copy.list.colPhone}</th>
                  <th scope="col" className="px-5 py-3.5">{copy.list.colDate}</th>
                  <th scope="col" className="px-5 py-3.5">{copy.list.colDocs}</th>
                  <th scope="col" className="px-5 py-3.5">{copy.list.colStatus}</th>
                  <th scope="col" className="px-5 py-3.5 text-right">{copy.list.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E4DD]">
                {filteredApplications.length > 0 ? (
                  filteredApplications.map((app) => (
                    <tr key={app.userId} className="hover:bg-[#F7F6F2]/70 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-[#1C2923]">
                        {`#${app.userId}`}
                      </td>
                      <td className="px-5 py-4 font-bold text-[#1C2923]">
                        {app.companyName}
                      </td>
                      <td className="px-5 py-4 font-mono text-[#4A5851]">
                        {app.taxCode}
                      </td>
                      <td className="px-5 py-4 font-mono text-[#4A5851]">
                        {app.contactPhone}
                      </td>
                      <td className="px-5 py-4 text-[#4A5851]">
                        {app.submittedAt}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4A5851]">
                          <span className="material-symbols-outlined text-[14px]">{'description'}</span>
                          <span>{copy.list.docsCountLabel(app.documentsCount)}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {app.applicationStatus === 'Pending' ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#F2D8B3] bg-[#FBF3E8] px-2.5 py-0.5 text-[11px] font-semibold text-[#8F5419]">
                            <span className="material-symbols-outlined text-[12px]">{'hourglass_top'}</span>
                            <span>{copy.list.statusPending}</span>
                          </span>
                        ) : app.applicationStatus === 'Approved' ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#BCE0CD] bg-[#E7F2EC] px-2.5 py-0.5 text-[11px] font-semibold text-[#1B5E3C]">
                            <span className="material-symbols-outlined text-[12px]">{'check_circle'}</span>
                            <span>{copy.list.statusApproved}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#EAC4D5] bg-[#FBEFF4] px-2.5 py-0.5 text-[11px] font-semibold text-[#8C1D40]">
                            <span className="material-symbols-outlined text-[12px]">{'cancel'}</span>
                            <span>{copy.list.statusRejected}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={ROUTES.admin.tourOperatorApplicationDetail(app.userId)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#D8D5CC] bg-white px-2.5 py-1 text-xs font-semibold text-[#1C2923] hover:bg-[#F0EFEA] transition"
                        >
                          <span>{copy.list.reviewAction}</span>
                          <span className="material-symbols-outlined text-[14px]">{'arrow_forward'}</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center text-[#74827B]">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <span className="material-symbols-outlined text-4xl text-[#758B74]">{'inventory_2'}</span>
                        <p className="mt-3 text-sm font-bold text-[#1C2923]">{copy.list.emptyQueueTitle}</p>
                        <p className="mt-1 text-xs text-[#74827B]">
                          {copy.list.emptyQueueBody}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
