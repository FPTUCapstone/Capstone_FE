'use client';

import React, { useState } from 'react';
import { tripReviewEn } from '../resources/en';
import type { TripTypeFilter } from '../types/tripHistoryContract';

interface TripFiltersBarProps {
  tripType: TripTypeFilter;
  onTripTypeChange: (type: TripTypeFilter) => void;
  fromDate: string;
  toDate: string;
  onDateRangeChange: (from: string, to: string) => void;
}

const INPUT_CLASS =
  'rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:border-[#006B5F] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20';

/**
 * Trip-type and date-range filters. The backend has no free-text search, so there is none here.
 * `yyyy-MM-dd` strings compare correctly as text, so the range check needs no time zone.
 */
export function TripFiltersBar({
  tripType,
  onTripTypeChange,
  fromDate,
  toDate,
  onDateRangeChange,
}: TripFiltersBarProps) {
  const [dateError, setDateError] = useState<string | null>(null);

  const changeRange = (from: string, to: string) => {
    if (from && to && from > to) {
      setDateError(tripReviewEn.validation.invalidDateRange);
      return;
    }
    setDateError(null);
    onDateRangeChange(from, to);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="trip-type-filter" className="sr-only">
            {tripReviewEn.accessibility.tripTypeFilterLabel}
          </label>
          <select
            id="trip-type-filter"
            value={tripType}
            onChange={(e) => onTripTypeChange(e.target.value as TripTypeFilter)}
            className={`w-full px-3 py-2 font-semibold ${INPUT_CLASS}`}
          >
            <option value="All">{tripReviewEn.tripHistory.filters.allTypes}</option>
            <option value="TourBooking">{tripReviewEn.tripHistory.filters.tourBooking}</option>
            <option value="SelfPlannedItinerary">
              {tripReviewEn.tripHistory.filters.selfPlannedItinerary}
            </option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label={tripReviewEn.accessibility.fromDateAria}
            value={fromDate}
            onChange={(e) => changeRange(e.target.value, toDate)}
            className={`w-1/2 px-2.5 py-1.5 ${INPUT_CLASS}`}
          />
          <span className="text-xs text-slate-400">-</span>
          <input
            type="date"
            aria-label={tripReviewEn.accessibility.toDateAria}
            value={toDate}
            onChange={(e) => changeRange(fromDate, e.target.value)}
            className={`w-1/2 px-2.5 py-1.5 ${INPUT_CLASS}`}
          />
        </div>
      </div>

      {dateError && (
        <p role="alert" className="text-xs font-medium text-rose-600">
          {dateError}
        </p>
      )}
    </div>
  );
}
