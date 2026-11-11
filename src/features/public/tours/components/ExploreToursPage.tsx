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
import { TourEmptyState, TourErrorState, TourListSkeleton } from './TourStates';

type CurrentResult = { key: string } & ({ status: 'success'; data: PagedToursResponseDto } | { status: 'error'; message: string });
type DisplayedResult = { query: string; filters: TourSearchState; data: PagedToursResponseDto };

export function ExploreToursPage({ devSearchEnabled = false }: { devSearchEnabled?: boolean }) {
  return devSearchEnabled ? <DevExploreToursPage /> : <PublicExploreToursPage />;
}

function PublicExploreToursPage() {
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
      setResult({ key: cycle, status: 'error', message: error instanceof Error ? error.message : 'Không thể kết nối máy chủ tour (MSG127).' });
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

  function clearFilters() {
    const keyword = (filters.keyword ?? '').trim();
    navigate({ destination: '', departureDate: '', minPrice: '', maxPrice: '', keyword, startDate: '', endDate: '', durationDays: '', category: '', minimumRating: '', sort: '', page: 1, pageSize: 20 });
  }

  const loading = validation.isValid && !current;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" lang="vi">
        <TourEditorialHero />
        {categoryError && (
          <div role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
            Không thể tải danh mục.{' '}
            <button type="button" className="font-bold underline" onClick={() => setVersion((value) => value + 1)}>
              Thử lại
            </button>
          </div>
        )}
        <PublicTourFilterBar
          key={queryKey}
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
                Kết Quả Tìm Kiếm
              </h2>
              {displayed && !loading && (
                <p role="status" className="mt-0.5 text-xs text-slate-500">
                  {displayed.data.totalCount > 0
                    ? `Hiển thị ${displayed.data.items.length} trong tổng số ${displayed.data.totalCount} tour phù hợp`
                    : 'Không có kết quả nào'}
                </p>
              )}
            </div>

            {!validation.isValid && <p role="alert" className="mb-4 text-red-700">{validation.errorMessage}</p>}
            {loading && (
              <>
                <p role="status" className="mb-3 text-sm">Đang tìm kiếm…</p>
                {!displayed && <TourListSkeleton />}
              </>
            )}
            {current?.status === 'error' && (
              <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p>{current.message}</p>
                <button type="button" className="mt-2 font-bold underline" onClick={() => setVersion((value) => value + 1)}>
                  Thử lại
                </button>
              </div>
            )}
            {displayed && (
              <>
                {(!validation.isValid || loading || current?.status === 'error') && (
                  <p className="mb-3 text-sm text-slate-600">Đang giữ kết quả thành công gần nhất.</p>
                )}
                <div aria-label="Tiêu chí đang hiển thị" className="mb-4 rounded-xl border border-slate-200 bg-white p-4 text-sm">
                  <strong>Tiêu chí đang hiển thị:</strong> {displayed.filters.keyword || 'mọi từ khóa'} ·{' '}
                  {displayed.filters.destination || 'mọi điểm đến'} · trang {displayed.filters.page}
                </div>
                {displayed.data.items.length === 0 ? (
                  <TourEmptyState onResetFilters={clearFilters} hasFilters />
                ) : (
                  <div data-testid="tours-grid" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3">
                    {displayed.data.items.map((tour) => (
                      <TourCard
                        key={tour.tourId}
                        tour={tour}
                        aggregateRating={tour.aggregateRating ?? null}
                        searchContextQuery={displayed.query}
                      />
                    ))}
                  </div>
                )}
                <TourPagination
                  page={displayed.data.page}
                  totalPages={displayed.data.totalPages}
                  onPageChange={(page) => navigate({ ...displayed.filters, page })}
                />
              </>
            )}
            {!displayed && current?.status === 'error' && (
              <TourErrorState
                onRetry={() => setVersion((value) => value + 1)}
                message={current.message}
              />
            )}
          </section>
        </div>

        <div className="mt-12">
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
