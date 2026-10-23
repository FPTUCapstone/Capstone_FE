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
  if (!Number.isFinite(date.getTime())) return '--/--/----';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(date);
  const day = parts.find((p) => p.type === 'day')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const year = parts.find((p) => p.type === 'year')?.value;
  if (!day || !month || !year) return '--/--/----';
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

/**
 * Evaluates whether a cell value represents a legitimate numeric metric
 * (e.g. integer, decimal, currency, percentage, or rating score)
 * so that legitimate negative or positive values like "-100", "+50",
 * "-17,640,000 VND", or "-10%" are not incorrectly prepended with an apostrophe.
 */
export function isLegitimateNumericMetric(val: string): boolean {
  const trimmed = val.trim();
  if (trimmed === '' || trimmed === '-') return false;
  // Pure integers or decimals with optional sign: "-123", "+123", "123.45", "-123.45"
  if (/^[+-]?\d+(?:[.,]\d+)?$/.test(trimmed)) return true;
  // Formatted numbers with thousand separators (dots or commas) and optional currency / percentage
  // e.g. "17.640.000 ₫", "-17.640.000 ₫", "1,250", "-1,250", "+5%", "-10%", "95%"
  if (/^[+-]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?\s*(?:₫|%|VND)?$/i.test(trimmed)) return true;
  // Score fractions: e.g. "4.8 / 5.0"
  if (/^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/.test(trimmed)) return true;
  return false;
}

/**
 * Escapes and sanitizes a cell value for RFC 4180 CSV generation,
 * neutralizing spreadsheet formula injection (CWE-1236 / CSV Injection)
 * while preserving multiline cells, quotes, Unicode/Vietnamese characters,
 * and legitimate numeric metrics.
 */
export function escapeCsvCell(value: string): string {
  if (!value) return '';

  let cell = value;

  // Formula triggers: =, +, -, @, or leading whitespace / control characters before them
  const trimmedLeading = cell.replace(/^[\s\u0000-\u001f]+/, '');
  const startsWithTrigger = /^[=+\-@]/.test(trimmedLeading) || /^[\t\r]/.test(cell);

  if (startsWithTrigger) {
    const isAlreadyEscaped = cell.startsWith("'");
    const isNumeric = isLegitimateNumericMetric(cell);

    if (!isAlreadyEscaped && !isNumeric) {
      cell = `'${cell}`;
    }
  }

  // RFC 4180 standard CSV quoting for commas, double quotes, CR, LF
  if (/[",\r\n]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }

  return cell;
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
  const isDownloadable = format === 'CSV';
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

  const csvRows: string[] = [
    [exportCopy.watermarkHeader].map(escapeCsvCell).join(','),
    [exportCopy.reportTypePrefix, `${reportTypeLabel} (${report.criteria.reportType})`]
      .map(escapeCsvCell)
      .join(','),
    [
      exportCopy.closedPeriodPrefix,
      `${report.period.startDateDisplay} - ${report.period.endDateDisplay} (${report.criteria.periodKey})`,
    ]
      .map(escapeCsvCell)
      .join(','),
    [
      exportCopy.appliedFiltersPrefix,
      `${exportCopy.operatorKeyLabel}=${report.criteria.operatorId}; ${exportCopy.destinationKeyLabel}=${report.criteria.destinationId}; ${exportCopy.bookingTypeKeyLabel}=${report.criteria.bookingType}`,
    ]
      .map(escapeCsvCell)
      .join(','),
    [exportCopy.exportedDatePrefix, exportedAtDisplay].map(escapeCsvCell).join(','),
    '',
    report.tableHeaders.map(escapeCsvCell).join(','),
    ...report.breakdownRows.map((row) =>
      [
        row.segmentLabel,
        row.primaryMetricLabel,
        row.secondaryMetricLabel,
        row.tertiaryMetricLabel,
      ]
        .map(escapeCsvCell)
        .join(','),
    ),
  ];

  const auditPrefix = isDownloadable
    ? exportCopy.auditRecordPrefix
    : exportCopy.auditPreviewPrefix;
  const auditEventSummary = `${auditPrefix} (${exportCopy.auditReportTypeKey}=${report.criteria.reportType}, ${exportCopy.auditPeriodKey}=${report.criteria.periodKey}, ${exportCopy.auditFormatKey}=${format}, ${exportCopy.auditDateKey}=${exportedAtDisplay})`;

  return {
    fileName,
    format,
    mimeType: mime,
    isDownloadable,
    csvContent: isDownloadable ? csvRows.join('\r\n') : undefined,
    contentPreview: headerLines.join('\n'),
    exportedAtDisplay,
    auditEventSummary,
    criteriaSnapshot: report.criteria,
  };
}

export function triggerBrowserCsvDownload(artifact: DemoExportArtifact): boolean {
  if (!artifact.isDownloadable || artifact.format !== 'CSV' || !artifact.csvContent) {
    return false;
  }
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof Blob === 'undefined' ||
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function'
  ) {
    return false;
  }

  let objectUrl: string | null = null;
  try {
    const blob = new Blob([artifact.csvContent], { type: 'text/csv;charset=utf-8' });
    objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = artifact.fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    return true;
  } catch {
    return false;
  } finally {
    if (objectUrl && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

interface BackendMetric { key: string; label: string; value: number; isCurrency: boolean; }
interface BackendRow { key: string; label: string; primaryValue: number; secondaryValue: number; tertiaryValue: number; isCurrency: boolean; }
interface BackendReport { reportType: string; period: { periodKey: string; startDate: string; endDate: string }; generatedAtUtc: string; metrics: BackendMetric[]; breakdown: BackendRow[]; }

function displayDate(value: string): string {
  const matched = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return matched ? `${matched[3]}/${matched[2]}/${matched[1]}` : value;
}

function parseBackendReport(value: unknown, criteria: AppliedStatisticalReportCriteria): GeneratedStatisticalReport {
  if (!value || typeof value !== 'object') throw new Error('Invalid statistical report response.');
  const report = value as Partial<BackendReport>;
  if (!report.period || !Array.isArray(report.metrics) || !Array.isArray(report.breakdown)) throw new Error('Invalid statistical report response.');
  const periodKey = typeof report.period.periodKey === 'string' ? report.period.periodKey : criteria.periodKey;
  const metrics = report.metrics.map((metric) => ({
    id: metric.key,
    label: metric.label,
    formattedValue: metric.isCurrency ? formatVndCurrency(metric.value) : formatIntegerCount(metric.value),
    contextNote: metric.isCurrency ? 'Closed-period accounting snapshot' : 'Closed-period statistical snapshot',
  }));
  const rows = report.breakdown.map((row) => ({
    id: row.key,
    segmentLabel: row.label,
    primaryMetricLabel: row.isCurrency ? formatVndCurrency(row.primaryValue) : formatIntegerCount(row.primaryValue),
    secondaryMetricLabel: row.isCurrency ? formatVndCurrency(row.secondaryValue) : formatIntegerCount(row.secondaryValue),
    tertiaryMetricLabel: row.isCurrency ? formatVndCurrency(row.tertiaryValue) : formatIntegerCount(row.tertiaryValue),
  }));
  const points = report.breakdown.map((row) => ({
    id: row.key,
    label: row.label,
    primaryValue: row.primaryValue,
    formattedPrimaryValue: row.isCurrency ? formatVndCurrency(row.primaryValue) : formatIntegerCount(row.primaryValue),
    sharePercent: 0,
  }));
  const denominator = points.reduce((total, point) => total + Math.max(0, point.primaryValue), 0);
  const chartPoints = points.map((point) => ({ ...point, sharePercent: denominator ? Math.round((Math.max(0, point.primaryValue) / denominator) * 100) : 0 }));
  return {
    criteria,
    period: { key: periodKey, granularity: criteria.periodGranularity, label: periodKey, startDateDisplay: displayDate(report.period.startDate), endDateDisplay: displayDate(report.period.endDate), isClosed: true },
    generatedAtDisplay: formatVietnamDateDdMmYyyy(report.generatedAtUtc ?? new Date()),
    summaryMetrics: metrics,
    chartUnitLabel: criteria.reportType === 'PLATFORM_REVENUE' ? 'VND' : 'Count',
    chartPoints,
    tableHeaders: ['Segment', 'Primary value', 'Secondary value', 'Tertiary value'],
    breakdownRows: rows,
  };
}

export async function fetchProductionStatisticalReport(criteria: AppliedStatisticalReportCriteria, signal?: AbortSignal): Promise<GeneratedStatisticalReport> {
  const query = new URLSearchParams({ reportType: criteria.reportType, periodKey: criteria.periodKey, bookingType: criteria.bookingType });
  if (criteria.operatorId !== 'ALL') query.set('operatorUserId', criteria.operatorId);
  if (criteria.destinationId !== 'ALL') query.set('destinationId', criteria.destinationId);
  const response = await fetch(`/api/admin/statistical-reports?${query.toString()}`, { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body && typeof body === 'object' && 'title' in body && typeof (body as { title?: unknown }).title === 'string' ? (body as { title: string }).title : 'Unable to generate the statistical report.');
  return parseBackendReport(body, criteria);
}

type BackendPeriod = {
  readonly periodKey?: unknown;
  readonly startDate?: unknown;
  readonly endDate?: unknown;
};

function periodGranularityFromKey(key: string): PeriodGranularity | null {
  if (/^\d{4}-\d{2}$/.test(key)) return 'CLOSED_MONTH';
  if (/^\d{4}-Q[1-4]$/.test(key)) return 'CLOSED_QUARTER';
  if (/^\d{4}$/.test(key)) return 'CLOSED_YEAR';
  return null;
}

function displayPeriodLabel(key: string, startDate: string, endDate: string): string {
  return `${key} (${displayDate(startDate)}–${displayDate(endDate)})`;
}

/** Reads the periods closed by UC-67 rather than relying on release-specific fixtures. */
export async function fetchProductionReportingPeriods(signal?: AbortSignal): Promise<readonly ProductionReportingPeriodOption[]> {
  const response = await fetch('/api/admin/statistical-reports/periods', {
    credentials: 'same-origin', headers: { Accept: 'application/json' }, signal,
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(body)) {
    throw new Error('Unable to load closed reporting periods.');
  }
  return body.flatMap((value) => {
    const period = value as BackendPeriod;
    if (typeof period.periodKey !== 'string' || typeof period.startDate !== 'string' || typeof period.endDate !== 'string') return [];
    const granularity = periodGranularityFromKey(period.periodKey);
    if (!granularity) return [];
    return [{
      key: period.periodKey,
      granularity,
      label: displayPeriodLabel(period.periodKey, period.startDate, period.endDate),
      startDateDisplay: displayDate(period.startDate),
      endDateDisplay: displayDate(period.endDate),
    }];
  });
}

export function productionExportUrl(criteria: AppliedStatisticalReportCriteria, format: 'CSV' | 'EXCEL'): string {
  const operationId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (character) => {
      const value = Math.floor(Math.random() * 16);
      return (character === 'x' ? value : ((value & 0x3) | 0x8)).toString(16);
    });
  const query = new URLSearchParams({ reportType: criteria.reportType, periodKey: criteria.periodKey, bookingType: criteria.bookingType, format: format === 'EXCEL' ? 'xlsx' : 'csv', exportOperationId: operationId });
  if (criteria.operatorId !== 'ALL') query.set('operatorUserId', criteria.operatorId);
  if (criteria.destinationId !== 'ALL') query.set('destinationId', criteria.destinationId);
  return `/api/admin/statistical-reports/export?${query.toString()}`;
}
