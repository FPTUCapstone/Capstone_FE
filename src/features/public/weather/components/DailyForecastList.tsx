'use client';

import type { DailyForecastPointDto } from '../types/weatherForecast';
import {
  classifyRainIntensity,
  classifyUvIndex,
  classifyWindSpeed,
  describeWeatherCode,
  formatDailyLabel,
  formatDecimalVi,
  formatTemp,
} from '../utils/weatherFormat';

interface DailyForecastListProps {
  daily: readonly DailyForecastPointDto[];
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  hourlyAvailableDates: ReadonlySet<string>;
}

export function DailyForecastList({
  daily,
  selectedDate,
  onSelectDate,
  hourlyAvailableDates,
}: DailyForecastListProps) {
  if (daily.length === 0) return null;

  const globalMin = Math.min(...daily.map((d) => d.minTempC));
  const globalMax = Math.max(...daily.map((d) => d.maxTempC));
  const tempSpan = Math.max(1, globalMax - globalMin);

  return (
    <section
      aria-label="Dự báo thời tiết 5 ngày tới"
      className="rounded-3xl border border-[#DCE2DD] bg-white p-5 shadow-2xs sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-2 pb-4 border-b border-[#DCE2DD]">
        <div>
          <h2 className="text-lg font-black tracking-tight text-[#1C2928]">
            Dự báo 5 ngày tới
          </h2>
          <p className="mt-0.5 text-xs text-[#5B6E69]">
            Phạm vi dự báo chuẩn Tomorrow.io — chọn từng ngày để xem tổng lượng mưa, UV và gió cực đại.
          </p>
        </div>
        <span className="text-[11px] font-semibold text-[#5B6E69] tabular-nums">
          Biên độ nhiệt {formatTemp(globalMin)} – {formatTemp(globalMax)}
        </span>
      </div>

      <div className="mt-3 divide-y divide-[#EFECE4]">
        {daily.map((day, idx) => {
          const isSelected = day.date === selectedDate;
          const labels = formatDailyLabel(day.date, idx);
          const visual = describeWeatherCode(day.weatherCode, day.thunderstorm);
          const rain = classifyRainIntensity(day.maxRainMmPerHour, day.thunderstorm);
          const uv = classifyUvIndex(day.maxUvIndex);
          const wind = classifyWindSpeed(day.maxWindSpeedMps);
          const hasHourly = hourlyAvailableDates.has(day.date);

          const leftPercent = ((day.minTempC - globalMin) / tempSpan) * 100;
          const widthPercent = Math.max(10, ((day.maxTempC - day.minTempC) / tempSpan) * 100);

          return (
            <div key={day.date} className="py-2 first:pt-1 last:pb-0">
              <button
                type="button"
                onClick={() => onSelectDate(day.date)}
                aria-expanded={isSelected}
                className={`flex w-full cursor-pointer flex-col gap-3 rounded-2xl px-3.5 py-3 text-left transition sm:flex-row sm:items-center sm:gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174B4A] ${
                  isSelected
                    ? 'bg-[#E8F0EA]/70 ring-1 ring-[#174B4A]/30'
                    : 'hover:bg-[#F7F5EF]'
                }`}
              >
                {/* Date */}
                <div className="flex items-center justify-between sm:w-28 sm:shrink-0 sm:block">
                  <p className="text-sm font-extrabold text-[#1C2928]">{labels.primary}</p>
                  <p className="text-xs font-semibold text-[#5B6E69] tabular-nums">{labels.secondary}</p>
                </div>

                {/* Condition + Rain */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={`material-symbols-outlined shrink-0 text-[24px] ${visual.iconColorClass}`}
                    aria-hidden="true"
                  >
                    {visual.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#1C2928]">{visual.labelVi}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#5B6E69] tabular-nums">
                      <span className="inline-flex items-center gap-0.5 text-sky-700">
                        <span className="material-symbols-outlined text-[13px]" aria-hidden="true">
                          water_drop
                        </span>
                        {Math.round(day.maxRainProbabilityPercent)}%
                        {day.maxRainMmPerHour >= 0.2 ? ` (${formatDecimalVi(day.maxRainMmPerHour)} mm/h)` : ''}
                      </span>
                      <span className="hidden md:inline">· UV {day.maxUvIndex}</span>
                      <span className="hidden md:inline">· Gió {wind.kmPerHour} km/h</span>
                    </div>
                  </div>
                </div>

                {/* Temperature Range Bar */}
                <div className="flex items-center gap-3 sm:w-52 sm:shrink-0">
                  <span className="w-8 text-right text-xs font-bold text-[#5B6E69] tabular-nums">
                    {formatTemp(day.minTempC)}
                  </span>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#EFECE4]">
                    <div
                      className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-[#174B4A] via-[#2B7A78] to-[#B96D4C]"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${Math.min(100 - leftPercent, widthPercent)}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-xs font-black text-[#1C2928] tabular-nums">
                    {formatTemp(day.maxTempC)}
                  </span>
                  <span
                    className={`material-symbols-outlined text-lg text-[#5B6E69] transition-transform duration-200 ${
                      isSelected ? 'rotate-180 text-[#174B4A]' : ''
                    }`}
                    aria-hidden="true"
                  >
                    expand_more
                  </span>
                </div>
              </button>

              {/* Expanded Daily Tomorrow.io Metrics Breakdown */}
              {isSelected ? (
                <div className="mt-2 rounded-2xl border border-[#DCE2DD] bg-[#F7F5EF]/80 px-4 py-3.5">
                  <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3 lg:grid-cols-6">
                    <div>
                      <p className="text-[11px] font-semibold text-[#5B6E69]">Tổng lượng mưa</p>
                      <p className="mt-0.5 font-extrabold text-[#1C2928] tabular-nums">
                        {formatDecimalVi(day.totalRainMm)} mm
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[#5B6E69]">Mưa cực đại</p>
                      <p className="mt-0.5 font-extrabold text-[#1C2928] tabular-nums">
                        {formatDecimalVi(day.maxRainMmPerHour)} mm/h · {rain.labelVi}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[#5B6E69]">Cảm giác cao nhất</p>
                      <p className="mt-0.5 font-extrabold text-[#1C2928] tabular-nums">
                        {formatTemp(day.maxApparentTempC)}C
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[#5B6E69]">UV cực đại</p>
                      <p className="mt-0.5 font-extrabold text-[#1C2928] tabular-nums">
                        {day.maxUvIndex} ({uv.labelVi})
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[#5B6E69]">Gió mạnh nhất</p>
                      <p className="mt-0.5 font-extrabold text-[#1C2928] tabular-nums">
                        {wind.kmPerHour} km/h ({formatDecimalVi(day.maxWindSpeedMps)} m/s)
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[#5B6E69]">Độ ẩm · Mặt trời</p>
                      <p className="mt-0.5 font-extrabold text-[#1C2928] tabular-nums">
                        {Math.round(day.humidityAvgPercent)}% · {day.sunriseTime}–{day.sunsetTime}
                      </p>
                    </div>
                  </div>
                  {hasHourly ? (
                    <p className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#174B4A]">
                      <span className="material-symbols-outlined text-sm" aria-hidden="true">
                        timeline
                      </span>
                      <span>Biểu đồ theo giờ phía trên đang đồng bộ dữ liệu cho ngày này.</span>
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
