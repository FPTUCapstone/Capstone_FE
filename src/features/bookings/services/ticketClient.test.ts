import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEMO_TICKET_VIEW } from '../data/bookingDemoFixtures';
import { ticketMessages } from '../resources/ticketMessages';
import { fetchTicket, refreshTicketQr, TicketClientError } from './ticketClient';

const ticket = {
  ...DEMO_TICKET_VIEW,
  ticketId: '77',
  bookingId: '456',
  isDemo: undefined,
};

function respond(status: number, body: unknown) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  );
}

async function errorOf(promise: Promise<unknown>): Promise<TicketClientError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof TicketClientError) return error;
    throw error;
  }
  throw new Error('expected a TicketClientError');
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('fetchTicket', () => {
  it.each([
    [{ ticketId: '77' }, '/api/v1/traveler/tickets/77'],
    [{ bookingId: '456' }, '/api/v1/traveler/bookings/456/ticket'],
  ])('reads %j from %s without caching', async (key, path) => {
    const fetchMock = respond(200, ticket);
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchTicket(key);

    expect(result.ticketId).toBe('77');
    expect(fetchMock).toHaveBeenCalledWith(path, expect.objectContaining({ method: 'GET', cache: 'no-store' }));
  });

  it.each([
    [401, { errorCode: 'UNAUTHENTICATED' }, 'signIn', ticketMessages.signIn],
    [401, { errorCode: 'ticket.unauthorized' }, 'signIn', ticketMessages.signIn],
    [403, { errorCode: 'ticket.forbidden' }, 'forbidden', ticketMessages.msg126],
    [403, { errorCode: 'FORBIDDEN' }, 'forbidden', ticketMessages.msg126],
    [404, { errorCode: 'ticket.not_found' }, 'notFound', ticketMessages.notFound],
    [409, { errorCode: 'ticket.booking_not_confirmed' }, 'notConfirmed', ticketMessages.msg138],
    [409, { errorCode: 'ticket.not_issued' }, 'system', ticketMessages.msg127],
    [502, { errorCode: 'ticket.invalid_response' }, 'system', ticketMessages.msg127],
    [503, { errorCode: 'MSG127' }, 'system', ticketMessages.msg127],
  ])('maps %s %j to %s', async (status, body, kind, message) => {
    vi.stubGlobal('fetch', respond(status, body));

    const error = await errorOf(fetchTicket({ ticketId: '77' }));

    expect(error.kind).toBe(kind);
    expect(error.message).toBe(message);
    expect(error.status).toBe(status);
  });

  it('reports a network failure as a system error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const error = await errorOf(fetchTicket({ ticketId: '77' }));

    expect(error.kind).toBe('system');
    expect(error.status).toBe(0);
  });

  it('rejects a 200 body that is not a ticket', async () => {
    vi.stubGlobal('fetch', respond(200, { ticketId: 77 }));

    const error = await errorOf(fetchTicket({ ticketId: '77' }));

    expect(error.kind).toBe('system');
  });

  it('rethrows an abort', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')));

    await expect(fetchTicket({ ticketId: '77' })).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('serves the demo ticket only when the environment allows demo fixtures', async () => {
    const fetchMock = respond(200, ticket);
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');

    const demo = await fetchTicket({ ticketId: '77' }, { allowDemo: true });
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'false');
    const real = await fetchTicket({ ticketId: '77' }, { allowDemo: true });

    expect(demo.isDemo).toBe(true);
    expect(real.isDemo).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('never serves the demo ticket in production', async () => {
    const fetchMock = respond(200, ticket);
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');
    vi.stubEnv('NODE_ENV', 'production');

    const result = await fetchTicket({ ticketId: '77' }, { allowDemo: true });

    expect(result.isDemo).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('refreshTicketQr', () => {
  it('posts to the refresh route and returns the new ticket', async () => {
    const fetchMock = respond(200, { ...ticket, qr: { content: 'TM1.new.sig', issuedAtUtc: '2026-10-30T00:40:00+00:00' } });
    vi.stubGlobal('fetch', fetchMock);

    const result = await refreshTicketQr('77');

    expect(result.qr?.content).toBe('TM1.new.sig');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/traveler/tickets/77/qr-code/refresh',
      expect.objectContaining({ method: 'POST', cache: 'no-store' }),
    );
  });

  it('carries the current status of ticket.not_refreshable', async () => {
    vi.stubGlobal('fetch', respond(409, { errorCode: 'ticket.not_refreshable', ticketStatus: 'Used' }));

    const error = await errorOf(refreshTicketQr('77'));

    expect(error.kind).toBe('notRefreshable');
    expect(error.ticketStatus).toBe('Used');
  });

  it('rotates the demo QR without a network call', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');

    const first = await refreshTicketQr(DEMO_TICKET_VIEW.ticketId, { allowDemo: true });
    const second = await refreshTicketQr(DEMO_TICKET_VIEW.ticketId, { allowDemo: true });

    expect(first.qr?.content).not.toBe(DEMO_TICKET_VIEW.qr?.content);
    expect(second.qr?.content).not.toBe(first.qr?.content);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
