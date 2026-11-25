'use client';

import type {
  CurrentWeatherDto,
  DailyForecastPointDto,
  WeatherLocationDto,
} from '../types/weatherForecast';
import {
  classifyRainIntensity,
  classifyUvIndex,
  classifyWindSpeed,
  describeWeatherCode,
  formatDecimalVi,
  formatLocalFullDate,
  formatLocalTime,
  formatTemp,
  isNightHour,
} from '../utils/weatherFormat';

interface CurrentWeatherHeroProps {
  location: WeatherLocationDto;
  current: CurrentWeatherDto;
  todaySummary: DailyForecastPointDto | undefined;
  timeZoneId: string;
}

export function CurrentWeatherHero({
  location,
  current,
  todaySummary,
  timeZoneId,
}: CurrentWeatherHeroProps) {
  const isNight = isNightHour(current.observedAtUtc, timeZoneId);
  const visual = describeWeatherCode(current.weatherCode, current.thunderstorm, isNight);
  const rain = classifyRainIntensity(current.rainMmPerHour, current.thunderstorm);
  const uv = classifyUvIndex(current.uvIndex);
  const wind = classifyWindSpeed(current.windSpeedMps);

  const glowClass =
    visual.group === 'storm'
      ? 'bg-rose-400/20'
      : visual.group === 'rain'
        ? 'bg-sky-400/20'
        : visual.group === 'clear'
          ? 'bg-amber-300/20'
          : 'bg-teal-300/15';

  const hasNotableCondition =
    current.thunderstorm ||
    current.rainMmPerHour >= 2.5 ||
    current.uvIndex >= 8 ||
    current.windSpeedMps >= 10;

  return (
    <section
      aria-label={`Thời tiết hiện tại tại ${location.name}`}
      className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#174B4A]/40 bg-gradient-to-br from-[#0C2423] via-[#103B39] to-[#174B4A] p-6 text-white shadow-lg sm:p-7"
    >
      {/* Subtle atmospheric glow */}
      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl ${glowClass}`}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[#B96D4C]/15 blur-3xl"
        aria-hidden="true"
      />

      {/* Top location & timestamp metadata */}
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-[#CBE0D4]" aria-hidden="true">
              location_on
            </span>
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              {location.name}
            </h2>
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#E8F0EA]">
              {location.region}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#CBE0D4]/90">
            {location.subtitle} · {location.latitude.toFixed(2)}°B, {location.longitude.toFixed(2)}°Đ
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xs font-bold capitalize text-white">
            {formatLocalFullDate(current.observedAtUtc, timeZoneId)}
          </p>
          <p className="mt-0.5 text-[11px] text-[#CBE0D4]/85 tabular-nums">
            Quan trắc lúc {formatLocalTime(current.observedAtUtc, timeZoneId)} (GMT+7)
          </p>
        </div>
      </div>

      {/* Main Temperature & Condition Readout */}
      <div className="relative z-10 my-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xs sm:h-24 sm:w-24">
            <span
              className="material-symbols-outlined text-[48px] text-amber-200 sm:text-[56px]"
              aria-hidden="true"
            >
              {visual.icon}
            </span>
          </div>

          <div>
            <div className="flex items-start gap-1">
              <span
                data-testid="current-temperature"
                className="text-6xl font-black leading-none tracking-tighter text-white tabular-nums sm:text-7xl"
              >
                {formatTemp(current.temperatureC)}
              </span>
              <span className="mt-1.5 text-lg font-bold text-[#CBE0D4]">C</span>
            </div>
            <p className="mt-2 text-base font-bold text-white sm:text-lg">
              {visual.labelVi}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#E8F0EA] sm:flex-col sm:items-end sm:gap-1.5">
          <p className="font-semibold tabular-nums">
            Cảm giác như{' '}
            <strong className="text-white">{formatTemp(current.apparentTemperatureC)}</strong>
          </p>
          {todaySummary ? (
            <p className="font-semibold tabular-nums text-[#CBE0D4]">
              Cao nhất <strong className="text-white">{formatTemp(todaySummary.maxTempC)}</strong>
              {' · '}
              Thấp nhất <strong className="text-white">{formatTemp(todaySummary.minTempC)}</strong>
            </p>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white">
            <span
              className={`h-2 w-2 rounded-full ${
                rain.level === 'storm' || rain.level === 'heavy' || rain.level === 'extreme'
                  ? 'bg-rose-400'
                  : rain.level === 'moderate'
                    ? 'bg-amber-300'
                    : rain.level === 'light'
                      ? 'bg-sky-300'
                      : 'bg-emerald-400'
              }`}
            />
            <span>{rain.labelVi}</span>
          </span>
        </div>
      </div>

      {/* Inline threshold callout when notable weather occurs */}
      {hasNotableCondition ? (
        <div className="relative z-10 mb-5 flex items-start gap-2.5 rounded-2xl border border-amber-300/30 bg-amber-400/12 px-4 py-3 text-xs text-amber-100">
          <span className="material-symbols-outlined mt-0.5 shrink-0 text-base text-amber-300" aria-hidden="true">
            warning_amber
          </span>
          <p className="leading-relaxed">
            {current.thunderstorm
              ? 'Phát hiện điều kiện dông sét tại khu vực. Nên ưu tiên điểm tham quan trong nhà và theo dõi cập nhật theo giờ.'
              : current.rainMmPerHour >= 2.5
                ? `Lượng mưa hiện đạt ${formatDecimalVi(current.rainMmPerHour)} mm/h (${rain.labelVi.toLowerCase()}). ${rain.guidanceVi}`
                : current.windSpeedMps >= 10
                  ? `Gió mạnh ${wind.kmPerHour} km/h (${formatDecimalVi(current.windSpeedMps)} m/s). ${wind.guidanceVi}`
                  : `Chỉ số UV đạt mức ${uv.labelVi.toLowerCase()} (${current.uvIndex}). ${uv.guidanceVi}`}
          </p>
        </div>
      ) : null}

      {/* 4 Tomorrow.io Core Metrics Strip */}
      <div className="relative z-10 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/12 bg-white/8 px-3.5 py-3 backdrop-blur-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#CBE0D4]">
            <span className="material-symbols-outlined text-sm text-sky-300" aria-hidden="true">
              rainy
            </span>
            <span>Lượng mưa</span>
          </div>
          <p className="mt-1.5 text-base font-extrabold text-white tabular-nums">
            {formatDecimalVi(current.rainMmPerHour)} <span className="text-xs font-semibold text-[#CBE0D4]">mm/h</span>
          </p>
          <p className="mt-0.5 text-[11px] text-[#CBE0D4]/85 tabular-nums">
            Xác suất {Math.round(current.rainProbabilityPercent)}%
          </p>
        </div>

        <div className="rounded-2xl border border-white/12 bg-white/8 px-3.5 py-3 backdrop-blur-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#CBE0D4]">
            <span className="material-symbols-outlined text-sm text-amber-300" aria-hidden="true">
              wb_sunny
            </span>
            <span>Chỉ số UV</span>
          </div>
          <p className="mt-1.5 text-base font-extrabold text-white tabular-nums">
            {current.uvIndex} <span className="text-xs font-semibold text-[#CBE0D4]">/ 11+</span>
          </p>
          <p className="mt-0.5 text-[11px] text-[#CBE0D4]/85">{uv.labelVi}</p>
        </div>

        <div className="rounded-2xl border border-white/12 bg-white/8 px-3.5 py-3 backdrop-blur-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#CBE0D4]">
            <span className="material-symbols-outlined text-sm text-teal-300" aria-hidden="true">
              air
            </span>
            <span>Tốc độ gió</span>
          </div>
          <p className="mt-1.5 text-base font-extrabold text-white tabular-nums">
            {wind.kmPerHour} <span className="text-xs font-semibold text-[#CBE0D4]">km/h</span>
          </p>
          <p className="mt-0.5 text-[11px] text-[#CBE0D4]/85 tabular-nums">
            {formatDecimalVi(current.windSpeedMps)} m/s · {wind.labelVi}
          </p>
        </div>

        <div className="rounded-2xl border border-white/12 bg-white/8 px-3.5 py-3 backdrop-blur-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#CBE0D4]">
            <span className="material-symbols-outlined text-sm text-emerald-300" aria-hidden="true">
              humidity_percentage
            </span>
            <span>Độ ẩm</span>
          </div>
          <p className="mt-1.5 text-base font-extrabold text-white tabular-nums">
            {Math.round(current.humidityPercent)}%
          </p>
          <p className="mt-0.5 text-[11px] text-[#CBE0D4]/85 tabular-nums">
            Mây phủ {Math.round(current.cloudCoverPercent)}%
          </p>
        </div>
      </div>
    </section>
  );
}
