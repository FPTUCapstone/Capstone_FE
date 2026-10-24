import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock } = vi.hoisted(() => ({ cookiesMock: vi.fn(), fetchBackendMock: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));
vi.mock('@/lib/server/adminSession', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/server/adminSession')>();
  return { ...actual, verifyAdminSessionFromCookies: vi.fn(actual.verifyAdminSessionFromCookies) };
});

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
  verifyAdminSessionFromCookies,
} from '@/lib/server/adminSession';
import { proxyLandingContent } from './landingContentProxy';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');
const UPSTREAM = '/api/v1/admin/landing-content';
const SAME_ORIGIN = 'http://localhost:3000';
const ROUTE_URL = `${SAME_ORIGIN}/api/admin/landing-content`;

function cookieJar(token?: string, role: 'Administrator' | 'Staff' = 'Administrator') {
  const sealed = token
    ? createAdminSessionSeal({ token, role, expiresAt: new Date(Date.now() + 10 * 60 * 1000), secret: TEST_SECRET })
    : null;
  return {
    get: (name: string) => {
      if (name === ADMIN_ACCESS_TOKEN_COOKIE && token) return { value: token };
      if (name === ADMIN_SESSION_SEAL_COOKIE && sealed) return { value: sealed.seal };
      return undefined;
    },
  };
}

function makeRequest(
  method: 'GET' | 'PUT' | 'POST',
  init: { origin?: string; body?: BodyInit; contentType?: string } = {},
) {
  const headers: Record<string, string> = {};
  if (init.origin) headers.origin = init.origin;
  if (init.contentType) headers['content-type'] = init.contentType;
  return new Request(ROUTE_URL, { method, headers, body: method === 'GET' ? undefined : init.body });
}

function upstreamReply(status: number, body: unknown = {}) {
  fetchBackendMock.mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }),
  );
}

let priorSecret: string | undefined;

beforeEach(() => {
  priorSecret = process.env[ADMIN_SESSION_SECRET_ENV];
  process.env[ADMIN_SESSION_SECRET_ENV] = TEST_SECRET;
  cookiesMock.mockResolvedValue(cookieJar('admin-token'));
});

afterEach(() => {
  vi.clearAllMocks();
  if (priorSecret === undefined) delete process.env[ADMIN_SESSION_SECRET_ENV];
  else process.env[ADMIN_SESSION_SECRET_ENV] = priorSecret;
});

describe('landing content proxy', () => {
  it('forwards an Administrator GET with the cookie bearer and passes the body through', async () => {
    upstreamReply(200, { ok: true });
    const res = await proxyLandingContent(makeRequest('GET'), undefined);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe(UPSTREAM);
    expect(init.method).toBe('GET');
    expect(init.headers.Authorization).toBe('Bearer admin-token');
  });

  it('forwards a Staff session as well', async () => {
    cookiesMock.mockResolvedValue(cookieJar('staff-token', 'Staff'));
    upstreamReply(200);
    const res = await proxyLandingContent(makeRequest('GET'), ['approved-tours']);
    expect(res.status).toBe(200);
    expect(fetchBackendMock.mock.calls[0][0]).toBe(`${UPSTREAM}/approved-tours`);
  });

  it('returns 401 without a backend call when the cookie is missing', async () => {
    cookiesMock.mockResolvedValue(cookieJar(undefined));
    const res = await proxyLandingContent(makeRequest('GET'), undefined);
    expect(res.status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('returns 401 when the session seal is invalid', async () => {
    cookiesMock.mockResolvedValue({
      get: (name: string) => (name === ADMIN_ACCESS_TOKEN_COOKIE ? { value: 'unsealed' } : undefined),
    });
    const res = await proxyLandingContent(makeRequest('GET'), undefined);
    expect(res.status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('defense in depth: returns 403 if the verifier ever yields a role other than Administrator or Staff', async () => {
    vi.mocked(verifyAdminSessionFromCookies).mockReturnValueOnce({
      role: 'Operator',
      userId: 1,
      issuedAtMs: 0,
      expiresAtMs: Date.now() + 60_000,
      tokenFingerprint: 'x',
    } as never);
    const res = await proxyLandingContent(makeRequest('GET'), undefined);
    expect(res.status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('rejects a write from a foreign origin', async () => {
    const res = await proxyLandingContent(
      makeRequest('POST', { origin: 'https://evil.example', body: '{}', contentType: 'application/json' }),
      ['publish'],
    );
    expect(res.status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it.each([
    ['GET', ['draft']],
    ['PUT', undefined],
    ['POST', ['approved-tours']],
    ['GET', ['unknown']],
    ['GET', ['..', 'secrets']],
  ] as const)('returns 404 for %s %j', async (method, path) => {
    const res = await proxyLandingContent(
      makeRequest(method, { origin: SAME_ORIGIN, body: '{}', contentType: 'application/json' }),
      path ? [...path] : undefined,
    );
    expect(res.status).toBe(404);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('requires JSON for saving a draft', async () => {
    const res = await proxyLandingContent(
      makeRequest('PUT', { origin: SAME_ORIGIN, body: 'x', contentType: 'text/plain' }),
      ['draft'],
    );
    expect(res.status).toBe(415);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('forwards a draft save to the upstream PUT with the JSON body', async () => {
    upstreamReply(200, { baseVersion: 1 });
    const res = await proxyLandingContent(
      makeRequest('PUT', { origin: SAME_ORIGIN, body: '{"baseVersion":1}', contentType: 'application/json' }),
      ['draft'],
    );
    expect(res.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe(`${UPSTREAM}/draft`);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ baseVersion: 1 });
  });

  it('forwards a multipart upload with its boundary content type', async () => {
    upstreamReply(201, { mediaId: 'm1', url: '/m1.png' });
    // jsdom's FormData is not undici's, so Request would not derive the header; set it explicitly.
    const contentType = 'multipart/form-data; boundary=abc';
    const payload = '--abc\r\nContent-Disposition: form-data; name="file"; filename="a.png"\r\n\r\nx\r\n--abc--\r\n';
    const res = await proxyLandingContent(
      makeRequest('POST', { origin: SAME_ORIGIN, body: payload, contentType }),
      ['media'],
    );
    expect(res.status).toBe(201);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe(`${UPSTREAM}/media`);
    expect(init.headers['Content-Type']).toBe(contentType);
    expect(new TextDecoder().decode(init.body)).toBe(payload);
  });

  it('requires multipart content for an image upload', async () => {
    const res = await proxyLandingContent(
      makeRequest('POST', { origin: SAME_ORIGIN, body: '{}', contentType: 'application/json' }),
      ['media'],
    );
    expect(res.status).toBe(415);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('hides an upstream 5xx behind the generic unavailable message', async () => {
    upstreamReply(500, { detail: 'stack trace' });
    const res = await proxyLandingContent(makeRequest('GET'), undefined);
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toContain('stack trace');
  });

  it('returns 503 when the backend cannot be reached', async () => {
    fetchBackendMock.mockRejectedValue(new Error('down'));
    const res = await proxyLandingContent(makeRequest('GET'), undefined);
    expect(res.status).toBe(503);
  });

  it('returns 401 when the upstream rejects the token', async () => {
    upstreamReply(401);
    const res = await proxyLandingContent(makeRequest('GET'), undefined);
    expect(res.status).toBe(401);
  });

  it('replaces an upstream 403 or 404 body with a generic title', async () => {
    upstreamReply(403, { traceId: 'secret-trace' });
    const forbidden = await proxyLandingContent(makeRequest('GET'), undefined);
    expect(forbidden.status).toBe(403);
    expect(await forbidden.json()).toEqual({ title: 'You do not have permission to access this function.' });
    upstreamReply(404, { traceId: 'secret-trace' });
    const missing = await proxyLandingContent(makeRequest('GET'), undefined);
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ title: 'Not found.' });
  });

  it('refuses an oversized upload by declared length or by actual size without calling the backend', async () => {
    const contentType = 'multipart/form-data; boundary=abc';
    const declared = new Request(ROUTE_URL, {
      method: 'POST',
      headers: { origin: SAME_ORIGIN, 'content-type': contentType, 'content-length': String(7 * 1024 * 1024) },
      body: 'x',
    });
    expect((await proxyLandingContent(declared, ['media'])).status).toBe(413);
    const actual = makeRequest('POST', { origin: SAME_ORIGIN, body: 'x'.repeat(6 * 1024 * 1024 + 1), contentType });
    expect((await proxyLandingContent(actual, ['media'])).status).toBe(413);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it.each([409, 422])('passes an upstream %i body through', async (status) => {
    upstreamReply(status, { errors: { 'hero.headline': 'required' } });
    const res = await proxyLandingContent(
      makeRequest('POST', { origin: SAME_ORIGIN, body: '{}', contentType: 'application/json' }),
      ['publish'],
    );
    expect(res.status).toBe(status);
    expect(await res.json()).toEqual({ errors: { 'hero.headline': 'required' } });
  });
});
