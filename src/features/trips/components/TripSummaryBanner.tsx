'use client';

import React from 'react';
import { tripReviewEn } from '../resources/en';
import type { TripSummaryStatsDto } from '../types/tripHistory';

interface TripSummaryBannerProps {
  summary?: TripSummaryStatsDto;
  isDemo?: boolean;
}

export function TripSummaryBanner({ summary, isDemo }: TripSummaryBannerProps) {
  if (!summary) return null;

  return (
    <section
      aria-label={tripReviewEn.accessibility.tripSummaryAria}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#00152A] via-[#0F2942] to-[#102A43] p-5 text-white shadow-md sm:p-6"
    >
      <div className="pointer-events-none absolute -bottom-8 -right-8 h-36 w-36 rounded-full bg-[#006B5F]/20 blur-2xl" />

      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#38BDF8]">
              {tripReviewEn.tripHistory.summary.headingBadge}
            </span>
            {isDemo && (
              <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-300/30">
                {tripReviewEn.demo.badgeLabel}
              </span>
            )}
          </div>
          <h2 className="mt-1 text-lg font-extrabold text-white sm:text-xl">
            {tripReviewEn.tripHistory.summary.completedTripsCount(
              summary.totalCompletedTrips
            )}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4 sm:grid-cols-4 sm:gap-4 text-center">
        {summary.totalDistanceKm !== undefined && (
          <div className="p-1">
            <p className="text-xl font-black text-white sm:text-2xl">
              {summary.totalDistanceKm}{' '}
              <span className="text-xs font-normal text-slate-300">
                {tripReviewEn.tripHistory.summary.distanceUnit}
              </span>
            </p>
            <p className="text-[11px] font-medium text-slate-300">
              {tripReviewEn.tripHistory.summary.distanceLabel}
            </p>
          </div>
        )}

        {summary.totalVisitedPois !== undefined && (
          <div className="border-l border-white/10 p-1">
            <p className="text-xl font-black text-[#5EEAD4] sm:text-2xl">
              {summary.totalVisitedPois}
            </p>
            <p className="text-[11px] font-medium text-slate-300">
              {tripReviewEn.tripHistory.summary.visitedPoisLabel}
            </p>
          </div>
        )}

        {isDemo && summary.cspMatchRate !== undefined && (
          <div className="border-l-0 sm:border-l border-white/10 p-1">
            <p className="text-xl font-black text-amber-300 sm:text-2xl">
              {summary.cspMatchRate}%
            </p>
            <p className="text-[11px] font-medium text-slate-300">
              {tripReviewEn.tripHistory.summary.cspMatchRateLabel}
            </p>
          </div>
        )}

        {summary.averageRating !== undefined && (
          <div className="border-l border-white/10 p-1">
            <p className="text-xl font-black text-amber-400 sm:text-2xl">
              {summary.averageRating.toFixed(1)} ★
            </p>
            <p className="text-[11px] font-medium text-slate-300">
              {tripReviewEn.tripHistory.summary.averageRatingLabel}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
