'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';

import { tripReviewEn } from '@/features/trips/resources/en';
import type { TripCardDto } from '@/features/trips/types/tripHistory';
import { ROUTES } from '@/lib/routes';
import { submitTripReview } from '../services/reviewApi';
import type {
  CreateReviewPayload,
  PoiReviewFeedback,
  ReviewPhotoItem,
  ReviewSubmissionResult,
} from '../types/review';
import { PhotoUploadPreview } from './PhotoUploadPreview';
import { PoiQuickFeedback } from './PoiQuickFeedback';
import { StarRatingInput } from './StarRatingInput';

interface TripReviewViewProps {
  trip: TripCardDto;
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

export function TripReviewView({ trip }: TripReviewViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1';

  const [rating, setRating] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [routeSatisfaction, setRouteSatisfaction] = useState<'tight' | 'well_paced' | 'loose' | undefined>(undefined);
  const [poiFeedbacks, setPoiFeedbacks] = useState<PoiReviewFeedback[]>([]);
  const [comment, setComment] = useState<string>('');
  const [photos, setPhotos] = useState<ReviewPhotoItem[]>([]);
  const [publishWithDisplayName, setPublishWithDisplayName] = useState<boolean>(true);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<ReviewSubmissionResult | null>(null);

  const commentLength = comment.trim().length;
  const isCommentTooLong = commentLength > 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRatingError(null);
    setTitleError(null);
    setCommentError(null);
    setSubmissionResult(null);

    let hasError = false;

    if (!rating || rating < 1 || rating > 5) {
      setRatingError(tripReviewEn.validation.ratingRequired);
      hasError = true;
    }

    const titleTrimmed = title.trim();
    if (titleTrimmed.length === 0) {
      setTitleError(tripReviewEn.validation.titleRequired);
      hasError = true;
    } else if (titleTrimmed.length > 150) {
      setTitleError(tripReviewEn.validation.titleMaxLength);
      hasError = true;
    }

    if (commentLength === 0) {
      setCommentError(tripReviewEn.validation.commentRequired);
      hasError = true;
    } else if (commentLength > 500) {
      setCommentError(tripReviewEn.validation.commentMaxLength);
      hasError = true;
    }

    if (hasError) return;

    setSubmitting(true);

    const payload: CreateReviewPayload = {
      tripId: trip.tripId,
      bookingId: trip.bookingId,
      rating,
      title: titleTrimmed,
      comment: comment.trim(),
      publishWithDisplayName,
      ...(isDemo && routeSatisfaction ? { routeSatisfaction } : {}),
      ...(isDemo && poiFeedbacks.length > 0 ? { poiFeedbacks } : {}),
      ...(isDemo && photos.length > 0 ? { photos } : {}),
    };

    try {
      const result = await submitTripReview(payload, { allowDemo: isDemo });
      setSubmissionResult(result);
    } catch (err) {
      setSubmissionResult({
        status: 'ERROR',
        message:
          err instanceof Error ? err.message : tripReviewEn.errors.systemError,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Demo notice if active */}
      {isDemo && (
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          <span>
            <strong>{tripReviewEn.demo.tripReviewBannerPrefix}</strong>{' '}
            {tripReviewEn.demo.tripReviewBannerText(trip.tripId)}
          </span>
          <span className="rounded bg-amber-200 px-2 py-0.5 font-bold uppercase text-[10px] text-amber-800">
            {tripReviewEn.demo.badgeLabel}
          </span>
        </div>
      )}

      {/* Trip Context Card (Stitch Banner) */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#006B5F] to-[#00152A] text-white shadow-xs">
          <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
            travel_explore
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#006B5F]">
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
              event_available
            </span>
            <span>
              {tripReviewEn.tripReview.completedOn(
                formatTripDate(trip.departureDatetime)
              )}
            </span>
          </div>
          <h2 className="truncate text-sm font-extrabold text-[#00152A] sm:text-base">
            {trip.title}
          </h2>
          <p className="truncate text-xs text-slate-500">
            {trip.tripType === 'SelfPlannedItinerary'
              ? [
                  trip.stopCount != null
                    ? tripReviewEn.tripReview.stopsCount(trip.stopCount)
                    : null,
                  trip.distanceKm != null
                    ? tripReviewEn.tripReview.distanceTravelled(trip.distanceKm)
                    : null,
                  trip.durationLabel || null,
                ]
                  .filter(Boolean)
                  .join(' • ') || tripReviewEn.tripReview.selfPlannedFallback
              : tripReviewEn.tripReview.bookedTourSummary(
                  trip.operatorName ||
                    tripReviewEn.tripReview.defaultTourTypeLabel,
                  trip.bookingCode || trip.tripId
                )}
          </p>
        </div>
      </div>

      {/* Submission Result Notice Banner */}
      {submissionResult && submissionResult.status === 'SUCCESS' ? (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-900 shadow-xs"
        >
          <span className="material-symbols-outlined mx-auto mb-2 text-[36px] text-emerald-600" aria-hidden="true">
            check_circle
          </span>
          <h3 className="text-base font-extrabold text-emerald-950">
            {tripReviewEn.tripReview.submittedTitle}
          </h3>
          <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
            {submissionResult.message}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href={isDemo ? `${ROUTES.account.trips}?demo=1` : ROUTES.account.trips}
              className="rounded-xl bg-[#006B5F] px-5 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#00574D]"
            >
              {tripReviewEn.actions.backToTrips}
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Real mode Pending Backend Banner */}
          {submissionResult && submissionResult.status === 'PENDING_BE_INTEGRATION' && (
            <div
              role="status"
              className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900 shadow-xs"
            >
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[24px] text-amber-600 shrink-0" aria-hidden="true">
                  pending_actions
                </span>
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    {tripReviewEn.tripReview.pendingSaveTitle}
                  </h4>
                  <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                    {submissionResult.message}
                  </p>
                  <p className="mt-2 text-[11px] text-amber-700">
                    {tripReviewEn.tripReview.pendingSaveHint}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {submissionResult && submissionResult.status === 'ERROR' && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800"
            >
              {submissionResult.message}
            </div>
          )}

          {/* Section 1: Overall Experience Rating (Mandatory per BR-93) */}
          <StarRatingInput
            value={rating}
            onChange={(val) => {
              setRating(val);
              if (ratingError) setRatingError(null);
            }}
            error={ratingError || undefined}
          />

          {/* Section: Review Title (Mandatory per Report 3 §3.7.2) */}
          <section aria-labelledby="title-label" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="review-title" id="title-label" className="text-sm font-extrabold text-[#00152A]">
                {tripReviewEn.tripReview.titleLabel} <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs font-semibold text-slate-400">
                {tripReviewEn.tripReview.characterCount(title.trim().length, 150)}
              </span>
            </div>

            <input
              id="review-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(null);
              }}
              placeholder={tripReviewEn.tripReview.titlePlaceholder}
              className={`w-full rounded-xl border p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20 sm:text-sm ${
                titleError
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-300 focus:border-[#006B5F]'
              }`}
            />

            {titleError && (
              <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">
                {titleError}
              </p>
            )}
          </section>

          {/* Section 2: AI CSP Route / Pacing Satisfaction (Demo Prototype Only) */}
          {isDemo && (
            <section aria-labelledby="pacing-title" className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs sm:p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 id="pacing-title" className="text-sm font-extrabold text-[#00152A] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#006B5F]" aria-hidden="true">
                      psychology
                    </span>
                    {tripReviewEn.tripReview.pacingSectionTitle}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {tripReviewEn.tripReview.pacingSectionSubtitle}
                  </p>
                </div>
                <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase shrink-0">
                  {tripReviewEn.demo.badgeLabel}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3">
                {(
                  [
                    { key: 'tight', label: tripReviewEn.tripReview.pacingOptions.tight },
                    { key: 'well_paced', label: tripReviewEn.tripReview.pacingOptions.well_paced },
                    { key: 'loose', label: tripReviewEn.tripReview.pacingOptions.loose },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setRouteSatisfaction(item.key)}
                    className={`rounded-xl py-2 px-2 text-center text-xs font-bold transition ${
                      routeSatisfaction === item.key
                        ? 'border border-[#006B5F] bg-[#E6F4F1] text-[#006B5F] shadow-2xs'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Section 3: POI Quick Feedback (Demo Prototype Only) */}
          {isDemo && trip.stopsSummary && trip.stopsSummary.length > 0 && (
            <div className="relative">
              <div className="absolute right-3 top-3 z-10 rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase">
                {tripReviewEn.demo.badgeLabel}
              </div>
              <PoiQuickFeedback
                stops={trip.stopsSummary}
                feedbacks={poiFeedbacks}
                onChange={setPoiFeedbacks}
              />
            </div>
          )}

          {/* Section 4: Detailed Review Commentary */}
          <section aria-labelledby="comment-title" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="review-comment" id="comment-title" className="text-sm font-extrabold text-[#00152A]">
                {tripReviewEn.tripReview.commentLabel} <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-xs font-semibold ${
                  isCommentTooLong ? 'text-rose-600' : 'text-[#006B5F]'
                }`}
              >
                {tripReviewEn.tripReview.characterCount(commentLength, 500)}
              </span>
            </div>

            <textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (commentError) setCommentError(null);
              }}
              placeholder={tripReviewEn.tripReview.commentPlaceholder}
              className={`w-full rounded-xl border p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20 sm:text-sm ${
                commentError
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-300 focus:border-[#006B5F]'
              }`}
            />

            {/* Live helper badge */}
            <div className="mt-2 flex items-center justify-between text-xs">
              {isCommentTooLong ? (
                <span className="text-rose-600 font-medium">
                  {tripReviewEn.tripReview.commentExceeded(commentLength - 500)}
                </span>
              ) : (
                <span className="text-slate-400">
                  {tripReviewEn.tripReview.commentMaxHint}
                </span>
              )}
            </div>

            {commentError && (
              <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">
                {commentError}
              </p>
            )}
          </section>

          {/* Section 5: Photo Upload Preview (Demo only preview; real mode truthful capability notice) */}
          {isDemo ? (
            <PhotoUploadPreview photos={photos} onChange={setPhotos} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs text-xs text-slate-500 sm:p-5">
              <div className="flex items-center gap-2 font-bold text-slate-700">
                <span className="material-symbols-outlined text-[18px] text-slate-400" aria-hidden="true">
                  photo_library
                </span>
                <span>{tripReviewEn.tripReview.photosSectionTitle}</span>
              </div>
              <p className="mt-1 text-slate-500 leading-relaxed">
                {tripReviewEn.tripReview.photosPendingNotice}
              </p>
            </div>
          )}

          {/* Section 6: Privacy Control */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={publishWithDisplayName}
                onChange={(e) => setPublishWithDisplayName(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#006B5F] focus:ring-[#006B5F]"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800">
                  {tripReviewEn.tripReview.privacyTitle}
                </span>
                <p className="mt-0.5 text-slate-500">
                  {publishWithDisplayName
                    ? tripReviewEn.tripReview.privacyPublicHint
                    : tripReviewEn.tripReview.privacyInitialsHint}
                </p>
              </div>
            </label>
          </div>

          {/* CTA Footer */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-slate-300 bg-white py-3 px-5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
            >
              {tripReviewEn.actions.cancelLater}
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-[#00152A] py-3.5 px-6 text-sm font-extrabold text-white shadow-md transition hover:bg-[#102A43] active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>{tripReviewEn.actions.submittingReview}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    send
                  </span>
                  <span>{tripReviewEn.actions.submitReview}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
