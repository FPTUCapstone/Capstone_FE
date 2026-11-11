'use client';

import type { AnalyticsKPICard } from '@/features/admin/shared/mock/analyticsData';

interface AnalyticsKPICardGroupProps {
  cards: AnalyticsKPICard[];
  ariaLabel?: string;
}

export function AnalyticsKPICardGroup({
  cards,
  ariaLabel = 'Key Performance Indicators',
}: AnalyticsKPICardGroupProps) {
  return (
    <section aria-label={ariaLabel} className="mb-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.id}
            className="flex flex-col justify-between rounded-2xl border border-[#DCE2DD] bg-[#FFFFFF] p-4 shadow-xs transition hover:border-[#5B6E69] hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5B6E69]">
                {card.label}
              </span>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8F0EA] text-[#174B4A]"
                aria-hidden="true"
              >
                <span className="material-symbols-outlined text-[18px]">{card.icon}</span>
              </span>
            </div>

            <div className="mt-3">
              <div className="text-xl font-extrabold tracking-tight text-[#1C2928] sm:text-2xl">
                {card.value}
              </div>

              <div className="mt-1 flex items-center justify-between text-xs text-[#5B6E69]">
                <span className="truncate">{card.helperText}</span>
                {card.trend && (
                  <span
                    className={`inline-flex shrink-0 items-center font-bold font-mono text-[11px] ${
                      card.trend.isPositive ? 'text-[#1B5E3C]' : 'text-[#B96D4C]'
                    }`}
                  >
                    {card.trend.value}
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
