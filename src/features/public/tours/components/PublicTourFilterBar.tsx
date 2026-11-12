'use client';

import { useState, type FormEvent } from 'react';

import type { TourCategoryDto, TourSearchState } from '../types/tour';
import { validateTourFilters } from '../utils/tourQuery';

interface Props {
  filters: TourSearchState;
  categories: TourCategoryDto[];
  loading: boolean;
  onApply: (state: TourSearchState) => void;
  onReset: (state: TourSearchState) => void;
}

const control = 'mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:border-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lightTeal';

export function PublicTourFilterBar({ filters, categories, loading, onApply, onReset }: Props) {
  const [draft, setDraft] = useState(filters);
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = { ...draft, page: 1 };
    const validation = validateTourFilters(next);
    setError(validation.errorMessage ?? null);
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
    onReset(next);
  }

  return (
    <form onSubmit={submit} noValidate aria-label="Bộ lọc tìm kiếm tour" className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-semibold text-slate-700">Từ khóa
          <input aria-label="Từ khóa" value={draft.keyword ?? ''} maxLength={300} className={control} onChange={(event) => update('keyword', event.target.value)} />
        </label>
        <label className="text-sm font-semibold text-slate-700">Điểm đến / Khu vực
          <input aria-label="Điểm đến / Khu vực" value={draft.destination} maxLength={300} className={control} onChange={(event) => update('destination', event.target.value)} />
        </label>
        <label className="text-sm font-semibold text-slate-700">Từ ngày
          <input aria-label="Từ ngày" type="date" value={draft.startDate ?? ''} className={control} onChange={(event) => update('startDate', event.target.value)} />
        </label>
        <label className="text-sm font-semibold text-slate-700">Đến ngày
          <input aria-label="Đến ngày" type="date" value={draft.endDate ?? ''} className={control} onChange={(event) => update('endDate', event.target.value)} />
        </label>
        <label className="text-sm font-semibold text-slate-700">Giá tối thiểu
          <input aria-label="Giá tối thiểu" type="number" min={0} value={draft.minPrice} className={control} onChange={(event) => update('minPrice', event.target.value)} />
        </label>
        <label className="text-sm font-semibold text-slate-700">Giá tối đa
          <input aria-label="Giá tối đa" type="number" min={0} value={draft.maxPrice} className={control} onChange={(event) => update('maxPrice', event.target.value)} />
        </label>
        <label className="text-sm font-semibold text-slate-700">Thời lượng (ngày)
          <input aria-label="Thời lượng (ngày)" type="number" min={1} value={draft.durationDays ?? ''} className={control} onChange={(event) => update('durationDays', event.target.value)} />
        </label>
        <label className="text-sm font-semibold text-slate-700">Danh mục
          <select aria-label="Danh mục" value={draft.category ?? ''} className={control} onChange={(event) => update('category', event.target.value)}>
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => <option key={category.categoryId} value={category.code}>{category.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">Đánh giá tối thiểu
          <select aria-label="Đánh giá tối thiểu" value={draft.minimumRating ?? ''} className={control} onChange={(event) => update('minimumRating', event.target.value)}>
            <option value="">Mọi đánh giá</option><option value="3">3.0+</option><option value="4">4.0+</option><option value="4.5">4.5+</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">Sắp xếp
          <select aria-label="Sắp xếp" value={draft.sort ?? ''} className={control} onChange={(event) => update('sort', event.target.value)}>
            <option value="">Mặc định</option><option value="relevance">Phù hợp nhất</option><option value="priceAsc">Giá tăng dần</option><option value="priceDesc">Giá giảm dần</option><option value="rating">Đánh giá cao</option><option value="departureDate">Ngày khởi hành</option>
          </select>
        </label>
      </div>
      {error && <p role="alert" className="mt-4 text-sm font-semibold text-red-700">{error}</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" disabled={loading} className="min-h-11 rounded-xl bg-brand-teal px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-brightTeal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 disabled:opacity-60">{loading ? 'Đang tìm…' : 'Tìm kiếm tour'}</button>
        <button type="button" onClick={reset} className="min-h-11 rounded-xl border border-slate-300 px-5 py-2 text-sm font-bold transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2">Xóa bộ lọc</button>
      </div>
    </form>
  );
}
