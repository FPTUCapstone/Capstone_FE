/**
 * Revenue & Analytics (UC-44) and Export (UC-45) lifecycle contracts and data structures.
 * Based strictly on Report 3 V2 §3.8.5.1 and §3.8.5.2.
 */

export type RevenuePeriodGranularity = 'daily' | 'weekly' | 'monthly';

// CSV and PDF are deferred by product decision: this operator has no external accounting
// system to feed, and PDF is not an accounting-friendly format. Only XLSX is implemented.
export type RevenueExportFormat = 'xlsx';

export type RevenueExportScope = 'summary' | 'summary_and_details';

export type RevenueExportStatus = 'Queued' | 'Processing' | 'Ready' | 'Failed' | 'Expired';

export interface RevenueFilterInput {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  granularity: RevenuePeriodGranularity;
  tourId?: string; // Specific tour ID or undefined / 'all' for all owned tours
}

export interface RevenueSummaryDto {
  grossRevenue: number;
  paymentsReceived: number; // Amount actually paid by travelers (gross revenue minus discounts)
  discountsGiven: number; // Coupon/promo discounts applied on eligible bookings
  platformCommission: number;
  netAmount: number;
  netSales: number; // Payments received minus refunded amount, before commission
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

/** Mirrors the backend's RevenueExportResponseDto; shared by create, history, and download. */
export interface RevenueExportRecord {
  id: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  granularity: RevenuePeriodGranularity;
  tourId?: number;
  format: RevenueExportFormat;
  scope: RevenueExportScope;
  status: RevenueExportStatus;
  requestedAtUtc: string;
  completedAtUtc?: string;
  expiresAtUtc?: string;
  fileName?: string;
  /** Only present while Status is Ready and unexpired; never a persisted storage URL. */
  downloadUrl?: string;
}

export interface CreateRevenueExportResult {
  success: boolean;
  record?: RevenueExportRecord;
  message?: string;
  messageCode?: string;
}

export interface RevenueExportHistoryResult {
  items: RevenueExportRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  errorMessage?: string;
  messageCode?: string;
}

export interface DownloadRevenueExportResult {
  success: boolean;
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
} as const;

export const REVENUE_MESSAGES = {
  PENDING_BE_INTEGRATION:
    'Revenue calculation and reporting backend integration is pending. No financial figures are fabricated in production.',
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
