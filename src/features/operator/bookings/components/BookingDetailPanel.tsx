'use client';

import React, { useCallback, useEffect, useLayoutEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { BookingDetailView, BookingListItemDto } from '../types/bookingLifecycle';
import { BookingStatusBadge, CheckInStatusBadge } from './OperatorBookingStatusBadge';
import { formatCurrencyVND, formatVietnamDate, formatVietnamDateTime } from '../utils/dateFormat';
import { bookingEn } from '../resources/en';

export type BookingDetailLoadState = 'loading' | 'ready' | 'error';

interface BookingDetailPanelProps {
  open: boolean;
  /** The full detail; null while it is loading or when loading failed. */
  booking: BookingDetailView | null;
  /** The list row the drawer was opened from: its basics are shown at once, before the detail arrives. */
  summary?: BookingListItemDto | null;
  loadState?: BookingDetailLoadState;
  errorMessage?: string | null;
  onRetry?: () => void;
  isDemo?: boolean;
  onClose: () => void;
  onOpenCancelDialog: (booking: BookingDetailView) => void;
  onOpenRefundDialog: (booking: BookingDetailView) => void;
}

export function BookingDetailPanel({
  open,
  booking,
  summary = null,
  loadState = 'ready',
  errorMessage = null,
  onRetry,
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

  // The basics come from the detail when it is loaded, otherwise from the list row.
  const basics = booking
    ? {
        bookingCode: booking.bookingCode,
        status: booking.status,
        startAtUtc: booking.schedule.startAtUtc,
        tourTitle: booking.tour.title,
        checkInStatus: booking.checkInStatus,
        checkedInAtUtc: booking.checkedInAtUtc,
        bookedAtUtc: booking.bookedAtUtc,
      }
    : summary
      ? {
          bookingCode: summary.bookingCode,
          status: summary.status,
          startAtUtc: summary.schedule.startAtUtc,
          tourTitle: summary.tour.title,
          checkInStatus: summary.checkInStatus,
          checkedInAtUtc: summary.checkedInAtUtc,
          bookedAtUtc: summary.bookedAtUtc,
        }
      : null;

  // A ready drawer without a booking has nothing to show; loading and error drawers show the row basics.
  if (!open || !basics || (loadState === 'ready' && booking === null)) return null;

  // Eligibility evaluation for actions. Cancellation follows the BE decision (`canCancel`), which
  // mirrors UC-41; the browser does not recompute it. Both actions stay locked outside demo mode
  // until their UC-41/UC-42 integration.
  const isCancellable = isDemo && booking !== null && booking.canCancel;

  const isRefundable =
    isDemo &&
    booking !== null &&
    booking.paidAmount > 0 &&
    booking.payment?.status === 'Success' &&
    !booking.refund;

  const cancelBlockedTooltip =
    booking?.cancelBlockedReason === 'CheckedIn'
      ? bookingEn.detail.cancelBlockedCheckedInTooltip
      : booking?.cancelBlockedReason === 'InvalidStatus'
        ? bookingEn.detail.cancelBlockedInvalidStatusTooltip
        : bookingEn.detail.notCancellableTooltip;

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
        aria-busy={loadState === 'loading' ? true : undefined}
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 id={titleId} className="text-base font-bold text-[#00152A]">
                {bookingEn.detail.title} {basics.bookingCode}
              </h2>
              <BookingStatusBadge status={basics.status} />
            </div>
            <p id={descId} className="text-xs text-slate-500 mt-0.5">
              {bookingEn.detail.departureDate}: {formatVietnamDate(basics.startAtUtc)}
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
            aria-label={bookingEn.detail.closeAria}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs">
          {booking === null ? (
            <>
              {/* Row basics while the detail loads or when loading failed */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {bookingEn.detail.tourInfo}
                </span>
                <h3 className="mt-1 text-sm font-bold text-[#00152A]">{basics.tourTitle}</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 text-slate-600">
                  <div>
                    <span className="text-slate-400 block">{bookingEn.detail.departureDate}:</span>
                    <span className="font-semibold text-slate-800">{formatVietnamDate(basics.startAtUtc)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{bookingEn.detail.checkInStatus}:</span>
                    <CheckInStatusBadge status={basics.checkInStatus} />
                  </div>
                  <div>
                    <span className="text-slate-400 block">{bookingEn.detail.createdAt}:</span>
                    <span className="font-semibold text-slate-800">{formatVietnamDateTime(basics.bookedAtUtc)}</span>
                  </div>
                </div>
              </div>
              {loadState === 'error' ? (
                <div
                  role="alert"
                  className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 space-y-3"
                >
                  <p className="font-bold">{errorMessage}</p>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="rounded-xl border border-rose-200 bg-white px-4 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                    >
                      {bookingEn.list.retryBtn}
                    </button>
                  )}
                </div>
              ) : (
                <div
                  role="status"
                  aria-label={bookingEn.detail.loading}
                  className="space-y-3 animate-pulse"
                >
                  <div className="h-24 rounded-2xl bg-slate-100" />
                  <div className="h-32 rounded-2xl bg-slate-100" />
                  <div className="h-28 rounded-2xl bg-slate-100" />
                </div>
              )}
            </>
          ) : (
            <>
          {/* Tour info card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {bookingEn.detail.tourInfo}
            </span>
            <h3 className="mt-1 text-sm font-bold text-[#00152A]">{booking.tour.title}</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 text-slate-600">
              <div>
                <span className="text-slate-400 block">{bookingEn.detail.departureDate}:</span>
                <span className="font-semibold text-slate-800">
                  {formatVietnamDate(booking.schedule.startAtUtc)}
                </span>
              </div>
              {booking.schedule.meetingPoint && (
                <div>
                  <span className="text-slate-400 block">{bookingEn.detail.meetingPoint}:</span>
                  <span className="font-semibold text-slate-800">{booking.schedule.meetingPoint}</span>
                </div>
              )}
              <div>
                <span className="text-slate-400 block">{bookingEn.detail.checkInStatus}:</span>
                <CheckInStatusBadge status={booking.checkInStatus} />
                {booking.checkedInAtUtc && (
                  <span className="mt-0.5 block text-[10px] text-slate-500">
                    {bookingEn.detail.checkedInAt}: {formatVietnamDateTime(booking.checkedInAtUtc)}
                  </span>
                )}
              </div>
              {booking.ticket && (
                <div>
                  <span className="text-slate-400 block">{bookingEn.detail.ticketCode}:</span>
                  <span className="font-semibold text-slate-800">
                    {booking.ticket.ticketCode} ({booking.ticket.status})
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-400 block">{bookingEn.detail.createdAt}:</span>
                <span className="font-semibold text-slate-800">
                  {formatVietnamDateTime(booking.bookedAtUtc)}
                </span>
              </div>
            </div>
          </div>

          {/* Contact info card */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {bookingEn.detail.contactInfo}
            </span>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700">
              <div>
                <span className="text-slate-400 block">{bookingEn.detail.fullName}:</span>
                <span className="font-bold text-slate-800">{booking.booker.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{bookingEn.detail.phone}:</span>
                <span className="font-semibold text-slate-800">{booking.booker.phoneNumber ?? '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{bookingEn.detail.email}:</span>
                <span className="font-semibold text-slate-800 truncate block">{booking.booker.email ?? '-'}</span>
              </div>
            </div>
          </div>

          {/* Participants list */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {bookingEn.detail.participantsList} ({booking.quantity} {bookingEn.detail.personCount})
              </span>
            </div>
            <div className="space-y-2">
              {booking.participants.map((pax, index) => (
                <div
                  key={`${index}-${pax.fullName}`}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 border border-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                      {index + 1}
                    </span>
                    <span className="font-bold text-slate-800">{pax.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span>{bookingEn.paxTypes[pax.participantType]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment info (Read-only) */}
          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {bookingEn.detail.paymentInfo}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                {bookingEn.detail.immutableBadge}
              </span>
            </div>
            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>{bookingEn.detail.subtotalAmount}:</span>
                <span className="font-semibold text-slate-800">{formatCurrencyVND(booking.subtotalAmount)}</span>
              </div>
              {booking.coupon && (
                <div className="flex justify-between text-emerald-700">
                  <span>{bookingEn.detail.couponUsed} ({booking.coupon.code}):</span>
                  <span className="font-semibold">-{formatCurrencyVND(booking.coupon.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{bookingEn.detail.totalAmount}:</span>
                <span className="font-semibold text-slate-800">{formatCurrencyVND(booking.totalAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-2 font-bold text-slate-800">
                <span>{bookingEn.detail.paidAmount}:</span>
                <span className="text-emerald-700">{formatCurrencyVND(booking.paidAmount)}</span>
              </div>
              {booking.payment && (
                <div className="mt-2 rounded-xl bg-white p-3 border border-slate-200 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{bookingEn.detail.paymentChannel}:</span>
                    <span className="font-bold text-slate-700">{booking.payment.gateway}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{bookingEn.detail.transactionRef}:</span>
                    <span className="font-mono text-slate-700">{booking.payment.gatewayTransactionRef ?? '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{bookingEn.detail.verifiedAt}:</span>
                    <span className="text-slate-700">{formatVietnamDateTime(booking.payment.succeededAtUtc)}</span>
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
                  {bookingEn.detail.refundRecord}
                </span>
                <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-extrabold text-teal-800">
                  {booking.refund.status}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">{bookingEn.detail.refundAmount}:</span>
                  <span className="font-bold text-[#006B5F]">{formatCurrencyVND(booking.refund.refundableAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{bookingEn.detail.refundChannel}:</span>
                  <span className="font-semibold text-slate-800">{booking.refund.paymentChannel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{bookingEn.detail.gatewayRef}:</span>
                  <span className="font-mono text-slate-800">{booking.refund.gatewayReference || 'N/A'}</span>
                </div>
                {booking.refund.notes && (
                  <div className="pt-1 text-[11px] text-slate-500 italic">
                    {bookingEn.detail.refundNotes}: {booking.refund.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cancellation reason if cancelled */}
          {(booking.cancelReason || booking.cancellationReasonType) && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-xs text-rose-900 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block">
                {bookingEn.detail.cancellationRecord}
              </span>
              {booking.cancellationReasonType && (
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block">
                    {bookingEn.detail.cancellationReasonType}:
                  </span>
                  <p className="font-semibold text-rose-950">
                    {bookingEn.cancelReasons[booking.cancellationReasonType] || booking.cancellationReasonType}
                  </p>
                </div>
              )}
              {booking.cancelReason && (
                <div>
                  {booking.cancellationReasonType && (
                    <span className="text-[11px] font-bold text-slate-500 block">
                      {bookingEn.detail.cancellationReasonDetail}:
                    </span>
                  )}
                  <p className="font-medium text-slate-900">{booking.cancelReason}</p>
                </div>
              )}
              {booking.cancelledAtUtc && (
                <span className="block mt-1 text-[10px] text-slate-500">
                  {bookingEn.detail.cancelledAt}: {formatVietnamDateTime(booking.cancelledAtUtc)}
                </span>
              )}
            </div>
          )}

          {booking.status === 'Cancelled' && booking.paidAmount > 0 && !booking.refund && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-[11px] text-amber-900">
              <p className="font-medium">{bookingEn.detail.refundClarificationNotice}</p>
            </div>
          )}
            </>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="border-t border-slate-200 p-5 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            {bookingEn.detail.closeBtn}
          </button>

          <div className="flex items-center gap-2">
            {/* Cancel booking action (UC-41) */}
            <button
              type="button"
              onClick={() => booking && onOpenCancelDialog(booking)}
              disabled={!isCancellable}
              title={
                !isDemo
                  ? bookingEn.detail.productionLockedTooltip
                  : !isCancellable
                  ? cancelBlockedTooltip
                  : bookingEn.detail.cancelBookingBtn
              }
              className="rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              <span>{bookingEn.detail.cancelBookingBtn}</span>
            </button>

            {/* Initiate refund action (UC-42) */}
            <button
              type="button"
              onClick={() => booking && onOpenRefundDialog(booking)}
              disabled={!isRefundable}
              title={
                !isDemo
                  ? bookingEn.detail.productionLockedTooltip
                  : !isRefundable
                  ? bookingEn.detail.notRefundableTooltip
                  : bookingEn.detail.refundBtn
              }
              className="rounded-xl bg-[#006B5F] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005249] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">currency_exchange</span>
              <span>{bookingEn.detail.refundBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document === 'undefined' ? null : createPortal(drawerContent, document.body);
}
