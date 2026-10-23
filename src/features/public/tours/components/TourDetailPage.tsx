'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { useWebSession } from '@/features/auth/session/useWebSession';
import { getTourDetail, isTourDemoAllowedInCurrentEnv } from '../services/tourApi';
import { TourApiError, type TourDetailDto } from '../types/tour';
import { TourDetailView } from './TourDetailView';

interface TourDetailPageProps {
  id: string;
}

type FailureKind = 'notFound' | 'unavailable';

interface Failure {
  kind: FailureKind;
  message: string;
}

const UNAVAILABLE_FALLBACK =
  'TripMate tạm thời không thể tải chi tiết tour. Vui lòng kiểm tra kết nối và thử lại (MSG127).';

function classifyFailure(caught: unknown): Failure {
  if (caught instanceof TourApiError) {
    return {
      kind: caught.status === 404 ? 'notFound' : 'unavailable',
      message: caught.message,
    };
  }

  return { kind: 'unavailable', message: UNAVAILABLE_FALLBACK };
}

export function TourDetailPage({ id }: TourDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useWebSession();
  const isDemo = searchParams.get('demo') === '1' && isTourDemoAllowedInCurrentEnv();

  const [tour, setTour] = useState<TourDetailDto | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  // Any change of tour, demo mode or retry attempt starts a fresh load (derived reset, no effect-time setState).
  const currentKey = `${id}-${isDemo}-${attempt}`;
  const [prevKey, setPrevKey] = useState(currentKey);
  if (currentKey !== prevKey) {
    setPrevKey(currentKey);
    setLoading(true);
    setFailure(null);
    setTour(null);
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
        setFailure(classifyFailure(caught));
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
  }, [id, isDemo, attempt]);

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

  const backButton = (
    <button
      type="button"
      onClick={handleBackToResults}
      className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#007d6e] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#006b5f]"
    >
      <span className="material-symbols-outlined text-base">arrow_back</span>
      <span>Quay lại danh sách tour</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">

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
        ) : failure?.kind === 'notFound' ? (
          <div className="mx-auto max-w-3xl px-4 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <span className="material-symbols-outlined text-4xl">search_off</span>
            </div>
            <h1 className="mb-3 text-2xl font-black text-[#00152a]">Không tìm thấy gói tour</h1>
            <p className="mx-auto mb-6 max-w-xl text-sm leading-relaxed text-slate-600">{failure.message}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">{backButton}</div>
          </div>
        ) : failure ? (
          <div className="mx-auto max-w-3xl px-4 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <span className="material-symbols-outlined text-4xl">cloud_off</span>
            </div>
            <h1 className="mb-3 text-2xl font-black text-[#00152a]">Chưa thể tải chi tiết tour</h1>
            <p role="alert" className="mx-auto mb-6 max-w-xl text-sm leading-relaxed text-slate-600">
              {failure.message}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setAttempt((value) => value + 1)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#007d6e] bg-white px-5 py-2.5 text-sm font-bold text-[#007d6e] transition hover:bg-teal-50"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                <span>Thử lại</span>
              </button>
              {backButton}

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
        ) : tour ? (
          <TourDetailView
            tour={tour}
            onBackToResults={handleBackToResults}
            isAuthenticated={status === 'authenticated'}
          />
        ) : null}
      </main>
    </div>
  );
}
