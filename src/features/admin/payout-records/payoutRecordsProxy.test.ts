import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock } = vi.hoisted(() => ({ cookiesMock: vi.fn(), fetchBackendMock: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';
import { proxyPayoutRecords } from './payoutRecordsProxy';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');

function mockSealedCookies(role: 'Administrator' | 'Staff', token = 'admin-token') {
  const sealed = createAdminSessionSeal({
    token,
    role,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    secret: TEST_SECRET,
  })!;
  cookiesMock.mockResolvedValue({
    get: (name: string) => {
      if (name === ADMIN_ACCESS_TOKEN_COOKIE) return { value: token };
      if (name === ADMIN_SESSION_SEAL_COOKIE) return { value: sealed.seal };
      return undefined;
    },
  });
}

let priorSecret: string | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  priorSecret = process.env[ADMIN_SESSION_SECRET_ENV];
  process.env[ADMIN_SESSION_SECRET_ENV] = TEST_SECRET;
  mockSealedCookies('Staff');
});
afterEach(() => {
  if (priorSecret === undefined) delete process.env[ADMIN_SESSION_SECRET_ENV];
  else process.env[ADMIN_SESSION_SECRET_ENV] = priorSecret;
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

  it('answers 401 without contacting the backend when the signed session is missing, malformed, or expired', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    const res = await proxyPayoutRecords(requestWithQuery(''));
    expect(res.status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();

    cookiesMock.mockResolvedValue({
      get: (name: string) => name === ADMIN_ACCESS_TOKEN_COOKIE ? { value: 'admin-token' } : undefined,
    });
    const malformed = await proxyPayoutRecords(requestWithQuery(''));
    expect(malformed.status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();

    const now = Date.now();
    const expired = createAdminSessionSeal({
      token: 'expired-token',
      role: 'Staff',
      expiresAt: new Date(now - 60_000),
      nowMs: now - 120_000,
      secret: TEST_SECRET,
    })!;
    cookiesMock.mockResolvedValue({
      get: (name: string) => {
        if (name === ADMIN_ACCESS_TOKEN_COOKIE) return { value: 'expired-token' };
        if (name === ADMIN_SESSION_SEAL_COOKIE) return { value: expired.seal };
        return undefined;
      },
    });
    const expiredResponse = await proxyPayoutRecords(requestWithQuery(''));
    expect(expiredResponse.status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('rejects Administrator before calling the Staff review endpoint', async () => {
    mockSealedCookies('Administrator');
    const res = await proxyPayoutRecords(requestWithQuery(''));
    expect(res.status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
    expect(res.headers.getSetCookie()).toHaveLength(0);
  });

  it('clears the admin session cookie only when upstream answers 401', async () => {
    fetchBackendMock.mockResolvedValue(new Response('denied', { status: 401 }));
    const res = await proxyPayoutRecords(requestWithQuery(''));
    expect(res.status).toBe(401);
    const cookies = res.headers.getSetCookie();
    expect(cookies.some(c => c.startsWith(`${ADMIN_ACCESS_TOKEN_COOKIE}=`) && c.includes('Max-Age=0'))).toBe(true);
    expect(cookies.some(c => c.startsWith(`${ADMIN_SESSION_SEAL_COOKIE}=`) && c.includes('Max-Age=0'))).toBe(true);
  });

  it('preserves a valid admin session when upstream answers 403', async () => {
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
