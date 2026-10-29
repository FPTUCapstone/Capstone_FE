import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  fetchBackendMock: vi.fn(),
}));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import { proxyOperatorBookings } from './operatorBookingProxy';

const origin = 'https://tripmate.test';
const request = (search = '') => new Request(`${origin}/api/operator/bookings${search}`);
const authorize = (role = 'TourOperator') =>
  fetchBackendMock.mockResolvedValueOnce(Response.json({ data: { accessToken: 'access-token', role } }));

describe('proxyOperatorBookings (UC-40 BFF)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    cookiesMock.mockResolvedValue({ get: () => ({ value: 'refresh-token' }) });
  });

  describe('authentication', () => {
    it('answers 401 UNAUTHENTICATED without calling the backend when there is no refresh cookie', async () => {
      cookiesMock.mockResolvedValue({ get: () => undefined });

      const response = await proxyOperatorBookings(request());

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ errorCode: 'UNAUTHENTICATED' });
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(fetchBackendMock).not.toHaveBeenCalled();
    });

    it.each([
      ['a Traveler session', { data: { accessToken: 'access-token', role: 'Traveler' } }],
      ['a session without a token', { data: { role: 'TourOperator' } }],
      ['an empty body', {}],
      ['no body', null],
    ])('answers 401 and never dispatches the booking request for %s', async (_label, context) => {
      fetchBackendMock.mockResolvedValueOnce(Response.json(context));

      const response = await proxyOperatorBookings(request());

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ errorCode: 'UNAUTHENTICATED' });
      expect(fetchBackendMock).toHaveBeenCalledTimes(1);
    });

    it('answers 401 when the refresh call is rejected by the backend', async () => {
      fetchBackendMock.mockResolvedValueOnce(Response.json({ errorCode: 'AUTH_TOKEN_INVALID' }, { status: 401 }));

      const response = await proxyOperatorBookings(request());

      expect(response.status).toBe(401);
      expect(fetchBackendMock).toHaveBeenCalledTimes(1);
    });

    it('exchanges the refresh cookie for a bearer token with the same call as the other operator proxies', async () => {
      authorize();
      fetchBackendMock.mockResolvedValueOnce(Response.json({ items: [] }));

      await proxyOperatorBookings(request());

      expect(fetchBackendMock).toHaveBeenNthCalledWith(
        1,
        '/api/v1/auth/web/refresh',
        expect.objectContaining({
          method: 'POST',
          headers: { Cookie: 'tripmate_refresh=refresh-token' },
        })
      );
    });
  });

  describe('list', () => {
    it('forwards the bearer token to the BE list endpoint', async () => {
      authorize();
      fetchBackendMock.mockResolvedValueOnce(Response.json({ items: [] }));

      await proxyOperatorBookings(request());

      expect(fetchBackendMock).toHaveBeenNthCalledWith(
        2,
        '/api/v1/operator/bookings',
        expect.objectContaining({ headers: { Authorization: 'Bearer access-token' } })
      );
    });

    it('forwards only the whitelisted query keys and drops everything else', async () => {
      authorize();
      fetchBackendMock.mockResolvedValueOnce(Response.json({ items: [] }));

      await proxyOperatorBookings(
        request(
          '?tourId=7&scheduleId=9&status=Confirmed&paymentStatus=Paid&departureFrom=2026-11-01&departureTo=2026-11-30' +
            '&keyword=alice&pageNumber=2&pageSize=20&operatorUserId=999&admin=true&__proto__=x'
        )
      );

      const forwarded = fetchBackendMock.mock.calls[1][0] as string;
      const query = new URL(forwarded, origin).searchParams;
      expect(Object.fromEntries(query.entries())).toEqual({
        tourId: '7',
        scheduleId: '9',
        status: 'Confirmed',
        paymentStatus: 'Paid',
        departureFrom: '2026-11-01',
        departureTo: '2026-11-30',
        keyword: 'alice',
        pageNumber: '2',
        pageSize: '20',
      });
      expect(forwarded).not.toContain('operatorUserId');
    });

    it('drops empty values and encodes the keyword safely', async () => {
      authorize();
      fetchBackendMock.mockResolvedValueOnce(Response.json({ items: [] }));

      await proxyOperatorBookings(request('?status=&keyword=a%26b%3Dc%20d&tourId='));

      const forwarded = fetchBackendMock.mock.calls[1][0] as string;
      expect(forwarded).toBe('/api/v1/operator/bookings?keyword=a%26b%3Dc+d');
    });

    it('passes the BE status and body through and marks the response no-store', async () => {
      authorize();
      const data = { pageNumber: 1, totalCount: 0, items: [] };
      fetchBackendMock.mockResolvedValueOnce(Response.json(data, { status: 200 }));

      const response = await proxyOperatorBookings(request());

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(data);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    it.each([
      [400, { errorCode: 'operator_booking.invalid_date_range' }],
      [403, { errorCode: 'operator_tour.access_required' }],
      [403, { errorCode: 'operator_booking.forbidden' }],
    ])('keeps the BE %i answer and its errorCode', async (status, body) => {
      authorize();
      fetchBackendMock.mockResolvedValueOnce(Response.json(body, { status }));

      const response = await proxyOperatorBookings(request('?departureFrom=2026-11-05&departureTo=2026-11-04'));

      expect(response.status).toBe(status);
      expect(await response.json()).toEqual(body);
    });
  });

  describe('detail', () => {
    it('requests /api/v1/operator/bookings/{id} for a numeric id', async () => {
      authorize();
      fetchBackendMock.mockResolvedValueOnce(Response.json({ bookingId: '1201' }));

      const response = await proxyOperatorBookings(request(), '1201');

      expect(response.status).toBe(200);
      expect(fetchBackendMock.mock.calls[1][0]).toBe('/api/v1/operator/bookings/1201');
    });

    it('does not forward the incoming query to the detail endpoint', async () => {
      authorize();
      fetchBackendMock.mockResolvedValueOnce(Response.json({ bookingId: '1201' }));

      await proxyOperatorBookings(request('?status=Confirmed'), '1201');

      expect(fetchBackendMock.mock.calls[1][0]).toBe('/api/v1/operator/bookings/1201');
    });

    it.each(['abc', '12a', '../payouts', '1/refund', '12%2F3', '', '-1', '1.5', ' 7'])(
      'answers 400 INVALID_BOOKING_ID for %j before any cookie or backend access',
      async (bookingId) => {
        const response = await proxyOperatorBookings(request(), bookingId);

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ errorCode: 'INVALID_BOOKING_ID' });
        expect(cookiesMock).not.toHaveBeenCalled();
        expect(fetchBackendMock).not.toHaveBeenCalled();
      }
    );

    it.each([
      [403, { errorCode: 'operator_booking.forbidden' }],
      [404, { errorCode: 'operator_booking.not_found' }],
    ])('keeps the BE %i answer', async (status, body) => {
      authorize();
      fetchBackendMock.mockResolvedValueOnce(Response.json(body, { status }));

      const response = await proxyOperatorBookings(request(), '5');

      expect(response.status).toBe(status);
      expect(await response.json()).toEqual(body);
    });
  });

  describe('failures', () => {
    it('answers 503 MSG127 without leaking the upstream error when the backend is unreachable', async () => {
      authorize();
      fetchBackendMock.mockRejectedValueOnce(new Error('private upstream detail http://10.0.0.5'));

      const response = await proxyOperatorBookings(request());

      expect(response.status).toBe(503);
      const text = JSON.stringify(await response.json());
      expect(text).toContain('MSG127');
      expect(text).not.toContain('10.0.0.5');
    });

    it('answers 503 MSG127 when the refresh call fails at the network level', async () => {
      fetchBackendMock.mockRejectedValueOnce(new Error('down'));

      const response = await proxyOperatorBookings(request());

      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ errorCode: 'MSG127' });
    });

    it('answers 502 MSG127 when a successful BE answer is not JSON', async () => {
      authorize();
      fetchBackendMock.mockResolvedValueOnce(new Response('<html>oops</html>', { status: 200 }));

      const response = await proxyOperatorBookings(request());

      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ errorCode: 'MSG127' });
    });

    it('never puts the bearer token in the response', async () => {
      authorize();
      fetchBackendMock.mockResolvedValueOnce(Response.json({ items: [] }));

      const response = await proxyOperatorBookings(request());

      expect(await response.text()).not.toContain('access-token');
      expect([...response.headers.entries()].join('|')).not.toContain('access-token');
    });
  });
});
