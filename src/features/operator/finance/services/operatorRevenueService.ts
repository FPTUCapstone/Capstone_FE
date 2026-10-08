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
import { financeEn } from '../resources/en';
import {
  REVENUE_DEFAULT_PAGE_SIZE,
  REVENUE_ERROR_CODES,
  REVENUE_MESSAGES,
  type ExportRevenuePayload,
  type ExportRevenueResult,
  type RevenueChartDataPoint,
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
  platformCommission: 0,
  netAmount: 0,
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
  if (!isDemoActive || !isValidActor(options.demoActorUserId)) {
    return [];
  }
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

  // Production NO_BACKEND truthfulness
  if (!isDemoActive) {
    return {
      summary: { ...ZERO_SUMMARY },
      chartData: [],
      tourDetails: [],
      totalToursCount: 0,
      page,
      pageSize,
      totalPages: 0,
      appliedFilters: filters,
      pendingBackendNotice: REVENUE_MESSAGES.PENDING_BE_INTEGRATION,
      messageCode: REVENUE_ERROR_CODES.PENDING_BE_INTEGRATION,
    };
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
  const grossRevenue = revenueEligible.reduce((acc, b) => acc + b.paidAmount, 0);
  const refundedAmount = refundEligible.reduce(
    (acc, b) => acc + (b.refundedAmount || 0),
    0
  );
  const platformCommission = Math.round(
    grossRevenue * (DEMO_PLATFORM_COMMISSION_RATE / 100)
  );
  const netAmount = grossRevenue - platformCommission - refundedAmount;
  const totalBookings = revenueEligible.length;
  const totalParticipants = revenueEligible.reduce(
    (acc, b) => acc + b.participantsCount,
    0
  );

  const summary: RevenueSummaryDto = {
    grossRevenue,
    platformCommission,
    netAmount,
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
 * Exports the Revenue Report (UC-45).
 */
export async function exportOperatorRevenueReport(
  payload: ExportRevenuePayload,
  options: OperatorRevenueServiceOptions = {},
  simulateAsync = false
): Promise<ExportRevenueResult> {
  const isDemoActive = Boolean(options.isDemo && isFinanceDemoAllowedInCurrentEnv());

  // Production NO_BACKEND truthfulness
  if (!isDemoActive) {
    return {
      success: false,
      message: REVENUE_MESSAGES.PENDING_BE_INTEGRATION,
      messageCode: REVENUE_ERROR_CODES.PENDING_BE_INTEGRATION,
    };
  }

  // Format validation (MSG01)
  if (!payload.format) {
    return {
      success: false,
      message: REVENUE_MESSAGES.MSG01,
      messageCode: REVENUE_ERROR_CODES.MISSING_REQUIRED_FIELD,
    };
  }

  // Never rename CSV bytes to .xlsx or .pdf: binary formats require backend integration
  if (payload.format !== 'csv') {
    return {
      success: false,
      message: REVENUE_MESSAGES.PENDING_BINARY_EXPORT_INTEGRATION,
      messageCode: REVENUE_ERROR_CODES.PENDING_BINARY_EXPORT_INTEGRATION,
    };
  }

  // Retrieve current report matching applied filters (BR-110)
  const report = await getOperatorRevenueReport(payload.appliedFilters, options, {
    pageSize: 1000,
  });

  // Zero-record validation (MSG128)
  if (
    report.summary.grossRevenue === 0 &&
    report.summary.totalBookings === 0 &&
    report.summary.refundedAmount === 0
  ) {
    return {
      success: false,
      message: REVENUE_MESSAGES.MSG128,
      messageCode: REVENUE_ERROR_CODES.NO_RECORDS_FOUND,
    };
  }

  // Demo UI simulation only: never claim a real background export job or notification
  if (simulateAsync) {
    return {
      success: false,
      isAsyncSimulated: true,
      isAsyncQueued: false,
      asyncStatus: 'demo_simulated',
      message: financeEn.exportDialog.asyncDesc,
      messageCode: REVENUE_ERROR_CODES.DEMO_ASYNC_EXPORT_SIMULATION,
    };
  }

  // Generate Demo downloadable CSV file content (.csv only)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `TripMate_DEMO_Revenue_Report_${timestamp}.csv`;

  const csvRows: string[] = [
    '# TRIPMATE REVENUE REPORT (DEMO MODE)',
    `# Applied Range: ${payload.appliedFilters.startDate} to ${payload.appliedFilters.endDate}`,
    `# Granularity: ${payload.appliedFilters.granularity}`,
    `# Tour Scope: ${payload.appliedFilters.tourId || 'all'}`,
    '',
    '--- SUMMARY METRICS ---',
    `Gross Revenue,${report.summary.grossRevenue}`,
    `Platform Commission,${report.summary.platformCommission}`,
    `Refunded Amount,${report.summary.refundedAmount}`,
    `Net Amount,${report.summary.netAmount}`,
    `Total Bookings,${report.summary.totalBookings}`,
    `Total Participants,${report.summary.totalParticipants}`,
  ];

  if (payload.scope === 'summary_and_details') {
    csvRows.push('', '--- TOUR PACKAGE DETAILS ---');
    csvRows.push(
      'Tour Code,Tour Name,Bookings,Participants,Gross Revenue,Refunded,Commission,Net Amount'
    );
    for (const t of report.tourDetails) {
      csvRows.push(
        `"${t.tourCode}","${t.tourName}",${t.bookingsCount},${t.participantsCount},${t.grossRevenue},${t.refundedAmount},${t.commission},${t.netAmount}`
      );
    }
  }

  const fileContent = csvRows.join('\n');

  return {
    success: true,
    fileName,
    fileContent,
    mimeType: 'text/csv;charset=utf-8',
    message: REVENUE_MESSAGES.MSG116,
    messageCode: REVENUE_ERROR_CODES.EXPORT_SUCCESS,
  };
}
