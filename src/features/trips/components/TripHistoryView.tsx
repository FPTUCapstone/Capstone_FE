'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { ROUTES } from '@/lib/routes';
import { tripReviewEn } from '../resources/en';
import { isTripDemoAllowedInCurrentEnv } from '../services/tripHistoryApi';
import { fetchTripHistory, TripHistoryClientError } from '../services/tripHistoryClient';
import {
  TRIP_HISTORY_PAGE_SIZE,
  type TripHistoryPage,
  type TripListItem,
  type TripTab,
  type TripTypeFilter,
} from '../types/tripHistoryContract';
import { TripCard, type TripDetailFocus } from './TripCard';
import { TripDetailDialog } from './TripDetailDialog';
import { TripFiltersBar } from './TripFiltersBar';
import { TripSummaryBanner } from './TripSummaryBanner';

interface OpenDetail {
  item: TripListItem;
  focus?: TripDetailFocus;
}

const TAB_BUTTON =
  'flex-1 rounded-xl py-2.5 text-center text-xs font-bold transition-all sm:text-sm';

export function TripHistoryView() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1';
  // The page may ask for demo data; the client and this banner both honour it only where it is allowed.
  const showDemoBanner = isDemo && isTripDemoAllowedInCurrentEnv();

  const [activeTab, setActiveTab] = useState<TripTab>('Completed');
  const [tripType, setTripType] = useState<TripTypeFilter>('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TripHistoryPage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryIndex, setRetryIndex] = useState(0);
  const [openDetail, setOpenDetail] = useState<OpenDetail | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchTripHistory(
      { tab: activeTab, tripType, fromDate: fromDate || undefined, toDate: toDate || undefined, page },
      { allowDemo: isDemo, signal: controller.signal },
    )
      .then((response) => {
        if (controller.signal.aborted) return;
        setData(response);
        setErrorMessage(null);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setData(null);
        setErrorMessage(
          error instanceof TripHistoryClientError ? error.message : tripReviewEn.errors.systemError,
        );
        setLoading(false);
      });

    // A newer request supersedes this one; its late answer must not overwrite the newer list.
    return () => controller.abort();
  }, [activeTab, tripType, fromDate, toDate, page, isDemo, retryIndex]);

  const startLoading = () => {
    setLoading(true);
    setErrorMessage(null);
  };

  const handleRetry = () => {
    startLoading();
    setRetryIndex((value) => value + 1);
  };

  const handleTabChange = (tab: TripTab) => {
    if (tab === activeTab) return;
    startLoading();
    setData(null);
    setActiveTab(tab);
    setPage(1);
  };

  const handleTripTypeChange = (type: TripTypeFilter) => {
    startLoading();
    setData(null);
    setTripType(type);
    setPage(1);
  };

  const handleDateRangeChange = (from: string, to: string) => {
    startLoading();
    setData(null);
    setFromDate(from);
    setToDate(to);
    setPage(1);
  };

  const handlePageChange = (next: number) => {
    startLoading();
    setPage(next);
  };

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / TRIP_HISTORY_PAGE_SIZE));

  return (
    <div className="space-y-6">
      {showDemoBanner && (
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600" aria-hidden="true">
              science
            </span>
            <span>
              <strong>{tripReviewEn.demo.tripHistoryBannerPrefix}</strong>{' '}
              {tripReviewEn.demo.tripHistoryBannerText}
            </span>
          </div>
          <span className="rounded bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
            {tripReviewEn.demo.badgeLabel}
          </span>
        </div>
      )}

      {/* Segmented tabs (Report 3 §3.7.1) */}
      <div className="flex items-center rounded-2xl bg-slate-200/70 p-1.5 shadow-2xs">
        <button
          type="button"
          onClick={() => handleTabChange('Upcoming')}
          className={`${TAB_BUTTON} ${
            activeTab === 'Upcoming' ? 'bg-white text-[#00152A] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {tripReviewEn.tripHistory.tabs.upcoming}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('Completed')}
          className={`${TAB_BUTTON} flex items-center justify-center gap-1.5 ${
            activeTab === 'Completed' ? 'bg-white text-[#00152A] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="inline-block h-2 w-2 rounded-full bg-[#006B5F]" />
          <span>{tripReviewEn.tripHistory.tabs.completed}</span>
          {activeTab === 'Completed' && totalCount > 0 && (
            <span className="rounded-full bg-[#E6F4F1] px-1.5 py-0.5 text-[10px] font-extrabold text-[#006B5F]">
              {totalCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('Cancelled')}
          className={`${TAB_BUTTON} ${
            activeTab === 'Cancelled' ? 'bg-white text-[#00152A] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {tripReviewEn.tripHistory.tabs.cancelled}
        </button>
      </div>

      {data?.summary && <TripSummaryBanner summary={data.summary} isDemo={showDemoBanner} />}

      <TripFiltersBar
        tripType={tripType}
        onTripTypeChange={handleTripTypeChange}
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={handleDateRangeChange}
      />

      {loading ? (
        <div aria-label={tripReviewEn.accessibility.loadingTripsAria} className="space-y-4">
          <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      ) : errorMessage ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800 sm:p-8">
          <span className="material-symbols-outlined mx-auto mb-2 text-[32px] text-rose-600" aria-hidden="true">
            error
          </span>
          <h3 className="text-base font-bold text-rose-900">{tripReviewEn.tripHistory.error.title}</h3>
          <p className="mt-1 text-xs">{errorMessage}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
          >
            {tripReviewEn.actions.retry}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div role="status" className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
              luggage
            </span>
          </div>
          <h3 className="text-base font-bold text-[#00152A]">{tripReviewEn.tripHistory.empty.title}</h3>
          <p className="mt-1 text-xs text-slate-500">{tripReviewEn.tripHistory.empty.description}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={ROUTES.plan}
              className="rounded-xl bg-[#006B5F] px-4 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-[#00574D]"
            >
              {tripReviewEn.actions.planSmartItinerary}
            </Link>
            <Link
              href={ROUTES.tours}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
            >
              {tripReviewEn.actions.exploreLocalTours}
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>
              {tripReviewEn.tripHistory.showingPrefix}{' '}
              <strong className="text-slate-800">{items.length}</strong>{' '}
              {tripReviewEn.tripHistory.showingSeparator}{' '}
              <strong className="text-slate-800">{totalCount}</strong>{' '}
              {tripReviewEn.tripHistory.showingSuffix}
            </span>
            <span className="text-[11px] text-slate-400">{tripReviewEn.tripHistory.timezoneNotice}</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {items.map((item) => (
              <TripCard
                key={`${item.kind}:${item.id}`}
                item={item}
                onOpenDetail={(opened, focus) => setOpenDetail({ item: opened, focus })}
                isDemo={showDemoBanner}
              />
            ))}
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row">
            <p className="text-xs text-slate-500">
              {tripReviewEn.pagination.pagePrefix} <span className="font-bold text-slate-800">{page}</span>{' '}
              {tripReviewEn.pagination.pageSeparator}{' '}
              <span className="font-bold text-slate-800">{totalPages}</span>{' '}
              {tripReviewEn.pagination.totalTripsSuffix(totalCount)}
            </p>
            <div
              className="flex items-center gap-1.5"
              role="navigation"
              aria-label={tripReviewEn.accessibility.paginationNavAria}
            >
              <button
                type="button"
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={tripReviewEn.accessibility.previousPageAria}
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  chevron_left
                </span>
                <span>{tripReviewEn.pagination.previous}</span>
              </button>
              <span className="px-2 text-xs font-bold text-slate-800">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={tripReviewEn.accessibility.nextPageAria}
              >
                <span>{tripReviewEn.pagination.next}</span>
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {openDetail && (
        <TripDetailDialog
          item={openDetail.item}
          focus={openDetail.focus}
          allowDemo={isDemo}
          onClose={() => setOpenDetail(null)}
        />
      )}
    </div>
  );
}
