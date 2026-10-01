import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getTourDetail,
  getTourRecommendations,
  parsePagedTours,
  parseTourSearchItem,
  searchTours,
} from './tourApi';
import { TourApiError } from '../types/tour';

describe('tourApi service', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('parsers', () => {
    it('parses valid TourSearchItemDto', () => {
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
      };
      const parsed = parseTourSearchItem(raw);
      expect(parsed.tourId).toBe('9007199254740995');
      expect(parsed.destinations).toEqual(['Đà Nẵng', 'Hội An']);
      expect(parsed.remainingSlots).toBe(11);
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

  describe('getTourRecommendations (UC-25 Governance)', () => {
    it('returns empty array with isPendingBe: true in production mode without silent fake data', async () => {
      const res = await getTourRecommendations();
      expect(res.isPendingBe).toBe(true);
      expect(res.isDemo).toBe(false);
      expect(res.items).toHaveLength(0);
    });

    it('returns demo fixtures only when allowDemo is explicitly enabled', async () => {
      const res = await getTourRecommendations({ allowDemo: true });
      expect(res.isPendingBe).toBe(false);
      expect(res.isDemo).toBe(true);
      expect(res.items.length).toBeGreaterThan(0);
      expect(res.items[0].matchingScore).toBeGreaterThanOrEqual(80);
    });
  });

  describe('getTourDetail (UC-26 Governance)', () => {
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

    it('returns demo fixture with isDemo: true when allowDemo is explicitly true', async () => {
      const detail = await getTourDetail('9007199254740995', { allowDemo: true });
      expect(detail.tourId).toBe('9007199254740995');
      expect(detail.isDemo).toBe(true);
      expect(detail.schedules.length).toBeGreaterThan(0);
      expect(detail.itinerary.length).toBeGreaterThan(0);
    });
  });
});
