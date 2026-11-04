'use client';

import React, { useState } from 'react';
import type {
  EmergencyTourImpactResponse,
  EmergencyTourReason,
  CancelBeforeDepartureRequest,
  EmergencyTourActionResponse,
} from '../types';
import { cancelBeforeDeparture, getEmergencyImpact } from '../operatorEmergencyApi';
import { EmergencyConfirmationDialog } from './EmergencyConfirmationDialog';

interface CancelBeforeDepartureFormProps {
  impact: EmergencyTourImpactResponse;
  onSuccess: (result: EmergencyTourActionResponse) => void;
  onCancel: () => void;
  className?: string;
}

const REASON_OPTIONS: Array<{ value: EmergencyTourReason; label: string }> = [
  { value: 'WeatherEmergency', label: 'Thời tiết nguy hiểm / Bão lũ (WeatherEmergency)' },
  { value: 'AuthorityDirective', label: 'Chỉ thị cơ quan chức năng / Cấm biển (AuthorityDirective)' },
  { value: 'DestinationUnavailable', label: 'Điểm đến bị cô lập / Không khả dụng (DestinationUnavailable)' },
  { value: 'TransportFailure', label: 'Sự cố phương tiện vận chuyển chính (TransportFailure)' },
  { value: 'SafetyIncident', label: 'Sự cố mất an toàn khẩn cấp (SafetyIncident)' },
  { value: 'Other', label: 'Trường hợp bất khả kháng khác (Other)' },
];

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function CancelBeforeDepartureForm({
  impact,
  onSuccess,
  onCancel,
  className = '',
}: CancelBeforeDepartureFormProps) {
  const [currentImpact, setCurrentImpact] = useState<EmergencyTourImpactResponse>(impact);
  const [reason, setReason] = useState<EmergencyTourReason>('WeatherEmergency');
  const [reasonDetails, setReasonDetails] = useState('');
  const [evidenceReference, setEvidenceReference] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateUuid());

  const handleOpenConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonDetails.trim()) {
      setError('Vui lòng nhập chi tiết lý do hủy lịch khởi hành.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      // Re-verify impact right before opening confirmation
      const freshImpact = await getEmergencyImpact(impact.tourId, impact.scheduleId);
      if (freshImpact.impactVersion !== currentImpact.impactVersion || freshImpact.hasUnverifiedSessions) {
        setError(
          'Dữ liệu tác động vừa được cập nhật trên hệ thống (hoặc có phiên chưa đồng bộ). Vui lòng xem lại tác động mới nhất trước khi xác nhận.'
        );
        setCurrentImpact(freshImpact);
        return;
      }
      setCurrentImpact(freshImpact);
      setShowConfirm(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xác thực lại tác động vận hành trước khi xác nhận.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    setError(null);

    const payload: CancelBeforeDepartureRequest = {
      impactVersion: currentImpact.impactVersion,
      reason,
      reasonDetails: reasonDetails.trim(),
      evidenceReference: evidenceReference.trim() || null,
      emergencyContact: emergencyContact.trim() || null,
      addEvidenceLater: reason === 'AuthorityDirective' && !evidenceReference.trim(),
    };

    try {
      const result = await cancelBeforeDeparture(
        currentImpact.tourId,
        currentImpact.scheduleId,
        payload,
        idempotencyKey
      );
      onSuccess(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi thực hiện hủy lịch tour';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleOpenConfirm}
        className={`rounded-xl border border-amber-200 bg-amber-50/40 p-5 shadow-2xs space-y-4 ${className}`}
      >
        <div className="border-b border-amber-200/60 pb-3">
          <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-700" aria-hidden="true">
              cancel
            </span>
            Xác nhận Hủy trước khởi hành (Pre-Departure Cancellation)
          </h3>
          <p className="mt-1 text-xs text-amber-900">
            Lịch khởi hành chưa diễn ra. Việc hủy sẽ cập nhật trạng thái lịch thành Cancelled,
            và hủy các đơn đặt chỗ liên quan.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
            {error}
          </div>
        )}

        <div className="space-y-3 text-xs">
          <div>
            <label htmlFor="cancel-reason" className="block font-semibold text-slate-800 mb-1">
              Lý do hủy khẩn cấp <span className="text-rose-600">*</span>
            </label>
            <select
              id="cancel-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value as EmergencyTourReason);
                setIdempotencyKey(generateUuid());
              }}
              disabled={submitting}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
            >
              {REASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cancel-details" className="block font-semibold text-slate-800 mb-1">
              Chi tiết lý do <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="cancel-details"
              rows={3}
              maxLength={1000}
              required
              value={reasonDetails}
              onChange={(e) => {
                setReasonDetails(e.target.value);
                setIdempotencyKey(generateUuid());
              }}
              disabled={submitting}
              placeholder="Mô tả cụ thể tình hình thời tiết hoặc công điện khẩn của cơ quan quản lý..."
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
            />
            <div className="mt-0.5 text-right text-[11px] text-slate-500">
              {reasonDetails.length} / 1000 ký tự
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="cancel-evidence" className="block font-semibold text-slate-800 mb-1">
                Liên kết văn bản / bằng chứng (Tùy chọn)
              </label>
              <input
                id="cancel-evidence"
                type="url"
                value={evidenceReference}
                onChange={(e) => {
                  setEvidenceReference(e.target.value);
                  setIdempotencyKey(generateUuid());
                }}
                disabled={submitting}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
              />
            </div>
            <div>
              <label htmlFor="cancel-contact" className="block font-semibold text-slate-800 mb-1">
                Đầu mối liên hệ hỗ trợ du khách (Tùy chọn)
              </label>
              <input
                id="cancel-contact"
                type="text"
                value={emergencyContact}
                onChange={(e) => {
                  setEmergencyContact(e.target.value);
                  setIdempotencyKey(generateUuid());
                }}
                disabled={submitting}
                placeholder="Số điện thoại hotline điều hành..."
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-200/60">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Quay lại
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-amber-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 disabled:opacity-50 transition"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin" aria-hidden="true">
                  progress_activity
                </span>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>Xác nhận hủy trước khởi hành</span>
            )}
          </button>
        </div>
      </form>

      <EmergencyConfirmationDialog
        isOpen={showConfirm}
        title="Bạn có chắc chắn muốn hủy lịch khởi hành này?"
        actionType="CancelBeforeDeparture"
        affectedBookings={currentImpact.paidBookingCount + currentImpact.unpaidBookingCount}
        affectedPassengers={currentImpact.totalPassengerCount}
        onConfirm={handleConfirmedSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
