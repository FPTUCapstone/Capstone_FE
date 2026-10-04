'use client';

import React, { useState } from 'react';

interface TripFiltersBarProps {
  tripType: 'ALL' | 'TourBooking' | 'SelfPlannedItinerary';
  onTripTypeChange: (type: 'ALL' | 'TourBooking' | 'SelfPlannedItinerary') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  fromDate: string;
  toDate: string;
  onDateRangeChange: (from: string, to: string) => void;
}

export function TripFiltersBar({
  tripType,
  onTripTypeChange,
  searchQuery,
  onSearchChange,
  fromDate,
  toDate,
  onDateRangeChange,
}: TripFiltersBarProps) {
  const [dateError, setDateError] = useState<string | null>(null);

  const handleFromDateChange = (newFrom: string) => {
    if (toDate && newFrom && new Date(newFrom).getTime() > new Date(toDate).getTime()) {
      setDateError('Khoảng thời gian không hợp lệ. Ngày bắt đầu phải trước ngày kết thúc (MSG29).');
    } else {
      setDateError(null);
      onDateRangeChange(newFrom, toDate);
    }
  };

  const handleToDateChange = (newTo: string) => {
    if (fromDate && newTo && new Date(fromDate).getTime() > new Date(newTo).getTime()) {
      setDateError('Khoảng thời gian không hợp lệ. Ngày bắt đầu phải trước ngày kết thúc (MSG29).');
    } else {
      setDateError(null);
      onDateRangeChange(fromDate, newTo);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Search input */}
        <div className="relative">
          <label htmlFor="trip-search" className="sr-only">
            Tìm kiếm chuyến đi
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
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên tour, điểm đến, mã đặt..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#006B5F] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20"
          />
        </div>

        {/* Trip type selector */}
        <div>
          <label htmlFor="trip-type-filter" className="sr-only">
            Hình thức chuyến đi
          </label>
          <select
            id="trip-type-filter"
            value={tripType}
            onChange={(e) =>
              onTripTypeChange(e.target.value as 'ALL' | 'TourBooking' | 'SelfPlannedItinerary')
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#006B5F] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20"
          >
            <option value="ALL">Tất cả hình thức</option>
            <option value="TourBooking">Tour bản địa</option>
            <option value="SelfPlannedItinerary">Lộ trình tự lập</option>
          </select>
        </div>

        {/* Date range inputs */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label="Từ ngày"
            value={fromDate}
            onChange={(e) => handleFromDateChange(e.target.value)}
            className="w-1/2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#006B5F] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20"
          />
          <span className="text-xs text-slate-400">-</span>
          <input
            type="date"
            aria-label="Đến ngày"
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
