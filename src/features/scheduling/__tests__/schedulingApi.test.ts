import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  generateIdempotencyKey,
  generateSimulatedItinerary,
  createSchedulingRequest,
  saveCachedItinerary,
  getCachedItinerary,
  getItineraryById,
} from '../services/schedulingApi';
import { CreateSchedulingRequestPayload } from '../types/schedulingTypes';

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
      saveCachedItinerary(itinerary);
      const retrieved = getCachedItinerary(itinerary.itineraryId);
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

      saveCachedItinerary(mockItinerary);
      const result = getCachedItinerary(101);
      expect(result).toEqual(mockItinerary);
    });

    it('returns null for nonexistent itinerary ID', () => {
      const result = getCachedItinerary(999999);
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

  describe('getItineraryById', () => {
    it('returns cached itinerary if available in sessionStorage', async () => {
      const cached = {
        schedulingRequestId: 11,
        itineraryId: 999,
        title: 'Lịch trình đã lưu',
        status: 'OptimalGenerated',
        totalEstimatedCost: 150000,
        totalDurationMinutes: 240,
        items: [],
      };
      saveCachedItinerary(cached);

      const result = await getItineraryById(999);
      expect(result).toEqual(cached);
    });

    it('calls BE endpoint if available and not in cache', async () => {
      const mockFromBe = {
        schedulingRequestId: 12,
        itineraryId: 888,
        title: 'Từ Backend API',
        status: 'OptimalGenerated',
        totalEstimatedCost: 350000,
        totalDurationMinutes: 360,
        items: [],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockFromBe,
      });

      const result = await getItineraryById(888);
      expect(result).toEqual(mockFromBe);
    });

    it('generates a simulated fallback if BE is offline and not in cache', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('BE offline'));

      const result = await getItineraryById(777);
      expect(result.itineraryId).toBe(777);
      expect(result.items.length).toBeGreaterThan(0);
    });
  });
});
