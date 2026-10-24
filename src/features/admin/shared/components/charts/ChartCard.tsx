'use client';

import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  timeRange?: '7D' | '30D' | '90D';
  onTimeRangeChange?: (range: '7D' | '30D' | '90D') => void;
  badgeLabel?: string;
  children: ReactNode;
  ariaLabel?: string;
}

export function ChartCard({
  title,
  subtitle,
  timeRange,
  onTimeRangeChange,
  badgeLabel = 'Preview Analytics',
  children,
  ariaLabel,
}: ChartCardProps) {
  return (
    <section
      aria-label={ariaLabel ?? title}
      className="flex flex-col justify-between rounded-2xl border border-[#E6E4DD] bg-[#FFFFFF] p-5 shadow-xs transition hover:shadow-sm"
    >
      <header className="mb-4 flex flex-col justify-between gap-2.5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#1C2923]">{title}</h3>
            {badgeLabel ? (
              <span className="inline-flex items-center rounded-full bg-[#E8EFEA] px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#245747] uppercase border border-[#D0DFD6]">
                {badgeLabel}
              </span>
            ) : null}
          </div>
          {subtitle ? <p className="mt-0.5 text-xs text-[#758B74]">{subtitle}</p> : null}
        </div>

        {timeRange && onTimeRangeChange ? (
          <div
            role="radiogroup"
            aria-label={`Time range for ${title}`}
            className="inline-flex rounded-xl bg-[#F7F6F2] p-1 border border-[#E6E4DD] self-start sm:self-auto"
          >
            {(['7D', '30D', '90D'] as const).map((range) => {
              const active = timeRange === range;
              return (
                <button
                  key={range}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onTimeRangeChange(range)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                    active
                      ? 'bg-[#245747] text-white shadow-2xs'
                      : 'text-[#1C2923]/70 hover:text-[#1C2923]'
                  }`}
                >
                  {range}
                </button>
              );
            })}
          </div>
        ) : null}
      </header>

      <div className="w-full flex-1 min-h-[220px]">{children}</div>
    </section>
  );
}
