'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

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

export function TripHistoryView() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1';

  const [activeTab, setActiveTab] = useState<TripState>('Completed');
  const [tripType, setTripType] = useState<'ALL' | 'TourBooking' | 'SelfPlannedItinerary'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<TripCardDto[]>([]);
  const [summary, setSummary] = useState<TripSummaryStatsDto | undefined>(undefined);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Review modal state
  const [selectedReviewTrip, setSelectedReviewTrip] = useState<TripCardDto | null>(null);

  const [retryIndex, setRetryIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const filter: TripHistoryFilter = {
      tab: activeTab,
      tripType,
      searchQuery,
      fromDate,
      toDate,
    };

    getTripHistory(filter, { allowDemo: isDemo })
      .then((response) => {
        if (!isMounted) return;
        if (response.status === 'PENDING_BE_INTEGRATION') {
          setPendingNotice(
            response.message || 'Hệ thống lịch sử chuyến đi đang chờ kích hoạt dịch vụ máy chủ.'
          );
          setTrips([]);
          setSummary(undefined);
        } else {
          setTrips(response.trips);
          setSummary(response.summary);
          setPendingNotice(null);
        }
        setErrorMessage(null);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
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
  }, [activeTab, tripType, searchQuery, fromDate, toDate, isDemo, retryIndex]);

  const handleRetry = () => {
    setLoading(true);
    setRetryIndex((prev) => prev + 1);
  };

  const handleDateRangeChange = (newFrom: string, newTo: string) => {
    setLoading(true);
    setFromDate(newFrom);
    setToDate(newTo);
  };

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
          onClick={() => setActiveTab('Upcoming')}
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
          onClick={() => setActiveTab('Completed')}
          className={`flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-center text-xs font-bold transition-all sm:text-sm flex ${
            activeTab === 'Completed'
              ? 'bg-white text-[#00152A] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="inline-block h-2 w-2 rounded-full bg-[#006B5F]" />
          <span>Đã hoàn thành</span>
          {activeTab === 'Completed' && trips.length > 0 && (
            <span className="rounded-full bg-[#E6F4F1] px-1.5 py-0.2 text-[10px] font-extrabold text-[#006B5F]">
              {trips.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('Cancelled')}
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
        onTripTypeChange={setTripType}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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
            <span>Hiển thị {trips.length} chuyến đi</span>
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
        </div>
      )}

      {/* Submitted Review Modal */}
      {selectedReviewTrip && (
        <div
          role="dialog"
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
