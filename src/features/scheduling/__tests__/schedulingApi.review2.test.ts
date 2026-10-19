import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getItinerarySuggestions,
  ItineraryHttpError,
  STOP_INFEASIBLE_CODE,
  StopInfeasibleError,
  updateItineraryStops,
} from '../services/schedulingApi';
import { ItineraryDetailDto } from '../types/schedulingTypes';

const detail: ItineraryDetailDto = {
  itineraryId: 790,
  schedulingRequestId: 55,
  title: 'Lịch trình',
  version: 2,
  status: 'Draft',
  validFrom: null,
  validTo: null,
  canManage: true,
  totalEstimatedCost: 0,
  totalDurationMinutes: 120,
  items: [],
};

describe('Review 2 itinerary API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('updateItineraryStops (§3.4)', () => {
    it('sends the stops with an idempotency key and returns the new version', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ status: 200, json: async () => detail });

      const result = await updateItineraryStops(
        789,
        [{ poiId: 12, transportModeToNext: 'Motorbike' }, { poiId: 35 }],
        { accessToken: 'traveler-token', idempotencyKey: 'op-key' },
      );

      expect(result.version).toBe(2);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/itineraries/789/items'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Idempotency-Key': 'op-key',
            Authorization: 'Bearer traveler-token',
          }),
          body: JSON.stringify({ stops: [{ poiId: 12, transportModeToNext: 'Motorbike' }, { poiId: 35 }] }),
        }),
      );
    });

    it('generates an idempotency key when none is given', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ status: 200, json: async () => detail });

      await updateItineraryStops(789, [{ poiId: 1 }]);

      const init = vi.mocked(global.fetch).mock.calls[0][1] as RequestInit;
      expect((init.headers as Record<string, string>)['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/i);
    });

    it('exposes the failing stop of a 422 stop_infeasible problem', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        status: 422,
        ok: false,
        json: async () => ({
          title: 'A selected location does not fit the itinerary.',
          errorCode: STOP_INFEASIBLE_CODE,
          poiId: 35,
          reason: 'ClosedAtArrival',
          plannedArrival: '2026-10-20T17:40:00+07:00',
          closesAt: '17:00',
          overflowMinutes: null,
          overflowVnd: null,
        }),
      });

      const failure = await updateItineraryStops(789, [{ poiId: 35 }]).catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(StopInfeasibleError);
      expect(failure).toBeInstanceOf(ItineraryHttpError);
      expect((failure as StopInfeasibleError).details).toEqual({
        poiId: 35,
        reason: 'ClosedAtArrival',
        plannedArrival: '2026-10-20T17:40:00+07:00',
        closesAt: '17:00',
        overflowMinutes: null,
        overflowVnd: null,
      });
    });
  });

  describe('getItinerarySuggestions (§3.5)', () => {
    const response = {
      itineraryId: 789,
      kind: 'Food',
      searchRadiusKm: 15,
      items: [
        {
          poiId: 501,
          name: 'Bếp Hến',
          category: 'Food & Drink',
          thumbnailUrl: null,
          address: '47 Ngô Thì Sĩ',
          costKind: 'AverageSpend',
          estimatedCost: 120000,
          distanceFromPreviousMeters: 1800,
          detourMinutes: 12,
          distanceSource: 'Road',
          estimatedArrival: '2026-10-20T11:50:00+07:00',
          openAtArrival: true,
          closesAt: '21:00',
          fitsItinerary: true,
          unfitReason: null,
          unfitPoiId: null,
          overflowMinutes: null,
          overflowVnd: null,
          tripadvisor: {
            locationId: 123,
            rating: 4.5,
            reviewCount: 210,
            ratingImageUrl: 'https://static.tacdn.com/img2/ratings/traveler/4.5.svg',
            url: 'https://www.tripadvisor.com/Restaurant_Review-123',
          },
        },
      ],
    };

    it('requests food suggestions after an item', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ status: 200, ok: true, json: async () => response });

      const result = await getItinerarySuggestions(
        789,
        { kind: 'Food', afterItemId: 11 },
        { accessToken: 'traveler-token' },
      );

      expect(result.items[0].name).toBe('Bếp Hến');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/itineraries\/789\/suggestions\?kind=Food&afterItemId=11$/),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer traveler-token' }),
        }),
      );
    });

    it('requests replacements for an item', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({ ...response, kind: 'Replace', items: [] }),
      });

      const result = await getItinerarySuggestions(789, { kind: 'Replace', replaceItemId: 14 });

      expect(result.items).toEqual([]);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/suggestions\?kind=Replace&replaceItemId=14$/),
        expect.anything(),
      );
    });

    it('rejects a response that does not match the contract', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({ ...response, items: [{ poiId: 'x' }] }),
      });

      await expect(getItinerarySuggestions(789, { kind: 'Food', afterItemId: 11 })).rejects.toMatchObject({
        status: 502,
        code: 'server.invalid_contract',
      });
    });

    it('explains a forbidden request in Vietnamese', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        status: 403,
        ok: false,
        json: async () => ({ errorCode: 'itinerary.owner_permission_required' }),
      });

      await expect(getItinerarySuggestions(789, { kind: 'Food', afterItemId: 11 })).rejects.toMatchObject({
        status: 403,
        message: 'Chỉ chủ lịch trình mới có thể thay đổi các điểm dừng.',
      });
    });
  });
});

describe('Review 2 API error bodies', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('survives a JSON null error body on a stop update', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ status: 500, ok: false, json: async () => null });

    await expect(updateItineraryStops(789, [{ poiId: 1 }])).rejects.toMatchObject({
      status: 500,
      code: 'itinerary.mutation_failed',
      message: 'Không thể cập nhật lịch trình. Vui lòng thử lại sau.',
    });
  });

  it('survives a JSON null error body on suggestions', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ status: 403, ok: false, json: async () => null });

    await expect(getItinerarySuggestions(789, { kind: 'Food', afterItemId: 11 })).rejects.toMatchObject({
      status: 403,
      message: 'Chỉ chủ lịch trình mới có thể thay đổi các điểm dừng.',
    });
  });

  it('drops an unknown infeasibility reason instead of trusting it', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      status: 422,
      ok: false,
      json: async () => ({ errorCode: STOP_INFEASIBLE_CODE, poiId: 35, reason: 'Weather' }),
    });

    const failure = (await updateItineraryStops(789, [{ poiId: 35 }]).catch((error: unknown) => error)) as StopInfeasibleError;

    expect(failure.details.reason).toBeNull();
    expect(failure.details.poiId).toBe(35);
  });

  it('rethrows an aborted suggestions request untouched', async () => {
    const abort = new DOMException('aborted', 'AbortError');
    global.fetch = vi.fn().mockRejectedValueOnce(abort);

    await expect(getItinerarySuggestions(789, { kind: 'Food', afterItemId: 11 })).rejects.toBe(abort);
  });
});
