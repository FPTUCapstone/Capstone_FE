'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';

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

export function DevExploreToursPage() {
  const router = useRouter();
  const queryKey = useSearchParams().toString();
  const filters = useMemo(() => parseDevTourSearchState(new URLSearchParams(queryKey)), [queryKey]);
  const validation = validateDevTourFilters(filters);
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<SearchResult | null>(null);
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
      if (active) setResult({ key: cycle, status: 'success', data });
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
      <PublicNavigation />
      <main lang="en" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="text-3xl font-black text-slate-900">{copy.title}</h1>
          <p className="mt-3 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{copy.notice}</p>
        </header>
        {categories?.status === 'error' && <div role="alert" className="mb-4 text-sm text-red-700"><p>{copy.categoryFailure}</p><button type="button" className="mt-2 underline" onClick={() => setCategoryVersion((value) => value + 1)}>{copy.retryCategories}</button></div>}
        <DevTourFilterBar key={queryKey} filters={filters} categories={categories?.status === 'success' ? categories.items : []} onApply={navigate} onReset={() => router.push('/tours')} />
        <section aria-labelledby="dev-tour-results" aria-busy={!validation && !current}>
          <h2 id="dev-tour-results" tabIndex={-1} className="mb-4 text-xl font-bold">{copy.results}</h2>
          {validation ? <p role="alert" className="text-red-700">{validation}</p> : !current ? <><p className="sr-only" role="status">{copy.loading}</p><TourListSkeleton /></> : current.status === 'error' ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5"><p>{current.message}</p><button type="button" className="mt-3 underline" onClick={() => setVersion((value) => value + 1)}>{copy.retry}</button></div> : <>
            <p role="status" className="mb-4 text-sm text-slate-600">Showing {current.data.items.length} of {current.data.totalCount} tours</p>
            {current.data.items.length === 0 ? <p>{copy.empty}</p> : <div data-testid="tours-grid" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{current.data.items.map((tour) => <TourCard key={tour.tourId} tour={tour} aggregateRating={tour.aggregateRating} searchContextQuery={queryKey} />)}</div>}
            <TourPagination page={current.data.page} totalPages={current.data.totalPages} onPageChange={(page) => navigate({ ...filters, page })} />
          </>}
        </section>
      </main>
    </div>
  );
}
