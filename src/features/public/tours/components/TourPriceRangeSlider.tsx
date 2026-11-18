'use client';

import { useId } from 'react';
import type { SearchLocale } from '../resources/publicSearch';
import { formatVndPrice } from '../utils/tourQuery';

export interface TourPriceRangeSliderProps {
  minPrice: string;
  maxPrice: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onRangeChange?: (min: string, max: string) => void;
  locale?: SearchLocale;
  sliderMaxCeiling?: number;
  step?: number;
  error?: string | null;
  minLabel?: string;
  maxLabel?: string;
}

const DEFAULT_CEILING = 10_000_000;
const DEFAULT_STEP = 100_000;

interface PricePreset {
  id: string;
  labelVi: string;
  labelEn: string;
  min: string;
  max: string;
}

const PRESETS: PricePreset[] = [
  { id: 'all', labelVi: 'Tất cả', labelEn: 'All', min: '', max: '' },
  { id: 'u1m', labelVi: '≤ 1 triệu', labelEn: '≤ 1M', min: '', max: '1000000' },
  { id: '1m-3m', labelVi: '1 - 3 triệu', labelEn: '1M - 3M', min: '1000000', max: '3000000' },
  { id: '3m-5m', labelVi: '3 - 5 triệu', labelEn: '3M - 5M', min: '3000000', max: '5000000' },
  { id: 'o5m', labelVi: '≥ 5 triệu', labelEn: '≥ 5M', min: '5000000', max: '' },
];

export function TourPriceRangeSlider({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
  onRangeChange,
  locale = 'vi',
  sliderMaxCeiling = DEFAULT_CEILING,
  step = DEFAULT_STEP,
  error,
  minLabel = locale === 'vi' ? 'Giá tối thiểu' : 'Minimum price',
  maxLabel = locale === 'vi' ? 'Giá tối đa' : 'Maximum price',
}: TourPriceRangeSliderProps) {
  const sliderId = useId();

  // Dynamic ceiling accommodating higher prices from query/URL without truncation
  const parsedMin = minPrice !== '' && Number.isFinite(Number(minPrice)) ? Math.max(0, Number(minPrice)) : 0;
  const parsedMax = maxPrice !== '' && Number.isFinite(Number(maxPrice)) ? Math.max(0, Number(maxPrice)) : null;
  const effectiveMax = Math.max(sliderMaxCeiling, parsedMax ?? 0, parsedMin);

  const currentMin = parsedMin;
  const currentMax = parsedMax !== null ? parsedMax : effectiveMax;

  // Track bar percentages (0 to 100)
  const minPercent = effectiveMax > 0 ? Math.min(100, Math.max(0, (currentMin / effectiveMax) * 100)) : 0;
  const maxPercent = effectiveMax > 0 ? Math.min(100, Math.max(0, (currentMax / effectiveMax) * 100)) : 100;

  // Selected range text representation
  let rangeDisplayText = locale === 'vi' ? 'Tất cả mức giá' : 'Any price';
  if (minPrice !== '' && maxPrice !== '') {
    rangeDisplayText =
      minPrice === maxPrice
        ? formatVndPrice(currentMin)
        : `${formatVndPrice(currentMin)} – ${formatVndPrice(currentMax)}`;
  } else if (minPrice !== '' && maxPrice === '') {
    rangeDisplayText = `≥ ${formatVndPrice(currentMin)}`;
  } else if (minPrice === '' && maxPrice !== '') {
    rangeDisplayText = `≤ ${formatVndPrice(currentMax)}`;
  }

  const isFiltered = minPrice !== '' || maxPrice !== '';

  function handleMinInput(e: React.ChangeEvent<HTMLInputElement>) {
    const rawVal = e.target.value;
    const num = Number(rawVal);
    if (!Number.isFinite(num)) {
      onMinChange(rawVal);
      return;
    }
    // Prevent min thumb from crossing max thumb (clamping to max)
    const upperLimit = parsedMax !== null ? parsedMax : effectiveMax;
    if (num > upperLimit) {
      onMinChange(String(upperLimit));
      return;
    }
    onMinChange(String(num));
  }

  function handleMaxInput(e: React.ChangeEvent<HTMLInputElement>) {
    const rawVal = e.target.value;
    const num = Number(rawVal);
    if (!Number.isFinite(num)) {
      onMaxChange(rawVal);
      return;
    }
    // Prevent max thumb from crossing min thumb (clamping to min)
    if (num < parsedMin) {
      onMaxChange(String(parsedMin));
      return;
    }
    onMaxChange(String(num));
  }

  function applyPreset(presetMin: string, presetMax: string) {
    if (onRangeChange) {
      onRangeChange(presetMin, presetMax);
    } else {
      onMinChange(presetMin);
      onMaxChange(presetMax);
    }
  }

  function handleResetPrice() {
    applyPreset('', '');
  }

  const isPresetActive = (preset: PricePreset) => {
    return minPrice === preset.min && maxPrice === preset.max;
  };

  const isAtSameValue = currentMin === currentMax;
  const minZIndex = isAtSameValue
    ? currentMin >= effectiveMax / 2 ? 5 : 3
    : currentMin > effectiveMax - 100 ? 5 : 3;
  const maxZIndex = isAtSameValue
    ? currentMin >= effectiveMax / 2 ? 3 : 5
    : 4;

  return (
    <div className="space-y-3">
      {/* Price header with formatted values and reset */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-[#1D2D2B]" id={`${sliderId}-label`}>
          {rangeDisplayText}
        </span>
        {isFiltered && (
          <button
            type="button"
            onClick={handleResetPrice}
            className="text-[11px] font-semibold text-[#0D5754] hover:text-[#094743] hover:underline cursor-pointer"
          >
            {locale === 'vi' ? 'Đặt lại giá' : 'Reset price'}
          </button>
        )}
      </div>

      {/* Dual slider track container */}
      <div className="dual-range-slider relative flex h-7 items-center">
        {/* Background track */}
        <div className="absolute h-2 w-full rounded-full bg-[#DCE5E2]" />

        {/* Active range bar between min and max */}
        <div
          className="absolute h-2 rounded-full bg-[#0D5754] transition-all"
          style={{
            left: `${Math.min(minPercent, maxPercent)}%`,
            width: `${Math.abs(maxPercent - minPercent)}%`,
          }}
        />

        {/* Minimum price thumb */}
        <input
          type="range"
          id={`${sliderId}-min`}
          name="minPrice"
          min={0}
          max={effectiveMax}
          step={step}
          value={minPrice !== '' ? parsedMin : 0}
          aria-label={minLabel}
          aria-valuemin={0}
          aria-valuemax={effectiveMax}
          aria-valuenow={parsedMin}
          aria-valuetext={
            minPrice !== ''
              ? formatVndPrice(currentMin)
              : (locale === 'vi' ? 'Không giới hạn dưới' : 'No minimum')
          }
          onChange={handleMinInput}
          className="pointer-events-none absolute h-2 w-full appearance-none bg-transparent focus:outline-hidden"
          style={{ zIndex: minZIndex }}
        />

        {/* Maximum price thumb */}
        <input
          type="range"
          id={`${sliderId}-max`}
          name="maxPrice"
          min={0}
          max={effectiveMax}
          step={step}
          value={maxPrice !== '' ? (parsedMax ?? effectiveMax) : effectiveMax}
          aria-label={maxLabel}
          aria-valuemin={0}
          aria-valuemax={effectiveMax}
          aria-valuenow={parsedMax !== null ? parsedMax : effectiveMax}
          aria-valuetext={
            maxPrice !== ''
              ? (currentMax >= effectiveMax && maxPrice === ''
                  ? `${formatVndPrice(effectiveMax)}+`
                  : formatVndPrice(currentMax))
              : (locale === 'vi' ? 'Không giới hạn trên' : 'No maximum')
          }
          onChange={handleMaxInput}
          className="pointer-events-none absolute h-2 w-full appearance-none bg-transparent focus:outline-hidden"
          style={{ zIndex: maxZIndex }}
        />
      </div>

      {/* Boundaries indication */}
      <div className="flex justify-between text-[11px] text-[#61736F]">
        <span>0 ₫</span>
        <span>{formatVndPrice(effectiveMax)}+</span>
      </div>

      {/* Preset price band chips */}
      <div className="flex flex-wrap gap-1.5 pt-1" role="group" aria-label="Price range presets">
        {PRESETS.map((preset) => {
          const active = isPresetActive(preset);
          const label = locale === 'vi' ? preset.labelVi : preset.labelEn;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.min, preset.max)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer border ${
                active
                  ? 'border-[#0D5754] bg-[#0D5754] text-white shadow-xs'
                  : 'border-[#DCE5E2] bg-white text-[#61736F] hover:bg-[#F5F7F6] hover:text-[#1D2D2B]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Field error display */}
      {error && (
        <p role="alert" className="mt-1 text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
