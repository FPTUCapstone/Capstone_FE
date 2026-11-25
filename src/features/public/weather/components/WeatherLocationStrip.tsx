'use client';

import type { WeatherLocationPreview } from '../types/weatherForecast';
import { describeWeatherCode, formatTemp } from '../utils/weatherFormat';

interface WeatherLocationStripProps {
  previews: readonly WeatherLocationPreview[];
  selectedLocationId: string;
  onSelectLocation: (locationId: string) => void;
}

export function WeatherLocationStrip({
  previews,
  selectedLocationId,
  onSelectLocation,
}: WeatherLocationStripProps) {
  return (
    <section aria-label="Chọn điểm đến Miền Trung" className="w-full">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {previews.map((item) => {
          const isSelected = item.location.id === selectedLocationId;
          const visual = describeWeatherCode(item.weatherCode, item.thunderstorm);
          const hasRain = item.rainMmPerHour >= 0.2 || item.rainProbabilityPercent >= 40;

          return (
            <button
              key={item.location.id}
              type="button"
              onClick={() => onSelectLocation(item.location.id)}
              aria-pressed={isSelected}
              className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174B4A] ${
                isSelected
                  ? 'border-[#103B39] bg-[#103B39] text-white shadow-md'
                  : 'border-[#DCE2DD] bg-white text-[#1C2928] shadow-2xs hover:-translate-y-0.5 hover:border-[#174B4A]/60 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`truncate text-sm font-extrabold tracking-tight ${
                        isSelected ? 'text-white' : 'text-[#1C2928]'
                      }`}
                    >
                      {item.location.name}
                    </span>
                  </div>
                  <p
                    className={`mt-0.5 truncate text-[11px] font-medium ${
                      isSelected ? 'text-[#CBE0D4]' : 'text-[#5B6E69]'
                    }`}
                  >
                    {item.location.elevationM >= 200
                      ? `Độ cao ${item.location.elevationM.toLocaleString('vi-VN')}m`
                      : item.location.region}
                  </p>
                </div>

                <span
                  className={`material-symbols-outlined shrink-0 text-[22px] ${
                    isSelected ? 'text-amber-200' : visual.iconColorClass
                  }`}
                  aria-hidden="true"
                >
                  {visual.icon}
                </span>
              </div>

              <div className="mt-3 flex items-end justify-between gap-2">
                <span
                  className={`text-2xl font-black leading-none tracking-tight tabular-nums ${
                    isSelected ? 'text-white' : 'text-[#1C2928]'
                  }`}
                >
                  {formatTemp(item.temperatureC)}
                </span>

                <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                  {hasRain ? (
                    <span
                      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 tabular-nums ${
                        isSelected
                          ? 'bg-white/15 text-sky-200'
                          : 'bg-sky-50 text-sky-800 border border-sky-200/80'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[12px]" aria-hidden="true">
                        water_drop
                      </span>
                      {Math.round(item.rainProbabilityPercent)}%
                    </span>
                  ) : (
                    <span
                      className={`truncate ${
                        isSelected ? 'text-[#E8F0EA]/90' : 'text-[#5B6E69]'
                      }`}
                    >
                      {visual.shortLabelVi}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
