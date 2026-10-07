'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import {
  cancelCustomerBooking,
  getOperatorBookings,
  initiateBookingRefund,
} from '../services/operatorBookingService';
import {
  DEMO_OPERATOR_TOURS,
  isBookingDemoAllowedInCurrentEnv,
} from '../data/operatorBookingDemoFixtures';
import {
  OPERATOR_BOOKING_DEFAULT_PAGE_SIZE,
  OPERATOR_BOOKING_MESSAGES,
  type BookingDto,
  type BookingFilterParams,
  type BookingListResult,
  type BookingStatus,
  type CancelBookingPayload,
  type InitiateRefundPayload,
} from '../types/bookingLifecycle';
import { BookingStatusBadge, CheckInStatusBadge } from './OperatorBookingStatusBadge';
import { BookingDetailPanel } from './BookingDetailPanel';
import { CancelBookingDialog } from './CancelBookingDialog';
import { InitiateRefundDialog } from './InitiateRefundDialog';
import { formatCurrencyVND, formatVietnamDate } from '../utils/dateFormat';
import { buildBookingListUrl, withBookingDemoMode } from '../routes';
import { bookingEn } from '../resources/en';
import { ROUTES } from '@/lib/routes';

interface OperatorBookingListViewProps {
  initialParams?: BookingFilterParams;
  isDemo?: boolean;
  demoActorUserId?: number;
}

interface FilterFormState {
  tourId: string;
  status: string;
  startDate: string;
  endDate: string;
  searchKeyword: string;
}

export function OperatorBookingListView({
  initialParams = {},
  isDemo = false,
  demoActorUserId,
}: OperatorBookingListViewProps) {
  const router = useRouter();

  const isDemoPermitted = isDemo && isBookingDemoAllowedInCurrentEnv();
  const { status: sessionStatus, context: sessionContext } = useWebSession();

  const isAuthorizedOperator =
    sessionStatus === 'authenticated' &&
    sessionContext !== null &&
    sessionContext.role === 'TourOperator' &&
    sessionContext.status === 'Active' &&
    sessionContext.applicationStatus === 'Approved' &&
    !sessionContext.applicationUnresolved;

  const resolvedDemoActorUserId =
    demoActorUserId !== undefined
      ? demoActorUserId
      : isAuthorizedOperator
        ? sessionContext.userId
        : undefined;

  const isSessionRestoring =
    isDemoPermitted && demoActorUserId === undefined && sessionStatus === 'restoring';

  const initialFilterState: FilterFormState = {
    tourId: initialParams.tourId || 'ALL',
    status: initialParams.status || 'ALL',
    startDate: initialParams.startDate || '',
    endDate: initialParams.endDate || '',
    searchKeyword: initialParams.searchKeyword || '',
  };

  // CR-02: Separate draft filter inputs from applied query filters
  const [draftFilters, setDraftFilters] = useState<FilterFormState>(initialFilterState);
  const [appliedFilters, setAppliedFilters] = useState<FilterFormState>(initialFilterState);
  const [page, setPage] = useState<number>(initialParams.page || 1);
  const [mutationRefreshVersion, setMutationRefreshVersion] = useState<number>(0);
  const pageSize = initialParams.pageSize || OPERATOR_BOOKING_DEFAULT_PAGE_SIZE;

  // Data state
  const [loading, setLoading] = useState<boolean>(true);
  const [result, setResult] = useState<BookingListResult | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Selected booking for Detail Panel
  const [selectedBooking, setSelectedBooking] = useState<BookingDto | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);

  // Cancel dialog state
  const [cancelTargetBooking, setCancelTargetBooking] = useState<BookingDto | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Refund dialog state
  const [refundTargetBooking, setRefundTargetBooking] = useState<BookingDto | null>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState<boolean>(false);

  // Helper to sync URL search params on query changes (CR-01 context preservation)
  const syncUrlParams = (newPage: number, filters: FilterFormState) => {
    if (!router) return;
    try {
      const url = buildBookingListUrl({
        page: newPage,
        status: filters.status,
        tourId: filters.tourId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        searchKeyword: filters.searchKeyword,
        isDemo: isDemoPermitted,
      });
      router.replace(url, { scroll: false });
    } catch {
      // safe fallback if not supported
    }
  };

  // Load bookings effect (triggers only on appliedFilters, page, or mutation refresh)
  useEffect(() => {
    if (isSessionRestoring) return;
    let isMounted = true;
    async function fetchBookings() {
      setLoading(true);
      try {
        const res = await getOperatorBookings(
          {
            tourId: appliedFilters.tourId === 'ALL' ? undefined : appliedFilters.tourId,
            status:
              appliedFilters.status === 'ALL'
                ? undefined
                : (appliedFilters.status as BookingStatus),
            startDate: appliedFilters.startDate || undefined,
            endDate: appliedFilters.endDate || undefined,
            searchKeyword: appliedFilters.searchKeyword || undefined,
            page,
            pageSize,
          },
          { isDemo: isDemoPermitted, demoActorUserId: resolvedDemoActorUserId }
        );
        if (isMounted) {
          setResult(res);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void fetchBookings();
    return () => {
      isMounted = false;
    };
  }, [
    appliedFilters,
    page,
    pageSize,
    isDemoPermitted,
    resolvedDemoActorUserId,
    isSessionRestoring,
    mutationRefreshVersion,
  ]);

  // CR-02: Apply draft filters on explicit form submission
  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters({ ...draftFilters });
    setPage(1); // CR-01: changing filters resets page to 1
    syncUrlParams(1, draftFilters);
  };

  // CR-02: Reset both draft and applied filters to defaults and reset page to 1
  const handleResetFilter = () => {
    const defaultFilters: FilterFormState = {
      tourId: 'ALL',
      status: 'ALL',
      startDate: '',
      endDate: '',
      searchKeyword: '',
    };
    setDraftFilters(defaultFilters);
    setAppliedFilters({ ...defaultFilters });
    setPage(1);
    syncUrlParams(1, defaultFilters);
  };

  // Pagination page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    syncUrlParams(newPage, appliedFilters);
  };

  // Open detail panel
  const handleViewDetail = (booking: BookingDto) => {
    setSelectedBooking(booking);
    setDetailOpen(true);
  };

  // Open Cancel dialog from detail or row
  const handleOpenCancelDialog = (booking: BookingDto) => {
    setCancelTargetBooking(booking);
    setCancelDialogOpen(true);
  };

  // Open Refund dialog from detail or row
  const handleOpenRefundDialog = (booking: BookingDto) => {
    setRefundTargetBooking(booking);
    setRefundDialogOpen(true);
  };

  // Submit cancel booking (UC-41)
  const handleConfirmCancel = async (payload: CancelBookingPayload) => {
    if (!cancelTargetBooking) return;
    setActionLoading(true);
    try {
      const res = await cancelCustomerBooking(cancelTargetBooking.id, payload, {
        isDemo: isDemoPermitted,
        demoActorUserId: resolvedDemoActorUserId,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setCancelDialogOpen(false);
        if (selectedBooking?.id === cancelTargetBooking.id && res.booking) {
          setSelectedBooking(res.booking);
        }
        setMutationRefreshVersion((v) => v + 1);
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Submit initiate refund (UC-42)
  const handleConfirmRefund = async (payload: InitiateRefundPayload) => {
    if (!refundTargetBooking) return;
    setActionLoading(true);
    try {
      const res = await initiateBookingRefund(refundTargetBooking.id, payload, {
        isDemo: isDemoPermitted,
        demoActorUserId: resolvedDemoActorUserId,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setRefundDialogOpen(false);
        if (selectedBooking?.id === refundTargetBooking.id && res.refund) {
          setSelectedBooking({
            ...selectedBooking,
            refund: res.refund,
          });
        }
        setMutationRefreshVersion((v) => v + 1);
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const summary = result?.summary ?? {
    totalBookings: 0,
    totalParticipants: 0,
    totalConfirmedAmount: 0,
  };

  const startDisplay =
    result && result.totalCount > 0 ? (result.page - 1) * result.pageSize + 1 : 0;
  const endDisplay =
    result && result.totalCount > 0
      ? Math.min(result.page * result.pageSize, result.totalCount)
      : 0;

  return (
    <div className="space-y-6">
      {/* Workspace Header & Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#00152A] sm:text-2xl">
              {bookingEn.header.title}
            </h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              {bookingEn.header.useCaseTag}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {bookingEn.header.subtitle}
          </p>
        </div>

        {/* Workspace Quick Links */}
        <div className="flex items-center gap-2">
          <Link
            href={isDemoPermitted ? withBookingDemoMode('/partner/tours', true) : '/partner/tours'}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <span className="material-symbols-outlined text-[18px]">tour</span>
            <span>{bookingEn.header.toursLink}</span>
          </Link>
          <Link
            href={ROUTES.partner.dashboard}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            <span>{bookingEn.header.dashboardLink}</span>
          </Link>
        </div>
      </div>

      {/* Production Truthfulness Notice (NO_BACKEND) */}
      {!isDemoPermitted && (
        <div
          role="status"
          className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-xs text-amber-900"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[24px] text-amber-600 shrink-0">
              info
            </span>
            <div className="text-xs space-y-1">
              <p className="font-bold text-amber-950">
                {OPERATOR_BOOKING_MESSAGES.PENDING_BE_INTEGRATION}
              </p>
              <p className="text-amber-800">
                {bookingEn.notices.pendingBackendDescription}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Demo Mode Notice */}
      {isDemoPermitted && (
        <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-2.5 text-xs text-[#006B5F]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">experiment</span>
            <span className="font-semibold">
              {bookingEn.notices.demoTitle}
            </span>
          </div>
          <span className="rounded bg-teal-200/80 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-teal-900">
            {bookingEn.notices.demoBadge}
          </span>
        </div>
      )}

      {/* Feedback Banner (e.g. MSG81, MSG83, errors) */}
      {feedback && (
        <div
          role="alert"
          className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              {feedback.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 transition"
            aria-label="Close notification"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Summary KPI Cards Area (UC-40 Canonical Summary Area) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{bookingEn.summary.totalBookings}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-[#00152A]">{summary.totalBookings}</div>
          <p className="mt-1 text-[11px] text-slate-400">{bookingEn.summary.totalBookingsSubtitle}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{bookingEn.summary.totalParticipants}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <span className="material-symbols-outlined text-[18px]">group</span>
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-[#00152A]">{summary.totalParticipants}</div>
          <p className="mt-1 text-[11px] text-slate-400">{bookingEn.summary.totalParticipantsSubtitle}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{bookingEn.summary.confirmedRevenue}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-[#006B5F]">
            {formatCurrencyVND(summary.totalConfirmedAmount)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{bookingEn.summary.confirmedRevenueSubtitle}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <form onSubmit={handleApplyFilter} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Tour Filter */}
            <div>
              <label htmlFor="filter-tour" className="block text-[11px] font-bold text-slate-600 mb-1">
                {bookingEn.filters.tour}
              </label>
              <select
                id="filter-tour"
                value={draftFilters.tourId}
                onChange={(e) =>
                  setDraftFilters((prev) => ({ ...prev, tourId: e.target.value }))
                }
                disabled={!isDemoPermitted}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#006B5F] focus:outline-hidden focus:ring-1 focus:ring-[#006B5F] disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="ALL">{bookingEn.filters.allTours}</option>
                {DEMO_OPERATOR_TOURS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="filter-status" className="block text-[11px] font-bold text-slate-600 mb-1">
                {bookingEn.filters.status}
              </label>
              <select
                id="filter-status"
                value={draftFilters.status}
                onChange={(e) =>
                  setDraftFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                disabled={!isDemoPermitted}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#006B5F] focus:outline-hidden focus:ring-1 focus:ring-[#006B5F] disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="ALL">{bookingEn.filters.allStatuses}</option>
                <option value="Confirmed">{bookingEn.statuses.Confirmed}</option>
                <option value="PendingPayment">{bookingEn.statuses.PendingPayment}</option>
                <option value="Cancelled">{bookingEn.statuses.Cancelled}</option>
                <option value="Completed">{bookingEn.statuses.Completed}</option>
              </select>
            </div>

            {/* Departure Start Date */}
            <div>
              <label htmlFor="filter-start-date" className="block text-[11px] font-bold text-slate-600 mb-1">
                {bookingEn.filters.departureStartDate}
              </label>
              <input
                id="filter-start-date"
                type="date"
                value={draftFilters.startDate}
                onChange={(e) =>
                  setDraftFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
                disabled={!isDemoPermitted}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-[#006B5F] focus:outline-hidden focus:ring-1 focus:ring-[#006B5F] disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {/* Departure End Date */}
            <div>
              <label htmlFor="filter-end-date" className="block text-[11px] font-bold text-slate-600 mb-1">
                {bookingEn.filters.departureEndDate}
              </label>
              <input
                id="filter-end-date"
                type="date"
                value={draftFilters.endDate}
                onChange={(e) =>
                  setDraftFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
                disabled={!isDemoPermitted}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-[#006B5F] focus:outline-hidden focus:ring-1 focus:ring-[#006B5F] disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
          </div>

          {/* Search keyword & action buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-slate-100">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">
                search
              </span>
              <input
                type="text"
                value={draftFilters.searchKeyword}
                onChange={(e) =>
                  setDraftFilters((prev) => ({ ...prev, searchKeyword: e.target.value }))
                }
                placeholder={bookingEn.filters.searchPlaceholder}
                aria-label={bookingEn.filters.searchAriaLabel}
                disabled={!isDemoPermitted}
                className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#006B5F] focus:outline-hidden focus:ring-1 focus:ring-[#006B5F] disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleResetFilter}
                disabled={!isDemoPermitted}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
              >
                {bookingEn.filters.reset}
              </button>
              <button
                type="submit"
                disabled={!isDemoPermitted}
                className="rounded-xl bg-[#006B5F] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005249] transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">filter_alt</span>
                <span>{bookingEn.filters.apply}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Date Range Error if MSG29 */}
      {result?.errorMessage && result.errorMessage === OPERATOR_BOOKING_MESSAGES.MSG29 && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">warning</span>
          <span>{result.errorMessage}</span>
        </div>
      )}

      {/* Bookings List Section */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <span className="material-symbols-outlined text-[24px] animate-spin text-[#006B5F]">
              progress_activity
            </span>
            <p className="mt-2">{bookingEn.list.loading}</p>
          </div>
        ) : !result || result.items.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <span className="material-symbols-outlined text-[36px] text-slate-300">receipt_long</span>
            <p className="mt-2 font-bold text-slate-700">
              {result?.errorMessage === OPERATOR_BOOKING_MESSAGES.MSG29
                ? OPERATOR_BOOKING_MESSAGES.MSG128
                : result?.errorMessage || OPERATOR_BOOKING_MESSAGES.MSG128}
            </p>
            {!isDemoPermitted && (
              <p className="mt-1 text-slate-400">
                {bookingEn.list.emptyNoBackend}
              </p>
            )}
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3.5">{bookingEn.list.tableHeaders.bookingCode}</th>
                    <th scope="col" className="px-4 py-3.5">{bookingEn.list.tableHeaders.tourName}</th>
                    <th scope="col" className="px-4 py-3.5">{bookingEn.list.tableHeaders.departureDate}</th>
                    <th scope="col" className="px-4 py-3.5">{bookingEn.list.tableHeaders.contact}</th>
                    <th scope="col" className="px-4 py-3.5 text-center">{bookingEn.list.tableHeaders.paxCount}</th>
                    <th scope="col" className="px-4 py-3.5 text-right">{bookingEn.list.tableHeaders.totalAmount}</th>
                    <th scope="col" className="px-4 py-3.5">{bookingEn.list.tableHeaders.status}</th>
                    <th scope="col" className="px-4 py-3.5">{bookingEn.list.tableHeaders.checkIn}</th>
                    <th scope="col" className="px-4 py-3.5 text-center">{bookingEn.list.tableHeaders.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.items.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3.5 font-bold text-[#00152A]">
                        {b.bookingCode}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-800 max-w-[200px] truncate">
                        {b.tourName}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {formatVietnamDate(b.departureDate)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">{b.contactName}</div>
                        <div className="text-[11px] text-slate-400">{b.contactPhone}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                        {b.participantsCount}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-[#006B5F] whitespace-nowrap">
                        {formatCurrencyVND(b.totalAmount)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <BookingStatusBadge status={b.status} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <CheckInStatusBadge status={b.checkInStatus} />
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(b)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-[#006B5F] hover:bg-slate-50 transition"
                        >
                          {bookingEn.list.viewDetail}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Card View */}
            <div className="lg:hidden divide-y divide-slate-100">
              {result.items.map((b) => (
                <div key={b.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-[#00152A] text-sm">{b.bookingCode}</span>
                      <p className="font-medium text-slate-800 text-xs mt-0.5">{b.tourName}</p>
                    </div>
                    <BookingStatusBadge status={b.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[11px] block">{bookingEn.list.tableHeaders.departureDate}:</span>
                      <span className="font-semibold text-slate-800">{formatVietnamDate(b.departureDate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">{bookingEn.list.tableHeaders.paxCount}:</span>
                      <span className="font-semibold text-slate-800">{b.participantsCount} {bookingEn.detail.personCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">{bookingEn.list.tableHeaders.contact}:</span>
                      <span className="font-semibold text-slate-800 truncate block">{b.contactName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">{bookingEn.list.tableHeaders.checkIn}:</span>
                      <CheckInStatusBadge status={b.checkInStatus} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[11px] text-slate-400 block">{bookingEn.list.tableHeaders.totalAmount}:</span>
                      <span className="font-bold text-sm text-[#006B5F]">{formatCurrencyVND(b.totalAmount)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleViewDetail(b)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-[#006B5F] hover:bg-slate-50 transition shadow-2xs"
                    >
                      {bookingEn.list.viewDetail}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls (CR-01: 20 per page, total count, context preservation) */}
            {result.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/50 text-xs">
                <span className="text-slate-500">
                  {bookingEn.list.pagination.showing} <strong>{startDisplay}</strong> {bookingEn.list.pagination.to} <strong>{endDisplay}</strong> {bookingEn.list.pagination.of} <strong>{result.totalCount}</strong> {bookingEn.list.pagination.bookings} ({bookingEn.list.pagination.page} <strong>{result.page}</strong> / <strong>{result.totalPages}</strong>)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(Math.max(1, result.page - 1))}
                    disabled={result.page <= 1}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
                  >
                    {bookingEn.list.pagination.previous}
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePageChange(Math.min(result.totalPages, result.page + 1))}
                    disabled={result.page >= result.totalPages}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
                  >
                    {bookingEn.list.pagination.next}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Detail Slide-over Drawer (UC-40) */}
      <BookingDetailPanel
        open={detailOpen}
        booking={selectedBooking}
        isDemo={isDemoPermitted}
        onClose={() => setDetailOpen(false)}
        onOpenCancelDialog={(b) => handleOpenCancelDialog(b)}
        onOpenRefundDialog={(b) => handleOpenRefundDialog(b)}
      />

      {/* Cancel Booking Dialog (UC-41) */}
      <CancelBookingDialog
        open={cancelDialogOpen}
        booking={cancelTargetBooking}
        loading={actionLoading}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleConfirmCancel}
      />

      {/* Initiate Refund Dialog (UC-42) */}
      <InitiateRefundDialog
        open={refundDialogOpen}
        booking={refundTargetBooking}
        loading={actionLoading}
        onClose={() => setRefundDialogOpen(false)}
        onConfirm={handleConfirmRefund}
      />
    </div>
  );
}
