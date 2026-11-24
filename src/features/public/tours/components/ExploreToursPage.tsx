'use client';

import { formatDisplayDate } from '@/lib/displayDate';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { AuthStorage } from '@/features/auth/session/authSession';
import { useRouter, useSearchParams } from 'next/navigation';

import { getTourCategories, getTourRecommendations, isTourDemoAllowedInCurrentEnv, refreshTourRecommendations, searchTours } from '../services/tourApi';
import { TourApiError, type PagedToursResponseDto, type TourCategoryDto, type TourRecommendationsResponseDto, type TourSearchState } from '../types/tour';
import { buildBackendTourQuery, formatVndPrice, parseTourSearchState, toPublicUrlParams, validateTourFilters } from '../utils/tourQuery';
import { DevExploreToursPage } from './DevExploreToursPage';
import { PublicTourFilterBar } from './PublicTourFilterBar';
import { TourCard } from './TourCard';
import { TourEditorialHero } from './TourEditorialHero';
import { TourPagination } from './TourPagination';
import { TourRecommendationsSection } from './TourRecommendationsSection';
import { TourListSkeleton } from './TourStates';
import { publicSearchCopy, resolveSearchLocale, searchLocaleKey, searchValidationCopy, type SearchLocale } from '../resources/publicSearch';

type CurrentResult = { key: string } & ({ status: 'success'; data: PagedToursResponseDto } | { status: 'error' });
type DisplayedResult = { query: string; filters: TourSearchState; data: PagedToursResponseDto };

function searchQueryKey(params: { toString(): string }) {
  const search = new URLSearchParams(params.toString());
  search.delete('recommendationPage');
  return search.toString();
}

function saveRecommendationPage(page: number) {
  const url = new URL(window.location.href);
  if (page > 1) url.searchParams.set('recommendationPage', String(page));
  else url.searchParams.delete('recommendationPage');
  window.history.replaceState(null, '', url);
}

export function ExploreToursPage({ devSearchEnabled = false }: { devSearchEnabled?: boolean }) {
  return devSearchEnabled ? <DevExploreToursPage /> : <PublicExploreToursPage />;
}

function PublicExploreToursPage() {
  const [locale, setLocale] = useState<SearchLocale>('en');
  const copy = publicSearchCopy(locale);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      let saved: string | null = null;
      try { saved = window.localStorage.getItem(searchLocaleKey); } catch { /* storage unavailable */ }
      setLocale(resolveSearchLocale(saved, navigator.language));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const recommendationPage = searchParams.get('recommendationPage');
  const queryKey = searchQueryKey(searchParams);
  const isDemo = searchParams.get('demo') === '1' && isTourDemoAllowedInCurrentEnv();
  const filters = useMemo(() => parseTourSearchState(new URLSearchParams(queryKey)), [queryKey]);
  const validation = validateTourFilters(filters);
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<CurrentResult | null>(null);
  const [displayed, setDisplayed] = useState<DisplayedResult | null>(null);
  const [categories, setCategories] = useState<TourCategoryDto[]>([]);
  const [categoryError, setCategoryError] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const cycle = `${queryKey}:${version}`;
  const current = result?.key === cycle ? result : null;

  const navigate = useCallback(
    (next: TourSearchState) => {
      const params = toPublicUrlParams(next);
      if (params.toString() === queryKey) return;
      if (recommendationPage) params.set('recommendationPage', recommendationPage);
      const query = params.toString();
      router.push(query ? `/tours?${query}` : '/tours');
    },
    [queryKey, recommendationPage, router],
  );

  const activeChips = useMemo(() => {
    const list: Array<{ id: string; label: string; onRemove: () => void }> = [];
    if (filters.keyword) {
      list.push({
        id: 'keyword',
        label: `"${filters.keyword}"`,
        onRemove: () => navigate({ ...filters, keyword: '', page: 1 }),
      });
    }
    if (filters.destination) {
      list.push({
        id: 'destination',
        label: filters.destination,
        onRemove: () => navigate({ ...filters, destination: '', page: 1 }),
      });
    }
    if (filters.startDate || filters.endDate) {
      const dateText = [filters.startDate, filters.endDate]
        .filter((value): value is string => Boolean(value))
        .map(formatDisplayDate)
        .join(' → ');
      list.push({
        id: 'date',
        label: dateText,
        onRemove: () => navigate({ ...filters, startDate: '', endDate: '', page: 1 }),
      });
    }
    if (filters.minPrice || filters.maxPrice) {
      let priceText = '';
      if (filters.minPrice && filters.maxPrice) {
        priceText = `${formatVndPrice(Number(filters.minPrice))} - ${formatVndPrice(Number(filters.maxPrice))}`;
      } else if (filters.minPrice) {
        priceText = `≥ ${formatVndPrice(Number(filters.minPrice))}`;
      } else if (filters.maxPrice) {
        priceText = `≤ ${formatVndPrice(Number(filters.maxPrice))}`;
      }
      list.push({
        id: 'price',
        label: priceText,
        onRemove: () => navigate({ ...filters, minPrice: '', maxPrice: '', page: 1 }),
      });
    }
    if (filters.durationDays) {
      list.push({
        id: 'duration',
        label: `${filters.durationDays} ${locale === 'vi' ? 'ngày' : 'days'}`,
        onRemove: () => navigate({ ...filters, durationDays: '', page: 1 }),
      });
    }
    if (filters.category) {
      const cat = categories.find((c) => c.code === filters.category);
      list.push({
        id: 'category',
        label: cat?.name ?? filters.category,
        onRemove: () => navigate({ ...filters, category: '', page: 1 }),
      });
    }
    if (filters.minimumRating) {
      list.push({
        id: 'rating',
        label: `${filters.minimumRating}+ ⭐`,
        onRemove: () => navigate({ ...filters, minimumRating: '', page: 1 }),
      });
    }
    return list;
  }, [filters, categories, locale, navigate]);

  useEffect(() => {
    if (!validation.isValid) return;
    let active = true;
    const controller = new AbortController();
    const backendQuery = buildBackendTourQuery(filters);
    searchTours(backendQuery, controller.signal).then((data) => {
      if (!active) return;
      setResult({ key: cycle, status: 'success', data });
      setDisplayed({ query: toPublicUrlParams(filters).toString(), filters: { ...filters }, data });
    }).catch((error: unknown) => {
      if (!active || (error instanceof Error && error.name === 'AbortError')) return;
      setResult({ key: cycle, status: 'error' });
    });
    return () => { active = false; controller.abort(); };
  }, [cycle, filters, validation.isValid]);

  useEffect(() => {
    const controller = new AbortController();
    getTourCategories(controller.signal).then((items) => { setCategories(items); setCategoryError(false); }).catch(() => setCategoryError(true));
    return () => controller.abort();
  }, [version]);

  function clearFilters(next?: TourSearchState) {
    const keyword = (filters.keyword ?? '').trim();
    navigate(next ?? { destination: '', departureDate: '', minPrice: '', maxPrice: '', keyword, startDate: '', endDate: '', durationDays: '', category: '', minimumRating: '', sort: '', page: 1, pageSize: 20 });
  }

  const loading = validation.isValid && !current;
  const detailParams = new URLSearchParams(displayed?.query);
  if (recommendationPage) detailParams.set('recommendationPage', recommendationPage);

  return (
    <div className="min-h-screen bg-[#F5F7F6] text-[#1D2D2B]">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6" lang={locale}>
        <TourEditorialHero locale={locale} />

        {/* Language selector & top toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#61736F]">
            {copy.language}
            <select
              value={locale}
              aria-label={copy.language}
              className="min-h-10 rounded-xl border border-[#DCE5E2] bg-white px-3 text-xs sm:text-sm text-[#1D2D2B] focus-visible:ring-2 focus-visible:ring-[#0D5754]"
              onChange={(event) => {
                const selected = event.target.value === 'vi' ? 'vi' : 'en';
                setLocale(selected);
                try {
                  window.localStorage.setItem(searchLocaleKey, selected);
                } catch {
                  /* storage unavailable */
                }
              }}
            >
              <option value="vi" lang="vi">
                Tiếng Việt
              </option>
              <option value="en" lang="en">
                English
              </option>
            </select>
          </label>
        </div>

        {categoryError && (
          <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs sm:text-sm text-amber-800">
            {copy.categoryError}{' '}
            <button type="button" className="font-bold underline" onClick={() => setVersion((value) => value + 1)}>
              {copy.retry}
            </button>
          </div>
        )}

        {/* Mobile Filter Toggle Button */}
        <div className="flex items-center justify-between lg:hidden">
          <button
            type="button"
            onClick={() => setMobileFilterOpen((open) => !open)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#DCE5E2] bg-white px-4 py-2 text-xs font-bold text-[#1D2D2B] shadow-xs cursor-pointer hover:bg-[#F5F7F6]"
          >
            <span className="material-symbols-outlined text-base text-[#0D5754]">tune</span>
            <span>{locale === 'vi' ? 'Bộ lọc' : 'Filters'}</span>
            {activeChips.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0D5754] text-[10px] font-bold text-white">
                {activeChips.length}
              </span>
            )}
          </button>
          {displayed && !loading && (
            <span className="text-xs text-[#61736F]">
              {displayed.data.totalCount > 0
                ? copy.count(displayed.data.items.length, displayed.data.totalCount)
                : copy.none}
            </span>
          )}
        </div>

        {/* 2-Column Travel Marketplace Layout */}
        <div id="tours-discovery-workspace" className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left Filter Sidebar (Desktop: ~280-300px / Mobile: Drawer Modal) */}
          <aside
            aria-label="Tour Filters"
            className={`lg:col-span-4 xl:col-span-3 ${
              mobileFilterOpen
                ? 'fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4 sm:p-6 lg:relative lg:inset-auto lg:z-auto lg:bg-transparent lg:p-0'
                : 'hidden lg:block'
            }`}
          >
            <div className={mobileFilterOpen ? 'mx-auto max-w-md lg:max-w-none' : ''}>
              {mobileFilterOpen && (
                <div className="flex justify-end pb-2 lg:hidden">
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1D2D2B] shadow-md cursor-pointer"
                    aria-label="Close filters"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              )}
              <PublicTourFilterBar
                key={queryKey}
                locale={locale}
                filters={filters}
                categories={categories}
                loading={loading}
                onApply={(next) => {
                  setMobileFilterOpen(false);
                  navigate(next);
                }}
                onReset={(next) => {
                  setMobileFilterOpen(false);
                  clearFilters(next);
                }}
              />
            </div>
          </aside>

          {/* Right Tour Results Content Column */}
          <section aria-labelledby="tour-results-heading" aria-busy={loading} className="lg:col-span-8 xl:col-span-9">
            {/* Results Header Card */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#DCE5E2] bg-white p-4 shadow-xs sm:p-5">
              <div>
                <h2 id="tour-results-heading" className="text-xl font-black tracking-tight text-[#1D2D2B] sm:text-2xl">
                  {copy.results}
                </h2>
                {displayed && !loading && (
                  <p role="status" className="mt-0.5 text-xs text-[#61736F]">
                    {displayed.data.totalCount > 0
                      ? copy.count(displayed.data.items.length, displayed.data.totalCount)
                      : copy.none}
                  </p>
                )}
              </div>
            </div>

            {/* Active Filter Chips Bar */}
            {activeChips.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Active filters">
                <span className="text-xs font-bold text-[#61736F] mr-1">
                  {locale === 'vi' ? 'Đang lọc:' : 'Active filters:'}
                </span>
                {activeChips.map((chip) => (
                  <span
                    key={chip.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#0D5754]/20 bg-[#E8F0EA] px-3 py-1 text-xs font-semibold text-[#0D5754]"
                  >
                    <span>{chip.label}</span>
                    <button
                      type="button"
                      onClick={chip.onRemove}
                      aria-label={`Remove filter ${chip.label}`}
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[#0D5754] hover:bg-[#0D5754]/20 transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => clearFilters()}
                  className="text-xs font-bold text-[#0D5754] hover:underline cursor-pointer ml-1"
                >
                  {locale === 'vi' ? 'Xóa tất cả' : 'Clear all'}
                </button>
              </div>
            )}

            {!validation.isValid && validation.errorMessage && (
              <p role="alert" className="mb-4 text-xs sm:text-sm font-semibold text-red-700">
                {searchValidationCopy(validation.errorMessage, locale)}
              </p>
            )}

            {loading && (
              <>
                <p role="status" className="mb-3 text-sm text-[#61736F]">
                  {copy.loading}
                </p>
                {!displayed && <TourListSkeleton label={copy.loading} />}
              </>
            )}

            {current?.status === 'error' && (
              <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs sm:text-sm text-red-800">{copy.systemError}</p>
                <button
                  type="button"
                  className="mt-2 font-bold underline text-xs sm:text-sm text-red-800"
                  onClick={() => setVersion((value) => value + 1)}
                >
                  {copy.retry}
                </button>
              </div>
            )}

            {displayed && (
              <>
                {(!validation.isValid || loading || current?.status === 'error') && (
                  <p className="mb-3 text-xs sm:text-sm text-[#61736F]">{copy.retained}</p>
                )}
                <div aria-label={copy.shown} className="mb-4 rounded-xl border border-[#DCE5E2] bg-white p-3.5 text-xs text-[#61736F]">
                  <strong className="text-[#1D2D2B]">{copy.shown}:</strong> {displayed.filters.keyword || copy.anyKeyword} ·{' '}
                  {displayed.filters.destination || copy.anyDestination} · {copy.pagination.page(displayed.filters.page)}
                </div>
                {displayed.data.items.length === 0 ? (
                  <div role="status" className="rounded-2xl border border-[#DCE5E2] bg-white p-8 text-center space-y-3">
                    <span className="material-symbols-outlined text-4xl text-[#61736F]" aria-hidden="true">
                      travel_explore
                    </span>
                    <p className="text-sm font-medium text-[#1D2D2B]">{copy.empty}</p>
                    <button
                      type="button"
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#0D5754] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#094743] cursor-pointer"
                      onClick={() => clearFilters()}
                    >
                      {copy.clear}
                    </button>
                  </div>
                ) : (
                  <div data-testid="tours-grid" className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {displayed.data.items.map((tour) => (
                      <TourCard
                        key={tour.tourId}
                        tour={tour}
                        copy={copy.card}
                        aggregateRating={tour.aggregateRating ?? null}
                        searchContextQuery={detailParams.toString()}
                      />
                    ))}
                  </div>
                )}
                <TourPagination
                  copy={copy.pagination}
                  page={displayed.data.page}
                  totalPages={displayed.data.totalPages}
                  onPageChange={(page) => navigate({ ...displayed.filters, page })}
                />
              </>
            )}
          </section>
        </div>

        <div className="mt-12" lang="vi">
          <SessionRecommendations isDemo={isDemo} filters={filters} />
        </div>
      </main>
    </div>
  );
}


function SessionRecommendations({ isDemo, filters }: { isDemo: boolean; filters: TourSearchState }) {
  const { status, context } = useWebSession();
  if (!isDemo && (status !== 'authenticated' || context?.role !== 'Traveler' || context.status !== 'Active')) return null;
  return <TravelerRecommendations key={isDemo ? 'demo' : context!.userId} userId={context?.userId ?? null} isDemo={isDemo} filters={filters} />;
}

function TravelerRecommendations({ userId, isDemo, filters }: { userId: number | null; isDemo: boolean; filters: TourSearchState }) {
  const [recommendations, setRecommendations] = useState<TourRecommendationsResponseDto | null>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const pending = useRef<AbortController | null>(null);
  function isCurrent() {
    return pending.current !== null && !pending.current.signal.aborted && (isDemo || AuthStorage.getContext()?.userId === userId);
  }
  useEffect(() => {
    const controller = new AbortController();
    pending.current = controller;
    const savedPage = Number(new URLSearchParams(window.location.search).get('recommendationPage'));
    getTourRecommendations({
      ...(Number.isSafeInteger(savedPage) && savedPage > 1 ? { page: savedPage } : {}),
      signal: controller.signal,
      allowDemo: isDemo,
      initialCriteria: recommendationCriteria(filters),
    }).then((data) => {
      if (controller.signal.aborted || !isCurrent()) return;
      setRecommendations(data);
      setRecommendationsError(null);
    }).catch((error: unknown) => {
      if (error instanceof Error && error.name === 'AbortError') return;
      if (!controller.signal.aborted && isCurrent()) setRecommendationsError(recommendationErrorCode(error));
    }).finally(() => { if (!controller.signal.aborted && isCurrent()) setRecommendationsLoading(false); });
    return () => controller.abort();
    // Opening the screen reads latest once. Filter changes do not invent an automatic refresh policy.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo]);

  async function refreshRecommendations() {
    if (!isCurrent()) return;
    setRecommendationsLoading(true);
    try {
      const data = isDemo
        ? await getTourRecommendations({ allowDemo: true })
        : await refreshTourRecommendations(recommendationCriteria(filters), pending.current?.signal);
      if (!isCurrent()) return;
      saveRecommendationPage(data.page);
      setRecommendations(data);
      setRecommendationsError(null);
    } catch (error) {
      if (isCurrent()) setRecommendationsError(recommendationErrorCode(error));
    } finally {
      if (isCurrent()) setRecommendationsLoading(false);
    }
  }

  async function changeRecommendationPage(page: number) {
    if (!isCurrent()) return;
    setRecommendationsLoading(true);
    try {
      const data = await getTourRecommendations({ page, allowDemo: isDemo, signal: pending.current?.signal });
      if (!isCurrent()) return;
      saveRecommendationPage(data.page);
      setRecommendations(data);
      setRecommendationsError(null);
    } catch (error) {
      if (isCurrent()) setRecommendationsError(recommendationErrorCode(error));
    } finally {
      if (isCurrent()) setRecommendationsLoading(false);
    }
  }

  return (
          <TourRecommendationsSection
            recommendations={recommendations?.items ?? []}
            isDemo={recommendations?.isDemo ?? false}
            isLoading={recommendationsLoading}
            isRefreshing={recommendationsLoading && recommendations !== null}
            errorCode={recommendationsError}
            totalCount={recommendations?.totalCount ?? 0}
            page={recommendations?.page ?? 1}
            totalPages={recommendations?.totalPages ?? 0}
            onRefresh={refreshRecommendations}
            onPageChange={changeRecommendationPage}
          />
  );
}

function optionalBudget(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function recommendationCriteria(filters: TourSearchState) {
  return {
    destination: filters.destination.trim() || null,
    startDate: filters.startDate?.trim() || filters.departureDate.trim() || null,
    endDate: filters.endDate?.trim() || filters.departureDate.trim() || null,
    minBudget: optionalBudget(filters.minPrice),
    maxBudget: optionalBudget(filters.maxPrice),
  };
}

function recommendationErrorCode(error: unknown): string {
  return error instanceof TourApiError
    && error.problem?.errorCode === 'tour_recommendation.interest_tags_required'
    ? 'tour_recommendation.interest_tags_required'
    : 'MSG127';
}
