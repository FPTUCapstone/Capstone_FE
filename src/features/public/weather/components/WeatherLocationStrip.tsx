'use client';

import type { WeatherLocation } from '../types/weatherForecast';
import { formatTemp } from '../utils/weatherFormat';

interface WeatherLocationStripProps {
  locations: readonly WeatherLocation[];
  temperaturesById: Readonly<Record<string, number>>;
  selectedLocationId: string | null;
  onSelectLocation: (location: WeatherLocation) => void;
}

export function WeatherLocationStrip({
  locations,
  temperaturesById,
  selectedLocationId,
  onSelectLocation,
}: WeatherLocationStripProps) {
  return (
    <section
      aria-label="Địa điểm gợi ý nhanh"
      className="flex flex-wrap items-center gap-2"
    >
      <span className="shrink-0 text-xs font-semibold text-[#5B6E69]">
        Gợi ý nhanh:
      </span>

      <div className="flex flex-wrap items-center gap-2">
        {locations.map((loc) => {
          const isSelected = Boolean(loc.id && loc.id === selectedLocationId);
          const temp = loc.id ? temperaturesById[loc.id] : undefined;

          return (
            <button
              key={loc.id ?? loc.name}
              type="button"
              onClick={() => onSelectLocation(loc)}
              aria-pressed={isSelected}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174B4A] ${
                isSelected
                  ? 'border-[#103B39] bg-[#103B39] text-white shadow-xs'
                  : 'border-[#DCE2DD] bg-white text-[#1C2928] shadow-2xs hover:border-[#174B4A]/60 hover:bg-[#E8F0EA]/60'
              }`}
            >
              <span>{loc.name}</span>
              {temp !== undefined ? (
                <span
                  className={`tabular-nums ${
                    isSelected ? 'text-[#CBE0D4]' : 'text-[#5B6E69]'
                  }`}
                >
                  · {formatTemp(temp)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
