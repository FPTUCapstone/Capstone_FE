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
  'rounded-lg border border-[#DCE2DD] bg-[#F7F5EF]/60 text-xs text-[#1C2928] transition focus:border-[#174B4A] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#174B4A]/15';

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
    <div className="space-y-2.5 rounded-2xl border border-[#DCE2DD] bg-white px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="trip-type-filter" className="text-xs font-medium text-[#5B6E69]">
            <span className="sr-only">{tripReviewEn.accessibility.tripTypeFilterLabel}</span>
            <span aria-hidden="true">{tripReviewEn.tripHistory.filters.typePrefix}:</span>
          </label>
          <select
            id="trip-type-filter"
            aria-label={tripReviewEn.accessibility.tripTypeFilterLabel}
            value={tripType}
            onChange={(e) => onTripTypeChange(e.target.value as TripTypeFilter)}
            className={`px-3 py-1.5 font-semibold ${INPUT_CLASS}`}
          >
            <option value="All">{tripReviewEn.tripHistory.filters.allTypes}</option>
            <option value="TourBooking">{tripReviewEn.tripHistory.filters.tourBooking}</option>
            <option value="SelfPlannedItinerary">
              {tripReviewEn.tripHistory.filters.selfPlannedItinerary}
            </option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[#5B6E69]">
          <span>{tripReviewEn.tripHistory.filters.fromLabel}</span>
          <input
            type="date"
            aria-label={tripReviewEn.accessibility.fromDateAria}
            value={fromDate}
            onChange={(e) => changeRange(e.target.value, toDate)}
            className={`px-2.5 py-1.5 ${INPUT_CLASS}`}
          />
          <span>{tripReviewEn.tripHistory.filters.toLabel}</span>
          <input
            type="date"
            aria-label={tripReviewEn.accessibility.toDateAria}
            value={toDate}
            onChange={(e) => changeRange(fromDate, e.target.value)}
            className={`px-2.5 py-1.5 ${INPUT_CLASS}`}
          />
        </div>
      </div>

      {dateError && (
        <p role="alert" className="text-xs font-medium text-[#8C1030]">
          {dateError}
        </p>
      )}
    </div>
  );
}
