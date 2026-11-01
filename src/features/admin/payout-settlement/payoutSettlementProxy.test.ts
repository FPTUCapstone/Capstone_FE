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
import {
  proxyAuthorizeSettlement,
  proxyGetSettlementDetail,
  proxyGetSettlementQueue,
} from './payoutSettlementProxy';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');
const ORIGIN = 'http://localhost:3000';

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

const queueRequest = (query = '') => new Request(`${ORIGIN}/api/admin/payout-settlements${query}`);

function authorizeRequest(origin: string | null = ORIGIN, body?: unknown) {
  return new Request(`${ORIGIN}/api/admin/payout-settlements/123/authorize`, {
    method: 'POST',
    headers: {
      ...(origin === null ? {} : { Origin: origin }),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

let priorSecret: string | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('TRIPMATE_WEB_ORIGIN', '');
  priorSecret = process.env[ADMIN_SESSION_SECRET_ENV];
  process.env[ADMIN_SESSION_SECRET_ENV] = TEST_SECRET;
  mockSealedCookies('Administrator');
});
afterEach(() => {
  vi.unstubAllEnvs();
  if (priorSecret === undefined) delete process.env[ADMIN_SESSION_SECRET_ENV];
  else process.env[ADMIN_SESSION_SECRET_ENV] = priorSecret;
});

describe.each([
  ['queue', () => proxyGetSettlementQueue(queueRequest())],
  ['detail', () => proxyGetSettlementDetail('123')],
  ['authorize', () => proxyAuthorizeSettlement('123', authorizeRequest())],
])('%s access control', (_name, call) => {
  it('answers 401 and clears the session when there is none', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    const res = await call();
    expect(res.status).toBe(401);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('rejects Staff before contacting the backend', async () => {
    mockSealedCookies('Staff');
    const res = await call();
    expect(res.status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('maps a backend connection failure to 503', async () => {
    fetchBackendMock.mockRejectedValue(new TypeError('failed'));
    expect((await call()).status).toBe(503);
  });

  it('maps an upstream 5xx to 503 without leaking its body', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ title: 'stack trace' }, { status: 500 }));
    const res = await call();
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toContain('stack trace');
  });

  it('treats a non-JSON upstream body as unavailable', async () => {
    fetchBackendMock.mockResolvedValue(new Response('<html>oops</html>', { status: 200 }));
    expect((await call()).status).toBe(503);
  });

  it('clears the session on an upstream 401 and maps 403', async () => {
    fetchBackendMock.mockResolvedValueOnce(Response.json({}, { status: 401 }));
    expect((await call()).status).toBe(401);
    fetchBackendMock.mockResolvedValueOnce(Response.json({}, { status: 403 }));
    expect((await call()).status).toBe(403);
  });
});

describe('proxyGetSettlementQueue', () => {
  it('forwards only the allow-listed filters with a fixed page size', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ items: [] }));
    const res = await proxyGetSettlementQueue(queueRequest(
      '?keyword=Hoi%20An&status=Settled&periodFrom=2026-08-01&periodTo=2026-09-30&pageNumber=2&pageSize=500&admin=1',
    ));
    expect(res.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    const url = new URL(path, ORIGIN);
    expect(url.pathname).toBe('/api/v1/admin/payout-settlements');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      keyword: 'Hoi An', status: 'Settled', periodFrom: '2026-08-01', periodTo: '2026-09-30', pageNumber: '2', pageSize: '20',
    });
    expect(init.method).toBe('GET');
    expect(init.headers.Authorization).toBe('Bearer admin-token');
  });

  it('sends only the page size when no filter is submitted', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ items: [] }));
    await proxyGetSettlementQueue(queueRequest());
    expect(fetchBackendMock.mock.calls[0][0]).toBe('/api/v1/admin/payout-settlements?pageSize=20');
  });

  it('passes a 400 through with a sanitized body', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({
      title: 'Invalid status.', errorCode: 'payout.invalid_status', traceId: 'private',
    }, { status: 400 }));
    const res = await proxyGetSettlementQueue(queueRequest('?status=Rejected'));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ title: 'Invalid status.', errorCode: 'payout.invalid_status' });
  });
});

describe('proxyGetSettlementDetail', () => {
  it('rejects a malformed payoutId before contacting the backend', async () => {
    const res = await proxyGetSettlementDetail('not-a-number');
    expect(res.status).toBe(400);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('forwards to the settlement detail endpoint and returns the body untouched', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ payoutId: '123', status: 'Settled' }));
    const res = await proxyGetSettlementDetail('123');
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(fetchBackendMock.mock.calls[0][0]).toBe('/api/v1/admin/payout-settlements/123');
    await expect(res.json()).resolves.toEqual({ payoutId: '123', status: 'Settled' });
  });

  it('maps upstream 404 with a safe body', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({
      title: 'The requested payout record was not found.', errorCode: 'payout.not_found', traceId: 'private',
    }, { status: 404 }));
    const res = await proxyGetSettlementDetail('999');
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      title: 'The requested payout record was not found.', errorCode: 'payout.not_found',
    });
  });
});

describe('proxyAuthorizeSettlement', () => {
  it('rejects a malformed payoutId before anything else', async () => {
    const res = await proxyAuthorizeSettlement('0', authorizeRequest());
    expect(res.status).toBe(400);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it.each([null, 'null', 'https://attacker.example'])(
    'rejects a mutation from origin %s before reading the session',
    async (origin) => {
      const res = await proxyAuthorizeSettlement('123', authorizeRequest(origin));
      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toEqual({ title: 'Request origin is not allowed.' });
      expect(cookiesMock).not.toHaveBeenCalled();
      expect(fetchBackendMock).not.toHaveBeenCalled();
    },
  );

  it('forwards a POST with no body and passes the 202 through', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({
      payoutId: '123', payoutCode: 'PO-000123', status: 'SettlementProcessing', authorizedAtUtc: '2026-11-01T09:00:00+00:00',
    }, { status: 202 }));
    const res = await proxyAuthorizeSettlement('123', authorizeRequest(ORIGIN, { amount: 1, bankBin: '970436' }));
    expect(res.status).toBe(202);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/payout-settlements/123/authorize');
    expect(init.method).toBe('POST');
    expect(init.body).toBeUndefined();
    expect(init.headers.Authorization).toBe('Bearer admin-token');
  });

  it('forwards errorCode and currentStatus on a 409 and nothing else', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({
      title: 'Not approved.', errorCode: 'payout.not_approved_for_settlement', currentStatus: 'SettlementProcessing',
      detail: 'internal', traceId: 'private',
    }, { status: 409 }));
    const res = await proxyAuthorizeSettlement('123', authorizeRequest());
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({
      title: 'Not approved.', errorCode: 'payout.not_approved_for_settlement', currentStatus: 'SettlementProcessing',
    });
  });

  it.each(['payout.beneficiary_incomplete', 'payout.bank_bin_unresolved', 'payout.amount_invalid'])(
    'passes a 422 %s through',
    async (errorCode) => {
      fetchBackendMock.mockResolvedValue(Response.json({ title: 'Cannot authorize.', errorCode }, { status: 422 }));
      const res = await proxyAuthorizeSettlement('123', authorizeRequest());
      expect(res.status).toBe(422);
      await expect(res.json()).resolves.toEqual({ title: 'Cannot authorize.', errorCode });
    },
  );

  it('drops an unsafe errorCode and an over-long title', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({
      title: 'x'.repeat(501), errorCode: '<script>', currentStatus: 'not safe!',
    }, { status: 409 }));
    const res = await proxyAuthorizeSettlement('123', authorizeRequest());
    await expect(res.json()).resolves.toEqual({ title: 'The payout request could not be processed.' });
  });
});
