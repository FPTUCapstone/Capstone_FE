import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock, verifyAdminSessionMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  fetchBackendMock: vi.fn(),
  verifyAdminSessionMock: vi.fn(),
}));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));
vi.mock('@/lib/server/adminSession', () => ({
  ADMIN_ACCESS_TOKEN_COOKIE: 'tripmate_admin_access_token',
  clearAdminSession: (response: Response) => response,
  jsonNoStore: (body: unknown, status = 200) => Response.json(body, { status }),
  verifyAdminSessionFromCookies: verifyAdminSessionMock,
}));

import { proxyActiveTripDetails } from './activeTripDetailsProxy';

beforeEach(() => {
  cookiesMock.mockResolvedValue({ get: (name: string) => (name === 'tripmate_admin_access_token' ? { value: 'admin-token' } : undefined) });
  verifyAdminSessionMock.mockReturnValue({ role: 'Staff' });
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

  it('answers 401 without contacting the backend when the cookie is missing', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    verifyAdminSessionMock.mockReturnValue(null);
    const res = await proxyActiveTripDetails('42');
    expect(res.status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it.each([401, 403])('maps an upstream authorization result %i', async status => {
    fetchBackendMock.mockResolvedValue(new Response('denied', { status }));
    const res = await proxyActiveTripDetails('42');
    expect(res.status).toBe(status);
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
