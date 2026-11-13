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
  proxyAdminRefundDetail,
  proxyAdminRefundResolve,
  proxyAdminRefundReturnReceived,
  proxyAdminRefundsList,
} from './refundsAdminProxy';

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

describe('proxyAdminRefundsList', () => {
  it('allows Staff and Administrator, forwarding only status/pageNumber/pageSize', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ items: [] }));
    const response = await proxyAdminRefundsList(
      request('/api/admin/refunds?status=ReturnReported&unexpected=1&pageNumber=2'),
    );
    expect(response.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/refunds?status=ReturnReported&pageNumber=2');
    expect(init.headers.Authorization).toBe('Bearer admin-token');

    mockSession('Administrator');
    fetchBackendMock.mockResolvedValue(Response.json({ items: [] }));
    const adminResponse = await proxyAdminRefundsList(request('/api/admin/refunds?status=Escalated&status=Reconciliation'));
    expect(adminResponse.status).toBe(200);
    expect(fetchBackendMock.mock.calls[1][0]).toBe('/api/v1/admin/refunds?status=Escalated&status=Reconciliation');
  });

  it('requires a valid admin session', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    expect((await proxyAdminRefundsList(request('/api/admin/refunds'))).status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });
});

describe('proxyAdminRefundDetail', () => {
  it('rejects a non-numeric refundId before calling the backend', async () => {
    mockSession('Administrator');
    expect((await proxyAdminRefundDetail(request('/api/admin/refunds/abc'), 'abc')).status).toBe(400);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('is Administrator only, not Staff', async () => {
    mockSession('Staff');
    expect((await proxyAdminRefundDetail(request('/api/admin/refunds/501'), '501')).status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('forwards to the backend for an Administrator', async () => {
    mockSession('Administrator');
    fetchBackendMock.mockResolvedValue(Response.json({ refundId: 501 }));
    const response = await proxyAdminRefundDetail(request('/api/admin/refunds/501'), '501');
    expect(response.status).toBe(200);
    expect(fetchBackendMock.mock.calls[0][0]).toBe('/api/v1/admin/refunds/501');
  });
});

describe('proxyAdminRefundReturnReceived', () => {
  it('rejects a cross-origin request', async () => {
    const crossOrigin = new Request('http://localhost:3000/api/admin/refunds/501/return-received', {
      method: 'POST',
      headers: { origin: 'http://evil.example' },
    });
    expect((await proxyAdminRefundReturnReceived(crossOrigin, '501')).status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('allows Staff, sends no body', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ status: 'ReturnReceived' }));
    const response = await proxyAdminRefundReturnReceived(
      request('/api/admin/refunds/501/return-received', { method: 'POST' }),
      '501',
    );
    expect(response.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/refunds/501/return-received');
    expect(init.body).toBeUndefined();
  });
});

describe('proxyAdminRefundResolve', () => {
  it('is Administrator only, not Staff', async () => {
    mockSession('Staff');
    expect(
      (await proxyAdminRefundResolve(
        request('/api/admin/refunds/501/resolve', { method: 'POST', body: JSON.stringify({ gatewayReference: 'GW-1' }) }),
        '501',
      )).status,
    ).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('forwards only gatewayReference as a Complete action with an idempotency key, dropping any other field', async () => {
    mockSession('Administrator');
    fetchBackendMock.mockResolvedValue(Response.json({ status: 'Processed' }));
    await proxyAdminRefundResolve(
      request('/api/admin/refunds/501/resolve', {
        method: 'POST',
        body: JSON.stringify({ gatewayReference: 'GW-1', refundId: 999, status: 'Processed' }),
      }),
      '501',
    );
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/refunds/501/resolve');
    expect(JSON.parse(init.body)).toEqual({ action: 'Complete', gatewayReference: 'GW-1' });
    expect(init.headers['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('forwards action Reject with reason and no idempotency key', async () => {
    mockSession('Administrator');
    fetchBackendMock.mockResolvedValue(Response.json({ status: 'Rejected' }));
    await proxyAdminRefundResolve(
      request('/api/admin/refunds/501/resolve', {
        method: 'POST',
        body: JSON.stringify({ action: 'Reject', reason: 'Invalid payment proof' }),
      }),
      '501',
    );
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/refunds/501/resolve');
    expect(JSON.parse(init.body)).toEqual({ action: 'Reject', reason: 'Invalid payment proof' });
    expect(init.headers['Idempotency-Key']).toBeUndefined();
  });
});
