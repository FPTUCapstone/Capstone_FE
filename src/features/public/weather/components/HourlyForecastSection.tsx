'use client';

import { useMemo, useState } from 'react';
import type {
  HourlyForecastPointDto,
  WeatherMetricTab,
} from '../types/weatherForecast';
import {
  classifyRainIntensity,
  classifyUvIndex,
  classifyWindSpeed,
  describeWeatherCode,
  formatDecimalVi,
  formatLocalTime,
  formatTemp,
  isNightHour,
} from '../utils/weatherFormat';

interface HourlyForecastSectionProps {
  hourly: readonly HourlyForecastPointDto[];
  timeZoneId: string;
  rangeLabel: string;
  isTodayRange: boolean;
}

const METRIC_TABS: ReadonlyArray<{ id: WeatherMetricTab; label: string; icon: string }> = [
  { id: 'temperature', label: 'Nhiệt độ', icon: 'device_thermostat' },
  { id: 'rain', label: 'Mưa', icon: 'rainy' },
  { id: 'uv', label: 'Chỉ số UV', icon: 'wb_sunny' },
  { id: 'wind', label: 'Gió', icon: 'air' },
];

const METRIC_META: Record<
  WeatherMetricTab,
  {
    axisTitle: string;
    unitSuffix: string;
    legend: ReadonlyArray<{ label: string; colorClass: string }>;
  }
> = {
  temperature: {
    axisTitle: 'Nhiệt độ theo giờ (°C)',
    unitSuffix: '°',
    legend: [
      { label: 'Đường nhiệt độ', colorClass: 'bg-[#174B4A]' },
      { label: 'Khung giờ đang chọn', colorClass: 'bg-[#B96D4C]' },
    ],
  },
  rain: {
    axisTitle: 'Xác suất mưa theo giờ (%)',
    unitSuffix: '%',
    legend: [
      { label: 'Mưa nhẹ', colorClass: 'bg-sky-400' },
      { label: 'Mưa vừa / to', colorClass: 'bg-sky-600' },
      { label: 'Có dông sét', colorClass: 'bg-rose-600' },
    ],
  },
  uv: {
    axisTitle: 'Chỉ số tia cực tím (UV)',
    unitSuffix: '',
    legend: [
      { label: 'Thấp (0–2)', colorClass: 'bg-[#174B4A]' },
      { label: 'Trung bình (3–5)', colorClass: 'bg-amber-600' },
      { label: 'Cao (6–7)', colorClass: 'bg-[#B96D4C]' },
      { label: 'Rất cao (8+)', colorClass: 'bg-rose-600' },
    ],
  },
  wind: {
    axisTitle: 'Tốc độ gió theo giờ (m/s)',
    unitSuffix: ' m/s',
    legend: [
      { label: 'Gió nhẹ / vừa (<10 m/s)', colorClass: 'bg-[#174B4A]' },
      { label: 'Gió mạnh (≥10 m/s)', colorClass: 'bg-amber-600' },
    ],
  },
};

const CHART_WIDTH = 1140;
const CHART_HEIGHT = 236;
const PAD_LEFT = 62;
const PAD_RIGHT = 20;
const PAD_TOP = 28;
const PAD_BOTTOM = 34;
const PLOT_INSET_X = 24;

function buildSmoothPath(points: ReadonlyArray<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx = (p0.x + p1.x) / 2;
    path += ` C ${cx.toFixed(1)} ${p0.y.toFixed(1)}, ${cx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  return path;
}

export function HourlyForecastSection({
  hourly,
  timeZoneId,
  rangeLabel,
  isTodayRange,
}: HourlyForecastSectionProps) {
  const [activeMetric, setActiveMetric] = useState<WeatherMetricTab>('temperature');
  const [selectedSlotUtc, setSelectedSlotUtc] = useState<string | null>(null);

  const slots = useMemo(() => hourly.slice(0, 24), [hourly]);

  const selectedIndex = useMemo(() => {
    if (slots.length === 0) return 0;
    if (!selectedSlotUtc) return 0;
    const found = slots.findIndex((s) => s.startUtc === selectedSlotUtc);
    return found >= 0 ? found : 0;
  }, [slots, selectedSlotUtc]);

  const selectedSlot = slots[selectedIndex];

  const chartGeometry = useMemo(() => {
    const plotAreaW = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
    const plotW = plotAreaW - PLOT_INSET_X * 2;
    const plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
    const stepX = slots.length > 1 ? plotW / (slots.length - 1) : 0;

    if (activeMetric === 'temperature') {
      const temps = slots.map((s) => s.temperatureC);
      const minVal = Math.floor(Math.min(...temps) - 2);
      const maxVal = Math.ceil(Math.max(...temps) + 2);
      const span = Math.max(4, maxVal - minVal);
      const coords = slots.map((s, idx) => {
        const x = PAD_LEFT + PLOT_INSET_X + idx * stepX;
        const ratio = (s.temperatureC - minVal) / span;
        const y = PAD_TOP + plotH - ratio * plotH;
        return { x, y, value: s.temperatureC, label: formatTemp(s.temperatureC) };
      });
      const linePath = buildSmoothPath(coords);
      const areaPath =
        coords.length > 1
          ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(PAD_TOP + plotH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(PAD_TOP + plotH).toFixed(1)} Z`
          : '';
      const step = span / 3;
      const ticks = [
        minVal,
        Math.round(minVal + step),
        Math.round(minVal + step * 2),
        maxVal,
      ].filter((v, i, arr) => arr.indexOf(v) === i);
      return { coords, linePath, areaPath, ticks, minVal, maxVal, span, plotH, plotW, plotAreaW };
    }

    const values = slots.map((s) => {
      if (activeMetric === 'rain') return s.rainProbabilityPercent;
      if (activeMetric === 'uv') return s.uvIndex;
      return s.windSpeedMps;
    });
    const maxVal =
      activeMetric === 'rain'
        ? 100
        : activeMetric === 'uv'
          ? 12
          : Math.max(12, Math.ceil((Math.max(...values, 8) + 2) / 3) * 3);
    const minVal = 0;
    const span = Math.max(1, maxVal - minVal);

    const coords = slots.map((s, idx) => {
      const x = PAD_LEFT + PLOT_INSET_X + idx * stepX;
      const value = values[idx];
      const ratio = (value - minVal) / span;
      const y = PAD_TOP + plotH - ratio * plotH;
      const label =
        activeMetric === 'rain'
          ? `${Math.round(s.rainProbabilityPercent)}%`
          : activeMetric === 'uv'
            ? String(s.uvIndex)
            : formatDecimalVi(s.windSpeedMps);
      return { x, y, value, label };
    });

    const ticks =
      activeMetric === 'rain'
        ? [0, 25, 50, 75, 100]
        : [0, Math.round(maxVal / 3), Math.round((maxVal * 2) / 3), maxVal];
    return { coords, linePath: '', areaPath: '', ticks, minVal, maxVal, span, plotH, plotW, plotAreaW };
  }, [activeMetric, slots]);

  if (slots.length === 0 || !selectedSlot) {
    return null;
  }

  const selectedVisual = describeWeatherCode(
    selectedSlot.weatherCode,
    selectedSlot.thunderstorm,
    isNightHour(selectedSlot.startUtc, timeZoneId),
  );
  const selectedRain = classifyRainIntensity(
    selectedSlot.rainMmPerHour,
    selectedSlot.thunderstorm,
  );
  const selectedUv = classifyUvIndex(selectedSlot.uvIndex);
  const selectedWind = classifyWindSpeed(selectedSlot.windSpeedMps);

  return (
    <section
      aria-label="Dự báo thời tiết theo giờ"
      className="rounded-3xl border border-[#DCE2DD] bg-white p-5 shadow-2xs sm:p-6"
    >
      {/* Header & Metric Switch */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black tracking-tight text-[#1C2928]">
              Dự báo theo giờ
            </h2>
            <span className="rounded-full border border-[#DCE2DD] bg-[#F7F5EF] px-2.5 py-0.5 text-[11px] font-bold text-[#174B4A]">
              {rangeLabel}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#5B6E69]">
            Chuỗi thời tiết từng giờ theo chuẩn Tomorrow.io — nhấn vào khung giờ để xem chi tiết.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Chọn chỉ số biểu đồ theo giờ"
          className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-[#DCE2DD] bg-[#F7F5EF] p-1"
        >
          {METRIC_TABS.map((tab) => {
            const isActive = activeMetric === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveMetric(tab.id)}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174B4A] ${
                  isActive
                    ? 'bg-[#174B4A] text-white shadow-xs'
                    : 'text-[#5B6E69] hover:bg-white/70 hover:text-[#1C2928]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive SVG Chart with High-Contrast Plot Backdrop */}
      <div className="mt-5 rounded-2xl border border-[#CEDAD3] bg-[#EEF3F0] p-3.5 sm:p-4">
        {/* Chart Axis Title & Legend */}
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 px-1">
          <span className="text-xs font-extrabold tracking-tight text-[#174B4A]">
            {METRIC_META[activeMetric].axisTitle}
          </span>
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] font-semibold text-[#475C57]">
            {METRIC_META[activeMetric].legend.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-xs ${item.colorClass}`} aria-hidden="true" />
                <span>{item.label}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="min-w-[760px]">
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              className="h-56 w-full select-none sm:h-60"
              role="img"
              aria-label={`Biểu đồ ${METRIC_TABS.find((t) => t.id === activeMetric)?.label ?? 'thời tiết'} theo giờ`}
            >
              <defs>
                <linearGradient id="tripmateTempArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#174B4A" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#174B4A" stopOpacity="0.03" />
                </linearGradient>
                <clipPath id="tripmatePlotClip">
                  <rect
                    x={PAD_LEFT}
                    y={PAD_TOP}
                    width={chartGeometry.plotAreaW}
                    height={chartGeometry.plotH}
                    rx={10}
                  />
                </clipPath>
              </defs>

              {/* Crisp White Plot Surface with Border */}
              <rect
                x={PAD_LEFT}
                y={PAD_TOP}
                width={chartGeometry.plotAreaW}
                height={chartGeometry.plotH}
                rx={10}
                fill="#FFFFFF"
                stroke="#C5D3CC"
                strokeWidth="1.25"
              />

              {/* Alternating Horizontal Zone Bands inside Plot */}
              <g clipPath="url(#tripmatePlotClip)">
                {chartGeometry.ticks.slice(0, -1).map((tick, idx) => {
                  const nextTick = chartGeometry.ticks[idx + 1];
                  if (idx % 2 === 0) return null;
                  const yTop =
                    PAD_TOP +
                    chartGeometry.plotH -
                    ((nextTick - chartGeometry.minVal) / chartGeometry.span) * chartGeometry.plotH;
                  const yBottom =
                    PAD_TOP +
                    chartGeometry.plotH -
                    ((tick - chartGeometry.minVal) / chartGeometry.span) * chartGeometry.plotH;
                  return (
                    <rect
                      key={`band-${tick}`}
                      x={PAD_LEFT}
                      y={yTop}
                      width={chartGeometry.plotAreaW}
                      height={Math.max(0, yBottom - yTop)}
                      fill="#F4F7F5"
                    />
                  );
                })}
              </g>

              {/* Vertical Time-Slot Guide Lines */}
              {chartGeometry.coords.map((pt, idx) => {
                if (idx % 3 !== 0 && idx !== selectedIndex) return null;
                const isSelected = idx === selectedIndex;
                return (
                  <line
                    key={`vgrid-${slots[idx].startUtc}`}
                    x1={pt.x}
                    y1={PAD_TOP}
                    x2={pt.x}
                    y2={PAD_TOP + chartGeometry.plotH}
                    stroke={isSelected ? '#174B4A' : '#DFE8E3'}
                    strokeOpacity={isSelected ? 0.35 : 0.9}
                    strokeDasharray={isSelected ? '4 3' : undefined}
                    strokeWidth={isSelected ? 1.5 : 1}
                  />
                );
              })}

              {/* Horizontal Reference Gridlines & Y-Axis Ticks */}
              {chartGeometry.ticks.map((tick, tickIdx) => {
                const ratio = (tick - chartGeometry.minVal) / chartGeometry.span;
                const y = PAD_TOP + chartGeometry.plotH - ratio * chartGeometry.plotH;
                const isBaseline = tickIdx === 0;
                const unit = METRIC_META[activeMetric].unitSuffix;
                return (
                  <g key={tick}>
                    <line
                      x1={PAD_LEFT}
                      y1={y}
                      x2={CHART_WIDTH - PAD_RIGHT}
                      y2={y}
                      stroke={isBaseline ? '#8DA49B' : '#C3D2CA'}
                      strokeDasharray={isBaseline ? undefined : '4 4'}
                      strokeWidth={isBaseline ? 1.5 : 1}
                    />
                    <text
                      x={PAD_LEFT - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-[#334743] text-[11px] font-bold"
                    >
                      {tick}
                      {tick === 0 && activeMetric === 'wind' ? '' : unit}
                    </text>
                  </g>
                );
              })}

              {/* Series: Temperature curve or Bar chart */}
              {activeMetric === 'temperature' ? (
                <>
                  {chartGeometry.areaPath ? (
                    <path
                      d={chartGeometry.areaPath}
                      fill="url(#tripmateTempArea)"
                      clipPath="url(#tripmatePlotClip)"
                    />
                  ) : null}
                  {chartGeometry.linePath ? (
                    <path
                      d={chartGeometry.linePath}
                      fill="none"
                      stroke="#174B4A"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  ) : null}
                </>
              ) : (
                chartGeometry.coords.map((pt, idx) => {
                  const slot = slots[idx];
                  const barW = Math.max(18, Math.min(28, chartGeometry.plotW / slots.length - 10));
                  const barBottom = PAD_TOP + chartGeometry.plotH;
                  const barHeight = Math.max(5, barBottom - pt.y);
                  const isSelected = idx === selectedIndex;

                  let barFill = '#174B4A';
                  if (activeMetric === 'rain') {
                    barFill = slot.thunderstorm
                      ? '#E02D4D'
                      : slot.rainMmPerHour >= 2.5
                        ? '#0284C7'
                        : '#38BDF8';
                  } else if (activeMetric === 'uv') {
                    barFill =
                      slot.uvIndex >= 8
                        ? '#E02D4D'
                        : slot.uvIndex >= 6
                          ? '#B96D4C'
                          : slot.uvIndex >= 3
                            ? '#D97706'
                            : '#174B4A';
                  } else if (activeMetric === 'wind') {
                    barFill = slot.windSpeedMps >= 10 ? '#D97706' : '#174B4A';
                  }

                  return (
                    <g
                      key={slot.startUtc}
                      className="cursor-pointer"
                      onClick={() => setSelectedSlotUtc(slot.startUtc)}
                    >
                      {/* Full-height subtle track column so low bars stay visually anchored */}
                      <rect
                        x={pt.x - barW / 2}
                        y={PAD_TOP + 6}
                        width={barW}
                        height={chartGeometry.plotH - 6}
                        rx={6}
                        fill={isSelected ? '#DCEAE4' : '#EAF0EC'}
                      />
                      <rect
                        x={pt.x - barW / 2}
                        y={barBottom - barHeight}
                        width={barW}
                        height={barHeight}
                        rx={6}
                        fill={barFill}
                        fillOpacity={isSelected ? 1 : 0.85}
                        stroke={isSelected ? '#0C2423' : 'none'}
                        strokeWidth={isSelected ? 1.75 : 0}
                      />
                    </g>
                  );
                })
              )}

              {/* Interactive Nodes, Value Labels & X-axis Time Labels */}
              {chartGeometry.coords.map((pt, idx) => {
                const slot = slots[idx];
                const isSelected = idx === selectedIndex;
                const showLabel = isSelected || idx % 3 === 0 || idx === slots.length - 1;
                const timeLabel =
                  isTodayRange && idx === 0
                    ? 'Bây giờ'
                    : formatLocalTime(slot.startUtc, timeZoneId);

                return (
                  <g
                    key={slot.startUtc}
                    className="cursor-pointer"
                    onClick={() => setSelectedSlotUtc(slot.startUtc)}
                  >
                    {/* Transparent hit column for easy clicking */}
                    <rect
                      x={pt.x - 18}
                      y={PAD_TOP}
                      width={36}
                      height={chartGeometry.plotH + PAD_BOTTOM}
                      fill="transparent"
                    />

                    {activeMetric === 'temperature' ? (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isSelected ? 6 : idx % 3 === 0 ? 4 : 2.75}
                        fill={isSelected ? '#B96D4C' : '#FFFFFF'}
                        stroke={isSelected ? '#FFFFFF' : '#174B4A'}
                        strokeWidth={isSelected ? 2.5 : 2}
                      />
                    ) : null}

                    {showLabel ? (
                      <text
                        x={pt.x}
                        y={Math.max(16, pt.y - 10)}
                        textAnchor="middle"
                        className={`text-[11px] font-extrabold ${
                          isSelected ? 'fill-[#B96D4C]' : 'fill-[#1C2928]'
                        }`}
                      >
                        {pt.label}
                      </text>
                    ) : null}

                    {idx % 3 === 0 || isSelected ? (
                      <text
                        x={pt.x}
                        y={CHART_HEIGHT - 10}
                        textAnchor="middle"
                        className={`text-[11px] ${
                          isSelected ? 'fill-[#103B39] font-extrabold' : 'fill-[#475C57] font-semibold'
                        }`}
                      >
                        {timeLabel}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Selected Hour Detailed Tomorrow.io Inspector */}
      <div
        data-testid="selected-hour-summary"
        className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#DCE2DD] bg-[#F7F5EF] px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#DCE2DD]">
            <span className={`material-symbols-outlined text-xl ${selectedVisual.iconColorClass}`} aria-hidden="true">
              {selectedVisual.icon}
            </span>
          </div>
          <div>
            <p className="text-xs font-extrabold text-[#1C2928] tabular-nums">
              {isTodayRange && selectedIndex === 0
                ? `Hiện tại (${formatLocalTime(selectedSlot.startUtc, timeZoneId)})`
                : `Khung giờ ${formatLocalTime(selectedSlot.startUtc, timeZoneId)}`}
              {' · '}
              <span className="text-[#174B4A]">{selectedVisual.labelVi}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-[#5B6E69] tabular-nums">
              Nhiệt độ <strong className="text-[#1C2928]">{formatTemp(selectedSlot.temperatureC)}</strong>
              {' · '}
              Cảm giác <strong className="text-[#1C2928]">{formatTemp(selectedSlot.apparentTemperatureC)}</strong>
              {' · '}
              Độ ẩm <strong className="text-[#1C2928]">{Math.round(selectedSlot.humidityPercent)}%</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold tabular-nums">
          <span className={`rounded-full border px-2.5 py-1 ${selectedRain.badgeClass}`}>
            Mưa: {formatDecimalVi(selectedSlot.rainMmPerHour)} mm/h ({Math.round(selectedSlot.rainProbabilityPercent)}%)
          </span>
          <span className={`rounded-full border px-2.5 py-1 ${selectedUv.badgeClass}`}>
            UV {selectedSlot.uvIndex} ({selectedUv.labelVi})
          </span>
          <span className={`rounded-full border px-2.5 py-1 ${selectedWind.badgeClass}`}>
            Gió {selectedWind.kmPerHour} km/h ({formatDecimalVi(selectedSlot.windSpeedMps)} m/s)
          </span>
        </div>
      </div>

      {/* Scrollable Hourly Timeline Cards */}
      <div
        className="custom-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2"
        role="listbox"
        aria-label="Danh sách khung giờ dự báo"
      >
        {slots.map((slot, idx) => {
          const isSelected = idx === selectedIndex;
          const visual = describeWeatherCode(
            slot.weatherCode,
            slot.thunderstorm,
            isNightHour(slot.startUtc, timeZoneId),
          );
          const timeText =
            isTodayRange && idx === 0
              ? 'Bây giờ'
              : formatLocalTime(slot.startUtc, timeZoneId);

          return (
            <button
              key={slot.startUtc}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => setSelectedSlotUtc(slot.startUtc)}
              className={`flex min-w-[82px] shrink-0 cursor-pointer flex-col items-center rounded-2xl border px-2.5 py-3 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174B4A] ${
                isSelected
                  ? 'border-[#174B4A] bg-[#E8F0EA] shadow-xs'
                  : 'border-[#DCE2DD] bg-white hover:border-[#174B4A]/50 hover:bg-[#F7F5EF]/70'
              }`}
            >
              <span
                className={`text-[11px] font-bold tabular-nums ${
                  isSelected ? 'text-[#103B39]' : 'text-[#5B6E69]'
                }`}
              >
                {timeText}
              </span>
              <span
                className={`material-symbols-outlined my-2 text-[22px] ${visual.iconColorClass}`}
                aria-hidden="true"
              >
                {visual.icon}
              </span>
              <span className="text-sm font-black text-[#1C2928] tabular-nums">
                {formatTemp(slot.temperatureC)}
              </span>
              <span
                className={`mt-1.5 inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums ${
                  slot.rainMmPerHour >= 0.2 || slot.rainProbabilityPercent >= 40
                    ? 'text-sky-700'
                    : 'text-[#5B6E69]/75'
                }`}
              >
                <span className="material-symbols-outlined text-[11px]" aria-hidden="true">
                  water_drop
                </span>
                {Math.round(slot.rainProbabilityPercent)}%
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
