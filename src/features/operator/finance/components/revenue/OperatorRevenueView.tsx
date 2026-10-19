'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import {
  exportOperatorRevenueReport,
  getOperatorRevenueReport,
  getOperatorRevenueTours,
} from '../../services/operatorRevenueService';
import { isFinanceDemoAllowedInCurrentEnv } from '../../data/operatorRevenueDemoFixtures';
import { financeEn } from '../../resources/en';
import {
  REVENUE_DEFAULT_PAGE_SIZE,
  type ExportRevenuePayload,
  type RevenueFilterInput,
  type RevenueReportResult,
} from '../../types/revenueLifecycle';
import type { DemoTourPackage } from '../../data/operatorRevenueDemoFixtures';

import { RevenueFilterControls } from './RevenueFilterControls';
import { RevenueSummaryCards } from './RevenueSummaryCards';
import { RevenueChart } from './RevenueChart';
import { RevenueDetailTable } from './RevenueDetailTable';
import { ExportRevenueDialog } from './ExportRevenueDialog';

// A booking elsewhere (a Traveler completing payment) can change this report at any time; the
// operator is a passive viewer, not the actor who triggers a change. Polling at this cadence
// keeps the dashboard reasonably fresh without hammering the report query, and only runs while
// the tab is actually visible (see the visibility-driven effect below).
const REVENUE_POLL_INTERVAL_MS = 45_000;

export function OperatorRevenueView() {
  const { context } = useWebSession();
  const searchParams = useSearchParams();

  // Environment & Demo state determination
  const demoQuery = searchParams.get('demo') === '1';
  const isDemo = demoQuery && isFinanceDemoAllowedInCurrentEnv();
  const actorUserId = context?.userId;

  // Seeded development records are in the current reporting month.
  const initialFilters: RevenueFilterInput = {
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    granularity: 'monthly',
    tourId: undefined,
  };

  const [appliedFilters, setAppliedFilters] =
    useState<RevenueFilterInput>(initialFilters);
  const [reportResult, setReportResult] = useState<RevenueReportResult | null>(
    null
  );
  const [tours, setTours] = useState<DemoTourPackage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  // Starts true so the first mount shows a loading state without an effect setting it
  // synchronously; every later load is triggered by an event handler that sets this itself.
  const [isLoading, setIsLoading] = useState(true);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  // Guards every setState below against firing after unmount, across all four callers of
  // loadReport (initial/filter-change load, manual refresh, tab-focus refresh, background poll).
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load owned tour packages for filter dropdown
  useEffect(() => {
    let isMounted = true;
    async function loadTours() {
      const data = await getOperatorRevenueTours({
        isDemo,
        demoActorUserId: actorUserId,
      });
      if (isMounted) setTours(data);
    }
    loadTours();
    return () => {
      isMounted = false;
    };
  }, [isDemo, actorUserId]);

  // Single data-fetch path shared by the initial load, Apply/Reset filters, the manual Refresh
  // button, tab-focus refresh, and background polling. It never flips `isLoading` on; the caller
  // that wants a visible spinner sets that synchronously itself (an event handler, never an
  // effect body) before triggering this. `silent` skips turning it back off, so a background
  // refresh that didn't turn it on also never touches it.
  const loadReport = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        const result = await getOperatorRevenueReport(
          appliedFilters,
          { isDemo, demoActorUserId: actorUserId },
          { page: currentPage, pageSize: REVENUE_DEFAULT_PAGE_SIZE }
        );
        if (!isMountedRef.current) return;
        setReportResult(result);
        setLastUpdatedAt(new Date());
      } finally {
        if (isMountedRef.current && !options?.silent) setIsLoading(false);
      }
    },
    [appliedFilters, currentPage, isDemo, actorUserId]
  );

  // Re-fetch whenever filters, page, or actor/demo context change. The resulting loading
  // indicator comes from `isLoading`'s initializer (mount) or from the handler that changed
  // these dependencies (Apply/Reset/manual Refresh) — never from this effect setting it.
  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  // Keep the dashboard fresh while it is actually being looked at: refresh immediately when the
  // tab regains focus/visibility, then poll on an interval only while visible. A booking made by
  // a Traveler elsewhere is what changes this report, so the operator has no other signal that
  // new data might exist.
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const stopPolling = () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    const startPolling = () => {
      if (intervalId !== undefined) return;
      intervalId = setInterval(() => {
        void loadReport({ silent: true });
      }, REVENUE_POLL_INTERVAL_MS);
    };

    const handleVisible = () => {
      if (document.visibilityState !== 'visible') {
        stopPolling();
        return;
      }
      void loadReport({ silent: true });
      startPolling();
    };

    if (document.visibilityState === 'visible') startPolling();
    document.addEventListener('visibilitychange', handleVisible);
    window.addEventListener('focus', handleVisible);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisible);
      window.removeEventListener('focus', handleVisible);
    };
  }, [loadReport]);

  // Filter application handler
  const handleApplyFilters = (newFilters: RevenueFilterInput) => {
    setIsLoading(true);
    setAppliedFilters(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setIsLoading(true);
    setAppliedFilters(initialFilters);
    setCurrentPage(1);
  };

  const handleManualRefresh = () => {
    setIsLoading(true);
    void loadReport();
  };

  const lastUpdatedLabel = lastUpdatedAt
    ? `${financeEn.revenue.lastUpdatedPrefix} ${lastUpdatedAt.toLocaleTimeString()}`
    : financeEn.revenue.lastUpdatedNever;

  // Export report handler (UC-45)
  const handleExport = async (
    payload: ExportRevenuePayload,
    simulateAsync = false
  ) => {
    const result = await exportOperatorRevenueReport(
      payload,
      { isDemo, demoActorUserId: actorUserId },
      simulateAsync
    );

    if (
      result.success &&
      !result.isAsyncSimulated &&
      !result.isAsyncQueued &&
      payload.format === 'csv' &&
      result.fileContent &&
      result.fileName &&
      result.fileName.toLowerCase().endsWith('.csv')
    ) {
      // Trigger client download of real CSV demo file only
      const blob = new Blob([result.fileContent], {
        type: result.mimeType || 'text/csv;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToastMessage(result.message || financeEn.messages.MSG116);
      setTimeout(() => setToastMessage(null), 5000);
    }
    return result;
  };

  const tourNameMap = tours.reduce<Record<string, string>>((acc, t) => {
    acc[t.id] = t.title;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#00152A] tracking-tight">
            {financeEn.revenue.title}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {financeEn.revenue.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="text-xs text-slate-400"
            aria-live="polite"
            data-testid="revenue-last-updated"
          >
            {lastUpdatedLabel}
          </span>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#00152A] disabled:opacity-50"
          >
            <span
              className={`material-symbols-outlined text-[16px] ${isLoading ? 'animate-spin' : ''}`}
            >
              refresh
            </span>
            <span>{financeEn.revenue.refreshBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportDialogOpen(true)}
            disabled
            title="Xuất báo cáo sẽ được triển khai ở UC-45"
            className="inline-flex items-center gap-2 rounded-xl bg-[#006B5F] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#005249]"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>{financeEn.revenue.filters.exportBtn}</span>
          </button>
        </div>
      </div>

      {/* Demo Mode Notice */}
      {isDemo && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-lg">
              science
            </span>
            <div>
              <p className="font-bold">
                {financeEn.revenue.demoNoticeTitle}
              </p>
              <p className="mt-0.5 text-amber-700">
                {financeEn.revenue.demoNoticeDesc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-emerald-600 text-[18px]">
            check_circle
          </span>
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Semantic Error / Notice Banner */}
      {reportResult?.errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-800 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-amber-600 text-[18px]">
            info
          </span>
          <span className="font-medium">{reportResult.errorMessage}</span>
        </div>
      )}

      {/* Filter Controls (Screen #89) */}
      <RevenueFilterControls
        appliedFilters={appliedFilters}
        tours={tours}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        onOpenExport={() => setIsExportDialogOpen(true)}
        isLoading={isLoading}
      />

      {/* Summary Cards */}
      {reportResult && (
        <RevenueSummaryCards summary={reportResult.summary} />
      )}

      {/* Revenue Trend Chart */}
      {reportResult && (
        <RevenueChart chartData={reportResult.chartData} />
      )}

      {/* Detail Table */}
      {reportResult && (
        <RevenueDetailTable
          items={reportResult.tourDetails}
          totalCount={reportResult.totalToursCount}
          currentPage={currentPage}
          totalPages={reportResult.totalPages}
          pageSize={REVENUE_DEFAULT_PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Export Report Dialog (Screen #90) */}
      <ExportRevenueDialog
        isOpen={isExportDialogOpen}
        appliedFilters={appliedFilters}
        tourNameMap={tourNameMap}
        isDemo={isDemo}
        onClose={() => setIsExportDialogOpen(false)}
        onExport={handleExport}
      />
    </div>
  );
}
