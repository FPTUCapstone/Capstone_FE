'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ROUTES } from '@/lib/routes';
import { poiManagementEn } from '../resources/en';
import { loadPoiManagement, PoiManagementApiError } from '../services/poi-management-api';
import type {
  PoiManagementCategory,
  PoiManagementItem,
  PoiManagementOpeningHour,
  PoiManagementQuery,
  PoiManagementResponse,
  PoiManagementStatus,
} from '../types/poi-management';

const PAGE_SIZE = 20;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type ViewState =
  | { kind: 'loading' }
  | { kind: 'success'; response: PoiManagementResponse }
  | { kind: 'error'; error: PoiManagementApiError };

function openingHoursSummary(hours: PoiManagementOpeningHour[]) {
  if (hours.length === 0) return poiManagementEn.hoursMissing;
  return hours.map((hour) => {
    const day = DAY_NAMES[hour.dayOfWeek];
    return hour.isClosed
      ? `${day}: Closed`
      : `${day}: ${hour.openTime}–${hour.closeTime}`;
  }).join('; ');
}

function errorMessage(error: PoiManagementApiError) {
  if (error.status === 400) return poiManagementEn.invalidQuery;
  if (error.status === 401) return poiManagementEn.signedOut;
  if (error.status === 403) return poiManagementEn.accessRequired;
  return poiManagementEn.unavailable;
}

function isBeyondPage(response: PoiManagementResponse) {
  return response.page > Math.max(1, response.totalPages);
}

export function PoiCatalogListView() {
  const [draftSearch, setDraftSearch] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState<PoiManagementQuery>({ page: 1, pageSize: PAGE_SIZE });
  const [categories, setCategories] = useState<PoiManagementCategory[]>([]);
  const [state, setState] = useState<ViewState>({ kind: 'loading' });
  const [retryVersion, setRetryVersion] = useState(0);
  const requestSequence = useRef(0);

  useEffect(() => {
    const sequence = ++requestSequence.current;
    const controller = new AbortController();
    loadPoiManagement(submittedQuery, controller.signal)
      .then((response) => {
        if (controller.signal.aborted || sequence !== requestSequence.current) return;
        setCategories(response.metadata.categories);
        setState({ kind: 'success', response });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || sequence !== requestSequence.current) return;
        setState({
          kind: 'error',
          error: error instanceof PoiManagementApiError
            ? error
            : new PoiManagementApiError(503, 'POI_MANAGEMENT_UNAVAILABLE'),
        });
      });
    return () => controller.abort();
  }, [submittedQuery, retryVersion]);

  const hasFilters = Boolean(submittedQuery.search || submittedQuery.categoryId || submittedQuery.status);
  const response = state.kind === 'success' ? state.response : null;
  const validationErrors = state.kind === 'error' && state.error.status === 400
    ? state.error.errors
    : {};

  const submitQuery = (update: (current: PoiManagementQuery) => PoiManagementQuery) => {
    requestSequence.current += 1;
    setState({ kind: 'loading' });
    setSubmittedQuery(update);
  };

  const submitSearch = () => {
    const search = draftSearch.trim();
    submitQuery((current) => ({
      ...current,
      page: 1,
      search: search || undefined,
    }));
  };

  const resetFilters = () => {
    setDraftSearch('');
    submitQuery(() => ({ page: 1, pageSize: PAGE_SIZE }));
  };

  return (
    <div className="pb-16 text-[#1C2923]">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-6 rounded-2xl border border-[#2A3B33] bg-[#1C2923] p-6 text-[#F7F6F2] shadow-sm md:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#758B74] bg-[#273830] px-3 py-1 text-xs font-bold tracking-wider text-[#E8EFE9] uppercase">
                <span aria-hidden="true" className="material-symbols-outlined text-[14px]">location_on</span>
                <span>Master Data Management</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Points of Interest Catalog
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#A3B3AB]">
                Screen #16: Manage tourist attractions, geo-coordinates, and operating schedules powering the TripMate routing engine.
              </p>
            </div>

            <Link
              href={ROUTES.admin.createPoi}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#245747] border border-[#758B74] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1B4337] shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">add_location_alt</span>
              <span>Create New POI</span>
            </Link>
          </div>
        </header>

        {/* Filters and Search Bar */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#E6E4DD] bg-[#FFFFFF] p-4 shadow-xs lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div>
              <label htmlFor="poi-category-filter" className="mb-1 block text-xs font-bold text-[#4A5851]">
                Category
              </label>
              <select
                id="poi-category-filter"
                aria-invalid={Boolean(validationErrors.categoryId)}
                value={submittedQuery.categoryId ?? ''}
                onChange={(event) => submitQuery((current) => ({
                  ...current,
                  page: 1,
                  categoryId: event.target.value ? Number(event.target.value) : undefined,
                }))}
                className="min-h-11 rounded-xl border border-[#D8D5CC] bg-[#F7F6F2] px-3 py-2 text-xs font-semibold text-[#1C2923] focus:border-[#245747] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#245747]/30"
              >
                <option value="">All</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="poi-status-filter" className="mb-1 block text-xs font-bold text-[#4A5851]">
                Status
              </label>
              <select
                id="poi-status-filter"
                aria-invalid={Boolean(validationErrors.status)}
                value={submittedQuery.status ?? ''}
                onChange={(event) => submitQuery((current) => ({
                  ...current,
                  page: 1,
                  status: (event.target.value || undefined) as PoiManagementStatus | undefined,
                }))}
                className="min-h-11 rounded-xl border border-[#D8D5CC] bg-[#F7F6F2] px-3 py-2 text-xs font-semibold text-[#1C2923] focus:border-[#245747] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#245747]/30"
              >
                <option value="">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="min-h-11 rounded-xl border border-[#D8D5CC] bg-white px-4 py-2 text-xs font-bold text-[#1C2923] transition hover:bg-[#F0EFEA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#245747]/30"
            >
              Reset filters
            </button>
          </div>

          <form
            className="w-full lg:max-w-md"
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
          >
            <label htmlFor="poi-search" className="mb-1 block text-xs font-bold text-[#4A5851]">
              Search points of interest
            </label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <span aria-hidden="true" className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#74827B]">
                  search
                </span>
                <input
                  id="poi-search"
                  type="search"
                  value={draftSearch}
                  onChange={(event) => setDraftSearch(event.target.value)}
                  placeholder="Search by name or address…"
                  aria-invalid={Boolean(validationErrors.search)}
                  className="min-h-11 w-full rounded-xl border border-[#D8D5CC] bg-[#F7F6F2] py-2 pl-9 pr-3 text-xs text-[#1C2923] placeholder-[#74827B] transition focus:border-[#245747] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#245747]/30"
                />
              </div>
              <button
                type="submit"
                aria-busy={state.kind === 'loading'}
                className="min-h-11 rounded-xl bg-[#245747] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1B4337] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#245747]/40 focus-visible:ring-offset-2"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        <p role="status" aria-live="polite" className="sr-only">
          {state.kind === 'loading'
            ? poiManagementEn.loading
            : state.kind === 'success'
              ? poiManagementEn.loaded(state.response.totalCount)
              : ''}
        </p>

        {/* POI Data Table */}
        <div className="overflow-hidden rounded-2xl border border-[#E6E4DD] bg-[#FFFFFF] shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-xs" aria-label="Points of Interest Data Table" aria-busy={state.kind === 'loading'}>
              <thead className="border-b border-[#E6E4DD] bg-[#F0EFEA] text-[11px] font-bold uppercase tracking-wider text-[#4A5851]">
                <tr>
                  <th scope="col" className="px-5 py-3.5">ID</th>
                  <th scope="col" className="px-5 py-3.5">Point of Interest</th>
                  <th scope="col" className="px-5 py-3.5">Category</th>
                  <th scope="col" className="px-5 py-3.5">Spatial Coordinates</th>
                  <th scope="col" className="px-5 py-3.5">Opening Schedule</th>
                  <th scope="col" className="px-5 py-3.5">Status</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E4DD]">
                {state.kind === 'loading' ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-[#74827B]">
                      <span aria-hidden="true" className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
                      <p className="mt-3 text-sm font-bold text-[#1C2923]">{poiManagementEn.loading}</p>
                    </td>
                  </tr>
                ) : state.kind === 'error' ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-[#74827B]">
                      <div role="alert" className="mx-auto flex max-w-md flex-col items-center">
                        <span aria-hidden="true" className="material-symbols-outlined text-4xl text-error">error</span>
                        <p className="mt-3 text-sm font-bold text-[#1C2923]">{errorMessage(state.error)}</p>
                        {state.error.status === 400 && Object.keys(state.error.errors).length > 0 ? (
                          <p className="mt-1 text-xs text-[#74827B]">
                            {Object.values(state.error.errors).flat().join(' ')}
                          </p>
                        ) : null}
                        {state.error.status >= 500 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setState({ kind: 'loading' });
                              setRetryVersion((version) => version + 1);
                            }}
                            className="mt-4 min-h-11 rounded-xl bg-[#245747] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1B4337] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#245747]/40 focus-visible:ring-offset-2"
                          >
                            Retry
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : state.response.items.length > 0 ? (
                  state.response.items.map((poi: PoiManagementItem) => (
                    <tr key={poi.id} className="transition-colors hover:bg-[#F7F6F2]/70">
                      <td className="px-5 py-4 font-mono font-bold text-[#1C2923]">
                        #{poi.id}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#1C2923]">{poi.name}</div>
                        <div className="max-w-xs truncate text-[11px] text-[#74827B]">
                          {poi.address ?? poiManagementEn.addressMissing}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-[#E8EFE9] px-2.5 py-0.5 text-[11px] font-semibold text-[#1C2923]">
                          {poi.categoryName}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-[#4A5851]">
                        {poi.latitude.toFixed(4)}, {poi.longitude.toFixed(4)}
                      </td>
                      <td className="px-5 py-4 text-[#4A5851]">
                        {openingHoursSummary(poi.openingHours)}
                      </td>
                      <td className="px-5 py-4">
                        {poi.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#BCE0CD] bg-[#E7F2EC] px-2.5 py-0.5 text-[11px] font-semibold text-[#1B5E3C]">
                            <span aria-hidden="true" className="material-symbols-outlined text-[12px]">check_circle</span>
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#D8D5CC] bg-[#EDECE8] px-2.5 py-0.5 text-[11px] font-semibold text-[#74827B]">
                            <span aria-hidden="true" className="material-symbols-outlined text-[12px]">block</span>
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/pois/${poi.id}`}
                          target="_blank"
                          aria-label={`Preview ${poi.name}`}
                          className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-[#D8D5CC] bg-white px-3 py-2 text-xs font-semibold text-[#1C2923] transition hover:bg-[#F0EFEA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#245747]/30"
                        >
                          <span>Preview</span>
                          <span aria-hidden="true" className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-[#74827B]">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <span aria-hidden="true" className="material-symbols-outlined text-4xl text-[#758B74]">inventory_2</span>
                        <p className="mt-3 text-sm font-bold text-[#1C2923]">
                          {isBeyondPage(state.response)
                            ? poiManagementEn.beyondPageTitle
                            : hasFilters
                              ? poiManagementEn.noResultsTitle
                              : poiManagementEn.catalogueEmptyTitle}
                        </p>
                        <p className="mt-1 text-xs text-[#74827B]">
                          {isBeyondPage(state.response)
                            ? poiManagementEn.beyondPageDetail
                            : hasFilters
                              ? poiManagementEn.noResultsDetail
                              : poiManagementEn.catalogueEmptyDetail}
                        </p>
                        {isBeyondPage(state.response) ? (
                          <div className="mt-4 flex flex-wrap justify-center gap-2">
                            <button
                              type="button"
                              aria-label="Previous page"
                              onClick={() => submitQuery((current) => ({ ...current, page: Math.max(1, (current.page ?? 1) - 1) }))}
                              className="min-h-11 rounded-xl border border-[#D8D5CC] bg-white px-4 py-2 text-xs font-bold text-[#1C2923] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#245747]/30"
                            >
                              Previous
                            </button>
                            <button
                              type="button"
                              onClick={() => submitQuery((current) => ({ ...current, page: 1 }))}
                              className="min-h-11 rounded-xl bg-[#245747] px-4 py-2 text-xs font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#245747]/40 focus-visible:ring-offset-2"
                            >
                              Back to first page
                            </button>
                          </div>
                        ) : hasFilters ? (
                          <button
                            type="button"
                            onClick={resetFilters}
                            className="mt-4 min-h-11 rounded-xl border border-[#D8D5CC] bg-white px-4 py-2 text-xs font-bold text-[#1C2923] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#245747]/30"
                          >
                            Reset filters
                          </button>
                        ) : (
                          <Link
                            href={ROUTES.admin.createPoi}
                            className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#245747] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1B4337] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#245747]/40 focus-visible:ring-offset-2"
                          >
                            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">add_location_alt</span>
                            <span>Create New POI</span>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {response && response.items.length > 0 ? (
          <nav aria-label="POI catalogue pagination" className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#E6E4DD] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-[#4A5851]">
              Page {response.page} of {Math.max(1, response.totalPages)} · {response.totalCount} total
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Previous page"
                disabled={response.page <= 1}
                onClick={() => submitQuery((current) => ({ ...current, page: Math.max(1, (current.page ?? 1) - 1) }))}
                className="min-h-11 rounded-xl border border-[#D8D5CC] bg-white px-4 py-2 text-xs font-bold text-[#1C2923] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#245747]/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                aria-label="Next page"
                disabled={response.totalPages === 0 || response.page >= response.totalPages}
                onClick={() => submitQuery((current) => ({ ...current, page: (current.page ?? 1) + 1 }))}
                className="min-h-11 rounded-xl bg-[#245747] px-4 py-2 text-xs font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#245747]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
