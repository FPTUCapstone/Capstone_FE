'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  getTourRecommendations,
  isTourDemoAllowedInCurrentEnv,
  searchTours,
} from '../services/tourApi';
import type {
  PagedToursResponseDto,
  TourRecommendationDto,
  TourSearchState,
} from '../types/tour';
import {
  buildBackendTourQuery,
  formatVndPrice,
  parseTourSearchState,
  toPublicUrlParams,
  validateTourFilters,
} from '../utils/tourQuery';
import { TourCard } from './TourCard';
import { TourEditorialHero } from './TourEditorialHero';
import { TourFilterSidebar } from './TourFilterSidebar';
import { TourPagination } from './TourPagination';
import { TourRecommendationsSection } from './TourRecommendationsSection';
import { TourSearchBar } from './TourSearchBar';
import { TourEmptyState, TourErrorState, TourListSkeleton } from './TourStates';
import { DevExploreToursPage } from './DevExploreToursPage';

export function ExploreToursPage({ devSearchEnabled = false }: { devSearchEnabled?: boolean }) {
  return devSearchEnabled ? <DevExploreToursPage /> : <LegacyExploreToursPage />;
}

function LegacyExploreToursPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();

  const isDemo = searchParams.get('demo') === '1' && isTourDemoAllowedInCurrentEnv();

  const filters = useMemo(
    () => parseTourSearchState(new URLSearchParams(queryKey)),
    [queryKey],
  );

  // Local draft state for inputs
  const [keyword, setKeyword] = useState('');
  const [destination, setDestination] = useState(filters.destination);
  const [departureDate, setDepartureDate] = useState(filters.departureDate);
  const [minPrice, setMinPrice] = useState(filters.minPrice);
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Synchronize draft state when filters change externally (React official pattern: state during render)
  const [prevFilters, setPrevFilters] = useState(filters);
  if (
    prevFilters.destination !== filters.destination ||
    prevFilters.departureDate !== filters.departureDate ||
    prevFilters.minPrice !== filters.minPrice ||
    prevFilters.maxPrice !== filters.maxPrice
  ) {
    setPrevFilters(filters);
    setDestination(filters.destination);
    setDepartureDate(filters.departureDate);
    setMinPrice(filters.minPrice);
    setMaxPrice(filters.maxPrice);
    setValidationError(null);
  }

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
            : 'Không thể kết nối máy chủ tour. Vui lòng thử lại sau (MSG127).';
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

  function handleSearchSubmit(e?: FormEvent) {
    if (e) e.preventDefault();

    const candidateState: TourSearchState = {
      ...filters,
      destination: destination.trim(),
      departureDate: departureDate.trim(),
      minPrice: minPrice.trim(),
      maxPrice: maxPrice.trim(),
      page: 1,
    };

    const val = validateTourFilters(candidateState);
    if (!val.isValid) {
      setValidationError(val.errorMessage ?? 'Khoảng lọc không hợp lệ (MSG29).');
      return;
    }

    setValidationError(null);
    navigate(candidateState);
  }

  function handleResetFilters() {
    setDestination('');
    setDepartureDate('');
    setMinPrice('');
    setMaxPrice('');
    setValidationError(null);
    setLoading(true);
    setError(null);
    router.push(isDemo ? '/tours?demo=1' : '/tours');
  }

  function handleSelectQuickDestination(city: string) {
    const val = city === 'Tất cả' ? '' : city;
    setDestination(val);

    const candidateState: TourSearchState = {
      ...filters,
      destination: val,
      minPrice: minPrice.trim(),
      maxPrice: maxPrice.trim(),
      page: 1,
    };

    const valRes = validateTourFilters(candidateState);
    if (!valRes.isValid) {
      setValidationError(valRes.errorMessage ?? 'Bộ lọc không hợp lệ.');
      return;
    }

    setValidationError(null);
    navigate(candidateState);
  }

  function handleRemoveFilter(key: 'destination' | 'departureDate' | 'price') {
    if (key === 'destination') {
      setDestination('');
      navigate({ ...filters, destination: '', page: 1 });
    } else if (key === 'departureDate') {
      setDepartureDate('');
      navigate({ ...filters, departureDate: '', page: 1 });
    } else if (key === 'price') {
      setMinPrice('');
      setMaxPrice('');
      navigate({ ...filters, minPrice: '', maxPrice: '', page: 1 });
    }
  }

  function handlePageChange(nextPage: number) {
    navigate({ ...filters, page: nextPage });
  }

  function handleRetry() {
    setRequestVersion((v) => v + 1);
  }

  const hasActiveFilters = Boolean(
    filters.destination || filters.departureDate || filters.minPrice || filters.maxPrice,
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Editorial Travel Hero (Height ~280px desktop) */}
        <TourEditorialHero />

        {/* Primary Search Bar & Quick Destination Navigation */}
        <TourSearchBar
          keyword={keyword}
          onKeywordChange={setKeyword}
          destination={destination}
          onDestinationChange={setDestination}
          departureDate={departureDate}
          onDepartureDateChange={setDepartureDate}
          onSearchSubmit={handleSearchSubmit}
          onSelectQuickDestination={handleSelectQuickDestination}
          isLoading={loading}
        />

        {/* Main Discovery Workspace (23% Filter Sidebar + 77% Results Grid) */}
        <div id="tours-discovery-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Filter Sidebar (23-25%) */}
          <div className="lg:col-span-3">
            <TourFilterSidebar
              destination={destination}
              onDestinationChange={setDestination}
              departureDate={departureDate}
              onDepartureDateChange={setDepartureDate}
              minPrice={minPrice}
              onMinPriceChange={setMinPrice}
              maxPrice={maxPrice}
              onMaxPriceChange={setMaxPrice}
              onApplyFilters={handleSearchSubmit}
              onResetFilters={handleResetFilters}
              validationError={validationError}
              isLoading={loading}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          {/* Right Column: Tour Results (75-77%) */}
          <section aria-labelledby="tour-results-heading" className="lg:col-span-9">
            {/* Results Header: Count, Sorting & Active Filter Chips */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
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

                {/* Sort Selector (UC-24 - Relevance default, other modes require BE contract) */}
                <div className="flex items-center gap-2">
                  <label htmlFor="tours-sort-select" className="text-xs font-bold text-slate-600">
                    Sắp xếp:
                  </label>
                  <select
                    id="tours-sort-select"
                    defaultValue="relevance"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 transition focus:border-teal-500 focus:outline-hidden"
                  >
                    <option value="relevance">Phù hợp nhất</option>
                    <option value="price-asc" disabled>
                      Giá tăng dần (Chờ BE)
                    </option>
                    <option value="price-desc" disabled>
                      Giá giảm dần (Chờ BE)
                    </option>
                    <option value="rating" disabled>
                      Đánh giá cao (Chờ BE)
                    </option>
                    <option value="departure" disabled>
                      Ngày khởi hành (Chờ BE)
                    </option>
                  </select>
                </div>
              </div>

              {/* Active Filter Summary Chips */}
              {hasActiveFilters && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-bold text-slate-500">Đang lọc:</span>

                  {filters.destination && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-[#007d6e]">
                      <span>Điểm đến: {filters.destination}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFilter('destination')}
                        className="cursor-pointer hover:text-red-600"
                        aria-label="Bỏ chọn điểm đến"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {filters.departureDate && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-[#007d6e]">
                      <span>Khởi hành: {filters.departureDate}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFilter('departureDate')}
                        className="cursor-pointer hover:text-red-600"
                        aria-label="Bỏ chọn ngày khởi hành"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {(filters.minPrice || filters.maxPrice) && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-[#007d6e]">
                      <span>
                        Giá: {filters.minPrice ? formatVndPrice(Number(filters.minPrice)) : '0₫'} -{' '}
                        {filters.maxPrice ? formatVndPrice(Number(filters.maxPrice)) : '∞'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFilter('price')}
                        className="cursor-pointer hover:text-red-600"
                        aria-label="Bỏ chọn mức giá"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[11px] font-bold text-slate-500 hover:text-red-600 underline cursor-pointer ml-1"
                  >
                    Xóa tất cả
                  </button>
                </div>
              )}
            </div>

            {/* Network Error Preservation Banner (UC-24 7.a1: preserve previous results) */}
            {error && toursData && toursData.items.length > 0 && (
              <div
                role="alert"
                className="mb-6 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-red-600">error</span>
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="cursor-pointer font-bold text-red-700 underline hover:text-red-900"
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* Conditional States */}
            {loading ? (
              <TourListSkeleton />
            ) : error && (!toursData || toursData.items.length === 0) ? (
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
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3"
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

            {/* UC-25: Tour Recommendations Section (Positioned comfortably below results) */}
            <div className="mt-12">
              <TourRecommendationsSection
                recommendations={recommendations}
                isPendingBe={isPendingBeRecs}
                isDemo={isDemoRecs}
                onRefresh={() => setRequestVersion((v) => v + 1)}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
