'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { getTourDetail, isTourDemoAllowedInCurrentEnv } from '../services/tourApi';
import type { TourDetailDto } from '../types/tour';
import { TourDetailView } from './TourDetailView';

interface TourDetailPageProps {
  id: string;
}

export function TourDetailPage({ id }: TourDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useWebSession();
  const isDemo = searchParams.get('demo') === '1' && isTourDemoAllowedInCurrentEnv();

  const [tour, setTour] = useState<TourDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPendingBe, setIsPendingBe] = useState(false);

  const currentKey = `${id}-${isDemo}`;
  const [prevKey, setPrevKey] = useState(currentKey);
  if (currentKey !== prevKey) {
    setPrevKey(currentKey);
    setLoading(true);
    setErrorMessage(null);
    setIsPendingBe(false);
  }

  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();

    getTourDetail(id, { signal: controller.signal, allowDemo: isDemo })
      .then((data) => {
        if (!isCurrent) return;
        setTour(data);
      })
      .catch((caught: unknown) => {
        if (!isCurrent) return;
        if (caught instanceof Error && caught.name === 'AbortError') return;
        setIsPendingBe(true);
        const msg =
          caught instanceof Error
            ? caught.message
            : 'Chi tiết tour đang chờ hoàn tất kết nối API từ máy chủ (UC-26 — PENDING_BE_INTEGRATION).';
        setErrorMessage(msg);
      })
      .finally(() => {
        if (isCurrent) {
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [id, isDemo]);

  function handleBackToResults() {
    // Preserve any search parameters passed along
    const backParams = new URLSearchParams();
    searchParams.forEach((val, key) => {
      if (key !== 'demo') {
        backParams.set(key, val);
      }
    });
    const qs = backParams.toString();
    router.push(qs ? `/tours?${qs}` : '/tours');
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <PublicNavigation />

      <main className="py-6">
        {loading ? (
          <div
            role="status"
            aria-label="Đang tải chi tiết tour..."
            className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-pulse space-y-6"
          >
            <div className="h-6 w-48 rounded-md bg-slate-200" />
            <div className="h-10 w-3/4 rounded-lg bg-slate-200" />
            <div className="aspect-16/9 w-full rounded-3xl bg-slate-200" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-40 rounded-2xl bg-slate-200" />
                <div className="h-40 rounded-2xl bg-slate-200" />
              </div>
              <div className="h-64 rounded-2xl bg-slate-200" />
            </div>
            <span className="sr-only">Đang tải chi tiết tour...</span>
          </div>
        ) : isPendingBe || !tour ? (
          <div className="mx-auto max-w-3xl px-4 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-700">
              <span className="material-symbols-outlined text-4xl">travel_explore</span>
            </div>
            <h1 className="mb-3 text-2xl font-black text-[#00152a]">
              Chi Tiết Tour Đang Chờ Kết Nối Backend
            </h1>
            <p className="mb-6 text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
              {errorMessage ||
                'Tính năng xem chi tiết tour (UC-26) hiện đang trong quá trình hoàn tất kết nối API từ máy chủ TripMate (PENDING_BE_INTEGRATION).'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleBackToResults}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#007d6e] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#006b5f]"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>Quay lại danh sách tour</span>
              </button>

              {isTourDemoAllowedInCurrentEnv() && (
                <Link
                  href={`/tours/${encodeURIComponent(id)}?demo=1`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-100"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  <span>Xem bản mô phỏng giao diện (Demo Mode)</span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <TourDetailView
            tour={tour}
            onBackToResults={handleBackToResults}
            isAuthenticated={status === 'authenticated'}
          />
        )}
      </main>
    </div>
  );
}
