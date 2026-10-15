'use client';

import { useEffect, useRef, useState } from 'react';
import { financeEn } from '../../resources/en';
import { formatFinanceDate } from '../../utils/financeFormat';
import type {
  ExportRevenuePayload,
  RevenueExportFormat,
  RevenueExportScope,
  RevenueFilterInput,
} from '../../types/revenueLifecycle';

interface ExportRevenueDialogProps {
  isOpen: boolean;
  appliedFilters: RevenueFilterInput;
  tourNameMap?: Record<string, string>;
  isDemo?: boolean;
  onClose: () => void;
  onExport: (
    payload: ExportRevenuePayload,
    simulateAsync?: boolean
  ) => Promise<{
    success: boolean;
    message?: string;
    isAsyncQueued?: boolean;
    isAsyncSimulated?: boolean;
  }>;
}

export function ExportRevenueDialog({
  isOpen,
  appliedFilters,
  tourNameMap = {},
  isDemo = false,
  onClose,
  onExport,
}: ExportRevenueDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [selectedFormat, setSelectedFormat] =
    useState<RevenueExportFormat>('csv');
  const [selectedScope, setSelectedScope] =
    useState<RevenueExportScope>('summary_and_details');
  const [simulateAsync, setSimulateAsync] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [asyncFeedback, setAsyncFeedback] = useState<string | null>(null);

  // Focus trap & Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const appliedTourLabel =
    appliedFilters.tourId && appliedFilters.tourId !== 'all'
      ? tourNameMap[appliedFilters.tourId] || appliedFilters.tourId
      : financeEn.exportDialog.allToursLabel;

  const handleExportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    setAsyncFeedback(null);
    setIsSubmitting(true);

    try {
      const result = await onExport(
        {
          format: selectedFormat,
          scope: selectedScope,
          appliedFilters,
        },
        simulateAsync
      );

      if (result.isAsyncSimulated || result.isAsyncQueued) {
        setAsyncFeedback(result.message || financeEn.exportDialog.asyncDesc);
      } else if (!result.success) {
        setErrorNotice(result.message || financeEn.messages.MSG117);
      } else {
        // Successful direct export
        onClose();
      }
    } catch {
      setErrorNotice(financeEn.messages.MSG117);
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
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl transition-all"
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
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label={financeEn.exportDialog.closeDialogAria}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleExportSubmit} className="mt-5 space-y-5">
          {/* Applied Filter Summary Card */}
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

          {/* Format Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              {financeEn.exportDialog.formatLabel}
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                {
                  value: 'csv' as const,
                  label: financeEn.exportDialog.formatCsv,
                  icon: 'csv',
                  supportedInDemo: true,
                },
                {
                  value: 'xlsx' as const,
                  label: financeEn.exportDialog.formatXlsx,
                  icon: 'table_view',
                  supportedInDemo: false,
                },
                {
                  value: 'pdf' as const,
                  label: financeEn.exportDialog.formatPdf,
                  icon: 'picture_as_pdf',
                  supportedInDemo: false,
                },
              ].map((opt) => {
                const isOptionDisabled = !isDemo || !opt.supportedInDemo;
                return (
                  <label
                    key={opt.value}
                    aria-disabled={isOptionDisabled}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                      isOptionDisabled
                        ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-75'
                        : selectedFormat === opt.value
                        ? 'cursor-pointer border-[#006B5F] bg-[#006B5F]/5 text-[#006B5F] ring-1 ring-[#006B5F]'
                        : 'cursor-pointer border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="export-format"
                      value={opt.value}
                      disabled={isOptionDisabled}
                      checked={selectedFormat === opt.value}
                      onChange={() => {
                        if (!isOptionDisabled) {
                          setSelectedFormat(opt.value);
                        }
                      }}
                      className="sr-only"
                    />
                    <span className="text-xs font-bold uppercase">{opt.value}</span>
                    <span className="mt-0.5 text-[10px] font-medium">
                      {opt.label}
                    </span>
                    <span className="mt-1 text-[10px] text-slate-400">
                      {opt.supportedInDemo
                        ? financeEn.exportDialog.csvFormatSupportedBadge
                        : financeEn.exportDialog.binaryFormatPendingBadge}
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              {isDemo
                ? financeEn.exportDialog.binaryFormatPendingNotice
                : financeEn.exportDialog.productionExportDisabledNotice}
            </p>
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

          {/* Demo async simulation toggle */}
          {isDemo && (
            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs">
              <div>
                <span className="font-semibold text-amber-900">
                  {financeEn.exportDialog.simulateAsyncLabel}
                </span>
                <p className="text-[10px] text-amber-700">
                  {financeEn.exportDialog.simulateAsyncHelp}
                </p>
              </div>
              <input
                type="checkbox"
                checked={simulateAsync}
                onChange={(e) => setSimulateAsync(e.target.checked)}
                className="h-4 w-4 rounded text-[#006B5F] focus:ring-[#006B5F]"
              />
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

          {asyncFeedback && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
            >
              <span className="material-symbols-outlined text-[16px]">science</span>
              <div>
                <p className="font-semibold">{financeEn.exportDialog.asyncTitle}</p>
                <p className="mt-0.5">{asyncFeedback}</p>
              </div>
            </div>
          )}

          {/* Buttons (CR-13: disabled when in-flight or in Production NO_BACKEND mode) */}
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {financeEn.exportDialog.cancelBtn}
            </button>
            <button
              type="submit"
              disabled={!isDemo || isSubmitting || selectedFormat !== 'csv'}
              className="inline-flex items-center gap-2 rounded-xl bg-[#006B5F] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#005249] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>{financeEn.exportDialog.exportingBtn}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>{financeEn.exportDialog.exportBtn}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
