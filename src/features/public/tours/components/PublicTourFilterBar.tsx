'use client';

import { useState, type FormEvent } from 'react';

import type { TourCategoryDto, TourSearchState } from '../types/tour';
import { validateTourFilters } from '../utils/tourQuery';
import { publicSearchCopy, searchValidationCopy, type SearchLocale } from '../resources/publicSearch';

interface Props {
  locale?: SearchLocale;
  filters: TourSearchState;
  categories: TourCategoryDto[];
  loading: boolean;
  onApply: (state: TourSearchState) => void;
  onReset: (state: TourSearchState) => void;
}

const control = 'mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:border-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lightTeal';

export function PublicTourFilterBar({ filters, categories, loading, onApply, onReset, locale = 'vi' }: Props) {
  const copy = publicSearchCopy(locale);
  const [draft, setDraft] = useState(filters);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | undefined>();

  function fieldError(field: string) {
    return error && errorField === field ? (
      <span id={`uc24-error-${field}`} role="alert" className="mt-1 block text-red-700">
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

  const update = (key: keyof TourSearchState, value: string) => setDraft({ ...draft, [key]: value });

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

  return (
    <form onSubmit={submit} noValidate aria-label={copy.filters} className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-semibold text-slate-700">{copy.keyword}
          <input aria-label={copy.keyword} aria-invalid={errorField === 'keyword'} aria-describedby={errorField === 'keyword' ? 'uc24-error-keyword' : undefined} value={draft.keyword ?? ''} maxLength={300} className={control} onChange={(event) => update('keyword', event.target.value)} />
          {fieldError('keyword')}
        </label>
        <label className="text-sm font-semibold text-slate-700">{copy.destination}
          <input aria-label={copy.destination} aria-invalid={errorField === 'destination'} aria-describedby={errorField === 'destination' ? 'uc24-error-destination' : undefined} value={draft.destination} maxLength={300} className={control} onChange={(event) => update('destination', event.target.value)} />
          {fieldError('destination')}
        </label>
        <label className="text-sm font-semibold text-slate-700">{copy.start}
          <input aria-label={copy.start} aria-invalid={errorField === 'start'} aria-describedby={errorField === 'start' ? 'uc24-error-start' : undefined} type="date" lang={locale} value={draft.startDate ?? ''} className={control} onChange={(event) => update('startDate', event.target.value)} />
          {fieldError('start')}
        </label>
        <label className="text-sm font-semibold text-slate-700">{copy.end}
          <input aria-label={copy.end} aria-invalid={errorField === 'end'} aria-describedby={errorField === 'end' ? 'uc24-error-end' : undefined} type="date" lang={locale} value={draft.endDate ?? ''} className={control} onChange={(event) => update('endDate', event.target.value)} />
          {fieldError('end')}
        </label>
        <label className="text-sm font-semibold text-slate-700">{copy.min}
          <input aria-label={copy.min} aria-invalid={errorField === 'min'} aria-describedby={errorField === 'min' ? 'uc24-error-min' : undefined} type="number" min={0} value={draft.minPrice} className={control} onChange={(event) => update('minPrice', event.target.value)} />
          {fieldError('min')}
        </label>
        <label className="text-sm font-semibold text-slate-700">{copy.max}
          <input aria-label={copy.max} aria-invalid={errorField === 'max'} aria-describedby={errorField === 'max' ? 'uc24-error-max' : undefined} type="number" min={0} value={draft.maxPrice} className={control} onChange={(event) => update('maxPrice', event.target.value)} />
          {fieldError('max')}
        </label>
        <label className="text-sm font-semibold text-slate-700">{copy.duration}
          <input aria-label={copy.duration} aria-invalid={errorField === 'duration'} aria-describedby={errorField === 'duration' ? 'uc24-error-duration' : undefined} type="number" min={1} value={draft.durationDays ?? ''} className={control} onChange={(event) => update('durationDays', event.target.value)} />
          {fieldError('duration')}
        </label>
        <label className="text-sm font-semibold text-slate-700">{copy.category}
          <select aria-label={copy.category} value={draft.category ?? ''} className={control} onChange={(event) => update('category', event.target.value)}>
            <option value="">{copy.allCategories}</option>
            {categories.map((category) => <option key={category.categoryId} value={category.code}>{category.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">{copy.rating}
          <select aria-label={copy.rating} aria-invalid={errorField === 'rating'} aria-describedby={errorField === 'rating' ? 'uc24-error-rating' : undefined} value={draft.minimumRating ?? ''} className={control} onChange={(event) => update('minimumRating', event.target.value)}>
            <option value="">{copy.allRatings}</option><option value="3">3.0+</option><option value="4">4.0+</option><option value="4.5">4.5+</option>
          </select>
          {fieldError('rating')}
        </label>
        <label className="text-sm font-semibold text-slate-700">{copy.sort}
          <select aria-label={copy.sort} aria-invalid={errorField === 'sort'} aria-describedby={errorField === 'sort' ? 'uc24-error-sort' : undefined} value={draft.sort ?? ''} className={control} onChange={(event) => update('sort', event.target.value)}>
            <option value="">{copy.defaultSort}</option><option value="relevance">{copy.relevance}</option><option value="priceAsc">{copy.priceAsc}</option><option value="priceDesc">{copy.priceDesc}</option><option value="rating">{copy.ratingSort}</option><option value="departureDate">{copy.departure}</option>
          </select>
          {fieldError('sort')}
        </label>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" disabled={loading} className="min-h-11 rounded-xl bg-brand-teal px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-brightTeal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 disabled:opacity-60">{loading ? copy.loading : copy.search}</button>
        <button type="button" onClick={reset} className="min-h-11 rounded-xl border border-slate-300 px-5 py-2 text-sm font-bold transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2">{copy.clear}</button>
      </div>
    </form>
  );
}
