import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  generateIdempotencyKey,
  generateSimulatedItinerary,
  createSchedulingRequest,
  saveCachedItinerary,
  getCachedItinerary,
  getItineraryById,
} from '../services/schedulingApi';
import { CreateSchedulingRequestPayload, ItineraryDetailDto } from '../types/schedulingTypes';

describe('UC-10 Scheduling API Service', () => {
  const samplePayload: CreateSchedulingRequestPayload = {
    startAt: '2026-10-20T08:00:00+07:00',
    timeZoneId: 'Asia/Ho_Chi_Minh',
    startLatitude: 16.0544,
    startLongitude: 108.2022,
    explorationLatitude: 16.0471,
    explorationLongitude: 108.2068,
    endPoiId: null,
    returnToStart: true,
    availableMinutes: 480,
    transportMode: 'Motorbike',
    searchRadiusKm: 10,
    budgetVnd: 800000,
    mandatoryPoiIds: [],
    restPreference: 'Auto',
  };

  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateIdempotencyKey', () => {
    it('returns a valid UUID v4 format string', () => {
      const key = generateIdempotencyKey();
      expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('generates distinct keys on subsequent invocations', () => {
      const key1 = generateIdempotencyKey();
      const key2 = generateIdempotencyKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('generateSimulatedItinerary', () => {
    it('generates valid SchedulingResponseDto with sequence numbers and items', () => {
      const itinerary = generateSimulatedItinerary(samplePayload);

      expect(itinerary.schedulingRequestId).toBeGreaterThan(0);
      expect(itinerary.itineraryId).toBeGreaterThan(0);
      expect(itinerary.status).toBe('OptimalGenerated');
      expect(itinerary.totalDurationMinutes).toBeLessThanOrEqual(480);
      expect(itinerary.items.length).toBeGreaterThanOrEqual(2);

      // Verify sequence ordering
      for (let i = 0; i < itinerary.items.length; i++) {
        expect(itinerary.items[i].sequenceNo).toBe(i + 1);
        expect(itinerary.items[i].poiName).toBeTruthy();
        expect(new Date(itinerary.items[i].plannedArrival).getTime()).toBeLessThan(
          new Date(itinerary.items[i].plannedDeparture).getTime(),
        );
      }
    });

    it('can be manually saved to cached itineraries if needed', () => {
      const itinerary = generateSimulatedItinerary(samplePayload);
      saveCachedItinerary(itinerary, 1);
      const retrieved = getCachedItinerary(itinerary.itineraryId, 1);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.itineraryId).toBe(itinerary.itineraryId);
    });
  });

  describe('saveCachedItinerary and getCachedItinerary', () => {
    it('saves and retrieves an itinerary correctly', () => {
      const mockItinerary = {
        schedulingRequestId: 99,
        itineraryId: 101,
        title: 'Chuyến đi thử nghiệm',
        status: 'OptimalGenerated',
        totalEstimatedCost: 200000,
        totalDurationMinutes: 300,
        items: [],
      };

      saveCachedItinerary(mockItinerary, 42);
      const result = getCachedItinerary(101, 42);
      expect(result).toEqual(mockItinerary);
    });

    it('enforces cache isolation across different users', () => {
      const mockItinerary = {
        schedulingRequestId: 12,
        itineraryId: 102,
        title: 'Chuyến đi của User 42',
        status: 'OptimalGenerated',
        totalEstimatedCost: 100000,
        totalDurationMinutes: 180,
        items: [],
      };

      saveCachedItinerary(mockItinerary, 42);
      // User 99 must NOT access User 42's cached itinerary
      const resultOtherUser = getCachedItinerary(102, 99);
      expect(resultOtherUser).toBeNull();

      // User 42 CAN access their own cached itinerary
      const resultOwner = getCachedItinerary(102, 42);
      expect(resultOwner).toEqual(mockItinerary);
    });

    it('rejects corrupted or non-conforming cache entries', () => {
      window.sessionStorage.setItem('tripmate_itinerary_42_103', JSON.stringify({ invalid: true }));
      expect(getCachedItinerary(103, 42)).toBeNull();

      window.sessionStorage.setItem(
        'tripmate_itinerary_42_104',
        JSON.stringify({ schemaVersion: 2, ownerUserId: 42, itinerary: {} }),
      );
      expect(getCachedItinerary(104, 42)).toBeNull();
    });

    it('returns null for nonexistent itinerary ID', () => {
      const result = getCachedItinerary(999999, 42);
      expect(result).toBeNull();
    });
  });

  describe('createSchedulingRequest', () => {
    it('calls BE endpoint with correct payload and headers when available', async () => {
      const mockResponse = {
        schedulingRequestId: 123,
        itineraryId: 456,
        title: 'Lịch trình Đà Nẵng',
        status: 'OptimalGenerated',
        totalEstimatedCost: 500000,
        totalDurationMinutes: 480,
        items: [],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await createSchedulingRequest(samplePayload, {
        accessToken: 'fake-token',
        idempotencyKey: 'test-idempotency-key',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/scheduling-requests'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Idempotency-Key': 'test-idempotency-key',
            Authorization: 'Bearer fake-token',
          }),
        }),
      );

      expect(result.success).toBe(true);
      expect(result.isSimulatedFallback).toBe(false);
      expect(result.data.itineraryId).toBe(456);
    });

    it('throws network.unavailable error when network fails to connect', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network offline'));

      await expect(createSchedulingRequest(samplePayload)).rejects.toEqual(
        expect.objectContaining({
          status: 503,
          code: 'network.unavailable',
        }),
      );
    });

    it('throws 401 error when user is unauthenticated', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          code: 'auth.unauthorized',
        }),
      });

      await expect(createSchedulingRequest(samplePayload)).rejects.toEqual(
        expect.objectContaining({
          status: 401,
          code: 'auth.unauthorized',
        }),
      );
    });

    it('throws structured error when backend returns 422 infeasible constraint', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          code: 'planning.constraints_infeasible',
          detail: 'No selectable locations were found in the selected area.',
        }),
      });

      await expect(createSchedulingRequest(samplePayload)).rejects.toEqual(
        expect.objectContaining({
          status: 422,
          code: 'planning.constraints_infeasible',
        }),
      );
    });
  });

  describe('getItineraryById (UC-11 Server-Authoritative Integration)', () => {

    const mockDetailResponse: ItineraryDetailDto = {
      itineraryId: 789,
      schedulingRequestId: 55,
      title: 'Lịch trình khám phá Đà Nẵng',
      version: 1,
      status: 'OptimalGenerated',
      validFrom: '2026-10-20T08:00:00+07:00',
      validTo: '2026-10-20T17:00:00+07:00',
      canManage: true,
      totalEstimatedCost: 250000,
      totalDurationMinutes: 480,
      items: [
        {
          itemId: 1001,
          sequenceNo: 1,
          poiId: 101,
          poiName: 'Bảo tàng Điêu khắc Chăm',
          category: 'Văn hóa & Di sản',
          kind: 'Visit',
          plannedArrival: '2026-10-20T08:00:00+07:00',
          plannedDeparture: '2026-10-20T09:00:00+07:00',
          travelDurationFromPreviousMinutes: null,
          stayDurationMinutes: 60,
          estimatedCost: 60000,
          isMandatory: true,
          recommendationReason: 'Di sản độc đáo',
          isUnavailable: false,
        },
        {
          itemId: 1002,
          sequenceNo: 2,
          poiId: 102,
          poiName: 'Cầu Rồng',
          category: 'Tham quan',
          kind: 'Visit',
          plannedArrival: '2026-10-20T09:15:00+07:00',
          plannedDeparture: '2026-10-20T10:00:00+07:00',
          travelDurationFromPreviousMinutes: 15,
          stayDurationMinutes: 45,
          estimatedCost: 0,
          isMandatory: false,
          recommendationReason: 'Biểu tượng Đà Nẵng',
          isUnavailable: false,
        },
      ],
    };

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('P1-FE-1: calls GET /api/v1/itineraries/{id} and returns validated ItineraryDetailDto on 200 OK', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockDetailResponse,
      });

      const result = await getItineraryById(789, {
        accessToken: 'traveler-bearer-token',
        currentUserId: 42,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/itineraries/789'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer traveler-bearer-token',
            Accept: 'application/json',
          }),
        }),
      );
      expect(result).toEqual(mockDetailResponse);

      // Verify it cached the verified response
      const cached = getCachedItinerary(789, 42);
      expect(cached).toEqual(mockDetailResponse);
    });

    it('P1-FE-2: propagates 401 Unauthorized as ItineraryHttpError', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ code: 'auth.unauthorized' }),
      });

      await expect(getItineraryById(789)).rejects.toMatchObject({
        status: 401,
        code: 'auth.unauthorized',
      });
    });

    it('P1-FE-3: propagates 403 Forbidden as ItineraryHttpError and NEVER falls back to cache', async () => {
      // Pre-populate stale cache for another session
      saveCachedItinerary(mockDetailResponse, 42);

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ code: 'auth.forbidden' }),
      });

      await expect(getItineraryById(789, { currentUserId: 42 })).rejects.toMatchObject({
        status: 403,
        code: 'auth.forbidden',
      });
    });

    it('P1-FE-4: propagates 404 Not Found as ItineraryHttpError', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ code: 'itinerary.not_found' }),
      });

      await expect(getItineraryById(99999)).rejects.toMatchObject({
        status: 404,
        code: 'itinerary.not_found',
      });
    });

    it('P1-FE-5: propagates 500 Server Error as ItineraryHttpError', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ code: 'server.error' }),
      });

      await expect(getItineraryById(789)).rejects.toMatchObject({
        status: 500,
        code: 'server.error',
      });
    });

    it('P1-FE-6: transforms network connectivity failure into ItineraryHttpError(503)', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network connection failed'));

      await expect(getItineraryById(789)).rejects.toMatchObject({
        status: 503,
        code: 'network.unavailable',
      });
    });

    it('P1-FE-7: throws ItineraryHttpError(502) when backend returns malformed JSON', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Unexpected token');
        },
      });

      await expect(getItineraryById(789)).rejects.toMatchObject({
        status: 502,
        code: 'server.malformed_response',
      });
    });

    it('P1-FE-8: throws ItineraryHttpError(502) when backend returns non-conforming contract', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invalidPayload: true }),
      });

      await expect(getItineraryById(789)).rejects.toMatchObject({
        status: 502,
        code: 'server.invalid_contract',
      });
    });

    describe('P2 Production Lockdown & Route ID Validation', () => {
      it('P2-1: in production, rejects demo ID with 404 without network request', async () => {
        vi.stubEnv('NODE_ENV', 'production');
        const fetchSpy = vi.fn();
        global.fetch = fetchSpy;

        await expect(getItineraryById('demo')).rejects.toMatchObject({
          status: 404,
          code: 'itinerary.invalid_id',
        });
        expect(fetchSpy).not.toHaveBeenCalled();
      });

      it('P2-2: in production, rejects DEMO_ONLY ID with 404 without network request', async () => {
        vi.stubEnv('NODE_ENV', 'production');
        const fetchSpy = vi.fn();
        global.fetch = fetchSpy;

        await expect(getItineraryById('DEMO_ONLY')).rejects.toMatchObject({
          status: 404,
          code: 'itinerary.invalid_id',
        });
        expect(fetchSpy).not.toHaveBeenCalled();
      });

      it('P2-3: in production, ignores allowDemoFixture flag and rejects non-numeric ID with 404', async () => {
        vi.stubEnv('NODE_ENV', 'production');
        const fetchSpy = vi.fn();
        global.fetch = fetchSpy;

        await expect(getItineraryById('custom_demo', { allowDemoFixture: true })).rejects.toMatchObject({
          status: 404,
          code: 'itinerary.invalid_id',
        });
        expect(fetchSpy).not.toHaveBeenCalled();
      });

      it('P2-4: rejects invalid route IDs (abc, -1, 0, float) with 404 before dispatching request', async () => {
        const fetchSpy = vi.fn();
        global.fetch = fetchSpy;

        await expect(getItineraryById('abc')).rejects.toMatchObject({
          status: 404,
          code: 'itinerary.invalid_id',
        });
        await expect(getItineraryById(-1)).rejects.toMatchObject({
          status: 404,
          code: 'itinerary.invalid_id',
        });
        await expect(getItineraryById(0)).rejects.toMatchObject({
          status: 404,
          code: 'itinerary.invalid_id',
        });
        await expect(getItineraryById(12.34)).rejects.toMatchObject({
          status: 404,
          code: 'itinerary.invalid_id',
        });

        expect(fetchSpy).not.toHaveBeenCalled();
      });

      it('P2-5: in test/development, returns DEMO_FIXTURE when explicitly requested', async () => {
        vi.stubEnv('NODE_ENV', 'test');

        const demoResult = await getItineraryById('demo');
        expect(demoResult.status).toBe('DEMO_FIXTURE');
        expect(demoResult.title).toContain('[DEMO_ONLY]');
        expect(demoResult.canManage).toBe(true);
        expect(demoResult.items.length).toBeGreaterThan(0);
      });
    });
  });
});
