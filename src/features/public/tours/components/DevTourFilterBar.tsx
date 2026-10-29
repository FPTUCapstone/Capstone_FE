import { useState, type FormEvent } from 'react';

import { devTourSearchCopy as copy } from '../resources/en';
import type { DevTourCategory } from '../types/devTour';
import { DEV_TOUR_MODES, DEV_TOUR_SORTS, validateDevTourFilters, type DevTourSearchState } from '../utils/devTourQuery';

interface Props {
  filters: DevTourSearchState;
  categories: DevTourCategory[];
  onApply: (state: DevTourSearchState) => void;
  onReset: () => void;
}

const FIELDS = [
  ['keyword', 'text'], ['destination', 'text'], ['startDate', 'date'], ['endDate', 'date'],
  ['minPrice', 'number'], ['maxPrice', 'number'], ['durationDays', 'number'], ['minimumRating', 'number'],
] as const;
const CONTROL_CLASS = 'mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-teal-600';

export function DevTourFilterBar({ filters, categories, onApply, onReset }: Props) {
  const [draft, setDraft] = useState(filters);
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = { ...draft, page: 1 };
    const message = validateDevTourFilters(next);
    setError(message);
    if (!message) onApply(next);
  }

  return (
    <form onSubmit={submit} noValidate aria-label="Development tour filters" className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FIELDS.map(([key, type]) => (
          <label key={key} className="text-sm font-semibold text-slate-700">
            {copy[key]}
            <input name={key} type={type} value={draft[key]} min={key === 'durationDays' || key === 'minimumRating' ? 1 : 0} max={key === 'minimumRating' ? 5 : key === 'minPrice' || key === 'maxPrice' ? 9_999_999_999 : undefined} step={key === 'minimumRating' ? 0.1 : 1} maxLength={type === 'text' ? 300 : undefined} className={CONTROL_CLASS} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} />
          </label>
        ))}
        <label className="text-sm font-semibold text-slate-700">{copy.category}
          <select value={draft.category} className={CONTROL_CLASS} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>
            <option value="">{copy.allCategories}</option>
            {draft.category && !categories.some((category) => category.code === draft.category) && <option value={draft.category}>{draft.category}</option>}
            {categories.map((category) => <option key={category.categoryId} value={category.code}>{category.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">{copy.mode}
          <select value={draft.mode} className={CONTROL_CLASS} onChange={(event) => setDraft({ ...draft, mode: event.target.value })}>
            {DEV_TOUR_MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">{copy.sort}
          <select value={draft.sort} className={CONTROL_CLASS} onChange={(event) => setDraft({ ...draft, sort: event.target.value })}>
            <option value="">{copy.defaultSort}</option>
            {DEV_TOUR_SORTS.map((sort) => <option key={sort} value={sort}>{sort}</option>)}
          </select>
        </label>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" className="rounded-xl bg-teal-700 px-5 py-2 text-sm font-bold text-white hover:bg-teal-800 focus:outline-2 focus:outline-offset-2 focus:outline-teal-700">{copy.search}</button>
        <button type="button" onClick={onReset} className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-bold focus:outline-2 focus:outline-teal-700">{copy.clearFilters}</button>
      </div>
    </form>
  );
}
