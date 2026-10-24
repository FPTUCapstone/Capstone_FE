import { beforeEach, describe, expect, it, vi } from 'vitest';

const { resolveWebSessionMock, fetchBackendMock } = vi.hoisted(() => ({
  resolveWebSessionMock: vi.fn(),
  fetchBackendMock: vi.fn(),
}));
vi.mock('@/lib/server/webSession', () => ({
  WEB_REFRESH_COOKIE: 'tripmate_refresh',
  resolveWebSession: resolveWebSessionMock,
}));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import { proxyAdminChangePassword } from './changePasswordProxy';

const UPSTREAM = '/api/v1/auth/web/change-password';
const SAME_ORIGIN = 'http://localhost:3000';
const ROUTE_URL = `${SAME_ORIGIN}/api/admin/account/security/change-password`;

function mockSession(role: 'Administrator' | 'Staff' | null, accessToken = 'admin-token') {
  resolveWebSessionMock.mockResolvedValue(role ? { accessToken, role } : null);
}

function jsonRequest(init: { origin?: string; body?: unknown; contentType?: string } = {}) {
  const headers: Record<string, string> = {
    'content-type': init.contentType ?? 'application/json',
  };
  if (init.origin !== undefined) headers.origin = init.origin;
  else headers.origin = SAME_ORIGIN;
  return new Request(ROUTE_URL, {
    method: 'POST',
    headers,
    body: init.body === undefined ? JSON.stringify({ currentPassword: 'Current1!', newPassword: 'New2@aaaa' }) : JSON.stringify(init.body),
  });
}

function successReply(setCookie?: string) {
  const headers: Record<string, string> = {};
  if (setCookie) headers['Set-Cookie'] = setCookie;
  return new Response(
    JSON.stringify({ success: true, data: { accessToken: 'next-token', accessTokenExpiresAtUtc: new Date(Date.now() + 5 * 60 * 1000).toISOString() } }),
    { status: 200, headers },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSession('Administrator');
});

describe('admin change-password proxy', () => {
  it('rejects a cross-origin request before touching the backend', async () => {
    const res = await proxyAdminChangePassword(jsonRequest({ origin: 'https://evil.example.com' }));
    expect(res.status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('forwards a Staff session to the backend with the resolved bearer', async () => {
    mockSession('Staff', 'staff-token');
    fetchBackendMock.mockResolvedValue(successReply());

    const res = await proxyAdminChangePassword(jsonRequest());

    expect(res.status).toBe(200);
    expect(fetchBackendMock).toHaveBeenCalledOnce();
    expect(fetchBackendMock.mock.calls[0]?.[1]).toMatchObject({
      headers: expect.objectContaining({ Authorization: 'Bearer staff-token' }),
    });
  });

  it('returns 401 without touching the backend when there is no web session', async () => {
    mockSession(null);
    const res = await proxyAdminChangePassword(jsonRequest());
    expect(res.status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('forwards the bearer to the upstream endpoint with only the allow-listed fields', async () => {
    fetchBackendMock.mockResolvedValue(successReply());

    const res = await proxyAdminChangePassword(jsonRequest());

    expect(res.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe(UPSTREAM);
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer admin-token');
    expect(JSON.parse(init.body)).toEqual({ currentPassword: 'Current1!', newPassword: 'New2@aaaa' });
  });

  it('forwards the backend replacement refresh cookie and sets no admin cookie on success', async () => {
    fetchBackendMock.mockResolvedValue(successReply('tripmate_refresh=new-refresh-value; Path=/; HttpOnly; SameSite=Lax'));

    const res = await proxyAdminChangePassword(jsonRequest());

    expect(res.status).toBe(200);
    const setCookies = res.headers.getSetCookie();
    expect(setCookies).toEqual(['tripmate_refresh=new-refresh-value; Path=/; HttpOnly; SameSite=Lax']);
    expect(setCookies.some((c) => c.startsWith('tripmate_admin_'))).toBe(false);
  });

  it('succeeds without setting cookies when the backend returns no replacement refresh cookie', async () => {
    fetchBackendMock.mockResolvedValue(successReply());

    const res = await proxyAdminChangePassword(jsonRequest());

    expect(res.status).toBe(200);
    expect(res.headers.getSetCookie()).toEqual([]);
  });

  it('answers 401 when the upstream rejects the bearer token, without setting cookies', async () => {
    fetchBackendMock.mockResolvedValue(new Response(null, { status: 401 }));

    const res = await proxyAdminChangePassword(jsonRequest());

    expect(res.status).toBe(401);
    expect(res.headers.getSetCookie()).toEqual([]);
  });

  it('forwards a 400 MSG17 business failure as-is without setting cookies', async () => {
    fetchBackendMock.mockResolvedValue(
      new Response(JSON.stringify({ errorCode: 'MSG17', title: 'Current password does not match our records.' }), { status: 400 }),
    );

    const res = await proxyAdminChangePassword(jsonRequest());

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ errorCode: 'MSG17' });
    expect(res.headers.getSetCookie()).toEqual([]);
  });

  it('returns 503 when the backend cannot be reached', async () => {
    fetchBackendMock.mockRejectedValue(new TypeError('network'));

    const res = await proxyAdminChangePassword(jsonRequest());

    expect(res.status).toBe(503);
  });

  it('rejects a malformed request body before calling the backend', async () => {
    const res = await proxyAdminChangePassword(jsonRequest({ body: { currentPassword: '' } }));

    expect(res.status).toBe(400);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });
});
