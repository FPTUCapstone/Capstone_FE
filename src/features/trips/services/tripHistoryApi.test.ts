import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getTripById,
  getTripHistory,
  isTripDemoAllowedInCurrentEnv,
} from './tripHistoryApi';

function setNodeEnv(val?: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = val;
}

describe('tripHistoryApi Service (TRIP-5, TRIP-7, TRIP-8)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('isTripDemoAllowedInCurrentEnv (TRIP-8)', () => {
    it('returns true when non-production AND NEXT_PUBLIC_ENABLE_DEMO_FIXTURES is true', () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
      expect(isTripDemoAllowedInCurrentEnv()).toBe(true);
    });

    it('returns false in production even if NEXT_PUBLIC_ENABLE_DEMO_FIXTURES is true', () => {
      setNodeEnv('production');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
      expect(isTripDemoAllowedInCurrentEnv()).toBe(false);
    });

    it('returns false when NEXT_PUBLIC_ENABLE_DEMO_FIXTURES is not true', () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'false';
      expect(isTripDemoAllowedInCurrentEnv()).toBe(false);
    });
  });

  describe('Real-mode truthfulness (TRIP-7)', () => {
    it('returns PENDING_BE_INTEGRATION and zero trips in real mode when backend returns 404 or 501', async () => {
      // Mock fetch returning 404 (endpoint not implemented)
      global.fetch = vi.fn().mockResolvedValue({
        status: 404,
        ok: false,
      });

      const result = await getTripHistory({ tab: 'Completed' }, { allowDemo: false });
      expect(result.status).toBe('PENDING_BE_INTEGRATION');
      expect(result.trips).toHaveLength(0);
      expect(result.message).toContain('chờ kích hoạt dịch vụ máy chủ');

      // Mock fetch returning 501 Not Implemented
      global.fetch = vi.fn().mockResolvedValue({
        status: 501,
        ok: false,
      });

      const result501 = await getTripHistory({ tab: 'Completed' }, { allowDemo: false });
      expect(result501.status).toBe('PENDING_BE_INTEGRATION');
      expect(result501.trips).toHaveLength(0);
    });

    it('throws TripApiError (MSG127) when server returns 502 or 503', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 502,
        ok: false,
        json: async () => ({}),
      });

      await expect(
        getTripHistory({ tab: 'Completed' }, { allowDemo: false })
      ).rejects.toThrow(/MSG127/i);

      global.fetch = vi.fn().mockResolvedValue({
        status: 503,
        ok: false,
        json: async () => ({}),
      });

      await expect(
        getTripHistory({ tab: 'Completed' }, { allowDemo: false })
      ).rejects.toThrow(/MSG127/i);
    });

    it('standardizes HTTP 500 with ProblemDetails title to MSG127 and does NOT leak raw server title', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 500,
        ok: false,
        json: async () => ({ title: 'Internal Server Error' }),
      });

      try {
        await getTripHistory({ tab: 'Completed' }, { allowDemo: false });
        expect.fail('Should have thrown TripApiError');
      } catch (err: unknown) {
        expect((err as Error).message).not.toContain('Internal Server Error');
        expect((err as Error).message).toContain('MSG127');
      }
    });

    it('standardizes HTTP 503 with arbitrary ProblemDetails title to MSG127', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 503,
        ok: false,
        json: async () => ({ title: 'Service Unavailable', detail: 'Upstream gateway down' }),
      });

      try {
        await getTripHistory({ tab: 'Completed' }, { allowDemo: false });
        expect.fail('Should have thrown TripApiError');
      } catch (err: unknown) {
        expect((err as Error).message).not.toContain('Service Unavailable');
        expect((err as Error).message).toContain('MSG127');
      }
    });

    it('throws TripApiError (MSG127) when fetch throws a network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        getTripHistory({ tab: 'Completed' }, { allowDemo: false })
      ).rejects.toThrow(/MSG127/i);
    });

    it('getTripById returns null for 404, throws MSG126 for 403, and throws MSG127 on network failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({ status: 404, ok: false });
      const nullTrip = await getTripById('missing-trip', { allowDemo: false });
      expect(nullTrip).toBeNull();

      global.fetch = vi.fn().mockResolvedValue({ status: 403, ok: false });
      await expect(getTripById('forbidden-trip', { allowDemo: false })).rejects.toThrow(/MSG126/i);

      global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));
      await expect(getTripById('network-fail', { allowDemo: false })).rejects.toThrow(/MSG127/i);
    });
  });

  describe('Demo fixtures filtering (TRIP-5)', () => {
    beforeEach(() => {
      setNodeEnv('test');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
    });

    it('retrieves completed trips with summary banner in demo mode', async () => {
      const result = await getTripHistory({ tab: 'Completed' }, { allowDemo: true });
      expect(result.status).toBe('SUCCESS');
      expect(result.isDemo).toBe(true);
      expect(result.trips.length).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
      expect(result.summary?.totalCompletedTrips).toBe(3);
    });

    it('filters trips by tab correctly', async () => {
      const cancelledResult = await getTripHistory({ tab: 'Cancelled' }, { allowDemo: true });
      expect(cancelledResult.trips.every((t) => t.status === 'Cancelled')).toBe(true);

      const upcomingResult = await getTripHistory({ tab: 'Upcoming' }, { allowDemo: true });
      expect(upcomingResult.trips.every((t) => t.status === 'Upcoming')).toBe(true);
    });

    it('filters trips by tripType', async () => {
      const tourResult = await getTripHistory(
        { tab: 'Completed', tripType: 'TourBooking' },
        { allowDemo: true }
      );
      expect(tourResult.trips.every((t) => t.tripType === 'TourBooking')).toBe(true);

      const itinResult = await getTripHistory(
        { tab: 'Completed', tripType: 'SelfPlannedItinerary' },
        { allowDemo: true }
      );
      expect(itinResult.trips.every((t) => t.tripType === 'SelfPlannedItinerary')).toBe(true);
    });

    it('filters trips by search query across title, operator, or booking code', async () => {
      const searchResult = await getTripHistory(
        { tab: 'Completed', searchQuery: 'Hội An' },
        { allowDemo: true }
      );
      expect(searchResult.trips.length).toBeGreaterThan(0);
      expect(
        searchResult.trips.every(
          (t) =>
            t.title.includes('Hội An') ||
            t.operatorName?.includes('Hội An') ||
            t.stopsSummary?.some((s) => s.includes('Hội An'))
        )
      ).toBe(true);
    });

    it('retrieves trip by id in demo mode', async () => {
      const trip = await getTripById('trip-demo-itinerary-01', { allowDemo: true });
      expect(trip).not.toBeNull();
      expect(trip?.tripId).toBe('trip-demo-itinerary-01');
      expect(trip?.title).toContain('Đà Nẵng');
    });

    it('returns null for non-existent trip id in demo mode', async () => {
      const trip = await getTripById('non-existent-id', { allowDemo: true });
      expect(trip).toBeNull();
    });

    it('implements CR-01 pagination with canonical default pageSize 20 and calculates totalCount', async () => {
      const pageResult = await getTripHistory({ tab: 'Completed', page: 1, pageSize: 2 }, { allowDemo: true });
      expect(pageResult.status).toBe('SUCCESS');
      expect(pageResult.trips.length).toBeLessThanOrEqual(2);
      expect(pageResult.totalCount).toBe(4);
      expect(pageResult.page).toBe(1);
      expect(pageResult.pageSize).toBe(2);

      const defaultSizeResult = await getTripHistory({ tab: 'Completed' }, { allowDemo: true });
      expect(defaultSizeResult.pageSize).toBe(20);
      expect(defaultSizeResult.page).toBe(1);
    });

    it('filters trips by date range using Asia/Ho_Chi_Minh boundary (toDate end-of-day)', async () => {
      // Completed demo trips departure dates: 2026-05-24, 2026-04-15, 2026-08-28, 2026-07-15
      const rangeResult = await getTripHistory(
        { tab: 'Completed', fromDate: '2026-04-01', toDate: '2026-05-24' },
        { allowDemo: true }
      );
      expect(rangeResult.trips.length).toBe(2); // April 15 and May 24 trips included
    });
  });
});
