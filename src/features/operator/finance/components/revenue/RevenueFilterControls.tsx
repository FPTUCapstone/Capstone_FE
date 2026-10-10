'use client';

import { useState } from 'react';
import { financeEn } from '../../resources/en';
import type {
  RevenueFilterInput,
  RevenuePeriodGranularity,
} from '../../types/revenueLifecycle';
import type { DemoTourPackage } from '../../data/operatorRevenueDemoFixtures';

interface RevenueFilterControlsProps {
  appliedFilters: RevenueFilterInput;
  tours: DemoTourPackage[];
  onApplyFilters: (newFilters: RevenueFilterInput) => void;
  onResetFilters: () => void;
  onOpenExport: () => void;
  isLoading?: boolean;
}

export function RevenueFilterControls({
  appliedFilters,
  tours,
  onApplyFilters,
  onResetFilters,
  onOpenExport,
  isLoading = false,
}: RevenueFilterControlsProps) {
  // Local draft state (CR-02)
  const [draftFilters, setDraftFilters] =
    useState<RevenueFilterInput>(appliedFilters);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Range validation: startDate <= endDate
    if (draftFilters.startDate && draftFilters.endDate) {
      if (new Date(draftFilters.startDate) > new Date(draftFilters.endDate)) {
        setValidationError(financeEn.messages.MSG29);
        return;
      }
    }

    onApplyFilters(draftFilters);
  };

  const handleReset = () => {
    setValidationError(null);
    onResetFilters();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <form onSubmit={handleApply}>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-1">
            {/* Start Date */}
            <div>
              <label
                htmlFor="revenue-start-date"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                {financeEn.revenue.filters.startDate}
              </label>
              <input
                id="revenue-start-date"
                type="date"
                value={draftFilters.startDate}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 transition-colors focus:border-[#006B5F] focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* End Date */}
            <div>
              <label
                htmlFor="revenue-end-date"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                {financeEn.revenue.filters.endDate}
              </label>
              <input
                id="revenue-end-date"
                type="date"
                value={draftFilters.endDate}
                onChange={(e) =>
                  setDraftFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 transition-colors focus:border-[#006B5F] focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Granularity */}
            <div>
              <label
                htmlFor="revenue-granularity"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                {financeEn.revenue.filters.granularity}
              </label>
              <select
                id="revenue-granularity"
                value={draftFilters.granularity}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    granularity: e.target.value as RevenuePeriodGranularity,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 transition-colors focus:border-[#006B5F] focus:bg-white focus:outline-hidden"
              >
                <option value="daily">
                  {financeEn.revenue.filters.granularityDaily}
                </option>
                <option value="weekly">
                  {financeEn.revenue.filters.granularityWeekly}
                </option>
                <option value="monthly">
                  {financeEn.revenue.filters.granularityMonthly}
                </option>
              </select>
            </div>

            {/* Tour Package */}
            <div>
              <label
                htmlFor="revenue-tour-scope"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                {financeEn.revenue.filters.tourPackage}
              </label>
              <select
                id="revenue-tour-scope"
                value={draftFilters.tourId || 'all'}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    tourId: e.target.value === 'all' ? undefined : e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 transition-colors focus:border-[#006B5F] focus:bg-white focus:outline-hidden"
              >
                <option value="all">
                  {financeEn.revenue.filters.allTours}
                </option>
                {tours.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.tourCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 lg:pt-0">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#006B5F] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#005249] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
              <span>{financeEn.revenue.filters.applyBtn}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#00152A] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>{financeEn.revenue.filters.resetBtn}</span>
            </button>

            <button
              type="button"
              onClick={onOpenExport}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#00152A] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>{financeEn.revenue.filters.exportBtn}</span>
            </button>
          </div>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div
            role="alert"
            className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700"
          >
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{validationError}</span>
          </div>
        )}
      </form>
    </div>
  );
}
