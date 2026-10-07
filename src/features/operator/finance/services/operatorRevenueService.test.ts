import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  exportOperatorRevenueReport,
  getOperatorRevenueReport,
  getOperatorRevenueTours,
} from './operatorRevenueService';
import {
  REVENUE_ERROR_CODES,
  REVENUE_MESSAGES,
  type RevenueExportFormat,
} from '../types/revenueLifecycle';

describe('operatorRevenueService (UC-44 & UC-45)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      NEXT_PUBLIC_ENABLE_DEMO_FIXTURES: 'true',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('UC-44 View Revenue Report - Production NO_BACKEND Truthfulness', () => {
    it('returns empty figures and PENDING_BE_INTEGRATION notice when isDemo is false', async () => {
      const result = await getOperatorRevenueReport(
        {
          startDate: '2026-09-01',
          endDate: '2026-09-30',
          granularity: 'monthly',
        },
        { isDemo: false }
      );

      expect(result.summary.grossRevenue).toBe(0);
      expect(result.summary.platformCommission).toBe(0);
      expect(result.summary.netAmount).toBe(0);
      expect(result.summary.totalBookings).toBe(0);
      expect(result.summary.totalParticipants).toBe(0);
      expect(result.summary.refundedAmount).toBe(0);
      expect(result.chartData).toEqual([]);
      expect(result.tourDetails).toEqual([]);
      expect(result.pendingBackendNotice).toBe(
        REVENUE_MESSAGES.PENDING_BE_INTEGRATION
      );
      expect(result.messageCode).toBe(
        REVENUE_ERROR_CODES.PENDING_BE_INTEGRATION
      );
    });

    it('returns empty tour list for filter dropdown when isDemo is false', async () => {
      const tours = await getOperatorRevenueTours({ isDemo: false });
      expect(tours).toEqual([]);
    });
  });

  describe('UC-44 View Revenue Report - Demo Mode Calculations & Isolation', () => {
    it('fails closed with MSG126 when demoActorUserId is missing in Demo mode (BR-105)', async () => {
      const result = await getOperatorRevenueReport(
        {
          startDate: '2026-09-01',
          endDate: '2026-09-30',
          granularity: 'monthly',
        },
        { isDemo: true }
      );

      expect(result.errorMessage).toBe(REVENUE_MESSAGES.MSG126);
      expect(result.messageCode).toBe(REVENUE_ERROR_CODES.UNAUTHORIZED);
      expect(result.summary.grossRevenue).toBe(0);
    });

    it('enforces BR-105: returns only owned tour packages for actor 101', async () => {
      const tours = await getOperatorRevenueTours({
        isDemo: true,
        demoActorUserId: 101,
      });

      expect(tours.length).toBe(3);
      expect(tours.every((t) => t.operatorUserId === 101)).toBe(true);
      expect(tours.some((t) => t.operatorUserId === 202)).toBe(false);
    });

    it('enforces BR-105: returns only owned tour packages for foreign actor 202', async () => {
      const tours = await getOperatorRevenueTours({
        isDemo: true,
        demoActorUserId: 202,
      });

      expect(tours.length).toBe(2);
      expect(tours.every((t) => t.operatorUserId === 202)).toBe(true);
    });

    it('calculates gross revenue, commission, refunds, and net amount accurately for operator 101 in September 2026', async () => {
      const result = await getOperatorRevenueReport(
        {
          startDate: '2026-09-01',
          endDate: '2026-09-30',
          granularity: 'monthly',
        },
        { isDemo: true, demoActorUserId: 101 }
      );

      // Bookings in September for Operator 101:
      // Confirmed bk-0141: 5,600,000 (4 pax)
      // Confirmed bk-0148: 2,800,000 (2 pax)
      // Completed bk-0142: 3,500,000 (5 pax)
      // Completed bk-0143: 2,100,000 (3 pax)
      // Total Gross = 14,000,000
      // Total Bookings = 4, Total Pax = 14
      // Refund in Sept: bk-0110 refunded 1,400,000 on 2026-09-06
      // Commission (10%) = 1,400,000
      // Net = Gross (14,000,000) - Commission (1,400,000) - Refund (1,400,000) = 11,200,000
      expect(result.summary.grossRevenue).toBe(14000000);
      expect(result.summary.totalBookings).toBe(4);
      expect(result.summary.totalParticipants).toBe(14);
      expect(result.summary.refundedAmount).toBe(1400000);
      expect(result.summary.platformCommission).toBe(1400000);
      expect(result.summary.netAmount).toBe(11200000);
      expect(result.summary.commissionRatePercent).toBe(10);
      expect(result.messageCode).toBe(REVENUE_ERROR_CODES.SUCCESS);

      // Foreign operator 202 bookings must NOT be included!
      expect(result.summary.grossRevenue).not.toBe(62000000);
    });

    it('enforces BR-109: PendingPayment and unverified bookings are excluded from revenue', async () => {
      const result = await getOperatorRevenueReport(
        {
          startDate: '2026-09-01',
          endDate: '2026-09-30',
          granularity: 'monthly',
        },
        { isDemo: true, demoActorUserId: 101 }
      );

      // bk-0146 is PendingPayment (1,400,000) - should NOT be included in grossRevenue
      // bk-0099 is Cancelled unpaid (700,000) - should NOT be included
      expect(result.summary.grossRevenue).toBe(14000000);
    });

    it('filters report by specific tour package when tourId is provided', async () => {
      const result = await getOperatorRevenueReport(
        {
          startDate: '2026-09-01',
          endDate: '2026-09-30',
          granularity: 'monthly',
          tourId: 'tour-142',
        },
        { isDemo: true, demoActorUserId: 101 }
      );

      // Only tour-142 in Sept:
      // bk-0141 (5,600,000) + bk-0148 (2,800,000) = 8,400,000 gross
      // bk-0110 refund = 1,400,000
      // Commission = 840,000
      // Net = 8,400,000 - 840,000 - 1,400,000 = 6,160,000
      expect(result.summary.grossRevenue).toBe(8400000);
      expect(result.summary.totalBookings).toBe(2);
      expect(result.summary.refundedAmount).toBe(1400000);
      expect(result.summary.platformCommission).toBe(840000);
      expect(result.summary.netAmount).toBe(6160000);
      expect(result.tourDetails.length).toBe(1);
      expect(result.tourDetails[0].tourId).toBe('tour-142');
    });

    it('validates date range: returns MSG29 when startDate is after endDate', async () => {
      const result = await getOperatorRevenueReport(
        {
          startDate: '2026-09-30',
          endDate: '2026-09-01',
          granularity: 'monthly',
        },
        { isDemo: true, demoActorUserId: 101 }
      );

      expect(result.errorMessage).toBe(REVENUE_MESSAGES.MSG29);
      expect(result.messageCode).toBe(REVENUE_ERROR_CODES.INVALID_PERIOD_RANGE);
      expect(result.summary.grossRevenue).toBe(0);
    });

    it('returns zeroed summary and MSG128 notice when no bookings exist in period (5.a1)', async () => {
      const result = await getOperatorRevenueReport(
        {
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          granularity: 'monthly',
        },
        { isDemo: true, demoActorUserId: 101 }
      );

      expect(result.errorMessage).toBe(REVENUE_MESSAGES.MSG128);
      expect(result.messageCode).toBe(REVENUE_ERROR_CODES.NO_RECORDS_FOUND);
      expect(result.summary.grossRevenue).toBe(0);
      expect(result.summary.totalBookings).toBe(0);
      expect(result.chartData).toEqual([]);
      expect(result.tourDetails).toEqual([]);
    });

    it('paginates tour detail breakdown according to CR-01 (default 20/page)', async () => {
      const result = await getOperatorRevenueReport(
        {
          startDate: '2026-09-01',
          endDate: '2026-09-30',
          granularity: 'monthly',
        },
        { isDemo: true, demoActorUserId: 101 },
        { page: 1, pageSize: 2 }
      );

      expect(result.pageSize).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalToursCount).toBe(3);
      expect(result.totalPages).toBe(2);
      expect(result.tourDetails.length).toBe(2);
    });

    it('generates chart data aggregated by daily, weekly, and monthly granularities', async () => {
      const dailyRes = await getOperatorRevenueReport(
        {
          startDate: '2026-09-01',
          endDate: '2026-09-30',
          granularity: 'daily',
        },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(dailyRes.chartData.length).toBeGreaterThan(1);

      const monthlyRes = await getOperatorRevenueReport(
        {
          startDate: '2026-08-01',
          endDate: '2026-09-30',
          granularity: 'monthly',
        },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(monthlyRes.chartData.length).toBe(2); // August and September
      expect(monthlyRes.chartData.map((p) => p.periodKey)).toEqual([
        '2026-08',
        '2026-09',
      ]);
    });
  });

  describe('UC-45 Export Revenue Report', () => {
    it('disallows export in production mode without backend', async () => {
      const res = await exportOperatorRevenueReport(
        {
          format: 'csv',
          scope: 'summary',
          appliedFilters: {
            startDate: '2026-09-01',
            endDate: '2026-09-30',
            granularity: 'monthly',
          },
        },
        { isDemo: false }
      );

      expect(res.success).toBe(false);
      expect(res.message).toBe(REVENUE_MESSAGES.PENDING_BE_INTEGRATION);
      expect(res.fileContent).toBeUndefined();
    });

    it('requires export format (MSG01)', async () => {
      const res = await exportOperatorRevenueReport(
        {
          format: '' as unknown as RevenueExportFormat,
          scope: 'summary',
          appliedFilters: {
            startDate: '2026-09-01',
            endDate: '2026-09-30',
            granularity: 'monthly',
          },
        },
        { isDemo: true, demoActorUserId: 101 }
      );

      expect(res.success).toBe(false);
      expect(res.message).toBe(REVENUE_MESSAGES.MSG01);
    });

    it('rejects export when no records exist for applied filters (MSG128)', async () => {
      const res = await exportOperatorRevenueReport(
        {
          format: 'csv',
          scope: 'summary',
          appliedFilters: {
            startDate: '2025-01-01',
            endDate: '2025-01-31',
            granularity: 'monthly',
          },
        },
        { isDemo: true, demoActorUserId: 101 }
      );

      expect(res.success).toBe(false);
      expect(res.message).toBe(REVENUE_MESSAGES.MSG128);
    });

    it('generates demo file with DEMO watermark and applied filter summary', async () => {
      const res = await exportOperatorRevenueReport(
        {
          format: 'csv',
          scope: 'summary_and_details',
          appliedFilters: {
            startDate: '2026-09-01',
            endDate: '2026-09-30',
            granularity: 'monthly',
          },
        },
        { isDemo: true, demoActorUserId: 101 }
      );

      expect(res.success).toBe(true);
      expect(res.fileName).toContain('TripMate_DEMO_Revenue_Report_');
      expect(res.fileName).toContain('.csv');
      expect(res.fileContent).toContain('DEMO MODE');
      expect(res.fileContent).toContain('Gross Revenue,14000000');
      expect(res.fileContent).toContain('Net Amount,11200000');
      expect(res.fileContent).toContain('--- TOUR PACKAGE DETAILS ---');
      expect(res.fileContent).toContain('Ba Na Hills Full-Day Tour');
    });

    it('supports summary-only scope without itemized tour details', async () => {
      const res = await exportOperatorRevenueReport(
        {
          format: 'csv',
          scope: 'summary',
          appliedFilters: {
            startDate: '2026-09-01',
            endDate: '2026-09-30',
            granularity: 'monthly',
          },
        },
        { isDemo: true, demoActorUserId: 101 }
      );

      expect(res.success).toBe(true);
      expect(res.fileContent).toContain('Gross Revenue,14000000');
      expect(res.fileContent).not.toContain('--- TOUR PACKAGE DETAILS ---');
    });

    it('supports asynchronous export simulation for large reports', async () => {
      const res = await exportOperatorRevenueReport(
        {
          format: 'xlsx',
          scope: 'summary_and_details',
          appliedFilters: {
            startDate: '2026-09-01',
            endDate: '2026-09-30',
            granularity: 'monthly',
          },
        },
        { isDemo: true, demoActorUserId: 101 },
        true // simulateAsync
      );

      expect(res.success).toBe(true);
      expect(res.isAsyncQueued).toBe(true);
      expect(res.asyncStatus).toBe('queued');
      expect(res.messageCode).toBe('ASYNC_QUEUED');
    });
  });
});
