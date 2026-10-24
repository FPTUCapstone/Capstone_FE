'use client';

import { useId, useState } from 'react';
import type { TimeSeriesPoint } from '../../mock/analyticsData';

interface AreaTrendChartProps {
  data: TimeSeriesPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  height?: number;
  primaryColor?: string;
  gradientId?: string;
  valueFormatter?: (val: number) => string;
}

export function AreaTrendChart({
  data,
  primaryLabel = 'Gross Revenue',
  secondaryLabel = 'Commission (10%)',
  valuePrefix = '$',
  valueSuffix = '',
  height = 200,
  primaryColor = '#245747',
  gradientId: customGradientId,
  valueFormatter,
}: AreaTrendChartProps) {
  const autoGradientId = useId();
  const gradientId = customGradientId ?? autoGradientId;
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const formatVal = (val: number) => {
    if (valueFormatter) return valueFormatter(val);
    return `${valuePrefix}${val.toLocaleString()}${valueSuffix}`;
  };

  if (!data || data.length === 0) {
    return <div className="flex h-48 items-center justify-center text-xs text-[#758B74]">No data available.</div>;
  }

  const values = data.map((d) => d.primaryValue);
  const maxPrimary = Math.max(...values, 1);
  const maxVal = Math.ceil(maxPrimary * 1.15); // Add 15% top padding

  const svgWidth = 600;
  const svgHeight = height;
  const paddingX = 40;
  const paddingY = 30;
  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingY * 2;

  // Calculate coordinates
  const points = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1 || 1)) * innerWidth;
    const y = paddingY + innerHeight - (d.primaryValue / maxVal) * innerHeight;
    const y2 = d.secondaryValue !== undefined
      ? paddingY + innerHeight - (d.secondaryValue / maxVal) * innerHeight
      : undefined;
    return { x, y, y2, ...d };
  });

  // Construct Area SVG Path
  const primaryPathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaPathD = `${primaryPathD} L ${points[points.length - 1].x} ${paddingY + innerHeight} L ${points[0].x} ${paddingY + innerHeight} Z`;

  const secondaryPathD = points.reduce((acc, pt, idx) => {
    if (pt.y2 === undefined) return acc;
    return idx === 0 ? `M ${pt.x} ${pt.y2}` : `${acc} L ${pt.x} ${pt.y2}`;
  }, '');

  // Grid lines
  const gridSteps = 3;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const ratio = i / gridSteps;
    const value = Math.round(maxVal * (1 - ratio));
    const y = paddingY + ratio * innerHeight;
    return { y, value };
  });

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="relative flex flex-col justify-between">
      {/* Legend */}
      <div className="mb-2 flex items-center justify-end gap-4 text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#245747]" />
          <span className="text-[#1C2923]">{primaryLabel}</span>
        </div>
        {secondaryLabel && points.some((p) => p.y2 !== undefined) ? (
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#B87558]" />
            <span className="text-[#758B74]">{secondaryLabel}</span>
          </div>
        ) : null}
      </div>

      {/* SVG Chart */}
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full overflow-visible"
          role="img"
          aria-label={`${primaryLabel} trend chart`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.28" />
              <stop offset="100%" stopColor={primaryColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((gl, i) => (
            <g key={i}>
              <line
                x1={paddingX}
                y1={gl.y}
                x2={paddingX + innerWidth}
                y2={gl.y}
                stroke="#E6E4DD"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={paddingX - 8}
                y={gl.y + 3}
                textAnchor="end"
                className="fill-[#758B74] text-[10px] font-mono font-medium"
              >
                {gl.value >= 1000 ? `${(gl.value / 1000).toFixed(0)}k` : gl.value}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={areaPathD} fill={`url(#${gradientId})`} />

          {/* Primary Trend Line */}
          <path d={primaryPathD} fill="none" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />

          {/* Secondary Trend Line (e.g. Commission) */}
          {secondaryPathD ? (
            <path
              d={secondaryPathD}
              fill="none"
              stroke="#B87558"
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeLinecap="round"
            />
          ) : null}

          {/* Data Points and Hover targets */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-transform"
                tabIndex={0}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
                role="button"
                aria-label={`${pt.label}: ${valuePrefix}${pt.primaryValue.toLocaleString()}${valueSuffix}`}
              >
                {/* Invisible wider hover hit box */}
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
                    stroke="#245747"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    opacity="0.6"
                  />
                ) : null}

                {/* Primary point dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill="#FFFFFF"
                  stroke="#245747"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all"
                />

                {/* Secondary point dot */}
                {pt.y2 !== undefined ? (
                  <circle
                    cx={pt.x}
                    cy={pt.y2}
                    r={isHovered ? 5 : 3}
                    fill="#FFFFFF"
                    stroke="#B87558"
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    className="transition-all"
                  />
                ) : null}

                {/* X axis labels */}
                <text
                  x={pt.x}
                  y={paddingY + innerHeight + 16}
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

        {/* Floating Tooltip Box */}
        {activePoint ? (
          <div
            className="pointer-events-none absolute z-20 -top-2 rounded-xl border border-[#245747]/20 bg-[#1C2923] px-3 py-2 text-xs text-white shadow-lg backdrop-blur-md transition-all -translate-x-1/2"
            style={{
              left: `${(activePoint.x / svgWidth) * 100}%`,
              top: `${Math.max(10, (activePoint.y / svgHeight) * 100 - 35)}%`,
            }}
          >
            <p className="font-semibold text-[#A3B3AB] text-[10px]">{activePoint.date}</p>
            <p className="mt-0.5 font-bold text-white text-xs">
              {primaryLabel}: {formatVal(activePoint.primaryValue)}
            </p>
            {activePoint.secondaryValue !== undefined ? (
              <p className="text-[11px] font-medium text-[#D19B86]">
                {secondaryLabel}: {formatVal(activePoint.secondaryValue)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Screen Reader Table Fallback */}
      <table className="sr-only">
        <caption>{primaryLabel} historical data table</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">{primaryLabel}</th>
            {secondaryLabel ? <th scope="col">{secondaryLabel}</th> : null}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx}>
              <td>{item.label}</td>
              <td>{valuePrefix}{item.primaryValue}{valueSuffix}</td>
              {item.secondaryValue !== undefined ? (
                <td>{valuePrefix}{item.secondaryValue}{valueSuffix}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
