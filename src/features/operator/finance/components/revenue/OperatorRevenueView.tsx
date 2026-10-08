'use client';

import { useEffect, useState } from 'react';
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

export function OperatorRevenueView() {
  const { context } = useWebSession();
  const searchParams = useSearchParams();

  // Environment & Demo state determination
  const demoQuery = searchParams.get('demo') === '1';
  const isDemo = demoQuery && isFinanceDemoAllowedInCurrentEnv();
  const actorUserId = context?.userId;

  // Initial date defaults (e.g., September 2026 for demo or current month)
  const initialFilters: RevenueFilterInput = {
    startDate: '2026-09-01',
    endDate: '2026-09-30',
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
  const [isLoading, setIsLoading] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  useEffect(() => {
    let isMounted = true;
    void getOperatorRevenueReport(
      appliedFilters,
      { isDemo, demoActorUserId: actorUserId },
      { page: currentPage, pageSize: REVENUE_DEFAULT_PAGE_SIZE }
    ).then((result) => {
      if (isMounted) {
        setReportResult(result);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [appliedFilters, currentPage, isDemo, actorUserId]);

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

    if (result.success) {
      if (
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
      }
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

        <button
          type="button"
          onClick={() => setIsExportDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#006B5F] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#005249]"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          <span>{financeEn.revenue.filters.exportBtn}</span>
        </button>
      </div>

      {/* Production NO_BACKEND Notice */}
      {!isDemo && (
        <div
          role="status"
          className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-xs text-sky-900"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-sky-600 text-lg">
              info
            </span>
            <div>
              <p className="font-bold">
                {financeEn.revenue.pendingNoticeTitle}
              </p>
              <p className="mt-0.5 text-sky-700">
                {reportResult?.pendingBackendNotice ||
                  financeEn.messages.PENDING_BE_INTEGRATION}
              </p>
            </div>
          </div>
        </div>
      )}

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
