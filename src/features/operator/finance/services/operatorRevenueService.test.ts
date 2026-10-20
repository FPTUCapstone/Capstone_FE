import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  createRevenueExport,
  downloadRevenueExport,
  getOperatorRevenueReport,
  getOperatorRevenueTours,
  getRevenueExportHistory,
} from './operatorRevenueService';
import {
  REVENUE_ERROR_CODES,
  REVENUE_MESSAGES,
} from '../types/revenueLifecycle';
import { financeEn } from '../resources/en';

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
    vi.unstubAllGlobals();
  });

  describe('UC-44 View Revenue Report - Production NO_BACKEND Truthfulness', () => {
    it('discloses the unresolved SRS formula conflict without claiming business approval', () => {
      expect(financeEn.revenue.formulaDecisionStatus).toBe(
        'SRS_FINANCIAL_FORMULA_DECISION_PENDING'
      );
      expect(financeEn.revenue.demoNoticeDesc).toMatch(/non-authoritative/i);
    });
    it('uses the production report endpoint when isDemo is false', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({
          summary: { grossRevenue: 10000, platformCommission: 1000, netAmount: 9000, totalBookings: 1, totalParticipants: 1, refundedAmount: 0, commissionRatePercent: 10 },
          chartData: [], tourDetails: [], totalToursCount: 1, page: 1, pageSize: 20, totalPages: 1,
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );
      vi.stubGlobal('fetch', fetchMock);
      const result = await getOperatorRevenueReport(
        {
          startDate: '2026-09-01',
          endDate: '2026-09-30',
          granularity: 'monthly',
        },
        { isDemo: false }
      );

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/operator/revenue/report?startDate=2026-09-01'),
        { cache: 'no-store' }
      );
      expect(result.summary.grossRevenue).toBe(10000);
      expect(result.summary.platformCommission).toBe(1000);
      expect(result.summary.netAmount).toBe(9000);
      expect(result.summary.totalBookings).toBe(1);
      expect(result.summary.totalParticipants).toBe(1);
      expect(result.summary.refundedAmount).toBe(0);
      expect(result.chartData).toEqual([]);
      expect(result.tourDetails).toEqual([]);
      expect(result.pendingBackendNotice).toBeUndefined();
      expect(result.messageCode).toBe(REVENUE_ERROR_CODES.SUCCESS);
    });

    it('uses the production tour filter endpoint when isDemo is false', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify([{ id: 7, code: 'TOUR-007', title: 'API tour', isActive: true }]), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        })
      );
      vi.stubGlobal('fetch', fetchMock);
      const tours = await getOperatorRevenueTours({ isDemo: false });
      expect(fetchMock).toHaveBeenCalledWith('/api/operator/revenue/tours', { cache: 'no-store' });
      expect(tours).toEqual([{ id: '7', tourCode: 'TOUR-007', title: 'API tour', operatorUserId: 0 }]);
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

      // Settlement breakdown (SRS §3.8.5.1): no discounts in these fixtures, so Payments
      // Received equals Gross Revenue and Net Sales is Payments Received minus the refund.
      expect(result.summary.paymentsReceived).toBe(14000000);
      expect(result.summary.discountsGiven).toBe(0);
      expect(result.summary.netSales).toBe(12600000);

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

    it('computes the settlement breakdown when a booking carries a coupon discount', async () => {
      const result = await getOperatorRevenueReport(
        {
          startDate: '2026-08-01',
          endDate: '2026-08-31',
          granularity: 'monthly',
          tourId: 'tour-142',
        },
        { isDemo: true, demoActorUserId: 101 }
      );

      // bk-0081 (August, tour-142): paidAmount 14,000,000, discount 600,000, no refund.
      // Gross Revenue = Payments Received + Discounts Given = 14,000,000 + 600,000 = 14,600,000
      // Net Sales = Payments Received - Refunds = 14,000,000 - 0 = 14,000,000
      // Commission (10%) is computed on Payments Received, not on the pre-discount gross.
      // Net Payout = Net Sales - Commission = 14,000,000 - 1,400,000 = 12,600,000
      expect(result.summary.paymentsReceived).toBe(14000000);
      expect(result.summary.discountsGiven).toBe(600000);
      expect(result.summary.grossRevenue).toBe(14600000);
      expect(result.summary.refundedAmount).toBe(0);
      expect(result.summary.netSales).toBe(14000000);
      expect(result.summary.platformCommission).toBe(1400000);
      expect(result.summary.netAmount).toBe(12600000);
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
    // In production, tour ids come from the real backend as numeric strings (e.g. "142"),
    // unlike the demo fixtures' "tour-142" format — createRevenueExport always calls the
    // production BFF, so the filter snapshot here must match that shape.
    const appliedFilters = {
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      granularity: 'monthly' as const,
      tourId: '142',
    };

    describe('createRevenueExport', () => {
      it('disallows export in demo mode (no fabricated file, no backend to call)', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        const res = await createRevenueExport(
          { format: 'xlsx', scope: 'summary', appliedFilters },
          { isDemo: true, demoActorUserId: 101 }
        );

        expect(res.success).toBe(false);
        expect(res.messageCode).toBe(REVENUE_ERROR_CODES.PENDING_BE_INTEGRATION);
        expect(fetchMock).not.toHaveBeenCalled();
      });

      it('posts the filter snapshot to the BFF and returns a Ready record with MSG116', async () => {
        const record = {
          id: 42,
          startDate: '2026-08-01',
          endDate: '2026-08-31',
          granularity: 'monthly',
          tourId: 142,
          format: 'xlsx',
          scope: 'summary',
          status: 'Ready',
          requestedAtUtc: '2026-10-20T03:00:00Z',
          fileName: 'tripmate-revenue-20260801-20260831-42.xlsx',
          downloadUrl: '/api/operator/revenue/exports/42/download',
        };
        const fetchMock = vi.fn().mockResolvedValue(
          new Response(JSON.stringify(record), { status: 201 })
        );
        vi.stubGlobal('fetch', fetchMock);

        const res = await createRevenueExport(
          { format: 'xlsx', scope: 'summary', appliedFilters },
          { isDemo: false }
        );

        expect(res.success).toBe(true);
        expect(res.record).toEqual(record);
        expect(res.messageCode).toBe(REVENUE_ERROR_CODES.EXPORT_SUCCESS);

        expect(fetchMock).toHaveBeenCalledWith(
          '/api/operator/revenue/exports',
          expect.objectContaining({ method: 'POST' })
        );
        const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(sentBody).toEqual({
          startDate: '2026-08-01',
          endDate: '2026-08-31',
          granularity: 'monthly',
          tourId: 142,
          format: 'xlsx',
          scope: 'summary',
        });
      });

      it('returns a Queued record without a success message code', async () => {
        const record = {
          id: 43, startDate: '2026-08-01', endDate: '2026-08-31', granularity: 'monthly',
          format: 'xlsx', scope: 'summary_and_details', status: 'Queued',
          requestedAtUtc: '2026-10-20T03:00:00Z',
        };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
          new Response(JSON.stringify(record), { status: 202 })
        ));

        const res = await createRevenueExport(
          { format: 'xlsx', scope: 'summary_and_details', appliedFilters },
          { isDemo: false }
        );

        expect(res.success).toBe(true);
        expect(res.record?.status).toBe('Queued');
        expect(res.message).toBeUndefined();
        expect(res.messageCode).toBeUndefined();
      });

      it('sends tourId undefined (not NaN) when the applied filter is "all"', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ id: 1, status: 'Ready' }), { status: 201 })
        );
        vi.stubGlobal('fetch', fetchMock);

        await createRevenueExport(
          { format: 'xlsx', scope: 'summary', appliedFilters: { ...appliedFilters, tourId: 'all' } },
          { isDemo: false }
        );

        const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(sentBody.tourId).toBeUndefined();
      });

      it('maps a backend MSG128 (no records) response through unchanged', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ errorCode: 'MSG128' }), { status: 422 })
        ));

        const res = await createRevenueExport(
          { format: 'xlsx', scope: 'summary', appliedFilters },
          { isDemo: false }
        );

        expect(res.success).toBe(false);
        expect(res.messageCode).toBe('MSG128');
        expect(res.message).toBe(REVENUE_MESSAGES.MSG128);
      });

      it('returns MSG127 when the BFF cannot be reached', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

        const res = await createRevenueExport(
          { format: 'xlsx', scope: 'summary', appliedFilters },
          { isDemo: false }
        );

        expect(res.success).toBe(false);
        expect(res.messageCode).toBe(REVENUE_ERROR_CODES.SYSTEM_FAILURE);
      });
    });

    describe('getRevenueExportHistory', () => {
      it('returns an empty page in demo mode without calling the BFF', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        const res = await getRevenueExportHistory({ isDemo: true, demoActorUserId: 101 });

        expect(res).toEqual({ items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 });
        expect(fetchMock).not.toHaveBeenCalled();
      });

      it('forwards pagination and returns the BFF history page', async () => {
        const historyBody = {
          items: [{ id: 1, status: 'Ready' }],
          totalCount: 1,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        };
        const fetchMock = vi.fn().mockResolvedValue(
          new Response(JSON.stringify(historyBody), { status: 200 })
        );
        vi.stubGlobal('fetch', fetchMock);

        const res = await getRevenueExportHistory({ isDemo: false }, { page: 2, pageSize: 10 });

        expect(res).toEqual(historyBody);
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/api/operator/revenue/exports?page=2&pageSize=10'),
          expect.anything()
        );
      });

      it('returns MSG127 when the history request fails', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

        const res = await getRevenueExportHistory({ isDemo: false });

        expect(res.items).toEqual([]);
        expect(res.messageCode).toBe(REVENUE_ERROR_CODES.SYSTEM_FAILURE);
      });
    });

    describe('downloadRevenueExport', () => {
      it('fetches the BFF download endpoint and triggers a Blob download on success', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
          new Response(new Blob(['fake-xlsx-bytes']), { status: 200 })
        );
        vi.stubGlobal('fetch', fetchMock);
        vi.stubGlobal('URL', {
          ...URL,
          createObjectURL: vi.fn(() => 'blob:fake'),
          revokeObjectURL: vi.fn(),
        });

        const res = await downloadRevenueExport(42, 'tripmate-revenue-20260801-20260831-42.xlsx');

        expect(res.success).toBe(true);
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/operator/revenue/exports/42/download',
          expect.anything()
        );
      });

      it('returns MSG106 without throwing when the download is interrupted', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ errorCode: 'MSG106' }), { status: 502 })
        ));

        const res = await downloadRevenueExport(42, 'file.xlsx');

        expect(res.success).toBe(false);
        expect(res.messageCode).toBe('MSG106');
        expect(res.message).toBe(REVENUE_MESSAGES.MSG106);
      });

      it('returns a safe not-found code for a foreign or missing export id', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ errorCode: 'revenue_export.not_found' }), { status: 404 })
        ));

        const res = await downloadRevenueExport(999, 'file.xlsx');

        expect(res.success).toBe(false);
        expect(res.messageCode).toBe('revenue_export.not_found');
      });
    });
  });
});
