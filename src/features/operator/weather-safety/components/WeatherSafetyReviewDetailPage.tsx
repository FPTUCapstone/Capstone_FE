'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { WeatherSafetyReview } from '../types';
import {
  getWeatherSafetyReview,
  acknowledgeWeatherSafetyReview,
  WeatherSafetyApiError,
} from '../weatherSafetyApi';
import { WeatherSafetyReviewStatusBadge } from './WeatherSafetyReviewStatusBadge';
import { ReviewDeadline } from './ReviewDeadline';
import { WeatherEventSummary } from './WeatherEventSummary';
import { AcknowledgeReviewForm } from './AcknowledgeReviewForm';
import { useWeatherSafetyRealtime } from '../realtime/useWeatherSafetyRealtime';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { EmergencyImpactPanel } from '@/features/operator/tours/emergency/components/EmergencyImpactPanel';
import { CancelBeforeDepartureForm } from '@/features/operator/tours/emergency/components/CancelBeforeDepartureForm';
import { EmergencyStopForm } from '@/features/operator/tours/emergency/components/EmergencyStopForm';
import { EmergencyEvidenceEditor } from '@/features/operator/tours/emergency/components/EmergencyEvidenceEditor';
import { refundResultMessage } from '@/features/operator/tours/emergency/refundMessages';
import type {
  EmergencyTourImpactResponse,
  EmergencyTourActionResponse,
} from '@/features/operator/tours/emergency/types';

interface WeatherSafetyReviewDetailPageProps {
  reviewId: number;
  onBack?: () => void;
}

export function WeatherSafetyReviewDetailPage({
  reviewId,
  onBack,
}: WeatherSafetyReviewDetailPageProps) {
  const { status: sessionStatus } = useWebSession();
  const [review, setReview] = useState<WeatherSafetyReview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const isFetchingRef = useRef<boolean>(false);

  const [showEmergencyFlow, setShowEmergencyFlow] = useState(false);
  const [selectedImpact, setSelectedImpact] = useState<EmergencyTourImpactResponse | null>(null);
  const [actionSuccessResult, setActionSuccessResult] = useState<EmergencyTourActionResponse | null>(null);

  const loadReview = useCallback(async (isBackground = false) => {
    if (sessionStatus === 'restoring' || isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!isBackground) {
      setLoading(true);
      setError(null);
      setIsNotFound(false);
    }
    try {
      const data = await getWeatherSafetyReview(reviewId);
      setReview(data);
      setError(null);
      setIsNotFound(false);
    } catch (err: unknown) {
      if (err instanceof WeatherSafetyApiError && (err.status === 404 || err.status === 403)) {
        setIsNotFound(true);
      } else if (!isBackground) {
        const msg = err instanceof Error ? err.message : 'Không thể tải chi tiết cảnh báo';
        setError(msg);
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [reviewId, sessionStatus]);

  useWeatherSafetyRealtime({
    onRefreshHint: () => {
      void loadReview(true);
    },
  });

  useEffect(() => {
    if (sessionStatus === 'restoring') return;
    let isMounted = true;
    getWeatherSafetyReview(reviewId)
      .then((data) => {
        if (isMounted) {
          setReview(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          if (err instanceof WeatherSafetyApiError && (err.status === 404 || err.status === 403)) {
            setIsNotFound(true);
          } else {
            const msg = err instanceof Error ? err.message : 'Không thể tải chi tiết cảnh báo';
            setError(msg);
          }
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [reviewId, sessionStatus]);

  const handleAcknowledge = async (immediateInstructions: string | null) => {
    await acknowledgeWeatherSafetyReview(reviewId, { immediateInstructions });
    await loadReview();
  };

  const handleActionSuccess = async (result: EmergencyTourActionResponse) => {
    setActionSuccessResult(result);
    setSelectedImpact(null);
    setShowEmergencyFlow(false);
    await loadReview();
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-slate-500 gap-3">
        <span className="material-symbols-outlined text-4xl animate-spin text-[#174B4A]" aria-hidden="true">
          progress_activity
        </span>
        <p className="text-sm font-medium">Đang tải chi tiết cảnh báo thời tiết...</p>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <span className="material-symbols-outlined text-3xl" aria-hidden="true">
            search_off
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy hồ sơ cảnh báo</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Hồ sơ này không tồn tại hoặc bạn không có quyền truy cập vào thông tin cảnh báo này.
        </p>
        <div>
          <Link
            href="/partner/weather-safety-reviews"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#174B4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#103B39] transition"
          >
            &larr; Trở về danh sách cảnh báo
          </Link>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 space-y-3">
          <p className="text-sm font-bold text-rose-800">
            {error || 'Không thể tải chi tiết cảnh báo thời tiết.'}
          </p>
          <button
            type="button"
            onClick={() => void loadReview()}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const canDecide = review.status !== 'Closed';
  const refundResult = actionSuccessResult ? refundResultMessage(actionSuccessResult) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#174B4A]"
            >
              &larr; Danh sách
            </button>
          ) : (
            <Link
              href="/partner/weather-safety-reviews"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#174B4A]"
            >
              &larr; Danh sách
            </Link>
          )}
          <span className="text-slate-300">|</span>
          <span className="text-xs font-bold text-slate-500">
            Hồ sơ #{review.id} (Lịch #{review.tourScheduleId})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <WeatherSafetyReviewStatusBadge status={review.status} />
        </div>
      </div>

      {/* Deadline Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <ReviewDeadline deadlineUtc={review.acknowledgementDeadlineUtc} status={review.status} />
        {review.escalatedAtUtc && (
          <span className="text-xs text-rose-700 font-semibold">
            Đã chuyển cấp xử lý lúc:{' '}
            {new Date(review.escalatedAtUtc).toLocaleString('vi-VN', {
              timeZone: 'Asia/Ho_Chi_Minh',
            })}
          </span>
        )}
      </div>

      {/* Action Success Banner */}
      {actionSuccessResult && (
        <div className="rounded-xl border border-[#DCE2DD] bg-[#E8F0EA] p-4 text-[#1C2928] space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm">
            <span className="material-symbols-outlined text-[#174B4A]" aria-hidden="true">
              check_circle
            </span>
            <span>
              Thao tác thành công: {actionSuccessResult.action === 'CancelBeforeDeparture' ? 'Đã hủy trước khởi hành' : 'Đã dừng khẩn cấp tour'}
            </span>
          </div>
          <p className="text-xs text-[#5B6E69]">
            Mã thao tác: <strong>{actionSuccessResult.operationId}</strong> &bull; Đơn hủy/gián đoạn:{' '}
            {actionSuccessResult.affectedBookingCount}
          </p>
          {refundResult && <p className="text-xs text-[#5B6E69]">{refundResult}</p>}
        </div>
      )}

      {/* Weather Event Summary */}
      <WeatherEventSummary review={review} />

      {/* Acknowledge Form */}
      <AcknowledgeReviewForm review={review} onAcknowledge={handleAcknowledge} />

      {/* Emergency Decision Surface */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600" aria-hidden="true">
                health_and_safety
              </span>
              Quyết định vận hành khẩn cấp
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Thời tiết không tự động thay đổi trạng thái tour. Chỉ bạn mới có quyền quyết định hủy
              hoặc dừng tour sau khi xem xét báo cáo tác động.
            </p>
          </div>
          {canDecide && !showEmergencyFlow && !selectedImpact && (
            <button
              type="button"
              onClick={() => setShowEmergencyFlow(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
            >
              <span className="material-symbols-outlined text-[16px] text-[#174B4A]" aria-hidden="true">
                preview
              </span>
              Mở tính toán tác động &amp; Quyết định
            </button>
          )}
        </div>

        {canDecide && showEmergencyFlow && !selectedImpact && (
          <div className="pt-2">
            <EmergencyImpactPanel
              tourId={review.tourId}
              scheduleId={review.tourScheduleId}
              onProceed={(impact) => setSelectedImpact(impact)}
            />
          </div>
        )}

        {canDecide && selectedImpact && selectedImpact.action === 'CancelBeforeDeparture' && (
          <div className="pt-2">
            <CancelBeforeDepartureForm
              impact={selectedImpact}
              onSuccess={handleActionSuccess}
              onCancel={() => setSelectedImpact(null)}
            />
          </div>
        )}

        {canDecide && selectedImpact && selectedImpact.action === 'EmergencyStopActive' && (
          <div className="pt-2">
            <EmergencyStopForm
              impact={selectedImpact}
              onSuccess={handleActionSuccess}
              onCancel={() => setSelectedImpact(null)}
            />
          </div>
        )}

        {(actionSuccessResult ||
          review.scheduleStatus === 'Cancelled' ||
          review.scheduleStatus === 'EmergencyStopped') && (
          <div className="pt-4 border-t border-slate-100">
            <EmergencyEvidenceEditor
              tourId={review.tourId}
              scheduleId={review.tourScheduleId}
              onSuccess={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}
