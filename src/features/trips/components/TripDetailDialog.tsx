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
import type { TripDetailFocus } from './TripCard';
import { useModalFocusTrap } from './useModalFocusTrap';

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
    <p className="flex flex-wrap gap-x-2">
      <span className="font-semibold text-slate-700">{label}</span>
      <span className="text-slate-600">{children}</span>
    </p>
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
      className={`rounded-xl border p-3 ${highlighted ? 'border-[#006B5F] bg-[#E6F4F1]/60' : 'border-slate-100 bg-slate-50'}`}
    >
      <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{heading}</h5>
      <div className="mt-2 space-y-1 text-xs">{children}</div>
    </section>
  );
}

function BookingSections({ detail, focus }: { detail: BookingTripDetail; focus?: TripDetailFocus }) {
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
        {counts.map((text) => (
          <p key={text} className="text-slate-600">
            {text}
          </p>
        ))}
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
    </>
  );
}

function ItinerarySections({ detail }: { detail: ItineraryTripDetail }) {
  return (
    <>
      {detail.visitedCount !== undefined && (
        <p className="text-xs font-semibold text-slate-600">
          {tripReviewEn.tripHistory.card.visitedOf(detail.visitedCount, detail.stopCount)}
        </p>
      )}
      <section className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{copy.stopsHeading}</h5>
        <ol className="mt-2 space-y-2 text-xs">
          {detail.stops.map((stop) => (
            <li key={stop.sequenceNo} className="rounded-lg border border-slate-200 bg-white p-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span data-stop-name className="font-bold text-[#00152A]">
                  {stop.poiName}
                </span>
                {stop.visitStatus && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                    {copy.stopStatus[stop.visitStatus]}
                  </span>
                )}
              </div>
              {stop.plannedArrivalUtc && stop.plannedDepartureUtc && (
                <p className="mt-0.5 text-slate-500">
                  {copy.plannedWindow(formatTripTime(stop.plannedArrivalUtc), formatTripTime(stop.plannedDepartureUtc))}
                </p>
              )}
              {stop.reachedAtUtc && (
                <p className="text-slate-500">{copy.reachedAt(formatTripDateTime(stop.reachedAtUtc))}</p>
              )}
              {stop.skippedAtUtc && (
                <p className="text-slate-500">{copy.skippedAt(formatTripDateTime(stop.skippedAtUtc))}</p>
              )}
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h4 id={titleId} className="text-base font-extrabold text-[#00152A]">
            {item.title}
          </h4>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={tripReviewEn.actions.close}
            className="text-slate-400 hover:text-slate-600"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {state.phase === 'loading' && (
            <p role="status" className="text-xs font-semibold text-slate-500">
              {copy.loading}
            </p>
          )}

          {state.phase === 'error' && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
              <p>{state.message}</p>
              {state.retryable && (
                <button
                  type="button"
                  onClick={retry}
                  className="mt-3 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
                >
                  {tripReviewEn.actions.retry}
                </button>
              )}
            </div>
          )}

          {state.phase === 'ready' &&
            (state.detail.kind === 'commerceBooking' ? (
              <BookingSections detail={state.detail} focus={focus} />
            ) : (
              <ItinerarySections detail={state.detail} />
            ))}
        </div>

      </div>
    </div>
  );
}
