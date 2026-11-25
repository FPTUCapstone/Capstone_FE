'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ROUTES } from '@/lib/routes';
import { formatDisplayDate } from '@/lib/displayDate';
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

function formatSubmittedDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return copy.common.notAvailable;
  const isoDate = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDate) return formatDisplayDate(isoDate[1]);
  return formatDisplayDate(trimmed);
}

export function TourOperatorApplicationListView({ initialApplications }: TourOperatorApplicationListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [applications, setApplications] = useState(initialApplications ?? []);
  const [loading, setLoading] = useState(initialApplications === undefined);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (initialApplications !== undefined) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const query = new URLSearchParams({ page: String(page), status: statusFilter, search: searchTerm });
        const response = await fetch(`/api/admin/tour-operator-applications?${query}`, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error(response.status === 403 ? copy.errors.forbidden : response.status === 401 ? copy.errors.sessionExpired : copy.errors.serviceUnavailable);
        const data = await response.json();
        if (!Array.isArray(data.items) || !Number.isInteger(data.totalCount)) throw new Error(copy.errors.serviceUnavailable);
        if (!controller.signal.aborted) { setApplications(data.items); setTotalCount(data.totalCount); }
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : copy.errors.network);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [initialApplications, page, searchTerm, statusFilter, attempt]);

  const filteredApplications = useMemo(() => {
    if (initialApplications === undefined) return applications;
    return initialApplications.filter((app) => {
      const matchesStatus = statusFilter === 'All' || app.applicationStatus === statusFilter;
      const matchesSearch =
        searchTerm === '' ||
        app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.taxCode.includes(searchTerm) ||
        String(app.userId).includes(searchTerm);
      return matchesStatus && matchesSearch;
    });
  }, [initialApplications, applications, searchTerm, statusFilter]);

  return (
    <div className="pb-16 text-[#1C2928]">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          className="mb-6"
          eyebrow={
            <>
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{'assignment_ind'}</span>
              <span>{copy.list.eyebrow}</span>
            </>
          }
          title={copy.list.title}
          description={copy.list.subtitle}
        />

        {/* Filters and Controls */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#DCE2DD] bg-[#FFFFFF] p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
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
                  onClick={() => { setStatusFilter(status); setPage(1); }}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                    statusFilter === status
                      ? 'bg-[#174B4A] text-white shadow-xs'
                      : 'bg-[#F7F5EF] text-[#5B6E69] hover:bg-[#E8F0EA]'
                  }`}
                >
                  {tabLabel}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#5B6E69]">
              {'search'}
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder={copy.list.searchPlaceholder}
              aria-label={copy.list.searchAriaLabel}
              className="w-full rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] py-2 pl-9 pr-3 text-xs text-[#1C2928] placeholder-[#5B6E69] transition focus:border-[#174B4A] focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        {/* Applications Queue Table */}
        {loading ? (
          <p role="status" className="rounded-2xl border border-[#DCE2DD] bg-white p-8 text-center text-sm font-semibold text-[#5B6E69] shadow-xs">
            {copy.list.loading}
          </p>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-[#F7C9D3] bg-[#FDECEF] p-6 text-center text-sm text-[#8C1030] shadow-xs">
            <p className="font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => setAttempt(value => value + 1)}
              className="mt-3 rounded-xl border border-[#8C1030]/30 bg-white px-4 py-2 text-xs font-bold text-[#8C1030] transition hover:bg-[#FDECEF]"
            >
              {copy.errors.retry}
            </button>
          </div>
        ) : <div className="overflow-hidden rounded-2xl border border-[#DCE2DD] bg-[#FFFFFF] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label={copy.list.tableAriaLabel}>
              <thead className="border-b border-[#DCE2DD] bg-[#F7F5EF] text-[11px] font-bold uppercase tracking-wider text-[#5B6E69]">
                <tr>
                  <th scope="col" className="px-3.5 py-3 whitespace-nowrap">{copy.list.colId}</th>
                  <th scope="col" className="px-3.5 py-3">{copy.list.colCompany}</th>
                  <th scope="col" className="px-3.5 py-3 whitespace-nowrap">{copy.list.colTax}</th>
                  <th scope="col" className="px-3.5 py-3 whitespace-nowrap">{copy.list.colPhone}</th>
                  <th scope="col" className="px-3.5 py-3 whitespace-nowrap">{copy.list.colDate}</th>
                  <th scope="col" className="px-3.5 py-3 whitespace-nowrap">{copy.list.colDocs}</th>
                  <th scope="col" className="px-3.5 py-3 whitespace-nowrap">{copy.list.colStatus}</th>
                  <th scope="col" className="px-3.5 py-3 text-right whitespace-nowrap">{copy.list.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE2DD]">
                {filteredApplications.length > 0 ? (
                  filteredApplications.map((app) => (
                    <tr key={app.userId} className="hover:bg-[#F7F5EF]/70 transition-colors">
                      <td className="px-3.5 py-3.5 font-mono font-bold text-[#1C2928] whitespace-nowrap">
                        {`#${app.userId}`}
                      </td>
                      <td className="px-3.5 py-3.5 font-bold text-[#1C2928] max-w-[210px] truncate">
                        {app.companyName}
                      </td>
                      <td className="px-3.5 py-3.5 font-mono text-[#5B6E69] whitespace-nowrap">
                        {app.taxCode || '—'}
                      </td>
                      <td className="px-3.5 py-3.5 font-mono text-[#5B6E69] whitespace-nowrap">
                        {app.contactPhone || '—'}
                      </td>
                      <td className="px-3.5 py-3.5 text-[#5B6E69] whitespace-nowrap">
                        {formatSubmittedDate(app.submittedAt)}
                      </td>
                      <td className="px-3.5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5B6E69]">
                          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{'description'}</span>
                          <span>{copy.list.docsCountLabel(app.documentsCount)}</span>
                        </span>
                      </td>
                      <td className="px-3.5 py-3.5 whitespace-nowrap">
                        {app.applicationStatus === 'Pending' ? (
                          <span className="inline-flex h-7 items-center justify-center whitespace-nowrap rounded-full border border-[#F2D8B3] bg-[#FBF3E8] px-2.5 text-center text-[11px] font-semibold text-[#8F5419]">
                            <span>{copy.list.statusPending}</span>
                          </span>
                        ) : app.applicationStatus === 'Approved' ? (
                          <span className="inline-flex h-7 items-center justify-center whitespace-nowrap rounded-full border border-[#BCE0CD] bg-[#E7F2EC] px-2.5 text-center text-[11px] font-semibold text-[#1B5E3C]">
                            <span>{copy.list.statusApproved}</span>
                          </span>
                        ) : (
                          <span className="inline-flex h-7 items-center justify-center whitespace-nowrap rounded-full border border-[#EAC4D5] bg-[#FBEFF4] px-2.5 text-center text-[11px] font-semibold text-[#8C1D40]">
                            <span>{copy.list.statusRejected}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3.5 text-right whitespace-nowrap">
                        <Link
                          href={ROUTES.admin.tourOperatorApplicationDetail(app.userId)}
                          className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-[#DCE2DD] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1C2928] hover:bg-[#F7F5EF] transition"
                        >
                          <span>{copy.list.reviewAction}</span>
                          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{'arrow_forward'}</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center text-[#5B6E69]">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <span className="material-symbols-outlined text-4xl text-[#5B6E69]">{'inventory_2'}</span>
                        <p className="mt-3 text-sm font-bold text-[#1C2928]">{copy.list.emptyQueueTitle}</p>
                        <p className="mt-1 text-xs text-[#5B6E69]">
                          {copy.list.emptyQueueBody}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>}
        {initialApplications === undefined && !loading && !error && totalCount > 50 && <nav aria-label={copy.list.pagesLabel} className="mt-4 flex items-center justify-between"><button type="button" disabled={page === 1} onClick={() => setPage(value => value - 1)}>{copy.list.previousPage}</button><span>{page} / {Math.ceil(totalCount / 50)}</span><button type="button" disabled={page * 50 >= totalCount} onClick={() => setPage(value => value + 1)}>{copy.list.nextPage}</button></nav>}
      </div>
    </div>
  );
}
