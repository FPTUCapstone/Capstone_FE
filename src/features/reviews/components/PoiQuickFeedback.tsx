'use client';

import React from 'react';
import { tripReviewEn } from '@/features/trips/resources/en';
import type { PoiReviewFeedback } from '../types/review';

interface PoiQuickFeedbackProps {
  stops: string[];
  feedbacks: PoiReviewFeedback[];
  onChange: (feedbacks: PoiReviewFeedback[]) => void;
}

export function PoiQuickFeedback({ stops, feedbacks, onChange }: PoiQuickFeedbackProps) {
  if (!stops || stops.length === 0) return null;

  const handleToggle = (stopName: string, isLiked: boolean) => {
    const existingIndex = feedbacks.findIndex((f) => f.poiName === stopName);
    if (existingIndex >= 0) {
      const existing = feedbacks[existingIndex];
      if (existing.liked === isLiked) {
        // Toggle off
        onChange(feedbacks.filter((f) => f.poiName !== stopName));
      } else {
        // Change vote
        const updated = [...feedbacks];
        updated[existingIndex] = { ...existing, liked: isLiked };
        onChange(updated);
      }
    } else {
      onChange([...feedbacks, { poiId: stopName, poiName: stopName, liked: isLiked }]);
    }
  };

  return (
    <section aria-labelledby="poi-feedback-title" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 id="poi-feedback-title" className="text-sm font-extrabold text-[#00152A] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#006B5F]" aria-hidden="true">
              location_on
            </span>
            {tripReviewEn.tripReview.poiFeedbackTitle}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {tripReviewEn.tripReview.poiFeedbackSubtitle}
          </p>
        </div>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 shrink-0">
          {tripReviewEn.tripReview.optionalBadge}
        </span>
      </div>

      <div className="space-y-2.5 mt-3">
        {stops.map((stop) => {
          const fb = feedbacks.find((f) => f.poiName === stop);
          const isLiked = fb?.liked === true;
          const isDisliked = fb?.liked === false;

          return (
            <div
              key={stop}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    landscape
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{stop}</h4>
                  <p className="text-[11px] text-slate-500">
                    {tripReviewEn.tripReview.poiStopSubtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label={tripReviewEn.accessibility.likeStopAria(stop)}
                  aria-pressed={isLiked}
                  onClick={() => handleToggle(stop, true)}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-bold transition active:scale-95 ${
                    isLiked
                      ? 'border border-emerald-300 bg-emerald-100 text-emerald-800 shadow-2xs'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                    thumb_up
                  </span>
                  <span>{tripReviewEn.actions.like}</span>
                </button>

                <button
                  type="button"
                  aria-label={tripReviewEn.accessibility.dislikeStopAria(stop)}
                  aria-pressed={isDisliked}
                  onClick={() => handleToggle(stop, false)}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium transition active:scale-95 ${
                    isDisliked
                      ? 'border border-rose-300 bg-rose-100 text-rose-800 shadow-2xs'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                    thumb_down
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
