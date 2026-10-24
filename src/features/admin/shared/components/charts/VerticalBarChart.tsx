'use client';

import { useState } from 'react';
import type { TimeSeriesPoint } from '@/features/admin/shared/mock/analyticsData';

interface VerticalBarChartProps {
  data: TimeSeriesPoint[];
  color?: string;
  height?: number;
  valueFormatter?: (val: number) => string;
}

export function VerticalBarChart({
  data,
  color = '#245747',
  height = 240,
  valueFormatter = (val) => String(val),
}: VerticalBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-xs text-[#758B74]">
        No volume data available.
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.primaryValue), 1);
  const chartHeight = height - 40;
  const paddingX = 40;
  const totalWidth = 600;
  const plotWidth = totalWidth - paddingX * 2;
  const slotWidth = plotWidth / data.length;
  const barWidth = Math.min(slotWidth * 0.5, 36);

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full overflow-visible font-sans select-none"
        role="img"
        aria-label="Vertical bar chart"
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
                {Math.round(maxVal * pct)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((point, idx) => {
          const slotCenterX = paddingX + idx * slotWidth + slotWidth / 2;
          const barX = slotCenterX - barWidth / 2;
          const barHeight = (point.primaryValue / maxVal) * chartHeight;
          const barY = chartHeight - barHeight + 10;
          const isHovered = hoveredIdx === idx;

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

              <rect
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill={isHovered ? '#1B4337' : color}
                rx={4}
                className="transition-all duration-200"
              />

              {/* Value label on top of bar if space permits */}
              <text
                x={slotCenterX}
                y={barY - 6}
                textAnchor="middle"
                className={`text-[10px] font-bold font-mono transition-opacity ${
                  isHovered ? 'fill-[#1C2923] opacity-100' : 'fill-[#74827B] opacity-0 sm:opacity-80'
                }`}
              >
                {point.primaryValue}
              </text>

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
          className="pointer-events-none absolute -top-2 rounded-xl border border-[#2A3B33] bg-[#1C2923] px-3 py-2 text-xs text-white shadow-lg z-20"
          style={{
            left: `${((hoveredIdx + 0.5) / data.length) * 100}%`,
            transform: 'translateX(-50%) translateY(-100%)',
          }}
        >
          <p className="font-bold text-[#E8EFE9] border-b border-[#2A3B33] pb-1 mb-1">
            {data[hoveredIdx].label}
          </p>
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-[#A3B3AB]">Volume:</span>
            <span className="font-bold text-white">
              {valueFormatter(data[hoveredIdx].primaryValue)}
            </span>
          </div>
        </div>
      )}

      {/* Screen reader table */}
      <table className="sr-only">
        <caption>Volume Trend</caption>
        <thead>
          <tr>
            <th>Period</th>
            <th>Volume</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td>{d.primaryValue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
