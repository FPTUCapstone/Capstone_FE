'use client';

import type {
  CurrentWeatherDto,
  DailyForecastPointDto,
  HourlyForecastPointDto,
} from '../types/weatherForecast';
import {
  classifyRainIntensity,
  classifyUvIndex,
  classifyWindSpeed,
  findBestOutdoorWindow,
  formatDecimalVi,
} from '../utils/weatherFormat';

interface WeatherMetricsGridProps {
  current: CurrentWeatherDto;
  todaySummary: DailyForecastPointDto | undefined;
  todayHourly: readonly HourlyForecastPointDto[];
  timeZoneId: string;
}

export function WeatherMetricsGrid({
  current,
  todaySummary,
  todayHourly,
  timeZoneId,
}: WeatherMetricsGridProps) {
  const rain = classifyRainIntensity(current.rainMmPerHour, current.thunderstorm);
  const uv = classifyUvIndex(current.uvIndex);
  const wind = classifyWindSpeed(current.windSpeedMps);
  const bestWindow = findBestOutdoorWindow(todayHourly, timeZoneId);
  const uvPercent = Math.min(100, Math.round((Math.max(0, current.uvIndex) / 11) * 100));
  const rainProbPercent = Math.min(100, Math.max(0, Math.round(current.rainProbabilityPercent)));

  return (
    <section aria-label="Chi tiết chỉ số khí tượng" className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      {/* Rain & Precipitation */}
      <article className="flex flex-col justify-between rounded-2xl border border-[#DCE2DD] bg-white p-4 shadow-2xs">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#5B6E69]">
              <span className="material-symbols-outlined text-base text-sky-600" aria-hidden="true">
                water_drop
              </span>
              Mưa &amp; Xác suất
            </span>
            <span className={`shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold ${rain.badgeClass}`}>
              {rain.labelVi}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1C2928] tabular-nums">
              {formatDecimalVi(current.rainMmPerHour)}
            </span>
            <span className="text-xs font-semibold text-[#5B6E69]">mm/h</span>
            <span className="ml-auto text-xs font-bold text-sky-700 tabular-nums">
              {rainProbPercent}% xác suất
            </span>
          </div>

          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#EFECE4]">
            <div
              className="h-full rounded-full bg-sky-600 transition-all duration-300"
              style={{ width: `${Math.max(4, rainProbPercent)}%` }}
            />
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-[#5B6E69]">
          {rain.guidanceVi}
        </p>
      </article>

      {/* UV Index */}
      <article className="flex flex-col justify-between rounded-2xl border border-[#DCE2DD] bg-white p-4 shadow-2xs">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#5B6E69]">
              <span className="material-symbols-outlined text-base text-[#B96D4C]" aria-hidden="true">
                wb_sunny
              </span>
              Chỉ số UV
            </span>
            <span className={`shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold ${uv.badgeClass}`}>
              {uv.labelVi}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1C2928] tabular-nums">
              {current.uvIndex}
            </span>
            <span className="text-xs font-semibold text-[#5B6E69]">trên thang 11+</span>
            {todaySummary ? (
              <span className="ml-auto text-[11px] font-semibold text-[#5B6E69] tabular-nums">
                Đỉnh {todaySummary.maxUvIndex}
              </span>
            ) : null}
          </div>

          <div className="relative mt-2.5 h-2 w-full rounded-full bg-gradient-to-r from-[#174B4A] via-amber-400 via-65% to-rose-600">
            <span
              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#1C2928] shadow-xs transition-all duration-300"
              style={{ left: `${uvPercent}%` }}
              aria-hidden="true"
            />
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-[#5B6E69]">
          {uv.guidanceVi}
        </p>
      </article>

      {/* Wind & Atmosphere */}
      <article className="flex flex-col justify-between rounded-2xl border border-[#DCE2DD] bg-white p-4 shadow-2xs">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#5B6E69]">
              <span className="material-symbols-outlined text-base text-[#174B4A]" aria-hidden="true">
                air
              </span>
              Gió &amp; Tầm nhìn
            </span>
            <span className={`shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold ${wind.badgeClass}`}>
              {wind.labelVi}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1C2928] tabular-nums">
              {wind.kmPerHour}
            </span>
            <span className="text-xs font-semibold text-[#5B6E69]">km/h</span>
            <span className="text-xs font-medium text-[#5B6E69] tabular-nums">
              ({formatDecimalVi(current.windSpeedMps)} m/s)
            </span>
          </div>

          <div className="mt-2.5 flex items-center gap-4 text-[11px] font-semibold text-[#5B6E69] tabular-nums">
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-[#174B4A]" aria-hidden="true">
                visibility
              </span>
              Tầm nhìn {formatDecimalVi(current.visibilityKm)} km
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-[#174B4A]" aria-hidden="true">
                cloud
              </span>
              Mây {Math.round(current.cloudCoverPercent)}%
            </span>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-[#5B6E69]">
          {wind.guidanceVi}
        </p>
      </article>

      {/* Daylight & Best Outdoor Window */}
      <article className="flex flex-col justify-between rounded-2xl border border-[#DCE2DD] bg-white p-4 shadow-2xs">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#5B6E69]">
              <span className="material-symbols-outlined text-base text-[#B96D4C]" aria-hidden="true">
                schedule
              </span>
              Nhịp nắng trong ngày
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-[#F7F5EF] p-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-amber-600" aria-hidden="true">
                wb_twilight
              </span>
              <div>
                <p className="text-[10px] font-semibold text-[#5B6E69]">Bình minh</p>
                <p className="font-extrabold text-[#1C2928] tabular-nums">
                  {todaySummary?.sunriseTime ?? '05:56'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#B96D4C]" aria-hidden="true">
                nights_stay
              </span>
              <div>
                <p className="text-[10px] font-semibold text-[#5B6E69]">Hoàng hôn</p>
                <p className="font-extrabold text-[#1C2928] tabular-nums">
                  {todaySummary?.sunsetTime ?? '17:18'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3">
          {bestWindow ? (
            <>
              <p className="text-[11px] font-bold text-[#174B4A]">
                Khung giờ thuận lợi nhất: <span className="tabular-nums">{bestWindow.rangeLabel}</span>
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#5B6E69]">
                {bestWindow.summaryVi}
              </p>
            </>
          ) : (
            <p className="text-xs leading-relaxed text-[#5B6E69]">
              Dữ liệu khung giờ ngoài trời sẽ hiển thị khi có chuỗi dự báo ban ngày.
            </p>
          )}
        </div>
      </article>
    </section>
  );
}
