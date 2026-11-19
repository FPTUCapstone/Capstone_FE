'use client';

import { useState, type FormEvent } from 'react';

import type { TourCategoryDto, TourSearchState } from '../types/tour';
import { validateTourFilters } from '../utils/tourQuery';
import { publicSearchCopy, searchValidationCopy, type SearchLocale } from '../resources/publicSearch';
import { TourPriceRangeSlider } from './TourPriceRangeSlider';

interface Props {
  locale?: SearchLocale;
  filters: TourSearchState;
  categories: TourCategoryDto[];
  loading: boolean;
  onApply: (state: TourSearchState) => void;
  onReset: (state: TourSearchState) => void;
  className?: string;
}

const inputControl =
  'mt-1.5 block min-h-11 w-full rounded-xl border border-[#DCE5E2] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#1D2D2B] placeholder:text-[#61736F] transition focus:border-[#0D5754] focus:ring-2 focus:ring-[#0D5754]/20 focus:outline-hidden';

export function PublicTourFilterBar({
  filters,
  categories,
  loading,
  onApply,
  onReset,
  locale = 'vi',
  className = '',
}: Props) {
  const copy = publicSearchCopy(locale);
  const [draft, setDraft] = useState(filters);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | undefined>();

  function fieldError(field: string) {
    return error && errorField === field ? (
      <span id={`uc24-error-${field}`} role="alert" className="mt-1 block text-xs font-semibold text-red-600">
        {searchValidationCopy(error, locale)}
      </span>
    ) : null;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = { ...draft, page: 1 };
    const validation = validateTourFilters(next);
    setError(validation.errorMessage ?? null);
    setErrorField(validation.errorField);
    if (validation.isValid) onApply(next);
  }

  const update = (key: keyof TourSearchState, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  function reset() {
    const next: TourSearchState = {
      destination: '',
      departureDate: '',
      minPrice: '',
      maxPrice: '',
      keyword: (draft.keyword ?? '').trim(),
      startDate: '',
      endDate: '',
      durationDays: '',
      category: '',
      minimumRating: '',
      sort: '',
      page: 1,
      pageSize: 20,
    };
    setDraft(next);
    setError(null);
    setErrorField(undefined);
    onReset(next);
  }

  const hasAnyFilter = Boolean(
    draft.destination ||
    draft.startDate ||
    draft.endDate ||
    draft.minPrice ||
    draft.maxPrice ||
    draft.durationDays ||
    draft.category ||
    draft.minimumRating ||
    draft.sort
  );

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-label={copy.filters}
      className={`rounded-2xl border border-[#DCE5E2] bg-white p-5 sm:p-6 shadow-xs ${className}`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-[#DCE5E2] pb-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-[#0D5754]" aria-hidden="true">
            tune
          </span>
          <h2 className="text-sm font-extrabold tracking-tight uppercase text-[#1D2D2B]">
            {copy.filters}
          </h2>
        </div>
        {hasAnyFilter && (
          <button
            type="button"
            onClick={reset}
            className="text-xs font-semibold text-[#61736F] hover:text-[#1D2D2B] hover:underline cursor-pointer"
          >
            {locale === 'vi' ? 'Đặt lại' : 'Reset'}
          </button>
        )}
      </div>

      {/* Global Filter Error Banner if present */}
      {error && !['keyword', 'destination', 'start', 'end', 'min', 'max', 'duration', 'rating', 'sort'].includes(errorField ?? '') && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {searchValidationCopy(error, locale)}
        </div>
      )}

      <div className="space-y-5">
        {/* Keyword Search */}
        <div>
          <label htmlFor="filter-keyword" className="block text-xs font-bold text-[#1D2D2B]">
            {copy.keyword}
          </label>
          <div className="relative mt-1">
            <span
              className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#61736F] text-base"
              aria-hidden="true"
            >
              search
            </span>
            <input
              id="filter-keyword"
              aria-label={copy.keyword}
              aria-invalid={errorField === 'keyword'}
              aria-describedby={errorField === 'keyword' ? 'uc24-error-keyword' : undefined}
              value={draft.keyword ?? ''}
              maxLength={300}
              placeholder={locale === 'vi' ? 'Tên tour, trải nghiệm...' : 'Tour name, experience...'}
              className={`${inputControl} pl-9`}
              onChange={(event) => update('keyword', event.target.value)}
            />
          </div>
          {fieldError('keyword')}
        </div>

        {/* Destination Search */}
        <div>
          <label htmlFor="filter-destination" className="block text-xs font-bold text-[#1D2D2B]">
            {copy.destination}
          </label>
          <div className="relative mt-1">
            <span
              className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#61736F] text-base"
              aria-hidden="true"
            >
              location_on
            </span>
            <input
              id="filter-destination"
              aria-label={copy.destination}
              aria-invalid={errorField === 'destination'}
              aria-describedby={errorField === 'destination' ? 'uc24-error-destination' : undefined}
              value={draft.destination}
              maxLength={300}
              placeholder={locale === 'vi' ? 'Hội An, Đà Nẵng, Huế...' : 'Hoi An, Da Nang, Hue...'}
              className={`${inputControl} pl-9`}
              onChange={(event) => update('destination', event.target.value)}
            />
          </div>
          {fieldError('destination')}
        </div>

        {/* Departure Date Range */}
        <div className="space-y-3 border-t border-[#DCE5E2] pt-4">
          <span className="block text-xs font-bold text-[#1D2D2B]">
            {locale === 'vi' ? 'Thời gian khởi hành' : 'Departure Schedule'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="filter-start-date" className="block text-[11px] font-semibold text-[#61736F]">
                {copy.start}
              </label>
              <input
                id="filter-start-date"
                aria-label={copy.start}
                aria-invalid={errorField === 'start'}
                aria-describedby={errorField === 'start' ? 'uc24-error-start' : undefined}
                type="date"
                lang={locale}
                value={draft.startDate ?? ''}
                className={inputControl}
                onChange={(event) => update('startDate', event.target.value)}
              />
              {fieldError('start')}
            </div>
            <div>
              <label htmlFor="filter-end-date" className="block text-[11px] font-semibold text-[#61736F]">
                {copy.end}
              </label>
              <input
                id="filter-end-date"
                aria-label={copy.end}
                aria-invalid={errorField === 'end'}
                aria-describedby={errorField === 'end' ? 'uc24-error-end' : undefined}
                type="date"
                lang={locale}
                value={draft.endDate ?? ''}
                className={inputControl}
                onChange={(event) => update('endDate', event.target.value)}
              />
              {fieldError('end')}
            </div>
          </div>
        </div>

        {/* Price Range Slider (Mandatory Dual-Thumb Requirement) */}
        <div className="border-t border-[#DCE5E2] pt-4">
          <span className="block text-xs font-bold text-[#1D2D2B] mb-2">
            {locale === 'vi' ? 'Khoảng giá (VNĐ)' : 'Price Range (VND)'}
          </span>
          <TourPriceRangeSlider
            locale={locale}
            minPrice={draft.minPrice}
            maxPrice={draft.maxPrice}
            minLabel={copy.min}
            maxLabel={copy.max}
            onMinChange={(val) => update('minPrice', val)}
            onMaxChange={(val) => update('maxPrice', val)}
            onRangeChange={(min, max) => setDraft({ ...draft, minPrice: min, maxPrice: max })}
          />
          {fieldError('min')}
          {fieldError('max')}
        </div>

        {/* Tour Duration */}
        <div className="border-t border-[#DCE5E2] pt-4">
          <label htmlFor="filter-duration" className="block text-xs font-bold text-[#1D2D2B]">
            {copy.duration}
          </label>
          <input
            id="filter-duration"
            aria-label={copy.duration}
            aria-invalid={errorField === 'duration'}
            aria-describedby={errorField === 'duration' ? 'uc24-error-duration' : undefined}
            type="number"
            min={1}
            max={30}
            placeholder={locale === 'vi' ? 'Số ngày (vd: 3)' : 'Number of days (e.g. 3)'}
            value={draft.durationDays ?? ''}
            className={inputControl}
            onChange={(event) => update('durationDays', event.target.value)}
          />
          {fieldError('duration')}
        </div>

        {/* Tour Category */}
        <div className="border-t border-[#DCE5E2] pt-4">
          <label htmlFor="filter-category" className="block text-xs font-bold text-[#1D2D2B]">
            {copy.category}
          </label>
          <select
            id="filter-category"
            aria-label={copy.category}
            value={draft.category ?? ''}
            className={inputControl}
            onChange={(event) => update('category', event.target.value)}
          >
            <option value="">{copy.allCategories}</option>
            {categories.map((cat) => (
              <option key={cat.categoryId} value={cat.code}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Minimum Rating */}
        <div className="border-t border-[#DCE5E2] pt-4">
          <label htmlFor="filter-rating" className="block text-xs font-bold text-[#1D2D2B]">
            {copy.rating}
          </label>
          <select
            id="filter-rating"
            aria-label={copy.rating}
            aria-invalid={errorField === 'rating'}
            aria-describedby={errorField === 'rating' ? 'uc24-error-rating' : undefined}
            value={draft.minimumRating ?? ''}
            className={inputControl}
            onChange={(event) => update('minimumRating', event.target.value)}
          >
            <option value="">{copy.allRatings}</option>
            <option value="3">3.0+ ⭐</option>
            <option value="4">4.0+ ⭐</option>
            <option value="4.5">4.5+ ⭐</option>
          </select>
          {fieldError('rating')}
        </div>

        {/* Sort Order */}
        <div className="border-t border-[#DCE5E2] pt-4">
          <label htmlFor="filter-sort" className="block text-xs font-bold text-[#1D2D2B]">
            {copy.sort}
          </label>
          <select
            id="filter-sort"
            aria-label={copy.sort}
            aria-invalid={errorField === 'sort'}
            aria-describedby={errorField === 'sort' ? 'uc24-error-sort' : undefined}
            value={draft.sort ?? ''}
            className={inputControl}
            onChange={(event) => update('sort', event.target.value)}
          >
            <option value="">{copy.defaultSort}</option>
            <option value="relevance">{copy.relevance}</option>
            <option value="priceAsc">{copy.priceAsc}</option>
            <option value="priceDesc">{copy.priceDesc}</option>
            <option value="rating">{copy.ratingSort}</option>
            <option value="departureDate">{copy.departure}</option>
          </select>
          {fieldError('sort')}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5 border-t border-[#DCE5E2] pt-5">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0D5754] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-[#094743] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5754] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">
            search
          </span>
          {loading ? copy.loading : copy.search}
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center rounded-xl border border-[#DCE5E2] bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-[#61736F] transition hover:bg-[#F5F7F6] hover:text-[#1D2D2B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5754] cursor-pointer"
        >
          {copy.clear}
        </button>
      </div>
    </form>
  );
}
