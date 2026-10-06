'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  cancelCustomerBooking,
  getOperatorBookings,
  initiateBookingRefund,
} from '../services/operatorBookingService';
import {
  DEMO_OPERATOR_TOURS,
  DEMO_OPERATOR_USER_ID,
  isBookingDemoAllowedInCurrentEnv,
} from '../data/operatorBookingDemoFixtures';
import {
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
import { ROUTES } from '@/lib/routes';

interface OperatorBookingListViewProps {
  initialParams?: BookingFilterParams;
  isDemo?: boolean;
}

export function OperatorBookingListView({
  initialParams = {},
  isDemo = false,
}: OperatorBookingListViewProps) {
  const isDemoPermitted = isDemo && isBookingDemoAllowedInCurrentEnv();

  // Filters state
  const [tourId, setTourId] = useState<string>(initialParams.tourId || 'ALL');
  const [status, setStatus] = useState<string>(initialParams.status || 'ALL');
  const [startDate, setStartDate] = useState<string>(initialParams.startDate || '');
  const [endDate, setEndDate] = useState<string>(initialParams.endDate || '');
  const [searchKeyword, setSearchKeyword] = useState<string>(initialParams.searchKeyword || '');
  const [page, setPage] = useState<number>(initialParams.page || 1);
  const [refreshCount, setRefreshCount] = useState<number>(0);

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

  // Load bookings effect
  useEffect(() => {
    let isMounted = true;
    async function fetchBookings() {
      setLoading(true);
      try {
        const res = await getOperatorBookings(
          {
            tourId: tourId === 'ALL' ? undefined : tourId,
            status: status === 'ALL' ? undefined : (status as BookingStatus),
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            searchKeyword: searchKeyword || undefined,
            page,
            pageSize: 10,
          },
          { isDemo: isDemoPermitted, operatorUserId: DEMO_OPERATOR_USER_ID }
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
  }, [tourId, status, startDate, endDate, searchKeyword, page, isDemoPermitted, refreshCount]);

  // Handle filter submission
  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setRefreshCount((c) => c + 1);
  };

  const handleResetFilter = () => {
    setTourId('ALL');
    setStatus('ALL');
    setStartDate('');
    setEndDate('');
    setSearchKeyword('');
    setPage(1);
    setRefreshCount((c) => c + 1);
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
        operatorUserId: DEMO_OPERATOR_USER_ID,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setCancelDialogOpen(false);
        if (selectedBooking?.id === cancelTargetBooking.id && res.booking) {
          setSelectedBooking(res.booking);
        }
        setRefreshCount((c) => c + 1);
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
        operatorUserId: DEMO_OPERATOR_USER_ID,
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
        setRefreshCount((c) => c + 1);
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

  return (
    <div className="space-y-6">
      {/* Workspace Header & Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#00152A] sm:text-2xl">
              Quản lý đơn đặt chỗ khách hàng
            </h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              UC-40
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Theo dõi, tra cứu đơn đặt chỗ trên các gói tour thuộc quyền quản trị (BR-105).
          </p>
        </div>

        {/* Workspace Quick Links */}
        <div className="flex items-center gap-2">
          <Link
            href={isDemoPermitted ? '/partner/tours?demo=1' : '/partner/tours'}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <span className="material-symbols-outlined text-[18px]">tour</span>
            <span>Gói tour</span>
          </Link>
          <Link
            href={ROUTES.partner.dashboard}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            <span>Bảng điều khiển</span>
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
                Giao diện hiển thị trạng thái chờ tích hợp. Các thao tác hủy đặt chỗ (UC-41) và hoàn
                tiền (UC-42) được khóa an toàn để đảm bảo tính toàn vẹn dữ liệu tài chính.
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
              Chế độ xem trước giao diện (Demo Fixtures) — Dữ liệu phục vụ kiểm thử UI (UC-40, UC-41, UC-42).
            </span>
          </div>
          <span className="rounded bg-teal-200/80 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-teal-900">
            Demo Active
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
            aria-label="Đóng thông báo"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Summary KPI Cards Area (UC-40 Canonical Summary Area) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tổng đơn đặt chỗ</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-[#00152A]">{summary.totalBookings}</div>
          <p className="mt-1 text-[11px] text-slate-400">Theo bộ lọc hiện tại</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tổng số hành khách</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <span className="material-symbols-outlined text-[18px]">group</span>
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-[#00152A]">{summary.totalParticipants}</div>
          <p className="mt-1 text-[11px] text-slate-400">Lượt khách tham gia</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Doanh thu xác nhận</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-[#006B5F]">
            {formatCurrencyVND(summary.totalConfirmedAmount)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Đơn đã xác nhận & hoàn tất</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <form onSubmit={handleApplyFilter} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Tour Filter */}
            <div>
              <label htmlFor="filter-tour" className="block text-[11px] font-bold text-slate-600 mb-1">
                Gói tour
              </label>
              <select
                id="filter-tour"
                value={tourId}
                onChange={(e) => setTourId(e.target.value)}
                disabled={!isDemoPermitted}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#006B5F] focus:outline-hidden focus:ring-1 focus:ring-[#006B5F] disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="ALL">Tất cả gói tour</option>
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
                Trạng thái đơn
              </label>
              <select
                id="filter-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={!isDemoPermitted}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#006B5F] focus:outline-hidden focus:ring-1 focus:ring-[#006B5F] disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="Confirmed">Đã xác nhận</option>
                <option value="PendingPayment">Chờ thanh toán</option>
                <option value="Cancelled">Đã hủy</option>
                <option value="Completed">Đã hoàn thành</option>
              </select>
            </div>

            {/* Departure Start Date */}
            <div>
              <label htmlFor="filter-start-date" className="block text-[11px] font-bold text-slate-600 mb-1">
                Khởi hành từ ngày
              </label>
              <input
                id="filter-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={!isDemoPermitted}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-[#006B5F] focus:outline-hidden focus:ring-1 focus:ring-[#006B5F] disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {/* Departure End Date */}
            <div>
              <label htmlFor="filter-end-date" className="block text-[11px] font-bold text-slate-600 mb-1">
                Đến ngày
              </label>
              <input
                id="filter-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm mã đơn (BK-...) hoặc tên người liên hệ"
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
                Đặt lại
              </button>
              <button
                type="submit"
                disabled={!isDemoPermitted}
                className="rounded-xl bg-[#006B5F] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005249] transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">filter_alt</span>
                <span>Áp dụng lọc</span>
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
            <p className="mt-2">Đang tải danh sách đơn đặt chỗ...</p>
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
                Hệ thống chưa kết nối dữ liệu từ Backend.
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
                    <th scope="col" className="px-4 py-3.5">Mã đơn đặt chỗ</th>
                    <th scope="col" className="px-4 py-3.5">Gói tour</th>
                    <th scope="col" className="px-4 py-3.5">Khởi hành (CR-07)</th>
                    <th scope="col" className="px-4 py-3.5">Người liên hệ</th>
                    <th scope="col" className="px-4 py-3.5 text-center">Số khách</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Tổng tiền</th>
                    <th scope="col" className="px-4 py-3.5">Trạng thái</th>
                    <th scope="col" className="px-4 py-3.5">Check-in</th>
                    <th scope="col" className="px-4 py-3.5 text-center">Thao tác</th>
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
                          Chi tiết
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
                      <span className="text-slate-400 text-[11px] block">Khởi hành:</span>
                      <span className="font-semibold text-slate-800">{formatVietnamDate(b.departureDate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Số khách:</span>
                      <span className="font-semibold text-slate-800">{b.participantsCount} người</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Người liên hệ:</span>
                      <span className="font-semibold text-slate-800 truncate block">{b.contactName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Check-in:</span>
                      <CheckInStatusBadge status={b.checkInStatus} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Tổng tiền:</span>
                      <span className="font-bold text-sm text-[#006B5F]">{formatCurrencyVND(b.totalAmount)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleViewDetail(b)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-[#006B5F] hover:bg-slate-50 transition shadow-2xs"
                    >
                      Chi tiết đơn
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls (CR-01 / BR-52) */}
            {result.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/50 text-xs">
                <span className="text-slate-500">
                  Hiển thị trang <strong>{result.page}</strong> / <strong>{result.totalPages}</strong> ({result.totalCount} đơn đặt chỗ)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={result.page <= 1}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(result.totalPages, p + 1))}
                    disabled={result.page >= result.totalPages}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
                  >
                    Sau
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
