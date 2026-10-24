'use client';

import { useState } from 'react';
import type { StackedBarPoint } from '@/features/admin/shared/mock/analyticsData';

interface StackedBarChartProps {
  data: StackedBarPoint[];
  height?: number;
  valueFormatter?: (val: number) => string;
}

export function StackedBarChart({
  data,
  height = 240,
  valueFormatter = (val) => String(val),
}: StackedBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-xs text-[#758B74]">
        No composition data available.
      </div>
    );
  }

  // Calculate totals per bar
  const totals = data.map((d) => d.segments.reduce((acc, seg) => acc + seg.value, 0));
  const maxTotal = Math.max(...totals, 1);

  const chartHeight = height - 40;
  const paddingX = 40;
  const totalWidth = 600;
  const plotWidth = totalWidth - paddingX * 2;
  const slotWidth = plotWidth / data.length;
  const barWidth = Math.min(slotWidth * 0.45, 36);

  // Extract distinct segment types for legend
  const legendItems = data[0]?.segments.map((seg) => ({
    id: seg.id,
    label: seg.label,
    color: seg.color,
  })) ?? [];

  return (
    <div className="relative w-full">
      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center justify-end gap-3 text-xs font-medium text-[#4A5851]">
        {legendItems.map((item) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full overflow-visible font-sans select-none"
        role="img"
        aria-label="Stacked bar chart composition"
      >
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = chartHeight * (1 - pct) + 10;
          return (
            <g key={pct}>
              <line
                x1={paddingX}
                y1={y}
                x2={totalWidth - paddingX}
                y2={y}
                stroke="#E6E4DD"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <text
                x={paddingX - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-[#A3B3AB] text-[10px] font-mono"
              >
                {Math.round((maxTotal * pct) / 1000) > 0
                  ? `${Math.round((maxTotal * pct) / 1000)}k`
                  : Math.round(maxTotal * pct)}
              </text>
            </g>
          );
        })}

        {/* Stacked Bars */}
        {data.map((point, idx) => {
          const slotCenterX = paddingX + idx * slotWidth + slotWidth / 2;
          const barX = slotCenterX - barWidth / 2;
          const isHovered = hoveredIdx === idx;

          let accumulatedY = chartHeight + 10;

          return (
            <g
              key={point.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {isHovered && (
                <rect
                  x={paddingX + idx * slotWidth}
                  y={10}
                  width={slotWidth}
                  height={chartHeight}
                  fill="#758B74"
                  fillOpacity={0.08}
                  rx={4}
                />
              )}

              {point.segments.map((seg, sIdx) => {
                const segHeight = (seg.value / maxTotal) * chartHeight;
                accumulatedY -= segHeight;

                const isTop = sIdx === point.segments.length - 1;
                const isBottom = sIdx === 0;

                return (
                  <rect
                    key={seg.id}
                    x={barX}
                    y={accumulatedY}
                    width={barWidth}
                    height={segHeight}
                    fill={seg.color}
                    rx={isTop ? 3 : isBottom ? 1 : 0}
                    className="transition-all duration-200"
                  />
                );
              })}

              {/* X Axis Label */}
              <text
                x={slotCenterX}
                y={chartHeight + 28}
                textAnchor="middle"
                className={`text-[11px] font-medium transition-colors ${
                  isHovered ? 'fill-[#1C2923] font-bold' : 'fill-[#74827B]'
                }`}
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover Tooltip Overlay */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div
          className="pointer-events-none absolute -top-2 rounded-xl border border-[#2A3B33] bg-[#1C2923] px-3.5 py-2.5 text-xs text-white shadow-xl z-20 min-w-[160px]"
          style={{
            left: `${((hoveredIdx + 0.5) / data.length) * 100}%`,
            transform: 'translateX(-50%) translateY(-100%)',
          }}
        >
          <div className="flex items-center justify-between border-b border-[#2A3B33] pb-1.5 mb-1.5">
            <span className="font-bold text-[#E8EFE9]">{data[hoveredIdx].label}</span>
            <span className="text-[11px] text-[#A3B3AB] font-mono">
              Total: {valueFormatter(totals[hoveredIdx])}
            </span>
          </div>

          <div className="space-y-1">
            {data[hoveredIdx].segments.map((seg) => (
              <div key={seg.id} className="flex items-center justify-between gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="text-[#A3B3AB]">{seg.label}</span>
                </div>
                <span className="font-semibold text-white">{valueFormatter(seg.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screen reader table */}
      <table className="sr-only">
        <caption>Composition breakdown</caption>
        <thead>
          <tr>
            <th>Period</th>
            {legendItems.map((item) => (
              <th key={item.id}>{item.label}</th>
            ))}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              {d.segments.map((s) => (
                <td key={s.id}>{s.value}</td>
              ))}
              <td>{totals[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
