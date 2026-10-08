/**
 * Revenue & Analytics (UC-44) and Export (UC-45) lifecycle contracts and data structures.
 * Based strictly on Report 3 V2 §3.8.5.1 and §3.8.5.2.
 */

export type RevenuePeriodGranularity = 'daily' | 'weekly' | 'monthly';

export type RevenueExportFormat = 'xlsx' | 'csv' | 'pdf';

export type RevenueExportScope = 'summary' | 'summary_and_details';

export interface RevenueFilterInput {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  granularity: RevenuePeriodGranularity;
  tourId?: string; // Specific tour ID or undefined / 'all' for all owned tours
}

export interface RevenueSummaryDto {
  grossRevenue: number;
  platformCommission: number;
  netAmount: number;
  totalBookings: number;
  totalParticipants: number;
  refundedAmount: number;
  commissionRatePercent: number; // Configured platform commission (e.g. 10%)
}

export interface RevenueChartDataPoint {
  periodKey: string;
  periodLabel: string;
  grossRevenue: number;
  commission: number;
  netAmount: number;
  refundedAmount: number;
  bookingsCount: number;
}

export interface TourRevenueDetailItem {
  tourId: string;
  tourCode: string;
  tourName: string;
  bookingsCount: number;
  participantsCount: number;
  grossRevenue: number;
  refundedAmount: number;
  commission: number;
  netAmount: number;
}

export interface RevenueReportResult {
  summary: RevenueSummaryDto;
  chartData: RevenueChartDataPoint[];
  tourDetails: TourRevenueDetailItem[];
  totalToursCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  appliedFilters: RevenueFilterInput;
  pendingBackendNotice?: string;
  errorMessage?: string;
  messageCode?: string;
}

export interface ExportRevenuePayload {
  format: RevenueExportFormat;
  scope: RevenueExportScope;
  appliedFilters: RevenueFilterInput;
}

export type AsyncExportStatus = 'idle' | 'queued' | 'processing' | 'ready' | 'failed';

export interface ExportRevenueResult {
  success: boolean;
  fileName?: string;
  fileContent?: string;
  mimeType?: 'text/csv;charset=utf-8';
  downloadUrl?: string;
  isAsyncQueued?: boolean;
  asyncStatus?: AsyncExportStatus;
  message?: string;
  messageCode?: string;
}

export const REVENUE_DEFAULT_PAGE_SIZE = 20;

export const REVENUE_ERROR_CODES = {
  UNAUTHORIZED: 'MSG126',
  INVALID_PERIOD_RANGE: 'MSG29',
  NO_RECORDS_FOUND: 'MSG128',
  MISSING_REQUIRED_FIELD: 'MSG01',
  SUCCESS: 'MSG115',
  EXPORT_SUCCESS: 'MSG116',
  EXPORT_FAILED: 'MSG117',
  SYSTEM_FAILURE: 'MSG127',
  DOWNLOAD_INTERRUPTED: 'MSG106',
  PENDING_BE_INTEGRATION: 'PENDING_BE_INTEGRATION',
  PENDING_BINARY_EXPORT_INTEGRATION: 'PENDING_BINARY_EXPORT_INTEGRATION',
} as const;

export const REVENUE_MESSAGES = {
  PENDING_BE_INTEGRATION:
    'Revenue calculation and reporting backend integration is pending. No financial figures are fabricated in production.',
  PENDING_BINARY_EXPORT_INTEGRATION:
    'Binary export (.xlsx and .pdf) is pending backend export integration. In Demo mode, only CSV (.csv) file download is supported.',
  MSG126: 'Access denied. You can only view revenue for tour packages you own.',
  MSG29: 'End date must be on or after start date.',
  MSG128: 'No revenue records found for the selected period.',
  MSG115: 'Revenue report generated successfully.',
  MSG127: 'Unable to generate revenue report due to a system error. Please retry.',
  MSG01: 'Please select an export format.',
  MSG116: 'Revenue report exported successfully.',
  MSG117: 'Failed to generate export file. Please retry.',
  MSG106: 'Download was interrupted. The file remains available in export history.',
} as const;
