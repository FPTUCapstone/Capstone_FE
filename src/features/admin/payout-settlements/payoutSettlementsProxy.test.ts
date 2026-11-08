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
  proxyFailedPayoutBatchDetail,
  proxyPayoutBatchAction,
  proxyPayoutSettlementsList,
} from './payoutSettlementsProxy';

const testSecret = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');
let priorSecret: string | undefined;

function mockSession(role: 'Administrator' | 'Staff', token = 'admin-token') {
  const sealed = createAdminSessionSeal({ token, role, expiresAt: new Date(Date.now() + 600_000), secret: testSecret })!;
  cookiesMock.mockResolvedValue({
    get: (name: string) =>
      name === ADMIN_ACCESS_TOKEN_COOKIE ? { value: token } : name === ADMIN_SESSION_SEAL_COOKIE ? { value: sealed.seal } : undefined,
  });
}

function request(path: string, init?: RequestInit) {
  return new Request(`http://localhost:3000${path}`, { headers: { origin: 'http://localhost:3000' }, ...init });
}

beforeEach(() => {
  vi.clearAllMocks();
  priorSecret = process.env[ADMIN_SESSION_SECRET_ENV];
  process.env[ADMIN_SESSION_SECRET_ENV] = testSecret;
  mockSession('Staff');
});

afterEach(() => {
  if (priorSecret === undefined) delete process.env[ADMIN_SESSION_SECRET_ENV];
  else process.env[ADMIN_SESSION_SECRET_ENV] = priorSecret;
});

describe('proxyPayoutSettlementsList', () => {
  it('allows Staff and Administrator, forwarding only the allowed filters', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ items: [] }));
    const response = await proxyPayoutSettlementsList(
      request('/api/admin/payout-settlements?status=Settled&runDateFrom=2026-11-01&unexpected=1&pageNumber=2'),
    );
    expect(response.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/payout-settlements?status=Settled&runDateFrom=2026-11-01&pageNumber=2');
    expect(init.headers.Authorization).toBe('Bearer admin-token');

    mockSession('Administrator');
    fetchBackendMock.mockResolvedValue(Response.json({ items: [] }));
    expect((await proxyPayoutSettlementsList(request('/api/admin/payout-settlements'))).status).toBe(200);
  });

  it('requires a valid admin session', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    expect((await proxyPayoutSettlementsList(request('/api/admin/payout-settlements'))).status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('clears the session only for an upstream 401', async () => {
    fetchBackendMock.mockResolvedValue(new Response('expired', { status: 401 }));
    const response = await proxyPayoutSettlementsList(request('/api/admin/payout-settlements'));
    expect(response.status).toBe(401);
    expect(response.headers.getSetCookie().some((value) => value.startsWith(`${ADMIN_ACCESS_TOKEN_COOKIE}=`) && value.includes('Max-Age=0'))).toBe(true);
  });

  it('does not leak backend problem details and maps outages to retryable 503', async () => {
    fetchBackendMock.mockResolvedValue(
      Response.json({ title: 'Invalid filter.', errorCode: 'daily_payout.forbidden', detail: 'private', traceId: 'private-trace' }, { status: 403 }),
    );
    await expect((await proxyPayoutSettlementsList(request('/api/admin/payout-settlements'))).json()).resolves.toEqual({
      title: 'Administrator access is not allowed.',
    });
    fetchBackendMock.mockResolvedValue(new Response('unavailable', { status: 503 }));
    expect((await proxyPayoutSettlementsList(request('/api/admin/payout-settlements'))).status).toBe(503);
  });
});

describe('proxyFailedPayoutBatchDetail', () => {
  it('rejects a non-numeric batchId before calling the backend', async () => {
    mockSession('Administrator');
    const response = await proxyFailedPayoutBatchDetail(request('/api/admin/payout-settlements/abc'), 'abc');
    expect(response.status).toBe(400);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('rejects Staff (Administrator-only)', async () => {
    mockSession('Staff');
    const response = await proxyFailedPayoutBatchDetail(request('/api/admin/payout-settlements/42'), '42');
    expect(response.status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('forwards to the backend for an Administrator session', async () => {
    mockSession('Administrator');
    fetchBackendMock.mockResolvedValue(Response.json({ batchId: 42 }));
    const response = await proxyFailedPayoutBatchDetail(request('/api/admin/payout-settlements/42'), '42');
    expect(response.status).toBe(200);
    expect(fetchBackendMock.mock.calls[0][0]).toBe('/api/v1/admin/payout-settlements/42');
  });

  it('passes through a 404 for a batch that does not exist', async () => {
    mockSession('Administrator');
    fetchBackendMock.mockResolvedValue(Response.json({ title: 'Not found.', errorCode: 'daily_payout.batch_not_found' }, { status: 404 }));
    const response = await proxyFailedPayoutBatchDetail(request('/api/admin/payout-settlements/999999'), '999999');
    expect(response.status).toBe(404);
  });
});

describe('proxyPayoutBatchAction', () => {
  it('rejects a cross-origin request before touching the session or backend', async () => {
    mockSession('Administrator');
    const response = await proxyPayoutBatchAction(
      new Request('http://localhost:3000/api/admin/payout-settlements/42/retry', { method: 'POST', headers: { origin: 'http://evil.example' } }),
      '42',
      'retry',
    );
    expect(response.status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid batchId before calling the backend', async () => {
    mockSession('Administrator');
    const response = await proxyPayoutBatchAction(request('/api/admin/payout-settlements/0/retry', { method: 'POST' }), '0', 'retry');
    expect(response.status).toBe(400);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('rejects Staff for every action', async () => {
    mockSession('Staff');
    for (const action of ['retry', 'carry-over', 'manual-settlement'] as const) {
      const response = await proxyPayoutBatchAction(request(`/api/admin/payout-settlements/42/${action}`, { method: 'POST' }), '42', action);
      expect(response.status).toBe(403);
    }
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('retries with no body', async () => {
    mockSession('Administrator');
    fetchBackendMock.mockResolvedValue(Response.json({ batchId: 42, status: 'Processing' }));
    const response = await proxyPayoutBatchAction(request('/api/admin/payout-settlements/42/retry', { method: 'POST' }), '42', 'retry');
    expect(response.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/payout-settlements/42/retry');
    expect(init.body).toBeUndefined();
  });

  it('carries over with no body', async () => {
    mockSession('Administrator');
    fetchBackendMock.mockResolvedValue(Response.json({ batchId: 42, status: 'Carried Over' }));
    const response = await proxyPayoutBatchAction(request('/api/admin/payout-settlements/42/carry-over', { method: 'POST' }), '42', 'carry-over');
    expect(response.status).toBe(200);
    expect(fetchBackendMock.mock.calls[0][0]).toBe('/api/v1/admin/payout-settlements/42/carry-over');
  });

  it('strips unknown body fields for manual-settlement, forwarding only transferReference', async () => {
    mockSession('Administrator');
    fetchBackendMock.mockResolvedValue(Response.json({ batchId: 42, status: 'Settled' }));
    const response = await proxyPayoutBatchAction(
      request('/api/admin/payout-settlements/42/manual-settlement', {
        method: 'POST',
        body: JSON.stringify({ transferReference: 'SIM-TRX-001', batchId: 999, status: 'Settled' }),
      }),
      '42',
      'manual-settlement',
    );
    expect(response.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/payout-settlements/42/manual-settlement');
    expect(JSON.parse(init.body)).toEqual({ transferReference: 'SIM-TRX-001' });
  });

  it('passes through a validation failure for a blank manual-settlement reference', async () => {
    mockSession('Administrator');
    fetchBackendMock.mockResolvedValue(
      Response.json({ title: 'A transfer reference is required.', errorCode: 'daily_payout.manual_reference_required' }, { status: 400 }),
    );
    const response = await proxyPayoutBatchAction(
      request('/api/admin/payout-settlements/42/manual-settlement', { method: 'POST', body: JSON.stringify({ transferReference: '   ' }) }),
      '42',
      'manual-settlement',
    );
    expect(response.status).toBe(400);
  });

  it('passes through a 409 when the batch is no longer SettlementFailed', async () => {
    mockSession('Administrator');
    fetchBackendMock.mockResolvedValue(Response.json({ title: 'Not failed.', errorCode: 'daily_payout.not_failed' }, { status: 409 }));
    const response = await proxyPayoutBatchAction(request('/api/admin/payout-settlements/42/retry', { method: 'POST' }), '42', 'retry');
    expect(response.status).toBe(409);
  });
});
