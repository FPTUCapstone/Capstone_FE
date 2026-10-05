'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

import { ROUTES } from '@/lib/routes';
import { getTripHistory } from '../services/tripHistoryApi';
import type {
  TripCardDto,
  TripHistoryFilter,
  TripState,
  TripSummaryStatsDto,
} from '../types/tripHistory';
import { TripCard } from './TripCard';
import { TripFiltersBar } from './TripFiltersBar';
import { TripSummaryBanner } from './TripSummaryBanner';
import { useModalFocusTrap } from './useModalFocusTrap';

export function TripHistoryView() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1';

  const [activeTab, setActiveTab] = useState<TripState>('Completed');
  const [tripType, setTripType] = useState<'ALL' | 'TourBooking' | 'SelfPlannedItinerary'>('ALL');
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const pageSize = 20;

  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<TripCardDto[]>([]);
  const [summary, setSummary] = useState<TripSummaryStatsDto | undefined>(undefined);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Review modal state & accessibility focus trap
  const [selectedReviewTrip, setSelectedReviewTrip] = useState<TripCardDto | null>(null);
  const reviewCloseButtonRef = useRef<HTMLButtonElement>(null);

  const reviewDialogRef = useModalFocusTrap<HTMLDivElement>({
    isOpen: Boolean(selectedReviewTrip),
    onClose: () => setSelectedReviewTrip(null),
    initialFocusRef: reviewCloseButtonRef,
  });

  const [retryIndex, setRetryIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const filter: TripHistoryFilter = {
      tab: activeTab,
      tripType,
      searchQuery: submittedSearchQuery,
      fromDate,
      toDate,
      page,
      pageSize,
    };

    getTripHistory(filter, { allowDemo: isDemo })
      .then((response) => {
        if (!isMounted) return;
        if (response.status === 'PENDING_BE_INTEGRATION') {
          setPendingNotice(
            response.message || 'Hệ thống lịch sử chuyến đi đang chờ kích hoạt dịch vụ máy chủ.'
          );
          setTrips([]);
          setTotalCount(0);
          setSummary(undefined);
        } else {
          setTrips(response.trips);
          setTotalCount(response.totalCount);
          setSummary(response.summary);
          setPendingNotice(null);
        }
        setErrorMessage(null);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setPendingNotice(null);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'TripMate tạm thời không thể xử lý yêu cầu. Vui lòng thử lại (MSG127).'
        );
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab, tripType, submittedSearchQuery, fromDate, toDate, page, isDemo, retryIndex]);

  const handleRetry = () => {
    setLoading(true);
    setErrorMessage(null);
    setPendingNotice(null);
    setRetryIndex((prev) => prev + 1);
  };

  const handleTabChange = (newTab: TripState) => {
    if (newTab === activeTab) return;
    setLoading(true);
    setTrips([]);
    setErrorMessage(null);
    setPendingNotice(null);
    setActiveTab(newTab);
    setPage(1);
  };

  const handleTripTypeChange = (newType: 'ALL' | 'TourBooking' | 'SelfPlannedItinerary') => {
    setLoading(true);
    setTrips([]);
    setErrorMessage(null);
    setPendingNotice(null);
    setTripType(newType);
    setPage(1);
  };

  const handleSearchSubmit = (newQuery: string) => {
    setLoading(true);
    setTrips([]);
    setErrorMessage(null);
    setPendingNotice(null);
    setSubmittedSearchQuery(newQuery);
    setPage(1);
  };

  const handleDateRangeChange = (newFrom: string, newTo: string) => {
    setLoading(true);
    setTrips([]);
    setErrorMessage(null);
    setPendingNotice(null);
    setFromDate(newFrom);
    setToDate(newTo);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setLoading(true);
    setErrorMessage(null);
    setPendingNotice(null);
    setPage(newPage);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6">
      {/* Demo Mode Alert Banner */}
      {isDemo && (
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600" aria-hidden="true">
              science
            </span>
            <span>
              <strong>Bản xem trước DEMO:</strong> Dữ liệu chuyến đi mẫu đang được hiển thị theo thiết kế Stitch & Report 3.
            </span>
          </div>
          <span className="rounded bg-amber-200 px-2 py-0.5 font-bold uppercase tracking-wider text-amber-800 text-[10px]">
            DEMO ONLY
          </span>
        </div>
      )}

      {/* Segmented Tabs Control (Report 3 §3.7.1 & Stitch) */}
      <div className="flex items-center rounded-2xl bg-slate-200/70 p-1.5 shadow-2xs">
        <button
          type="button"
          onClick={() => handleTabChange('Upcoming')}
          className={`flex-1 rounded-xl py-2.5 text-center text-xs font-bold transition-all sm:text-sm ${
            activeTab === 'Upcoming'
              ? 'bg-white text-[#00152A] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Sắp tới
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('Completed')}
          className={`flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-center text-xs font-bold transition-all sm:text-sm flex ${
            activeTab === 'Completed'
              ? 'bg-white text-[#00152A] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="inline-block h-2 w-2 rounded-full bg-[#006B5F]" />
          <span>Đã hoàn thành</span>
          {activeTab === 'Completed' && totalCount > 0 && (
            <span className="rounded-full bg-[#E6F4F1] px-1.5 py-0.2 text-[10px] font-extrabold text-[#006B5F]">
              {totalCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('Cancelled')}
          className={`flex-1 rounded-xl py-2.5 text-center text-xs font-bold transition-all sm:text-sm ${
            activeTab === 'Cancelled'
              ? 'bg-white text-[#00152A] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Đã hủy / Hoàn tiền
        </button>
      </div>

      {/* KPI Summary Banner (Only when summary exists or completed tab) */}
      {summary && <TripSummaryBanner summary={summary} isDemo={isDemo} />}

      {/* Filter and Search Bar */}
      <TripFiltersBar
        tripType={tripType}
        onTripTypeChange={handleTripTypeChange}
        searchQuery={submittedSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={handleDateRangeChange}
      />

      {/* Main State Views */}
      {loading ? (
        <div aria-label="Đang tải danh sách chuyến đi" className="space-y-4">
          <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      ) : pendingNotice ? (
        <div
          role="status"
          className="rounded-2xl border border-teal-200 bg-[#E6F4F1]/60 p-6 text-center text-slate-700 shadow-2xs sm:p-8"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#006B5F] shadow-xs">
            <span className="material-symbols-outlined text-[26px]" aria-hidden="true">
              cloud_sync
            </span>
          </div>
          <h3 className="text-base font-bold text-[#00152A]">
            Dịch vụ lịch sử chuyến đi
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs text-slate-600 leading-relaxed">
            {pendingNotice}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Thử lại kết nối
            </button>
            <Link
              href={ROUTES.plan}
              className="rounded-xl bg-[#006B5F] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#00574D]"
            >
              Lên lịch trình mới
            </Link>
          </div>
        </div>
      ) : errorMessage ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800 sm:p-8"
        >
          <span className="material-symbols-outlined mx-auto mb-2 text-[32px] text-rose-600" aria-hidden="true">
            error
          </span>
          <h3 className="text-base font-bold text-rose-900">Không thể tải dữ liệu</h3>
          <p className="mt-1 text-xs">{errorMessage}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
          >
            Thử lại
          </button>
        </div>
      ) : trips.length === 0 ? (
        <div
          role="status"
          className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12"
        >
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
              luggage
            </span>
          </div>
          <h3 className="text-base font-bold text-[#00152A]">
            Chưa có chuyến đi nào
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Không tìm thấy chuyến đi phù hợp với tiêu chí lọc của bạn (MSG128).
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={ROUTES.plan}
              className="rounded-xl bg-[#006B5F] px-4 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-[#00574D]"
            >
              Lên lịch trình thông minh
            </Link>
            <Link
              href={ROUTES.tours}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
            >
              Khám phá tour bản địa
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>
              Hiển thị <strong className="text-slate-800">{trips.length}</strong> /{' '}
              <strong className="text-slate-800">{totalCount}</strong> chuyến đi
            </span>
            <span className="text-[11px] text-slate-400">Thời gian tính theo GMT+7 (CR-07)</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {trips.map((trip) => (
              <TripCard
                key={trip.tripId}
                trip={trip}
                onViewReview={(t) => setSelectedReviewTrip(t)}
              />
            ))}
          </div>

          {/* Pagination controls per CR-01 */}
          {totalCount > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row">
              <p className="text-xs text-slate-500">
                Trang <span className="font-bold text-slate-800">{page}</span> /{' '}
                <span className="font-bold text-slate-800">{totalPages}</span> (Tổng số {totalCount} chuyến đi)
              </p>
              <div
                className="flex items-center gap-1.5"
                role="navigation"
                aria-label="Phân trang danh sách chuyến đi"
              >
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Trang trước"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  <span>Trước</span>
                </button>

                <span className="px-2 text-xs font-bold text-slate-800">
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Trang sau"
                >
                  <span>Sau</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submitted Review Modal */}
      {selectedReviewTrip && (
        <div
          ref={reviewDialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Đã đánh giá
                </span>
                <h4 id="review-dialog-title" className="mt-1 text-base font-extrabold text-[#00152A]">
                  {selectedReviewTrip.title}
                </h4>
              </div>
              <button
                ref={reviewCloseButtonRef}
                type="button"
                onClick={() => setSelectedReviewTrip(null)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 text-xs">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <span className="text-sm">★ {selectedReviewTrip.rating}.0 / 5.0</span>
                <span className="text-slate-500 font-normal">
                  (Đánh giá trải nghiệm)
                </span>
              </div>

              {selectedReviewTrip.reviewComment && (
                <div>
                  <p className="font-semibold text-slate-700">Cảm nhận:</p>
                  <p className="mt-1 text-slate-600 leading-relaxed italic">
                    &ldquo;{selectedReviewTrip.reviewComment}&rdquo;
                  </p>
                </div>
              )}

              {selectedReviewTrip.reviewedAtUtc && (
                <p className="text-[11px] text-slate-400">
                  Gửi lúc: {new Date(selectedReviewTrip.reviewedAtUtc).toLocaleString('vi-VN')}
                </p>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReviewTrip(null)}
                className="rounded-xl bg-[#006B5F] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#00574D]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
