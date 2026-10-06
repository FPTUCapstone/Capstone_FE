'use client';

import React, { useCallback, useEffect, useLayoutEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CANCELLATION_REASONS,
  OPERATOR_BOOKING_MESSAGES,
  type BookingDto,
  type CancellationReasonValue,
  type CancelBookingPayload,
} from '../types/bookingLifecycle';
import { calculateBookingRefundPreview } from '../services/operatorBookingService';
import { formatCurrencyVND, formatVietnamDate } from '../utils/dateFormat';

interface CancelBookingDialogProps {
  open: boolean;
  booking: BookingDto | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (payload: CancelBookingPayload) => Promise<void> | void;
}

interface CancelBookingModalContentProps {
  booking: BookingDto;
  loading: boolean;
  onClose: () => void;
  onConfirm: (payload: CancelBookingPayload) => Promise<void> | void;
}

function CancelBookingModalContent({
  booking,
  loading,
  onClose,
  onConfirm,
}: CancelBookingModalContentProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  const [reasonType, setReasonType] = useState<CancellationReasonValue>('CUSTOMER_REQUEST');
  const [reasonDetail, setReasonDetail] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    if (!loading) onClose();
  }, [loading, onClose]);

  // Initial focus and focus restoration
  useLayoutEffect(() => {
    const previouslyFocused = document.activeElement;
    cancelBtnRef.current?.focus();

    return () => {
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, []);

  // Escape key and focus trap cycling
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [handleClose]);

  const refundPreview = calculateBookingRefundPreview(booking);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // BR-106: reason cannot be empty
    if (!reasonDetail.trim()) {
      setValidationError(OPERATOR_BOOKING_MESSAGES.MSG123);
      return;
    }
    setValidationError(null);
    await onConfirm({ reasonType, reasonDetail: reasonDetail.trim() });
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) handleClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <span className="material-symbols-outlined text-[24px]">cancel</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-bold text-[#00152A]">
              Hủy đơn đặt chỗ {booking.bookingCode}
            </h2>
            <p id={descId} className="text-xs text-slate-500">
              Xác nhận hủy đơn đặt chỗ và tính toán chính sách hoàn tiền tương ứng (UC-41).
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Đóng hộp thoại"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Booking Summary Section */}
        <div className="my-4 rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Gói tour:</span>
            <span className="font-semibold text-slate-800 text-right">{booking.tourName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Ngày khởi hành (CR-07):</span>
            <span className="font-semibold text-slate-800">{formatVietnamDate(booking.departureDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Người đại diện:</span>
            <span className="font-semibold text-slate-800">{booking.contactName} ({booking.contactPhone})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Số lượng khách:</span>
            <span className="font-semibold text-slate-800">{booking.participantsCount} người</span>
          </div>
          <div className="flex justify-between border-t border-slate-200/60 pt-2">
            <span className="text-slate-500">Tổng tiền đơn đặt:</span>
            <span className="font-semibold text-slate-800">{formatCurrencyVND(booking.totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Đã thanh toán:</span>
            <span className="font-bold text-emerald-700">{formatCurrencyVND(booking.paidAmount)}</span>
          </div>
        </div>

        {/* Refund Policy Preview */}
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <span className="material-symbols-outlined text-[18px]">currency_exchange</span>
            <span>Chính sách hoàn tiền dự kiến (BR-107)</span>
          </div>
          <p className="mt-1 text-amber-800 font-medium">{refundPreview.policyApplied}</p>
          <div className="mt-2 flex items-center justify-between border-t border-amber-200/60 pt-2 text-xs">
            <span className="text-amber-800">Số tiền hoàn trả dự kiến:</span>
            <span className="text-sm font-extrabold text-[#006B5F]">
              {formatCurrencyVND(refundPreview.refundableAmount)}
            </span>
          </div>
          {booking.paidAmount > 0 && refundPreview.refundableAmount > 0 && (
            <p className="mt-1 text-[11px] text-slate-600">
              * Khoản tiền sẽ được hoàn trả tự động về kênh thanh toán ban đầu ({booking.paymentTransaction?.paymentChannel || 'VNPay'}) theo BR-76.
            </p>
          )}
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="cancel-reason-type" className="block font-bold text-slate-700 mb-1">
              Phân loại lý do hủy
            </label>
            <select
              id="cancel-reason-type"
              value={reasonType}
              onChange={(e) => setReasonType(e.target.value as CancellationReasonValue)}
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#006B5F] focus:outline-hidden focus:ring-1 focus:ring-[#006B5F]"
            >
              {CANCELLATION_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cancel-reason-detail" className="block font-bold text-slate-700 mb-1">
              Chi tiết lý do hủy <span className="text-rose-500">* (BR-106 bắt buộc)</span>
            </label>
            <textarea
              id="cancel-reason-detail"
              rows={3}
              value={reasonDetail}
              onChange={(e) => {
                setReasonDetail(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Nhập lý do chi tiết để lưu vết hồ sơ kiểm toán..."
              disabled={loading}
              className={`w-full rounded-xl border px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 ${
                validationError
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/30'
                  : 'border-slate-300 focus:border-[#006B5F] focus:ring-[#006B5F] bg-white'
              }`}
            />
            {validationError && (
              <p role="alert" className="mt-1 text-[11px] font-semibold text-rose-600">
                {validationError}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              ref={cancelBtnRef}
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Xác nhận hủy đặt chỗ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document === 'undefined' ? null : createPortal(modalContent, document.body);
}

export function CancelBookingDialog({
  open,
  booking,
  loading = false,
  onClose,
  onConfirm,
}: CancelBookingDialogProps) {
  if (!open || !booking) return null;

  return (
    <CancelBookingModalContent
      booking={booking}
      loading={loading}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
