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
      saveCachedItinerary(cached, 42);

      const result = await getItineraryById(999, { currentUserId: 42 });
      expect(result).toEqual(cached);
    });

    it('rejects with descriptive error (PENDING_BE_INTEGRATION) when itinerary is not in sessionStorage', async () => {
      await expect(getItineraryById(777)).rejects.toThrow(
        /Không tìm thấy lịch trình #777.*Pending Backend Integration/i,
      );
    });

    it('returns an explicit DEMO_ONLY fixture when allowDemoFixture option is passed', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('BE offline'));

      const result = await getItineraryById(777, { allowDemoFixture: true });
      expect(result.status).toBe('DEMO_FIXTURE');
      expect(result.isDemoFixture).toBe(true);
      expect(result.title).toContain('[DEMO_ONLY]');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('returns an explicit DEMO_ONLY fixture when itineraryId is demo', async () => {
      const result = await getItineraryById('demo');
      expect(result.status).toBe('DEMO_FIXTURE');
      expect(result.isDemoFixture).toBe(true);
      expect(result.title).toContain('[DEMO_ONLY]');
    });
  });
});
