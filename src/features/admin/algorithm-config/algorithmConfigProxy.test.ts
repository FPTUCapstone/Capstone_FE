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
import { proxyAlgorithmParameters } from './algorithmConfigProxy';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');
const values = { bufferTimeMinutes: 15, defaultTravelSpeedKmh: 30, reroutingSearchRadiusKm: 5, weatherAlertThresholdSeverity: 'Severe' };
const dto = { ...values, updatedAtUtc: '2026-09-21T02:00:00Z', updatedAtLocal: '21/09/2026 09:00:00' };
const UPSTREAM = '/api/v1/admin/system-configs/algorithm-parameters';
const SAME_ORIGIN = 'http://localhost:3000';
const ROUTE_URL = `${SAME_ORIGIN}/api/admin/system-configs/algorithm-parameters`;

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

function jsonRequest(method: 'GET' | 'PUT', init: { origin?: string; token?: string; body?: string; contentType?: string } = {}) {
  const headers: Record<string, string> = {};
  if (init.origin) headers.origin = init.origin;
  if (init.contentType) headers['content-type'] = init.contentType;
  return new Request(ROUTE_URL, { method, headers, body: method === 'PUT' ? init.body : undefined });
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

describe('algorithm parameters proxy', () => {
 it('forwards the admin cookie bearer to the upstream GET and passes the DTO through', async () => {
  fetchBackendMock.mockResolvedValue(new Response(JSON.stringify(dto), { status: 200, headers: { 'content-type': 'application/json' } }));
  const res = await proxyAlgorithmParameters(jsonRequest('GET'));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual(dto);
  const [path, init] = fetchBackendMock.mock.calls[0];
  expect(path).toBe(UPSTREAM);
  expect(init.method).toBe('GET');
  expect(init.headers.Authorization).toBe('Bearer admin-token');
 });

 it('returns 401 without touching the backend when the admin cookie or BFF seal is missing', async () => {
  cookiesMock.mockResolvedValue(cookieJar(undefined));
  const res = await proxyAlgorithmParameters(jsonRequest('GET'));
  expect(res.status).toBe(401);
  expect(fetchBackendMock).not.toHaveBeenCalled();

  cookiesMock.mockResolvedValue(cookieJar('unsealed-token', 'Administrator', false));
  const unsealedRes = await proxyAlgorithmParameters(jsonRequest('GET'));
  expect(unsealedRes.status).toBe(401);
  expect(fetchBackendMock).not.toHaveBeenCalled();
 });

 it('returns 403 for a Staff session without touching the backend and without clearing session cookies', async () => {
  cookiesMock.mockResolvedValue(cookieJar('staff-token', 'Staff'));
  const res = await proxyAlgorithmParameters(jsonRequest('GET'));
  expect(res.status).toBe(403);
  expect(fetchBackendMock).not.toHaveBeenCalled();
  expect(res.headers.getSetCookie()).toEqual([]);
 });

 it('forwards the PUT body of a same-origin JSON request', async () => {
  fetchBackendMock.mockResolvedValue(new Response(JSON.stringify(dto), { status: 200 }));
  const res = await proxyAlgorithmParameters(jsonRequest('PUT', { origin: SAME_ORIGIN, body: JSON.stringify(values), contentType: 'application/json' }));
  expect(res.status).toBe(200);
  const [, init] = fetchBackendMock.mock.calls[0];
  expect(init.method).toBe('PUT');
  expect(init.headers.Authorization).toBe('Bearer admin-token');
  expect(JSON.parse(init.body)).toEqual(values);
 });

 it('rejects a PUT without an origin header', async () => {
  const res = await proxyAlgorithmParameters(jsonRequest('PUT', { body: JSON.stringify(values), contentType: 'application/json' }));
  expect(res.status).toBe(403);
  expect(fetchBackendMock).not.toHaveBeenCalled();
 });

 it('rejects a cross-origin PUT', async () => {
  const res = await proxyAlgorithmParameters(jsonRequest('PUT', { origin: 'http://evil.example', body: JSON.stringify(values), contentType: 'application/json' }));
  expect(res.status).toBe(403);
  expect(fetchBackendMock).not.toHaveBeenCalled();
 });

 it('requires JSON content for PUT', async () => {
  const res = await proxyAlgorithmParameters(jsonRequest('PUT', { origin: SAME_ORIGIN, body: 'buffer=15', contentType: 'text/plain' }));
  expect(res.status).toBe(415);
  expect(fetchBackendMock).not.toHaveBeenCalled();
 });

 it('rejects malformed PUT JSON before contacting the backend', async () => {
  const res = await proxyAlgorithmParameters(jsonRequest('PUT', { origin: SAME_ORIGIN, body: '{not-json', contentType: 'application/json' }));
  expect(res.status).toBe(400);
  expect(fetchBackendMock).not.toHaveBeenCalled();
 });

 it('clears the admin session cookies when upstream answers 401 and preserves session when upstream answers 403', async () => {
  fetchBackendMock.mockResolvedValueOnce(new Response(JSON.stringify({ title: 'denied' }), { status: 401 }));
  const unauthRes = await proxyAlgorithmParameters(jsonRequest('GET'));
  expect(unauthRes.status).toBe(401);
  const cookies = unauthRes.headers.getSetCookie();
  expect(cookies.some(c => c.startsWith('tripmate_admin_access_token=') && c.includes('Max-Age=0'))).toBe(true);
  expect(cookies.some(c => c.startsWith('tripmate_admin_session_seal=') && c.includes('Max-Age=0'))).toBe(true);

  fetchBackendMock.mockResolvedValueOnce(new Response(JSON.stringify({ title: 'forbidden' }), { status: 403 }));
  const forbiddenRes = await proxyAlgorithmParameters(jsonRequest('GET'));
  expect(forbiddenRes.status).toBe(403);
  expect(forbiddenRes.headers.getSetCookie()).toEqual([]);
 });

 it.each([[502, 503], [500, 503]])('maps upstream %i to %i', async (upstream, expected) => {
  fetchBackendMock.mockResolvedValue(new Response('boom', { status: upstream }));
  const res = await proxyAlgorithmParameters(jsonRequest('GET'));
  expect(res.status).toBe(expected);
 });

 it('maps a backend connection failure to 503', async () => {
  fetchBackendMock.mockRejectedValue(new TypeError('failed'));
  const res = await proxyAlgorithmParameters(jsonRequest('GET'));
  expect(res.status).toBe(503);
 });
});
