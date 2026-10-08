'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { tripReviewEn } from '@/features/trips/resources/en';
import {
  getTripById,
  PENDING_BE_INTEGRATION_ERROR_CODE,
} from '@/features/trips/services/tripHistoryApi';
import type { TripCardDto } from '@/features/trips/types/tripHistory';
import { ROUTES } from '@/lib/routes';
import { TripReviewView } from './TripReviewView';

interface TripReviewPageProps {
  tripId: string;
}

export function TripReviewPage({ tripId }: TripReviewPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1';

  const { status, context } = useWebSession();
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<TripCardDto | null>(null);
  const [fetchError, setFetchError] = useState<{
    type: 'NOT_FOUND' | 'FORBIDDEN' | 'PENDING_BE_INTEGRATION' | 'NETWORK';
    message: string;
  } | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(
        `${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.account.tripReview(tripId))}`
      );
    } else if (status === 'authenticated' && context?.role === 'TourOperator') {
      router.replace(ROUTES.partner.dashboard);
    } else if (status === 'authenticated' && context?.role === 'Administrator') {
      router.replace(ROUTES.admin.dashboard);
    }
  }, [status, context, router, tripId]);

  useEffect(() => {
    // Do not fire request until session resolution completes
    if (status !== 'authenticated' || context?.role !== 'Traveler') {
      return;
    }

    let isMounted = true;

    getTripById(tripId, { allowDemo: isDemo })
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          setFetchError({
            type: 'NOT_FOUND',
            message: tripReviewEn.errors.tripByIdNotFound(tripId),
          });
        } else {
          setTrip(data);
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const statusCode =
          typeof err === 'object' && err !== null && 'statusCode' in err
            ? (err as { statusCode: number }).statusCode
            : 0;
        const errorCode =
          typeof err === 'object' &&
          err !== null &&
          'details' in err &&
          typeof (err as { details?: unknown }).details === 'object' &&
          (err as { details?: { errorCode?: unknown } }).details !== null
            ? (err as { details: { errorCode?: unknown } }).details.errorCode
            : undefined;
        if (statusCode === 501 && errorCode === PENDING_BE_INTEGRATION_ERROR_CODE) {
          setFetchError({
            type: 'PENDING_BE_INTEGRATION',
            message:
              err instanceof Error && err.message.trim().length > 0
                ? err.message
                : tripReviewEn.reviewPage.pendingDetail,
          });
        } else if (statusCode === 401 || statusCode === 403) {
          setFetchError({
            type: 'FORBIDDEN',
            message: tripReviewEn.errors.reviewAccessDenied,
          });
        } else {
          setFetchError({
            type: 'NETWORK',
            message: tripReviewEn.errors.systemError,
          });
        }
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tripId, isDemo, status, context, retryCount]);

  if (status === 'restoring' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F6F7]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-3 border-[#006B5F] border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-[#59616B]">Đang tải thông tin chuyến đi…</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !context || context.role !== 'Traveler') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F3F6F7] text-[#00152A]" lang="vi">
      <PublicNavigation />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-semibold text-[#59616B]">
          <Link href={ROUTES.home} className="hover:text-[#006B5F] hover:underline">
            Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={ROUTES.account.trips} className="hover:text-[#006B5F] hover:underline">
            Chuyến đi của tôi
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#00152A]">Đánh giá chuyến đi</span>
        </nav>

        {/* Title Header */}
        <div className="mb-6 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="rounded bg-[#E6F4F1] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#006B5F]">
              UC-33
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Đánh giá & Phản hồi
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-[#00152A] sm:text-3xl">
            Đánh giá chuyến đi
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Ý kiến của bạn giúp cộng đồng du khách TripMate có những chuyến đi tuyệt vời hơn.
          </p>
        </div>

        {/* Eligibility Guard checks */}
        {fetchError ? (
          <div
            role={fetchError.type === 'NETWORK' ? 'alert' : 'status'}
            className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs"
          >
            <span className="material-symbols-outlined mx-auto mb-2 text-[32px] text-slate-400">
              {fetchError.type === 'NETWORK'
                ? 'cloud_off'
                : fetchError.type === 'PENDING_BE_INTEGRATION'
                  ? 'cloud_sync'
                  : 'search_off'}
            </span>
            <h3 className="text-base font-bold text-[#00152A]">
              {fetchError.type === 'NOT_FOUND'
                ? 'Không tìm thấy chuyến đi'
                : fetchError.type === 'FORBIDDEN'
                  ? 'Không có quyền truy cập'
                  : fetchError.type === 'PENDING_BE_INTEGRATION'
                    ? tripReviewEn.reviewPage.pendingTitle
                    : 'Lỗi kết nối máy chủ'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">{fetchError.message}</p>
            <div className="mt-5 flex items-center justify-center gap-3">
              {fetchError.type === 'NETWORK' && (
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setFetchError(null);
                    setRetryCount((c) => c + 1);
                  }}
                  className="rounded-xl bg-[#006B5F] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#00574D]"
                >
                  Thử lại
                </button>
              )}
              <Link
                href={ROUTES.account.trips}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Quay lại danh sách chuyến đi
              </Link>
            </div>
          </div>
        ) : !trip ? (
          <div
            role="status"
            className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs"
          >
            <span className="material-symbols-outlined mx-auto mb-2 text-[32px] text-slate-400">
              search_off
            </span>
            <h3 className="text-base font-bold text-[#00152A]">
              Không tìm thấy chuyến đi
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Chuyến đi #{tripId} không tồn tại hoặc bạn không có quyền xem chuyến đi này (MSG126).
            </p>
            <div className="mt-5">
              <Link
                href={ROUTES.account.trips}
                className="rounded-xl bg-[#006B5F] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#00574D]"
              >
                Quay lại danh sách chuyến đi
              </Link>
            </div>
          </div>
        ) : trip.status !== 'Completed' ? (
          <div
            role="alert"
            className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900 shadow-xs"
          >
            <span className="material-symbols-outlined mx-auto mb-2 text-[32px] text-amber-600">
              hourglass_empty
            </span>
            <h3 className="text-base font-bold text-amber-950">
              Chuyến đi chưa hoàn thành
            </h3>
            <p className="mt-1 text-xs text-amber-800">
              Bạn chỉ có thể gửi đánh giá cho những chuyến đi đã hoàn thành (MSG121 / BR-91).
            </p>
            <div className="mt-5">
              <Link
                href={ROUTES.account.trips}
                className="rounded-xl bg-[#006B5F] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#00574D]"
              >
                Quay lại danh sách chuyến đi
              </Link>
            </div>
          </div>
        ) : trip.isReviewed ? (
          <div
            role="status"
            className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center text-emerald-900 shadow-xs"
          >
            <span className="material-symbols-outlined mx-auto mb-2 text-[32px] text-emerald-600">
              task_alt
            </span>
            <h3 className="text-base font-bold text-emerald-950">
              Chuyến đi này đã được đánh giá
            </h3>
            <p className="mt-1 text-xs text-emerald-800">
              Bạn đã gửi đánh giá cho chuyến đi này ({trip.rating} sao) (MSG122 / BR-92).
            </p>
            {trip.reviewComment && (
              <p className="mt-2 text-xs italic text-emerald-700">
                &ldquo;{trip.reviewComment}&rdquo;
              </p>
            )}
            <div className="mt-5">
              <Link
                href={ROUTES.account.trips}
                className="rounded-xl bg-[#006B5F] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#00574D]"
              >
                Quay lại danh sách chuyến đi
              </Link>
            </div>
          </div>
        ) : (
          <TripReviewView trip={trip} />
        )}
      </main>
    </div>
  );
}
