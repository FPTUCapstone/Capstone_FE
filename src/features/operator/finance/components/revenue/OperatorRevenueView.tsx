'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import {
  createRevenueExport,
  downloadRevenueExport,
  getOperatorRevenueReport,
  getOperatorRevenueTours,
} from '../../services/operatorRevenueService';
import { isFinanceDemoAllowedInCurrentEnv } from '../../data/operatorRevenueDemoFixtures';
import { financeEn } from '../../resources/en';
import {
  REVENUE_DEFAULT_PAGE_SIZE,
  type CreateRevenueExportResult,
  type ExportRevenuePayload,
  type RevenueFilterInput,
  type RevenueReportResult,
} from '../../types/revenueLifecycle';
import type { DemoTourPackage } from '../../data/operatorRevenueDemoFixtures';

import { RevenueFilterControls } from './RevenueFilterControls';
import { RevenueSummaryCards } from './RevenueSummaryCards';
import { RevenueChart } from './RevenueChart';
import { SettlementDetailsCard } from './SettlementDetailsCard';
import { RevenueDetailTable } from './RevenueDetailTable';
import { ExportRevenueDialog } from './ExportRevenueDialog';
import { ExportHistoryPanel } from './ExportHistoryPanel';

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

  return <RevenueWorkspace key={JSON.stringify([actorUserId, isDemo])} actorUserId={actorUserId} isDemo={isDemo} />;
}

// Actor/mode changes discard the complete private workspace, including child drafts and exports.
// Ordinary session rerenders keep the same key and preserve the current filter edits.
function RevenueWorkspace({ actorUserId, isDemo }: {
  actorUserId: string | number | undefined;
  isDemo: boolean;
}) {
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
  const [tourLoad, setTourLoad] = useState<{
    isDemo: boolean;
    actorUserId: typeof actorUserId;
    tours: DemoTourPackage[];
    failed: boolean;
  } | null>(null);
  const [tourRetryToken, setTourRetryToken] = useState(0);
  const tourContextMatches = tourLoad?.isDemo === isDemo &&
    tourLoad?.actorUserId === actorUserId;
  const tours = tourContextMatches ? tourLoad.tours : [];
  const toursFailed = tourContextMatches && tourLoad.failed;
  const isToursLoading = !tourContextMatches;
  const [currentPage, setCurrentPage] = useState(1);
  // Starts true so the first mount shows a loading state without an effect setting it
  // synchronously; every later load is triggered by an event handler that sets this itself.
  const [isLoading, setIsLoading] = useState(true);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  // Bumped after every create-export call so ExportHistoryPanel refreshes immediately instead
  // of waiting for its own poll interval.
  const [exportHistoryRefreshToken, setExportHistoryRefreshToken] = useState(0);
  // Bumped by every explicit user action (Apply, Reset, manual Refresh) so the fetch effect
  // below always re-fires, even when the submitted filters are value-identical to the current
  // ones (e.g. clicking Apply again without editing anything). appliedFilters alone cannot
  // drive this: if the new filter object is the same reference as the current state, React
  // bails out of re-rendering for that update, loadReport's identity never changes, the
  // [loadReport] effect never re-runs, and isLoading — set to true by the handler — would be
  // stuck forever with no fetch left to turn it back off.
  const [requestToken, setRequestToken] = useState(0);

  // Guards every setState below against firing after unmount, across all four callers of
  // loadReport (initial/filter-change load, manual refresh, tab-focus refresh, background poll).
  const isMountedRef = useRef(true);
  const reportRequestRef = useRef(0);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      reportRequestRef.current = reportRequestRef.current + 1;
    };
  }, []);

  // Load owned tour packages for filter dropdown
  useEffect(() => {
    let isMounted = true;
    async function loadTours() {
      try {
        const data = await getOperatorRevenueTours({
          isDemo,
          demoActorUserId: actorUserId,
        });
        if (isMounted) setTourLoad({ isDemo, actorUserId, tours: data, failed: false });
      } catch {
        if (isMounted) setTourLoad({ isDemo, actorUserId, tours: [], failed: true });
      }
    }
    void loadTours();
    return () => {
      isMounted = false;
    };
  }, [isDemo, actorUserId, tourRetryToken]);

  // The initial load, filters, manual refresh, focus and polling share one request sequence.
  // Callers start visible loading. Only the newest request may publish data and settle it,
  // including a newer background request that overlaps a user-triggered load.
  const loadReport = useCallback(
    async () => {
      const requestId = ++reportRequestRef.current;
      try {
        const result = await getOperatorRevenueReport(
          appliedFilters,
          { isDemo, demoActorUserId: actorUserId },
          { page: currentPage, pageSize: REVENUE_DEFAULT_PAGE_SIZE }
        );
        if (!isMountedRef.current || requestId !== reportRequestRef.current) return;
        setReportResult(result);
        setLastUpdatedAt(new Date());
      } finally {
        if (isMountedRef.current && requestId === reportRequestRef.current) setIsLoading(false);
      }
    },
    // requestToken is intentionally unused in the body: it exists only to force this
    // callback's identity to change on every explicit user action, even when appliedFilters
    // is value-identical to its previous state (see the requestToken declaration above for
    // why that case needs forcing).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appliedFilters, currentPage, isDemo, actorUserId, requestToken]
  );

  // Re-fetch whenever filters, page, or actor/demo context change. The resulting loading
  // indicator comes from `isLoading`'s initializer (mount) or from the handler that changed
  // these dependencies (Apply/Reset/manual Refresh) — never from this effect setting it.
  useEffect(() => {
    void loadReport();
    return () => { reportRequestRef.current = reportRequestRef.current + 1; };
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
        void loadReport();
      }, REVENUE_POLL_INTERVAL_MS);
    };

    const handleVisible = () => {
      if (document.visibilityState !== 'visible') {
        stopPolling();
        return;
      }
      void loadReport();
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
    setRequestToken((token) => token + 1);
  };

  const handleResetFilters = () => {
    setIsLoading(true);
    setAppliedFilters(initialFilters);
    setCurrentPage(1);
    setRequestToken((token) => token + 1);
  };

  const handleManualRefresh = () => {
    setIsLoading(true);
    setRequestToken((token) => token + 1);
  };

  const lastUpdatedLabel = lastUpdatedAt
    ? `${financeEn.revenue.lastUpdatedPrefix} ${lastUpdatedAt.toLocaleTimeString()}`
    : financeEn.revenue.lastUpdatedNever;

  // Export report handler (UC-45)
  const handleExport = async (
    payload: ExportRevenuePayload
  ): Promise<CreateRevenueExportResult> => {
    const result = await createRevenueExport(payload, {
      isDemo,
      demoActorUserId: actorUserId,
    });

    if (!isMountedRef.current) return result;

    if (result.success) {
      // A just-created export (Ready or Queued) always belongs in the history list.
      setExportHistoryRefreshToken((token) => token + 1);
    }

    if (result.success && result.record?.status === 'Ready' && result.record.fileName) {
      const downloadResult = await downloadRevenueExport(result.record.id, result.record.fileName);
      if (!isMountedRef.current) return result;
      setToastMessage(
        downloadResult.success
          ? result.message || financeEn.messages.MSG116
          : downloadResult.message || financeEn.messages.MSG106
      );
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
              aria-hidden="true"
              className={`material-symbols-outlined text-[16px] ${isLoading ? 'animate-spin' : ''}`}
            >
              refresh
            </span>
            <span>{financeEn.revenue.refreshBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportDialogOpen(true)}
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

      {toursFailed && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-800 flex flex-wrap items-center gap-2"
        >
          <span>{financeEn.revenue.tourFiltersError}</span>
          <button
            type="button"
            onClick={() => {
              setTourLoad(null);
              setTourRetryToken((token) => token + 1);
            }}
            className="rounded-lg border border-amber-300 px-3 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {financeEn.revenue.retryTourFiltersBtn}
          </button>
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
        isToursLoading={isToursLoading}
      />

      {/* Summary Cards */}
      {reportResult && (
        <RevenueSummaryCards summary={reportResult.summary} />
      )}

      {/* Middle Section: Revenue Trend Chart (2/3) + Settlement Breakdown (1/3) */}
      {reportResult && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart chartData={reportResult.chartData} />
          </div>
          <div className="lg:col-span-1">
            <SettlementDetailsCard summary={reportResult.summary} />
          </div>
        </div>
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

      {/* Export History (UC-45) */}
      <ExportHistoryPanel
        isDemo={isDemo}
        demoActorUserId={actorUserId}
        refreshToken={exportHistoryRefreshToken}
      />

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
