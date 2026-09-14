'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import {
  POI_CATEGORY_PREVIEW_ENABLED,
  POI_CATEGORY_PREVIEW_FIXTURES,
} from '../data/categoryFixtures';
import { fetchPois } from '../services/poiApi';
import { PoiApiError, type PagedPois, type PoiOrigin, type PoiSearchState } from '../types/poi';
import { buildPoiQuery, parsePoiSearchState, toPublicUrlParams } from '../utils/poiQuery';
import { PoiCard } from './PoiCard';
import { PoiMapPreview } from './PoiMapPreview';
import { PoiPagination } from './PoiPagination';
import { PoiEmptyState, PoiErrorState, PoiListSkeleton } from './PoiStates';

type ViewMode = 'list' | 'map';

function resultRange(data: PagedPois): string {
  if (data.totalCount === 0) return '0 địa điểm';
  const start = (data.page - 1) * data.pageSize + 1;
  const end = Math.min(data.page * data.pageSize, data.totalCount);
  return `${start}–${end} trong ${data.totalCount} địa điểm`;
}

export function ExplorePoisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const filters = useMemo(() => parsePoiSearchState(new URLSearchParams(queryKey)), [queryKey]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [origin, setOrigin] = useState<PoiOrigin>({});
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [data, setData] = useState<PagedPois | null>(null);
  const [loading, setLoading] = useState(filters.search.length <= 200);
  const [error, setError] = useState<'network' | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (filters.search.length > 200) return;

    const controller = new AbortController();
    fetchPois(buildPoiQuery(filters, origin), controller.signal)
      .then((nextData) => {
        setData(nextData);
        setValidationMessage(null);
        setError(null);
        if (nextData.page > 1) requestAnimationFrame(() => resultsHeadingRef.current?.focus());
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return;
        if (caught instanceof PoiApiError && caught.status === 400) {
          const firstFieldError = caught.problem?.errors
            ? Object.values(caught.problem.errors).flat()[0]
            : undefined;
          setValidationMessage(firstFieldError ?? 'Bộ lọc chưa hợp lệ. Vui lòng kiểm tra lại.');
          return;
        }
        setError('network');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [filters, origin, requestVersion]);

  function navigate(next: PoiSearchState) {
    setLoading(true);
    setError(null);
    setValidationMessage(null);
    const query = toPublicUrlParams(next).toString();
    router.push(query ? `/pois?${query}` : '/pois');
  }

  function updateFilters(patch: Partial<PoiSearchState>) {
    navigate({ ...filters, ...patch, page: patch.page ?? 1 });
  }

  function submitSearch(value: string) {
    if (value.length > 200) {
      setValidationMessage('Từ khóa tìm kiếm không được vượt quá 200 ký tự.');
      return;
    }
    updateFilters({ search: value, page: 1 });
  }

  function resetFilters() {
    setLoading(true);
    setOrigin({});
    setLocationMessage(null);
    router.push('/pois');
  }

  function requestLocation() {
    if (!('geolocation' in navigator)) {
      setLocationMessage('Trình duyệt không hỗ trợ định vị. Bạn vẫn có thể khám phá toàn bộ địa điểm.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLoading(true);
        setOrigin({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationMessage('Đã bật vị trí. Khoảng cách được tính từ vị trí hiện tại của bạn.');
      },
      () => {
        setOrigin({});
        if (filters.sort === 'distance') updateFilters({ sort: 'name' });
        setLocationMessage('Quyền vị trí đang tắt. Bạn vẫn có thể duyệt địa điểm bình thường.');
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  const categoryOptions = POI_CATEGORY_PREVIEW_ENABLED ? POI_CATEGORY_PREVIEW_FIXTURES : [];
  const hasOrigin = Number.isFinite(origin.latitude) && Number.isFinite(origin.longitude);
  const urlSearchValidation = filters.search.length > 200
    ? 'Từ khóa tìm kiếm không được vượt quá 200 ký tự.'
    : null;

  return (
    <div className="min-h-screen bg-[#f3f6f7] text-[#00152a]" lang="vi">
      <PublicNavigation />
      <main>
        <section className="border-b border-[#d7e0e3] bg-[#001f35] px-4 py-10 text-white sm:px-8 sm:py-12">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#7ce6d9]">Khám phá miền Trung</p>
            <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <h1 className="text-3xl font-black tracking-[-.035em] sm:text-4xl lg:text-5xl">Khám phá địa điểm tham quan</h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#c7dce5] sm:text-base">Tìm các điểm đến đang hoạt động, lọc theo nhu cầu và xem vị trí minh họa trước khi lên đường.</p>
              </div>
              <div className="inline-flex w-fit items-center rounded-full border border-[#3a6572] bg-white/10 px-4 py-2 text-sm font-bold text-[#d8f3ef]">
                {data ? `${data.totalCount} địa điểm phù hợp` : 'Đang cập nhật dữ liệu'}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#d7e0e3] bg-[#e8edef] px-4 py-3 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-[#46575f]">
              {hasOrigin ? '⌖ Đã bật vị trí: có thể sắp xếp và lọc theo khoảng cách.' : '⌖ GPS chưa bật: danh sách mặc định không dùng khoảng cách.'}
            </p>
            <button type="button" onClick={requestLocation} className="min-h-11 w-fit rounded-xl border border-[#a8c7c1] bg-white px-4 text-sm font-extrabold text-[#006b5f] hover:bg-[#f1fbf8]">
              {hasOrigin ? 'Cập nhật vị trí' : 'Bật định vị'}
            </button>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-9">
          {locationMessage ? (
            <div className="mb-5 rounded-2xl border border-[#b7d7d1] bg-[#edf9f6] px-4 py-3 text-sm font-semibold text-[#165d55]" role="status">
              {locationMessage}
            </div>
          ) : null}
          {validationMessage || urlSearchValidation ? (
            <div className="mb-5 rounded-2xl border border-[#f1c3bc] bg-[#fff3f0] px-4 py-3 text-sm font-semibold text-[#8c2e24]" role="alert">
              {validationMessage ?? urlSearchValidation}
            </div>
          ) : null}

          <section aria-label="Tìm kiếm và lọc địa điểm" className="rounded-[24px] border border-[#d8e1e4] bg-white p-4 shadow-[0_8px_30px_rgba(0,21,42,.05)] sm:p-5">
            <PoiSearchForm key={filters.search} initialValue={filters.search} onSubmit={submitSearch} />

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label={POI_CATEGORY_PREVIEW_ENABLED ? 'Danh mục xem trước' : 'Danh mục'}>
              <button
                type="button"
                onClick={() => updateFilters({ categoryId: null })}
                aria-pressed={filters.categoryId === null}
                className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${filters.categoryId === null ? 'bg-[#007d6e] text-white' : 'bg-[#e9eef0] text-[#3b4b53]'}`}
              >
                Tất cả
              </button>
              {categoryOptions.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => updateFilters({ categoryId: category.id })}
                  aria-pressed={filters.categoryId === category.id}
                  className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${filters.categoryId === category.id ? 'bg-[#007d6e] text-white' : 'bg-[#e9eef0] text-[#3b4b53]'}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1fr)_auto_auto]">
              <label className="flex min-h-11 items-center gap-3 rounded-xl border border-[#ced9dd] bg-white px-3 text-sm font-semibold text-[#30434c]">
                <span className="shrink-0">Sắp xếp</span>
                <select
                  value={filters.sort}
                  onChange={(event) => updateFilters({ sort: event.target.value as PoiSearchState['sort'] })}
                  className="min-h-11 min-w-0 flex-1 bg-transparent font-bold text-[#00152a] outline-none"
                  aria-label="Sắp xếp địa điểm"
                >
                  <option value="name">Tên A–Z</option>
                  <option value="rating">Đánh giá cao</option>
                  {hasOrigin ? <option value="distance">Gần nhất</option> : null}
                </select>
              </label>
              {hasOrigin ? (
                <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#ced9dd] px-3 text-sm font-semibold">
                  Bán kính
                  <select
                    aria-label="Bán kính tìm kiếm"
                    value={origin.maxDistanceKm ?? ''}
                    onChange={(event) => {
                      setLoading(true);
                      setOrigin((current) => ({ ...current, maxDistanceKm: event.target.value ? Number(event.target.value) : undefined }));
                    }}
                    className="min-h-11 bg-transparent font-bold outline-none"
                  >
                    <option value="">Tất cả</option>
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                    <option value="20">20 km</option>
                    <option value="50">50 km</option>
                  </select>
                </label>
              ) : null}
              <button
                type="button"
                onClick={() => updateFilters({ openNow: !filters.openNow })}
                aria-pressed={filters.openNow}
                className={`min-h-11 rounded-xl px-4 text-sm font-bold ${filters.openNow ? 'bg-[#d9f3ed] text-[#006b5f] ring-1 ring-[#80cbbf]' : 'bg-[#edf1f2] text-[#405159]'}`}
              >
                {filters.openNow ? '● Đang mở cửa' : '○ Lọc đang mở cửa'}
              </button>
            </div>
          </section>

          <div className="mt-5 flex rounded-xl border border-[#d4dee1] bg-[#e8edef] p-1 lg:hidden" aria-label="Chế độ hiển thị">
            {(['list', 'map'] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => setViewMode(mode)} aria-pressed={viewMode === mode} className={`min-h-11 flex-1 rounded-lg text-sm font-extrabold ${viewMode === mode ? 'bg-[#007d6e] text-white shadow-sm' : 'text-[#405159]'}`}>
                {mode === 'list' ? '☷ Danh sách' : '⌖ Bản đồ'}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,.92fr)] xl:gap-8">
            <section className={`${viewMode === 'list' ? 'block' : 'hidden'} min-w-0 lg:block`} aria-label="Danh sách địa điểm">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[.15em] text-[#007d6e]">Kết quả khám phá</p>
                  <h2 ref={resultsHeadingRef} tabIndex={-1} className="mt-1 text-xl font-black text-[#00152a] outline-none" aria-live="polite">
                    {data ? resultRange(data) : 'Đang tải kết quả'}
                  </h2>
                </div>
                {loading && data ? <span className="text-xs font-bold text-[#007d6e]">Đang cập nhật…</span> : null}
              </div>

              {loading && !data ? <PoiListSkeleton /> : null}
              {!loading && error ? <PoiErrorState onRetry={() => setRequestVersion((value) => value + 1)} /> : null}
              {!loading && !error && data?.totalCount === 0 ? <PoiEmptyState onReset={resetFilters} /> : null}
              {data && data.items.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-1">
                  {data.items.map((poi) => <PoiCard key={poi.id} poi={poi} />)}
                  <div className="rounded-2xl border border-[#d8e1e4] bg-white px-4 py-4 md:col-span-2 lg:col-span-1">
                    <p className="mb-4 text-center text-sm font-semibold text-[#56666e]">Đang hiển thị {resultRange(data)}</p>
                    <PoiPagination page={data.page} totalPages={data.totalPages} onPageChange={(page) => updateFilters({ page })} />
                  </div>
                </div>
              ) : null}
            </section>

            <aside className={`${viewMode === 'map' ? 'block' : 'hidden'} min-w-0 lg:block`} aria-label="Xem địa điểm trên bản đồ minh họa">
              <div className="lg:sticky lg:top-24">
                <PoiMapPreview items={data?.items ?? []} />
                <p className="mt-3 text-center text-xs leading-relaxed text-[#66767d]">Vị trí được minh họa theo tọa độ của các địa điểm trên trang hiện tại.</p>
                {data ? (
                  <div className="mt-4 lg:hidden">
                    <PoiPagination page={data.page} totalPages={data.totalPages} onPageChange={(page) => updateFilters({ page })} />
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

interface PoiSearchFormProps {
  initialValue: string;
  onSubmit: (value: string) => void;
}

function PoiSearchForm({ initialValue, onSubmit }: PoiSearchFormProps) {
  const [value, setValue] = useState(initialValue);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(value.trim());
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <label className="sr-only" htmlFor="poi-search">Tìm kiếm địa điểm</label>
      <div className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#60717a]" aria-hidden="true">⌕</span>
        <input
          id="poi-search"
          type="search"
          maxLength={200}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Tìm danh lam, bãi biển, hang động…"
          className="min-h-12 w-full rounded-xl border border-[#ced9dd] bg-[#f3f6f7] py-3 pl-11 pr-4 text-base font-semibold text-[#00152a] placeholder:text-[#718087] focus:border-[#007d6e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8dd7ce]"
        />
      </div>
      <button type="submit" className="min-h-12 rounded-xl bg-[#007d6e] px-6 text-sm font-extrabold text-white hover:bg-[#006b5f]">Tìm kiếm</button>
    </form>
  );
}
