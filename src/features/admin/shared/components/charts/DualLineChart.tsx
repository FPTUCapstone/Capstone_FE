'use client';

import { useState } from 'react';
import type { TimeSeriesPoint } from '../../mock/analyticsData';

interface DualLineChartProps {
  data: TimeSeriesPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  height?: number;
}

export function DualLineChart({
  data,
  primaryLabel = 'Active Bookings',
  secondaryLabel = 'Platform Traffic',
  primaryColor = '#245747',
  secondaryColor = '#758B74',
  height = 190,
}: DualLineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="flex h-44 items-center justify-center text-xs text-[#758B74]">No data available.</div>;
  }

  const primaryValues = data.map((d) => d.primaryValue);
  const secondaryValues = data.map((d) => d.secondaryValue ?? 0);
  const maxPrimary = Math.max(...primaryValues, 1);
  const maxSecondary = Math.max(...secondaryValues, 1);

  const svgWidth = 600;
  const svgHeight = height;
  const paddingX = 40;
  const paddingY = 25;
  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingY * 2;

  // Normalize points to their independent scales or joint scale
  const points = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1 || 1)) * innerWidth;
    const y1 = paddingY + innerHeight - (d.primaryValue / (maxPrimary * 1.15)) * innerHeight;
    const y2 = d.secondaryValue !== undefined
      ? paddingY + innerHeight - (d.secondaryValue / (maxSecondary * 1.15)) * innerHeight
      : undefined;
    return { x, y1, y2, ...d };
  });

  const path1 = points.reduce((acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y1}` : `${acc} L ${pt.x} ${pt.y1}`), '');
  const path2 = points.reduce((acc, pt, idx) => {
    if (pt.y2 === undefined) return acc;
    return idx === 0 ? `M ${pt.x} ${pt.y2}` : `${acc} L ${pt.x} ${pt.y2}`;
  }, '');

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="relative flex flex-col justify-between">
      {/* Legend */}
      <div className="mb-2 flex items-center justify-end gap-4 text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
          <span className="text-[#1C2923]">{primaryLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
          <span className="text-[#758B74]">{secondaryLabel}</span>
        </div>
      </div>

      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full overflow-visible"
          role="img"
          aria-label={`${primaryLabel} and ${secondaryLabel} comparison chart`}
        >
          {/* Horizontal lines */}
          {[0, 0.5, 1].map((ratio, idx) => {
            const y = paddingY + ratio * innerHeight;
            return (
              <line
                key={idx}
                x1={paddingX}
                y1={y}
                x2={paddingX + innerWidth}
                y2={y}
                stroke="#E6E4DD"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            );
          })}

          {/* Line 2 (Secondary) */}
          {path2 ? (
            <path
              d={path2}
              fill="none"
              stroke={secondaryColor}
              strokeWidth="2"
              strokeDasharray="4 2"
              strokeLinecap="round"
            />
          ) : null}

          {/* Line 1 (Primary) */}
          <path
            d={path1}
            fill="none"
            stroke={primaryColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Interactive target dots and labels */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                tabIndex={0}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
                className="cursor-pointer"
                role="button"
                aria-label={`${pt.label}: ${primaryLabel} ${pt.primaryValue}, ${secondaryLabel} ${pt.secondaryValue}`}
              >
                <rect
                  x={pt.x - 15}
                  y={paddingY}
                  width="30"
                  height={innerHeight}
                  fill="transparent"
                />

                {isHovered ? (
                  <line
                    x1={pt.x}
                    y1={paddingY}
                    x2={pt.x}
                    y2={paddingY + innerHeight}
                    stroke="#1C2923"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.4"
                  />
                ) : null}

                <circle
                  cx={pt.x}
                  cy={pt.y1}
                  r={isHovered ? 5 : 3.5}
                  fill="#FFFFFF"
                  stroke={primaryColor}
                  strokeWidth="2"
                />

                {pt.y2 !== undefined ? (
                  <circle
                    cx={pt.x}
                    cy={pt.y2}
                    r={isHovered ? 4.5 : 3}
                    fill="#FFFFFF"
                    stroke={secondaryColor}
                    strokeWidth="2"
                  />
                ) : null}

                <text
                  x={pt.x}
                  y={paddingY + innerHeight + 15}
                  textAnchor="middle"
                  className={`text-[11px] font-medium transition-colors ${
                    isHovered ? 'fill-[#1C2923] font-bold' : 'fill-[#758B74]'
                  }`}
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {activePoint ? (
          <div
            className="pointer-events-none absolute z-20 -top-2 rounded-xl border border-[#245747]/20 bg-[#1C2923] px-3 py-2 text-xs text-white shadow-lg backdrop-blur-md transition-all -translate-x-1/2"
            style={{
              left: `${(activePoint.x / svgWidth) * 100}%`,
              top: `${Math.max(10, (activePoint.y1 / svgHeight) * 100 - 30)}%`,
            }}
          >
            <p className="font-semibold text-[#A3B3AB] text-[10px]">{activePoint.date}</p>
            <p className="mt-0.5 font-bold text-white text-xs">
              {primaryLabel}: {activePoint.primaryValue}
            </p>
            {activePoint.secondaryValue !== undefined ? (
              <p className="text-[11px] font-medium text-[#A3B3AB]">
                {secondaryLabel}: {activePoint.secondaryValue}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
