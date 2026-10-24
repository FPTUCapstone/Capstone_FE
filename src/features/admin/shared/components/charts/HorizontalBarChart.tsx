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
  barColor = '#245747',
  activeColor = '#1C2923',
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
            className="group rounded-xl p-2 transition hover:bg-[#F7F6F2]/70 cursor-pointer"
          >
            {/* Top row: Title and Values */}
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1C2923]">{cat.name}</span>
                {cat.secondaryLabel ? (
                  <span className="text-[11px] text-[#758B74]">({cat.secondaryLabel})</span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-[#1C2923]">{cat.formattedValue}</span>
                <span className="rounded-md bg-[#E8EFEA] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#245747] border border-[#D0DFD6]">
                  {cat.percentage}%
                </span>
              </div>
            </div>

            {/* Bar track and fill */}
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F0EFEA] border border-[#E6E4DD]/60">
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
