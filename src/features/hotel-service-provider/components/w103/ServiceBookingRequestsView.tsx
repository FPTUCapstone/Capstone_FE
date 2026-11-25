'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { StatusBadge } from '../common/StatusBadge';
import { AccessibleSelect } from '../common/AccessibleSelect';
import { useProviderLocale } from '../common/ProviderLocaleContext';
import { ProviderBookingService } from '../../services/providerBookingService';
import type { BookingRequestItem, BookingRequestStatus } from '../../types';
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatVnd,
  isDateInPast,
  formatRemainingSla,
} from '../../utils/formatters';
import { hotelProviderEn } from '../../resources/en';
import { hotelProviderVi } from '../../resources/vi';
import { WorkflowError } from '../../services/workflowClient';
import { ROUTES } from '@/lib/routes';

const VALID_STATUSES: BookingRequestStatus[] = [
  'PendingConfirmation',
  'Confirmed',
  'Rejected',
  'Cancelled',
  'Expired',
  'Completed',
  'NoShow',
];

export function ServiceBookingRequestsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useProviderLocale('en');
  const isVi = locale === 'vi';
  const res = isVi ? hotelProviderVi : hotelProviderEn;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // URL query state preservation (CR-01)
  const rawStatus = searchParams.get('status');
  const initialStatus: BookingRequestStatus | 'All' =
    rawStatus && VALID_STATUSES.includes(rawStatus as BookingRequestStatus)
      ? (rawStatus as BookingRequestStatus)
      : 'All';
  const initialStart = searchParams.get('startDate') || '';
  const initialEnd = searchParams.get('endDate') || '';
  const initialKeyword = searchParams.get('keyword') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  // Draft form input state (CR-02)
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

  const [page, setPage] = useState(Number.isSafeInteger(initialPage) && initialPage > 0 ? initialPage : 1);
  const pageSize = 20; // Mandatory per CR-01

  const [requests, setRequests] = useState<BookingRequestItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

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
        const lastPage = Math.max(1, Math.ceil(data.totalCount / pageSize));
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setRequests(data.items);
        setTotalCount(data.totalCount);
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setErrorMessage(error instanceof WorkflowError ? error.message : res.messages.MSG127);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [appliedFilters, page, pageSize, reloadToken, res.messages.MSG127]);

  // Sync applied state to URL without reloading
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

  // Search on explicit submit only (CR-02)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate && startDate > endDate) {
      setErrorMessage(
        isVi
          ? 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.'
          : 'The end date must be on or after the start date.'
      );
      return;
    }
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

  const handleQuickTab = (nextStatus: BookingRequestStatus | 'All') => {
    if (appliedFilters.status === nextStatus && selectedStatus === nextStatus) return;
    setSelectedStatus(nextStatus);
    setIsLoading(true);
    setErrorMessage(null);
    setPage(1);
    setAppliedFilters((prev) => ({
      ...prev,
      status: nextStatus,
    }));
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

  const handleRefresh = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setReloadToken((n) => n + 1);
  };

  const isOutcomeEligible = (item: BookingRequestItem): boolean => {
    if (item.status !== 'Confirmed') return false;
    const windowEnded = !!item.autoCompleteAtUtc && now >= Date.parse(item.autoCompleteAtUtc);
    if (windowEnded) return false;
    return item.outcomeAvailableAtUtc
      ? now >= Date.parse(item.outcomeAvailableAtUtc)
      : isDateInPast(item.requestedDate);
  };

  const kpiStats = useMemo(() => {
    let pending = 0;
    let confirmed = 0;
    let readyOutcome = 0;
    let urgentPending = 0;

    for (const item of requests) {
      if (item.status === 'PendingConfirmation') {
        pending += 1;
        const sla = formatRemainingSla(item.responseDeadlineUtc, now, locale);
        if (sla?.isUrgent) urgentPending += 1;
      } else if (item.status === 'Confirmed') {
        confirmed += 1;
        const windowEnded = !!item.autoCompleteAtUtc && now >= Date.parse(item.autoCompleteAtUtc);
        const passed = item.outcomeAvailableAtUtc
          ? now >= Date.parse(item.outcomeAvailableAtUtc)
          : isDateInPast(item.requestedDate);
        if (!windowEnded && passed) readyOutcome += 1;
      }
    }
    return { pending, confirmed, readyOutcome, urgentPending };
  }, [requests, now, locale]);

  const statusOptions = [
    { value: 'All', label: isVi ? 'Tất cả trạng thái' : 'All Statuses' },
    { value: 'PendingConfirmation', label: res.statuses.pendingConfirmation, icon: 'schedule' },
    { value: 'Confirmed', label: res.statuses.confirmed, icon: 'check_circle' },
    { value: 'Completed', label: res.statuses.completed, icon: 'verified' },
    { value: 'NoShow', label: res.statuses.noShow, icon: 'person_off' },
    { value: 'Rejected', label: res.statuses.rejected, icon: 'cancel' },
    { value: 'Cancelled', label: res.statuses.cancelled, icon: 'block' },
    { value: 'Expired', label: res.statuses.expired, icon: 'timer_off' },
  ];

  const quickTabs: Array<{ value: BookingRequestStatus | 'All'; label: string }> = [
    { value: 'All', label: isVi ? 'Tất cả' : 'All' },
    { value: 'PendingConfirmation', label: res.statuses.pendingConfirmation },
    { value: 'Confirmed', label: res.statuses.confirmed },
    { value: 'Completed', label: res.statuses.completed },
    { value: 'Rejected', label: res.statuses.rejected },
    { value: 'Cancelled', label: res.statuses.cancelled },
  ];

  const hasActiveFilters = Boolean(
    appliedFilters.keyword ||
      appliedFilters.status !== 'All' ||
      appliedFilters.startDate ||
      appliedFilters.endDate
  );

  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  const ui = isVi
    ? {
        pageTitle: 'Yêu cầu đặt dịch vụ',
        subtitle:
          'Tiếp nhận, kiểm tra khả năng phục vụ và xử lý các yêu cầu đặt dịch vụ từ du khách TripMate.',
        refreshBtn: 'Làm mới',
        searchLabel: 'Tìm kiếm',
        kpiPending: 'Chờ xác nhận (trang này)',
        kpiPendingHint: (urgent: number) =>
          urgent > 0 ? `${urgent} đơn cần phản hồi gấp` : 'Ưu tiên xử lý trong 24h',
        kpiConfirmed: 'Đã xác nhận (trang này)',
        kpiConfirmedHint: 'Đang chờ đến ngày phục vụ',
        kpiOutcome: 'Sẵn sàng ghi nhận KQ',
        kpiOutcomeHint: 'Đã qua ngày sử dụng dịch vụ',
        kpiTotal: 'Tổng yêu cầu khớp bộ lọc',
        kpiTotalHint: (size: number) => `Hiển thị tối đa ${size} dòng/trang`,
        colCode: 'Mã yêu cầu',
        colService: 'Dịch vụ & Gói',
        colSchedule: 'Lịch sử dụng',
        colTraveler: 'Du khách',
        colStatus: 'Trạng thái',
        colAction: 'Thao tác',
        qtyShort: 'SL',
        actionReview: 'Xem & Xử lý',
        actionOutcome: 'Ghi nhận KQ',
        actionDetail: 'Chi tiết',
        readyOutcomeHint: 'Sẵn sàng ghi nhận KQ',
        activeFilters: 'Đang lọc:',
        clearAll: 'Xóa tất cả',
        loadingText: 'Đang tải danh sách yêu cầu đặt dịch vụ...',
        errorTitle: 'Không thể tải danh sách yêu cầu',
        retryLabel: 'Thử lại',
        resetFiltersLabel: 'Đặt lại bộ lọc',
        prevAria: 'Previous page',
        nextAria: 'Next page',
        sortRightNote: 'Thứ tự: Chờ xác nhận → Ngày gần nhất',
        submittedPrefix: 'Gửi',
      }
    : {
        pageTitle: hotelProviderEn.w103.pageTitle,
        subtitle: hotelProviderEn.w103.subtitle,
        refreshBtn: 'Refresh',
        searchLabel: 'Search',
        kpiPending: 'Pending Confirmation (page)',
        kpiPendingHint: (urgent: number) =>
          urgent > 0 ? `${urgent} urgent deadline(s)` : 'Respond within 24h SLA',
        kpiConfirmed: 'Confirmed (page)',
        kpiConfirmedHint: 'Scheduled for service delivery',
        kpiOutcome: 'Ready for Outcome',
        kpiOutcomeHint: 'Service date has passed',
        kpiTotal: 'Matching Requests',
        kpiTotalHint: (size: number) => `Showing up to ${size} per page`,
        colCode: 'Request Code',
        colService: 'Service & Option',
        colSchedule: 'Schedule',
        colTraveler: 'Traveler',
        colStatus: 'Status',
        colAction: 'Action',
        qtyShort: 'Qty',
        actionReview: 'Review',
        actionOutcome: 'Record Outcome',
        actionDetail: 'View Details',
        readyOutcomeHint: 'Ready for outcome',
        activeFilters: 'Active filters:',
        clearAll: 'Clear all',
        loadingText: 'Loading booking requests...',
        errorTitle: 'Failed to load booking requests',
        retryLabel: 'Retry',
        resetFiltersLabel: 'Reset Filters',
        prevAria: 'Previous page',
        nextAria: 'Next page',
        sortRightNote: 'Order: Pending first → Earliest date',
        submittedPrefix: 'Sent',
      };

  const activeStatusLabel =
    statusOptions.find((opt) => opt.value === appliedFilters.status)?.label ?? appliedFilters.status;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1C2928]">
            {ui.pageTitle}
          </h1>
          <p className="mt-1 text-[13px] text-[#5B6E69]">{ui.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={ROUTES.provider.availability}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#DCE2DD] bg-white px-3.5 text-xs font-bold text-[#1C2928] shadow-2xs transition hover:border-[#B8C4BE] hover:bg-[#F7F5EF]"
          >
            <span className="material-symbols-outlined text-[16px] text-[#174B4A]" aria-hidden="true">
              calendar_month
            </span>
            <span>{isVi ? 'Quản lý lịch trống' : 'Manage Availability'}</span>
          </Link>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#174B4A] px-3.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#103B39] disabled:opacity-50 cursor-pointer"
          >
            <span
              className={`material-symbols-outlined text-[16px] ${isLoading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            >
              refresh
            </span>
            <span>{ui.refreshBtn}</span>
          </button>
        </div>
      </div>

      {/* Truthful Operational KPI Strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white p-4 shadow-[inset_3.5px_0_0_#B96D4C,0_1px_2px_rgba(28,41,40,0.03)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#5B6E69]">{ui.kpiPending}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FCECE5] text-[#995436]">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                schedule
              </span>
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold tabular-nums text-[#1C2928]">
            {kpiStats.pending}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-[#995436]">
            {ui.kpiPendingHint(kpiStats.urgentPending)}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white p-4 shadow-[inset_3.5px_0_0_#174B4A,0_1px_2px_rgba(28,41,40,0.03)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#5B6E69]">{ui.kpiConfirmed}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8F0EA] text-[#174B4A]">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                check_circle
              </span>
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold tabular-nums text-[#1C2928]">
            {kpiStats.confirmed}
          </p>
          <p className="mt-1 text-[11px] font-medium text-[#5B6E69]">{ui.kpiConfirmedHint}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white p-4 shadow-[inset_3.5px_0_0_#0E9F6E,0_1px_2px_rgba(28,41,40,0.03)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#5B6E69]">{ui.kpiOutcome}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E6F7F0] text-[#0E9F6E]">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                verified
              </span>
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold tabular-nums text-[#1C2928]">
            {kpiStats.readyOutcome}
          </p>
          <p className="mt-1 text-[11px] font-medium text-[#5B6E69]">{ui.kpiOutcomeHint}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#5B6E69]">{ui.kpiTotal}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#475569]">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                inbox
              </span>
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold tabular-nums text-[#1C2928]">{totalCount}</p>
          <p className="mt-1 text-[11px] font-medium text-[#5B6E69]">
            {ui.kpiTotalHint(pageSize)}
          </p>
        </div>
      </div>

      {/* Unified Operational Card: Quick Tabs + Filter Form + Data Table + Pagination */}
      <div className="overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white shadow-[0_1px_2px_rgba(28,41,40,0.04),0_4px_16px_rgba(28,41,40,0.025)]">
        {/* Quick Status Tabs */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto border-b border-[#E6EBE7] bg-[#FCFBF8] px-4 sm:px-5">
          <div className="flex items-center gap-1" role="tablist" aria-label={res.w103.statusFilterLabel}>
            {quickTabs.map((tab) => {
              const active = appliedFilters.status === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleQuickTab(tab.value)}
                  className={`relative whitespace-nowrap px-3.5 py-3 text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'font-bold text-[#174B4A]'
                      : 'text-[#5B6E69] hover:text-[#1C2928]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {active && (
                    <span
                      className="absolute inset-x-2 bottom-0 h-[2.5px] rounded-t-full bg-[#174B4A]"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
          <span className="hidden xl:inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-[#5B6E69]">
            <span className="material-symbols-outlined text-[15px] text-[#174B4A]" aria-hidden="true">
              inventory_2
            </span>
            <span>{res.w103.totalRequestsCount(totalCount)}</span>
          </span>
        </div>

        {/* Filter & Search Toolbar (CR-02: explicit Search submit) */}
        <div className="border-b border-[#ECEFE9] bg-white p-4 sm:px-5">
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end"
          >
            {/* Keyword Search */}
            <div className="min-w-0 sm:col-span-2 lg:col-span-4">
              <label
                htmlFor="w103-search"
                className="mb-1 block text-xs font-semibold text-[#1C2928]"
              >
                {ui.searchLabel}
              </label>
              <div className="relative">
                <span
                  className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#7C908B]"
                  aria-hidden="true"
                >
                  <span className="material-symbols-outlined text-[17px]">search</span>
                </span>
                <input
                  id="w103-search"
                  type="search"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={res.w103.searchPlaceholder}
                  className="min-h-11 w-full rounded-xl border border-[#D5DDD8] bg-white py-2 pr-3 pl-9 text-xs font-medium text-[#1C2928] placeholder-[#8E9E9B] transition focus:border-[#174B4A] focus:outline-none focus:ring-2 focus:ring-[#174B4A]/20"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="min-w-0 lg:col-span-2">
              <AccessibleSelect
                label={res.w103.statusFilterLabel}
                options={statusOptions}
                value={selectedStatus}
                onChange={(val) => setSelectedStatus(val as BookingRequestStatus | 'All')}
                buttonClassName="min-h-11 rounded-xl border-[#D5DDD8]"
              />
            </div>

            {/* From Date */}
            <div className="min-w-0 lg:col-span-2">
              <label
                htmlFor="w103-start-date"
                className="mb-1 block text-xs font-semibold text-[#1C2928]"
              >
                {res.w103.startDateLabel}
              </label>
              <input
                id="w103-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-[#D5DDD8] bg-white px-3 py-2 text-xs font-medium text-[#1C2928] transition focus:border-[#174B4A] focus:outline-none focus:ring-2 focus:ring-[#174B4A]/20"
              />
            </div>

            {/* To Date */}
            <div className="min-w-0 lg:col-span-2">
              <label
                htmlFor="w103-end-date"
                className="mb-1 block text-xs font-semibold text-[#1C2928]"
              >
                {res.w103.endDateLabel}
              </label>
              <input
                id="w103-end-date"
                min={startDate || undefined}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-[#D5DDD8] bg-white px-3 py-2 text-xs font-medium text-[#1C2928] transition focus:border-[#174B4A] focus:outline-none focus:ring-2 focus:ring-[#174B4A]/20"
              />
            </div>

            {/* Submit & Reset Actions */}
            <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-2">
              <button
                type="submit"
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#174B4A] px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-[#103B39] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  search
                </span>
                <span>{res.w103.applyFiltersButton}</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-[#D5DDD8] bg-white p-2 text-xs font-semibold text-[#5B6E69] transition hover:bg-[#F7F5EF] hover:text-[#1C2928] cursor-pointer"
                title={res.w103.resetFiltersButton}
                aria-label={res.w103.resetFiltersButton}
              >
                <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                  refresh
                </span>
              </button>
            </div>
          </form>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div
              aria-label={ui.activeFilters}
              className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#F0F2F0] pt-3 text-xs"
            >
              <span className="font-semibold text-[#5B6E69]">{ui.activeFilters}</span>
              {appliedFilters.keyword && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#E8F0EA] px-2.5 py-1 font-semibold text-[#174B4A]">
                  &ldquo;{appliedFilters.keyword}&rdquo;
                </span>
              )}
              {appliedFilters.status !== 'All' && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#E8F0EA] px-2.5 py-1 font-semibold text-[#174B4A]">
                  {activeStatusLabel}
                </span>
              )}
              {appliedFilters.startDate && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#E8F0EA] px-2.5 py-1 font-semibold text-[#174B4A]">
                  {res.w103.startDateLabel}: {formatDate(appliedFilters.startDate)}
                </span>
              )}
              {appliedFilters.endDate && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#E8F0EA] px-2.5 py-1 font-semibold text-[#174B4A]">
                  {res.w103.endDateLabel}: {formatDate(appliedFilters.endDate)}
                </span>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="ml-auto text-xs font-bold text-[#995436] hover:underline cursor-pointer"
              >
                {ui.clearAll}
              </button>
            </div>
          )}
        </div>

        {/* Integrated Priority Sorting Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6EBE7] bg-[#F6F8F6] px-4 py-2.5 text-[11.5px] text-[#536661] sm:px-5">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined shrink-0 text-[16px] text-[#B96D4C]"
              aria-hidden="true"
            >
              info
            </span>
            <span>{res.w103.sortNotice}</span>
          </div>
          <span className="hidden md:inline font-semibold text-[#5B6E69]">{ui.sortRightNote}</span>
        </div>

        {/* Table / Cards / States */}
        {isLoading ? (
          <div className="p-14 text-center text-xs text-[#5B6E69]">
            <span className="material-symbols-outlined mx-auto mb-2 block animate-spin text-[28px] text-[#174B4A]">
              progress_activity
            </span>
            {ui.loadingText}
          </div>
        ) : errorMessage ? (
          <div role="alert" className="p-12 text-center text-xs text-[#DC2626]">
            <span className="material-symbols-outlined mx-auto mb-2 block text-[32px]">error</span>
            <p className="mb-1 text-sm font-bold text-[#1C2928]">{ui.errorTitle}</p>
            <p className="mb-4 text-[#5B6E69]">{errorMessage}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="min-h-11 rounded-xl bg-[#174B4A] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#103B39] cursor-pointer"
            >
              {ui.retryLabel}
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-14 text-center text-xs text-[#5B6E69]">
            <span className="material-symbols-outlined mx-auto mb-2.5 block text-[38px] text-[#8E9E9B]">
              inbox
            </span>
            <h3 className="mb-1 text-sm font-bold text-[#1C2928]">{res.w103.emptyTitle}</h3>
            <p className="mx-auto max-w-sm text-[#5B6E69]">{res.w103.emptySubtitle}</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="mt-4 min-h-11 rounded-xl border border-[#CCE0D3] bg-[#E8F0EA] px-4 py-2 text-xs font-bold text-[#174B4A] transition hover:bg-[#DCE9E0] cursor-pointer"
              >
                {ui.resetFiltersLabel}
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Mobile & Tablet Card Stack (< lg) */}
            <div className="grid gap-3 p-4 lg:hidden">
              {requests.map((item) => {
                const isPendingRow = item.status === 'PendingConfirmation';
                const outcomeReady = isOutcomeEligible(item);
                const sla = isPendingRow
                  ? formatRemainingSla(item.responseDeadlineUtc, now, locale)
                  : null;
                const actionLabel = isPendingRow
                  ? ui.actionReview
                  : outcomeReady
                  ? ui.actionOutcome
                  : ui.actionDetail;

                return (
                  <article
                    key={item.id}
                    className={`rounded-xl border p-4 transition-colors ${
                      isPendingRow
                        ? 'border-[#F3D1B0] bg-[#FFFBF7]'
                        : 'border-[#DCE2DD] bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 className="font-mono text-sm font-extrabold text-[#174B4A]">
                          {item.requestCode}
                        </h2>
                        {item.submittedAt && (
                          <p className="mt-0.5 font-mono text-[11px] text-[#5B6E69]">
                            {ui.submittedPrefix}: {formatDateTime(item.submittedAt)}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={item.status} locale={locale} size="sm" />
                    </div>

                    <div className="mt-3 border-t border-[#EDF1EE] pt-3">
                      <p className="text-sm font-bold text-[#1C2928]">{item.serviceName}</p>
                      {item.serviceOption && item.serviceOption !== '—' && (
                        <p className="mt-0.5 text-xs text-[#5B6E69]">{item.serviceOption}</p>
                      )}
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <dt className="text-[11px] font-medium text-[#5B6E69]">{ui.colSchedule}</dt>
                        <dd className="mt-0.5 font-semibold tabular-nums text-[#1C2928]">
                          {formatDate(item.requestedDate)} · {formatTime(item.requestedTime)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-medium text-[#5B6E69]">
                          {res.w103.tableHeaders.quantity}
                        </dt>
                        <dd className="mt-0.5 font-semibold text-[#1C2928]">{item.quantity}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-[11px] font-medium text-[#5B6E69]">{ui.colTraveler}</dt>
                        <dd className="mt-0.5 font-semibold text-[#1C2928]">
                          {item.travelerName}
                          {item.travelerPhone && (
                            <span className="ml-2 font-mono text-[11px] font-normal text-[#5B6E69]">
                              {item.travelerPhone}
                            </span>
                          )}
                        </dd>
                      </div>
                    </dl>

                    {sla && (
                      <p className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#995436]">
                        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                          timer
                        </span>
                        <span>{sla.text}</span>
                      </p>
                    )}

                    <div className="mt-3.5">
                      <Link
                        href={`/provider/bookings/${encodeURIComponent(item.id)}`}
                        className={`inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold transition-colors ${
                          isPendingRow
                            ? 'bg-[#174B4A] text-white hover:bg-[#103B39]'
                            : outcomeReady
                            ? 'border border-[#CCE0D3] bg-[#E8F0EA] text-[#174B4A] hover:bg-[#DCE9E0]'
                            : 'border border-[#DCE2DD] bg-white text-[#1C2928] hover:bg-[#F7F5EF]'
                        }`}
                      >
                        <span>{actionLabel}</span>
                        <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                          arrow_forward
                        </span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Bounded 6-Column Desktop Table (Zero Horizontal Overflow) */}
            <div className="hidden lg:block">
              <table className="w-full table-fixed border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#DCE2DD] bg-[#F7F5EF] text-[11px] font-bold uppercase tracking-wider text-[#5B6E69]">
                    <th scope="col" className="w-[15%] px-4 py-3">
                      {ui.colCode}
                    </th>
                    <th scope="col" className="w-[25%] px-4 py-3">
                      {ui.colService}
                    </th>
                    <th scope="col" className="w-[16%] px-4 py-3">
                      {ui.colSchedule}
                    </th>
                    <th scope="col" className="w-[16%] px-4 py-3">
                      {ui.colTraveler}
                    </th>
                    <th scope="col" className="w-[15%] px-4 py-3">
                      {ui.colStatus}
                    </th>
                    <th scope="col" className="w-[13%] px-4 py-3 text-right">
                      {ui.colAction}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF1EE] text-[13px] text-[#1C2928]">
                  {requests.map((item) => {
                    const isPendingRow = item.status === 'PendingConfirmation';
                    const outcomeReady = isOutcomeEligible(item);
                    const sla = isPendingRow
                      ? formatRemainingSla(item.responseDeadlineUtc, now, locale)
                      : null;

                    const optionDistinct =
                      item.serviceOption &&
                      item.serviceOption !== '—' &&
                      item.serviceOption.trim().toLowerCase() !==
                        item.serviceName.trim().toLowerCase();

                    const actionLabel = isPendingRow
                      ? ui.actionReview
                      : outcomeReady
                      ? ui.actionOutcome
                      : ui.actionDetail;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isPendingRow
                            ? 'bg-[#FFFBF7] hover:bg-[#FFF5EC]'
                            : 'hover:bg-[#F7F5EF]/65'
                        }`}
                      >
                        {/* 1. Request Code + Submitted Timestamp */}
                        <td className="px-4 py-3.5 align-middle">
                          <div className="font-mono text-[13px] font-extrabold text-[#174B4A] truncate">
                            {item.requestCode}
                          </div>
                          {item.submittedAt && (
                            <div className="mt-0.5 font-mono text-[11px] text-[#5B6E69] truncate">
                              {formatDateTime(item.submittedAt)}
                            </div>
                          )}
                        </td>

                        {/* 2. Service & Option */}
                        <td className="px-4 py-3.5 align-middle">
                          <div
                            className="truncate font-bold text-[#1C2928]"
                            title={item.serviceName}
                          >
                            {item.serviceName}
                          </div>
                          <div
                            className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] text-[#5B6E69]"
                            title={item.serviceOption}
                          >
                            <span className="truncate">
                              {optionDistinct ? item.serviceOption : item.serviceOption || '—'}
                            </span>
                            {item.estimatedAmount > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="shrink-0 font-mono font-semibold text-[#3D524E]">
                                  {formatVnd(item.estimatedAmount)}
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* 3. Requested Date + Time + Quantity */}
                        <td className="px-4 py-3.5 align-middle">
                          <div className="font-bold tabular-nums text-[#1C2928]">
                            {formatDate(item.requestedDate)}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="font-mono text-[11.5px] text-[#5B6E69]">
                              {formatTime(item.requestedTime)}
                            </span>
                            <span className="inline-flex items-center rounded-md border border-[#DCE2DD] bg-[#F1F4F1] px-1.5 py-0.5 text-[10.5px] font-bold text-[#1C2928]">
                              {ui.qtyShort}: {item.quantity}
                            </span>
                          </div>
                        </td>

                        {/* 4. Traveler Name + Phone */}
                        <td className="px-4 py-3.5 align-middle">
                          <div
                            className="truncate font-bold text-[#1C2928]"
                            title={item.travelerName}
                          >
                            {item.travelerName}
                          </div>
                          {item.travelerPhone && (
                            <div className="mt-0.5 truncate font-mono text-[11px] text-[#5B6E69]">
                              {item.travelerPhone}
                            </div>
                          )}
                        </td>

                        {/* 5. Status Badge + SLA / Outcome Cue */}
                        <td className="px-4 py-3.5 align-middle">
                          <StatusBadge status={item.status} locale={locale} size="sm" />
                          {sla && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#995436]">
                              <span
                                className="material-symbols-outlined text-[13px]"
                                aria-hidden="true"
                              >
                                timer
                              </span>
                              <span className="truncate">{sla.text}</span>
                            </div>
                          )}
                          {!sla && outcomeReady && (
                            <div className="mt-1 text-[11px] font-bold text-[#0E9F6E]">
                              {ui.readyOutcomeHint}
                            </div>
                          )}
                          {item.status === 'Completed' && item.commissionAmount !== undefined && (
                            <div className="mt-1 font-mono text-[11px] text-[#5B6E69]">
                              {isVi ? 'HH' : 'Comm'}: {formatVnd(item.commissionAmount)}
                            </div>
                          )}
                        </td>

                        {/* 6. Action CTA (Always visible, never clipped) */}
                        <td className="px-4 py-3.5 text-right align-middle">
                          <Link
                            href={`/provider/bookings/${encodeURIComponent(item.id)}`}
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                              isPendingRow
                                ? 'bg-[#174B4A] text-white shadow-2xs hover:bg-[#103B39]'
                                : outcomeReady
                                ? 'border border-[#CCE0D3] bg-[#E8F0EA] text-[#174B4A] hover:bg-[#174B4A] hover:text-white'
                                : 'border border-[#DCE2DD] bg-white text-[#1C2928] hover:border-[#174B4A] hover:text-[#174B4A]'
                            }`}
                          >
                            <span>{actionLabel}</span>
                            <span
                              className="material-symbols-outlined text-[14px]"
                              aria-hidden="true"
                            >
                              arrow_forward
                            </span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination Bar (CR-01) */}
        {!isLoading && requests.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-[#E6EBE7] bg-[#FAF9F5] px-4 py-3 text-xs text-[#5B6E69] sm:flex-row sm:px-5">
            <div>
              {res.common.pagination.showing}{' '}
              <span className="font-bold text-[#1C2928]">{startItem}</span>{' '}
              {res.common.pagination.to}{' '}
              <span className="font-bold text-[#1C2928]">{endItem}</span>{' '}
              {res.common.pagination.of}{' '}
              <span className="font-bold text-[#1C2928]">{totalCount}</span>{' '}
              {res.common.pagination.requests}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setIsLoading(true);
                  setErrorMessage(null);
                  setPage((p) => Math.max(1, p - 1));
                }}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#DCE2DD] bg-white px-2.5 py-1 text-xs font-semibold text-[#1C2928] transition hover:bg-[#E8F0EA] disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
                aria-label={ui.prevAria}
              >
                <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                  chevron_left
                </span>
                <span>{res.common.pagination.previous}</span>
              </button>

              <span className="rounded-lg bg-[#174B4A] px-3 py-1.5 text-xs font-bold tabular-nums text-white">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={isLoading || page >= totalPages}
                onClick={() => {
                  setIsLoading(true);
                  setErrorMessage(null);
                  setPage((p) => Math.min(totalPages, p + 1));
                }}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#DCE2DD] bg-white px-2.5 py-1 text-xs font-semibold text-[#1C2928] transition hover:bg-[#E8F0EA] disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
                aria-label={ui.nextAria}
              >
                <span>{res.common.pagination.next}</span>
                <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
