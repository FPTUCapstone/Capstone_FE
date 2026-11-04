'use client';

import React, { useState, useRef, useEffect } from 'react';
import type {
  EmergencyTourImpactResponse,
  EmergencyTourReason,
  EmergencyStopActiveRequest,
  EmergencyTourActionResponse,
} from '../types';
import { emergencyStopActive, getEmergencyImpact } from '../operatorEmergencyApi';
import { EmergencyConfirmationDialog } from './EmergencyConfirmationDialog';

interface EmergencyStopFormProps {
  impact: EmergencyTourImpactResponse;
  onSuccess: (result: EmergencyTourActionResponse) => void;
  onCancel: () => void;
  className?: string;
}

const REASON_OPTIONS: Array<{ value: EmergencyTourReason; label: string }> = [
  { value: 'WeatherEmergency', label: 'Thời tiết nguy hiểm / Bão lũ (WeatherEmergency)' },
  { value: 'AuthorityDirective', label: 'Chỉ thị cơ quan chức năng / Cấm đường (AuthorityDirective)' },
  { value: 'DestinationUnavailable', label: 'Điểm đến bị cô lập / Sự cố tại chỗ (DestinationUnavailable)' },
  { value: 'TransportFailure', label: 'Sự cố phương tiện vận chuyển chính (TransportFailure)' },
  { value: 'SafetyIncident', label: 'Sự cố mất an toàn nghiêm trọng (SafetyIncident)' },
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

export function EmergencyStopForm({
  impact,
  onSuccess,
  onCancel,
  className = '',
}: EmergencyStopFormProps) {
  const [currentImpact, setCurrentImpact] = useState<EmergencyTourImpactResponse>(impact);
  const [currentPassword, setCurrentPassword] = useState('');
  const [reason, setReason] = useState<EmergencyTourReason>('WeatherEmergency');
  const [reasonDetails, setReasonDetails] = useState('');
  const [immediateInstructions, setImmediateInstructions] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateUuid());

  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Clear password from memory on unmount
  useEffect(() => {
    return () => {
      setCurrentPassword('');
    };
  }, []);

  const handleOpenConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu tài khoản hiện tại để xác thực thao tác nguy hiểm.');
      passwordInputRef.current?.focus();
      return;
    }
    if (!reasonDetails.trim()) {
      setError('Vui lòng nhập chi tiết lý do dừng tour.');
      return;
    }
    if (!immediateInstructions.trim()) {
      setError('Vui lòng nhập chỉ dẫn ứng phó khẩn cấp tức thời cho đoàn.');
      return;
    }
    if (!emergencyContact.trim()) {
      setError('Vui lòng nhập đầu mối liên hệ khẩn cấp.');
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
      const msg = err instanceof Error ? err.message : 'Không thể kiểm tra lại tác động';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelDialog = () => {
    setShowConfirm(false);
    setCurrentPassword('');
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    setError(null);

    const payload: EmergencyStopActiveRequest = {
      impactVersion: currentImpact.impactVersion,
      currentPassword,
      reason,
      reasonDetails: reasonDetails.trim(),
      immediateInstructions: immediateInstructions.trim(),
      emergencyContact: emergencyContact.trim(),
      addEvidenceLater: reason === 'AuthorityDirective',
    };

    // Clear password from memory immediately
    setCurrentPassword('');

    try {
      const result = await emergencyStopActive(
        currentImpact.tourId,
        currentImpact.scheduleId,
        payload,
        idempotencyKey
      );
      onSuccess(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi dừng khẩn cấp tour';
      setError(msg);
      setCurrentPassword('');
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 50);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleOpenConfirm}
        className={`rounded-xl border border-rose-300 bg-rose-50/50 p-5 shadow-2xs space-y-4 ${className}`}
      >
        <div className="border-b border-rose-200 pb-3">
          <h3 className="text-base font-bold text-rose-950 flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-700" aria-hidden="true">
              dangerous
            </span>
            Dừng khẩn cấp tour đang chạy (Active Tour Emergency Stop)
          </h3>
          <p className="mt-1 text-xs text-rose-900 leading-relaxed">
            Tour đang trong quá trình thực hiện. Thao tác này sẽ chuyển phiên tour và các đơn đặt chỗ
            sang trạng thái <strong>Gián đoạn (Interrupted)</strong>, đồng thời gửi thông báo chỉ dẫn
            khẩn cấp tới du khách.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-400 bg-white p-3 text-xs font-semibold text-rose-800">
            {error}
          </div>
        )}

        <div className="space-y-3 text-xs">
          {/* Security Re-authentication */}
          <div className="rounded-lg border border-rose-200 bg-white p-3 space-y-1">
            <label htmlFor="current-password" className="block font-bold text-slate-900">
              Mật khẩu tài khoản hiện tại <span className="text-rose-600">*</span>
            </label>
            <input
              ref={passwordInputRef}
              id="current-password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={submitting}
              placeholder="Nhập mật khẩu của bạn để xác thực quyền điều hành..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-rose-600 focus:outline-hidden focus:ring-1 focus:ring-rose-600"
            />
            <p className="text-[11px] text-slate-500">
              * Mật khẩu chỉ dùng một lần để chứng thực và sẽ tự động xóa sạch khỏi bộ nhớ ngay khi gửi yêu cầu.
            </p>
          </div>

          <div>
            <label htmlFor="stop-reason" className="block font-semibold text-slate-800 mb-1">
              Lý do dừng khẩn cấp <span className="text-rose-600">*</span>
            </label>
            <select
              id="stop-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value as EmergencyTourReason);
                setIdempotencyKey(generateUuid());
              }}
              disabled={submitting}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-rose-600 focus:outline-hidden focus:ring-1 focus:ring-rose-600"
            >
              {REASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="stop-details" className="block font-semibold text-slate-800 mb-1">
              Chi tiết lý do <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="stop-details"
              rows={2}
              maxLength={1000}
              required
              value={reasonDetails}
              onChange={(e) => {
                setReasonDetails(e.target.value);
                setIdempotencyKey(generateUuid());
              }}
              disabled={submitting}
              placeholder="Mô tả sự cố hoặc diễn biến thời tiết tại hiện trường..."
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-rose-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="stop-immediate-instructions" className="block font-semibold text-slate-800 mb-1">
              Chỉ dẫn ứng phó khẩn cấp tức thời <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="stop-immediate-instructions"
              rows={3}
              maxLength={1000}
              required
              value={immediateInstructions}
              onChange={(e) => {
                setImmediateInstructions(e.target.value);
                setIdempotencyKey(generateUuid());
              }}
              disabled={submitting}
              placeholder="Hướng dẫn du khách nơi trú ẩn an toàn, địa điểm tập kết hoặc hành động cần làm..."
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-rose-600 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="emergency-contact" className="block font-semibold text-slate-800 mb-1">
                Đầu mối liên hệ khẩn cấp <span className="text-rose-600">*</span>
              </label>
              <input
                id="emergency-contact"
                type="text"
                required
                value={emergencyContact}
                onChange={(e) => {
                  setEmergencyContact(e.target.value);
                  setIdempotencyKey(generateUuid());
                }}
                disabled={submitting}
                placeholder="Họ tên &amp; SĐT người phụ trách hiện trường..."
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-rose-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-rose-200">
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-rose-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500 disabled:opacity-50 transition"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin" aria-hidden="true">
                  progress_activity
                </span>
                <span>Đang xử lý dừng tour...</span>
              </>
            ) : (
              <span>Xác nhận dừng khẩn cấp tour</span>
            )}
          </button>
        </div>
      </form>

      <EmergencyConfirmationDialog
        isOpen={showConfirm}
        title="Bạn có chắc chắn muốn dừng khẩn cấp tour đang chạy?"
        actionType="EmergencyStopActive"
        affectedBookings={currentImpact.paidBookingCount + currentImpact.unpaidBookingCount}
        affectedPassengers={currentImpact.totalPassengerCount}
        onConfirm={handleConfirmedSubmit}
        onCancel={handleCancelDialog}
      />
    </>
  );
}
