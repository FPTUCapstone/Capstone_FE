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
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#DCE2DD] bg-white px-4 py-3 text-xs"
    >
      <div className="flex flex-wrap items-center gap-2 text-[#1C2928]">
        <span className="font-bold text-[#174B4A]">
          {tripReviewEn.tripHistory.summary.completedTripsCount(summary.totalCompletedTrips)}
        </span>
        <span className="text-[#DCE2DD]" aria-hidden="true">·</span>
        <span className="inline-flex items-baseline gap-1 text-[#5B6E69]">
          <strong className="font-bold text-[#1C2928] tabular-nums">{summary.totalVisitedPois}</strong>
          <span>{tripReviewEn.tripHistory.summary.visitedPoisLabel}</span>
        </span>
      </div>

      {isDemo && (
        <span className="rounded-md bg-[#FEF3E2] px-2 py-0.5 text-[10px] font-bold text-[#8F5419]">
          {tripReviewEn.demo.badgeLabel}
        </span>
      )}
    </section>
  );
}
