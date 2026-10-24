'use client';

import { useState } from 'react';
import type { DonutSegment } from '../../mock/analyticsData';

interface DonutChartProps {
  segments: DonutSegment[];
  centerValue?: string | number;
  centerLabel?: string;
  size?: number;
}

export function DonutChart({
  segments,
  centerValue,
  centerLabel = 'Total Distribution',
  size = 180,
}: DonutChartProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const totalValue = segments.reduce((sum, seg) => sum + seg.value, 0);
  const radius = 64;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  const processedSegments = segments.map((seg, idx) => {
    const accumulatedPercent = segments
      .slice(0, idx)
      .reduce((sum, s) => sum + s.percentage, 0);
    const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    return {
      ...seg,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeSegment = segments.find((s) => s.id === activeId);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-around">
      {/* Donut SVG */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 160 160"
          className="h-full w-full -rotate-90 transform overflow-visible"
          role="img"
          aria-label="Distribution donut chart"
        >
          {/* Background Track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#F0EFEA"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {processedSegments.map((seg) => {
            const isHovered = activeId === seg.id;
            return (
              <circle
                key={seg.id}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="butt"
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setActiveId(seg.id)}
                onMouseLeave={() => setActiveId(null)}
                tabIndex={0}
                onFocus={() => setActiveId(seg.id)}
                onBlur={() => setActiveId(null)}
                role="button"
                aria-label={`${seg.label}: ${seg.percentage}% (${seg.value})`}
              />
            );
          })}
        </svg>

        {/* Center Label Overlay */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-extrabold tracking-tight text-[#1C2923]">
            {activeSegment ? `${activeSegment.percentage}%` : centerValue ?? `${totalValue}`}
          </span>
          <span className="max-w-[90px] text-[10px] font-semibold text-[#758B74] uppercase tracking-wider leading-tight">
            {activeSegment ? activeSegment.label : centerLabel}
          </span>
        </div>
      </div>

      {/* Legend & Breakdown List */}
      <div className="w-full flex-1 space-y-2.5">
        {segments.map((seg) => {
          const isSelected = activeId === seg.id;
          return (
            <div
              key={seg.id}
              onMouseEnter={() => setActiveId(seg.id)}
              onMouseLeave={() => setActiveId(null)}
              className={`flex items-center justify-between rounded-xl p-2 transition cursor-pointer ${
                isSelected ? 'bg-[#F7F6F2] font-semibold' : 'hover:bg-[#F7F6F2]/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                  aria-hidden="true"
                />
                <span className="text-xs text-[#1C2923] font-medium">{seg.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#758B74]">{seg.value}</span>
                <span className="rounded-md bg-[#E6E4DD]/60 px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#1C2923]">
                  {seg.percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
