'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

import { tripReviewEn } from '../resources/en';
import { fetchTripDetail, TripHistoryClientError } from '../services/tripHistoryClient';
import type {
  BookingTripDetail,
  ItineraryTripDetail,
  TripDetail,
  TripListItem,
} from '../types/tripHistoryContract';
import { formatTripDate, formatTripDateTime, formatTripTime } from '../utils/formatTripDate';
import { formatTripDisplayTitle } from '../utils/formatTripDisplayTitle';
import type { TripDetailFocus } from './TripCard';
import { useModalFocusTrap } from './useModalFocusTrap';
import { ComplaintEntryAction } from '@/features/complaints/submit/components/ComplaintEntryAction';

interface TripDetailDialogProps {
  item: TripListItem;
  /** `'refund'` highlights the refund section (opened from the refund action). */
  focus?: TripDetailFocus;
  allowDemo: boolean;
  onClose: () => void;
}

type LoadState =
  | { phase: 'loading' }
  | { phase: 'ready'; detail: TripDetail }
  | { phase: 'error'; message: string; retryable: boolean };

const copy = tripReviewEn.dialogs.tripDetail;

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="shrink-0 text-[#5B6E69]">{label}</span>
      <span className="text-right font-semibold text-[#1C2928]">{children}</span>
    </div>
  );
}

function Section({
  heading,
  highlighted = false,
  children,
}: {
  heading: string;
  highlighted?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView?.({ block: 'nearest' });
  }, [highlighted]);

  return (
    <section
      ref={ref}
      data-highlighted={highlighted ? 'true' : undefined}
      className={`rounded-xl border px-4 py-3 ${
        highlighted
          ? 'border-[#174B4A] bg-[#E8F0EA]/70'
          : 'border-[#EDEAE1] bg-[#F7F5EF]'
      }`}
    >
      <h5 className="text-xs font-semibold text-[#5B6E69]">{heading}</h5>
      <div className="mt-2 divide-y divide-[#EDEAE1]/80 text-xs">{children}</div>
    </section>
  );
}

function BookingSections({
  detail,
  focus,
  allowDemo,
}: {
  detail: BookingTripDetail;
  focus?: TripDetailFocus;
  allowDemo: boolean;
}) {
  const { adult, child, infant } = detail.participants;
  const counts = [
    adult > 0 ? copy.adults(adult) : null,
    child > 0 ? copy.children(child) : null,
    infant > 0 ? copy.infants(infant) : null,
  ].filter((value): value is string => value !== null);

  return (
    <>
      <Section heading={copy.tourHeading}>
        <Row label={copy.destinationLabel}>{detail.tour.destinationSummary}</Row>
        <Row label={tripReviewEn.dialogs.refundDetails.bookingCodeLabel}>{detail.bookingCode}</Row>
      </Section>
      <Section heading={copy.scheduleHeading}>
        <Row label={copy.startsLabel}>{formatTripDateTime(detail.schedule.startAtUtc)}</Row>
        <Row label={copy.endsLabel}>{formatTripDateTime(detail.schedule.endAtUtc)}</Row>
        {detail.schedule.meetingPoint && (
          <Row label={copy.meetingPointLabel}>{detail.schedule.meetingPoint}</Row>
        )}
      </Section>
      <Section heading={copy.participantsHeading}>
        <div className="space-y-1 py-1">
          {counts.map((text) => (
            <p key={text} className="font-semibold text-[#1C2928]">
              {text}
            </p>
          ))}
        </div>
      </Section>
      {detail.cancellation && (
        <Section heading={copy.cancellationHeading}>
          {detail.cancellation.cancelledAtUtc && (
            <Row label={tripReviewEn.dialogs.refundDetails.cancelledAtLabel}>
              {formatTripDate(detail.cancellation.cancelledAtUtc)}
            </Row>
          )}
          {detail.cancellation.reason && (
            <Row label={copy.cancellationReasonLabel}>{detail.cancellation.reason}</Row>
          )}
        </Section>
      )}
      {detail.refund && (
        <Section heading={copy.refundHeading} highlighted={focus === 'refund'}>
          <Row label={tripReviewEn.dialogs.refundDetails.statusLabel}>
            {tripReviewEn.tripHistory.refundStatusLabels[detail.refund.status] ?? detail.refund.status}
          </Row>
          <Row label={tripReviewEn.dialogs.refundDetails.refundAmountLabel}>
            {formatVnd(detail.refund.amount)}
          </Row>
          <Row label={tripReviewEn.dialogs.refundDetails.refundChannelLabel}>
            {detail.refund.channel ?? copy.channelUnavailable}
          </Row>
        </Section>
      )}
      <ComplaintEntryAction key={detail.id} bookingId={detail.id} disabled={allowDemo} />
    </>
  );
}

function ItinerarySections({ detail }: { detail: ItineraryTripDetail }) {
  return (
    <>
      {detail.visitedCount !== undefined && (
        <p className="text-xs font-semibold text-[#5B6E69]">
          {tripReviewEn.tripHistory.card.visitedOf(detail.visitedCount, detail.stopCount)}
        </p>
      )}
      <section className="space-y-2">
        <h5 className="text-xs font-semibold text-[#5B6E69]">{copy.stopsHeading}</h5>
        <ol className="divide-y divide-[#EDEAE1] rounded-xl border border-[#DCE2DD] bg-white text-xs">
          {detail.stops.map((stop, index) => (
            <li key={stop.sequenceNo} className="flex items-start gap-3 px-4 py-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#174B4A] text-[11px] font-bold text-white">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span data-stop-name className="font-bold text-[#1C2928]">
                    {stop.poiName}
                  </span>
                  {stop.visitStatus && (
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        stop.visitStatus === 'Reached'
                          ? 'bg-[#E8F0EA] text-[#174B4A]'
                          : stop.visitStatus === 'Skipped'
                            ? 'bg-[#FEF3E2] text-[#B45309]'
                            : 'bg-[#F7F5EF] text-[#5B6E69]'
                      }`}
                    >
                      {copy.stopStatus[stop.visitStatus]}
                    </span>
                  )}
                </div>
                {stop.plannedArrivalUtc && stop.plannedDepartureUtc && (
                  <p className="mt-1 text-[#5B6E69]">
                    {copy.plannedWindow(formatTripTime(stop.plannedArrivalUtc), formatTripTime(stop.plannedDepartureUtc))}
                  </p>
                )}
                {stop.reachedAtUtc && (
                  <p className="mt-0.5 text-[#5B6E69]">{copy.reachedAt(formatTripDateTime(stop.reachedAtUtc))}</p>
                )}
                {stop.skippedAtUtc && (
                  <p className="mt-0.5 text-[#5B6E69]">{copy.skippedAt(formatTripDateTime(stop.skippedAtUtc))}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>
      {detail.session && (
        <Section heading={copy.sessionHeading}>
          <Row label={copy.sessionStartedLabel}>{formatTripDateTime(detail.session.startedAtUtc)}</Row>
          {detail.session.endedAtUtc && (
            <Row label={copy.sessionEndedLabel}>{formatTripDateTime(detail.session.endedAtUtc)}</Row>
          )}
          {detail.session.completionReason && (
            <Row label={copy.sessionReasonLabel}>
              {copy.completionReasons[detail.session.completionReason] ?? detail.session.completionReason}
            </Row>
          )}
        </Section>
      )}
    </>
  );
}

export function TripDetailDialog({ item, focus, allowDemo, onClose }: TripDetailDialogProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<LoadState>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);

  const displayTitle = item.kind === 'itinerary'
    ? formatTripDisplayTitle(item.title, item.departureAtUtc)
    : item.title;

  const dialogRef = useModalFocusTrap<HTMLDivElement>({
    isOpen: true,
    onClose,
    initialFocusRef: closeButtonRef,
  });

  useEffect(() => {
    const controller = new AbortController();
    fetchTripDetail(item.kind, item.id, { allowDemo, signal: controller.signal })
      .then((detail) => {
        if (!controller.signal.aborted) setState({ phase: 'ready', detail });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof TripHistoryClientError) {
          setState({ phase: 'error', message: error.message, retryable: error.kind === 'system' });
        } else {
          setState({ phase: 'error', message: tripReviewEn.errors.systemError, retryable: true });
        }
      });
    return () => controller.abort();
  }, [item.kind, item.id, allowDemo, attempt]);

  const retry = useCallback(() => {
    setState({ phase: 'loading' });
    setAttempt((value) => value + 1);
  }, []);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C2928]/45 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#DCE2DD] bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#EDEAE1] px-6 py-4">
          <h4 id={titleId} className="text-base font-bold text-[#1C2928]">
            {displayTitle}
          </h4>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={tripReviewEn.actions.close}
            className="rounded-lg p-1 text-[#5B6E69] transition hover:bg-[#F7F5EF] hover:text-[#1C2928]"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {state.phase === 'loading' && (
            <p role="status" className="py-4 text-center text-xs font-medium text-[#5B6E69]">
              {copy.loading}
            </p>
          )}

          {state.phase === 'error' && (
            <div role="alert" className="rounded-xl border border-[#F5C2CC] bg-[#FDECEF] p-4 text-xs text-[#8C1030]">
              <p>{state.message}</p>
              {state.retryable && (
                <button
                  type="button"
                  onClick={retry}
                  className="mt-3 rounded-xl bg-[#174B4A] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#103B39]"
                >
                  {tripReviewEn.actions.retry}
                </button>
              )}
            </div>
          )}

          {state.phase === 'ready' &&
            (state.detail.kind === 'commerceBooking' ? (
              <BookingSections detail={state.detail} focus={focus} allowDemo={allowDemo} />
            ) : (
              <ItinerarySections detail={state.detail} />
            ))}
        </div>
      </div>
    </div>
  );
}
