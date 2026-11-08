'use client';

import { useState } from 'react';
import type { GroupedBarPoint } from '@/features/admin/shared/mock/analyticsData';

interface GroupedBarChartProps {
  data: GroupedBarPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  height?: number;
  valueFormatter?: (val: number) => string;
}

export function GroupedBarChart({
  data,
  primaryLabel = 'Tasks Received',
  secondaryLabel = 'Tasks Completed',
  primaryColor = '#174B4A',
  secondaryColor = '#5B6E69',
  height = 240,
  valueFormatter = (val) => String(val),
}: GroupedBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-xs text-[#5B6E69]">
        No trend data recorded.
      </div>
    );
  }

  const maxVal = Math.max(...data.flatMap((d) => [d.primary, d.secondary]), 1);
  const chartHeight = height - 40;
  const paddingX = 40;
  const totalWidth = 600;
  const plotWidth = totalWidth - paddingX * 2;
  const groupWidth = plotWidth / data.length;
  const barWidth = Math.min(groupWidth * 0.32, 24);
  const barGap = 4;

  return (
    <div className="relative w-full">
      {/* Legend */}
      <div className="mb-3 flex items-center justify-end gap-4 text-xs font-medium text-[#5B6E69]">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-xs" style={{ backgroundColor: primaryColor }} />
          <span>{primaryLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-xs" style={{ backgroundColor: secondaryColor }} />
          <span>{secondaryLabel}</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full overflow-visible font-sans select-none"
        role="img"
        aria-label="Grouped bar chart comparison"
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
                stroke="#DCE2DD"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <text
                x={paddingX - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-[#5B6E69] text-[10px] font-mono"
              >
                {Math.round(maxVal * pct)}
              </text>
            </g>
          );
        })}

        {/* Grouped Bars */}
        {data.map((point, idx) => {
          const groupCenterX = paddingX + idx * groupWidth + groupWidth / 2;
          const bar1Height = (point.primary / maxVal) * chartHeight;
          const bar2Height = (point.secondary / maxVal) * chartHeight;

          const bar1X = groupCenterX - barWidth - barGap / 2;
          const bar2X = groupCenterX + barGap / 2;

          const bar1Y = chartHeight - bar1Height + 10;
          const bar2Y = chartHeight - bar2Height + 10;

          const isHovered = hoveredIdx === idx;

          return (
            <g
              key={point.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer transition-opacity"
            >
              {/* Highlight background strip on hover */}
              {isHovered && (
                <rect
                  x={paddingX + idx * groupWidth}
                  y={10}
                  width={groupWidth}
                  height={chartHeight}
                  fill="#5B6E69"
                  fillOpacity={0.08}
                  rx={4}
                />
              )}

              {/* Bar 1 (Primary) */}
              <rect
                x={bar1X}
                y={bar1Y}
                width={barWidth}
                height={bar1Height}
                fill={primaryColor}
                rx={3}
                className="transition-all duration-200"
              />

              {/* Bar 2 (Secondary) */}
              <rect
                x={bar2X}
                y={bar2Y}
                width={barWidth}
                height={bar2Height}
                fill={secondaryColor}
                rx={3}
                className="transition-all duration-200"
              />

              {/* X Axis Label */}
              <text
                x={groupCenterX}
                y={chartHeight + 28}
                textAnchor="middle"
                className={`text-[11px] font-medium transition-colors ${
                  isHovered ? 'fill-[#1C2928] font-bold' : 'fill-[#5B6E69]'
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
          className="pointer-events-none absolute -top-2 rounded-xl border border-[#103B39] bg-[#1C2928] px-3 py-2 text-xs text-white shadow-lg z-20"
          style={{
            left: `${((hoveredIdx + 0.5) / data.length) * 100}%`,
            transform: 'translateX(-50%) translateY(-100%)',
          }}
        >
          <p className="font-bold text-[#E8F0EA] border-b border-[#103B39] pb-1 mb-1">
            {data[hoveredIdx].label}
          </p>
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-[#5B6E69]">{primaryLabel}:</span>
            <span className="font-bold text-white">
              {valueFormatter(data[hoveredIdx].primary)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-[#5B6E69]">{secondaryLabel}:</span>
            <span className="font-bold text-[#A3D2BA]">
              {valueFormatter(data[hoveredIdx].secondary)}
            </span>
          </div>
        </div>
      )}

      {/* Screen reader table */}
      <table className="sr-only">
        <caption>
          {primaryLabel} and {secondaryLabel} comparison
        </caption>
        <thead>
          <tr>
            <th>Period</th>
            <th>{primaryLabel}</th>
            <th>{secondaryLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td>{d.primary}</td>
              <td>{d.secondary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
