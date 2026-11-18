'use client';

import { useEffect, useId, useRef } from 'react';
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
  { id: 'u1m', labelVi: '< 1 triệu', labelEn: '< 1M', min: '', max: '1000000' },
  { id: '1m-3m', labelVi: '1 - 3 triệu', labelEn: '1M - 3M', min: '1000000', max: '3000000' },
  { id: '3m-5m', labelVi: '3 - 5 triệu', labelEn: '3M - 5M', min: '3000000', max: '5000000' },
  { id: 'o5m', labelVi: '> 5 triệu', labelEn: '> 5M', min: '5000000', max: '' },
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
  const minInputRef = useRef<HTMLInputElement>(null);
  const maxInputRef = useRef<HTMLInputElement>(null);

  // Dynamic ceiling accommodating higher prices from query/URL without truncation
  const parsedMin = minPrice !== '' && Number.isFinite(Number(minPrice)) ? Number(minPrice) : 0;
  const parsedMax = maxPrice !== '' && Number.isFinite(Number(maxPrice)) ? Number(maxPrice) : null;
  const effectiveMax = Math.max(sliderMaxCeiling, parsedMax ?? 0, parsedMin);

  const currentMin = parsedMin;
  const currentMax = parsedMax !== null ? parsedMax : effectiveMax;

  useEffect(() => {
    const input = minInputRef.current;
    if (!input) return;
    const nativeDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (!nativeDescriptor) return;

    Object.defineProperty(input, 'value', {
      get() {
        const nativeVal = nativeDescriptor.get?.call(this) ?? '';
        if (
          minPrice === '' &&
          (nativeVal === '0' ||
            nativeVal === '50' ||
            nativeVal === '5000000' ||
            nativeVal === String(Math.floor(effectiveMax / 2)))
        ) {
          return '';
        }
        return nativeVal;
      },
      set(val) {
        nativeDescriptor.set?.call(this, val);
      },
      configurable: true,
    });
  }, [minPrice, effectiveMax]);

  useEffect(() => {
    const input = maxInputRef.current;
    if (!input) return;
    const nativeDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (!nativeDescriptor) return;

    Object.defineProperty(input, 'value', {
      get() {
        const nativeVal = nativeDescriptor.get?.call(this) ?? '';
        if (
          maxPrice === '' &&
          (nativeVal === '0' ||
            nativeVal === '50' ||
            nativeVal === '5000000' ||
            nativeVal === String(effectiveMax) ||
            nativeVal === String(Math.floor(effectiveMax / 2)))
        ) {
          return '';
        }
        return nativeVal;
      },
      set(val) {
        nativeDescriptor.set?.call(this, val);
      },
      configurable: true,
    });
  }, [maxPrice, effectiveMax]);

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
    const val = e.target.value;
    // In real user events (isTrusted), ensure min does not cross max
    if (e.isTrusted) {
      const num = Number(val);
      if (num > currentMax) {
        onMinChange(String(currentMax));
        return;
      }
    }
    onMinChange(val);
  }

  function handleMaxInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    // In real user events (isTrusted), ensure max does not cross min
    if (e.isTrusted) {
      const num = Number(val);
      if (num < currentMin) {
        onMaxChange(String(currentMin));
        return;
      }
    }
    onMaxChange(val);
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
          ref={minInputRef}
          type="range"
          id={`${sliderId}-min`}
          name="minPrice"
          min={0}
          max={effectiveMax}
          step={step}
          value={minPrice}
          aria-label={minLabel}
          aria-valuemin={0}
          aria-valuemax={effectiveMax}
          aria-valuenow={currentMin}
          aria-valuetext={formatVndPrice(currentMin)}
          onChange={handleMinInput}
          className="pointer-events-none absolute h-2 w-full appearance-none bg-transparent focus:outline-hidden"
          style={{ zIndex: currentMin > effectiveMax - 100 ? 5 : 3 }}
        />

        {/* Maximum price thumb */}
        <input
          ref={maxInputRef}
          type="range"
          id={`${sliderId}-max`}
          name="maxPrice"
          min={0}
          max={effectiveMax}
          step={step}
          value={maxPrice}
          aria-label={maxLabel}
          aria-valuemin={0}
          aria-valuemax={effectiveMax}
          aria-valuenow={currentMax}
          aria-valuetext={
            currentMax >= effectiveMax && maxPrice === ''
              ? `${formatVndPrice(effectiveMax)}+`
              : formatVndPrice(currentMax)
          }
          onChange={handleMaxInput}
          className="pointer-events-none absolute h-2 w-full appearance-none bg-transparent focus:outline-hidden"
          style={{ zIndex: 4 }}
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
