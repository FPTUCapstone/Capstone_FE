'use client';

import Link from 'next/link';
import React, { useState } from 'react';

import { ROUTES } from '@/lib/routes';
import { tripReviewEn } from '../resources/en';
import type { TripCardDto } from '../types/tripHistory';
import { useModalFocusTrap } from './useModalFocusTrap';

interface TripCardProps {
  trip: TripCardDto;
  onViewReview?: (trip: TripCardDto) => void;
}

function formatVnd(amount?: number): string {
  if (amount === undefined || amount === null) return '';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTripDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(d);
  } catch {
    return isoString;
  }
}

export function TripCard({ trip, onViewReview }: TripCardProps) {
  const [showRefundModal, setShowRefundModal] = useState(false);
  const refundCloseButtonRef = React.useRef<HTMLButtonElement>(null);
  const refundTriggerButtonRef = React.useRef<HTMLButtonElement>(null);

  const refundDialogRef = useModalFocusTrap<HTMLDivElement>({
    isOpen: showRefundModal,
    onClose: () => setShowRefundModal(false),
    initialFocusRef: refundCloseButtonRef,
    triggerRef: refundTriggerButtonRef,
  });

  const formattedDate = formatTripDate(trip.departureDatetime);
  const isCompleted = trip.status === 'Completed';
  const isCancelled = trip.status === 'Cancelled';
  const isSelfPlanned = trip.tripType === 'SelfPlannedItinerary';

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md">
      {/* Header section */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Visual Icon */}
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                isSelfPlanned
                  ? 'bg-[#E6F4F1] text-[#006B5F]'
                  : isCancelled
                  ? 'bg-slate-100 text-slate-500'
                  : 'bg-blue-50 text-blue-600'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                {isSelfPlanned ? 'route' : isCancelled ? 'event_busy' : 'explore'}
              </span>
            </div>

            <div>
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : isCancelled
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-sky-100 text-sky-800'
                  }`}
                >
                  {trip.statusLabel || trip.status}
                </span>

                {trip.isDemo && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                    {tripReviewEn.demo.shortBadge}
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-[#00152A] sm:text-base leading-snug">
                {trip.title}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                {tripReviewEn.tripHistory.card.departureDate(formattedDate)}
              </p>
            </div>
          </div>

          {/* Review badge if reviewed */}
          {trip.isReviewed && trip.rating && (
            <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
              ★ {trip.rating}.0
            </span>
          )}
        </div>

        {/* Content details based on card type */}
        {isSelfPlanned ? (
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-800">
              <span className="material-symbols-outlined text-[15px] text-[#006B5F]" aria-hidden="true">
                navigation
              </span>
              <span>
                {trip.stopCount
                  ? tripReviewEn.tripHistory.card.stopsCount(trip.stopCount)
                  : ''}
                {trip.distanceKm
                  ? tripReviewEn.tripHistory.card.distanceTravelled(trip.distanceKm)
                  : ''}
              </span>
              {trip.durationLabel && (
                <span className="ml-auto text-[11px] font-semibold text-slate-500">
                  {trip.durationLabel}
                </span>
              )}
            </div>

            {trip.stopsSummary && trip.stopsSummary.length > 0 && (
              <p className="mt-1.5 truncate text-xs text-slate-600">
                <strong className="text-slate-800">
                  {tripReviewEn.tripHistory.card.visitedLabel}
                </strong>
                {trip.stopsSummary.join(', ')}
              </p>
            )}

            <div className="mt-2 flex flex-wrap gap-1.5">
              {trip.memberCount != null && trip.memberCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                  <span className="material-symbols-outlined text-[13px] text-[#006B5F]" aria-hidden="true">
                    group
                  </span>
                  {tripReviewEn.tripHistory.card.travelledWithMembers(
                    trip.memberCount
                  )}
                </span>
              )}
              {trip.isRerouted && (
                <span className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-0.5 text-[11px] text-teal-700">
                  <span className="material-symbols-outlined text-[13px]" aria-hidden="true">
                    alt_route
                  </span>
                  {tripReviewEn.tripHistory.card.weatherReroutedBadge}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
              <span className="font-semibold text-slate-700">
                {trip.operatorName ||
                  tripReviewEn.tripHistory.card.defaultOperatorName}
              </span>
              {trip.bookingCode && (
                <span className="font-mono text-[11px] text-slate-500">
                  {tripReviewEn.tripHistory.card.bookingCode(trip.bookingCode)}
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-xs">
              {trip.totalAmount !== undefined && (
                <span className="font-bold text-[#006B5F]">
                  {formatVnd(trip.totalAmount)}
                </span>
              )}
              {trip.paymentMethod && (
                <span className="text-[11px] text-slate-500">
                  {tripReviewEn.tripHistory.card.paidVia(trip.paymentMethod)}
                </span>
              )}
            </div>

            {trip.participantsSummary && (
              <p className="mt-1 text-[11px] text-slate-500">
                {tripReviewEn.tripHistory.card.participants(
                  trip.participantsSummary
                )}
              </p>
            )}

            {isCancelled && trip.refundStatus && (
              <div className="mt-2 rounded-lg bg-slate-100 p-2 text-xs text-slate-600">
                <p className="font-semibold text-slate-700">
                  {tripReviewEn.tripHistory.card.refundStatus(
                    trip.refundStatus
                  )}
                </p>
                {trip.refundAmount !== undefined && (
                  <p className="text-[11px]">
                    {tripReviewEn.tripHistory.card.refundAmountLine(
                      formatVnd(trip.refundAmount),
                      trip.refundChannel ||
                        tripReviewEn.tripHistory.card.defaultRefundChannel
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action footer */}
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/70 p-3 sm:px-4">
        {/* Action 1: Self-planned itinerary view */}
        {isSelfPlanned && trip.itineraryId && (
          <Link
            href={ROUTES.itinerary(trip.itineraryId)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-98"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500" aria-hidden="true">
              map
            </span>
            <span>{tripReviewEn.actions.viewItinerary}</span>
          </Link>
        )}

        {/* Action 2: Booked Tour ticket viewer (CRITICAL: PR #43 ticketId ONLY) */}
        {!isSelfPlanned && trip.ticketId && (
          <Link
            href={ROUTES.bookingTicket(trip.ticketId)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-98"
          >
            <span className="material-symbols-outlined text-[16px] text-[#006B5F]" aria-hidden="true">
              qr_code_2
            </span>
            <span>{tripReviewEn.actions.viewETicket}</span>
          </Link>
        )}

        {/* Action 3: Review CTA (UC-33) - only for completed trips */}
        {isCompleted && !trip.isReviewed && (
          <Link
            href={ROUTES.account.tripReview(trip.tripId)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#006B5F] py-2 px-3 text-xs font-bold text-white shadow-2xs transition hover:bg-[#00574D] active:scale-98"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              rate_review
            </span>
            <span>{tripReviewEn.actions.writeReview}</span>
          </Link>
        )}

        {/* Action 4: View submitted review dialog if already reviewed */}
        {isCompleted && trip.isReviewed && (
          <button
            type="button"
            onClick={() => onViewReview?.(trip)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2 px-3 text-xs font-bold text-[#006B5F] transition hover:bg-slate-200"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              visibility
            </span>
            <span>{tripReviewEn.actions.viewReview}</span>
          </button>
        )}

        {/* Action 5: Rebook tour CTA */}
        {!isSelfPlanned && trip.tourId && isCompleted && (
          <Link
            href={ROUTES.tour(trip.tourId)}
            className="inline-flex shrink-0 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
              replay
            </span>
            <span>{tripReviewEn.actions.bookAgain}</span>
          </Link>
        )}

        {/* Action 6: Cancelled tour refund modal toggle */}
        {isCancelled && trip.refundStatus && (
          <button
            ref={refundTriggerButtonRef}
            type="button"
            onClick={() => setShowRefundModal(true)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500" aria-hidden="true">
              receipt_long
            </span>
            <span>{tripReviewEn.actions.refundDetails}</span>
          </button>
        )}
      </div>

      {/* Refund details dialog (Report 3 Alternative Flow 3.7.1) */}
      {showRefundModal && (
        <div
          ref={refundDialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="refund-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h4 id="refund-modal-title" className="text-base font-bold text-[#00152A]">
              {tripReviewEn.dialogs.refundDetails.title}
            </h4>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <p>
                <strong>{tripReviewEn.dialogs.refundDetails.bookingCodeLabel}</strong>{' '}
                {trip.bookingCode || trip.tripId}
              </p>
              <p>
                <strong>{tripReviewEn.dialogs.refundDetails.statusLabel}</strong>{' '}
                {trip.refundStatus}
              </p>
              {trip.refundAmount !== undefined && (
                <p>
                  <strong>{tripReviewEn.dialogs.refundDetails.refundAmountLabel}</strong>{' '}
                  {formatVnd(trip.refundAmount)}
                </p>
              )}
              {trip.refundChannel && (
                <p>
                  <strong>{tripReviewEn.dialogs.refundDetails.refundChannelLabel}</strong>{' '}
                  {trip.refundChannel}
                </p>
              )}
              {trip.cancelledAt && (
                <p>
                  <strong>{tripReviewEn.dialogs.refundDetails.cancelledAtLabel}</strong>{' '}
                  {formatTripDate(trip.cancelledAt)}
                </p>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                ref={refundCloseButtonRef}
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="rounded-xl bg-[#006B5F] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#00574D]"
              >
                {tripReviewEn.actions.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
