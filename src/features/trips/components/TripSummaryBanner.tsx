'use client';

import React from 'react';
import { tripReviewEn } from '../resources/en';
import type { TripSummary } from '../types/tripHistoryContract';

interface TripSummaryBannerProps {
  summary: TripSummary;
  isDemo?: boolean;
}

/** The two figures TM-78 returns for the Completed tab; nothing else is shown or derived. */
export function TripSummaryBanner({ summary, isDemo }: TripSummaryBannerProps) {
  return (
    <section
      aria-label={tripReviewEn.accessibility.tripSummaryAria}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#00152A] via-[#0F2942] to-[#102A43] p-5 text-white shadow-md sm:p-6"
    >
      <div className="pointer-events-none absolute -bottom-8 -right-8 h-36 w-36 rounded-full bg-[#006B5F]/20 blur-2xl" />

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#38BDF8]">
              {tripReviewEn.tripHistory.summary.headingBadge}
            </span>
            {isDemo && (
              <span className="rounded border border-amber-300/30 bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                {tripReviewEn.demo.badgeLabel}
              </span>
            )}
          </div>
          <h2 className="mt-1 text-lg font-extrabold text-white sm:text-xl">
            {tripReviewEn.tripHistory.summary.completedTripsCount(summary.totalCompletedTrips)}
          </h2>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 text-center">
        <p className="text-xl font-black text-[#5EEAD4] sm:text-2xl">{summary.totalVisitedPois}</p>
        <p className="text-[11px] font-medium text-slate-300">
          {tripReviewEn.tripHistory.summary.visitedPoisLabel}
        </p>
      </div>
    </section>
  );
}
