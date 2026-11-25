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
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#DCE2DD] bg-white px-5 py-4 shadow-xs"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#174B4A]">
            {tripReviewEn.tripHistory.summary.headingBadge}
          </span>
          {isDemo && (
            <span className="rounded-full border border-[#F2D8B3] bg-[#FBF3E8] px-2 py-0.5 text-[10px] font-bold text-[#8F5419]">
              {tripReviewEn.demo.badgeLabel}
            </span>
          )}
        </div>
        <h2 className="mt-1 text-lg font-extrabold tracking-tight text-[#1C2928] sm:text-xl">
          {tripReviewEn.tripHistory.summary.completedTripsCount(summary.totalCompletedTrips)}
        </h2>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-[#D0DFD6] bg-[#E8F0EA]/70 px-4 py-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#174B4A] shadow-2xs">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            pin_drop
          </span>
        </span>
        <div>
          <p className="text-xl font-black leading-none text-[#103B39] tabular-nums">{summary.totalVisitedPois}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-[#5B6E69]">
            {tripReviewEn.tripHistory.summary.visitedPoisLabel}
          </p>
        </div>
      </div>
    </section>
  );
}
