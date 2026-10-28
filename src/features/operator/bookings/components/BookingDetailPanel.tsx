'use client';

import React, { useCallback, useEffect, useLayoutEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BookingDto, BookingRefundDto, GetBookingRefundStatusResult } from '../types/bookingLifecycle';
import { getBookingRefundStatus } from '../services/operatorBookingService';
import { BookingStatusBadge, CheckInStatusBadge } from './OperatorBookingStatusBadge';
import { formatCurrencyVND, formatVietnamDate, formatVietnamDateTime } from '../utils/dateFormat';
import { bookingEn } from '../resources/en';

interface BookingDetailPanelProps {
  open: boolean;
  booking: BookingDto | null;
  isDemo?: boolean;
  onClose: () => void;
  onOpenCancelDialog: (booking: BookingDto) => void;
}

export function BookingDetailPanel({
  open,
  booking,
  isDemo = false,
  onClose,
  onOpenCancelDialog,
}: BookingDetailPanelProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  // UC-42/UC-71: refund is processed automatically by the Backend; this panel only
  // tracks its live status for a Cancelled booking, never triggers it.
  const [refundStatus, setRefundStatus] = useState<GetBookingRefundStatusResult | null>(null);
  const [refundLoading, setRefundLoading] = useState(false);

  useEffect(() => {
    // Demo bookings never have a Backend-issued id, so the live fetch is skipped and the
    // fixture's own booking.refund is shown instead (see DemoRefundRecordCard).
    if (!open || !booking || booking.status !== 'Cancelled' || isDemo) return;

    let isMounted = true;
    async function fetchRefundStatus() {
      setRefundLoading(true);
      setRefundStatus(null);
      const result = await getBookingRefundStatus(booking!.id);
      if (isMounted) {
        setRefundStatus(result);
        setRefundLoading(false);
      }
    }
    void fetchRefundStatus();
    return () => {
      isMounted = false;
    };
    // booking.id is the only part of `booking` this fetch depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, booking?.id, booking?.status, isDemo]);

  const refreshRefundStatus = () => {
    if (!booking) return;
    setRefundLoading(true);
    setRefundStatus(null);
    void getBookingRefundStatus(booking.id).then((result) => {
      setRefundStatus(result);
      setRefundLoading(false);
    });
  };

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
                {bookingEn.detail.title} {booking.bookingCode}
              </h2>
              <BookingStatusBadge status={booking.status} />
            </div>
            <p id={descId} className="text-xs text-slate-500 mt-0.5">
              {bookingEn.detail.departureDate}: {formatVietnamDate(booking.departureDate)}
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
          {/* Tour info card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {bookingEn.detail.tourInfo}
            </span>
            <h3 className="mt-1 text-sm font-bold text-[#00152A]">{booking.tourName}</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 text-slate-600">
              <div>
                <span className="text-slate-400 block">{bookingEn.detail.departureDate}:</span>
                <span className="font-semibold text-slate-800">
                  {formatVietnamDate(booking.departureDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">{bookingEn.detail.checkInStatus}:</span>
                <CheckInStatusBadge status={booking.checkInStatus} />
              </div>
              <div>
                <span className="text-slate-400 block">{bookingEn.detail.qrTicket}:</span>
                <span className="font-semibold text-slate-800">
                  {booking.qrTicketValid ? bookingEn.detail.qrValid : bookingEn.detail.qrInvalid}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">{bookingEn.detail.createdAt}:</span>
                <span className="font-semibold text-slate-800">
                  {formatVietnamDateTime(booking.createdAt)}
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
                <span className="font-bold text-slate-800">{booking.contactName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{bookingEn.detail.phone}:</span>
                <span className="font-semibold text-slate-800">{booking.contactPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{bookingEn.detail.email}:</span>
                <span className="font-semibold text-slate-800 truncate block">{booking.contactEmail}</span>
              </div>
            </div>
          </div>

          {/* Participants list */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {bookingEn.detail.participantsList} ({booking.participantsCount} {bookingEn.detail.personCount})
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
                    <span>{pax.paxType === 'Adult' ? bookingEn.paxTypes.Adult : bookingEn.paxTypes.Child}</span>
                    {pax.age && <span>({pax.age} {bookingEn.paxTypes.yearsOld})</span>}
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
                <span>{bookingEn.detail.totalAmount}:</span>
                <span className="font-semibold text-slate-800">{formatCurrencyVND(booking.totalAmount)}</span>
              </div>
              {booking.coupon && (
                <div className="flex justify-between text-emerald-700">
                  <span>{bookingEn.detail.couponUsed} ({booking.coupon.code}):</span>
                  <span className="font-semibold">-{formatCurrencyVND(booking.coupon.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200/60 pt-2 font-bold text-slate-800">
                <span>{bookingEn.detail.paidAmount}:</span>
                <span className="text-emerald-700">{formatCurrencyVND(booking.paidAmount)}</span>
              </div>
              {booking.paymentTransaction && (
                <div className="mt-2 rounded-xl bg-white p-3 border border-slate-200 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{bookingEn.detail.paymentChannel}:</span>
                    <span className="font-bold text-slate-700">{booking.paymentTransaction.paymentChannel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{bookingEn.detail.transactionRef}:</span>
                    <span className="font-mono text-slate-700">{booking.paymentTransaction.transactionReference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{bookingEn.detail.verifiedAt}:</span>
                    <span className="text-slate-700">{formatVietnamDateTime(booking.paymentTransaction.paidAt)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Refund status (UC-42/UC-71): read-only. Refund processing is automatic —
              there is nothing to trigger here. Demo bookings have no Backend-issued
              id to fetch live status for, so they show their own fixture data. */}
          {booking.status === 'Cancelled' && (
            isDemo
              ? <DemoRefundRecordCard refund={booking.refund} />
              : (
                <RefundStatusCard
                  loading={refundLoading}
                  result={refundStatus}
                  onRefresh={refreshRefundStatus}
                />
              )
          )}

          {/* Cancellation reason if cancelled */}
          {(booking.cancellationReason || booking.cancellationReasonType) && (
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
              {booking.cancellationReason && (
                <div>
                  {booking.cancellationReasonType && (
                    <span className="text-[11px] font-bold text-slate-500 block">
                      {bookingEn.detail.cancellationReasonDetail}:
                    </span>
                  )}
                  <p className="font-medium text-slate-900">{booking.cancellationReason}</p>
                </div>
              )}
              {booking.cancelledAt && (
                <span className="block mt-1 text-[10px] text-slate-500">
                  {bookingEn.detail.cancelledAt}: {formatVietnamDateTime(booking.cancelledAt)}
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
            {bookingEn.detail.closeBtn}
          </button>

          <div className="flex items-center gap-2">
            {/* Cancel booking action (UC-41) */}
            <button
              type="button"
              onClick={() => onOpenCancelDialog(booking)}
              disabled={!isCancellable}
              title={
                !isDemo
                  ? bookingEn.detail.productionLockedTooltip
                  : !isCancellable
                  ? bookingEn.detail.notCancellableTooltip
                  : bookingEn.detail.cancelBookingBtn
              }
              className="rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              <span>{bookingEn.detail.cancelBookingBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document === 'undefined' ? null : createPortal(drawerContent, document.body);
}

const REFUND_STATUS_STYLES: Record<string, string> = {
  Pending: 'border-amber-200 bg-amber-50/60 text-amber-800',
  RetryPending: 'border-amber-200 bg-amber-50/60 text-amber-800',
  Processing: 'border-sky-200 bg-sky-50/60 text-sky-800',
  Processed: 'border-teal-200 bg-teal-50/60 text-teal-800',
  Failed: 'border-rose-200 bg-rose-50/60 text-rose-800',
  ManualReview: 'border-purple-200 bg-purple-50/60 text-purple-800',
  Rejected: 'border-rose-200 bg-rose-50/60 text-rose-800',
};

/**
 * Demo-mode only: demo bookings have no Backend-issued id, so there is nothing
 * to fetch live status for. Shows the fixture's own booking.refund instead.
 */
function DemoRefundRecordCard({ refund }: { refund: BookingRefundDto | undefined }) {
  if (!refund) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-[11px] text-slate-500">
        {bookingEn.refundStatus.notApplicable}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4">
      <p className="mb-2 text-[11px] italic text-slate-500">{bookingEn.refundStatus.demoNote}</p>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
          {bookingEn.detail.refundRecord}
        </span>
        <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-extrabold text-teal-800">
          {refund.status}
        </span>
      </div>
      <div className="space-y-1.5 text-xs text-slate-700">
        <div className="flex justify-between">
          <span className="text-slate-500">{bookingEn.detail.refundAmount}:</span>
          <span className="font-bold text-[#006B5F]">{formatCurrencyVND(refund.refundableAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">{bookingEn.detail.gatewayRef}:</span>
          <span className="font-mono text-slate-800">{refund.gatewayReference || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}

const REFRESHABLE_REFUND_STATUSES = ['Pending', 'Processing', 'RetryPending'];

function RefundStatusCard({
  loading,
  result,
  onRefresh,
}: {
  loading: boolean;
  result: GetBookingRefundStatusResult | null;
  onRefresh?: () => void;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-500">
        {bookingEn.refundStatus.loading}
      </div>
    );
  }

  if (!result || result.outcome === 'not_applicable') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-[11px] text-slate-500">
        {bookingEn.refundStatus.notApplicable}
      </div>
    );
  }

  if (result.outcome === 'error') {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-3 text-[11px] text-rose-800">
        {bookingEn.refundStatus.errorNote}
      </div>
    );
  }

  const { data } = result;
  const colorClass = REFUND_STATUS_STYLES[data.status] ?? 'border-slate-200 bg-slate-50/60 text-slate-800';
  const statusLabel = bookingEn.refundStatus.statusLabels[data.status] ?? data.status;

  return (
    <div className={`rounded-2xl border p-4 ${colorClass}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider">
          {bookingEn.detail.refundRecord}
        </span>
        <span className="rounded bg-white/70 px-2 py-0.5 text-[10px] font-extrabold">
          {statusLabel}
        </span>
      </div>
      <div className="space-y-1.5 text-xs text-slate-700">
        <div className="flex justify-between">
          <span className="text-slate-500">{bookingEn.detail.refundAmount}:</span>
          <span className="font-bold text-[#006B5F]">{formatCurrencyVND(data.refundAmount)}</span>
        </div>
        {data.gatewayReference && (
          <div className="flex justify-between">
            <span className="text-slate-500">{bookingEn.detail.gatewayRef}:</span>
            <span className="font-mono text-slate-800">{data.gatewayReference}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-slate-500">{bookingEn.refundStatus.attemptCountLabel}:</span>
          <span className="font-semibold text-slate-800">{data.attemptCount}</span>
        </div>
        {data.processedAtUtc && (
          <div className="flex justify-between">
            <span className="text-slate-500">{bookingEn.refundStatus.processedAtLabel}:</span>
            <span className="text-slate-800">{formatVietnamDateTime(data.processedAtUtc)}</span>
          </div>
        )}
        {data.nextAttemptAtUtc && (
          <div className="flex justify-between">
            <span className="text-slate-500">{bookingEn.refundStatus.nextAttemptLabel}:</span>
            <span className="text-slate-800">{formatVietnamDateTime(data.nextAttemptAtUtc)}</span>
          </div>
        )}
        {data.lastErrorCode && (
          <div className="flex justify-between">
            <span className="text-slate-500">{bookingEn.refundStatus.lastErrorLabel}:</span>
            <span className="font-mono text-slate-800">{data.lastErrorCode}</span>
          </div>
        )}
      </div>
      {onRefresh && REFRESHABLE_REFUND_STATUSES.includes(data.status) && (
        <button
          type="button"
          onClick={onRefresh}
          className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
        >
          {bookingEn.refundStatus.refresh}
        </button>
      )}
    </div>
  );
}
