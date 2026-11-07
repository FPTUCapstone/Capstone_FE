'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { EmergencyTourImpactResponse } from '../types';
import { getEmergencyImpact } from '../operatorEmergencyApi';
import { PAYMENT_HANDLING_NOTICE } from './EmergencyConfirmationDialog';
import { departureStatusLabel } from '../departureStatusLabel';

interface EmergencyImpactPanelProps {
  tourId: number;
  scheduleId: number;
  onProceed: (impact: EmergencyTourImpactResponse) => void;
  className?: string;
}

export function EmergencyImpactPanel({
  tourId,
  scheduleId,
  onProceed,
  className = '',
}: EmergencyImpactPanelProps) {
  const [impact, setImpact] = useState<EmergencyTourImpactResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadImpact = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmergencyImpact(tourId, scheduleId);
      setImpact(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tính toán tác động vận hành';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [tourId, scheduleId]);

  useEffect(() => {
    let isMounted = true;
    getEmergencyImpact(tourId, scheduleId)
      .then((data) => {
        if (isMounted) {
          setImpact(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Không thể tính toán tác động vận hành';
          setError(msg);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [tourId, scheduleId]);

  if (loading) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 space-y-2 ${className}`}>
        <span className="material-symbols-outlined text-3xl animate-spin text-teal-600" aria-hidden="true">
          progress_activity
        </span>
        <p className="text-xs font-semibold">Đang tính toán tác động vận hành từ máy chủ...</p>
      </div>
    );
  }

  if (error || !impact) {
    return (
      <div className={`rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3 ${className}`}>
        <span className="material-symbols-outlined text-3xl text-rose-600" aria-hidden="true">
          report
        </span>
        <p className="text-xs font-bold text-rose-800">
          {error || 'Lỗi khi tải thông tin tác động.'}
        </p>
        <button
          type="button"
          onClick={loadImpact}
          className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const isCancel = impact.action === 'CancelBeforeDeparture';
  const isStop = impact.action === 'EmergencyStopActive';
  const hasNoAction = !isCancel && !isStop;
  const isBlockedByUnverified = impact.hasUnverifiedSessions;

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-5 ${className}`}>
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-700" aria-hidden="true">
              analytics
            </span>
            Xem trước tác động vận hành
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu do máy chủ tính toán thời gian thực theo lịch khởi hành #{scheduleId} &bull; Trạng thái:{' '}
            <span className="font-semibold text-slate-700">{departureStatusLabel(impact.scheduleStatus)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={loadImpact}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
          title="Tính lại tác động trước khi ra quyết định"
        >
          <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
            refresh
          </span>
          Làm mới tác động
        </button>
      </div>

      {/* Unverified Sessions Alert Banner (Fail-Closed) */}
      {impact.hasUnverifiedSessions && (
        <div className="flex items-start gap-3 rounded-lg border-2 border-rose-300 bg-rose-50 p-4 text-rose-900">
          <span className="material-symbols-outlined text-rose-600 text-2xl shrink-0" aria-hidden="true">
            dangerous
          </span>
          <div className="text-xs">
            <p className="font-bold text-sm">
              Không thể thực hiện hủy hoặc dừng tour
            </p>
            <p className="mt-1 text-rose-800 leading-relaxed">
              Có phiên đi tour chưa đồng bộ trạng thái hoặc kết nối ngoại tuyến. Hệ thống khóa các thao tác khẩn cấp để đảm bảo an toàn hành khách.
            </p>
          </div>
        </div>
      )}

      {/* Commercial Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
          <span className="text-slate-500 block">Đơn đã thanh toán:</span>
          <span className="text-lg font-bold text-slate-900">{impact.paidBookingCount}</span>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
          <span className="text-slate-500 block">Đơn chưa thanh toán:</span>
          <span className="text-lg font-bold text-slate-900">{impact.unpaidBookingCount}</span>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
          <span className="text-slate-500 block">Hành khách ảnh hưởng:</span>
          <span className="text-lg font-bold text-slate-900">{impact.totalPassengerCount}</span>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
          <span className="text-slate-500 block">Phiên tour đang chạy:</span>
          <span className="text-lg font-bold text-slate-900">{impact.activeSessionCount}</span>
        </div>
      </div>

      {/* Tickets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
          <span className="text-slate-500 block">Vé chưa dùng:</span>
          <span className="text-sm font-bold text-slate-800">{impact.unusedTicketCount} vé</span>
        </div>
      </div>
      <p className="text-[11px] text-slate-500">{PAYMENT_HANDLING_NOTICE}</p>

      {/* Suggested Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="text-xs text-slate-600">
          <span className="font-semibold">Thao tác khả dụng: </span>
          {isCancel && <span className="text-amber-800 font-bold">Hủy trước khởi hành</span>}
          {isStop && <span className="text-rose-800 font-bold">Dừng khẩn cấp tour đang chạy</span>}
          {hasNoAction && <span className="text-slate-500 font-medium">Không có hành động phù hợp</span>}
        </div>

        <div>
          {isCancel && (
            <button
              type="button"
              disabled={isBlockedByUnverified}
              onClick={() => onProceed(impact)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-amber-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                cancel
              </span>
              Tiến hành hủy trước khởi hành
            </button>
          )}

          {isStop && (
            <button
              type="button"
              disabled={isBlockedByUnverified}
              onClick={() => onProceed(impact)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-rose-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                stop_circle
              </span>
              Tiến hành dừng khẩn cấp
            </button>
          )}

          {hasNoAction && (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-4 py-2 text-xs font-bold text-slate-500 cursor-not-allowed"
            >
              Không có hành động khẩn cấp khả dụng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
