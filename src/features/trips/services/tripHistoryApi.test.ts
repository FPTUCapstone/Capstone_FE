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
    it('returns PENDING_BE_INTEGRATION and zero trips in real mode when backend is unavailable', async () => {
      // Mock fetch returning 404 (endpoint not implemented)
      global.fetch = vi.fn().mockResolvedValue({
        status: 404,
        ok: false,
      });

      const result = await getTripHistory({ tab: 'Completed' }, { allowDemo: false });
      expect(result.status).toBe('PENDING_BE_INTEGRATION');
      expect(result.trips).toHaveLength(0);
      expect(result.message).toContain('chờ kích hoạt dịch vụ máy chủ');
    });

    it('returns PENDING_BE_INTEGRATION when fetch throws a network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await getTripHistory({ tab: 'Completed' }, { allowDemo: false });
      expect(result.status).toBe('PENDING_BE_INTEGRATION');
      expect(result.trips).toHaveLength(0);
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
  });
});
