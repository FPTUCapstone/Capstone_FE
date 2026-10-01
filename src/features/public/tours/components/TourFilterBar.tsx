import { FormEvent, useState } from 'react';

import type { TourSearchState } from '../types/tour';
import { validateTourFilters } from '../utils/tourQuery';

interface TourFilterBarProps {
  filters: TourSearchState;
  onApplyFilters: (patch: Partial<TourSearchState>) => void;
  onResetFilters: () => void;
  isLoading?: boolean;
}

const QUICK_DESTINATIONS = ['Tất cả', 'Đà Nẵng', 'Hội An', 'Huế'];

export function TourFilterBar({
  filters,
  onApplyFilters,
  onResetFilters,
  isLoading,
}: TourFilterBarProps) {
  const [prevFilters, setPrevFilters] = useState(filters);
  const [destination, setDestination] = useState(filters.destination);
  const [departureDate, setDepartureDate] = useState(filters.departureDate);
  const [minPrice, setMinPrice] = useState(filters.minPrice);
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync state during render if filters change externally (e.g. browser back/forward or reset)
  if (filters !== prevFilters) {
    setPrevFilters(filters);
    setDestination(filters.destination);
    setDepartureDate(filters.departureDate);
    setMinPrice(filters.minPrice);
    setMaxPrice(filters.maxPrice);
    setValidationError(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const candidateState: TourSearchState = {
      ...filters,
      destination: destination.trim(),
      departureDate: departureDate.trim(),
      minPrice: minPrice.trim(),
      maxPrice: maxPrice.trim(),
      page: 1, // Reset to page 1 on new filter apply
    };

    const validation = validateTourFilters(candidateState);
    if (!validation.isValid) {
      setValidationError(validation.errorMessage ?? 'Bộ lọc không hợp lệ.');
      return;
    }

    setValidationError(null);
    onApplyFilters({
      destination: candidateState.destination,
      departureDate: candidateState.departureDate,
      minPrice: candidateState.minPrice,
      maxPrice: candidateState.maxPrice,
      page: 1,
    });
  }

  function handleSelectQuickDestination(city: string) {
    const val = city === 'Tất cả' ? '' : city;
    setDestination(val);
    onApplyFilters({ destination: val, page: 1 });
  }

  function handleQuickPrice(min: string, max: string) {
    setMinPrice(min);
    setMaxPrice(max);
    onApplyFilters({ minPrice: min, maxPrice: max, page: 1 });
  }

  const hasActiveFilters = Boolean(
    filters.destination || filters.departureDate || filters.minPrice || filters.maxPrice,
  );

  return (
    <section
      aria-label="Bộ lọc tìm kiếm tour"
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6 mb-8"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Destination input */}
          <div>
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
                onChange={(e) => setDestination(e.target.value)}
                placeholder="VD: Hội An, Đà Nẵng..."
                maxLength={300}
                className="w-full rounded-xl border border-slate-200 py-2.5 pr-3 pl-9 text-xs font-semibold text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Departure Date input */}
          <div>
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
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pr-3 pl-9 text-xs font-semibold text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Min Price input */}
          <div>
            <label
              htmlFor="tour-min-price-input"
              className="mb-1.5 block text-xs font-bold text-slate-700"
            >
              Giá tối thiểu (VNĐ)
            </label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 text-lg">
                payments
              </span>
              <input
                id="tour-min-price-input"
                name="minPrice"
                type="number"
                min={0}
                step={50000}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="VD: 500000"
                className="w-full rounded-xl border border-slate-200 py-2.5 pr-3 pl-9 text-xs font-semibold text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Max Price input */}
          <div>
            <label
              htmlFor="tour-max-price-input"
              className="mb-1.5 block text-xs font-bold text-slate-700"
            >
              Giá tối đa (VNĐ)
            </label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 text-lg">
                payments
              </span>
              <input
                id="tour-max-price-input"
                name="maxPrice"
                type="number"
                min={0}
                step={50000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="VD: 2000000"
                className="w-full rounded-xl border border-slate-200 py-2.5 pr-3 pl-9 text-xs font-semibold text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Validation error message */}
        {validationError && (
          <div
            role="alert"
            className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700"
          >
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>{validationError}</span>
          </div>
        )}

        {/* Quick filters & actions row */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          {/* Quick Destination and Price Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Điểm đến hot:</span>
            {QUICK_DESTINATIONS.map((city) => {
              const active =
                (city === 'Tất cả' && !destination) ||
                destination.toLowerCase() === city.toLowerCase();
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleSelectQuickDestination(city)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {city}
                </button>
              );
            })}

            <span className="mx-2 hidden h-4 w-px bg-slate-200 sm:inline-block" />

            <span className="text-[11px] font-bold text-slate-500 mr-1">Mức giá:</span>
            <button
              type="button"
              onClick={() => handleQuickPrice('0', '1000000')}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-200 cursor-pointer"
            >
              &lt; 1 triệu
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrice('1000000', '3000000')}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-200 cursor-pointer"
            >
              1 - 3 triệu
            </button>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-xs transition hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                <span>Xóa bộ lọc</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#007d6e] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#006b5f] disabled:cursor-wait disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              <span>{isLoading ? 'Đang tìm…' : 'Tìm kiếm tour'}</span>
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
