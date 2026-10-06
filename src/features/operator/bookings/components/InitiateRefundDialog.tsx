'use client';

import React, { useCallback, useEffect, useLayoutEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BookingDto, InitiateRefundPayload } from '../types/bookingLifecycle';
import { calculateBookingRefundPreview } from '../services/operatorBookingService';
import { formatCurrencyVND, formatVietnamDate } from '../utils/dateFormat';

interface InitiateRefundDialogProps {
  open: boolean;
  booking: BookingDto | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (payload: InitiateRefundPayload) => Promise<void> | void;
}

interface InitiateRefundModalContentProps {
  booking: BookingDto;
  loading: boolean;
  onClose: () => void;
  onConfirm: (payload: InitiateRefundPayload) => Promise<void> | void;
}

function InitiateRefundModalContent({
  booking,
  loading,
  onClose,
  onConfirm,
}: InitiateRefundModalContentProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  const [notes, setNotes] = useState('');

  const handleClose = useCallback(() => {
    if (!loading) onClose();
  }, [loading, onClose]);

  // Initial focus & restoration
  useLayoutEffect(() => {
    const previouslyFocused = document.activeElement;
    cancelBtnRef.current?.focus();

    return () => {
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, []);

  // Escape key & focus trap
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
  const channel = booking.paymentTransaction?.paymentChannel || 'VNPay';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm({ notes: notes.trim() });
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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-[#006B5F]">
            <span className="material-symbols-outlined text-[24px]">payments</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-bold text-[#00152A]">
              Khởi tạo hoàn tiền đơn {booking.bookingCode}
            </h2>
            <p id={descId} className="text-xs text-slate-500">
              Yêu cầu hoàn trả qua cổng thanh toán ban đầu theo chính sách hủy tour (UC-42).
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
            <span className="text-slate-500">Mã đơn đặt chỗ:</span>
            <span className="font-semibold text-slate-800">{booking.bookingCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Gói tour:</span>
            <span className="font-semibold text-slate-800 text-right">{booking.tourName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Ngày khởi hành (CR-07):</span>
            <span className="font-semibold text-slate-800">{formatVietnamDate(booking.departureDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Số tiền khách đã thanh toán:</span>
            <span className="font-bold text-slate-800">{formatCurrencyVND(booking.paidAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200/60 pt-2">
            <span className="text-slate-500">Kênh thanh toán hoàn trả (BR-76):</span>
            <span className="rounded bg-slate-200/80 px-2 py-0.5 font-bold text-slate-800">{channel}</span>
          </div>
        </div>

        {/* Refund Computation Section */}
        <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50/60 p-4 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-[#006B5F]">
            <span className="material-symbols-outlined text-[18px]">calculate</span>
            <span>Hạch toán hoàn tiền (BR-107 & BR-77)</span>
          </div>
          <div className="text-[11px] text-slate-600">
            Chính sách: <span className="font-medium text-slate-800">{refundPreview.policyApplied}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-slate-600">Khấu trừ / Phí hủy:</span>
            <span className="font-semibold text-rose-600">
              {formatCurrencyVND(refundPreview.deductionAmount)}
            </span>
          </div>
          <div className="flex justify-between border-t border-teal-200/60 pt-2 text-xs">
            <span className="font-bold text-slate-700">Số tiền hoàn thực tế:</span>
            <span className="text-base font-extrabold text-[#006B5F]">
              {formatCurrencyVND(refundPreview.refundableAmount)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 italic">
            * Giao dịch thanh toán gốc giữ nguyên tính toàn vẹn (BR-77). Hoàn tiền tạo bản ghi độc lập.
          </p>
        </div>

        {/* Existing refund notice if already refunding/refunded */}
        {booking.refund && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <div className="font-bold">Lưu ý tính toàn vẹn (BR-74):</div>
            <div>Đơn đặt chỗ này đã có bản ghi hoàn tiền ({booking.refund.status}): mã đối soát {booking.refund.gatewayReference || 'N/A'}.</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="refund-note-input" className="block font-bold text-slate-700 mb-1">
              Ghi chú hoàn tiền (Tùy chọn)
            </label>
            <textarea
              id="refund-note-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú xử lý đối soát hoặc thông tin đính kèm..."
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#006B5F] focus:outline-hidden focus:ring-1 focus:ring-[#006B5F]"
            />
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
              disabled={loading || !refundPreview.eligible || refundPreview.refundableAmount <= 0}
              className="rounded-xl bg-[#006B5F] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005249] transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>Đang khởi tạo...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Khởi tạo hoàn tiền</span>
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

export function InitiateRefundDialog({
  open,
  booking,
  loading = false,
  onClose,
  onConfirm,
}: InitiateRefundDialogProps) {
  if (!open || !booking) return null;

  return (
    <InitiateRefundModalContent
      booking={booking}
      loading={loading}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
