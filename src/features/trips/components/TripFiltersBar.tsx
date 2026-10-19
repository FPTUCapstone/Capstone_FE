'use client';

import React, { useState } from 'react';
import { tripReviewEn } from '../resources/en';

interface TripFiltersBarProps {
  tripType: 'ALL' | 'TourBooking' | 'SelfPlannedItinerary';
  onTripTypeChange: (type: 'ALL' | 'TourBooking' | 'SelfPlannedItinerary') => void;
  searchQuery: string;
  onSearchSubmit: (query: string) => void;
  fromDate: string;
  toDate: string;
  onDateRangeChange: (from: string, to: string) => void;
}

export function TripFiltersBar({
  tripType,
  onTripTypeChange,
  searchQuery,
  onSearchSubmit,
  fromDate,
  toDate,
  onDateRangeChange,
}: TripFiltersBarProps) {
  const [draftSearch, setDraftSearch] = useState(searchQuery);
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [dateError, setDateError] = useState<string | null>(null);

  if (searchQuery !== prevSearchQuery) {
    setPrevSearchQuery(searchQuery);
    setDraftSearch(searchQuery);
  }

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSearchSubmit(draftSearch.trim());
  };

  const handleFromDateChange = (newFrom: string) => {
    if (toDate && newFrom && new Date(newFrom).getTime() > new Date(toDate).getTime()) {
      setDateError(tripReviewEn.validation.invalidDateRange);
    } else {
      setDateError(null);
      onDateRangeChange(newFrom, toDate);
    }
  };

  const handleToDateChange = (newTo: string) => {
    if (fromDate && newTo && new Date(fromDate).getTime() > new Date(newTo).getTime()) {
      setDateError(tripReviewEn.validation.invalidDateRange);
    } else {
      setDateError(null);
      onDateRangeChange(fromDate, newTo);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Search input with submit semantics per CR-02 */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <label htmlFor="trip-search" className="sr-only">
            {tripReviewEn.accessibility.searchTripsLabel}
          </label>
          <span
            className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400"
            aria-hidden="true"
          >
            search
          </span>
          <input
            id="trip-search"
            type="search"
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
            placeholder={tripReviewEn.tripHistory.filters.searchPlaceholder}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-14 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#006B5F] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20"
          />
          <button
            type="submit"
            className="absolute right-1.5 rounded-lg bg-[#006B5F] px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-[#00574D] active:scale-95"
            aria-label={tripReviewEn.accessibility.searchButtonAria}
          >
            {tripReviewEn.actions.search}
          </button>
        </form>

        {/* Trip type selector */}
        <div>
          <label htmlFor="trip-type-filter" className="sr-only">
            {tripReviewEn.accessibility.tripTypeFilterLabel}
          </label>
          <select
            id="trip-type-filter"
            value={tripType}
            onChange={(e) =>
              onTripTypeChange(e.target.value as 'ALL' | 'TourBooking' | 'SelfPlannedItinerary')
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#006B5F] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20"
          >
            <option value="ALL">{tripReviewEn.tripHistory.filters.allTypes}</option>
            <option value="TourBooking">{tripReviewEn.tripHistory.filters.tourBooking}</option>
            <option value="SelfPlannedItinerary">
              {tripReviewEn.tripHistory.filters.selfPlannedItinerary}
            </option>
          </select>
        </div>

        {/* Date range inputs */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label={tripReviewEn.accessibility.fromDateAria}
            value={fromDate}
            onChange={(e) => handleFromDateChange(e.target.value)}
            className="w-1/2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#006B5F] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20"
          />
          <span className="text-xs text-slate-400">-</span>
          <input
            type="date"
            aria-label={tripReviewEn.accessibility.toDateAria}
            value={toDate}
            onChange={(e) => handleToDateChange(e.target.value)}
            className="w-1/2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#006B5F] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20"
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
