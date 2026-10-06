'use client';

import React, { useCallback, useEffect, useLayoutEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { BookingDto } from '../types/bookingLifecycle';
import { BookingStatusBadge, CheckInStatusBadge } from './OperatorBookingStatusBadge';
import { formatCurrencyVND, formatVietnamDate, formatVietnamDateTime } from '../utils/dateFormat';

interface BookingDetailPanelProps {
  open: boolean;
  booking: BookingDto | null;
  isDemo?: boolean;
  onClose: () => void;
  onOpenCancelDialog: (booking: BookingDto) => void;
  onOpenRefundDialog: (booking: BookingDto) => void;
}

export function BookingDetailPanel({
  open,
  booking,
  isDemo = false,
  onClose,
  onOpenCancelDialog,
  onOpenRefundDialog,
}: BookingDetailPanelProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Focus management
  useLayoutEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    closeBtnRef.current?.focus();

    return () => {
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  // Escape key and focus trap
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
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
  }, [handleClose, open]);

  if (!open || !booking) return null;

  // Eligibility evaluation for actions
  const isCancellable =
    isDemo &&
    booking.status !== 'Cancelled' &&
    booking.status !== 'Completed' &&
    booking.checkInStatus !== 'CheckedIn' &&
    !booking.cancellationWindowExpired;

  const isRefundable =
    isDemo &&
    booking.paidAmount > 0 &&
    booking.paymentTransaction?.status === 'Success' &&
    !booking.refund &&
    !booking.cancellationWindowExpired;

  const drawerContent = (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 id={titleId} className="text-base font-bold text-[#00152A]">
                Chi tiết đơn đặt chỗ {booking.bookingCode}
              </h2>
              <BookingStatusBadge status={booking.status} />
            </div>
            <p id={descId} className="text-xs text-slate-500 mt-0.5">
              Khởi hành ngày {formatVietnamDate(booking.departureDate)} (CR-07)
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
            aria-label="Đóng bảng chi tiết"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs">
          {/* Tour info card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Thông tin tour
            </span>
            <h3 className="mt-1 text-sm font-bold text-[#00152A]">{booking.tourName}</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 text-slate-600">
              <div>
                <span className="text-slate-400 block">Ngày khởi hành:</span>
                <span className="font-semibold text-slate-800">
                  {formatVietnamDate(booking.departureDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Trạng thái check-in:</span>
                <CheckInStatusBadge status={booking.checkInStatus} />
              </div>
              <div>
                <span className="text-slate-400 block">Vé QR e-ticket:</span>
                <span className="font-semibold text-slate-800">
                  {booking.qrTicketValid ? 'Hợp lệ (Hiệu lực)' : 'Không khả dụng / Đã hủy'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Ngày tạo đơn:</span>
                <span className="font-semibold text-slate-800">
                  {formatVietnamDateTime(booking.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Contact info card */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Thông tin liên hệ
            </span>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700">
              <div>
                <span className="text-slate-400 block">Họ và tên:</span>
                <span className="font-bold text-slate-800">{booking.contactName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Số điện thoại:</span>
                <span className="font-semibold text-slate-800">{booking.contactPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Email:</span>
                <span className="font-semibold text-slate-800 truncate block">{booking.contactEmail}</span>
              </div>
            </div>
          </div>

          {/* Participants list */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Danh sách hành khách ({booking.participantsCount} người)
              </span>
            </div>
            <div className="space-y-2">
              {booking.participants.map((pax, index) => (
                <div
                  key={pax.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 border border-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                      {index + 1}
                    </span>
                    <span className="font-bold text-slate-800">{pax.fullName}</span>
                    {pax.specialNotes && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {pax.specialNotes}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span>{pax.paxType === 'Adult' ? 'Người lớn' : 'Trẻ em'}</span>
                    {pax.age && <span>({pax.age} tuổi)</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment info (BR-77: Read-only) */}
          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Thông tin thanh toán (BR-77 Chỉ xem)
              </span>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                Bất biến
              </span>
            </div>
            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Tổng giá trị đơn:</span>
                <span className="font-semibold text-slate-800">{formatCurrencyVND(booking.totalAmount)}</span>
              </div>
              {booking.coupon && (
                <div className="flex justify-between text-emerald-700">
                  <span>Mã ưu đãi đã dùng ({booking.coupon.code}):</span>
                  <span className="font-semibold">-{formatCurrencyVND(booking.coupon.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200/60 pt-2 font-bold text-slate-800">
                <span>Số tiền đã thanh toán:</span>
                <span className="text-emerald-700">{formatCurrencyVND(booking.paidAmount)}</span>
              </div>
              {booking.paymentTransaction && (
                <div className="mt-2 rounded-xl bg-white p-3 border border-slate-200 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kênh thanh toán:</span>
                    <span className="font-bold text-slate-700">{booking.paymentTransaction.paymentChannel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mã giao dịch:</span>
                    <span className="font-mono text-slate-700">{booking.paymentTransaction.transactionReference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Thời gian xác thực:</span>
                    <span className="text-slate-700">{formatVietnamDateTime(booking.paymentTransaction.paidAt)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Refund record if any */}
          {booking.refund && (
            <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  Hồ sơ hoàn tiền (BR-107 & BR-74)
                </span>
                <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-extrabold text-teal-800">
                  {booking.refund.status}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tiền hoàn:</span>
                  <span className="font-bold text-[#006B5F]">{formatCurrencyVND(booking.refund.refundableAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kênh hoàn tiền:</span>
                  <span className="font-semibold text-slate-800">{booking.refund.paymentChannel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã đối soát:</span>
                  <span className="font-mono text-slate-800">{booking.refund.gatewayReference || 'N/A'}</span>
                </div>
                {booking.refund.notes && (
                  <div className="pt-1 text-[11px] text-slate-500 italic">
                    Ghi chú: {booking.refund.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cancellation reason if cancelled */}
          {booking.cancellationReason && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-xs text-rose-900">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block mb-1">
                Lý do hủy đơn (BR-106)
              </span>
              <p className="font-medium">{booking.cancellationReason}</p>
              {booking.cancelledAt && (
                <span className="block mt-1 text-[10px] text-slate-500">
                  Thời gian hủy: {formatVietnamDateTime(booking.cancelledAt)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="border-t border-slate-200 p-5 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            {/* Cancel booking action (UC-41) */}
            <button
              type="button"
              onClick={() => onOpenCancelDialog(booking)}
              disabled={!isCancellable}
              title={
                !isDemo
                  ? 'Tính năng đang chờ tích hợp Backend'
                  : !isCancellable
                  ? 'Đơn đặt chỗ không đủ điều kiện hủy'
                  : 'Mở hộp thoại hủy đơn'
              }
              className="rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              <span>Hủy đặt chỗ (UC-41)</span>
            </button>

            {/* Initiate refund action (UC-42) */}
            <button
              type="button"
              onClick={() => onOpenRefundDialog(booking)}
              disabled={!isRefundable}
              title={
                !isDemo
                  ? 'Tính năng đang chờ tích hợp Backend'
                  : !isRefundable
                  ? 'Đơn đặt chỗ không đủ điều kiện hoàn tiền'
                  : 'Mở hộp thoại hoàn tiền'
              }
              className="rounded-xl bg-[#006B5F] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005249] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">currency_exchange</span>
              <span>Hoàn tiền (UC-42)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document === 'undefined' ? null : createPortal(drawerContent, document.body);
}
