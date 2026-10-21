'use client';

import Link from 'next/link';
import React, { useId } from 'react';

import { ROUTES } from '@/lib/routes';
import { tripReviewEn } from '../resources/en';
import type { TripListItem } from '../types/tripHistoryContract';
import { formatTripDate } from '../utils/formatTripDate';

export type TripDetailFocus = 'refund';

interface TripCardProps {
  item: TripListItem;
  /** Opens the detail dialog for this record; `'refund'` scrolls the dialog to the refund. */
  onOpenDetail: (item: TripListItem, focus?: TripDetailFocus) => void;
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

const LINK_ACTION =
  'inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-98';

export function TripCard({ item, onOpenDetail }: TripCardProps) {
  const titleId = useId();
  const isItinerary = item.kind === 'itinerary';
  const isCancelled = item.tab === 'Cancelled';
  const isCompleted = item.tab === 'Completed';
  const statusLabel = tripReviewEn.tripHistory.statusLabels[item.status] ?? item.status;
  const reviewHref =
    item.kind === 'commerceBooking'
      ? ROUTES.account.bookingReview(item.reviewableRecord.kind, item.reviewableRecord.id)
      : null;

  // Each action follows its own backend flag; nothing is inferred from the tab or the status.
  const canWriteReview = item.actions.canReview === true && reviewHref !== null;
  const reviewed = item.kind === 'commerceBooking' && item.review.exists === true && reviewHref !== null;
  const ticketId = item.actions.canViewETicket ? item.actions.ticketId : null;

  return (
    <article
      aria-labelledby={titleId}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md"
    >
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                isItinerary
                  ? 'bg-[#E6F4F1] text-[#006B5F]'
                  : isCancelled
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-blue-50 text-blue-600'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                {isItinerary ? 'route' : isCancelled ? 'event_busy' : 'explore'}
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
                  {statusLabel}
                </span>
              </div>

              <h3 id={titleId} className="text-sm font-bold leading-snug text-[#00152A] sm:text-base">
                {item.title}
              </h3>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                {tripReviewEn.tripHistory.card.departureDate(formatTripDate(item.departureAtUtc))}
              </p>
            </div>
          </div>

          {item.kind === 'commerceBooking' && item.review.exists && item.review.rating !== undefined && (
            <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
              ★ {item.review.rating}.0
            </span>
          )}
        </div>

        {item.kind === 'itinerary' ? (
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-800">
              <span className="material-symbols-outlined text-[15px] text-[#006B5F]" aria-hidden="true">
                navigation
              </span>
              <span>{tripReviewEn.tripHistory.card.stopsCount(item.stopCount)}</span>
              {item.visitedCount !== undefined && (
                <span className="font-semibold text-slate-600">
                  {tripReviewEn.tripHistory.card.visitedOf(item.visitedCount, item.stopCount)}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
              <span className="font-semibold">{tripReviewEn.tripHistory.card.bookingCode(item.bookingCode)}</span>
              <span className="font-semibold">{tripReviewEn.tripHistory.card.participantCount(item.participantCount)}</span>
              <span className="font-extrabold text-[#00152A]">{formatVnd(item.totalAmount)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/70 p-3 sm:px-4">
        {item.kind === 'itinerary' && (
          <Link href={ROUTES.itinerary(item.id)} className={LINK_ACTION}>
            <span className="material-symbols-outlined text-[16px] text-slate-500" aria-hidden="true">
              map
            </span>
            <span>{tripReviewEn.actions.viewItinerary}</span>
          </Link>
        )}

        {ticketId !== null && (
          <Link href={ROUTES.bookingTicket(ticketId)} className={LINK_ACTION}>
            <span className="material-symbols-outlined text-[16px] text-[#006B5F]" aria-hidden="true">
              qr_code_2
            </span>
            <span>{tripReviewEn.actions.viewETicket}</span>
          </Link>
        )}

        {canWriteReview && (
          <Link
            href={reviewHref}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#006B5F] py-2 px-3 text-xs font-bold text-white shadow-2xs transition hover:bg-[#00574D] active:scale-98"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              rate_review
            </span>
            <span>{tripReviewEn.actions.writeReview}</span>
          </Link>
        )}

        {reviewed && (
          <Link
            href={reviewHref}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2 px-3 text-xs font-bold text-[#006B5F] transition hover:bg-slate-200"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              visibility
            </span>
            <span>{tripReviewEn.actions.viewReview}</span>
          </Link>
        )}

        {item.actions.canViewRefund && (
          <button type="button" onClick={() => onOpenDetail(item, 'refund')} className={LINK_ACTION}>
            <span className="material-symbols-outlined text-[16px] text-slate-500" aria-hidden="true">
              receipt_long
            </span>
            <span>{tripReviewEn.actions.refundDetails}</span>
          </button>
        )}

        <button type="button" onClick={() => onOpenDetail(item, undefined)} className={LINK_ACTION}>
          <span className="material-symbols-outlined text-[16px] text-slate-500" aria-hidden="true">
            info
          </span>
          <span>{tripReviewEn.actions.viewDetails}</span>
        </button>
      </div>
    </article>
  );
}
