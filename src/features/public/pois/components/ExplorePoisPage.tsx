'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  POI_CATEGORY_PREVIEW_ENABLED,
  POI_CATEGORY_PREVIEW_FIXTURES,
} from '../data/categoryFixtures';
import { fetchPoiCategories, fetchPois } from '../services/poiApi';
import {
  PoiApiError,
  type PagedPois,
  type PoiCategoryOption,
  type PoiOrigin,
  type PoiSearchState,
} from '../types/poi';
import { resolvePoiCategoryKind } from '../utils/poiCategoryVisuals';
import {
  buildPoiQuery,
  DEFAULT_POI_SORT,
  parsePoiSearchState,
  toPublicUrlParams,
} from '../utils/poiQuery';
import { PoiCard } from './PoiCard';
import { PoiCategoryIcon } from './PoiCategoryIcon';
import { PoiMapboxView } from './PoiMapboxView';
import { PoiPagination } from './PoiPagination';
import { PoiEmptyState, PoiErrorState, PoiListSkeleton } from './PoiStates';

type ViewMode = 'list' | 'map';

const countFormatter = new Intl.NumberFormat('vi-VN');

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
  const [categories, setCategories] = useState<PoiCategoryOption[]>(() =>
    POI_CATEGORY_PREVIEW_ENABLED ? [...POI_CATEGORY_PREVIEW_FIXTURES] : [],
  );
  const [categoriesLoaded, setCategoriesLoaded] = useState(POI_CATEGORY_PREVIEW_ENABLED);
  const [loading, setLoading] = useState(filters.search.length <= 200);
  const [error, setError] = useState<'network' | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const categoryStripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchPoiCategories(controller.signal)
      .then((loaded) => {
        if (loaded.length > 0) {
          setCategories(loaded);
        }
      })
      .catch(() => {
        // Categories are an enhancement; keep browsing fully functional if unavailable.
      })
      .finally(() => {
        if (!controller.signal.aborted) setCategoriesLoaded(true);
      });

    return () => controller.abort();
  }, []);

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
    const query = toPublicUrlParams(next).toString();
    if (query === queryKey) return;

    setLoading(true);
    setError(null);
    setValidationMessage(null);
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
    if (!queryKey && !hasOrigin) return;

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
        if (filters.sort === 'distance') updateFilters({ sort: DEFAULT_POI_SORT });
        setLocationMessage('Quyền vị trí đang tắt. Bạn vẫn có thể duyệt địa điểm bình thường.');
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  function scrollCategories(direction: -1 | 1) {
    categoryStripRef.current?.scrollBy({ left: direction * 260, behavior: 'smooth' });
  }

  const hasOrigin = Number.isFinite(origin.latitude) && Number.isFinite(origin.longitude);
  const hasActiveFilters = Boolean(
    filters.search || filters.categoryId !== null || filters.openNow || hasOrigin,
  );
  const urlSearchValidation = filters.search.length > 200
    ? 'Từ khóa tìm kiếm không được vượt quá 200 ký tự.'
    : null;

  const effectiveSelectedId = (selectedPoiId !== null && data?.items.some((p) => p.id === selectedPoiId))
    ? selectedPoiId
    : (data?.items[0]?.id ?? null);

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#1C2928]" lang="vi">
      <main>
        <section className="border-b border-[#174B4A]/40 bg-[#0C2423] px-4 py-5 text-white sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto max-w-[1440px]">
            <nav aria-label="Đường dẫn điều hướng" className="mb-1.5 text-xs font-semibold text-[#DCE2DD]">
              <Link href="/" className="transition hover:text-white">Trang chủ</Link>{' '}
              <span aria-hidden="true">/</span>{' '}
              <span aria-current="page" className="text-white">Khám phá địa điểm</span>
            </nav>
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
              <div>
                <h1 className="text-2xl font-black tracking-[-.035em] text-white sm:text-3xl">
                  Khám phá địa điểm
                </h1>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#E8F0EA]/85 sm:text-sm">
                  Tìm kiếm và định vị các điểm tham quan đang hoạt động, lọc theo danh mục và xem trực tiếp trên bản đồ địa lý Mapbox.
                </p>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#174B4A] bg-white/10 px-3 py-1.5 text-xs font-bold text-[#E8F0EA]">
                <span className="h-2 w-2 rounded-full bg-[#6EE7B7]" aria-hidden="true" />
                {data ? `${countFormatter.format(data.totalCount)} địa điểm phù hợp` : 'Đang cập nhật dữ liệu'}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          {locationMessage ? (
            <div className="mb-4 rounded-xl border border-[#B2D6C4] bg-[#E8F0EA] px-4 py-2.5 text-sm font-semibold text-[#103B39]" role="status">
              {locationMessage}
            </div>
          ) : null}
          {validationMessage || urlSearchValidation ? (
            <div className="mb-4 rounded-xl border border-[#F7C9D3] bg-[#FDECEF] px-4 py-2.5 text-sm font-semibold text-[#8C1030]" role="alert">
              {validationMessage ?? urlSearchValidation}
            </div>
          ) : null}

          {/* Unified Compact Search, Controls & Category Bar */}
          <section
            aria-label="Tìm kiếm và lọc địa điểm"
            className="rounded-2xl border border-[#DCE2DD] bg-white p-3.5 shadow-[0_6px_24px_rgba(16,59,57,.05)] sm:p-4"
          >
            {/* Row 1: Single-line search + compact controls */}
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <PoiSearchForm key={filters.search} initialValue={filters.search} onSubmit={submitSearch} />
              </div>

              <div className="hidden h-7 w-px shrink-0 bg-[#E3E8E4] lg:block" aria-hidden="true" />

              <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                <label className="flex h-11 items-center gap-2 rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] px-3 text-xs font-semibold text-[#5B6E69] transition hover:border-[#174B4A]/40">
                  <span className="shrink-0">Sắp xếp</span>
                  <select
                    value={filters.sort}
                    onChange={(event) => updateFilters({ sort: event.target.value as PoiSearchState['sort'] })}
                    className="cursor-pointer border-0 bg-transparent py-1 pr-1 text-sm font-bold leading-5 text-[#1C2928] outline-none"
                    aria-label="Sắp xếp địa điểm"
                  >
                    <option value="rating">Đánh giá cao</option>
                    <option value="name">Tên A–Z</option>
                    {hasOrigin ? <option value="distance">Gần nhất</option> : null}
                  </select>
                </label>

                {hasOrigin ? (
                  <label className="flex h-11 items-center gap-2 rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] px-3 text-xs font-semibold text-[#5B6E69]">
                    <span className="shrink-0">Bán kính</span>
                    <select
                      aria-label="Bán kính tìm kiếm"
                      value={origin.maxDistanceKm ?? ''}
                      onChange={(event) => {
                        setLoading(true);
                        setOrigin((current) => ({
                          ...current,
                          maxDistanceKm: event.target.value ? Number(event.target.value) : undefined,
                        }));
                      }}
                      className="cursor-pointer border-0 bg-transparent py-1 pr-1 text-sm font-bold leading-5 text-[#1C2928] outline-none"
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
                  className={`min-h-11 cursor-pointer rounded-xl border px-3.5 text-sm font-bold transition ${
                    filters.openNow
                      ? 'border-[#174B4A]/40 bg-[#E8F0EA] text-[#103B39]'
                      : 'border-[#DCE2DD] bg-[#F7F5EF] text-[#4A5D58] hover:border-[#174B4A]/35 hover:bg-[#E8F0EA]/60 hover:text-[#103B39]'
                  }`}
                >
                  {filters.openNow ? '● Đang mở cửa' : '○ Lọc đang mở cửa'}
                </button>

                <button
                  type="button"
                  onClick={requestLocation}
                  className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 text-sm font-bold transition ${
                    hasOrigin
                      ? 'border-[#174B4A]/40 bg-[#E8F0EA] text-[#103B39]'
                      : 'border-[#DCE2DD] bg-white text-[#174B4A] hover:border-[#174B4A]/45 hover:bg-[#E8F0EA]/50'
                  }`}
                >
                  <span aria-hidden="true" className="text-base leading-none">⌖</span>
                  {hasOrigin ? 'Cập nhật vị trí' : 'Bật định vị'}
                </button>
              </div>
            </div>

            {/* Row 2: Live Category Tab Strip */}
            <div className="mt-3 flex items-center gap-2 border-t border-[#ECEEEB] pt-3">
              <div className="relative min-w-0 flex-1">
                <div
                  ref={categoryStripRef}
                  className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  aria-label="Danh mục"
                >
                <button
                  type="button"
                  onClick={() => updateFilters({ categoryId: null })}
                  aria-pressed={filters.categoryId === null}
                  className={`inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition ${
                    filters.categoryId === null
                      ? 'border-[#174B4A] bg-[#174B4A] text-white shadow-xs'
                      : 'border-[#E2E7E3] bg-[#F7F5EF] text-[#4A5D58] hover:border-[#174B4A]/40 hover:bg-[#E8F0EA] hover:text-[#103B39]'
                  }`}
                >
                  Tất cả
                </button>

                {!categoriesLoaded && categories.length === 0 ? (
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    {[88, 76, 82, 92, 74, 86].map((width, index) => (
                      <span
                        key={index}
                        style={{ width }}
                        className="h-9 shrink-0 animate-pulse rounded-lg bg-[#EDEAE1]"
                      />
                    ))}
                  </div>
                ) : null}

                {categories.map((category) => {
                  const isActive = filters.categoryId === category.id;
                  const iconKind = resolvePoiCategoryKind(category.name);

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => updateFilters({ categoryId: category.id })}
                      aria-pressed={isActive}
                      className={`inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition ${
                        isActive
                          ? 'border-[#174B4A] bg-[#174B4A] text-white shadow-xs'
                          : 'border-[#E2E7E3] bg-[#F7F5EF] text-[#4A5D58] hover:border-[#174B4A]/40 hover:bg-[#E8F0EA] hover:text-[#103B39]'
                      }`}
                    >
                      <PoiCategoryIcon kind={iconKind} className="h-3.5 w-3.5 shrink-0 opacity-85" />
                      <span>{category.name}</span>
                      {typeof category.poiCount === 'number' && category.poiCount > 0 ? (
                        <span
                          aria-hidden="true"
                          className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold leading-none ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-white text-[#5B6E69]'
                          }`}
                        >
                          {countFormatter.format(category.poiCount)}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
                </div>
                {categories.length > 5 ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-0 right-0 top-0 w-10 bg-gradient-to-l from-white via-white/80 to-transparent"
                  />
                ) : null}
              </div>

              {categories.length > 5 ? (
                <div className="hidden shrink-0 items-center gap-1 sm:flex">
                  <button
                    type="button"
                    onClick={() => scrollCategories(-1)}
                    aria-label="Cuộn danh mục sang trái"
                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#DCE2DD] bg-[#F7F5EF] text-xs font-bold text-[#4A5D58] transition hover:border-[#174B4A]/40 hover:bg-[#E8F0EA] hover:text-[#103B39]"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCategories(1)}
                    aria-label="Cuộn danh mục sang phải"
                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#DCE2DD] bg-[#F7F5EF] text-xs font-bold text-[#4A5D58] transition hover:border-[#174B4A]/40 hover:bg-[#E8F0EA] hover:text-[#103B39]"
                  >
                    ›
                  </button>
                </div>
              ) : null}
            </div>
          </section>

          <div className="mt-4 flex rounded-xl border border-[#DCE2DD] bg-[#EDEAE1] p-1 lg:hidden" aria-label="Chế độ hiển thị">
            {(['list', 'map'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                aria-pressed={viewMode === mode}
                className={`min-h-11 flex-1 rounded-lg text-sm font-extrabold ${
                  viewMode === mode ? 'bg-[#174B4A] text-white shadow-xs' : 'text-[#5B6E69]'
                }`}
              >
                {mode === 'list' ? '☷ Danh sách' : '⌖ Bản đồ'}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)] xl:gap-6">
            <section className={`${viewMode === 'list' ? 'block' : 'hidden'} min-w-0 lg:block`} aria-label="Danh sách địa điểm">
              <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#103B39]">Kết quả khám phá</p>
                  <h2 ref={resultsHeadingRef} tabIndex={-1} className="mt-0.5 text-lg font-black text-[#1C2928] outline-none sm:text-xl" aria-live="polite">
                    {data ? resultRange(data) : 'Đang tải kết quả'}
                  </h2>
                </div>
                <div className="flex items-center gap-2.5">
                  {loading && data ? <span className="text-xs font-bold text-[#103B39]">Đang cập nhật…</span> : null}
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="cursor-pointer rounded-lg border border-[#DCE2DD] bg-white px-2.5 py-1.5 text-xs font-bold text-[#174B4A] transition hover:border-[#174B4A]/40 hover:bg-[#E8F0EA]"
                    >
                      Xóa bộ lọc
                    </button>
                  ) : null}
                </div>
              </div>

              {loading && !data ? <PoiListSkeleton /> : null}
              {!loading && error ? <PoiErrorState onRetry={() => setRequestVersion((value) => value + 1)} /> : null}
              {!loading && !error && data?.totalCount === 0 ? <PoiEmptyState onReset={resetFilters} /> : null}
              {data && data.items.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                  {data.items.map((poi) => (
                    <PoiCard
                      key={poi.id}
                      poi={poi}
                      isSelected={poi.id === effectiveSelectedId}
                      onSelect={() => setSelectedPoiId(poi.id)}
                    />
                  ))}
                  <div className="rounded-2xl border border-[#DCE2DD] bg-white px-4 py-4 md:col-span-2 lg:col-span-1">
                    <p className="mb-3.5 text-center text-sm font-semibold text-[#5B6E69]">Đang hiển thị {resultRange(data)}</p>
                    <PoiPagination page={data.page} totalPages={data.totalPages} onPageChange={(page) => updateFilters({ page })} />
                  </div>
                </div>
              ) : null}
            </section>

            <aside className={`${viewMode === 'map' ? 'block' : 'hidden'} min-w-0 lg:block`} aria-label="Bản đồ địa lý khám phá địa điểm">
              <div className="lg:sticky lg:top-24">
                <PoiMapboxView
                  items={data?.items ?? []}
                  selectedId={effectiveSelectedId}
                  onSelectPoi={setSelectedPoiId}
                />
                <p className="mt-2.5 text-center text-xs leading-relaxed text-[#66767d]">
                  Bản đồ hiển thị tọa độ địa lý thực tế của các địa điểm trên trang hiện tại qua Mapbox.
                </p>
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
    <form role="search" onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor="poi-search">Tìm kiếm địa điểm</label>
      <div className="relative min-w-0 flex-1">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#60717a]"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id="poi-search"
          type="search"
          maxLength={200}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Tìm danh lam, bãi biển, quán ăn, bảo tàng…"
          className="min-h-11 w-full rounded-xl border border-[#CED9DD] bg-[#F7F5EF] py-2.5 pl-10 pr-4 text-sm font-semibold text-[#1C2928] placeholder:text-[#718087] focus:border-[#103B39] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DD7CE]"
        />
      </div>
      <button
        type="submit"
        className="min-h-11 shrink-0 cursor-pointer rounded-xl bg-[#103B39] px-5 text-sm font-extrabold text-white transition hover:bg-[#174B4A]"
      >
        Tìm kiếm
      </button>
    </form>
  );
}
