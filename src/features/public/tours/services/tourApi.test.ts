import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getTourDetail,
  getTourRecommendations,
  isTourDemoAllowedInCurrentEnv,
  parsePagedTours,
  parseTourSearchItem,
  searchTours,
} from './tourApi';
import { TourApiError } from '../types/tour';

describe('tourApi service', () => {
  const originalFetch = globalThis.fetch;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDemoFlag = process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES;

  function setNodeEnv(val?: string) {
    (process.env as Record<string, string | undefined>).NODE_ENV = val;
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    setNodeEnv(originalNodeEnv);
    if (originalDemoFlag === undefined) {
      delete process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES;
    } else {
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = originalDemoFlag;
    }
  });

  describe('parsers', () => {
    it('parses valid TourSearchItemDto with non-null thumbnailUrl', () => {
      const raw = {
        tourId: '9007199254740995',
        title: 'Hội An Tour',
        destinations: ['Đà Nẵng', 'Hội An'],
        operatorName: 'Endpoint Travel',
        durationDays: 2,
        basePrice: 800000,
        currency: 'VND',
        representativeScheduleId: '9007199254740997',
        departureAtUtc: '2026-10-15T07:30:00Z',
        availabilityStatus: 'Available',
        remainingSlots: 11,
        thumbnailUrl: 'https://example.com/tour.jpg',
      };
      const parsed = parseTourSearchItem(raw);
      expect(parsed.tourId).toBe('9007199254740995');
      expect(parsed.destinations).toEqual(['Đà Nẵng', 'Hội An']);
      expect(parsed.remainingSlots).toBe(11);
      expect(parsed.thumbnailUrl).toBe('https://example.com/tour.jpg');
    });

    it('parses valid TourSearchItemDto with explicit null thumbnailUrl', () => {
      const raw = {
        tourId: '9007199254740995',
        title: 'Hội An Tour',
        destinations: ['Đà Nẵng', 'Hội An'],
        operatorName: 'Endpoint Travel',
        durationDays: 2,
        basePrice: 800000,
        currency: 'VND',
        representativeScheduleId: null,
        departureAtUtc: null,
        availabilityStatus: 'Available',
        remainingSlots: null,
        thumbnailUrl: null,
      };
      const parsed = parseTourSearchItem(raw);
      expect(parsed.thumbnailUrl).toBeNull();
    });

    it('rejects missing thumbnailUrl property (must not silently become null)', () => {
      const raw = {
        tourId: '9007199254740995',
        title: 'Hội An Tour',
        destinations: ['Đà Nẵng', 'Hội An'],
        operatorName: 'Endpoint Travel',
        durationDays: 2,
        basePrice: 800000,
        currency: 'VND',
        representativeScheduleId: null,
        departureAtUtc: null,
        availabilityStatus: 'Available',
        remainingSlots: null,
      };
      expect(() => parseTourSearchItem(raw)).toThrow(
        'Dữ liệu gói tour không hợp lệ.',
      );
    });

    it('rejects invalid thumbnailUrl types (must not silently become null)', () => {
      const base = {
        tourId: '9007199254740995',
        title: 'Hội An Tour',
        destinations: ['Đà Nẵng', 'Hội An'],
        operatorName: 'Endpoint Travel',
        durationDays: 2,
        basePrice: 800000,
        currency: 'VND',
        representativeScheduleId: null,
        departureAtUtc: null,
        availabilityStatus: 'Available',
        remainingSlots: null,
      };
      expect(() => parseTourSearchItem({ ...base, thumbnailUrl: 12345 })).toThrow(
        'Dữ liệu gói tour không hợp lệ.',
      );
      expect(() => parseTourSearchItem({ ...base, thumbnailUrl: true })).toThrow(
        'Dữ liệu gói tour không hợp lệ.',
      );
      expect(() =>
        parseTourSearchItem({
          ...base,
          thumbnailUrl: ['https://example.com/pic.jpg'],
        }),
      ).toThrow('Dữ liệu gói tour không hợp lệ.');
      expect(() =>
        parseTourSearchItem({
          ...base,
          thumbnailUrl: { url: 'https://example.com/pic.jpg' },
        }),
      ).toThrow('Dữ liệu gói tour không hợp lệ.');
    });

    it('rejects invalid item structure', () => {
      expect(() => parseTourSearchItem({ tourId: 123 })).toThrow(
        'Dữ liệu gói tour không hợp lệ.',
      );
    });

    it('parses valid PagedToursResponseDto', () => {
      const raw = {
        page: 1,
        pageSize: 20,
        totalCount: 1,
        totalPages: 1,
        asOfUtc: '2026-10-01T00:00:00Z',
        items: [
          {
            tourId: '9007199254740995',
            title: 'Hội An Tour',
            destinations: ['Hội An'],
            operatorName: 'Endpoint Travel',
            durationDays: 2,
            basePrice: 800000,
            currency: 'VND',
            representativeScheduleId: null,
            departureAtUtc: null,
            availabilityStatus: 'Available',
            remainingSlots: null,
            thumbnailUrl: null,
          },
        ],
      };
      const parsed = parsePagedTours(raw);
      expect(parsed.totalCount).toBe(1);
      expect(parsed.items).toHaveLength(1);
    });
  });

  describe('searchTours', () => {
    it('successfully fetches and parses tours from BFF', async () => {
      const mockData = {
        page: 1,
        pageSize: 20,
        totalCount: 1,
        totalPages: 1,
        asOfUtc: '2026-10-01T00:00:00Z',
        items: [
          {
            tourId: '9007199254740995',
            title: 'Hội An Tour',
            destinations: ['Hội An'],
            operatorName: 'Endpoint Travel',
            durationDays: 2,
            basePrice: 800000,
            currency: 'VND',
            representativeScheduleId: '9007199254740997',
            departureAtUtc: '2026-10-15T07:30:00Z',
            availabilityStatus: 'Available',
            remainingSlots: 11,
            thumbnailUrl: 'https://example.com/tour.jpg',
          },
        ],
      };

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const query = new URLSearchParams({ destination: 'Hội An' });
      const result = await searchTours(query);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].tourId).toBe('9007199254740995');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/tours?destination=H%E1%BB%99i+An',
        expect.objectContaining({ headers: { Accept: 'application/json' } }),
      );
    });

    it('throws TourApiError with problem details when BFF returns 400', async () => {
      const problem = {
        status: 400,
        title: 'Validation Failed',
        errors: { destination: ['Destination is too long'] },
      };

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(problem), {
          status: 400,
          headers: { 'Content-Type': 'application/problem+json' },
        }),
      );

      await expect(searchTours(new URLSearchParams())).rejects.toThrow(TourApiError);
    });

    it('handles network failure with a safe TourApiError', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(searchTours(new URLSearchParams())).rejects.toThrow(
        'Không thể kết nối máy chủ tour.',
      );
    });
  });

  describe('isTourDemoAllowedInCurrentEnv (Demo Gate Policy)', () => {
    it('returns false in production regardless of NEXT_PUBLIC_ENABLE_DEMO_FIXTURES value', () => {
      setNodeEnv('production');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
      expect(isTourDemoAllowedInCurrentEnv()).toBe(false);

      delete process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES;
      expect(isTourDemoAllowedInCurrentEnv()).toBe(false);
    });

    it('returns false in non-production when NEXT_PUBLIC_ENABLE_DEMO_FIXTURES is missing or false', () => {
      setNodeEnv('development');
      delete process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES;
      expect(isTourDemoAllowedInCurrentEnv()).toBe(false);

      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'false';
      expect(isTourDemoAllowedInCurrentEnv()).toBe(false);

      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = '1';
      expect(isTourDemoAllowedInCurrentEnv()).toBe(false);
    });

    it('returns true ONLY when NODE_ENV is not production and NEXT_PUBLIC_ENABLE_DEMO_FIXTURES is exact "true"', () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
      expect(isTourDemoAllowedInCurrentEnv()).toBe(true);

      setNodeEnv('test');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
      expect(isTourDemoAllowedInCurrentEnv()).toBe(true);
    });
  });

  describe('getTourRecommendations (UC-25 Governance & Demo Lockdown)', () => {
    it('returns empty array with isPendingBe: true in production mode without silent fake data', async () => {
      const res = await getTourRecommendations();
      expect(res.isPendingBe).toBe(true);
      expect(res.isDemo).toBe(false);
      expect(res.items).toHaveLength(0);
    });

    it('DEMO-5: rejects allowDemo: true in production mode and returns pending state (NO fixtures)', async () => {
      setNodeEnv('production');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

      const res = await getTourRecommendations({ allowDemo: true });
      expect(res.isPendingBe).toBe(true);
      expect(res.isDemo).toBe(false);
      expect(res.items).toHaveLength(0);
    });

    it('returns empty array when allowDemo is true in development but flag is missing or false', async () => {
      setNodeEnv('development');
      delete process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES;

      const res = await getTourRecommendations({ allowDemo: true });
      expect(res.isPendingBe).toBe(true);
      expect(res.isDemo).toBe(false);
      expect(res.items).toHaveLength(0);
    });

    it('DEMO-7: returns demo fixtures when non-production, flag is true, and allowDemo is true', async () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

      const res = await getTourRecommendations({ allowDemo: true });
      expect(res.isPendingBe).toBe(false);
      expect(res.isDemo).toBe(true);
      expect(res.items.length).toBeGreaterThan(0);
      expect(res.items[0].matchingScore).toBeGreaterThanOrEqual(80);
    });
  });

  describe('getTourDetail (UC-26 Governance & Demo Lockdown)', () => {
    it('throws 501 PENDING_BE_INTEGRATION error in production mode when BE endpoint does not exist', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: 404, title: 'Not Found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/problem+json' },
        }),
      );

      await expect(getTourDetail('9007199254740995')).rejects.toThrow(
        'Chi tiết tour đang chờ hoàn tất kết nối API từ máy chủ (UC-26 — PENDING_BE_INTEGRATION).',
      );
    });

    it('DEMO-6: rejects allowDemo: true in production mode and throws 501 PENDING_BE_INTEGRATION without returning fixture', async () => {
      setNodeEnv('production');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: 404, title: 'Not Found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/problem+json' },
        }),
      );

      await expect(getTourDetail('9007199254740995', { allowDemo: true })).rejects.toThrow(
        'Chi tiết tour đang chờ hoàn tất kết nối API từ máy chủ (UC-26 — PENDING_BE_INTEGRATION).',
      );
    });

    it('DEMO-7: returns demo fixture with isDemo: true when in development, flag is true, and allowDemo is true', async () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

      const detail = await getTourDetail('9007199254740995', { allowDemo: true });
      expect(detail.tourId).toBe('9007199254740995');
      expect(detail.isDemo).toBe(true);
      expect(detail.schedules.length).toBeGreaterThan(0);
      expect(detail.itinerary.length).toBeGreaterThan(0);
    });
  });
});
