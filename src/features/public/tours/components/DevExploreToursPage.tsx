'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { devTourSearchCopy as copy } from '../resources/en';
import { getDevTourCategories, searchDevTours } from '../services/devTourApi';
import type { DevPagedToursResponseDto, DevTourCategory } from '../types/devTour';
import { buildDevTourQuery, parseDevTourSearchState, validateDevTourFilters, type DevTourSearchState } from '../utils/devTourQuery';
import { DevTourFilterBar } from './DevTourFilterBar';
import { TourCard } from './TourCard';
import { TourPagination } from './TourPagination';
import { TourListSkeleton } from './TourStates';

type SearchResult = { key: string } & ({ status: 'success'; data: DevPagedToursResponseDto } | { status: 'error'; message: string });
type CategoryResult = { version: number } & ({ status: 'success'; items: DevTourCategory[] } | { status: 'error' });
type DisplayedResult = { query: string; filters: DevTourSearchState; data: DevPagedToursResponseDto };

const CRITERIA_LABELS: Record<keyof DevTourSearchState, string> = {
  keyword: copy.keyword, destination: copy.destination, startDate: copy.startDate, endDate: copy.endDate,
  minPrice: copy.minPrice, maxPrice: copy.maxPrice, durationDays: copy.durationDays, category: copy.category,
  minimumRating: copy.minimumRating, sort: copy.sort, mode: copy.mode, page: copy.page, pageSize: copy.pageSize,
};

export function DevExploreToursPage() {
  const router = useRouter();
  const queryKey = useSearchParams().toString();
  const filters = useMemo(() => parseDevTourSearchState(new URLSearchParams(queryKey)), [queryKey]);
  const validation = validateDevTourFilters(filters);
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [displayed, setDisplayed] = useState<DisplayedResult | null>(null);
  const [categoryVersion, setCategoryVersion] = useState(0);
  const [categoryResult, setCategoryResult] = useState<CategoryResult | null>(null);
  const cycle = `${queryKey}:${version}`;
  const current = result?.key === cycle ? result : null;
  const categories = categoryResult?.version === categoryVersion ? categoryResult : null;

  useEffect(() => {
    if (validateDevTourFilters(filters)) return;
    let active = true;
    const controller = new AbortController();
    searchDevTours(buildDevTourQuery(filters), controller.signal).then((data) => {
      if (active) {
        setResult({ key: cycle, status: 'success', data });
        setDisplayed({ query: buildDevTourQuery(filters).toString(), filters: { ...filters }, data });
      }
    }).catch((error: unknown) => {
      if (active && !(error instanceof Error && error.name === 'AbortError')) setResult({ key: cycle, status: 'error', message: error instanceof Error ? error.message : copy.unavailable });
    });
    return () => { active = false; controller.abort(); };
  }, [filters, cycle]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    getDevTourCategories(controller.signal).then((items) => {
      if (active) setCategoryResult({ version: categoryVersion, status: 'success', items });
    }).catch(() => {
      if (active) setCategoryResult({ version: categoryVersion, status: 'error' });
    });
    return () => { active = false; controller.abort(); };
  }, [categoryVersion]);

  function navigate(state: DevTourSearchState) {
    const next = buildDevTourQuery(state).toString();
    if (next !== queryKey) router.push(`/tours?${next}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main lang="en" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="text-3xl font-black text-slate-900">{copy.title}</h1>
          <p className="mt-3 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{copy.notice}</p>
        </header>
        {categories?.status === 'error' && <div role="alert" className="mb-4 text-sm text-red-700"><p>{copy.categoryFailure}</p><button type="button" className="mt-2 underline" onClick={() => setCategoryVersion((value) => value + 1)}>{copy.retryCategories}</button></div>}
        <p className="mb-3 text-sm text-slate-600">{copy.formCriteria}</p>
        <DevTourFilterBar key={queryKey} filters={filters} categories={categories?.status === 'success' ? categories.items : []} onApply={navigate} onReset={() => router.push('/tours')} />
        <section aria-labelledby="dev-tour-results" aria-busy={!validation && !current}>
          <h2 id="dev-tour-results" tabIndex={-1} className="mb-4 text-xl font-bold">{copy.results}</h2>
          {validation ? <p role="alert" className="text-red-700">{validation}</p> : !current ? <><p role="status">{copy.loading}</p>{!displayed && <TourListSkeleton />}</> : current.status === 'error' ? <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-5"><p>{copy.searchFailure}</p><p>{current.message}</p><button type="button" className="mt-3 underline" onClick={() => setVersion((value) => value + 1)}>{copy.retry}</button></div> : null}
          {displayed && <>
            {(validation || !current || current.status === 'error') && <p className="my-3 text-sm text-slate-600">{copy.retainedResults}</p>}
            <section aria-label={copy.displayedCriteria} className="my-4 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-2 font-semibold">{copy.displayedCriteria}</h3>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(CRITERIA_LABELS) as (keyof DevTourSearchState)[]).map((key) => <div key={key}><dt className="font-semibold">{CRITERIA_LABELS[key]}</dt><dd className="wrap-break-word">{String(displayed.filters[key] || (key === 'sort' ? copy.defaultSort : copy.anyCriteria))}</dd></div>)}
              </dl>
            </section>
            <p role="status" className="mb-4 text-sm text-slate-600">Showing {displayed.data.items.length} of {displayed.data.totalCount} tours</p>
            {displayed.data.items.length === 0 ? <p>{copy.empty}</p> : <div data-testid="tours-grid" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{displayed.data.items.map((tour) => <TourCard key={tour.tourId} tour={tour} aggregateRating={tour.aggregateRating} searchContextQuery={displayed.query} />)}</div>}
            <TourPagination page={displayed.data.page} totalPages={displayed.data.totalPages} onPageChange={(page) => navigate({ ...displayed.filters, page })} />
          </>}
        </section>
      </main>
    </div>
  );
}
