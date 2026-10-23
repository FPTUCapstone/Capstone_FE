'use client';

import { FormEvent } from 'react';

interface TourSearchBarProps {
  keyword: string;
  onKeywordChange: (val: string) => void;
  destination: string;
  onDestinationChange: (val: string) => void;
  departureDate: string;
  onDepartureDateChange: (val: string) => void;
  onSearchSubmit: (e: FormEvent) => void;
  onSelectQuickDestination: (city: string) => void;
  isLoading?: boolean;
}

const QUICK_DESTINATIONS = ['Tất cả', 'Đà Nẵng', 'Hội An', 'Huế'];

export function TourSearchBar({
  keyword,
  onKeywordChange,
  destination,
  onDestinationChange,
  departureDate,
  onDepartureDateChange,
  onSearchSubmit,
  onSelectQuickDestination,
  isLoading,
}: TourSearchBarProps) {
  return (
    <div className="relative z-20 -mt-6 mb-8 rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-lg">
      <form onSubmit={onSearchSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 items-end">
          {/* Keyword Search Input (UC-24 - D1 Dependency) */}
          <div className="lg:col-span-4">
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="tour-keyword-input"
                className="block text-xs font-bold text-slate-700"
              >
                Từ khóa tìm kiếm
              </label>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                D1: Dự lưu
              </span>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                id="tour-keyword-input"
                name="keyword"
                type="text"
                value={keyword}
                onChange={(e) => onKeywordChange(e.target.value)}
                placeholder="Tên tour, trải nghiệm..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pr-3 pl-11 text-xs font-semibold text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Destination Input (UC-24) */}
          <div className="lg:col-span-3">
            <label
              htmlFor="tour-destination-input"
              className="mb-1.5 block text-xs font-bold text-slate-700"
            >
              Điểm đến / Khu vực
            </label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 text-lg">
                location_on
              </span>
              <input
                id="tour-destination-input"
                name="destination"
                type="text"
                value={destination}
                onChange={(e) => onDestinationChange(e.target.value)}
                placeholder="VD: Hội An, Đà Nẵng..."
                maxLength={300}
                className="w-full rounded-xl border border-slate-200 py-2.5 pr-3 pl-11 text-xs font-semibold text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Departure Date Input (UC-24) */}
          <div className="lg:col-span-3">
            <label
              htmlFor="tour-departure-date-input"
              className="mb-1.5 block text-xs font-bold text-slate-700"
            >
              Ngày khởi hành
            </label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 text-lg">
                calendar_today
              </span>
              <input
                id="tour-departure-date-input"
                name="departureDate"
                type="date"
                value={departureDate}
                onChange={(e) => onDepartureDateChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pr-3 pl-11 text-xs font-semibold text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Submit Search Button */}
          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#007d6e] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#006b5f] disabled:cursor-wait disabled:opacity-70 h-[38px]"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              <span>{isLoading ? 'Đang tìm…' : 'Tìm kiếm tour'}</span>
            </button>
          </div>
        </div>

        {/* Quick Destination Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-teal-600">near_me</span>
            <span>Điểm đến phổ biến:</span>
          </span>
          {QUICK_DESTINATIONS.map((city) => {
            const active =
              (city === 'Tất cả' && !destination) ||
              destination.toLowerCase() === city.toLowerCase();
            return (
              <button
                key={city}
                type="button"
                onClick={() => onSelectQuickDestination(city)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>
      </form>
    </div>
  );
}
