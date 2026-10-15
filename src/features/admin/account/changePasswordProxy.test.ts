import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock } = vi.hoisted(() => ({ cookiesMock: vi.fn(), fetchBackendMock: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';
import { proxyAdminChangePassword } from './changePasswordProxy';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');
const UPSTREAM = '/api/v1/auth/web/change-password';
const SAME_ORIGIN = 'http://localhost:3000';
const ROUTE_URL = `${SAME_ORIGIN}/api/admin/account/security/change-password`;

function cookieJar(token?: string, role: 'Administrator' | 'Staff' = 'Administrator', includeSeal = true) {
  const sealed =
    token && includeSeal
      ? createAdminSessionSeal({
          token,
          role,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          secret: TEST_SECRET,
        })
      : null;
  return {
    get: (name: string) => {
      if (name === ADMIN_ACCESS_TOKEN_COOKIE && token) return { value: token };
      if (name === ADMIN_SESSION_SEAL_COOKIE && sealed) return { value: sealed.seal };
      return undefined;
    },
  };
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

let priorSecret: string | undefined;

beforeEach(() => {
  priorSecret = process.env[ADMIN_SESSION_SECRET_ENV];
  process.env[ADMIN_SESSION_SECRET_ENV] = TEST_SECRET;
  cookiesMock.mockResolvedValue(cookieJar('admin-token'));
});

afterEach(() => {
  vi.clearAllMocks();
  if (priorSecret === undefined) {
    delete process.env[ADMIN_SESSION_SECRET_ENV];
  } else {
    process.env[ADMIN_SESSION_SECRET_ENV] = priorSecret;
  }
});

describe('admin change-password proxy', () => {
  it('rejects a cross-origin request before touching the backend', async () => {
    const res = await proxyAdminChangePassword(jsonRequest({ origin: 'https://evil.example.com' }));
    expect(res.status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('returns 401 without touching the backend when the admin cookie or BFF seal is missing', async () => {
    cookiesMock.mockResolvedValue(cookieJar(undefined));
    const res = await proxyAdminChangePassword(jsonRequest());
    expect(res.status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('forwards the admin cookie bearer to the upstream endpoint with only the allow-listed fields', async () => {
    fetchBackendMock.mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, data: { accessToken: 'next-token', accessTokenExpiresAtUtc: new Date(Date.now() + 5 * 60 * 1000).toISOString() } }),
        { status: 200 },
      ),
    );

    const res = await proxyAdminChangePassword(jsonRequest());

    expect(res.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe(UPSTREAM);
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer admin-token');
    expect(JSON.parse(init.body)).toEqual({ currentPassword: 'Current1!', newPassword: 'New2@aaaa' });
  });

  it('re-seals the admin session cookie with the replacement access token on success', async () => {
    const expiresAtUtc = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    fetchBackendMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { accessToken: 'next-token', accessTokenExpiresAtUtc: expiresAtUtc } }), { status: 200 }),
    );

    const res = await proxyAdminChangePassword(jsonRequest());

    const setCookies = res.headers.getSetCookie?.() ?? [res.headers.get('set-cookie') ?? ''];
    expect(setCookies.some((c) => c.startsWith(`${ADMIN_ACCESS_TOKEN_COOKIE}=next-token`))).toBe(true);
  });

  it('clears the admin session and returns 401 when the upstream rejects the bearer token', async () => {
    fetchBackendMock.mockResolvedValue(new Response(null, { status: 401 }));

    const res = await proxyAdminChangePassword(jsonRequest());

    expect(res.status).toBe(401);
    const setCookies = res.headers.getSetCookie?.() ?? [];
    expect(setCookies.some((c) => c.startsWith(`${ADMIN_ACCESS_TOKEN_COOKIE}=;`))).toBe(true);
  });

  it('forwards a 400 MSG17/MSG05 business failure as-is without touching the session', async () => {
    fetchBackendMock.mockResolvedValue(
      new Response(JSON.stringify({ errorCode: 'MSG17', title: 'Current password does not match our records.' }), { status: 400 }),
    );

    const res = await proxyAdminChangePassword(jsonRequest());

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ errorCode: 'MSG17' });
    expect(res.headers.getSetCookie?.() ?? []).toHaveLength(0);
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
