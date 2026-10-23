// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  fetchBackendMock: vi.fn(),
}));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import { GET as getDetailRoute } from '../../../../app/api/v1/traveler/trips/[kind]/[id]/route';
import { GET as getListRoute } from '../../../../app/api/v1/traveler/trips/route';
import { proxyTripDetail, proxyTripHistoryList } from './tripHistoryProxy';

const REFRESH = '/api/v1/auth/web/refresh';

const listBody = JSON.stringify({
  items: [
    {
      kind: 'itinerary',
      id: 45,
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
      internalNote: 'must not leak',
    },
  ],
  summary: { totalCompletedTrips: 1, totalVisitedPois: 5 },
  page: 1,
  pageSize: 20,
  totalCount: 1,
});

const detailBody = JSON.stringify({
  kind: 'itinerary',
  id: 45,
  tripType: 'SelfPlannedItinerary',
  tab: 'Completed',
  title: 'Da Nang 2 days',
  departureAtUtc: '2026-09-20T01:00:00+00:00',
  status: 'Completed',
  stopCount: 1,
  visitedCount: 1,
  reviewableRecord: null,
  actions: { canReview: false, canViewETicket: false, ticketId: null, canViewRefund: false },
  review: null,
  stops: [
    {
      sequenceNo: 1,
      poiId: 9,
      poiName: 'Dragon Bridge',
      plannedArrivalUtc: '2026-09-20T01:00:00+00:00',
      plannedDepartureUtc: '2026-09-20T02:00:00+00:00',
      visitStatus: 'Reached',
      reachedAtUtc: '2026-09-20T01:05:00+00:00',
    },
  ],
});

function refreshOk(role = 'Traveler') {
  return Response.json({ data: { role, accessToken: 'access-token' } });
}

function upstream(response: Response | (() => Response)) {
  fetchBackendMock.mockImplementation(async (path: string) => {
    if (path === REFRESH) return refreshOk();
    return typeof response === 'function' ? response() : response;
  });
}

function problem(status: number, errorCode: string | null, extra: Record<string, unknown> = {}) {
  return Response.json(
    { title: 'internal', detail: 'SELECT * FROM secrets', ...(errorCode ? { errorCode } : {}), ...extra },
    { status },
  );
}

const listRequest = (query = '?tab=Completed') =>
  new Request(`http://localhost:3000/api/v1/traveler/trips${query}`);

const detailRequest = () => new Request('http://localhost:3000/api/v1/traveler/trips/x/1');

beforeEach(() => {
  vi.clearAllMocks();
  cookiesMock.mockResolvedValue({ get: () => ({ value: 'refresh-cookie' }) });
});

describe('Trip History BFF — authentication', () => {
  it('answers 401 UNAUTHENTICATED without calling the backend when there is no refresh cookie', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });

    const response = await proxyTripHistoryList(listRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ errorCode: 'UNAUTHENTICATED' });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('answers 401 when the refresh is rejected', async () => {
    fetchBackendMock.mockResolvedValue(new Response(null, { status: 401 }));

    const response = await proxyTripHistoryList(listRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ errorCode: 'UNAUTHENTICATED' });
    expect(fetchBackendMock).toHaveBeenCalledTimes(1);
  });

  it.each(['TourOperator', 'Administrator', 'Staff'])('answers 401 when the session role is %s', async (role) => {
    fetchBackendMock.mockResolvedValue(refreshOk(role));

    const response = await proxyTripHistoryList(listRequest());

    expect(response.status).toBe(401);
    expect(fetchBackendMock).toHaveBeenCalledTimes(1);
  });

  it('sends the refresh cookie only to the refresh endpoint and the bearer token only to the trips endpoint', async () => {
    upstream(new Response(listBody));

    await proxyTripHistoryList(listRequest());

    const [refreshPath, refreshInit] = fetchBackendMock.mock.calls[0];
    expect(refreshPath).toBe(REFRESH);
    expect(refreshInit.method).toBe('POST');
    expect(new Headers(refreshInit.headers).get('Cookie')).toBe('tripmate_refresh=refresh-cookie');
    const [, tripsInit] = fetchBackendMock.mock.calls[1];
    const headers = new Headers(tripsInit.headers);
    expect(headers.get('Authorization')).toBe('Bearer access-token');
    expect(headers.get('Cookie')).toBeNull();
    expect([...headers.keys()]).toEqual(['authorization']);
  });
});

describe('Trip History BFF — list', () => {
  it('forwards only the allow-listed query keys', async () => {
    upstream(new Response(listBody));

    const response = await proxyTripHistoryList(
      listRequest('?tab=Completed&tripType=TourBooking&fromDate=2026-10-01&toDate=2026-10-31&page=2&pageSize=20&status=x&query=y&token=z'),
    );

    expect(response.status).toBe(200);
    const [path] = fetchBackendMock.mock.calls[1];
    const url = new URL(path as string, 'http://backend');
    expect(url.pathname).toBe('/api/v1/traveler/trips');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      tab: 'Completed',
      tripType: 'TourBooking',
      fromDate: '2026-10-01',
      toDate: '2026-10-31',
      page: '2',
      pageSize: '20',
    });
  });

  it('forwards no query string at all when none of the keys is present', async () => {
    upstream(new Response(listBody));

    await proxyTripHistoryList(listRequest('?foo=bar'));

    expect(fetchBackendMock.mock.calls[1][0]).toBe('/api/v1/traveler/trips');
  });

  it('uses the first value of a repeated key and drops values that are too long', async () => {
    upstream(new Response(listBody));

    await proxyTripHistoryList(listRequest(`?tab=Completed&tab=Cancelled&tripType=${'x'.repeat(40)}`));

    const url = new URL(fetchBackendMock.mock.calls[1][0] as string, 'http://backend');
    expect(url.searchParams.getAll('tab')).toEqual(['Completed']);
    expect(url.searchParams.has('tripType')).toBe(false);
  });

  it('returns the validated page with no-store and without unknown fields', async () => {
    upstream(new Response(listBody));

    const response = await proxyTripHistoryList(listRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const body = await response.json();
    expect(body.totalCount).toBe(1);
    expect(body.items[0].id).toBe('45');
    expect(body.items[0]).not.toHaveProperty('internalNote');
    expect(JSON.stringify(body)).not.toContain('must not leak');
  });

  it('answers 502 trip_history.invalid_response for a body that breaks the contract', async () => {
    upstream(new Response(JSON.stringify({ items: 'nope', page: 1, pageSize: 20, totalCount: 0 })));

    const response = await proxyTripHistoryList(listRequest());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ errorCode: 'trip_history.invalid_response' });
  });

  it('answers 502 for a non-JSON success body', async () => {
    upstream(new Response('<html>gateway</html>', { status: 200 }));

    expect((await proxyTripHistoryList(listRequest())).status).toBe(502);
  });
});

describe('Trip History BFF — detail', () => {
  const call = (kind: string, id: string) =>
    proxyTripDetail(detailRequest(), kind, id);

  it.each([
    ['serviceBooking', '1'],
    ['Itinerary', '1'],
    ['', '1'],
    ['itinerary', '0'],
    ['itinerary', '-1'],
    ['itinerary', 'abc'],
    ['itinerary', '1.5'],
    ['itinerary', '01'],
    ['itinerary', '9223372036854775808'],
    ['itinerary', '1/2'],
    ['itinerary', '..'],
    ['itinerary', '1%2F2'],
    ['../itinerary', '1'],
  ])('rejects kind %j with id %j before any upstream call', async (kind, id) => {
    const response = await call(kind, id);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ errorCode: 'trip_history.invalid_record' });
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('builds the upstream path from the validated kind and id only', async () => {
    upstream(new Response(detailBody));

    const response = await call('itinerary', '45');

    expect(response.status).toBe(200);
    expect(fetchBackendMock.mock.calls[1][0]).toBe('/api/v1/traveler/trips/itinerary/45');
    const body = await response.json();
    expect(body.stops[0].poiId).toBe('9');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('accepts the largest int64 id', async () => {
    upstream(new Response(detailBody));

    await call('commerceBooking', '9223372036854775807');

    expect(fetchBackendMock.mock.calls[1][0]).toBe('/api/v1/traveler/trips/commerceBooking/9223372036854775807');
  });

  it('answers 502 when the detail body breaks the contract', async () => {
    upstream(new Response(JSON.stringify({ kind: 'itinerary', id: 45 })));

    expect((await call('itinerary', '45')).status).toBe(502);
  });

  it('keeps a 404 trip_history.record_not_found', async () => {
    upstream(problem(404, 'trip_history.record_not_found'));

    const response = await call('itinerary', '45');

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ errorCode: 'trip_history.record_not_found' });
  });
});

describe('Trip History BFF — upstream errors', () => {
  it.each([
    [400, 'trip_history.invalid_tab'],
    [400, 'trip_history.invalid_trip_type'],
    [400, 'trip_history.invalid_date_range'],
    [400, 'trip_history.invalid_paging'],
    [400, 'trip_history.invalid_record'],
    [401, 'trip_history.unauthorized'],
    [403, 'trip_history.forbidden'],
  ])('passes %i %s through with only the error code', async (status, errorCode) => {
    upstream(problem(status, errorCode));

    const response = await proxyTripHistoryList(listRequest());

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ errorCode });
  });

  it('maps an unknown 401 to UNAUTHENTICATED and an unknown 403 to FORBIDDEN', async () => {
    upstream(problem(401, null));
    const unauthorized = await proxyTripHistoryList(listRequest());
    expect(unauthorized.status).toBe(401);
    expect(await unauthorized.json()).toEqual({ errorCode: 'UNAUTHENTICATED' });

    upstream(problem(403, 'some.other_code'));
    const forbidden = await proxyTripHistoryList(listRequest());
    expect(forbidden.status).toBe(403);
    expect(await forbidden.json()).toEqual({ errorCode: 'FORBIDDEN' });
  });

  it('reports an unlisted error code as MSG127 and never echoes the upstream body', async () => {
    upstream(problem(500, 'internal.database_exploded'));

    const response = await proxyTripHistoryList(listRequest());

    expect(response.status).toBe(503);
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({ errorCode: 'MSG127' });
    expect(text).not.toContain('SELECT');
    expect(text).not.toContain('database_exploded');
  });

  it('reports a non-JSON error page as MSG127', async () => {
    upstream(new Response('<html>Bad gateway</html>', { status: 502 }));

    const response = await proxyTripHistoryList(listRequest());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ errorCode: 'MSG127' });
  });

  it('keeps an unlisted 4xx as a 4xx MSG127', async () => {
    upstream(problem(404, null));

    const response = await proxyTripHistoryList(listRequest());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ errorCode: 'MSG127' });
  });

  it('answers 503 MSG127 when the backend cannot be reached', async () => {
    fetchBackendMock.mockImplementation(async (path: string) => {
      if (path === REFRESH) return refreshOk();
      throw new TypeError('fetch failed');
    });

    const response = await proxyTripHistoryList(listRequest());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ errorCode: 'MSG127' });
  });

  it('answers 503 MSG127 when the refresh call itself fails', async () => {
    fetchBackendMock.mockRejectedValue(new Error('TRIPMATE_API_BASE_URL must be an absolute backend origin'));

    const response = await proxyTripHistoryList(listRequest());

    expect(response.status).toBe(503);
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({ errorCode: 'MSG127' });
    expect(text).not.toContain('TRIPMATE_API_BASE_URL');
  });

  it('never exposes the access token or the backend address in any response', async () => {
    for (const make of [
      () => new Response(listBody),
      () => problem(500, null),
      () => new Response('nope'),
    ]) {
      upstream(make);
      const text = await (await proxyTripHistoryList(listRequest())).text();
      expect(text).not.toContain('access-token');
      expect(text).not.toContain('refresh-cookie');
      expect(text).not.toMatch(/localhost:5021|https?:\/\/backend/);
    }
  });
});

describe('Trip History route handlers', () => {
  it('GET /api/v1/traveler/trips delegates to the list proxy', async () => {
    upstream(new Response(listBody));

    const response = await getListRoute(listRequest('?tab=Completed'));

    expect(response.status).toBe(200);
    expect((await response.json()).items[0].kind).toBe('itinerary');
  });

  it('GET /api/v1/traveler/trips/[kind]/[id] delegates to the detail proxy with the route params', async () => {
    upstream(new Response(detailBody));

    const response = await getDetailRoute(detailRequest(), {
      params: Promise.resolve({ kind: 'itinerary', id: '45' }),
    });

    expect(response.status).toBe(200);
    expect(fetchBackendMock.mock.calls[1][0]).toBe('/api/v1/traveler/trips/itinerary/45');
  });

  it('the detail handler rejects a bad id from the route params', async () => {
    const response = await getDetailRoute(detailRequest(), {
      params: Promise.resolve({ kind: 'itinerary', id: 'abc' }),
    });

    expect(response.status).toBe(400);
  });

  it('exports GET only', async () => {
    const list = await import('../../../../app/api/v1/traveler/trips/route');
    const detail = await import('../../../../app/api/v1/traveler/trips/[kind]/[id]/route');
    for (const routeModule of [list, detail]) {
      const methods = Object.keys(routeModule).filter((key) => /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(key));
      expect(methods).toEqual(['GET']);
    }
  });
});
