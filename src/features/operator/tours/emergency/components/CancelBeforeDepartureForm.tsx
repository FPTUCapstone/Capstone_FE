'use client';

import React, { useState } from 'react';
import type {
  EmergencyTourImpactResponse,
  EmergencyTourReason,
  CancelBeforeDepartureRequest,
  EmergencyTourActionResponse,
} from '../types';
import { cancelBeforeDeparture, getEmergencyImpact } from '../operatorEmergencyApi';
import {
  AUTHORITY_REFERENCE_MAX_LENGTH,
  EMERGENCY_CONTACT_MAX_LENGTH,
  EVIDENCE_REFERENCE_MAX_LENGTH,
  EVIDENCE_URL_MAX_LENGTH,
  isValidHttpsUrl,
} from '../evidenceFields';
import { EmergencyConfirmationDialog } from './EmergencyConfirmationDialog';

interface CancelBeforeDepartureFormProps {
  impact: EmergencyTourImpactResponse;
  onSuccess: (result: EmergencyTourActionResponse) => void;
  onCancel: () => void;
  className?: string;
}

const REASON_OPTIONS: Array<{ value: EmergencyTourReason; label: string }> = [
  { value: 'WeatherEmergency', label: 'Thời tiết nguy hiểm / Bão lũ' },
  { value: 'AuthorityDirective', label: 'Chỉ thị cơ quan chức năng / Cấm biển' },
  { value: 'DestinationUnavailable', label: 'Điểm đến bị cô lập / Không khả dụng' },
  { value: 'TransportFailure', label: 'Sự cố phương tiện vận chuyển chính' },
  { value: 'SafetyIncident', label: 'Sự cố mất an toàn khẩn cấp' },
  { value: 'Other', label: 'Trường hợp bất khả kháng khác' },
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
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceUrlError, setEvidenceUrlError] = useState<string | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [authorityReference, setAuthorityReference] = useState('');
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
    const trimmedUrl = evidenceUrl.trim();
    if (trimmedUrl && !isValidHttpsUrl(trimmedUrl)) {
      setEvidenceUrlError('Nhập đầy đủ liên kết HTTPS, không kèm tên đăng nhập hoặc mật khẩu, ví dụ https://example.gov.vn/chi-thi.pdf.');
      setEvidenceOpen(true);
      return;
    }
    setEvidenceUrlError(null);
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
      evidenceUrl: evidenceUrl.trim() || null,
      authorityReference: authorityReference.trim() || null,
      evidenceReference: evidenceReference.trim() || null,
      emergencyContact: emergencyContact.trim() || null,
      // The Backend accepts a directive only with an authority, a document number or this flag; a link alone is not enough.
      addEvidenceLater:
        reason === 'AuthorityDirective' && !authorityReference.trim() && !evidenceReference.trim(),
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
            Xác nhận hủy trước khởi hành
          </h3>
          <p className="mt-1 text-xs text-amber-900">
            Lịch khởi hành chưa diễn ra. Việc hủy sẽ chuyển trạng thái lịch thành Đã hủy,
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
                if (e.target.value === 'AuthorityDirective') setEvidenceOpen(true);
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
              Lý do hiển thị cho du khách <span className="text-rose-600">*</span>
            </label>
            <p id="cancel-details-help" className="mb-1 text-[11px] text-slate-600">
              Du khách bị ảnh hưởng sẽ đọc nội dung này. Không ghi chú nội bộ hoặc thông tin riêng tư.
            </p>
            <textarea
              id="cancel-details"
              rows={3}
              maxLength={1000}
              required
              aria-describedby="cancel-details-help"
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

          <div>
            <label htmlFor="cancel-contact" className="block font-semibold text-slate-800 mb-1">
              Đầu mối liên hệ hỗ trợ du khách (Tùy chọn)
            </label>
            <input
              id="cancel-contact"
              type="text"
              maxLength={EMERGENCY_CONTACT_MAX_LENGTH}
              value={emergencyContact}
              onChange={(e) => {
                setEmergencyContact(e.target.value);
                setIdempotencyKey(generateUuid());
              }}
              disabled={submitting}
              placeholder="Số điện thoại hotline điều hành..."
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
            />
            <div className="mt-0.5 text-right text-[11px] text-slate-500">
              {emergencyContact.length} / {EMERGENCY_CONTACT_MAX_LENGTH}
            </div>
          </div>

          <div
            className={`rounded-lg border ${
              reason === 'AuthorityDirective' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white'
            }`}
          >
            <button
              type="button"
              aria-expanded={evidenceOpen}
              aria-controls="cancel-evidence-section"
              onClick={() => setEvidenceOpen((open) => !open)}
              className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-600"
            >
              <span>Thêm bằng chứng (không bắt buộc)</span>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                {evidenceOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            <div id="cancel-evidence-section" hidden={!evidenceOpen} className="space-y-3 border-t border-slate-200 p-3">
              {reason === 'AuthorityDirective' && (
                <p className="text-[11px] font-medium text-amber-900">
                  Chỉ thị cần có cơ quan ban hành hoặc số văn bản. Nếu chưa có, bạn vẫn có thể tiếp tục và bổ sung sau khi
                  quyết định.
                </p>
              )}
              <div>
                <label htmlFor="cancel-evidence-url" className="block font-semibold text-slate-800 mb-1">
                  Liên kết bằng chứng HTTPS
                </label>
                {/* type="url" would show the browser bubble instead of the inline error. */}
                <input
                  id="cancel-evidence-url"
                  type="text"
                  inputMode="url"
                  maxLength={EVIDENCE_URL_MAX_LENGTH}
                  value={evidenceUrl}
                  onChange={(e) => {
                    setEvidenceUrl(e.target.value);
                    setEvidenceUrlError(null);
                    setIdempotencyKey(generateUuid());
                  }}
                  disabled={submitting}
                  placeholder="https://..."
                  aria-invalid={evidenceUrlError ? true : undefined}
                  aria-describedby={evidenceUrlError ? 'cancel-evidence-url-error' : undefined}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
                />
                {evidenceUrlError && (
                  <p id="cancel-evidence-url-error" role="alert" className="mt-1 text-[11px] font-semibold text-rose-700">
                    {evidenceUrlError}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cancel-authority" className="block font-semibold text-slate-800 mb-1">
                    Cơ quan ban hành
                  </label>
                  <input
                    id="cancel-authority"
                    type="text"
                    maxLength={AUTHORITY_REFERENCE_MAX_LENGTH}
                    value={authorityReference}
                    onChange={(e) => {
                      setAuthorityReference(e.target.value);
                      setIdempotencyKey(generateUuid());
                    }}
                    disabled={submitting}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
                  />
                  <div className="mt-0.5 text-right text-[11px] text-slate-500">
                    {authorityReference.length} / {AUTHORITY_REFERENCE_MAX_LENGTH}
                  </div>
                </div>
                <div>
                  <label htmlFor="cancel-document" className="block font-semibold text-slate-800 mb-1">
                    Số văn bản
                  </label>
                  <input
                    id="cancel-document"
                    type="text"
                    maxLength={EVIDENCE_REFERENCE_MAX_LENGTH}
                    value={evidenceReference}
                    onChange={(e) => {
                      setEvidenceReference(e.target.value);
                      setIdempotencyKey(generateUuid());
                    }}
                    disabled={submitting}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
                  />
                </div>
              </div>
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
