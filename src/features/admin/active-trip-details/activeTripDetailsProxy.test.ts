import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { resolveWebSessionMock, fetchBackendMock } = vi.hoisted(() => ({
  resolveWebSessionMock: vi.fn(),
  fetchBackendMock: vi.fn(),
}));
vi.mock('@/lib/server/webSession', () => ({ resolveWebSession: resolveWebSessionMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import { proxyActiveTripDetails } from './activeTripDetailsProxy';

beforeEach(() => {
  resolveWebSessionMock.mockResolvedValue({ accessToken: 'admin-token', role: 'Administrator' });
});
afterEach(() => vi.clearAllMocks());

describe('active trip details proxy', () => {
  it('forwards the admin cookie bearer for a valid id', async () => {
    fetchBackendMock.mockResolvedValue(new Response(JSON.stringify({ tripId: '42' }), { status: 200 }));
    const res = await proxyActiveTripDetails('42');
    expect(res.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/trips/active/42');
    expect(init.headers.Authorization).toBe('Bearer admin-token');
  });

  it.each(['0', '-1', '1abc', '1.5', '1e3', '+1', ' 1', '01', '', '9223372036854775808'])(
    'answers 400 without contacting the backend for %s',
    async id => {
      const res = await proxyActiveTripDetails(id);
      expect(res.status).toBe(400);
      expect(fetchBackendMock).not.toHaveBeenCalled();
    });

  it('answers 401 without contacting the backend when there is no web session', async () => {
    resolveWebSessionMock.mockResolvedValue(null);
    const res = await proxyActiveTripDetails('42');
    expect(res.status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it.each([401, 403])('passes upstream %i through without setting cookies', async status => {
    fetchBackendMock.mockResolvedValue(new Response('denied', { status }));
    const res = await proxyActiveTripDetails('42');
    expect(res.status).toBe(status);
    expect(res.headers.getSetCookie()).toEqual([]);
  });

  it.each([[500, 503], [502, 503]])('maps upstream %i to %i', async (upstream, expected) => {
    fetchBackendMock.mockResolvedValue(new Response('boom', { status: upstream }));
    const res = await proxyActiveTripDetails('42');
    expect(res.status).toBe(expected);
  });

  it('maps a backend connection failure to 503', async () => {
    fetchBackendMock.mockRejectedValue(new TypeError('failed'));
    const res = await proxyActiveTripDetails('42');
    expect(res.status).toBe(503);
  });
});
