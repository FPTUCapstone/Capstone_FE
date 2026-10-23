import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tripReviewEn } from '../resources/en';
import { getTripById, isTripDemoAllowedInCurrentEnv } from './tripHistoryApi';

function setNodeEnv(val?: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = val;
}

describe('tripHistoryApi legacy review lookup (TRIP-7, TRIP-8)', () => {
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

  describe('getTripById against the BFF (legacy review page)', () => {
    it('getTripById differentiates verified 501 PENDING_BE_INTEGRATION, 404 null (TRIP_NOT_FOUND), 401/403 access denied, and network failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 501,
        ok: false,
        json: async () => ({
          status: 501,
          errorCode: 'PENDING_BE_INTEGRATION',
          detail: tripReviewEn.bff.tripHistoryPendingDetail,
        }),
      });
      await expect(getTripById('trip-1', { allowDemo: false })).rejects.toMatchObject({
        name: 'TripApiError',
        statusCode: 501,
        message: tripReviewEn.bff.tripHistoryPendingDetail,
        details: { errorCode: 'PENDING_BE_INTEGRATION' },
      });

      global.fetch = vi.fn().mockResolvedValue({ status: 404, ok: false });
      const nullTrip = await getTripById('missing-trip', { allowDemo: false });
      expect(nullTrip).toBeNull();

      global.fetch = vi.fn().mockResolvedValue({ status: 401, ok: false });
      await expect(getTripById('unauth-trip', { allowDemo: false })).rejects.toMatchObject({
        statusCode: 401,
        message: tripReviewEn.errors.tripDetailAccessDenied,
        details: { errorCode: 'MSG126' },
      });

      global.fetch = vi.fn().mockResolvedValue({ status: 403, ok: false });
      await expect(getTripById('forbidden-trip', { allowDemo: false })).rejects.toMatchObject({
        statusCode: 403,
        message: tripReviewEn.errors.tripDetailAccessDenied,
        details: { errorCode: 'MSG126' },
      });

      global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));
      await expect(getTripById('network-fail', { allowDemo: false })).rejects.toMatchObject({
        statusCode: 0,
        message: tripReviewEn.errors.systemError,
        details: { errorCode: 'MSG127' },
      });
    });
  });

  describe('getTripById demo fixtures (legacy review page)', () => {
    beforeEach(() => {
      setNodeEnv('test');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
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
