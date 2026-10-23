/**
 * Service implementation for Revenue & Analytics (UC-44) and Export (UC-45).
 * Production mode adheres strictly to NO_BACKEND truthfulness (PENDING_BE_INTEGRATION).
 * Demo mode implements deterministic aggregations across owned tours with strict actor isolation (BR-105).
 */

import {
  DEMO_OPERATOR_TOURS,
  DEMO_PLATFORM_COMMISSION_RATE,
  INITIAL_DEMO_REVENUE_BOOKINGS,
  isFinanceDemoAllowedInCurrentEnv,
  type DemoBookingRecord,
  type DemoTourPackage,
} from '../data/operatorRevenueDemoFixtures';
import {
  REVENUE_DEFAULT_PAGE_SIZE,
  REVENUE_ERROR_CODES,
  REVENUE_MESSAGES,
  type CreateRevenueExportResult,
  type DownloadRevenueExportResult,
  type ExportRevenuePayload,
  type RevenueChartDataPoint,
  type RevenueExportHistoryResult,
  type RevenueExportRecord,
  type RevenueFilterInput,
  type RevenueReportResult,
  type RevenueSummaryDto,
  type TourRevenueDetailItem,
} from '../types/revenueLifecycle';

export interface OperatorRevenueServiceOptions {
  isDemo?: boolean;
  demoActorUserId?: number | string;
}

function isValidActor(id?: number | string): boolean {
  return id !== undefined && id !== null && String(id).trim().length > 0;
}

const ZERO_SUMMARY: RevenueSummaryDto = {
  grossRevenue: 0,
  paymentsReceived: 0,
  discountsGiven: 0,
  platformCommission: 0,
  netAmount: 0,
  netSales: 0,
  totalBookings: 0,
  totalParticipants: 0,
  refundedAmount: 0,
  commissionRatePercent: DEMO_PLATFORM_COMMISSION_RATE,
};

/**
 * Returns tour packages owned by the authenticated operator for filter dropdowns.
 */
export async function getOperatorRevenueTours(
  options: OperatorRevenueServiceOptions = {}
): Promise<DemoTourPackage[]> {
  const isDemoActive = Boolean(options.isDemo && isFinanceDemoAllowedInCurrentEnv());
  if (!isDemoActive) {
    try {
      const response = await fetch('/api/operator/revenue/tours', { cache: 'no-store' });
      if (!response.ok) return [];
      const body = await response.json();
      // Backend returns a plain JSON array: [{id, code, title, isActive}]
      const items: Array<{ id: number; code: string; title: string; isActive: boolean }> =
        Array.isArray(body) ? body : [];
      return items.map((tour) => ({
        id: String(tour.id),
        tourCode: tour.code,
        title: tour.title,
        operatorUserId: 0,
      }));
    } catch { return []; }
  }
  if (!isValidActor(options.demoActorUserId)) return [];
  return DEMO_OPERATOR_TOURS.filter(
    (t) => String(t.operatorUserId) === String(options.demoActorUserId)
  );
}

/**
 * Generates period chart data points according to chosen granularity.
 */
function aggregateChartData(
  bookings: DemoBookingRecord[],
  refunds: DemoBookingRecord[],
  granularity: 'daily' | 'weekly' | 'monthly',
  commissionRate: number
): RevenueChartDataPoint[] {
  const pointsMap = new Map<
    string,
    {
      periodLabel: string;
      grossRevenue: number;
      commission: number;
      netAmount: number;
      refundedAmount: number;
      bookingsCount: number;
    }
  >();

  // Process revenue bookings
  for (const b of bookings) {
    let key = b.departureDate;
    let label = b.departureDate;

    if (granularity === 'monthly') {
      key = b.departureDate.substring(0, 7); // YYYY-MM
      label = key;
    } else if (granularity === 'weekly') {
      // Approximate week bucket
      const d = new Date(b.departureDate);
      const weekNum = Math.ceil(d.getDate() / 7);
      key = `${b.departureDate.substring(0, 7)}-W${weekNum}`;
      label = `W${weekNum} ${b.departureDate.substring(0, 7)}`;
    }

    const current = pointsMap.get(key) || {
      periodLabel: label,
      grossRevenue: 0,
      commission: 0,
      netAmount: 0,
      refundedAmount: 0,
      bookingsCount: 0,
    };

    current.grossRevenue += b.paidAmount;
    current.bookingsCount += 1;
    pointsMap.set(key, current);
  }

  // Process refunds in period
  for (const r of refunds) {
    const refundDate = r.refundCompletedDate || r.departureDate;
    let key = refundDate;
    let label = refundDate;

    if (granularity === 'monthly') {
      key = refundDate.substring(0, 7);
      label = key;
    } else if (granularity === 'weekly') {
      const d = new Date(refundDate);
      const weekNum = Math.ceil(d.getDate() / 7);
      key = `${refundDate.substring(0, 7)}-W${weekNum}`;
      label = `W${weekNum} ${refundDate.substring(0, 7)}`;
    }

    const current = pointsMap.get(key) || {
      periodLabel: label,
      grossRevenue: 0,
      commission: 0,
      netAmount: 0,
      refundedAmount: 0,
      bookingsCount: 0,
    };

    current.refundedAmount += r.refundedAmount || 0;
    pointsMap.set(key, current);
  }

  // Calculate commission and net for each point
  const sortedKeys = Array.from(pointsMap.keys()).sort();
  return sortedKeys.map((k) => {
    const val = pointsMap.get(k)!;
    const comm = Math.round(val.grossRevenue * (commissionRate / 100));
    const net = val.grossRevenue - comm - val.refundedAmount;
    return {
      periodKey: k,
      periodLabel: val.periodLabel,
      grossRevenue: val.grossRevenue,
      commission: comm,
      netAmount: net,
      refundedAmount: val.refundedAmount,
      bookingsCount: val.bookingsCount,
    };
  });
}

/**
 * Retrieves the Tour Operator Revenue Report (UC-44).
 */
export async function getOperatorRevenueReport(
  filters: RevenueFilterInput,
  options: OperatorRevenueServiceOptions = {},
  pagination: { page?: number; pageSize?: number } = {}
): Promise<RevenueReportResult> {
  const isDemoActive = Boolean(options.isDemo && isFinanceDemoAllowedInCurrentEnv());
  const page = pagination.page ?? 1;
  const pageSize = pagination.pageSize ?? REVENUE_DEFAULT_PAGE_SIZE;

  if (!isDemoActive) {
    try {
      const params = new URLSearchParams({ startDate: filters.startDate, endDate: filters.endDate, granularity: filters.granularity, page: String(page), pageSize: String(pageSize) });
      if (filters.tourId && filters.tourId !== 'all') params.set('tourId', filters.tourId);
      const response = await fetch(`/api/operator/revenue/report?${params.toString()}`, { cache: 'no-store' });
      const body = await response.json().catch(() => null);
      const data = body?.data ?? body;
      if (!response.ok || !data?.summary) {
        throw new Error(body?.title || 'Không thể tải dữ liệu doanh thu. Hãy kiểm tra Backend và đăng nhập lại.');
      }
      return { ...data, appliedFilters: filters, messageCode: REVENUE_ERROR_CODES.SUCCESS } as RevenueReportResult;
    } catch (error) {
      return { summary: { ...ZERO_SUMMARY }, chartData: [], tourDetails: [], totalToursCount: 0, page, pageSize, totalPages: 0, appliedFilters: filters, errorMessage: error instanceof Error ? error.message : 'Không thể tải dữ liệu doanh thu. Hãy kiểm tra Backend và đăng nhập lại.', messageCode: REVENUE_ERROR_CODES.SYSTEM_FAILURE };
    }
  }

  // BR-105 Fail-closed if actor identity is missing in demo mode
  if (!isValidActor(options.demoActorUserId)) {
    return {
      summary: { ...ZERO_SUMMARY },
      chartData: [],
      tourDetails: [],
      totalToursCount: 0,
      page,
      pageSize,
      totalPages: 0,
      appliedFilters: filters,
      errorMessage: REVENUE_MESSAGES.MSG126,
      messageCode: REVENUE_ERROR_CODES.UNAUTHORIZED,
    };
  }

  // Logical date range validation (MSG29)
  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    if (start > end) {
      return {
        summary: { ...ZERO_SUMMARY },
        chartData: [],
        tourDetails: [],
        totalToursCount: 0,
        page,
        pageSize,
        totalPages: 0,
        appliedFilters: filters,
        errorMessage: REVENUE_MESSAGES.MSG29,
        messageCode: REVENUE_ERROR_CODES.INVALID_PERIOD_RANGE,
      };
    }
  }

  // Find tours owned by the authenticated operator (BR-105)
  const ownedTours = DEMO_OPERATOR_TOURS.filter(
    (t) => String(t.operatorUserId) === String(options.demoActorUserId)
  );
  const ownedTourIds = new Set(ownedTours.map((t) => t.id));

  // Filter bookings strictly by ownership (BR-105)
  const operatorBookings = INITIAL_DEMO_REVENUE_BOOKINGS.filter(
    (b) =>
      String(b.operatorUserId) === String(options.demoActorUserId) &&
      ownedTourIds.has(b.tourId)
  );

  // Apply optional tour filter
  const targetBookings =
    filters.tourId && filters.tourId !== 'all'
      ? operatorBookings.filter((b) => b.tourId === filters.tourId)
      : operatorBookings;

  // Filter revenue-eligible bookings (BR-109: Confirmed or Completed, verified payment)
  const revenueEligible = targetBookings.filter((b) => {
    const isEligibleStatus = b.status === 'Confirmed' || b.status === 'Completed';
    const isWithinDate =
      (!filters.startDate || b.departureDate >= filters.startDate) &&
      (!filters.endDate || b.departureDate <= filters.endDate);
    return isEligibleStatus && b.hasVerifiedPayment && isWithinDate;
  });

  // Filter completed refunds in the period (BR-112)
  const refundEligible = targetBookings.filter((b) => {
    if (!b.refundedAmount || !b.refundCompletedDate) return false;
    const isWithinRefundDate =
      (!filters.startDate || b.refundCompletedDate >= filters.startDate) &&
      (!filters.endDate || b.refundCompletedDate <= filters.endDate);
    return isWithinRefundDate;
  });

  // If no records match, return zero report with MSG128 (BR-109 / 5.a1)
  if (revenueEligible.length === 0 && refundEligible.length === 0) {
    return {
      summary: { ...ZERO_SUMMARY },
      chartData: [],
      tourDetails: [],
      totalToursCount: 0,
      page: 1,
      pageSize,
      totalPages: 0,
      appliedFilters: filters,
      errorMessage: REVENUE_MESSAGES.MSG128,
      messageCode: REVENUE_ERROR_CODES.NO_RECORDS_FOUND,
    };
  }

  // Compute summary metrics
  const paymentsReceived = revenueEligible.reduce((acc, b) => acc + b.paidAmount, 0);
  const discountsGiven = revenueEligible.reduce(
    (acc, b) => acc + (b.discountAmount || 0),
    0
  );
  const grossRevenue = paymentsReceived + discountsGiven;
  const refundedAmount = refundEligible.reduce(
    (acc, b) => acc + (b.refundedAmount || 0),
    0
  );
  const netSales = paymentsReceived - refundedAmount;
  // BR-114: commission is computed on the amount actually received, matching the backend's
  // calculation basis (the payment transaction amount), not on the pre-discount gross figure.
  const platformCommission = Math.round(
    paymentsReceived * (DEMO_PLATFORM_COMMISSION_RATE / 100)
  );
  const netAmount = netSales - platformCommission;
  const totalBookings = revenueEligible.length;
  const totalParticipants = revenueEligible.reduce(
    (acc, b) => acc + b.participantsCount,
    0
  );

  const summary: RevenueSummaryDto = {
    grossRevenue,
    paymentsReceived,
    discountsGiven,
    platformCommission,
    netAmount,
    netSales,
    totalBookings,
    totalParticipants,
    refundedAmount,
    commissionRatePercent: DEMO_PLATFORM_COMMISSION_RATE,
  };

  // Generate chart data
  const chartData = aggregateChartData(
    revenueEligible,
    refundEligible,
    filters.granularity,
    DEMO_PLATFORM_COMMISSION_RATE
  );

  // Aggregate by tour package for detail table
  const tourMap = new Map<string, TourRevenueDetailItem>();
  for (const tour of ownedTours) {
    if (filters.tourId && filters.tourId !== 'all' && tour.id !== filters.tourId) {
      continue;
    }
    tourMap.set(tour.id, {
      tourId: tour.id,
      tourCode: tour.tourCode,
      tourName: tour.title,
      bookingsCount: 0,
      participantsCount: 0,
      grossRevenue: 0,
      refundedAmount: 0,
      commission: 0,
      netAmount: 0,
    });
  }

  for (const b of revenueEligible) {
    const item = tourMap.get(b.tourId);
    if (item) {
      item.bookingsCount += 1;
      item.participantsCount += b.participantsCount;
      item.grossRevenue += b.paidAmount;
    }
  }

  for (const r of refundEligible) {
    const item = tourMap.get(r.tourId);
    if (item) {
      item.refundedAmount += r.refundedAmount || 0;
    }
  }

  // Compute commission and net for each tour
  for (const item of tourMap.values()) {
    item.commission = Math.round(
      item.grossRevenue * (DEMO_PLATFORM_COMMISSION_RATE / 100)
    );
    item.netAmount = item.grossRevenue - item.commission - item.refundedAmount;
  }

  const allTourDetails = Array.from(tourMap.values()).filter(
    (t) => t.grossRevenue > 0 || t.refundedAmount > 0
  );
  const totalToursCount = allTourDetails.length;
  const totalPages = Math.max(1, Math.ceil(totalToursCount / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedTourDetails = allTourDetails.slice(
    startIndex,
    startIndex + pageSize
  );

  return {
    summary,
    chartData,
    tourDetails: paginatedTourDetails,
    totalToursCount,
    page,
    pageSize,
    totalPages,
    appliedFilters: filters,
    messageCode: REVENUE_ERROR_CODES.SUCCESS,
  };
}

/**
 * Creates an export request (UC-45). Returns the created export record, whose `status` tells
 * the caller whether the file is already Ready (synchronous) or Queued for the worker.
 */
export async function createRevenueExport(
  payload: ExportRevenuePayload,
  options: OperatorRevenueServiceOptions = {}
): Promise<CreateRevenueExportResult> {
  const isDemoActive = Boolean(options.isDemo && isFinanceDemoAllowedInCurrentEnv());
  if (isDemoActive) {
    // Demo mode has no real file-generation backend to call, and production integrity rules
    // forbid fabricating a file or relabeling bytes as .xlsx. Demo mode previews figures only.
    return {
      success: false,
      message: REVENUE_MESSAGES.PENDING_BE_INTEGRATION,
      messageCode: REVENUE_ERROR_CODES.PENDING_BE_INTEGRATION,
    };
  }

  try {
    const response = await fetch('/api/operator/revenue/exports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        startDate: payload.appliedFilters.startDate,
        endDate: payload.appliedFilters.endDate,
        granularity: payload.appliedFilters.granularity,
        tourId:
          payload.appliedFilters.tourId && payload.appliedFilters.tourId !== 'all'
            ? Number(payload.appliedFilters.tourId)
            : undefined,
        format: payload.format,
        scope: payload.scope,
      }),
    });
    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const code = errorCodeFrom(body) ?? REVENUE_ERROR_CODES.SYSTEM_FAILURE;
      return { success: false, message: messageForCode(code), messageCode: code };
    }

    const record = body as RevenueExportRecord;
    return {
      success: true,
      record,
      message: record.status === 'Ready' ? REVENUE_MESSAGES.MSG116 : undefined,
      messageCode: record.status === 'Ready' ? REVENUE_ERROR_CODES.EXPORT_SUCCESS : undefined,
    };
  } catch {
    return {
      success: false,
      message: REVENUE_MESSAGES.MSG127,
      messageCode: REVENUE_ERROR_CODES.SYSTEM_FAILURE,
    };
  }
}

/** Returns the caller's export history (UC-45), newest first. */
export async function getRevenueExportHistory(
  options: OperatorRevenueServiceOptions = {},
  pagination: { page?: number; pageSize?: number } = {}
): Promise<RevenueExportHistoryResult> {
  const page = pagination.page ?? 1;
  const pageSize = pagination.pageSize ?? REVENUE_DEFAULT_PAGE_SIZE;
  const isDemoActive = Boolean(options.isDemo && isFinanceDemoAllowedInCurrentEnv());
  if (isDemoActive) {
    return { items: [], totalCount: 0, page, pageSize, totalPages: 0 };
  }

  try {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    const response = await fetch(`/api/operator/revenue/exports?${params.toString()}`, {
      cache: 'no-store',
    });
    const body: unknown = await response.json().catch(() => null);

    if (!response.ok || !body || !isRevenueExportHistoryShape(body)) {
      return {
        items: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 0,
        errorMessage: REVENUE_MESSAGES.MSG127,
        messageCode: REVENUE_ERROR_CODES.SYSTEM_FAILURE,
      };
    }

    return body;
  } catch {
    return {
      items: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 0,
      errorMessage: REVENUE_MESSAGES.MSG127,
      messageCode: REVENUE_ERROR_CODES.SYSTEM_FAILURE,
    };
  }
}

/**
 * Downloads a Ready export (UC-45). Fetches the file as a Blob first so a failure never
 * navigates the browser away from the app; only a confirmed 200 response triggers a save.
 */
export async function downloadRevenueExport(
  exportId: number,
  fileName: string
): Promise<DownloadRevenueExportResult> {
  try {
    const response = await fetch(`/api/operator/revenue/exports/${exportId}/download`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const code = errorCodeFrom(body) ?? REVENUE_ERROR_CODES.DOWNLOAD_INTERRUPTED;
      return { success: false, message: messageForCode(code), messageCode: code };
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch {
    return {
      success: false,
      message: REVENUE_MESSAGES.MSG106,
      messageCode: REVENUE_ERROR_CODES.DOWNLOAD_INTERRUPTED,
    };
  }
}

function isRevenueExportHistoryShape(body: unknown): body is RevenueExportHistoryResult {
  return (
    !!body &&
    typeof body === 'object' &&
    'items' in body &&
    Array.isArray((body as { items: unknown }).items)
  );
}

function errorCodeFrom(body: unknown): string | null {
  if (body && typeof body === 'object' && 'errorCode' in body && typeof body.errorCode === 'string') {
    return body.errorCode;
  }
  return null;
}

function messageForCode(code: string): string {
  return (REVENUE_MESSAGES as Record<string, string>)[code] ?? REVENUE_MESSAGES.MSG127;
}
