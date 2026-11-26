'use client';

import Link from 'next/link';
import React, { useId } from 'react';

import { ROUTES } from '@/lib/routes';
import { tripReviewEn } from '../resources/en';
import type { TripListItem } from '../types/tripHistoryContract';
import { formatTripDate } from '../utils/formatTripDate';
import { formatTripDisplayTitle } from '../utils/formatTripDisplayTitle';

export type TripDetailFocus = 'refund';

interface TripCardProps {
  item: TripListItem;
  /** Opens the detail dialog for this record; `'refund'` scrolls the dialog to the refund. */
  onOpenDetail: (item: TripListItem, focus?: TripDetailFocus) => void;
  /**
   * True while demo fixtures are on screen. A demo id must never reach the refund API, so demo records
   * open the detail dialog on the refund instead of the live refund-progress page.
   */
  isDemo?: boolean;
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

const SECONDARY_ACTION =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#DCE2DD] bg-white px-4 py-2 text-xs font-semibold text-[#1C2928] transition hover:bg-[#F7F5EF]';

const SOFT_ACTION =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] px-4 py-2 text-xs font-semibold text-[#174B4A] transition hover:bg-[#EDEAE1]';

export function TripCard({ item, onOpenDetail, isDemo = false }: TripCardProps) {
  const titleId = useId();
  const isItinerary = item.kind === 'itinerary';
  const isCancelled = item.tab === 'Cancelled';
  const statusLabel = tripReviewEn.tripHistory.statusLabels[item.status] ?? item.status;
  const displayTitle = isItinerary
    ? formatTripDisplayTitle(item.title, item.departureAtUtc)
    : item.title;
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
      className="rounded-2xl border border-[#DCE2DD] bg-white p-5 transition-colors hover:border-[#C5D0C8]"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                isItinerary
                  ? 'bg-[#F7F5EF] text-[#5B6E69]'
                  : 'bg-[#F6EDE8] text-[#995436]'
              }`}
            >
              {isItinerary
                ? tripReviewEn.tripHistory.card.typeItinerary
                : tripReviewEn.tripHistory.card.typeTour}
            </span>

            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                isCancelled
                  ? 'bg-[#FDECEF] text-[#8C1030]'
                  : 'bg-[#E8F0EA] text-[#174B4A]'
              }`}
            >
              {statusLabel}
            </span>

            {item.kind === 'commerceBooking' && item.review.exists && item.review.rating !== undefined && (
              <span className="font-semibold text-[#995436]">
                ★ {item.review.rating}.0
              </span>
            )}

            <span className="text-[#5B6E69]">
              {tripReviewEn.tripHistory.card.departureDate(formatTripDate(item.departureAtUtc))}
            </span>
          </div>

          <h3 id={titleId} className="mt-2 text-base font-bold leading-snug text-[#1C2928]">
            {displayTitle}
          </h3>

          {item.kind === 'itinerary' ? (
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#5B6E69]">
              <span>{tripReviewEn.tripHistory.card.stopsCount(item.stopCount)}</span>
              {item.visitedCount !== undefined && (
                <>
                  <span className="text-[#DCE2DD]" aria-hidden="true">·</span>
                  <span className="font-semibold text-[#1C2928]">
                    {tripReviewEn.tripHistory.card.visitedOf(item.visitedCount, item.stopCount)}
                  </span>
                </>
              )}
            </div>
          ) : (
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#5B6E69]">
              <span className="font-medium text-[#1C2928]">
                {tripReviewEn.tripHistory.card.bookingCode(item.bookingCode)}
              </span>
              <span className="text-[#DCE2DD]" aria-hidden="true">·</span>
              <span>{tripReviewEn.tripHistory.card.participantCount(item.participantCount)}</span>
              <span className="text-[#DCE2DD]" aria-hidden="true">·</span>
              <span className="font-bold text-[#1C2928]">{formatVnd(item.totalAmount)}</span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenDetail(item, undefined)}
            className={SECONDARY_ACTION}
          >
            <span>{tripReviewEn.actions.viewDetails}</span>
          </button>

          {item.kind === 'itinerary' && (
            <Link href={ROUTES.itinerary(item.id)} className={SOFT_ACTION}>
              <span>{tripReviewEn.actions.viewItinerary}</span>
            </Link>
          )}

          {ticketId !== null && (
            <Link href={ROUTES.account.ticket(ticketId)} className={SOFT_ACTION}>
              <span>{tripReviewEn.actions.viewETicket}</span>
            </Link>
          )}

          {canWriteReview && (
            <Link
              href={reviewHref}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#174B4A] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#103B39]"
            >
              <span>{tripReviewEn.actions.writeReview}</span>
            </Link>
          )}

          {reviewed && (
            <Link href={reviewHref} className={SOFT_ACTION}>
              <span>{tripReviewEn.actions.viewReview}</span>
            </Link>
          )}

          {item.actions.canViewRefund &&
            (!isDemo && item.kind === 'commerceBooking' ? (
              <Link href={`/bookings/${encodeURIComponent(item.id)}/refund`} className={SOFT_ACTION}>
                <span>{tripReviewEn.actions.refundDetails}</span>
              </Link>
            ) : (
              <button type="button" onClick={() => onOpenDetail(item, 'refund')} className={SOFT_ACTION}>
                <span>{tripReviewEn.actions.refundDetails}</span>
              </button>
            ))}
        </div>
      </div>
    </article>
  );
}
