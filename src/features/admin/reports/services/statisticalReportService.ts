import { statisticalReportsEn } from '../resources/en';
import type {
  AppliedStatisticalReportCriteria,
  DemoExportArtifact,
  ExportFormat,
  GeneratedStatisticalReport,
  PeriodGranularity,
  PlatformRevenueFormulaBreakdown,
  ReportingPeriodOption,
  StatisticalBreakdownRow,
  StatisticalChartPoint,
  StatisticalReportCriteria,
  StatisticalSummaryMetric,
} from '../types/statisticalReports';

export const REPORTING_PERIOD_OPTIONS: readonly ReportingPeriodOption[] = [
  {
    key: '2026-09',
    granularity: 'CLOSED_MONTH',
    label: 'September 2026 (01/09/2026 – 30/09/2026 • Closed)',
    startDateDisplay: '01/09/2026',
    endDateDisplay: '30/09/2026',
    isClosed: true,
  },
  {
    key: '2026-08',
    granularity: 'CLOSED_MONTH',
    label: 'August 2026 (01/08/2026 – 31/08/2026 • Closed)',
    startDateDisplay: '01/08/2026',
    endDateDisplay: '31/08/2026',
    isClosed: true,
  },
  {
    key: '2026-07',
    granularity: 'CLOSED_MONTH',
    label: 'July 2026 (01/07/2026 – 31/07/2026 • Closed)',
    startDateDisplay: '01/07/2026',
    endDateDisplay: '31/07/2026',
    isClosed: true,
  },
  {
    key: '2026-10-OPEN',
    granularity: 'CLOSED_MONTH',
    label: 'October 2026 (01/10/2026 – Present • Current Open Month)',
    startDateDisplay: '01/10/2026',
    endDateDisplay: '31/10/2026',
    isClosed: false,
  },
  {
    key: '2026-Q3',
    granularity: 'CLOSED_QUARTER',
    label: 'Q3 2026 (01/07/2026 – 30/09/2026 • Closed)',
    startDateDisplay: '01/07/2026',
    endDateDisplay: '30/09/2026',
    isClosed: true,
  },
  {
    key: '2026-Q2',
    granularity: 'CLOSED_QUARTER',
    label: 'Q2 2026 (01/04/2026 – 30/06/2026 • Closed)',
    startDateDisplay: '01/04/2026',
    endDateDisplay: '30/06/2026',
    isClosed: true,
  },
  {
    key: '2026-Q4-OPEN',
    granularity: 'CLOSED_QUARTER',
    label: 'Q4 2026 (01/10/2026 – Present • Current Open Quarter)',
    startDateDisplay: '01/10/2026',
    endDateDisplay: '31/12/2026',
    isClosed: false,
  },
  {
    key: '2025',
    granularity: 'CLOSED_YEAR',
    label: 'FY 2025 (01/01/2025 – 31/12/2025 • Closed)',
    startDateDisplay: '01/01/2025',
    endDateDisplay: '31/12/2025',
    isClosed: true,
  },
  {
    key: '2024',
    granularity: 'CLOSED_YEAR',
    label: 'FY 2024 (01/01/2024 – 31/12/2024 • Closed)',
    startDateDisplay: '01/01/2024',
    endDateDisplay: '31/12/2024',
    isClosed: true,
  },
  {
    key: '2026-OPEN',
    granularity: 'CLOSED_YEAR',
    label: 'FY 2026 (01/01/2026 – Present • Current Open Year)',
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

export function getPeriodsByGranularity(
  granularity: PeriodGranularity,
): readonly ReportingPeriodOption[] {
  return REPORTING_PERIOD_OPTIONS.filter((option) => option.granularity === granularity);
}

export function findPeriodOption(periodKey: string): ReportingPeriodOption | undefined {
  return REPORTING_PERIOD_OPTIONS.find((option) => option.key === periodKey);
}

export function formatVndCurrency(amountVnd: number): string {
  const rounded = Math.round(amountVnd);
  const absFormatted = Math.abs(rounded).toLocaleString('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  return rounded < 0 ? `-${absFormatted} VND` : `${absFormatted} VND`;
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

  if (criteria.periodKey === '2026-08' || criteria.periodKey === '2026-Q2' || criteria.periodKey === '2024') {
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
  rawItems: ReadonlyArray<{ id: string; label: string; value: number; isCurrency?: boolean; secondaryLabel?: string }>,
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
  const period = findPeriodOption(criteria.periodKey);
  if (!period || !period.isClosed) return null;
  if (isNoDataCriteria(criteria)) {
    return {
      criteria,
      period,
      generatedAtDisplay: formatVietnamDateDdMmYyyy(generatedDate),
      summaryMetrics: [],
      chartUnitLabel: '',
      chartPoints: [],
      tableHeaders: ['Segment', 'Primary Metric', 'Secondary Metric', 'Status / Share'],
      breakdownRows: [],
    };
  }

  const scale = getScaleFactor(criteria);
  const generatedAtDisplay = formatVietnamDateDdMmYyyy(generatedDate);

  switch (criteria.reportType) {
    case 'PLATFORM_REVENUE': {
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
          label: 'Net Platform Revenue',
          formattedValue: formatVndCurrency(netPlatformRevenueVnd),
          contextNote: 'Confirmed + Completed bookings minus recorded refunds (Demo)',
        },
        {
          id: 'confirmed-gross',
          label: 'Confirmed Bookings Gross',
          formattedValue: formatVndCurrency(confirmedBookingsGrossVnd),
          contextNote: 'Verified confirmed booking settlements in period',
        },
        {
          id: 'completed-gross',
          label: 'Completed Bookings Gross',
          formattedValue: formatVndCurrency(completedBookingsGrossVnd),
          contextNote: 'Fulfilled completed trip and tour settlements',
        },
        {
          id: 'recorded-refunds',
          label: 'Recorded Refunds Deducted',
          formattedValue: formatVndCurrency(recordedRefundsVnd),
          contextNote: 'Processed traveler refund deductions in period',
        },
      ];

      const chartPoints = buildChartPoints([
        { id: 'rev-seg-1', label: 'Cultural & Heritage Tours', value: seg1, isCurrency: true, secondaryLabel: 'Confirmed + Completed Net' },
        { id: 'rev-seg-2', label: 'Coastal & Island Packages', value: seg2, isCurrency: true, secondaryLabel: 'Confirmed + Completed Net' },
        { id: 'rev-seg-3', label: 'Highland & Eco Experiences', value: seg3, isCurrency: true, secondaryLabel: 'Confirmed + Completed Net' },
      ]);

      const breakdownRows: readonly StatisticalBreakdownRow[] = [
        {
          id: 'row-rev-1',
          segmentLabel: 'Cultural & Heritage Tours',
          primaryMetricLabel: formatVndCurrency(Math.round((confirmedBookingsGrossVnd + completedBookingsGrossVnd) * 0.44)),
          secondaryMetricLabel: formatVndCurrency(Math.round(recordedRefundsVnd * 0.44)),
          tertiaryMetricLabel: formatVndCurrency(seg1),
        },
        {
          id: 'row-rev-2',
          segmentLabel: 'Coastal & Island Packages',
          primaryMetricLabel: formatVndCurrency(Math.round((confirmedBookingsGrossVnd + completedBookingsGrossVnd) * 0.34)),
          secondaryMetricLabel: formatVndCurrency(Math.round(recordedRefundsVnd * 0.34)),
          tertiaryMetricLabel: formatVndCurrency(seg2),
        },
        {
          id: 'row-rev-3',
          segmentLabel: 'Highland & Eco Experiences',
          primaryMetricLabel: formatVndCurrency(Math.round((confirmedBookingsGrossVnd + completedBookingsGrossVnd) * 0.22)),
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
        chartUnitLabel: 'Net Revenue (VND)',
        chartPoints,
        tableHeaders: [
          'Revenue Segment',
          'Confirmed + Completed Gross (VND)',
          'Recorded Refunds (VND)',
          'Net Revenue (VND)',
        ],
        breakdownRows,
      };
    }

    case 'USER_GROWTH': {
      const newTravelers = Math.max(12, Math.round(1_840 * scale));
      const newOperators = Math.max(2, Math.round(48 * scale));
      const verifiedActiveAccounts = Math.max(10, Math.round((newTravelers + newOperators) * 0.92));
      const totalNewAccounts = newTravelers + newOperators;

      const summaryMetrics: readonly StatisticalSummaryMetric[] = [
        {
          id: 'total-new-accounts',
          label: 'Total New Registrations',
          formattedValue: formatIntegerCount(totalNewAccounts),
          contextNote: 'Combined Traveler and Tour Operator sign-ups (Demo)',
        },
        {
          id: 'new-travelers',
          label: 'New Traveler Accounts',
          formattedValue: formatIntegerCount(newTravelers),
          contextNote: 'Registered travelers during closed period',
        },
        {
          id: 'new-operators',
          label: 'New Tour Operator Accounts',
          formattedValue: formatIntegerCount(newOperators),
          contextNote: 'Partner onboarding registrations in period',
        },
        {
          id: 'verified-active',
          label: 'Verified Active Accounts',
          formattedValue: formatIntegerCount(verifiedActiveAccounts),
          contextNote: 'Completed email verification and active status',
        },
      ];

      const w1 = Math.round(totalNewAccounts * 0.32);
      const w2 = Math.round(totalNewAccounts * 0.36);
      const w3 = totalNewAccounts - w1 - w2;

      const chartPoints = buildChartPoints([
        { id: 'ug-1', label: 'Direct Web Registrations', value: w1, secondaryLabel: 'Verified Accounts' },
        { id: 'ug-2', label: 'Mobile App Registrations', value: w2, secondaryLabel: 'Verified Accounts' },
        { id: 'ug-3', label: 'Partner & Referral Sign-Ups', value: w3, secondaryLabel: 'Verified Accounts' },
      ]);

      const breakdownRows: readonly StatisticalBreakdownRow[] = [
        {
          id: 'row-ug-1',
          segmentLabel: 'Direct Web Registrations',
          primaryMetricLabel: formatIntegerCount(w1),
          secondaryMetricLabel: formatIntegerCount(Math.round(w1 * 0.94)),
          tertiaryMetricLabel: '32% of period total',
        },
        {
          id: 'row-ug-2',
          segmentLabel: 'Mobile App Registrations',
          primaryMetricLabel: formatIntegerCount(w2),
          secondaryMetricLabel: formatIntegerCount(Math.round(w2 * 0.91)),
          tertiaryMetricLabel: '36% of period total',
        },
        {
          id: 'row-ug-3',
          segmentLabel: 'Partner & Referral Sign-Ups',
          primaryMetricLabel: formatIntegerCount(w3),
          secondaryMetricLabel: formatIntegerCount(Math.round(w3 * 0.9)),
          tertiaryMetricLabel: '32% of period total',
        },
      ];

      return {
        criteria,
        period,
        generatedAtDisplay,
        summaryMetrics,
        chartUnitLabel: 'Registered Accounts',
        chartPoints,
        tableHeaders: [
          'Registration Channel',
          'New Accounts',
          'Verified Active Accounts',
          'Period Share',
        ],
        breakdownRows,
      };
    }

    case 'BOOKING_VOLUME': {
      const confirmedCount = Math.max(8, Math.round(620 * scale));
      const completedCount = Math.max(12, Math.round(980 * scale));
      const refundedCount = Math.max(2, Math.round(95 * scale));
      const totalBookings = confirmedCount + completedCount + refundedCount;
      const settledValueVnd = Math.round(1_420_000_000 * scale);

      const summaryMetrics: readonly StatisticalSummaryMetric[] = [
        {
          id: 'total-bookings',
          label: 'Total Recorded Bookings',
          formattedValue: formatIntegerCount(totalBookings),
          contextNote: 'All booking transactions in closed period (Demo)',
        },
        {
          id: 'completed-bookings',
          label: 'Completed Bookings',
          formattedValue: formatIntegerCount(completedCount),
          contextNote: 'Fulfilled departures and services',
        },
        {
          id: 'confirmed-bookings',
          label: 'Confirmed Bookings',
          formattedValue: formatIntegerCount(confirmedCount),
          contextNote: 'Paid and scheduled confirmed bookings',
        },
        {
          id: 'settled-booking-value',
          label: 'Net Settled Booking Value',
          formattedValue: formatVndCurrency(settledValueVnd),
          contextNote: 'Net VND booking value after refunds',
        },
      ];

      const chartPoints = buildChartPoints([
        { id: 'bv-completed', label: 'Completed Bookings', value: completedCount },
        { id: 'bv-confirmed', label: 'Confirmed Bookings', value: confirmedCount },
        { id: 'bv-refunded', label: 'Cancelled & Refunded', value: refundedCount },
      ]);

      const breakdownRows: readonly StatisticalBreakdownRow[] = [
        {
          id: 'row-bv-1',
          segmentLabel: 'Completed Bookings',
          primaryMetricLabel: formatIntegerCount(completedCount),
          secondaryMetricLabel: formatVndCurrency(Math.round(910_000_000 * scale)),
          tertiaryMetricLabel: 'Fulfilled',
        },
        {
          id: 'row-bv-2',
          segmentLabel: 'Confirmed Bookings',
          primaryMetricLabel: formatIntegerCount(confirmedCount),
          secondaryMetricLabel: formatVndCurrency(Math.round(640_000_000 * scale)),
          tertiaryMetricLabel: 'Active Confirmed',
        },
        {
          id: 'row-bv-3',
          segmentLabel: 'Cancelled & Refunded',
          primaryMetricLabel: formatIntegerCount(refundedCount),
          secondaryMetricLabel: formatVndCurrency(Math.round(130_000_000 * scale)),
          tertiaryMetricLabel: 'Refund Recorded',
        },
      ];

      return {
        criteria,
        period,
        generatedAtDisplay,
        summaryMetrics,
        chartUnitLabel: 'Bookings Count',
        chartPoints,
        tableHeaders: [
          'Booking Status Category',
          'Booking Count',
          'Associated Value (VND)',
          'Settlement State',
        ],
        breakdownRows,
      };
    }

    case 'OPERATOR_PERFORMANCE': {
      const activeOperators = criteria.operatorId === 'ALL' ? 24 : 1;
      const fulfilledDepartures = Math.max(6, Math.round(310 * scale));
      const netOperatorRevenueVnd = Math.round(1_420_000_000 * scale);

      const summaryMetrics: readonly StatisticalSummaryMetric[] = [
        {
          id: 'active-operators',
          label: 'Evaluated Tour Operators',
          formattedValue: formatIntegerCount(activeOperators),
          contextNote: 'Approved operators included in report scope (Demo)',
        },
        {
          id: 'fulfilled-departures',
          label: 'Fulfilled Tour Departures',
          formattedValue: formatIntegerCount(fulfilledDepartures),
          contextNote: 'Departures completed without operational incident',
        },
        {
          id: 'completion-rate',
          label: 'Average Completion Rate',
          formattedValue: '96%',
          contextNote: 'Ratio of completed to scheduled departures',
        },
        {
          id: 'operator-net-revenue',
          label: 'Net Settled Tour Volume',
          formattedValue: formatVndCurrency(netOperatorRevenueVnd),
          contextNote: 'Confirmed + Completed bookings net of refunds',
        },
      ];

      const op1 = Math.round(netOperatorRevenueVnd * 0.42);
      const op2 = Math.round(netOperatorRevenueVnd * 0.35);
      const op3 = netOperatorRevenueVnd - op1 - op2;

      const chartPoints = buildChartPoints([
        { id: 'op-101', label: 'Central Heritage Journeys', value: op1, isCurrency: true },
        { id: 'op-102', label: 'Danang Coastal Expeditions', value: op2, isCurrency: true },
        { id: 'op-103', label: 'Highland Eco Trails', value: op3, isCurrency: true },
      ]);

      const breakdownRows: readonly StatisticalBreakdownRow[] = [
        {
          id: 'row-op-1',
          segmentLabel: 'Central Heritage Journeys',
          primaryMetricLabel: formatIntegerCount(Math.max(2, Math.round(fulfilledDepartures * 0.42))),
          secondaryMetricLabel: '97% Completion',
          tertiaryMetricLabel: formatVndCurrency(op1),
        },
        {
          id: 'row-op-2',
          segmentLabel: 'Danang Coastal Expeditions',
          primaryMetricLabel: formatIntegerCount(Math.max(2, Math.round(fulfilledDepartures * 0.35))),
          secondaryMetricLabel: '96% Completion',
          tertiaryMetricLabel: formatVndCurrency(op2),
        },
        {
          id: 'row-op-3',
          segmentLabel: 'Highland Eco Trails',
          primaryMetricLabel: formatIntegerCount(Math.max(2, Math.round(fulfilledDepartures * 0.23))),
          secondaryMetricLabel: '95% Completion',
          tertiaryMetricLabel: formatVndCurrency(op3),
        },
      ];

      return {
        criteria,
        period,
        generatedAtDisplay,
        summaryMetrics,
        chartUnitLabel: 'Net Settled Volume (VND)',
        chartPoints,
        tableHeaders: [
          'Tour Operator',
          'Fulfilled Departures',
          'Completion Rate',
          'Net Settled Volume (VND)',
        ],
        breakdownRows,
      };
    }

    case 'DESTINATION_POPULARITY': {
      const totalVisits = Math.max(25, Math.round(4_250 * scale));
      const itineraryInclusions = Math.max(40, Math.round(6_800 * scale));
      const destinationRevenueVnd = Math.round(1_420_000_000 * scale);

      const summaryMetrics: readonly StatisticalSummaryMetric[] = [
        {
          id: 'completed-destination-visits',
          label: 'Completed Traveler Visits',
          formattedValue: formatIntegerCount(totalVisits),
          contextNote: 'Verified completed trip visits across POIs (Demo)',
        },
        {
          id: 'itinerary-inclusions',
          label: 'Itinerary POI Inclusions',
          formattedValue: formatIntegerCount(itineraryInclusions),
          contextNote: 'Times destination POIs were scheduled in itineraries',
        },
        {
          id: 'top-destination',
          label: 'Leading Destination',
          formattedValue: 'Da Nang',
          contextNote: 'Highest combined booking and itinerary share',
        },
        {
          id: 'destination-associated-revenue',
          label: 'Associated Net Booking Value',
          formattedValue: formatVndCurrency(destinationRevenueVnd),
          contextNote: 'Confirmed + Completed bookings net of refunds',
        },
      ];

      const d1 = Math.round(totalVisits * 0.38);
      const d2 = Math.round(totalVisits * 0.32);
      const d3 = Math.round(totalVisits * 0.18);
      const d4 = totalVisits - d1 - d2 - d3;

      const chartPoints = buildChartPoints([
        { id: 'dest-dad', label: 'Da Nang', value: d1 },
        { id: 'dest-hoi', label: 'Hoi An', value: d2 },
        { id: 'dest-hue', label: 'Hue', value: d3 },
        { id: 'dest-dli', label: 'Da Lat', value: d4 },
      ]);

      const breakdownRows: readonly StatisticalBreakdownRow[] = [
        {
          id: 'row-dest-1',
          segmentLabel: 'Da Nang',
          primaryMetricLabel: formatIntegerCount(d1),
          secondaryMetricLabel: formatIntegerCount(Math.round(itineraryInclusions * 0.38)),
          tertiaryMetricLabel: formatVndCurrency(Math.round(destinationRevenueVnd * 0.38)),
        },
        {
          id: 'row-dest-2',
          segmentLabel: 'Hoi An',
          primaryMetricLabel: formatIntegerCount(d2),
          secondaryMetricLabel: formatIntegerCount(Math.round(itineraryInclusions * 0.32)),
          tertiaryMetricLabel: formatVndCurrency(Math.round(destinationRevenueVnd * 0.32)),
        },
        {
          id: 'row-dest-3',
          segmentLabel: 'Hue',
          primaryMetricLabel: formatIntegerCount(d3),
          secondaryMetricLabel: formatIntegerCount(Math.round(itineraryInclusions * 0.18)),
          tertiaryMetricLabel: formatVndCurrency(Math.round(destinationRevenueVnd * 0.18)),
        },
        {
          id: 'row-dest-4',
          segmentLabel: 'Da Lat',
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
        chartUnitLabel: 'Completed Traveler Visits',
        chartPoints,
        tableHeaders: [
          'Destination',
          'Completed Visits',
          'Itinerary Inclusions',
          'Associated Net Revenue (VND)',
        ],
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
  const fileName = `DEMO-TripMate-${report.criteria.reportType}-${report.criteria.periodKey}.${ext}`;
  const exportedAtDisplay = formatVietnamDateDdMmYyyy(exportedAt);
  const reportTypeLabel = statisticalReportsEn.reportTypes[report.criteria.reportType].label;

  const headerLines = [
    '[DEMO FIXTURE EXPORT — NOT PRODUCTION ACCOUNTING DATA]',
    `Report Type: ${reportTypeLabel} (${report.criteria.reportType})`,
    `Closed Period: ${report.period.startDateDisplay} - ${report.period.endDateDisplay} (${report.criteria.periodKey})`,
    `Applied Filters: Operator=${report.criteria.operatorId}, Destination=${report.criteria.destinationId}, BookingType=${report.criteria.bookingType}`,
    `Export Format: ${format} (.${ext})`,
    `Exported Date (Asia/Ho_Chi_Minh): ${exportedAtDisplay}`,
    '---',
    report.tableHeaders.join(' | '),
    ...report.breakdownRows.map(
      (row) =>
        `${row.segmentLabel} | ${row.primaryMetricLabel} | ${row.secondaryMetricLabel} | ${row.tertiaryMetricLabel}`,
    ),
  ];

  const auditEventSummary = `DEMO Audit Record: StatisticalReportExported (ReportType=${report.criteria.reportType}, Period=${report.criteria.periodKey}, Format=${format}, Date=${exportedAtDisplay})`;

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
