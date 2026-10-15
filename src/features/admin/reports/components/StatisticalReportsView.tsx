'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { ROUTES } from '@/lib/routes';

import {
  canAccessStatisticalReports,
  isStatisticalDemoAllowedInEnv,
} from '../guards/statisticalReportAuth';
import { statisticalReportsEn } from '../resources/en';
import {
  DEFAULT_DRAFT_CRITERIA,
  areCriteriaEqual,
  buildDemoExportArtifact,
  findDemoPeriodFixture,
  findProductionPeriodOption,
  formatVndCurrency,
  generateDemoStatisticalReport,
  getDemoPeriodFixturesByGranularity,
  getFilterOptionsByMode,
  getPeriodsByGranularity,
  getProductionPeriodsByGranularity,
  triggerBrowserCsvDownload,
} from '../services/statisticalReportService';
import type {
  AppliedStatisticalReportCriteria,
  BookingTypeFilter,
  DemoExportArtifact,
  ExportFormat,
  GeneratedStatisticalReport,
  PeriodGranularity,
  StatisticalReportCriteria,
  StatisticalReportType,
  StatisticalWorkspaceMode,
} from '../types/statisticalReports';

export interface StatisticalReportsViewProps {
  readonly actorRole?: string | null;
  readonly initialMode?: StatisticalWorkspaceMode;
}

type ResultLifecycleState =
  | 'IDLE'
  | 'PENDING_BE_INTEGRATION'
  | 'NO_DATA'
  | 'GENERATION_ERROR'
  | 'GENERATED';

const REPORT_TYPE_KEYS: readonly StatisticalReportType[] = [
  'USER_GROWTH',
  'BOOKING_VOLUME',
  'PLATFORM_REVENUE',
  'OPERATOR_PERFORMANCE',
  'DESTINATION_POPULARITY',
];

const GRANULARITY_KEYS: readonly PeriodGranularity[] = [
  'CLOSED_MONTH',
  'CLOSED_QUARTER',
  'CLOSED_YEAR',
];

const EXPORT_FORMAT_KEYS: readonly ExportFormat[] = ['CSV', 'EXCEL', 'PDF'];

export function StatisticalReportsView({
  actorRole,
  initialMode = 'PRODUCTION',
}: StatisticalReportsViewProps) {
  const copy = statisticalReportsEn;
  const effectiveRole = actorRole ?? null;
  const effectiveMode: StatisticalWorkspaceMode = isStatisticalDemoAllowedInEnv()
    ? initialMode
    : 'PRODUCTION';

  const [draftCriteria, setDraftCriteria] =
    useState<StatisticalReportCriteria>(DEFAULT_DRAFT_CRITERIA);
  const [appliedCriteria, setAppliedCriteria] =
    useState<AppliedStatisticalReportCriteria | null>(null);
  const [resultState, setResultState] = useState<ResultLifecycleState>(() => {
    if (effectiveMode === 'PRODUCTION') return 'PENDING_BE_INTEGRATION';
    return 'GENERATED';
  });
  const [generatedReport, setGeneratedReport] = useState<GeneratedStatisticalReport | null>(() => {
    if (effectiveMode === 'PRODUCTION') return null;
    const initialApplied: AppliedStatisticalReportCriteria = {
      reportType: 'PLATFORM_REVENUE',
      periodGranularity: 'CLOSED_MONTH',
      periodKey: '2026-09',
      operatorId: 'ALL',
      destinationId: 'ALL',
      bookingType: 'ALL',
    };
    return generateDemoStatisticalReport(initialApplied);
  });

  const resolvedAppliedCriteria: AppliedStatisticalReportCriteria | null =
    appliedCriteria ?? (generatedReport ? generatedReport.criteria : null);

  const [fieldErrors, setFieldErrors] = useState<{
    reportType?: string;
    periodKey?: string;
  }>({});
  const [simulateGenerationError, setSimulateGenerationError] = useState(false);
  const [simulateExportError, setSimulateExportError] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('CSV');
  const [exportStatus, setExportStatus] = useState<'IDLE' | 'READY' | 'PREVIEW_ONLY' | 'ERROR'>(
    'IDLE',
  );
  const [exportedArtifact, setExportedArtifact] = useState<DemoExportArtifact | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

  if (!canAccessStatisticalReports(effectiveRole)) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 py-12 md:px-8">
        <section
          aria-labelledby="statistical-reports-access-denied-title"
          role="alert"
          className="w-full rounded-2xl border border-[#d0d7de] bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold tracking-wide text-rose-800">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                clipRule="evenodd"
              />
            </svg>
            <span>{copy.accessDenied.eyebrow}</span>
          </div>
          <h1
            id="statistical-reports-access-denied-title"
            className="text-xl font-extrabold tracking-tight text-[#00152a] sm:text-2xl"
          >
            {copy.accessDenied.title}
          </h1>
          <p className="mt-2 text-sm font-semibold text-rose-700">{copy.accessDenied.message}</p>
          <p className="mt-1 text-sm leading-relaxed text-[#475467]">{copy.accessDenied.detail}</p>
          {effectiveRole === 'PENDING_AUTH_SESSION_VERIFICATION' ? (
            <p className="mt-2 text-xs leading-relaxed text-[#475467]">
              {copy.accessDenied.unverifiedSessionNotice}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={ROUTES.admin.login}
              className="inline-flex items-center justify-center rounded-xl bg-[#006b5f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#005048] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006b5f]"
            >
              {copy.accessDenied.returnToSignIn}
            </Link>
            <Link
              href={ROUTES.home}
              className="inline-flex items-center justify-center rounded-xl border border-[#cbd5e1] bg-white px-4 py-2.5 text-sm font-semibold text-[#1e293b] transition hover:bg-[#f8fafc]"
            >
              {copy.accessDenied.returnToDashboard}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const availablePeriods = getPeriodsByGranularity(
    draftCriteria.periodGranularity,
    effectiveMode,
  );
  const activeFilterOptions = getFilterOptionsByMode(effectiveMode);
  const isDraftDirty =
    resolvedAppliedCriteria !== null && !areCriteriaEqual(draftCriteria, resolvedAppliedCriteria);

  function handleGranularityChange(nextGranularity: PeriodGranularity) {
    if (effectiveMode === 'PRODUCTION') {
      const productionPeriods = getProductionPeriodsByGranularity(nextGranularity);
      setDraftCriteria((prev) => ({
        ...prev,
        periodGranularity: nextGranularity,
        periodKey: productionPeriods[0]?.key ?? '',
      }));
      return;
    }

    const demoPeriods = getDemoPeriodFixturesByGranularity(nextGranularity);
    const firstClosed = demoPeriods.find((p) => p.isClosed);
    setDraftCriteria((prev) => ({
      ...prev,
      periodGranularity: nextGranularity,
      periodKey: firstClosed?.key ?? '',
    }));
  }

  function executeGenerateReport() {
    const nextErrors: { reportType?: string; periodKey?: string } = {};
    if (!draftCriteria.reportType) {
      nextErrors.reportType = copy.validation.requiredField;
    }
    if (!draftCriteria.periodKey) {
      nextErrors.periodKey = copy.validation.requiredField;
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setLiveAnnouncement(copy.validation.requiredField);
      return;
    }

    const nextApplied: AppliedStatisticalReportCriteria = {
      reportType: draftCriteria.reportType as StatisticalReportType,
      periodGranularity: draftCriteria.periodGranularity,
      periodKey: draftCriteria.periodKey,
      operatorId: effectiveMode === 'PRODUCTION' ? 'ALL' : draftCriteria.operatorId,
      destinationId: effectiveMode === 'PRODUCTION' ? 'ALL' : draftCriteria.destinationId,
      bookingType: draftCriteria.bookingType,
    };

    if (effectiveMode === 'PRODUCTION') {
      const requestedProductionPeriod = findProductionPeriodOption(draftCriteria.periodKey);
      if (!requestedProductionPeriod) {
        setFieldErrors({ periodKey: copy.validation.requiredField });
        setLiveAnnouncement(copy.validation.requiredField);
        return;
      }

      setFieldErrors({});
      setExportStatus('IDLE');
      setExportedArtifact(null);
      setAppliedCriteria(nextApplied);
      setGeneratedReport(null);
      setResultState('PENDING_BE_INTEGRATION');
      setLiveAnnouncement(copy.states.pendingBackendTitle);
      return;
    }

    const selectedDemoPeriod = findDemoPeriodFixture(draftCriteria.periodKey);
    if (!selectedDemoPeriod || !selectedDemoPeriod.isClosed) {
      setFieldErrors({ periodKey: copy.validation.openPeriodRejected });
      setLiveAnnouncement(copy.validation.openPeriodRejected);
      return;
    }

    setFieldErrors({});
    setExportStatus('IDLE');
    setExportedArtifact(null);

    if (simulateGenerationError) {
      setResultState('GENERATION_ERROR');
      setLiveAnnouncement(copy.states.generationErrorMessage);
      return;
    }

    const demoReport = generateDemoStatisticalReport(nextApplied);
    setAppliedCriteria(nextApplied);

    if (!demoReport || demoReport.breakdownRows.length === 0) {
      setGeneratedReport(demoReport);
      setResultState('NO_DATA');
      setLiveAnnouncement(copy.states.noDataMessage);
      return;
    }

    setGeneratedReport(demoReport);
    setResultState('GENERATED');
    setLiveAnnouncement(
      `${copy.results.appliedHeaderTitle}: ${copy.reportTypes[nextApplied.reportType].label} (${selectedDemoPeriod.label})`,
    );
  }

  function handleGenerateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    executeGenerateReport();
  }

  function handleCancelCriteriaChanges() {
    setFieldErrors({});
    setExportStatus('IDLE');
    if (resolvedAppliedCriteria) {
      setDraftCriteria({ ...resolvedAppliedCriteria });
    } else {
      setDraftCriteria(DEFAULT_DRAFT_CRITERIA);
    }
    setLiveAnnouncement(copy.criteriaForm.draftResetAnnouncement);
  }

  function handleExportReport() {
    if (effectiveMode === 'PRODUCTION' || resultState !== 'GENERATED' || !generatedReport) {
      return;
    }

    if (simulateExportError) {
      setExportStatus('ERROR');
      setExportedArtifact(null);
      setLiveAnnouncement(copy.exportPanel.exportErrorMessage);
      return;
    }

    const artifact = buildDemoExportArtifact(generatedReport, exportFormat);
    if (!artifact.isDownloadable) {
      setExportedArtifact(artifact);
      setExportStatus('PREVIEW_ONLY');
      setLiveAnnouncement(copy.exportPanel.previewOnlyMessage);
      return;
    }

    const downloaded = triggerBrowserCsvDownload(artifact);
    if (!downloaded) {
      setExportStatus('ERROR');
      setExportedArtifact(null);
      setLiveAnnouncement(copy.exportPanel.exportErrorMessage);
      return;
    }

    setExportedArtifact(artifact);
    setExportStatus('READY');
    setLiveAnnouncement(`${copy.exportPanel.exportSuccessMessage} (${artifact.fileName})`);
  }

  const canExport =
    effectiveMode === 'DEMO' &&
    resultState === 'GENERATED' &&
    generatedReport !== null &&
    generatedReport.breakdownRows.length > 0;

  const exportDisabledExplanation =
    effectiveMode === 'PRODUCTION'
      ? copy.exportPanel.disabledProductionReason
      : copy.exportPanel.disabledNoGeneratedReportReason;

  return (
    <div className="min-h-screen bg-[#f7f9fc] pb-20 text-[#191c1e]">
      <div className="sr-only" role="status" aria-live="polite">
        {liveAnnouncement}
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8 md:py-10">
        {/* Top Page Header */}
        <header className="mb-6 rounded-2xl border border-[#314863] bg-[#00152a] p-6 text-white shadow-md sm:p-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#314863] bg-[#102a43] px-3 py-1 text-xs font-bold tracking-wider text-[#71f8e4] uppercase">
                <span className="h-2 w-2 rounded-full bg-[#71f8e4]" aria-hidden="true" />
                <span>{copy.header.eyebrow}</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {copy.header.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#d1e4ff]">
                {copy.header.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl border border-[#314863] bg-[#102a43] px-3 py-1.5 text-xs font-semibold text-[#d1e4ff]">
                {copy.header.timezoneBadge}
              </span>
              <span className="rounded-xl border border-[#314863] bg-[#102a43] px-3 py-1.5 text-xs font-semibold text-[#71f8e4]">
                {copy.header.currencyBadge}
              </span>
            </div>
          </div>
        </header>

        {/* Read-Only Data Source Status Banner (No User-Facing Production->Demo Toggle) */}
        <section
          aria-label={copy.modeBanner.groupAriaLabel}
          className="mb-8 rounded-2xl border border-[#d0d7de] bg-white p-4 shadow-xs sm:p-5"
        >
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <h2 className="text-sm font-extrabold tracking-tight text-[#00152a]">
              {effectiveMode === 'PRODUCTION'
                ? copy.modeBanner.productionModeHeading
                : copy.modeBanner.demoModeHeading}
            </h2>

            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                effectiveMode === 'PRODUCTION'
                  ? 'border border-amber-300 bg-amber-50 text-amber-900'
                  : 'border border-teal-300 bg-teal-50 text-teal-900'
              }`}
            >
              {effectiveMode === 'PRODUCTION'
                ? copy.modeBanner.productionBadge
                : copy.modeBanner.demoBadge}
            </span>
          </div>

          <p className="mt-2.5 text-xs leading-relaxed text-[#475467]">
            {effectiveMode === 'PRODUCTION'
              ? copy.modeBanner.productionNotice
              : copy.modeBanner.demoNotice}
          </p>
        </section>

        {/* Criteria Form Panel */}
        <section
          aria-labelledby="statistical-criteria-heading"
          className="mb-8 rounded-2xl border border-[#d0d7de] bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="mb-5 border-b border-[#eaecf0] pb-4">
            <h2
              id="statistical-criteria-heading"
              className="text-lg font-extrabold tracking-tight text-[#00152a]"
            >
              {copy.criteriaForm.sectionTitle}
            </h2>
            <p className="mt-1 text-xs text-[#475467] sm:text-sm">
              {copy.criteriaForm.sectionDescription}
            </p>
          </div>

          <form noValidate onSubmit={handleGenerateSubmit} className="space-y-6">
            {/* Report Type Selection (Keyboard Accessible Radio Cards + Select) */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-bold text-[#00152a]">
                {copy.criteriaForm.reportTypeLegend}
              </legend>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {REPORT_TYPE_KEYS.map((typeKey) => {
                  const typeCopy = copy.reportTypes[typeKey];
                  const isSelected = draftCriteria.reportType === typeKey;
                  return (
                    <label
                      key={typeKey}
                      className={`flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition focus-within:ring-2 focus-within:ring-[#006b5f] ${
                        isSelected
                          ? 'border-[#006b5f] bg-[#f0fdf9]'
                          : 'border-[#d0d7de] bg-white hover:border-[#94a3b8]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="reportTypeRadio"
                          value={typeKey}
                          checked={isSelected}
                          onChange={() => {
                            setDraftCriteria((prev) => ({ ...prev, reportType: typeKey }));
                            setFieldErrors((prev) => ({ ...prev, reportType: undefined }));
                          }}
                          className="mt-1 h-4 w-4 accent-[#006b5f]"
                        />
                        <div>
                          <span className="block text-xs font-bold text-[#00152a] sm:text-sm">
                            {typeCopy.label}
                          </span>
                          <span className="mt-1 block text-[11px] leading-snug text-[#475467]">
                            {typeCopy.description}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="max-w-md pt-1">
                <label
                  htmlFor="report-type-select"
                  className="mb-1 block text-xs font-semibold text-[#344054]"
                >
                  {copy.criteriaForm.reportTypeSelectLabel}
                </label>
                <select
                  id="report-type-select"
                  value={draftCriteria.reportType}
                  onChange={(e) => {
                    setDraftCriteria((prev) => ({
                      ...prev,
                      reportType: e.target.value as StatisticalReportType | '',
                    }));
                    setFieldErrors((prev) => ({ ...prev, reportType: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.reportType)}
                  aria-describedby={fieldErrors.reportType ? 'report-type-error' : undefined}
                  className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2.5 text-sm text-[#0f172a] focus:border-[#006b5f] focus:outline-none"
                >
                  <option value="">{copy.criteriaForm.reportTypePlaceholder}</option>
                  {REPORT_TYPE_KEYS.map((typeKey) => (
                    <option key={typeKey} value={typeKey}>
                      {copy.reportTypes[typeKey].label}
                    </option>
                  ))}
                </select>
                {fieldErrors.reportType ? (
                  <p
                    id="report-type-error"
                    role="alert"
                    className="mt-1.5 text-xs font-semibold text-rose-700"
                  >
                    {fieldErrors.reportType}
                  </p>
                ) : null}
              </div>
            </fieldset>

            {/* Period Selection (Closed Month / Closed Quarter / Closed Year) */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <fieldset>
                <legend className="mb-2 block text-sm font-bold text-[#00152a]">
                  {copy.criteriaForm.periodGranularityLegend}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {GRANULARITY_KEYS.map((granularity) => {
                    const active = draftCriteria.periodGranularity === granularity;
                    return (
                      <button
                        key={granularity}
                        type="button"
                        aria-pressed={active}
                        onClick={() => handleGranularityChange(granularity)}
                        className={`rounded-xl px-3.5 py-2 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006b5f] ${
                          active
                            ? 'bg-[#00152a] text-white'
                            : 'border border-[#cbd5e1] bg-[#f8fafc] text-[#334155] hover:bg-[#f1f5f9]'
                        }`}
                      >
                        {copy.granularities[granularity]}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="reporting-period-select"
                  className="mb-2 block text-sm font-bold text-[#00152a]"
                >
                  {copy.criteriaForm.periodSelectLabel}
                </label>
                <select
                  id="reporting-period-select"
                  value={draftCriteria.periodKey}
                  onChange={(e) => {
                    setDraftCriteria((prev) => ({ ...prev, periodKey: e.target.value }));
                    setFieldErrors((prev) => ({ ...prev, periodKey: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.periodKey)}
                  aria-describedby={fieldErrors.periodKey ? 'reporting-period-error' : undefined}
                  className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2.5 text-sm text-[#0f172a] focus:border-[#006b5f] focus:outline-none"
                >
                  <option value="">{copy.criteriaForm.periodPlaceholder}</option>
                  {availablePeriods.map((period) => (
                    <option key={period.key} value={period.key}>
                      {period.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.periodKey ? (
                  <p
                    id="reporting-period-error"
                    role="alert"
                    className="mt-1.5 text-xs font-semibold text-rose-700"
                  >
                    {fieldErrors.periodKey}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Optional Filters (PRODUCTION_FILTER_OPTIONS vs DEMO_FILTER_FIXTURES) */}
            <fieldset className="rounded-xl border border-[#eaecf0] bg-[#f8fafc] p-4">
              <legend className="px-1 text-xs font-bold tracking-wider text-[#475467] uppercase">
                {copy.criteriaForm.optionalFiltersHeading}
              </legend>
              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="filter-operator-select"
                    className="mb-1.5 block text-xs font-semibold text-[#344054]"
                  >
                    {copy.criteriaForm.operatorFilterLabel}
                  </label>
                  <select
                    id="filter-operator-select"
                    value={draftCriteria.operatorId}
                    onChange={(e) =>
                      setDraftCriteria((prev) => ({ ...prev, operatorId: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]"
                  >
                    {activeFilterOptions.operators.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="filter-destination-select"
                    className="mb-1.5 block text-xs font-semibold text-[#344054]"
                  >
                    {copy.criteriaForm.destinationFilterLabel}
                  </label>
                  <select
                    id="filter-destination-select"
                    value={draftCriteria.destinationId}
                    onChange={(e) =>
                      setDraftCriteria((prev) => ({ ...prev, destinationId: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]"
                  >
                    {activeFilterOptions.destinations.map((dest) => (
                      <option key={dest.id} value={dest.id}>
                        {dest.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="filter-booking-type-select"
                    className="mb-1.5 block text-xs font-semibold text-[#344054]"
                  >
                    {copy.criteriaForm.bookingTypeFilterLabel}
                  </label>
                  <select
                    id="filter-booking-type-select"
                    value={draftCriteria.bookingType}
                    onChange={(e) =>
                      setDraftCriteria((prev) => ({
                        ...prev,
                        bookingType: e.target.value as BookingTypeFilter,
                      }))
                    }
                    className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]"
                  >
                    {activeFilterOptions.bookingTypes.map((bt) => (
                      <option key={bt.id} value={bt.id}>
                        {bt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {effectiveMode === 'PRODUCTION' ? (
                <p className="mt-3 text-xs text-[#475467]">
                  {copy.filters.productionDynamicFiltersNotice}
                </p>
              ) : null}
            </fieldset>

            {/* Demo Failure Simulation Controls (Non-Production Demo Only) */}
            {effectiveMode === 'DEMO' ? (
              <fieldset className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#fcfcfd] p-3.5">
                <legend className="px-1 text-xs font-bold text-[#475467]">
                  {copy.criteriaForm.simulationHeading}
                </legend>
                <div className="flex flex-wrap gap-6 pt-1">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#344054]">
                    <input
                      type="checkbox"
                      checked={simulateGenerationError}
                      onChange={(e) => setSimulateGenerationError(e.target.checked)}
                      className="h-4 w-4 accent-[#006b5f]"
                    />
                    <span>{copy.criteriaForm.simulateGenerationErrorLabel}</span>
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#344054]">
                    <input
                      type="checkbox"
                      checked={simulateExportError}
                      onChange={(e) => setSimulateExportError(e.target.checked)}
                      className="h-4 w-4 accent-[#006b5f]"
                    />
                    <span>{copy.criteriaForm.simulateExportErrorLabel}</span>
                  </label>
                </div>
              </fieldset>
            ) : null}

            {/* Draft vs Applied Notice */}
            {isDraftDirty ? (
              <div
                role="status"
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900"
              >
                {copy.criteriaForm.draftModifiedNotice}
              </div>
            ) : null}

            {/* Form Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-[#006b5f] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#005048] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006b5f]"
              >
                {copy.criteriaForm.generateButton}
              </button>
              <button
                type="button"
                onClick={handleCancelCriteriaChanges}
                className="inline-flex items-center justify-center rounded-xl border border-[#cbd5e1] bg-white px-4 py-2.5 text-sm font-semibold text-[#1e293b] transition hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00152a]"
              >
                {copy.criteriaForm.cancelButton}
              </button>
            </div>
          </form>
        </section>

        {/* Result Area */}
        <section aria-labelledby="statistical-results-heading" className="mb-8">
          <h2 id="statistical-results-heading" className="sr-only">
            {copy.results.appliedHeaderTitle}
          </h2>

          {/* Production Mode: PENDING_BE_INTEGRATION */}
          {effectiveMode === 'PRODUCTION' || resultState === 'PENDING_BE_INTEGRATION' ? (
            <div
              role="region"
              aria-label={copy.states.pendingBackendTitle}
              className="rounded-2xl border border-amber-300 bg-amber-50/70 p-6 sm:p-8"
            >
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 shrink-0"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{copy.modeBanner.productionBadge}</span>
              </div>
              <h3 className="text-lg font-extrabold text-[#00152a]">
                {copy.states.pendingBackendTitle}
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#344054]">
                {copy.states.pendingBackendDescription}
              </p>
              {resolvedAppliedCriteria ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4 text-xs text-[#344054]">
                  <span className="font-bold">{copy.results.appliedCriteriaSummaryLabel}: </span>
                  <span>
                    {copy.reportTypes[resolvedAppliedCriteria.reportType].label} •{' '}
                    {copy.results.appliedPeriodPrefix} {resolvedAppliedCriteria.periodKey} •{' '}
                    {copy.results.appliedOperatorPrefix} {resolvedAppliedCriteria.operatorId} •{' '}
                    {copy.results.appliedDestinationPrefix}{' '}
                    {resolvedAppliedCriteria.destinationId} •{' '}
                    {copy.results.appliedBookingTypePrefix}{' '}
                    {resolvedAppliedCriteria.bookingType}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Generation Error State (4.a2) */}
          {effectiveMode === 'DEMO' && resultState === 'GENERATION_ERROR' ? (
            <div
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900 sm:p-8"
            >
              <h3 className="text-lg font-extrabold">{copy.states.generationErrorTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed">{copy.states.generationErrorMessage}</p>
              <button
                type="button"
                onClick={executeGenerateReport}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-800"
              >
                {copy.states.retryGenerateButton}
              </button>
            </div>
          ) : null}

          {/* No Data State (4.a1) */}
          {effectiveMode === 'DEMO' && resultState === 'NO_DATA' ? (
            <div
              role="status"
              className="rounded-2xl border border-[#d0d7de] bg-white p-6 text-center sm:p-8"
            >
              <h3 className="text-lg font-extrabold text-[#00152a]">{copy.states.noDataTitle}</h3>
              <p className="mt-2 text-sm font-semibold text-[#344054]">
                {copy.states.noDataMessage}
              </p>
              <p className="mt-1 text-xs text-[#475467]">{copy.states.noDataDescription}</p>
            </div>
          ) : null}

          {/* Generated Report Result (Summary Figures + Revenue Formula + SVG Chart + Accessible Table) */}
          {effectiveMode === 'DEMO' &&
          resultState === 'GENERATED' &&
          generatedReport &&
          generatedReport.breakdownRows.length > 0 ? (
            <div className="space-y-6">
              {/* Applied Criteria Metadata Banner */}
              <div className="rounded-2xl border border-[#d0d7de] bg-white p-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eaecf0] pb-4">
                  <div>
                    <span className="text-xs font-bold tracking-wider text-[#006b5f] uppercase">
                      {copy.results.appliedHeaderTitle}
                    </span>
                    <h3 className="mt-0.5 text-xl font-extrabold text-[#00152a]">
                      {copy.reportTypes[generatedReport.criteria.reportType].label}
                    </h3>
                  </div>
                  <span className="rounded-full border border-teal-300 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-900">
                    {copy.results.demoWatermarkBadge}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                  <div>
                    <dt className="font-semibold text-[#475467]">
                      {copy.results.appliedCriteriaSummaryLabel}
                    </dt>
                    <dd className="mt-0.5 font-bold text-[#00152a]">
                      {copy.reportTypes[generatedReport.criteria.reportType].label} (
                      {copy.granularities[generatedReport.criteria.periodGranularity]})
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#475467]">
                      {copy.results.periodWindowLabel}
                    </dt>
                    <dd className="mt-0.5 font-bold text-[#00152a]">
                      {generatedReport.period.startDateDisplay} –{' '}
                      {generatedReport.period.endDateDisplay} ({generatedReport.period.key})
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#475467]">
                      {copy.results.generatedTimestampLabel}
                    </dt>
                    <dd className="mt-0.5 font-bold text-[#00152a]">
                      {generatedReport.generatedAtDisplay}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Summary KPI Cards */}
              <div
                role="region"
                aria-label={copy.results.summarySectionTitle}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                {generatedReport.summaryMetrics.map((metric) => (
                  <article
                    key={metric.id}
                    className="rounded-2xl border border-[#d0d7de] bg-white p-5 shadow-xs"
                  >
                    <p className="text-xs font-bold tracking-wide text-[#475467] uppercase">
                      {metric.label}
                    </p>
                    <p className="mt-2 font-mono text-xl font-extrabold text-[#00152a] sm:text-2xl">
                      {metric.formattedValue}
                    </p>
                    <p className="mt-1.5 text-xs text-[#667085]">{metric.contextNote}</p>
                  </article>
                ))}
              </div>

              {/* Platform Revenue Formula Breakdown (Only for PLATFORM_REVENUE) */}
              {generatedReport.revenueBreakdown ? (
                <section
                  aria-label={copy.results.revenueFormulaTitle}
                  className="rounded-2xl border border-[#bae6fd] bg-[#f0f9ff] p-5"
                >
                  <h4 className="text-sm font-extrabold text-[#00152a]">
                    {copy.results.revenueFormulaTitle}
                  </h4>
                  <p className="mt-1 text-xs text-[#344054]">
                    {copy.results.revenueFormulaNote}
                  </p>
                  <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-[#e0f2fe] bg-white p-3.5">
                      <dt className="text-xs font-semibold text-[#475467]">
                        {copy.results.confirmedGrossLabel}
                      </dt>
                      <dd className="mt-1 font-mono text-sm font-bold text-[#00152a]">
                        {formatVndCurrency(
                          generatedReport.revenueBreakdown.confirmedBookingsGrossVnd,
                        )}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-[#e0f2fe] bg-white p-3.5">
                      <dt className="text-xs font-semibold text-[#475467]">
                        {copy.results.completedGrossLabel}
                      </dt>
                      <dd className="mt-1 font-mono text-sm font-bold text-[#00152a]">
                        {formatVndCurrency(
                          generatedReport.revenueBreakdown.completedBookingsGrossVnd,
                        )}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-[#e0f2fe] bg-white p-3.5">
                      <dt className="text-xs font-semibold text-[#475467]">
                        {copy.results.recordedRefundsLabel}
                      </dt>
                      <dd className="mt-1 font-mono text-sm font-bold text-rose-700">
                        -{formatVndCurrency(generatedReport.revenueBreakdown.recordedRefundsVnd)}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-[#00152a] p-3.5 text-white">
                      <dt className="text-xs font-semibold text-[#71f8e4]">
                        {copy.results.netPlatformRevenueLabel}
                      </dt>
                      <dd className="mt-1 font-mono text-sm font-extrabold text-white">
                        {formatVndCurrency(generatedReport.revenueBreakdown.netPlatformRevenueVnd)}
                      </dd>
                    </div>
                  </dl>
                </section>
              ) : null}

              {/* Accessible Visual Chart + Tabular Data Fallback */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Lightweight Accessible SVG / Proportional Bar Chart */}
                <section
                  aria-label={copy.results.chartSectionTitle}
                  className="rounded-2xl border border-[#d0d7de] bg-white p-5 shadow-xs lg:col-span-5"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-base font-extrabold text-[#00152a]">
                      {copy.results.chartSectionTitle}
                    </h4>
                    <span className="text-xs font-semibold text-[#475467]">
                      {generatedReport.chartUnitLabel}
                    </span>
                  </div>

                  <svg
                    role="img"
                    aria-label={copy.results.chartSvgAriaLabel}
                    viewBox="0 0 400 180"
                    className="mb-4 h-40 w-full rounded-xl bg-[#f8fafc] p-3"
                  >
                    <title>{copy.results.chartSvgAriaLabel}</title>
                    {generatedReport.chartPoints.map((point, index) => {
                      const y = 18 + index * 46;
                      const barWidth = Math.max(12, Math.round((point.sharePercent / 100) * 260));
                      return (
                        <g key={point.id}>
                          <text x="8" y={y + 12} fontSize="11" fill="#0f172a" fontWeight="bold">
                            {point.label} ({point.sharePercent}%)
                          </text>
                          <rect
                            x="8"
                            y={y + 18}
                            width={barWidth}
                            height="14"
                            rx="4"
                            fill="#006b5f"
                          />
                        </g>
                      );
                    })}
                  </svg>

                  <ul className="space-y-2.5 text-xs">
                    {generatedReport.chartPoints.map((point) => (
                      <li
                        key={point.id}
                        className="flex items-center justify-between rounded-lg bg-[#f8fafc] px-3 py-2"
                      >
                        <span className="font-semibold text-[#00152a]">{point.label}</span>
                        <span className="font-mono font-bold text-[#006b5f]">
                          {point.formattedPrimaryValue} ({point.sharePercent}%{' '}
                          {copy.results.shareOfTotalSuffix})
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Accessible Tabular Fallback */}
                <section
                  aria-label={copy.results.tableFallbackTitle}
                  className="rounded-2xl border border-[#d0d7de] bg-white p-5 shadow-xs lg:col-span-7"
                >
                  <h4 className="mb-4 text-base font-extrabold text-[#00152a]">
                    {copy.results.tableFallbackTitle}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs sm:text-sm">
                      <caption className="sr-only">
                        {copy.results.tableCaptionPrefix}{' '}
                        {copy.reportTypes[generatedReport.criteria.reportType].label} (
                        {generatedReport.period.key})
                      </caption>
                      <thead>
                        <tr className="border-b border-[#d0d7de] bg-[#f8fafc] text-[#344054]">
                          {generatedReport.tableHeaders.map((header) => (
                            <th key={header} scope="col" className="px-3.5 py-2.5 font-bold">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eaecf0]">
                        {generatedReport.breakdownRows.map((row) => (
                          <tr key={row.id} className="hover:bg-[#f8fafc]">
                            <td className="px-3.5 py-3 font-semibold text-[#00152a]">
                              {row.segmentLabel}
                            </td>
                            <td className="px-3.5 py-3 font-mono text-[#1e293b]">
                              {row.primaryMetricLabel}
                            </td>
                            <td className="px-3.5 py-3 font-mono text-[#1e293b]">
                              {row.secondaryMetricLabel}
                            </td>
                            <td className="px-3.5 py-3 font-mono font-bold text-[#006b5f]">
                              {row.tertiaryMetricLabel}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>
          ) : null}
        </section>

        {/* Export Format & Export Action Panel */}
        <section
          aria-labelledby="statistical-export-heading"
          className="rounded-2xl border border-[#d0d7de] bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="mb-4 border-b border-[#eaecf0] pb-4">
            <h2
              id="statistical-export-heading"
              className="text-lg font-extrabold tracking-tight text-[#00152a]"
            >
              {copy.exportPanel.sectionTitle}
            </h2>
            <p className="mt-1 text-xs text-[#475467] sm:text-sm">
              {copy.exportPanel.sectionDescription}
            </p>
          </div>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <fieldset>
              <legend className="mb-2 block text-sm font-bold text-[#00152a]">
                {copy.exportPanel.formatLegend}
              </legend>
              <div className="flex flex-wrap gap-3">
                {EXPORT_FORMAT_KEYS.map((fmt) => {
                  const selected = exportFormat === fmt;
                  return (
                    <label
                      key={fmt}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition focus-within:ring-2 focus-within:ring-[#006b5f] ${
                        selected
                          ? 'border-[#006b5f] bg-[#f0fdf9] text-[#00152a]'
                          : 'border-[#cbd5e1] bg-white text-[#334155]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="exportFormat"
                        value={fmt}
                        checked={selected}
                        onChange={() => setExportFormat(fmt)}
                        className="h-4 w-4 accent-[#006b5f]"
                      />
                      <span>{copy.exportPanel.formats[fmt]}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-col items-start gap-2 md:items-end">
              <button
                type="button"
                disabled={!canExport}
                aria-describedby={!canExport ? 'export-disabled-reason' : undefined}
                onClick={handleExportReport}
                className="inline-flex items-center justify-center rounded-xl bg-[#00152a] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#102a43] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006b5f] disabled:cursor-not-allowed disabled:bg-[#cbd5e1] disabled:text-[#475467]"
              >
                {copy.exportPanel.exportButton}
              </button>
              {!canExport ? (
                <p id="export-disabled-reason" className="text-xs font-medium text-[#667085]">
                  {exportDisabledExplanation}
                </p>
              ) : null}
            </div>
          </div>

          {/* Export Failure Banner (6.a1) */}
          {exportStatus === 'ERROR' ? (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900"
            >
              <h3 className="text-sm font-bold">{copy.exportPanel.exportErrorTitle}</h3>
              <p className="mt-1 text-xs leading-relaxed">{copy.exportPanel.exportErrorMessage}</p>
              <button
                type="button"
                onClick={handleExportReport}
                className="mt-3 inline-flex items-center justify-center rounded-lg bg-rose-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-800"
              >
                {copy.exportPanel.retryExportButton}
              </button>
            </div>
          ) : null}

          {/* Export Ready Artifact Preview — Real CSV Download Only (Step 6 & 7) */}
          {exportStatus === 'READY' && exportedArtifact && exportedArtifact.isDownloadable ? (
            <div
              role="status"
              className="mt-5 rounded-xl border border-emerald-300 bg-emerald-50/70 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-emerald-950">
                  {copy.exportPanel.exportSuccessTitle}
                </h3>
                <span className="rounded-full bg-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-950">
                  {copy.exportPanel.demoFileBadge}
                </span>
              </div>
              <p className="mt-1 text-xs text-emerald-900">
                {copy.exportPanel.exportSuccessMessage}
              </p>
              <dl className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-emerald-900">
                    {copy.exportPanel.fileNameLabel}:
                  </dt>
                  <dd className="font-mono font-bold text-emerald-950">
                    {exportedArtifact.fileName}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-emerald-900">
                    {copy.exportPanel.auditEntryLabel}:
                  </dt>
                  <dd className="font-mono text-emerald-950">
                    {exportedArtifact.auditEventSummary}
                  </dd>
                </div>
              </dl>
              <div className="mt-3">
                <p className="mb-1 text-xs font-bold text-emerald-950">
                  {copy.exportPanel.previewHeading}
                </p>
                <pre className="max-h-48 overflow-x-auto rounded-lg border border-emerald-200 bg-white p-3 font-mono text-[11px] leading-relaxed text-[#0f172a]">
                  {exportedArtifact.contentPreview}
                </pre>
              </div>
            </div>
          ) : null}

          {/* Binary Format Preview Only — No File Downloaded (Excel / PDF) */}
          {exportStatus === 'PREVIEW_ONLY' &&
          exportedArtifact &&
          !exportedArtifact.isDownloadable ? (
            <div
              role="status"
              className="mt-5 rounded-xl border border-amber-300 bg-amber-50/70 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-amber-950">
                  {copy.exportPanel.previewOnlyTitle}
                </h3>
                <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-950">
                  {copy.exportPanel.previewOnlyBadge}
                </span>
              </div>
              <p className="mt-1 text-xs text-amber-900">{copy.exportPanel.previewOnlyMessage}</p>
              <dl className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-amber-900">
                    {copy.exportPanel.targetFormatLabel}:
                  </dt>
                  <dd className="font-mono font-bold text-amber-950">{exportedArtifact.format}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-amber-900">
                    {copy.exportPanel.auditEntryLabel}:
                  </dt>
                  <dd className="font-mono text-amber-950">
                    {exportedArtifact.auditEventSummary}
                  </dd>
                </div>
              </dl>
              <div className="mt-3">
                <p className="mb-1 text-xs font-bold text-amber-950">
                  {copy.exportPanel.previewHeading}
                </p>
                <pre className="max-h-48 overflow-x-auto rounded-lg border border-amber-200 bg-white p-3 font-mono text-[11px] leading-relaxed text-[#0f172a]">
                  {exportedArtifact.contentPreview}
                </pre>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
