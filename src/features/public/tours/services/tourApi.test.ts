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

    it('normalizes omitted or undefined thumbnailUrl property to null so current Backend GET /api/v1/tours payloads parse cleanly', () => {
      const rawOmitted = {
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
      expect(parseTourSearchItem(rawOmitted).thumbnailUrl).toBeNull();
      expect(parseTourSearchItem({ ...rawOmitted, thumbnailUrl: undefined }).thumbnailUrl).toBeNull();
      expect(parseTourSearchItem({ ...rawOmitted, thumbnailUrl: '   ' }).thumbnailUrl).toBeNull();
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

    it('parses valid PagedToursResponseDto when items include or omit thumbnailUrl', () => {
      const raw = {
        page: 1,
        pageSize: 20,
        totalCount: 2,
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
          {
            tourId: '9007199254740996',
            title: 'Đà Nẵng Tour',
            destinations: ['Đà Nẵng'],
            operatorName: 'Endpoint Travel',
            durationDays: 3,
            basePrice: 1200000,
            currency: 'VND',
            representativeScheduleId: '9007199254740998',
            departureAtUtc: '2026-10-20T07:30:00Z',
            availabilityStatus: 'Available',
            remainingSlots: 5,
            thumbnailUrl: 'https://example.com/danang.jpg',
          },
        ],
      };
      const parsed = parsePagedTours(raw);
      expect(parsed.totalCount).toBe(2);
      expect(parsed.items).toHaveLength(2);
      expect(parsed.items[0].thumbnailUrl).toBeNull();
      expect(parsed.items[1].thumbnailUrl).toBe('https://example.com/danang.jpg');
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

  describe('getTourDetail (UC-26)', () => {
    function backendPayload(): Record<string, unknown> {
      return {
        tourId: '9007199254740995',
        title: 'Hội An food tour',
        description: null,
        destination: 'Hội An',
        destinations: ['Hội An'],
        durationDays: 1,
        basePrice: 1000000,
        currency: 'VND',
        operator: { name: 'Hoi An Tours', contactPhone: null },
        images: [],
        inclusions: 'Bữa sáng',
        exclusions: null,
        cancellationPolicy: { rules: [{ daysBeforeDeparture: 0, cancellationFeePercent: 100 }] },
        itinerary: [],
        schedules: [
          {
            scheduleId: '5',
            startAtUtc: '2026-11-01T01:00:00Z',
            endAtUtc: '2026-11-01T10:00:00Z',
            meetingPoint: 'Sảnh',
            registrationDeadlineAtUtc: null,
            adultPrice: 1000000,
            childPrice: null,
            infantPrice: null,
            remainingSlots: 4,
            availabilityStatus: 'available',
            bookable: true,
          },
        ],
        hasBookableSchedule: true,
        rating: { average: null, count: 0 },
        asOfUtc: '2026-10-17T03:00:00Z',
      };
    }

    function jsonResponse(body: unknown, status = 200): Response {
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
      });
    }

    it('requests the BFF route for the id and returns the mapped view model', async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(backendPayload()));
      globalThis.fetch = fetchMock;
      const signal = new AbortController().signal;

      const detail = await getTourDetail('9007199254740995', { signal });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toBe('/api/tours/9007199254740995');
      expect(fetchMock.mock.calls[0][1]).toMatchObject({ signal });
      expect(detail.tourId).toBe('9007199254740995');
      expect(detail.isDemo).toBeUndefined();
      expect(detail.inclusions).toEqual(['Bữa sáng']);
      expect(detail.schedules[0]).toMatchObject({ status: 'Available', bookable: true, remainingSlots: 4 });
    });

    it('maps a 404 to the not-found error (MSG65) and keeps the status', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        jsonResponse({ status: 404, title: 'The tour is unavailable.', errorCode: 'tour.not_found' }, 404),
      );

      const failure = await getTourDetail('15').catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(TourApiError);
      expect((failure as TourApiError).status).toBe(404);
      expect((failure as TourApiError).message).toContain('MSG65');
    });

    it.each([500, 502, 503])('maps a %i response to the unavailable error (MSG127)', async (status) => {
      globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({ status, title: 'boom' }, status));

      const failure = await getTourDetail('15').catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(TourApiError);
      expect((failure as TourApiError).status).toBe(status);
      expect((failure as TourApiError).message).toContain('MSG127');
    });

    it('maps a network failure to the unavailable error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      const failure = await getTourDetail('15').catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(TourApiError);
      expect((failure as TourApiError).status).toBe(0);
      expect((failure as TourApiError).message).toContain('MSG127');
    });

    it('rejects a malformed 200 body instead of rendering it', async () => {
      const payload = backendPayload();
      payload.schedules = [{ ...(payload.schedules as Record<string, unknown>[])[0], availabilityStatus: 'almost' }];
      globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse(payload));

      const failure = await getTourDetail('15').catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(TourApiError);
      expect((failure as TourApiError).message).toContain('MSG127');
    });

    it('rejects a 200 response that is not JSON', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(new Response('<html></html>', { status: 200, headers: { 'Content-Type': 'text/html' } }));

      await expect(getTourDetail('15')).rejects.toBeInstanceOf(TourApiError);
    });

    it.each(['', 'abc', '12abc', '1/2', '..', '-5', '1.5', '12345678901234567890'])(
      'treats the invalid id %j as not found without calling the network',
      async (id) => {
        const fetchMock = vi.fn();
        globalThis.fetch = fetchMock;

        const failure = await getTourDetail(id).catch((error: unknown) => error);

        expect(fetchMock).not.toHaveBeenCalled();
        expect(failure).toBeInstanceOf(TourApiError);
        expect((failure as TourApiError).status).toBe(404);
      },
    );

    it('re-throws an aborted request untouched', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError'));

      const failure = await getTourDetail('15').catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(DOMException);
      expect((failure as DOMException).name).toBe('AbortError');
    });

    it('DEMO-6: allowDemo is ignored in production and the real endpoint is used (no fixture)', async () => {
      setNodeEnv('production');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ status: 404, title: 'x' }, 404));
      globalThis.fetch = fetchMock;

      const failure = await getTourDetail('9007199254740995', { allowDemo: true }).catch((error: unknown) => error);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(failure).toBeInstanceOf(TourApiError);
      expect((failure as TourApiError).status).toBe(404);
    });

    it('DEMO-7: returns demo fixture with isDemo: true when in development, flag is true, and allowDemo is true', async () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
      const fetchMock = vi.fn();
      globalThis.fetch = fetchMock;

      const detail = await getTourDetail('9007199254740995', { allowDemo: true });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(detail.tourId).toBe('9007199254740995');
      expect(detail.isDemo).toBe(true);
      expect(detail.schedules.length).toBeGreaterThan(0);
      expect(detail.itinerary.length).toBeGreaterThan(0);
    });
  });
});
