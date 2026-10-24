import { beforeEach, describe, expect, it, vi } from 'vitest';

const { resolveWebSessionMock, fetchBackendMock } = vi.hoisted(() => ({
  resolveWebSessionMock: vi.fn(),
  fetchBackendMock: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/server/webSession', () => ({ resolveWebSession: resolveWebSessionMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import { proxyPayoutRecords } from './payoutRecordsProxy';

function mockSession(role: 'Administrator' | 'Staff' | null, accessToken = 'admin-token') {
  resolveWebSessionMock.mockResolvedValue(role ? { accessToken, role } : null);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSession('Staff');
});

function requestWithQuery(query: string) {
  return new Request(`http://localhost:3000/api/admin/payouts${query}`);
}

describe('payout records proxy', () => {
  it('forwards allow-listed query keys, forces pageSize=20, and ignores browser pageSize', async () => {
    fetchBackendMock.mockResolvedValue(new Response(JSON.stringify({ items: [] }), { status: 200 }));
    const res = await proxyPayoutRecords(requestWithQuery('?keyword=PO-12&status=ApprovedForSettlement&hax=1&pageNumber=2&pageSize=100'));
    expect(res.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/payouts?keyword=PO-12&status=ApprovedForSettlement&pageNumber=2&pageSize=20');
    expect(init.headers.Authorization).toBe('Bearer admin-token');
  });

  it('answers 401 without contacting the backend when there is no web session', async () => {
    mockSession(null);
    const res = await proxyPayoutRecords(requestWithQuery(''));
    expect(res.status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('rejects Administrator before calling the Staff review endpoint', async () => {
    mockSession('Administrator');
    const res = await proxyPayoutRecords(requestWithQuery(''));
    expect(res.status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
    expect(res.headers.getSetCookie()).toHaveLength(0);
  });

  it('answers 401 when upstream rejects the token, without setting cookies', async () => {
    fetchBackendMock.mockResolvedValue(new Response('denied', { status: 401 }));
    const res = await proxyPayoutRecords(requestWithQuery(''));
    expect(res.status).toBe(401);
    expect(res.headers.getSetCookie()).toHaveLength(0);
  });

  it('passes upstream 403 through without setting cookies', async () => {
    fetchBackendMock.mockResolvedValue(new Response('denied', { status: 403 }));
    const res = await proxyPayoutRecords(requestWithQuery(''));
    expect(res.status).toBe(403);
    expect(res.headers.getSetCookie()).toHaveLength(0);
  });

  it('returns only the safe problem title and error code for upstream validation errors', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({
      title: 'The submitted settlement period range is logically invalid.',
      errorCode: 'payout.invalid_period_range',
      detail: 'internal database detail',
      traceId: 'private-trace-id',
    }, { status: 400 }));
    const res = await proxyPayoutRecords(requestWithQuery(''));
    await expect(res.json()).resolves.toEqual({
      title: 'The submitted settlement period range is logically invalid.',
      errorCode: 'payout.invalid_period_range',
    });
  });

  it.each([[502, 503], [500, 503]])('maps upstream %i to %i', async (upstream, expected) => {
    fetchBackendMock.mockResolvedValue(new Response('boom', { status: upstream }));
    const res = await proxyPayoutRecords(requestWithQuery(''));
    expect(res.status).toBe(expected);
  });

  it('maps a backend connection failure to 503', async () => {
    fetchBackendMock.mockRejectedValue(new TypeError('failed'));
    const res = await proxyPayoutRecords(requestWithQuery(''));
    expect(res.status).toBe(503);
  });
});
