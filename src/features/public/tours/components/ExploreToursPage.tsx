'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { getTourRecommendations, searchTours } from '../services/tourApi';
import type {
  PagedToursResponseDto,
  TourRecommendationDto,
  TourSearchState,
} from '../types/tour';
import {
  buildBackendTourQuery,
  parseTourSearchState,
  toPublicUrlParams,
  validateTourFilters,
} from '../utils/tourQuery';
import { TourCard } from './TourCard';
import { TourFilterBar } from './TourFilterBar';
import { TourPagination } from './TourPagination';
import { TourRecommendationsSection } from './TourRecommendationsSection';
import { TourEmptyState, TourErrorState, TourListSkeleton } from './TourStates';

export function ExploreToursPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();

  const isDemo = searchParams.get('demo') === '1';

  const filters = useMemo(
    () => parseTourSearchState(new URLSearchParams(queryKey)),
    [queryKey],
  );

  const [toursData, setToursData] = useState<PagedToursResponseDto | null>(null);
  const [recommendations, setRecommendations] = useState<TourRecommendationDto[]>([]);
  const [isPendingBeRecs, setIsPendingBeRecs] = useState(true);
  const [isDemoRecs, setIsDemoRecs] = useState(false);

  const validation = validateTourFilters(filters);
  const [loading, setLoading] = useState(validation.isValid);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  const searchCycleKey = `${queryKey}-${requestVersion}`;
  const [prevSearchCycleKey, setPrevSearchCycleKey] = useState(searchCycleKey);

  if (searchCycleKey !== prevSearchCycleKey) {
    setPrevSearchCycleKey(searchCycleKey);
    if (!validation.isValid) {
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
      setError(null);
    }
  }

  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

  // Load recommendations (UC-25)
  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();

    getTourRecommendations({ signal: controller.signal, allowDemo: isDemo })
      .then((res) => {
        if (!isCurrent) return;
        setRecommendations(res.items);
        setIsPendingBeRecs(res.isPendingBe);
        setIsDemoRecs(res.isDemo);
      })
      .catch(() => {
        if (!isCurrent) return;
        setIsPendingBeRecs(true);
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [isDemo]);

  // Load search tours (UC-24)
  useEffect(() => {
    let isCurrent = true;
    const currentValidation = validateTourFilters(filters);
    if (!currentValidation.isValid) {
      return;
    }

    const controller = new AbortController();
    const beQuery = buildBackendTourQuery(filters);

    searchTours(beQuery, controller.signal)
      .then((nextData) => {
        if (!isCurrent) return;
        setToursData(nextData);
        setError(null);
        if (nextData.page > 1) {
          requestAnimationFrame(() => resultsHeadingRef.current?.focus());
        }
      })
      .catch((caught: unknown) => {
        if (!isCurrent) return;
        if (caught instanceof Error && caught.name === 'AbortError') return;
        const msg =
          caught instanceof Error
            ? caught.message
            : 'Không thể kết nối máy chủ tour. Vui lòng thử lại sau.';
        setError(msg);
      })
      .finally(() => {
        if (isCurrent) {
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [filters, requestVersion]);

  function navigate(next: TourSearchState) {
    const nextUrlParams = toPublicUrlParams(next);
    if (isDemo) nextUrlParams.set('demo', '1');
    const queryString = nextUrlParams.toString();
    if (queryString === queryKey) return;

    setLoading(true);
    setError(null);
    router.push(queryString ? `/tours?${queryString}` : '/tours');
  }

  function handleApplyFilters(patch: Partial<TourSearchState>) {
    navigate({
      ...filters,
      ...patch,
      page: patch.page ?? 1,
    });
  }

  function handleResetFilters() {
    setLoading(true);
    setError(null);
    router.push(isDemo ? '/tours?demo=1' : '/tours');
  }

  function handlePageChange(nextPage: number) {
    handleApplyFilters({ page: nextPage });
  }

  function handleRetry() {
    setRequestVersion((v) => v + 1);
  }

  const hasActiveFilters = Boolean(
    filters.destination || filters.departureDate || filters.minPrice || filters.maxPrice,
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <PublicNavigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Banner / Hero Header */}
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1 text-xs font-bold text-[#007d6e] mb-3">
            <span className="material-symbols-outlined text-sm">explore</span>
            <span>Khám Phá Tour Bản Địa Miền Trung</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#00152a] tracking-tight">
            Tour Trải Nghiệm <span className="text-[#007d6e]">Đã Kiểm Duyệt</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
            Tìm kiếm các tour du lịch bản địa chất lượng cao, có lịch khởi hành xác thực, giá niêm yết minh bạch và hỗ trợ hoàn hủy linh hoạt.
          </p>
        </header>

        {/* UC-25: Tour Recommendations Section */}
        <TourRecommendationsSection
          recommendations={recommendations}
          isPendingBe={isPendingBeRecs}
          isDemo={isDemoRecs}
          onRefresh={() => setRequestVersion((v) => v + 1)}
        />

        {/* UC-24: Tour Filter Bar */}
        <TourFilterBar
          filters={filters}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
          isLoading={loading}
        />

        {/* Search Results Area */}
        <section aria-labelledby="tour-results-heading">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2
                id="tour-results-heading"
                ref={resultsHeadingRef}
                tabIndex={-1}
                className="text-xl sm:text-2xl font-black text-[#00152a] tracking-tight outline-hidden"
              >
                Kết Quả Tìm Kiếm
              </h2>
              {toursData && !loading && (
                <p className="text-xs text-slate-500 mt-0.5" role="status">
                  {toursData.totalCount > 0
                    ? `Hiển thị ${toursData.items.length} trong tổng số ${toursData.totalCount} tour phù hợp`
                    : 'Không có kết quả nào'}
                </p>
              )}
            </div>
          </div>

          {/* Conditional States */}
          {loading ? (
            <TourListSkeleton />
          ) : error ? (
            <TourErrorState onRetry={handleRetry} message={error} />
          ) : !toursData || toursData.items.length === 0 ? (
            <TourEmptyState
              onResetFilters={handleResetFilters}
              hasFilters={hasActiveFilters}
            />
          ) : (
            <>
              <div
                data-testid="tours-grid"
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {toursData.items.map((tour) => (
                  <TourCard
                    key={tour.tourId}
                    tour={tour}
                    searchContextQuery={queryKey}
                  />
                ))}
              </div>

              <TourPagination
                page={toursData.page}
                totalPages={toursData.totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
