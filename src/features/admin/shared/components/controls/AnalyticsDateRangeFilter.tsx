'use client';

import type { AnalyticsTimeRange } from '@/features/admin/shared/types/analytics';

interface AnalyticsDateRangeFilterProps {
  value: AnalyticsTimeRange;
  onChange: (val: AnalyticsTimeRange) => void;
  ariaLabel?: string;
  disabled?: boolean;
}

export function AnalyticsDateRangeFilter({
  value,
  onChange,
  ariaLabel = 'Date range filter',
  disabled = false,
}: AnalyticsDateRangeFilterProps) {
  const options: { id: AnalyticsTimeRange; label: string; fullLabel: string }[] = [
    { id: '7D', label: '7D', fullLabel: 'Last 7 Days' },
    { id: '30D', label: '30D', fullLabel: 'Last 30 Days' },
    { id: '90D', label: '90D', fullLabel: 'Last 90 Days' },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className={`inline-flex rounded-xl bg-[#F7F6F2] p-1 border border-[#E6E4DD] ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      {options.map((opt) => {
        const isSelected = value === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            disabled={disabled}
            aria-checked={isSelected}
            title={disabled ? 'Time filter disabled: data source not connected' : opt.fullLabel}
            onClick={() => !disabled && onChange(opt.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              disabled
                ? isSelected
                  ? 'bg-[#74827B] text-white cursor-not-allowed'
                  : 'text-[#74827B] cursor-not-allowed'
                : isSelected
                ? 'bg-[#245747] text-white shadow-xs cursor-pointer'
                : 'text-[#4A5851] hover:text-[#1C2923] hover:bg-[#FFFFFF] cursor-pointer'
            }`}
          >
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
