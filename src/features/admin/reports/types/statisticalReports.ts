export type StatisticalReportType =
  | 'USER_GROWTH'
  | 'BOOKING_VOLUME'
  | 'PLATFORM_REVENUE'
  | 'OPERATOR_PERFORMANCE'
  | 'DESTINATION_POPULARITY';

export type PeriodGranularity = 'CLOSED_MONTH' | 'CLOSED_QUARTER' | 'CLOSED_YEAR';

export type BookingTypeFilter = 'ALL' | 'TOUR_PACKAGE' | 'COMMERCIAL_SERVICE';

export type ExportFormat = 'EXCEL' | 'CSV' | 'PDF';

export type StatisticalWorkspaceMode = 'PRODUCTION' | 'DEMO';

export interface ProductionReportingPeriodOption {
  readonly key: string;
  readonly granularity: PeriodGranularity;
  readonly label: string;
  readonly startDateDisplay: string;
  readonly endDateDisplay: string;
}

export interface DemoReportingPeriodFixture extends ProductionReportingPeriodOption {
  readonly isClosed: boolean;
}

export type ReportingPeriodOption = ProductionReportingPeriodOption | DemoReportingPeriodFixture;

export interface StatisticalReportCriteria {
  readonly reportType: StatisticalReportType | '';
  readonly periodGranularity: PeriodGranularity;
  readonly periodKey: string;
  readonly operatorId: string;
  readonly destinationId: string;
  readonly bookingType: BookingTypeFilter;
}

export interface AppliedStatisticalReportCriteria {
  readonly reportType: StatisticalReportType;
  readonly periodGranularity: PeriodGranularity;
  readonly periodKey: string;
  readonly operatorId: string;
  readonly destinationId: string;
  readonly bookingType: BookingTypeFilter;
}

export interface StatisticalSummaryMetric {
  readonly id: string;
  readonly label: string;
  readonly formattedValue: string;
  readonly contextNote: string;
}

export interface PlatformRevenueFormulaBreakdown {
  readonly confirmedBookingsGrossVnd: number;
  readonly completedBookingsGrossVnd: number;
  readonly recordedRefundsVnd: number;
  readonly netPlatformRevenueVnd: number;
}

export interface StatisticalChartPoint {
  readonly id: string;
  readonly label: string;
  readonly primaryValue: number;
  readonly formattedPrimaryValue: string;
  readonly secondaryLabel?: string;
  readonly sharePercent: number;
}

export interface StatisticalBreakdownRow {
  readonly id: string;
  readonly segmentLabel: string;
  readonly primaryMetricLabel: string;
  readonly secondaryMetricLabel: string;
  readonly tertiaryMetricLabel: string;
}

export interface GeneratedStatisticalReport {
  readonly criteria: AppliedStatisticalReportCriteria;
  readonly period: DemoReportingPeriodFixture;
  readonly generatedAtDisplay: string;
  readonly summaryMetrics: readonly StatisticalSummaryMetric[];
  readonly revenueBreakdown?: PlatformRevenueFormulaBreakdown;
  readonly chartUnitLabel: string;
  readonly chartPoints: readonly StatisticalChartPoint[];
  readonly tableHeaders: readonly [string, string, string, string];
  readonly breakdownRows: readonly StatisticalBreakdownRow[];
}

export interface DemoExportArtifact {
  readonly fileName: string;
  readonly format: ExportFormat;
  readonly mimeType: string;
  readonly contentPreview: string;
  readonly exportedAtDisplay: string;
  readonly auditEventSummary: string;
  readonly criteriaSnapshot: AppliedStatisticalReportCriteria;
}
