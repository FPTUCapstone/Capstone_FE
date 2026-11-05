'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { WeatherSafetyReview, WeatherSafetyReviewStatus } from '../types';
import { listWeatherSafetyReviews } from '../weatherSafetyApi';
import { WeatherSafetyReviewList } from './WeatherSafetyReviewList';
import { useWeatherSafetyRealtime } from '../realtime/useWeatherSafetyRealtime';
import { useWebSession } from '@/features/auth/session/useWebSession';

interface WeatherSafetyReviewListPageProps {
  onSelectReview?: (reviewId: number) => void;
}

export function WeatherSafetyReviewListPage({
  onSelectReview,
}: WeatherSafetyReviewListPageProps) {
  const router = useRouter();
  const { status: sessionStatus } = useWebSession();
  const [reviews, setReviews] = useState<WeatherSafetyReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | WeatherSafetyReviewStatus>('ALL');
  const isFetchingRef = useRef<boolean>(false);

  const loadReviews = useCallback(async (isBackground = false) => {
    if (sessionStatus === 'restoring' || isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!isBackground) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await listWeatherSafetyReviews(
        filter === 'ALL' ? undefined : filter
      );
      setReviews(data);
      setError(null);
    } catch (err: unknown) {
      if (!isBackground) {
        const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
        setError(`Không thể tải danh sách cảnh báo: ${msg}`);
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [filter, sessionStatus]);

  useWeatherSafetyRealtime({
    onRefreshHint: () => {
      void loadReviews(true);
    },
  });

  useEffect(() => {
    if (sessionStatus === 'restoring') return;
    let isMounted = true;
    listWeatherSafetyReviews(filter === 'ALL' ? undefined : filter)
      .then((data) => {
        if (isMounted) {
          setReviews(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
          setError(`Không thể tải danh sách cảnh báo: ${msg}`);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [filter, sessionStatus]);

  const handleSelectReview = (reviewId: number) => {
    if (onSelectReview) {
      onSelectReview(reviewId);
    } else {
      router.push(`/partner/weather-safety-reviews/${reviewId}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-teal-700 text-3xl" aria-hidden="true">
            warning
          </span>
          Cảnh báo an toàn thời tiết
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Theo dõi các cảnh báo thiên tai, đối chiếu lịch khởi hành và thực hiện các quyết định thủ công
          đảm bảo an toàn hành khách.
        </p>
      </div>

      {/* Main Content State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
          <span className="material-symbols-outlined text-4xl animate-spin text-teal-600" aria-hidden="true">
            progress_activity
          </span>
          <p className="text-sm font-medium">Đang tải danh sách cảnh báo thời tiết...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
          <span className="material-symbols-outlined text-3xl text-rose-600" aria-hidden="true">
            error
          </span>
          <p className="text-sm font-semibold text-rose-800">{error}</p>
          <button
            type="button"
            onClick={() => void loadReviews()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              refresh
            </span>
            Thử lại
          </button>
        </div>
      ) : reviews.length === 0 && filter === 'ALL' ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500 space-y-2">
          <span className="material-symbols-outlined text-4xl text-slate-400" aria-hidden="true">
            verified
          </span>
          <p className="text-sm font-medium">Hiện không có cảnh báo thời tiết nào cần xử lý.</p>
        </div>
      ) : (
        <WeatherSafetyReviewList
          reviews={reviews}
          selectedFilter={filter}
          onFilterChange={setFilter}
          onSelectReview={handleSelectReview}
        />
      )}
    </div>
  );
}
