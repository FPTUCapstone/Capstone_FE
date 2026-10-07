import { statisticalReportsEn } from '../resources/en';
import type {
  AppliedStatisticalReportCriteria,
  DemoExportArtifact,
  DemoReportingPeriodFixture,
  ExportFormat,
  GeneratedStatisticalReport,
  PeriodGranularity,
  PlatformRevenueFormulaBreakdown,
  ProductionReportingPeriodOption,
  ReportingPeriodOption,
  StatisticalBookingTypeOption,
  StatisticalBreakdownRow,
  StatisticalChartPoint,
  StatisticalFilterOptionSet,
  StatisticalReportCriteria,
  StatisticalSummaryMetric,
  StatisticalWorkspaceMode,
} from '../types/statisticalReports';

const CANONICAL_BOOKING_TYPE_OPTIONS: readonly StatisticalBookingTypeOption[] = [
  { id: 'ALL', label: statisticalReportsEn.filters.bookingTypes.ALL },
  { id: 'TOUR_PACKAGE', label: statisticalReportsEn.filters.bookingTypes.TOUR_PACKAGE },
  {
    id: 'COMMERCIAL_SERVICE',
    label: statisticalReportsEn.filters.bookingTypes.COMMERCIAL_SERVICE,
  },
] as const;

export const PRODUCTION_FILTER_OPTIONS: StatisticalFilterOptionSet = {
  operators: [{ id: 'ALL', label: statisticalReportsEn.filters.allOperatorsLabel }],
  destinations: [{ id: 'ALL', label: statisticalReportsEn.filters.allDestinationsLabel }],
  bookingTypes: CANONICAL_BOOKING_TYPE_OPTIONS,
} as const;

export const DEMO_FILTER_FIXTURES: StatisticalFilterOptionSet = {
  operators: [
    { id: 'ALL', label: statisticalReportsEn.filters.allOperatorsLabel },
    { id: 'OP-101', label: statisticalReportsEn.filters.demoOperators['OP-101'] },
    { id: 'OP-102', label: statisticalReportsEn.filters.demoOperators['OP-102'] },
    { id: 'OP-103', label: statisticalReportsEn.filters.demoOperators['OP-103'] },
    { id: 'OP-104', label: statisticalReportsEn.filters.demoOperators['OP-104'] },
  ],
  destinations: [
    { id: 'ALL', label: statisticalReportsEn.filters.allDestinationsLabel },
    { id: 'DEST-DAD', label: statisticalReportsEn.filters.demoDestinations['DEST-DAD'] },
    { id: 'DEST-HOI', label: statisticalReportsEn.filters.demoDestinations['DEST-HOI'] },
    { id: 'DEST-HUE', label: statisticalReportsEn.filters.demoDestinations['DEST-HUE'] },
    { id: 'DEST-DLI', label: statisticalReportsEn.filters.demoDestinations['DEST-DLI'] },
    { id: 'DEST-VCS', label: statisticalReportsEn.filters.demoDestinations['DEST-VCS'] },
  ],
  bookingTypes: CANONICAL_BOOKING_TYPE_OPTIONS,
} as const;

export function getFilterOptionsByMode(
  mode: StatisticalWorkspaceMode = 'PRODUCTION',
): StatisticalFilterOptionSet {
  return mode === 'PRODUCTION' ? PRODUCTION_FILTER_OPTIONS : DEMO_FILTER_FIXTURES;
}

export const PRODUCTION_PERIOD_OPTIONS: readonly ProductionReportingPeriodOption[] = [
  {
    key: '2026-09',
    granularity: 'CLOSED_MONTH',
    label: statisticalReportsEn.periods.production['2026-09'],
    startDateDisplay: '01/09/2026',
    endDateDisplay: '30/09/2026',
  },
  {
    key: '2026-08',
    granularity: 'CLOSED_MONTH',
    label: statisticalReportsEn.periods.production['2026-08'],
    startDateDisplay: '01/08/2026',
    endDateDisplay: '31/08/2026',
  },
  {
    key: '2026-07',
    granularity: 'CLOSED_MONTH',
    label: statisticalReportsEn.periods.production['2026-07'],
    startDateDisplay: '01/07/2026',
    endDateDisplay: '31/07/2026',
  },
  {
    key: '2026-Q3',
    granularity: 'CLOSED_QUARTER',
    label: statisticalReportsEn.periods.production['2026-Q3'],
    startDateDisplay: '01/07/2026',
    endDateDisplay: '30/09/2026',
  },
  {
    key: '2026-Q2',
    granularity: 'CLOSED_QUARTER',
    label: statisticalReportsEn.periods.production['2026-Q2'],
    startDateDisplay: '01/04/2026',
    endDateDisplay: '30/06/2026',
  },
  {
    key: '2025',
    granularity: 'CLOSED_YEAR',
    label: statisticalReportsEn.periods.production['2025'],
    startDateDisplay: '01/01/2025',
    endDateDisplay: '31/12/2025',
  },
  {
    key: '2024',
    granularity: 'CLOSED_YEAR',
    label: statisticalReportsEn.periods.production['2024'],
    startDateDisplay: '01/01/2024',
    endDateDisplay: '31/12/2024',
  },
] as const;

export const DEMO_PERIOD_FIXTURES: readonly DemoReportingPeriodFixture[] = [
  {
    key: '2026-09',
    granularity: 'CLOSED_MONTH',
    label: statisticalReportsEn.periods.demo['2026-09'],
    startDateDisplay: '01/09/2026',
    endDateDisplay: '30/09/2026',
    isClosed: true,
  },
  {
    key: '2026-08',
    granularity: 'CLOSED_MONTH',
    label: statisticalReportsEn.periods.demo['2026-08'],
    startDateDisplay: '01/08/2026',
    endDateDisplay: '31/08/2026',
    isClosed: true,
  },
  {
    key: '2026-07',
    granularity: 'CLOSED_MONTH',
    label: statisticalReportsEn.periods.demo['2026-07'],
    startDateDisplay: '01/07/2026',
    endDateDisplay: '31/07/2026',
    isClosed: true,
  },
  {
    key: '2026-10-OPEN',
    granularity: 'CLOSED_MONTH',
    label: statisticalReportsEn.periods.demo['2026-10-OPEN'],
    startDateDisplay: '01/10/2026',
    endDateDisplay: '31/10/2026',
    isClosed: false,
  },
  {
    key: '2026-Q3',
    granularity: 'CLOSED_QUARTER',
    label: statisticalReportsEn.periods.demo['2026-Q3'],
    startDateDisplay: '01/07/2026',
    endDateDisplay: '30/09/2026',
    isClosed: true,
  },
  {
    key: '2026-Q2',
    granularity: 'CLOSED_QUARTER',
    label: statisticalReportsEn.periods.demo['2026-Q2'],
    startDateDisplay: '01/04/2026',
    endDateDisplay: '30/06/2026',
    isClosed: true,
  },
  {
    key: '2026-Q4-OPEN',
    granularity: 'CLOSED_QUARTER',
    label: statisticalReportsEn.periods.demo['2026-Q4-OPEN'],
    startDateDisplay: '01/10/2026',
    endDateDisplay: '31/12/2026',
    isClosed: false,
  },
  {
    key: '2025',
    granularity: 'CLOSED_YEAR',
    label: statisticalReportsEn.periods.demo['2025'],
    startDateDisplay: '01/01/2025',
    endDateDisplay: '31/12/2025',
    isClosed: true,
  },
  {
    key: '2024',
    granularity: 'CLOSED_YEAR',
    label: statisticalReportsEn.periods.demo['2024'],
    startDateDisplay: '01/01/2024',
    endDateDisplay: '31/12/2024',
    isClosed: true,
  },
  {
    key: '2026-OPEN',
    granularity: 'CLOSED_YEAR',
    label: statisticalReportsEn.periods.demo['2026-OPEN'],
    startDateDisplay: '01/01/2026',
    endDateDisplay: '31/12/2026',
    isClosed: false,
  },
] as const;

export const DEFAULT_DRAFT_CRITERIA: StatisticalReportCriteria = {
  reportType: 'PLATFORM_REVENUE',
  periodGranularity: 'CLOSED_MONTH',
  periodKey: '2026-09',
  operatorId: 'ALL',
  destinationId: 'ALL',
  bookingType: 'ALL',
};

export function getProductionPeriodsByGranularity(
  granularity: PeriodGranularity,
): readonly ProductionReportingPeriodOption[] {
  return PRODUCTION_PERIOD_OPTIONS.filter((option) => option.granularity === granularity);
}

export function getDemoPeriodFixturesByGranularity(
  granularity: PeriodGranularity,
): readonly DemoReportingPeriodFixture[] {
  return DEMO_PERIOD_FIXTURES.filter((option) => option.granularity === granularity);
}

export function getPeriodsByGranularity(
  granularity: PeriodGranularity,
  mode: StatisticalWorkspaceMode = 'DEMO',
): readonly ReportingPeriodOption[] {
  return mode === 'PRODUCTION'
    ? getProductionPeriodsByGranularity(granularity)
    : getDemoPeriodFixturesByGranularity(granularity);
}

export function findProductionPeriodOption(
  periodKey: string,
): ProductionReportingPeriodOption | undefined {
  return PRODUCTION_PERIOD_OPTIONS.find((option) => option.key === periodKey);
}

export function findDemoPeriodFixture(periodKey: string): DemoReportingPeriodFixture | undefined {
  return DEMO_PERIOD_FIXTURES.find((option) => option.key === periodKey);
}

export function findPeriodOption(periodKey: string): DemoReportingPeriodFixture | undefined {
  return findDemoPeriodFixture(periodKey);
}

export function formatVndCurrency(amountVnd: number): string {
  const rounded = Math.round(amountVnd);
  const absFormatted = Math.abs(rounded).toLocaleString('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  const suffix = statisticalReportsEn.units.vndSuffix;
  return rounded < 0 ? `-${absFormatted} ${suffix}` : `${absFormatted} ${suffix}`;
}

export function formatIntegerCount(value: number): string {
  return Math.round(value).toLocaleString('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}

export function formatVietnamDateDdMmYyyy(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!Number.isFinite(date.getTime())) return '08/10/2026';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(date);
  const day = parts.find((p) => p.type === 'day')?.value ?? '08';
  const month = parts.find((p) => p.type === 'month')?.value ?? '10';
  const year = parts.find((p) => p.type === 'year')?.value ?? '2026';
  return `${day}/${month}/${year}`;
}

export function areCriteriaEqual(
  draft: StatisticalReportCriteria,
  applied: AppliedStatisticalReportCriteria | null,
): boolean {
  if (!applied) return false;
  return (
    draft.reportType === applied.reportType &&
    draft.periodGranularity === applied.periodGranularity &&
    draft.periodKey === applied.periodKey &&
    draft.operatorId === applied.operatorId &&
    draft.destinationId === applied.destinationId &&
    draft.bookingType === applied.bookingType
  );
}

function getScaleFactor(criteria: AppliedStatisticalReportCriteria): number {
  let factor = 1;
  if (criteria.periodGranularity === 'CLOSED_QUARTER') factor *= 3;
  if (criteria.periodGranularity === 'CLOSED_YEAR') factor *= 12;

  if (
    criteria.periodKey === '2026-08' ||
    criteria.periodKey === '2026-Q2' ||
    criteria.periodKey === '2024'
  ) {
    factor *= 0.9;
  } else if (criteria.periodKey === '2026-07') {
    factor *= 0.85;
  }

  if (criteria.operatorId === 'OP-101') factor *= 0.42;
  else if (criteria.operatorId === 'OP-102') factor *= 0.35;
  else if (criteria.operatorId === 'OP-103') factor *= 0.23;

  if (criteria.destinationId === 'DEST-DAD') factor *= 0.38;
  else if (criteria.destinationId === 'DEST-HOI') factor *= 0.32;
  else if (criteria.destinationId === 'DEST-HUE') factor *= 0.18;
  else if (criteria.destinationId === 'DEST-DLI') factor *= 0.12;

  if (criteria.bookingType === 'TOUR_PACKAGE') factor *= 0.72;
  else if (criteria.bookingType === 'COMMERCIAL_SERVICE') factor *= 0.28;

  return factor;
}

export function isNoDataCriteria(criteria: AppliedStatisticalReportCriteria): boolean {
  return criteria.operatorId === 'OP-104' || criteria.destinationId === 'DEST-VCS';
}

function buildChartPoints(
  rawItems: ReadonlyArray<{
    id: string;
    label: string;
    value: number;
    isCurrency?: boolean;
    secondaryLabel?: string;
  }>,
): readonly StatisticalChartPoint[] {
  const total = rawItems.reduce((sum, item) => sum + item.value, 0) || 1;
  return rawItems.map((item) => ({
    id: item.id,
    label: item.label,
    primaryValue: item.value,
    formattedPrimaryValue: item.isCurrency
      ? formatVndCurrency(item.value)
      : formatIntegerCount(item.value),
    secondaryLabel: item.secondaryLabel,
    sharePercent: Math.round((item.value / total) * 100),
  }));
}

export function generateDemoStatisticalReport(
  criteria: AppliedStatisticalReportCriteria,
  generatedDate: Date = new Date('2026-10-08T09:30:00+07:00'),
): GeneratedStatisticalReport | null {
  const period = findDemoPeriodFixture(criteria.periodKey);
  if (!period || !period.isClosed) return null;
  if (isNoDataCriteria(criteria)) {
    return {
      criteria,
      period,
      generatedAtDisplay: formatVietnamDateDdMmYyyy(generatedDate),
      summaryMetrics: [],
      chartUnitLabel: '',
      chartPoints: [],
      tableHeaders: statisticalReportsEn.reportTemplates.emptyTableHeaders,
      breakdownRows: [],
    };
  }

  const scale = getScaleFactor(criteria);
  const generatedAtDisplay = formatVietnamDateDdMmYyyy(generatedDate);
  const templates = statisticalReportsEn.reportTemplates;

  switch (criteria.reportType) {
    case 'PLATFORM_REVENUE': {
      const tpl = templates.PLATFORM_REVENUE;
      const confirmedBookingsGrossVnd = Math.round(640_000_000 * scale);
      const completedBookingsGrossVnd = Math.round(910_000_000 * scale);
      const recordedRefundsVnd = Math.round(130_000_000 * scale);
      const netPlatformRevenueVnd =
        confirmedBookingsGrossVnd + completedBookingsGrossVnd - recordedRefundsVnd;

      const revenueBreakdown: PlatformRevenueFormulaBreakdown = {
        confirmedBookingsGrossVnd,
        completedBookingsGrossVnd,
        recordedRefundsVnd,
        netPlatformRevenueVnd,
      };

      const seg1 = Math.round(netPlatformRevenueVnd * 0.44);
      const seg2 = Math.round(netPlatformRevenueVnd * 0.34);
      const seg3 = netPlatformRevenueVnd - seg1 - seg2;

      const summaryMetrics: readonly StatisticalSummaryMetric[] = [
        {
          id: 'net-platform-revenue',
          label: tpl.metrics.netPlatformRevenue.label,
          formattedValue: formatVndCurrency(netPlatformRevenueVnd),
          contextNote: tpl.metrics.netPlatformRevenue.contextNote,
        },
        {
          id: 'confirmed-gross',
          label: tpl.metrics.confirmedGross.label,
          formattedValue: formatVndCurrency(confirmedBookingsGrossVnd),
          contextNote: tpl.metrics.confirmedGross.contextNote,
        },
        {
          id: 'completed-gross',
          label: tpl.metrics.completedGross.label,
          formattedValue: formatVndCurrency(completedBookingsGrossVnd),
          contextNote: tpl.metrics.completedGross.contextNote,
        },
        {
          id: 'recorded-refunds',
          label: tpl.metrics.recordedRefunds.label,
          formattedValue: formatVndCurrency(recordedRefundsVnd),
          contextNote: tpl.metrics.recordedRefunds.contextNote,
        },
      ];

      const chartPoints = buildChartPoints([
        {
          id: 'rev-seg-1',
          label: tpl.segments.culturalHeritage,
          value: seg1,
          isCurrency: true,
          secondaryLabel: tpl.segmentSecondaryLabel,
        },
        {
          id: 'rev-seg-2',
          label: tpl.segments.coastalIsland,
          value: seg2,
          isCurrency: true,
          secondaryLabel: tpl.segmentSecondaryLabel,
        },
        {
          id: 'rev-seg-3',
          label: tpl.segments.highlandEco,
          value: seg3,
          isCurrency: true,
          secondaryLabel: tpl.segmentSecondaryLabel,
        },
      ]);

      const breakdownRows: readonly StatisticalBreakdownRow[] = [
        {
          id: 'row-rev-1',
          segmentLabel: tpl.segments.culturalHeritage,
          primaryMetricLabel: formatVndCurrency(
            Math.round((confirmedBookingsGrossVnd + completedBookingsGrossVnd) * 0.44),
          ),
          secondaryMetricLabel: formatVndCurrency(Math.round(recordedRefundsVnd * 0.44)),
          tertiaryMetricLabel: formatVndCurrency(seg1),
        },
        {
          id: 'row-rev-2',
          segmentLabel: tpl.segments.coastalIsland,
          primaryMetricLabel: formatVndCurrency(
            Math.round((confirmedBookingsGrossVnd + completedBookingsGrossVnd) * 0.34),
          ),
          secondaryMetricLabel: formatVndCurrency(Math.round(recordedRefundsVnd * 0.34)),
          tertiaryMetricLabel: formatVndCurrency(seg2),
        },
        {
          id: 'row-rev-3',
          segmentLabel: tpl.segments.highlandEco,
          primaryMetricLabel: formatVndCurrency(
            Math.round((confirmedBookingsGrossVnd + completedBookingsGrossVnd) * 0.22),
          ),
          secondaryMetricLabel: formatVndCurrency(Math.round(recordedRefundsVnd * 0.22)),
          tertiaryMetricLabel: formatVndCurrency(seg3),
        },
      ];

      return {
        criteria,
        period,
        generatedAtDisplay,
        summaryMetrics,
        revenueBreakdown,
        chartUnitLabel: tpl.chartUnitLabel,
        chartPoints,
        tableHeaders: tpl.tableHeaders,
        breakdownRows,
      };
    }

    case 'USER_GROWTH': {
      const tpl = templates.USER_GROWTH;
      const newTravelers = Math.max(12, Math.round(1_840 * scale));
      const newOperators = Math.max(2, Math.round(48 * scale));
      const verifiedActiveAccounts = Math.max(
        10,
        Math.round((newTravelers + newOperators) * 0.92),
      );
      const totalNewAccounts = newTravelers + newOperators;

      const summaryMetrics: readonly StatisticalSummaryMetric[] = [
        {
          id: 'total-new-accounts',
          label: tpl.metrics.totalNewAccounts.label,
          formattedValue: formatIntegerCount(totalNewAccounts),
          contextNote: tpl.metrics.totalNewAccounts.contextNote,
        },
        {
          id: 'new-travelers',
          label: tpl.metrics.newTravelers.label,
          formattedValue: formatIntegerCount(newTravelers),
          contextNote: tpl.metrics.newTravelers.contextNote,
        },
        {
          id: 'new-operators',
          label: tpl.metrics.newOperators.label,
          formattedValue: formatIntegerCount(newOperators),
          contextNote: tpl.metrics.newOperators.contextNote,
        },
        {
          id: 'verified-active',
          label: tpl.metrics.verifiedActive.label,
          formattedValue: formatIntegerCount(verifiedActiveAccounts),
          contextNote: tpl.metrics.verifiedActive.contextNote,
        },
      ];

      const w1 = Math.round(totalNewAccounts * 0.32);
      const w2 = Math.round(totalNewAccounts * 0.36);
      const w3 = totalNewAccounts - w1 - w2;

      const chartPoints = buildChartPoints([
        {
          id: 'ug-1',
          label: tpl.segments.directWeb,
          value: w1,
          secondaryLabel: tpl.segmentSecondaryLabel,
        },
        {
          id: 'ug-2',
          label: tpl.segments.mobileApp,
          value: w2,
          secondaryLabel: tpl.segmentSecondaryLabel,
        },
        {
          id: 'ug-3',
          label: tpl.segments.partnerReferral,
          value: w3,
          secondaryLabel: tpl.segmentSecondaryLabel,
        },
      ]);

      const shareSuffix = statisticalReportsEn.results.shareOfTotalSuffix;
      const breakdownRows: readonly StatisticalBreakdownRow[] = [
        {
          id: 'row-ug-1',
          segmentLabel: tpl.segments.directWeb,
          primaryMetricLabel: formatIntegerCount(w1),
          secondaryMetricLabel: formatIntegerCount(Math.round(w1 * 0.94)),
          tertiaryMetricLabel: `32% ${shareSuffix}`,
        },
        {
          id: 'row-ug-2',
          segmentLabel: tpl.segments.mobileApp,
          primaryMetricLabel: formatIntegerCount(w2),
          secondaryMetricLabel: formatIntegerCount(Math.round(w2 * 0.91)),
          tertiaryMetricLabel: `36% ${shareSuffix}`,
        },
        {
          id: 'row-ug-3',
          segmentLabel: tpl.segments.partnerReferral,
          primaryMetricLabel: formatIntegerCount(w3),
          secondaryMetricLabel: formatIntegerCount(Math.round(w3 * 0.9)),
          tertiaryMetricLabel: `32% ${shareSuffix}`,
        },
      ];

      return {
        criteria,
        period,
        generatedAtDisplay,
        summaryMetrics,
        chartUnitLabel: tpl.chartUnitLabel,
        chartPoints,
        tableHeaders: tpl.tableHeaders,
        breakdownRows,
      };
    }

    case 'BOOKING_VOLUME': {
      const tpl = templates.BOOKING_VOLUME;
      const confirmedCount = Math.max(8, Math.round(620 * scale));
      const completedCount = Math.max(12, Math.round(980 * scale));
      const refundedCount = Math.max(2, Math.round(95 * scale));
      const totalBookings = confirmedCount + completedCount + refundedCount;
      const settledValueVnd = Math.round(1_420_000_000 * scale);

      const summaryMetrics: readonly StatisticalSummaryMetric[] = [
        {
          id: 'total-bookings',
          label: tpl.metrics.totalBookings.label,
          formattedValue: formatIntegerCount(totalBookings),
          contextNote: tpl.metrics.totalBookings.contextNote,
        },
        {
          id: 'completed-bookings',
          label: tpl.metrics.completedBookings.label,
          formattedValue: formatIntegerCount(completedCount),
          contextNote: tpl.metrics.completedBookings.contextNote,
        },
        {
          id: 'confirmed-bookings',
          label: tpl.metrics.confirmedBookings.label,
          formattedValue: formatIntegerCount(confirmedCount),
          contextNote: tpl.metrics.confirmedBookings.contextNote,
        },
        {
          id: 'settled-booking-value',
          label: tpl.metrics.settledBookingValue.label,
          formattedValue: formatVndCurrency(settledValueVnd),
          contextNote: tpl.metrics.settledBookingValue.contextNote,
        },
      ];

      const chartPoints = buildChartPoints([
        { id: 'bv-completed', label: tpl.segments.completed, value: completedCount },
        { id: 'bv-confirmed', label: tpl.segments.confirmed, value: confirmedCount },
        { id: 'bv-refunded', label: tpl.segments.cancelledRefunded, value: refundedCount },
      ]);

      const breakdownRows: readonly StatisticalBreakdownRow[] = [
        {
          id: 'row-bv-1',
          segmentLabel: tpl.segments.completed,
          primaryMetricLabel: formatIntegerCount(completedCount),
          secondaryMetricLabel: formatVndCurrency(Math.round(910_000_000 * scale)),
          tertiaryMetricLabel: tpl.settlementStates.fulfilled,
        },
        {
          id: 'row-bv-2',
          segmentLabel: tpl.segments.confirmed,
          primaryMetricLabel: formatIntegerCount(confirmedCount),
          secondaryMetricLabel: formatVndCurrency(Math.round(640_000_000 * scale)),
          tertiaryMetricLabel: tpl.settlementStates.activeConfirmed,
        },
        {
          id: 'row-bv-3',
          segmentLabel: tpl.segments.cancelledRefunded,
          primaryMetricLabel: formatIntegerCount(refundedCount),
          secondaryMetricLabel: formatVndCurrency(Math.round(130_000_000 * scale)),
          tertiaryMetricLabel: tpl.settlementStates.refundRecorded,
        },
      ];

      return {
        criteria,
        period,
        generatedAtDisplay,
        summaryMetrics,
        chartUnitLabel: tpl.chartUnitLabel,
        chartPoints,
        tableHeaders: tpl.tableHeaders,
        breakdownRows,
      };
    }

    case 'OPERATOR_PERFORMANCE': {
      const tpl = templates.OPERATOR_PERFORMANCE;
      const activeOperators = criteria.operatorId === 'ALL' ? 24 : 1;
      const fulfilledDepartures = Math.max(6, Math.round(310 * scale));
      const netOperatorRevenueVnd = Math.round(1_420_000_000 * scale);

      const summaryMetrics: readonly StatisticalSummaryMetric[] = [
        {
          id: 'active-operators',
          label: tpl.metrics.activeOperators.label,
          formattedValue: formatIntegerCount(activeOperators),
          contextNote: tpl.metrics.activeOperators.contextNote,
        },
        {
          id: 'fulfilled-departures',
          label: tpl.metrics.fulfilledDepartures.label,
          formattedValue: formatIntegerCount(fulfilledDepartures),
          contextNote: tpl.metrics.fulfilledDepartures.contextNote,
        },
        {
          id: 'completion-rate',
          label: tpl.metrics.completionRate.label,
          formattedValue: '96%',
          contextNote: tpl.metrics.completionRate.contextNote,
        },
        {
          id: 'operator-net-revenue',
          label: tpl.metrics.operatorNetRevenue.label,
          formattedValue: formatVndCurrency(netOperatorRevenueVnd),
          contextNote: tpl.metrics.operatorNetRevenue.contextNote,
        },
      ];

      const op1 = Math.round(netOperatorRevenueVnd * 0.42);
      const op2 = Math.round(netOperatorRevenueVnd * 0.35);
      const op3 = netOperatorRevenueVnd - op1 - op2;

      const chartPoints = buildChartPoints([
        { id: 'op-101', label: tpl.segments.op101, value: op1, isCurrency: true },
        { id: 'op-102', label: tpl.segments.op102, value: op2, isCurrency: true },
        { id: 'op-103', label: tpl.segments.op103, value: op3, isCurrency: true },
      ]);

      const breakdownRows: readonly StatisticalBreakdownRow[] = [
        {
          id: 'row-op-1',
          segmentLabel: tpl.segments.op101,
          primaryMetricLabel: formatIntegerCount(
            Math.max(2, Math.round(fulfilledDepartures * 0.42)),
          ),
          secondaryMetricLabel: `97% ${tpl.completionSuffix}`,
          tertiaryMetricLabel: formatVndCurrency(op1),
        },
        {
          id: 'row-op-2',
          segmentLabel: tpl.segments.op102,
          primaryMetricLabel: formatIntegerCount(
            Math.max(2, Math.round(fulfilledDepartures * 0.35)),
          ),
          secondaryMetricLabel: `96% ${tpl.completionSuffix}`,
          tertiaryMetricLabel: formatVndCurrency(op2),
        },
        {
          id: 'row-op-3',
          segmentLabel: tpl.segments.op103,
          primaryMetricLabel: formatIntegerCount(
            Math.max(2, Math.round(fulfilledDepartures * 0.23)),
          ),
          secondaryMetricLabel: `95% ${tpl.completionSuffix}`,
          tertiaryMetricLabel: formatVndCurrency(op3),
        },
      ];

      return {
        criteria,
        period,
        generatedAtDisplay,
        summaryMetrics,
        chartUnitLabel: tpl.chartUnitLabel,
        chartPoints,
        tableHeaders: tpl.tableHeaders,
        breakdownRows,
      };
    }

    case 'DESTINATION_POPULARITY': {
      const tpl = templates.DESTINATION_POPULARITY;
      const totalVisits = Math.max(25, Math.round(4_250 * scale));
      const itineraryInclusions = Math.max(40, Math.round(6_800 * scale));
      const destinationRevenueVnd = Math.round(1_420_000_000 * scale);

      const summaryMetrics: readonly StatisticalSummaryMetric[] = [
        {
          id: 'completed-destination-visits',
          label: tpl.metrics.completedVisits.label,
          formattedValue: formatIntegerCount(totalVisits),
          contextNote: tpl.metrics.completedVisits.contextNote,
        },
        {
          id: 'itinerary-inclusions',
          label: tpl.metrics.itineraryInclusions.label,
          formattedValue: formatIntegerCount(itineraryInclusions),
          contextNote: tpl.metrics.itineraryInclusions.contextNote,
        },
        {
          id: 'top-destination',
          label: tpl.metrics.topDestination.label,
          formattedValue: tpl.segments.daNang,
          contextNote: tpl.metrics.topDestination.contextNote,
        },
        {
          id: 'destination-associated-revenue',
          label: tpl.metrics.associatedRevenue.label,
          formattedValue: formatVndCurrency(destinationRevenueVnd),
          contextNote: tpl.metrics.associatedRevenue.contextNote,
        },
      ];

      const d1 = Math.round(totalVisits * 0.38);
      const d2 = Math.round(totalVisits * 0.32);
      const d3 = Math.round(totalVisits * 0.18);
      const d4 = totalVisits - d1 - d2 - d3;

      const chartPoints = buildChartPoints([
        { id: 'dest-dad', label: tpl.segments.daNang, value: d1 },
        { id: 'dest-hoi', label: tpl.segments.hoiAn, value: d2 },
        { id: 'dest-hue', label: tpl.segments.hue, value: d3 },
        { id: 'dest-dli', label: tpl.segments.daLat, value: d4 },
      ]);

      const breakdownRows: readonly StatisticalBreakdownRow[] = [
        {
          id: 'row-dest-1',
          segmentLabel: tpl.segments.daNang,
          primaryMetricLabel: formatIntegerCount(d1),
          secondaryMetricLabel: formatIntegerCount(Math.round(itineraryInclusions * 0.38)),
          tertiaryMetricLabel: formatVndCurrency(Math.round(destinationRevenueVnd * 0.38)),
        },
        {
          id: 'row-dest-2',
          segmentLabel: tpl.segments.hoiAn,
          primaryMetricLabel: formatIntegerCount(d2),
          secondaryMetricLabel: formatIntegerCount(Math.round(itineraryInclusions * 0.32)),
          tertiaryMetricLabel: formatVndCurrency(Math.round(destinationRevenueVnd * 0.32)),
        },
        {
          id: 'row-dest-3',
          segmentLabel: tpl.segments.hue,
          primaryMetricLabel: formatIntegerCount(d3),
          secondaryMetricLabel: formatIntegerCount(Math.round(itineraryInclusions * 0.18)),
          tertiaryMetricLabel: formatVndCurrency(Math.round(destinationRevenueVnd * 0.18)),
        },
        {
          id: 'row-dest-4',
          segmentLabel: tpl.segments.daLat,
          primaryMetricLabel: formatIntegerCount(d4),
          secondaryMetricLabel: formatIntegerCount(Math.round(itineraryInclusions * 0.12)),
          tertiaryMetricLabel: formatVndCurrency(Math.round(destinationRevenueVnd * 0.12)),
        },
      ];

      return {
        criteria,
        period,
        generatedAtDisplay,
        summaryMetrics,
        chartUnitLabel: tpl.chartUnitLabel,
        chartPoints,
        tableHeaders: tpl.tableHeaders,
        breakdownRows,
      };
    }
  }
}

export function buildDemoExportArtifact(
  report: GeneratedStatisticalReport,
  format: ExportFormat,
  exportedAt: Date = new Date('2026-10-08T09:35:00+07:00'),
): DemoExportArtifact {
  const extMap: Record<ExportFormat, { ext: string; mime: string }> = {
    EXCEL: {
      ext: 'xlsx',
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    CSV: {
      ext: 'csv',
      mime: 'text/csv;charset=utf-8',
    },
    PDF: {
      ext: 'pdf',
      mime: 'application/pdf',
    },
  };

  const { ext, mime } = extMap[format];
  const exportCopy = statisticalReportsEn.exportArtifact;
  const fileName = `${exportCopy.fileNamePrefix}-${report.criteria.reportType}-${report.criteria.periodKey}.${ext}`;
  const exportedAtDisplay = formatVietnamDateDdMmYyyy(exportedAt);
  const reportTypeLabel = statisticalReportsEn.reportTypes[report.criteria.reportType].label;
  const colSep = exportCopy.columnSeparator;

  const headerLines = [
    exportCopy.watermarkHeader,
    `${exportCopy.reportTypePrefix}: ${reportTypeLabel} (${report.criteria.reportType})`,
    `${exportCopy.closedPeriodPrefix}: ${report.period.startDateDisplay} - ${report.period.endDateDisplay} (${report.criteria.periodKey})`,
    `${exportCopy.appliedFiltersPrefix}: ${exportCopy.operatorKeyLabel}=${report.criteria.operatorId}, ${exportCopy.destinationKeyLabel}=${report.criteria.destinationId}, ${exportCopy.bookingTypeKeyLabel}=${report.criteria.bookingType}`,
    `${exportCopy.exportFormatPrefix}: ${format} (.${ext})`,
    `${exportCopy.exportedDatePrefix}: ${exportedAtDisplay}`,
    exportCopy.sectionDivider,
    report.tableHeaders.join(colSep),
    ...report.breakdownRows.map((row) =>
      [
        row.segmentLabel,
        row.primaryMetricLabel,
        row.secondaryMetricLabel,
        row.tertiaryMetricLabel,
      ].join(colSep),
    ),
  ];

  const auditEventSummary = `${exportCopy.auditRecordPrefix} (${exportCopy.auditReportTypeKey}=${report.criteria.reportType}, ${exportCopy.auditPeriodKey}=${report.criteria.periodKey}, ${exportCopy.auditFormatKey}=${format}, ${exportCopy.auditDateKey}=${exportedAtDisplay})`;

  return {
    fileName,
    format,
    mimeType: mime,
    contentPreview: headerLines.join('\n'),
    exportedAtDisplay,
    auditEventSummary,
    criteriaSnapshot: report.criteria,
  };
}
