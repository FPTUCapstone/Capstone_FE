'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { getTourCategories, getTourRecommendations, isTourDemoAllowedInCurrentEnv, searchTours } from '../services/tourApi';
import type { PagedToursResponseDto, TourCategoryDto, TourSearchState } from '../types/tour';
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
  const queryKey = useSearchParams().toString();
  const isDemo = new URLSearchParams(queryKey).get('demo') === '1' && isTourDemoAllowedInCurrentEnv();
  const filters = useMemo(() => parseTourSearchState(new URLSearchParams(queryKey)), [queryKey]);
  const validation = validateTourFilters(filters);
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<CurrentResult | null>(null);
  const [displayed, setDisplayed] = useState<DisplayedResult | null>(null);
  const [categories, setCategories] = useState<TourCategoryDto[]>([]);
  const [categoryError, setCategoryError] = useState(false);
  const [recommendations, setRecommendations] = useState<Awaited<ReturnType<typeof getTourRecommendations>> | null>(null);
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
    getTourRecommendations({ signal: controller.signal, allowDemo: isDemo }).then(setRecommendations).catch(() => setRecommendations({ items: [], isPendingBe: true, isDemo: false }));
    return () => controller.abort();
  }, [isDemo]);

  function navigate(next: TourSearchState) {
    const query = toPublicUrlParams(next).toString();
    if (query !== queryKey) router.push(query ? `/tours?${query}` : '/tours');
  }

  function clearFilters(next?: TourSearchState) {
    const keyword = (filters.keyword ?? '').trim();
    navigate(next ?? { destination: '', departureDate: '', minPrice: '', maxPrice: '', keyword, startDate: '', endDate: '', durationDays: '', category: '', minimumRating: '', sort: '', page: 1, pageSize: 20 });
  }

  const loading = validation.isValid && !current;

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
                        searchContextQuery={displayed.query}
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
            isPendingBe={recommendations?.isPendingBe ?? true}
            isDemo={recommendations?.isDemo ?? false}
            onRefresh={() => setVersion((value) => value + 1)}
          />
        </div>
      </main>
    </div>
  );
}
