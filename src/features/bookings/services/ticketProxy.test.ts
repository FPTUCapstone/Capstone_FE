// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  fetchBackendMock: vi.fn(),
}));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import { GET as getBookingTicketRoute } from '../../../../app/api/v1/traveler/bookings/[bookingId]/ticket/route';
import { POST as refreshRoute } from '../../../../app/api/v1/traveler/tickets/[ticketId]/qr-code/refresh/route';
import { GET as getTicketRoute } from '../../../../app/api/v1/traveler/tickets/[ticketId]/route';
import { proxyGetBookingTicket, proxyGetTicket, proxyRefreshTicketQr } from './ticketProxy';

const REFRESH = '/api/v1/auth/web/refresh';

const ticketBody = JSON.stringify({
  ticketId: 77,
  ticketCode: 'TK-0000000456',
  bookingId: 456,
  bookingCode: 'BK-20261017-00001',
  ticketStatus: 'Valid',
  tour: { tourId: 45, title: 'Hoi An Lantern Tour' },
  operatorName: 'Hoi An Travel Co.',
  schedule: { startAtUtc: '2026-10-30T01:00:00+00:00', endAtUtc: '2026-10-30T10:00:00+00:00', meetingPoint: null },
  participantCount: 1,
  participants: { adult: 1, child: 0, infant: 0 },
  validity: {
    departureDate: '2026-10-30',
    timeZone: 'Asia/Ho_Chi_Minh',
    validFromUtc: '2026-10-29T17:00:00+00:00',
    validUntilUtc: '2026-10-30T16:59:59.9999999+00:00',
  },
  checkedInAtUtc: null,
  qr: { content: 'TM1.token.signature', issuedAtUtc: '2026-10-24T08:15:00+00:00' },
  internalNote: 'must not leak',
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

const request = (method = 'GET') => new Request('http://localhost:3000/api/v1/traveler/tickets/1', { method });

beforeEach(() => {
  vi.clearAllMocks();
  cookiesMock.mockResolvedValue({ get: () => ({ value: 'refresh-cookie' }) });
});

describe('ticket proxy', () => {
  it.each([
    ['GET ticket', () => proxyGetTicket(request(), '77'), '/api/v1/traveler/tickets/77', 'GET'],
    ['GET booking ticket', () => proxyGetBookingTicket(request(), '456'), '/api/v1/traveler/bookings/456/ticket', 'GET'],
    ['POST refresh', () => proxyRefreshTicketQr(request('POST'), '77'), '/api/v1/traveler/tickets/77/qr-code/refresh', 'POST'],
  ])('%s forwards to the exact Backend path with the Traveler token', async (_label, call, path, method) => {
    upstream(new Response(ticketBody, { status: 200 }));

    const response = await call();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const forwarded = fetchBackendMock.mock.calls.find(([calledPath]) => calledPath === path);
    expect(forwarded?.[1]).toMatchObject({ method, headers: { Authorization: 'Bearer access-token' } });
    const body = await response.json();
    expect(body.ticketId).toBe('77');
    expect(body.qr.content).toBe('TM1.token.signature');
    expect(body).not.toHaveProperty('internalNote');
  });

  it.each(['0', '-1', 'abc', '9223372036854775808', ''])(
    'rejects id %j with ticket.not_found and no upstream call',
    async (id) => {
      for (const response of [
        await proxyGetTicket(request(), id),
        await proxyGetBookingTicket(request(), id),
        await proxyRefreshTicketQr(request('POST'), id),
      ]) {
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ errorCode: 'ticket.not_found' });
      }
      expect(fetchBackendMock).not.toHaveBeenCalled();
    },
  );

  it('answers 401 without an upstream ticket call when there is no refresh cookie', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });

    const response = await proxyGetTicket(request(), '77');

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ errorCode: 'UNAUTHENTICATED' });
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('answers 401 for a non-Traveler session', async () => {
    fetchBackendMock.mockImplementation(async () => refreshOk('TourOperator'));

    const response = await proxyGetTicket(request(), '77');

    expect(response.status).toBe(401);
    expect(fetchBackendMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    [403, 'ticket.forbidden'],
    [404, 'ticket.not_found'],
    [409, 'ticket.booking_not_confirmed'],
    [409, 'ticket.not_issued'],
  ])('passes the reviewed code %s %s through without server text', async (status, code) => {
    upstream(problem(status, code));

    const response = await proxyGetTicket(request(), '77');

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ errorCode: code });
  });

  it('keeps the ticketStatus of ticket.not_refreshable', async () => {
    upstream(problem(409, 'ticket.not_refreshable', { ticketStatus: 'Used' }));

    const response = await proxyRefreshTicketQr(request('POST'), '77');

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ errorCode: 'ticket.not_refreshable', ticketStatus: 'Used' });
  });

  it('drops an unknown ticketStatus on ticket.not_refreshable', async () => {
    upstream(problem(409, 'ticket.not_refreshable', { ticketStatus: '<script>' }));

    const response = await proxyRefreshTicketQr(request('POST'), '77');

    expect(await response.json()).toEqual({ errorCode: 'ticket.not_refreshable' });
  });

  it.each([
    [problem(401, null), 401, 'UNAUTHENTICATED'],
    [problem(403, null), 403, 'FORBIDDEN'],
    [problem(500, 'internal.failure'), 503, 'MSG127'],
    [problem(409, 'booking.cancellation.window_closed'), 409, 'MSG127'],
    [new Response('<html>gateway</html>', { status: 502 }), 503, 'MSG127'],
  ])('maps other upstream failures to a safe code (%#)', async (upstreamResponse, status, code) => {
    upstream(upstreamResponse);

    const response = await proxyGetTicket(request(), '77');

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ errorCode: code });
  });

  it('answers 502 ticket.invalid_response for a body that breaks the contract', async () => {
    upstream(new Response('{"ticketId":77}', { status: 200 }));

    const response = await proxyGetTicket(request(), '77');

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ errorCode: 'ticket.invalid_response' });
  });

  it('answers 503 MSG127 when the Backend cannot be reached', async () => {
    fetchBackendMock.mockImplementation(async (path: string) => {
      if (path === REFRESH) return refreshOk();
      throw new TypeError('fetch failed');
    });

    const response = await proxyGetTicket(request(), '77');

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ errorCode: 'MSG127' });
  });
});

describe('ticket route handlers', () => {
  it('wire each route to its Backend path', async () => {
    upstream(new Response(ticketBody, { status: 200 }));

    await getTicketRoute(request(), { params: Promise.resolve({ ticketId: '77' }) });
    await getBookingTicketRoute(request(), { params: Promise.resolve({ bookingId: '456' }) });
    await refreshRoute(request('POST'), { params: Promise.resolve({ ticketId: '77' }) });

    const paths = fetchBackendMock.mock.calls.map(([path]) => path).filter((path) => path !== REFRESH);
    expect(paths).toEqual([
      '/api/v1/traveler/tickets/77',
      '/api/v1/traveler/bookings/456/ticket',
      '/api/v1/traveler/tickets/77/qr-code/refresh',
    ]);
  });
});
