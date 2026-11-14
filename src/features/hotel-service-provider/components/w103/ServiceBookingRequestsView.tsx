'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { StatusBadge } from '../common/StatusBadge';
import { AccessibleSelect } from '../common/AccessibleSelect';
import { ProviderBookingService } from '../../services/providerBookingService';
import type { BookingRequestItem, BookingRequestStatus } from '../../types';
import { formatDate, formatTime, formatDateTime } from '../../utils/formatters';
import { hotelProviderVi } from '../../resources/vi';

export function ServiceBookingRequestsView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL query state preservation
  const rawStatus = searchParams.get('status');
  const initialStatus: BookingRequestStatus | 'All' =
    rawStatus && rawStatus !== 'All' ? (rawStatus as BookingRequestStatus) : 'All';
  const initialStart = searchParams.get('startDate') || '';
  const initialEnd = searchParams.get('endDate') || '';
  const initialKeyword = searchParams.get('keyword') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  // Form input state
  const [selectedStatus, setSelectedStatus] = useState<BookingRequestStatus | 'All'>(initialStatus);
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [keyword, setKeyword] = useState(initialKeyword);

  // Applied query state
  const [appliedFilters, setAppliedFilters] = useState<{
    status: BookingRequestStatus | 'All';
    startDate: string;
    endDate: string;
    keyword: string;
  }>({
    status: initialStatus,
    startDate: initialStart,
    endDate: initialEnd,
    keyword: initialKeyword,
  });

  const [page, setPage] = useState(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1);
  const pageSize = 20;

  const [requests, setRequests] = useState<BookingRequestItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    ProviderBookingService.fetchBookingRequests({
      status: appliedFilters.status,
      startDate: appliedFilters.startDate,
      endDate: appliedFilters.endDate,
      keyword: appliedFilters.keyword,
      page,
      pageSize,
    })
      .then((data) => {
        if (!active) return;
        setRequests(data.items);
        setTotalCount(data.totalCount);
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setErrorMessage(hotelProviderVi.messages.MSG127);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [appliedFilters, page, pageSize]);

  // Sync state to URL without reloading
  useEffect(() => {
    const params = new URLSearchParams();
    if (appliedFilters.status !== 'All') params.set('status', appliedFilters.status);
    if (appliedFilters.startDate) params.set('startDate', appliedFilters.startDate);
    if (appliedFilters.endDate) params.set('endDate', appliedFilters.endDate);
    if (appliedFilters.keyword) params.set('keyword', appliedFilters.keyword);
    if (page > 1) params.set('page', String(page));

    const query = params.toString();
    const newUrl = query ? `/provider/bookings?${query}` : '/provider/bookings';
    router.replace(newUrl, { scroll: false });
  }, [appliedFilters, page, router]);

  // Search on explicit submit only
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setPage(1);
    setAppliedFilters({
      status: selectedStatus,
      startDate,
      endDate,
      keyword: keyword.trim(),
    });
  };

  const handleReset = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSelectedStatus('All');
    setStartDate('');
    setEndDate('');
    setKeyword('');
    setPage(1);
    setAppliedFilters({
      status: 'All',
      startDate: '',
      endDate: '',
      keyword: '',
    });
  };

  const statusOptions = [
    { value: 'All', label: 'Tất cả trạng thái' },
    {
      value: 'PendingConfirmation',
      label: hotelProviderVi.statuses.pendingConfirmation,
      icon: 'schedule',
    },
    {
      value: 'Confirmed',
      label: hotelProviderVi.statuses.confirmed,
      icon: 'check_circle',
    },
    {
      value: 'Completed',
      label: hotelProviderVi.statuses.completed,
      icon: 'verified',
    },
    {
      value: 'NoShow',
      label: hotelProviderVi.statuses.noShow,
      icon: 'person_off',
    },
    {
      value: 'Rejected',
      label: hotelProviderVi.statuses.rejected,
      icon: 'cancel',
    },
    {
      value: 'Cancelled',
      label: hotelProviderVi.statuses.cancelled,
      icon: 'block',
    },
    {
      value: 'Expired',
      label: hotelProviderVi.statuses.expired,
      icon: 'timer_off',
    },
  ];

  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1C2928] tracking-tight">
            {hotelProviderVi.w103.pageTitle}
          </h1>
          <p className="mt-1 text-xs text-[#5B6E69]">
            {hotelProviderVi.w103.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#174B4A] bg-[#E8F7F4] border border-[#B2DFDB] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs">
            <span className="material-symbols-outlined text-[15px]">inventory</span>
            <span>{hotelProviderVi.w103.totalRequestsCount(totalCount)}</span>
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-[#DCE2DD] rounded-xl p-4 shadow-xs">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Keyword Search */}
          <div className="lg:col-span-4">
            <label htmlFor="w103-search" className="block text-xs font-semibold text-[#1C2928] mb-1">
              {hotelProviderVi.common.search}
            </label>
            <div className="relative">
              <span
                className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8E9E9B]"
                aria-hidden="true"
              >
                <span className="material-symbols-outlined text-[17px]">search</span>
              </span>
              <input
                id="w103-search"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={hotelProviderVi.w103.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#DCE2DD] rounded-lg text-[#1C2928] placeholder-[#8E9E9B] focus:outline-none focus:ring-2 focus:ring-[#174B4A]/15 focus:border-[#174B4A] transition-colors"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3">
            <AccessibleSelect
              label={hotelProviderVi.w103.statusFilterLabel}
              options={statusOptions}
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val as BookingRequestStatus | 'All')}
            />
          </div>

          {/* From Date */}
          <div className="lg:col-span-2">
            <label htmlFor="w103-start-date" className="block text-xs font-semibold text-[#1C2928] mb-1">
              {hotelProviderVi.w103.startDateLabel}
            </label>
            <input
              id="w103-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#DCE2DD] rounded-lg text-[#1C2928] focus:outline-none focus:ring-2 focus:ring-[#174B4A]/15 focus:border-[#174B4A] transition-colors"
            />
          </div>

          {/* To Date */}
          <div className="lg:col-span-2">
            <label htmlFor="w103-end-date" className="block text-xs font-semibold text-[#1C2928] mb-1">
              {hotelProviderVi.w103.endDateLabel}
            </label>
            <input
              id="w103-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#DCE2DD] rounded-lg text-[#1C2928] focus:outline-none focus:ring-2 focus:ring-[#174B4A]/15 focus:border-[#174B4A] transition-colors"
            />
          </div>

          {/* Buttons */}
          <div className="lg:col-span-1 flex items-center gap-1.5">
            <button
              type="submit"
              className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-[#174B4A] hover:bg-[#103B39] rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]" aria-hidden="true">search</span>
              <span>{hotelProviderVi.w103.applyFiltersButton}</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-2 text-xs font-semibold text-[#5B6E69] hover:text-[#1C2928] hover:bg-[#F7F5EF] rounded-lg transition-colors cursor-pointer border border-[#DCE2DD]"
              title={hotelProviderVi.w103.resetFiltersButton}
              aria-label={hotelProviderVi.w103.resetFiltersButton}
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">refresh</span>
            </button>
          </div>
        </form>
      </div>

      {/* Sorting Notice */}
      <div className="flex items-center gap-2 text-[11px] text-[#5B6E69] px-1">
        <span className="material-symbols-outlined text-[15px] text-[#B96D4C] shrink-0">
          info
        </span>
        <span>{hotelProviderVi.w103.sortNotice}</span>
      </div>

      {/* Operational Data Table */}
      <div className="bg-white border border-[#DCE2DD] rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#5B6E69]">
            <span className="material-symbols-outlined text-[28px] animate-spin text-[#174B4A] mb-2 block mx-auto">
              progress_activity
            </span>
            {hotelProviderVi.common.loading}
          </div>
        ) : errorMessage ? (
          <div className="p-12 text-center text-xs text-[#DC2626]">
            <span className="material-symbols-outlined text-[32px] mb-2 block mx-auto">
              error
            </span>
            <p className="font-semibold text-sm mb-1">Không thể tải danh sách yêu cầu</p>
            <p className="text-[#5B6E69] mb-4">{errorMessage}</p>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setErrorMessage(null);
                setAppliedFilters((prev) => ({ ...prev }));
              }}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#174B4A] rounded-lg cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#5B6E69]">
            <span className="material-symbols-outlined text-[36px] text-[#8E9E9B] mb-2 block mx-auto">
              inbox
            </span>
            <h3 className="font-bold text-sm text-[#1C2928] mb-1">
              {hotelProviderVi.w103.emptyTitle}
            </h3>
            <p className="text-[#5B6E69] max-w-sm mx-auto">
              {hotelProviderVi.w103.emptySubtitle}
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="mt-4 px-3 py-1.5 text-xs font-semibold text-[#174B4A] bg-[#E8F7F4] border border-[#B2DFDB] rounded-lg hover:bg-[#B2DFDB]/50 cursor-pointer"
            >
              {hotelProviderVi.w103.resetFiltersButton}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F5EF] border-b border-[#DCE2DD] text-[#5B6E69] font-semibold uppercase tracking-wider text-[11px]">
                  <th scope="col" className="py-3 px-4 w-[140px] whitespace-nowrap">
                    {hotelProviderVi.w103.tableHeaders.requestCode}
                  </th>
                  <th scope="col" className="py-3 px-4 min-w-[180px]">
                    {hotelProviderVi.w103.tableHeaders.service}
                  </th>
                  <th scope="col" className="py-3 px-4 min-w-[160px]">
                    {hotelProviderVi.w103.tableHeaders.option}
                  </th>
                  <th scope="col" className="py-3 px-4 w-[110px] whitespace-nowrap">
                    {hotelProviderVi.w103.tableHeaders.requestedDate}
                  </th>
                  <th scope="col" className="py-3 px-4 w-[90px] whitespace-nowrap">
                    {hotelProviderVi.w103.tableHeaders.requestedTime}
                  </th>
                  <th scope="col" className="py-3 px-4 w-[65px] text-center">
                    {hotelProviderVi.w103.tableHeaders.quantity}
                  </th>
                  <th scope="col" className="py-3 px-4 min-w-[150px]">
                    {hotelProviderVi.w103.tableHeaders.travelerName}
                  </th>
                  <th scope="col" className="py-3 px-4 w-[145px]">
                    {hotelProviderVi.w103.tableHeaders.status}
                  </th>
                  <th scope="col" className="py-3 px-4 w-[130px] whitespace-nowrap">
                    {hotelProviderVi.w103.tableHeaders.submittedAt}
                  </th>
                  <th scope="col" className="py-3 px-4 w-[100px] text-right">
                    {hotelProviderVi.w103.tableHeaders.action}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECE9] text-[#1C2928]">
                {requests.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F7F5EF]/70 transition-colors group"
                  >
                    {/* Request Code */}
                    <td className="py-3 px-4 font-mono font-bold text-[#174B4A] whitespace-nowrap">
                      {item.requestCode}
                    </td>

                    {/* Service / Property */}
                    <td className="py-3 px-4 font-medium truncate max-w-[200px]" title={item.serviceName}>
                      {item.serviceName}
                    </td>

                    {/* Room Option */}
                    <td className="py-3 px-4 text-[#5B6E69] truncate max-w-[180px]" title={item.serviceOption}>
                      {item.serviceOption}
                    </td>

                    {/* Requested Date */}
                    <td className="py-3 px-4 font-medium whitespace-nowrap">
                      {formatDate(item.requestedDate)}
                    </td>

                    {/* Requested Time */}
                    <td className="py-3 px-4 text-[#5B6E69] font-mono whitespace-nowrap">
                      {formatTime(item.requestedTime)}
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-4 text-center font-medium">
                      {item.quantity}
                    </td>

                    {/* Traveler Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#1C2928] truncate max-w-[150px]" title={item.travelerName}>
                        {item.travelerName}
                      </div>
                      <div className="text-[10px] font-mono text-[#5B6E69]">
                        {item.travelerPhone}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <StatusBadge status={item.status} size="sm" />
                    </td>

                    {/* Submitted At */}
                    <td className="py-3 px-4 text-[#5B6E69] text-[11px] whitespace-nowrap">
                      {formatDateTime(item.submittedAt)}
                    </td>

                    {/* Action: View Details */}
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/provider/bookings/${item.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#174B4A] bg-[#E8F7F4] hover:bg-[#174B4A] hover:text-white rounded-lg transition-colors cursor-pointer"
                      >
                        <span>{hotelProviderVi.common.viewDetails}</span>
                        <span className="material-symbols-outlined text-[13px]" aria-hidden="true">arrow_forward</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoading && requests.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[#F7F5EF] border-t border-[#DCE2DD] text-xs text-[#5B6E69]">
            <div>
              {hotelProviderVi.common.pagination.showing}{' '}
              <span className="font-bold text-[#1C2928]">{startItem}</span>{' '}
              {hotelProviderVi.common.pagination.to}{' '}
              <span className="font-bold text-[#1C2928]">{endItem}</span>{' '}
              {hotelProviderVi.common.pagination.of}{' '}
              <span className="font-bold text-[#1C2928]">{totalCount}</span>{' '}
              {hotelProviderVi.common.pagination.requests}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-white border border-[#DCE2DD] rounded-lg text-xs font-semibold text-[#1C2928] hover:bg-[#E8F7F4] disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1 transition-colors"
                aria-label="Trang trước"
              >
                <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                <span>{hotelProviderVi.common.pagination.previous}</span>
              </button>

              <span className="px-3 py-1 font-semibold text-[#1C2928]">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 bg-white border border-[#DCE2DD] rounded-lg text-xs font-semibold text-[#1C2928] hover:bg-[#E8F7F4] disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1 transition-colors"
                aria-label="Trang sau"
              >
                <span>{hotelProviderVi.common.pagination.next}</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
