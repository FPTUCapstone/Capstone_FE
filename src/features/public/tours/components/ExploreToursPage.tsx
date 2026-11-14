'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { getTourCategories, getTourRecommendations, isTourDemoAllowedInCurrentEnv, refreshTourRecommendations, searchTours } from '../services/tourApi';
import { TourApiError, type PagedToursResponseDto, type TourCategoryDto, type TourRecommendationsResponseDto, type TourSearchState } from '../types/tour';
import { buildBackendTourQuery, parseTourSearchState, toPublicUrlParams, validateTourFilters } from '../utils/tourQuery';
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
  const [recommendations, setRecommendations] = useState<TourRecommendationsResponseDto | null>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const cycle = `${queryKey}:${version}`;
  const current = result?.key === cycle ? result : null;

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

  useEffect(() => {
    const controller = new AbortController();
    const savedPage = Number(new URLSearchParams(window.location.search).get('recommendationPage'));
    getTourRecommendations({
      ...(Number.isSafeInteger(savedPage) && savedPage > 1 ? { page: savedPage } : {}),
      signal: controller.signal,
      allowDemo: isDemo,
      initialCriteria: recommendationCriteria(filters),
    }).then((data) => {
      setRecommendations(data);
      setRecommendationsError(null);
    }).catch((error: unknown) => {
      if (error instanceof Error && error.name === 'AbortError') return;
      setRecommendationsError(recommendationErrorCode(error));
    }).finally(() => setRecommendationsLoading(false));
    return () => controller.abort();
    // Opening the screen reads latest once. Filter changes do not invent an automatic refresh policy.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo]);

  async function refreshRecommendations() {
    setRecommendationsLoading(true);
    try {
      const data = isDemo
        ? await getTourRecommendations({ allowDemo: true })
        : await refreshTourRecommendations(recommendationCriteria(filters));
      saveRecommendationPage(data.page);
      setRecommendations(data);
      setRecommendationsError(null);
    } catch (error) {
      setRecommendationsError(recommendationErrorCode(error));
    } finally {
      setRecommendationsLoading(false);
    }
  }

  async function changeRecommendationPage(page: number) {
    setRecommendationsLoading(true);
    try {
      const data = await getTourRecommendations({ page, allowDemo: isDemo });
      saveRecommendationPage(data.page);
      setRecommendations(data);
      setRecommendationsError(null);
    } catch (error) {
      setRecommendationsError(recommendationErrorCode(error));
    } finally {
      setRecommendationsLoading(false);
    }
  }

  function navigate(next: TourSearchState) {
    const params = toPublicUrlParams(next);
    if (params.toString() === queryKey) return;
    if (recommendationPage) params.set('recommendationPage', recommendationPage);
    const query = params.toString();
    router.push(query ? `/tours?${query}` : '/tours');
  }

  function clearFilters(next?: TourSearchState) {
    const keyword = (filters.keyword ?? '').trim();
    navigate(next ?? { destination: '', departureDate: '', minPrice: '', maxPrice: '', keyword, startDate: '', endDate: '', durationDays: '', category: '', minimumRating: '', sort: '', page: 1, pageSize: 20 });
  }

  const loading = validation.isValid && !current;
  const detailParams = new URLSearchParams(displayed?.query);
  if (recommendationPage) detailParams.set('recommendationPage', recommendationPage);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" lang={locale}>
        <TourEditorialHero locale={locale} />
        <label className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold">
          {copy.language}
          <select value={locale} className="min-h-11 rounded-xl border border-brand-border px-3 focus-visible:ring-2 focus-visible:ring-brand-teal" onChange={(event) => {
            const selected = event.target.value === 'vi' ? 'vi' : 'en';
            setLocale(selected);
            try { window.localStorage.setItem(searchLocaleKey, selected); } catch { /* storage unavailable */ }
          }}>
            <option value="vi" lang="vi">Tiếng Việt</option>
            <option value="en" lang="en">English</option>
          </select>
        </label>
        {categoryError && (
          <div role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
            {copy.categoryError}{' '}
            <button type="button" className="font-bold underline" onClick={() => setVersion((value) => value + 1)}>
              {copy.retry}
            </button>
          </div>
        )}
        <PublicTourFilterBar
          key={queryKey}
          locale={locale}
          filters={filters}
          categories={categories}
          loading={loading}
          onApply={navigate}
          onReset={clearFilters}
        />

        <div id="tours-discovery-workspace" className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <section aria-labelledby="tour-results-heading" aria-busy={loading} className="lg:col-span-12">
            <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
              <h2 id="tour-results-heading" className="text-xl font-black tracking-tight text-[#1C2928] sm:text-2xl">
                {copy.results}
              </h2>
              {displayed && !loading && (
                <p role="status" className="mt-0.5 text-xs text-slate-500">
                  {displayed.data.totalCount > 0
                    ? copy.count(displayed.data.items.length, displayed.data.totalCount)
                    : copy.none}
                </p>
              )}
            </div>

            {!validation.isValid && validation.errorMessage && <p role="alert" className="mb-4 text-red-700">{searchValidationCopy(validation.errorMessage, locale)}</p>}
            {loading && (
              <>
                <p role="status" className="mb-3 text-sm">{copy.loading}</p>
                {!displayed && <TourListSkeleton label={copy.loading} />}
              </>
            )}
            {current?.status === 'error' && (
              <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p>{copy.systemError}</p>
                <button type="button" className="mt-2 font-bold underline" onClick={() => setVersion((value) => value + 1)}>
                  {copy.retry}
                </button>
              </div>
            )}
            {displayed && (
              <>
                {(!validation.isValid || loading || current?.status === 'error') && (
                  <p className="mb-3 text-sm text-slate-600">{copy.retained}</p>
                )}
                <div aria-label={copy.shown} className="mb-4 rounded-xl border border-slate-200 bg-white p-4 text-sm">
                  <strong>{copy.shown}:</strong> {displayed.filters.keyword || copy.anyKeyword} ·{' '}
                  {displayed.filters.destination || copy.anyDestination} · {copy.pagination.page(displayed.filters.page)}
                </div>
                {displayed.data.items.length === 0 ? (
                  <div role="status" className="rounded-2xl border border-brand-border bg-white p-6">
                    <p>{copy.empty}</p>
                    <button type="button" className="min-h-11 font-bold underline" onClick={() => clearFilters()}>{copy.clear}</button>
                  </div>
                ) : (
                  <div data-testid="tours-grid" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3">
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
        </div>
      </main>
    </div>
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
