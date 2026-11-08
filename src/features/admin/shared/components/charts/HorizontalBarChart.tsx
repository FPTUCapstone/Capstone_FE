'use client';

import { useState } from 'react';
import type { CategoryMetric } from '../../mock/analyticsData';

interface HorizontalBarChartProps {
  categories: CategoryMetric[];
  barColor?: string;
  activeColor?: string;
}

export function HorizontalBarChart({
  categories,
  barColor = '#174B4A',
  activeColor = '#1C2928',
}: HorizontalBarChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {categories.map((cat) => {
        const isHovered = hoveredId === cat.id;
        return (
          <div
            key={cat.id}
            onMouseEnter={() => setHoveredId(cat.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="group rounded-xl p-2 transition hover:bg-[#F7F5EF]/70 cursor-pointer"
          >
            {/* Top row: Title and Values */}
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1C2928]">{cat.name}</span>
                {cat.secondaryLabel ? (
                  <span className="text-[11px] text-[#5B6E69]">({cat.secondaryLabel})</span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-[#1C2928]">{cat.formattedValue}</span>
                <span className="rounded-md bg-[#E8F0EA] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#174B4A] border border-[#D0DFD6]">
                  {cat.percentage}%
                </span>
              </div>
            </div>

            {/* Bar track and fill */}
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F7F5EF] border border-[#DCE2DD]/60">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${cat.percentage}%`,
                  backgroundColor: isHovered ? activeColor : barColor,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
