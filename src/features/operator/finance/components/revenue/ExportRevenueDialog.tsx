'use client';

import { useState } from 'react';
import { financeEn } from '../../resources/en';
import { formatFinanceDate } from '../../utils/financeFormat';
import { useAccessibleFinanceDialog } from '../useAccessibleFinanceDialog';
import type {
  CreateRevenueExportResult,
  RevenueExportScope,
  RevenueFilterInput,
} from '../../types/revenueLifecycle';

interface ExportRevenueDialogProps {
  isOpen: boolean;
  appliedFilters: RevenueFilterInput;
  tourNameMap?: Record<string, string>;
  isDemo?: boolean;
  onClose: () => void;
  onExport: (payload: {
    format: 'xlsx';
    scope: RevenueExportScope;
    appliedFilters: RevenueFilterInput;
  }) => Promise<CreateRevenueExportResult>;
}

export function ExportRevenueDialog({
  isOpen,
  appliedFilters,
  tourNameMap = {},
  isDemo = false,
  onClose,
  onExport,
}: ExportRevenueDialogProps) {
  const [selectedScope, setSelectedScope] =
    useState<RevenueExportScope>('summary_and_details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [queuedNotice, setQueuedNotice] = useState<string | null>(null);

  const dialogRef = useAccessibleFinanceDialog(isOpen, onClose, isSubmitting);

  if (!isOpen) return null;

  const appliedTourLabel =
    appliedFilters.tourId && appliedFilters.tourId !== 'all'
      ? tourNameMap[appliedFilters.tourId] || appliedFilters.tourId
      : financeEn.exportDialog.allToursLabel;

  const handleExportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    setQueuedNotice(null);
    setIsSubmitting(true);

    try {
      const result = await onExport({
        format: 'xlsx',
        scope: selectedScope,
        appliedFilters,
      });

      if (!result.success) {
        setErrorNotice(result.message || financeEn.messages.MSG117);
        return;
      }

      if (result.record?.status === 'Ready') {
        // The file download is triggered by the caller; the dialog's job is done.
        onClose();
      } else {
        setQueuedNotice(financeEn.exportDialog.queuedDesc);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-lg rounded-2xl bg-white p-4 sm:p-6 shadow-xl transition-all max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 id="export-dialog-title" className="text-base font-bold text-[#00152A]">
              {financeEn.exportDialog.title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {financeEn.exportDialog.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label={financeEn.exportDialog.closeDialogAria}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleExportSubmit} className="mt-5 space-y-5">
          {/* Applied Filter Summary Card — frozen snapshot, never re-read while the dialog is open */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs">
            <h3 className="font-bold text-[#00152A] mb-2">
              {financeEn.exportDialog.appliedSummaryTitle}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="font-semibold text-slate-500">
                  {financeEn.exportDialog.filterPeriod}:{' '}
                </span>
                <span className="text-[#00152A]">
                  {formatFinanceDate(appliedFilters.startDate)} –{' '}
                  {formatFinanceDate(appliedFilters.endDate)}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">
                  {financeEn.exportDialog.filterGranularity}:{' '}
                </span>
                <span className="text-[#00152A] capitalize">
                  {appliedFilters.granularity}
                </span>
              </div>
              <div className="col-span-2">
                <span className="font-semibold text-slate-500">
                  {financeEn.exportDialog.filterTour}:{' '}
                </span>
                <span className="text-[#00152A]">{appliedTourLabel}</span>
              </div>
            </div>
          </div>

          {/* Format: only Excel (.xlsx) is implemented */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              {financeEn.exportDialog.formatLabel}
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[#006B5F] bg-[#006B5F]/5 p-3 text-xs text-[#006B5F]">
              <span className="material-symbols-outlined text-[18px]">table_view</span>
              <span className="font-semibold">{financeEn.exportDialog.formatXlsxOnly}</span>
            </div>
          </div>

          {/* Scope Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              {financeEn.exportDialog.scopeLabel}
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-xs cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="export-scope"
                  value="summary_and_details"
                  checked={selectedScope === 'summary_and_details'}
                  onChange={() => setSelectedScope('summary_and_details')}
                  className="h-4 w-4 text-[#006B5F] focus:ring-[#006B5F]"
                />
                <div>
                  <div className="font-semibold text-[#00152A]">
                    {financeEn.exportDialog.scopeDetailed}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {financeEn.exportDialog.scopeDetailedHelp}
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-xs cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="export-scope"
                  value="summary"
                  checked={selectedScope === 'summary'}
                  onChange={() => setSelectedScope('summary')}
                  className="h-4 w-4 text-[#006B5F] focus:ring-[#006B5F]"
                />
                <div>
                  <div className="font-semibold text-[#00152A]">
                    {financeEn.exportDialog.scopeSummary}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {financeEn.exportDialog.scopeSummaryHelp}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {isDemo && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-[11px] text-amber-800">
              {financeEn.exportDialog.demoNotSupportedNotice}
            </div>
          )}

          {/* Feedback & Errors */}
          {errorNotice && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
            >
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorNotice}</span>
            </div>
          )}

          {queuedNotice && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
            >
              <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
              <div>
                <p className="font-semibold">{financeEn.exportDialog.queuedTitle}</p>
                <p className="mt-0.5">{queuedNotice}</p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 text-center"
            >
              {queuedNotice ? financeEn.exportDialog.closeBtn : financeEn.exportDialog.cancelBtn}
            </button>
            {!queuedNotice && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#006B5F] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#005249] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div
                      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
                      aria-hidden="true"
                    />
                    <span role="status">{financeEn.exportDialog.exportingBtn}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>{financeEn.exportDialog.exportBtn}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
