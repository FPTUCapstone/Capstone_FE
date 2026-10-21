import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { demoTripHistoryPage } from '../data/tripHistoryDemoFixtures';
import { tripReviewEn } from '../resources/en';
import type { TripHistoryFilter } from '../types/tripHistoryContract';
import {
  fetchTripDetail,
  fetchTripHistory,
  TripHistoryClientError,
} from './tripHistoryClient';

const fetchMock = vi.fn();

const page = {
  items: [
    {
      kind: 'itinerary',
      id: '45',
      tripType: 'SelfPlannedItinerary',
      tab: 'Completed',
      title: 'Da Nang 2 days',
      departureAtUtc: '2026-09-20T01:00:00+00:00',
      status: 'Completed',
      stopCount: 6,
      visitedCount: 5,
      reviewableRecord: null,
      actions: { canReview: false, canViewETicket: false, ticketId: null, canViewRefund: false },
      review: null,
    },
  ],
  summary: { totalCompletedTrips: 1, totalVisitedPois: 5 },
  page: 1,
  pageSize: 20,
  totalCount: 1,
};

const itineraryDetail = { ...page.items[0], stops: [] };

const filter = (over: Partial<TripHistoryFilter> = {}): TripHistoryFilter => ({
  tab: 'Completed',
  tripType: 'All',
  page: 1,
  ...over,
});

const json = (body: unknown, status = 200) => Response.json(body, { status });

function requestedUrl(): URL {
  return new URL(fetchMock.mock.calls[0][0] as string, 'http://localhost:3001');
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('fetchTripHistory — request', () => {
  it('asks the BFF for the tab and page, with the canonical page size and no status or query parameter', async () => {
    fetchMock.mockResolvedValue(json(page));

    await fetchTripHistory(filter({ tab: 'Cancelled', page: 3 }));

    const url = requestedUrl();
    expect(url.pathname).toBe('/api/v1/traveler/trips');
    expect(Object.fromEntries(url.searchParams)).toEqual({ tab: 'Cancelled', page: '3', pageSize: '20' });
    expect(url.searchParams.has('status')).toBe(false);
    expect(url.searchParams.has('query')).toBe(false);
  });

  it.each([
    ['All', undefined],
    ['TourBooking', 'TourBooking'],
    ['SelfPlannedItinerary', 'SelfPlannedItinerary'],
  ] as const)('maps the trip type %s to %s', async (tripType, expected) => {
    fetchMock.mockResolvedValue(json(page));

    await fetchTripHistory(filter({ tripType }));

    expect(requestedUrl().searchParams.get('tripType') ?? undefined).toBe(expected);
  });

  it('sends the date range only when it is set', async () => {
    fetchMock.mockResolvedValue(json(page));
    await fetchTripHistory(filter({ fromDate: '2026-10-01', toDate: '2026-10-31' }));
    expect(requestedUrl().searchParams.get('fromDate')).toBe('2026-10-01');
    expect(requestedUrl().searchParams.get('toDate')).toBe('2026-10-31');

    fetchMock.mockClear();
    fetchMock.mockResolvedValue(json(page));
    await fetchTripHistory(filter({ fromDate: '', toDate: '' }));
    expect(requestedUrl().searchParams.has('fromDate')).toBe(false);
    expect(requestedUrl().searchParams.has('toDate')).toBe(false);
  });

  it('forwards the abort signal and asks for fresh, uncached JSON', async () => {
    fetchMock.mockResolvedValue(json(page));
    const controller = new AbortController();

    await fetchTripHistory(filter(), { signal: controller.signal });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBe(controller.signal);
    expect(init.cache).toBe('no-store');
    expect(new Headers(init.headers).get('Accept')).toBe('application/json');
  });
});

describe('fetchTripHistory — result', () => {
  it('returns the page the BFF sent', async () => {
    fetchMock.mockResolvedValue(json(page));

    expect(await fetchTripHistory(filter())).toEqual(page);
  });

  it('lets an aborted request surface as an AbortError, not as a trip error', async () => {
    const abort = new DOMException('The operation was aborted.', 'AbortError');
    fetchMock.mockRejectedValue(abort);

    await expect(fetchTripHistory(filter())).rejects.toBe(abort);
  });

  describe('maps failures to the canonical messages', () => {
    const errorCases: Array<[string, number, unknown, string, string]> = [
      ['401 UNAUTHENTICATED', 401, { errorCode: 'UNAUTHENTICATED' }, 'accessDenied', tripReviewEn.errors.tripHistoryAccessDenied],
      ['403 FORBIDDEN', 403, { errorCode: 'FORBIDDEN' }, 'accessDenied', tripReviewEn.errors.tripHistoryAccessDenied],
      ['403 trip_history.forbidden', 403, { errorCode: 'trip_history.forbidden' }, 'accessDenied', tripReviewEn.errors.tripHistoryAccessDenied],
      ['400 invalid_date_range', 400, { errorCode: 'trip_history.invalid_date_range' }, 'invalidDateRange', tripReviewEn.validation.invalidDateRange],
      ['400 invalid_paging', 400, { errorCode: 'trip_history.invalid_paging' }, 'system', tripReviewEn.errors.systemError],
      ['400 invalid_tab', 400, { errorCode: 'trip_history.invalid_tab' }, 'system', tripReviewEn.errors.systemError],
      ['404 without a code', 404, { errorCode: 'MSG127' }, 'system', tripReviewEn.errors.systemError],
      ['503 MSG127', 503, { errorCode: 'MSG127' }, 'system', tripReviewEn.errors.systemError],
      ['502 invalid_response', 502, { errorCode: 'trip_history.invalid_response' }, 'system', tripReviewEn.errors.systemError],
      ['500 with a leaking body', 500, { title: 'SELECT * FROM x', errorCode: 'internal.boom' }, 'system', tripReviewEn.errors.systemError],
    ];

    it.each(errorCases)('%s', async (_name, status, body, kind, message) => {
      fetchMock.mockResolvedValue(json(body, status));

      const error = await fetchTripHistory(filter()).catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(TripHistoryClientError);
      expect((error as TripHistoryClientError).kind).toBe(kind);
      expect((error as TripHistoryClientError).message).toBe(message);
      expect((error as TripHistoryClientError).status).toBe(status);
    });

    it('a non-JSON error body is a system error', async () => {
      fetchMock.mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }));

      await expect(fetchTripHistory(filter())).rejects.toMatchObject({ kind: 'system', message: tripReviewEn.errors.systemError });
    });

    it('a network failure is a system error', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(fetchTripHistory(filter())).rejects.toMatchObject({ kind: 'system', status: 0 });
    });
  });

  describe('treats a 2xx body that is not a trip page as a system error', () => {
    it.each([
      ['not JSON', new Response('oops', { status: 200 })],
      ['a JSON array', json([])],
      ['items missing', json({ page: 1, pageSize: 20, totalCount: 0 })],
      ['items not an array', json({ items: {}, page: 1, pageSize: 20, totalCount: 0 })],
      ['totalCount missing', json({ items: [], page: 1, pageSize: 20 })],
      ['totalCount negative', json({ items: [], page: 1, pageSize: 20, totalCount: -1 })],
      ['an item without a kind', json({ items: [{ id: '1' }], page: 1, pageSize: 20, totalCount: 1 })],
    ])('%s', async (_name, response) => {
      fetchMock.mockResolvedValue(response);

      await expect(fetchTripHistory(filter())).rejects.toMatchObject({ kind: 'system' });
    });
  });
});

describe('fetchTripDetail', () => {
  it('requests the (kind, id) pair and returns the detail', async () => {
    fetchMock.mockResolvedValue(json(itineraryDetail));

    const detail = await fetchTripDetail('itinerary', '45');

    expect(requestedUrl().pathname).toBe('/api/v1/traveler/trips/itinerary/45');
    expect(detail).toEqual(itineraryDetail);
  });

  it('forwards the abort signal', async () => {
    fetchMock.mockResolvedValue(json(itineraryDetail));
    const controller = new AbortController();

    await fetchTripDetail('itinerary', '45', { signal: controller.signal });

    expect((fetchMock.mock.calls[0][1] as RequestInit).signal).toBe(controller.signal);
  });

  it('maps 404 trip_history.record_not_found to notFound with its own message', async () => {
    fetchMock.mockResolvedValue(json({ errorCode: 'trip_history.record_not_found' }, 404));

    await expect(fetchTripDetail('itinerary', '45')).rejects.toMatchObject({
      kind: 'notFound',
      message: tripReviewEn.errors.tripRecordUnavailable,
      status: 404,
    });
  });

  it.each([401, 403])('maps %i to accessDenied with the detail message', async (status) => {
    fetchMock.mockResolvedValue(json({ errorCode: status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN' }, status));

    await expect(fetchTripDetail('itinerary', '45')).rejects.toMatchObject({
      kind: 'accessDenied',
      message: tripReviewEn.errors.tripDetailAccessDenied,
    });
  });

  it.each([
    [400, 'trip_history.invalid_record'],
    [503, 'MSG127'],
    [502, 'trip_history.invalid_response'],
  ])('maps %i %s to a system error', async (status, errorCode) => {
    fetchMock.mockResolvedValue(json({ errorCode }, status));

    await expect(fetchTripDetail('itinerary', '45')).rejects.toMatchObject({
      kind: 'system',
      message: tripReviewEn.errors.systemError,
    });
  });

  it('rejects a detail that is for another record than the one requested', async () => {
    fetchMock.mockResolvedValue(json({ ...itineraryDetail, id: '46' }));
    await expect(fetchTripDetail('itinerary', '45')).rejects.toMatchObject({ kind: 'system' });

    fetchMock.mockResolvedValue(json({ ...itineraryDetail, kind: 'commerceBooking' }));
    await expect(fetchTripDetail('itinerary', '45')).rejects.toMatchObject({ kind: 'system' });
  });

  it('treats a non-object success body as a system error', async () => {
    fetchMock.mockResolvedValue(json('oops'));

    await expect(fetchTripDetail('itinerary', '45')).rejects.toMatchObject({ kind: 'system' });
  });

  it('lets an aborted request surface as an AbortError', async () => {
    const abort = new DOMException('aborted', 'AbortError');
    fetchMock.mockRejectedValue(abort);

    await expect(fetchTripDetail('itinerary', '45')).rejects.toBe(abort);
  });
});

describe('demo gate', () => {
  const allowDemo = () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');
  };

  it('serves fixtures without any request when the demo is requested and allowed', async () => {
    allowDemo();

    const result = await fetchTripHistory(filter(), { allowDemo: true });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toEqual(demoTripHistoryPage(filter()));
    expect((await fetchTripDetail('itinerary', '5001', { allowDemo: true })).id).toBe('5001');
  });

  it('reports a demo record that does not exist as notFound', async () => {
    allowDemo();

    await expect(fetchTripDetail('itinerary', '999999', { allowDemo: true })).rejects.toMatchObject({
      kind: 'notFound',
      message: tripReviewEn.errors.tripRecordUnavailable,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls the BFF when the demo is allowed by the environment but was not requested', async () => {
    allowDemo();
    fetchMock.mockImplementation(async () => json(page));

    await fetchTripHistory(filter());
    await fetchTripHistory(filter(), { allowDemo: false });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['in production, even with the flag on', 'production', 'true'],
    ['without the explicit flag', 'development', ''],
    ['with the flag set to something else', 'development', '1'],
  ])('ignores the demo request %s and calls the BFF', async (_name, nodeEnv, flag) => {
    vi.stubEnv('NODE_ENV', nodeEnv);
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', flag);
    fetchMock.mockImplementation(async () => json(page));

    await fetchTripHistory(filter(), { allowDemo: true });
    await fetchTripDetail('itinerary', '45', { allowDemo: true }).catch(() => undefined);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('never falls back to fixtures when the real request fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(fetchTripHistory(filter(), { allowDemo: true })).rejects.toBeInstanceOf(TripHistoryClientError);
    await expect(fetchTripDetail('itinerary', '5001', { allowDemo: true })).rejects.toBeInstanceOf(TripHistoryClientError);
  });
});
