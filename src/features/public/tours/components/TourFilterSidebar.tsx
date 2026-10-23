'use client';

import { FormEvent } from 'react';

interface TourFilterSidebarProps {
  destination: string;
  onDestinationChange: (val: string) => void;
  departureDate: string;
  onDepartureDateChange: (val: string) => void;
  minPrice: string;
  onMinPriceChange: (val: string) => void;
  maxPrice: string;
  onMaxPriceChange: (val: string) => void;
  onApplyFilters: (e?: FormEvent) => void;
  onResetFilters: () => void;
  validationError?: string | null;
  isLoading?: boolean;
  hasActiveFilters?: boolean;
}

export function TourFilterSidebar({
  destination,
  onDestinationChange,
  departureDate,
  onDepartureDateChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  onApplyFilters,
  onResetFilters,
  validationError,
  isLoading,
  hasActiveFilters,
}: TourFilterSidebarProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onApplyFilters(e);
  }

  function handleQuickPrice(min: string, max: string) {
    onMinPriceChange(min);
    onMaxPriceChange(max);
  }

  return (
    <aside
      aria-label="Bộ lọc tìm kiếm tour"
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-1.5 font-black text-sm text-[#00152a]">
          <span className="material-symbols-outlined text-lg text-[#007d6e]">tune</span>
          <span>Bộ Lọc Tìm Kiếm</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Validation error message (MSG29) */}
        {validationError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700"
          >
            <span className="material-symbols-outlined text-sm mt-0.5">warning</span>
            <span>{validationError}</span>
          </div>
        )}

        {/* Group 1: Điểm đến */}
        <div>
          <label
            htmlFor="sidebar-destination-input"
            className="mb-1.5 block text-xs font-bold text-slate-800"
          >
            1. Điểm đến
          </label>
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 text-lg">
              location_on
            </span>
            <input
              id="sidebar-destination-input"
              name="sidebarDestination"
              type="text"
              value={destination}
              onChange={(e) => onDestinationChange(e.target.value)}
              placeholder="Hội An, Đà Nẵng, Huế..."
              maxLength={300}
              className="w-full rounded-xl border border-slate-200 py-2.5 pr-3 pl-11 text-xs font-semibold text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Group 2: Ngày khởi hành */}
        <div>
          <label
            htmlFor="sidebar-departure-date-input"
            className="mb-1.5 block text-xs font-bold text-slate-800"
          >
            2. Ngày khởi hành
          </label>
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 text-lg">
              calendar_today
            </span>
            <input
              id="sidebar-departure-date-input"
              name="sidebarDepartureDate"
              type="date"
              value={departureDate}
              onChange={(e) => onDepartureDateChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2.5 pr-3 pl-11 text-xs font-semibold text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Group 3: Mức giá (VNĐ) */}
        <div>
          <span className="mb-1.5 block text-xs font-bold text-slate-800">
            3. Khoảng giá (VNĐ)
          </span>

          <div className="space-y-2">
            <div>
              <label
                htmlFor="tour-min-price-input"
                className="mb-1 block text-[11px] font-medium text-slate-500"
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
                  onChange={(e) => onMinPriceChange(e.target.value)}
                  placeholder="VD: 500000"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pr-3 pl-11 text-xs font-semibold text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="tour-max-price-input"
                className="mb-1 block text-[11px] font-medium text-slate-500"
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
                  onChange={(e) => onMaxPriceChange(e.target.value)}
                  placeholder="VD: 2000000"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pr-3 pl-11 text-xs font-semibold text-slate-900 transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Quick Price Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleQuickPrice('0', '1000000')}
                className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                &lt; 1 tr
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrice('1000000', '3000000')}
                className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                1 - 3 tr
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrice('3000000', '')}
                className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                &gt; 3 tr
              </button>
            </div>
          </div>
        </div>

        {/* Group 4: Thời lượng tour (D1 Dependency) */}
        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="block text-xs font-bold text-slate-700">
              4. Thời lượng tour
            </span>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              D1: Chờ BE
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-400 opacity-60">
            {['Tất cả thời lượng', 'Trong ngày (1 ngày)', '2 ngày 1 đêm', '3 ngày 2 đêm'].map(
              (dur) => (
                <label key={dur} className="flex items-center gap-2 cursor-not-allowed">
                  <input type="radio" disabled name="mock-duration" className="cursor-not-allowed" />
                  <span>{dur}</span>
                </label>
              ),
            )}
          </div>
        </div>

        {/* Group 5: Danh mục tour (D1 Dependency) */}
        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="block text-xs font-bold text-slate-700">
              5. Danh mục tour
            </span>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              D1: Chờ BE
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs text-slate-400 opacity-60">
            {['Văn hóa di sản', 'Sinh thái', 'Ẩm thực', 'Nghỉ dưỡng'].map((cat) => (
              <span
                key={cat}
                className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold cursor-not-allowed"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Group 6: Đánh giá tối thiểu (D1 Dependency) */}
        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="block text-xs font-bold text-slate-700">
              6. Đánh giá tối thiểu
            </span>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              D1: Chờ BE
            </span>
          </div>
          <div className="space-y-1 text-xs text-slate-400 opacity-60">
            {['★ 4.5 trở lên', '★ 4.0 trở lên', '★ 3.5 trở lên'].map((r) => (
              <label key={r} className="flex items-center gap-2 cursor-not-allowed">
                <input type="radio" disabled name="mock-rating" className="cursor-not-allowed" />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-100 pt-4 space-y-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#007d6e] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#006b5f] disabled:cursor-wait disabled:opacity-70"
          >
            <span className="material-symbols-outlined text-sm">filter_alt</span>
            <span>{isLoading ? 'Đang lọc…' : 'Áp dụng bộ lọc'}</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="w-full inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>
      </form>
    </aside>
  );
}
