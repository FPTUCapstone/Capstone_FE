import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  fetchBackendMock: vi.fn(),
}));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import { proxyOperatorRefundConfirm, proxyOperatorRefundDetail, proxyOperatorRefundReturn } from './refundsOperatorProxy';

const origin = 'http://localhost:3000';
const request = (path: string, init?: RequestInit) =>
  new Request(`${origin}${path}`, { headers: { origin, ...(init?.headers as Record<string, string> | undefined) }, ...init });
const authorize = (role = 'TourOperator') =>
  fetchBackendMock.mockResolvedValueOnce(Response.json({ data: { accessToken: 'access-token', role } }));

describe('proxyOperatorRefundDetail', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    cookiesMock.mockResolvedValue({ get: () => ({ value: 'refresh-token' }) });
  });

  it('rejects a non-numeric refundId before calling the backend', async () => {
    const response = await proxyOperatorRefundDetail(request('/api/operator/refunds/abc'), 'abc');
    expect(response.status).toBe(400);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('answers 401 without calling the backend when there is no refresh cookie', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    const response = await proxyOperatorRefundDetail(request('/api/operator/refunds/501'), '501');
    expect(response.status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('answers 401 for a non-TourOperator role', async () => {
    fetchBackendMock.mockResolvedValueOnce(Response.json({ data: { accessToken: 'access-token', role: 'Traveler' } }));
    const response = await proxyOperatorRefundDetail(request('/api/operator/refunds/501'), '501');
    expect(response.status).toBe(401);
  });

  it('exchanges the refresh cookie and forwards the bearer token to the detail route', async () => {
    authorize();
    fetchBackendMock.mockResolvedValueOnce(Response.json({ refundId: 501 }));

    const response = await proxyOperatorRefundDetail(request('/api/operator/refunds/501'), '501');

    expect(response.status).toBe(200);
    expect(fetchBackendMock).toHaveBeenNthCalledWith(
      1,
      '/api/v1/auth/web/refresh',
      expect.objectContaining({ method: 'POST', headers: { Cookie: 'tripmate_refresh=refresh-token' } }),
    );
    expect(fetchBackendMock).toHaveBeenNthCalledWith(
      2,
      '/api/v1/operator/refunds/501',
      expect.objectContaining({ method: 'GET', headers: { Authorization: 'Bearer access-token' } }),
    );
  });
});

describe('proxyOperatorRefundConfirm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    cookiesMock.mockResolvedValue({ get: () => ({ value: 'refresh-token' }) });
  });

  it('rejects a cross-origin request before touching the session', async () => {
    const crossOrigin = new Request('http://localhost:3000/api/operator/refunds/501/confirm', {
      method: 'POST',
      headers: { origin: 'http://evil.example' },
    });
    const response = await proxyOperatorRefundConfirm(crossOrigin, '501');
    expect(response.status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('sends no request body (SRS 3.8.4.3: confirmation carries none)', async () => {
    authorize();
    fetchBackendMock.mockResolvedValueOnce(Response.json({ status: 'AwaitingPartnerReturn' }));

    await proxyOperatorRefundConfirm(request('/api/operator/refunds/501/confirm', { method: 'POST' }), '501');

    const [path, init] = fetchBackendMock.mock.calls[1];
    expect(path).toBe('/api/v1/operator/refunds/501/confirm');
    expect(init.method).toBe('POST');
    expect(init.body).toBeUndefined();
  });
});

describe('proxyOperatorRefundReturn', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    cookiesMock.mockResolvedValue({ get: () => ({ value: 'refresh-token' }) });
  });

  it('rejects a cross-origin request before touching the session', async () => {
    const crossOrigin = new Request('http://localhost:3000/api/operator/refunds/501/return', {
      method: 'POST',
      headers: { origin: 'http://evil.example' },
      body: JSON.stringify({ returnReference: 'FT-1' }),
    });
    const response = await proxyOperatorRefundReturn(crossOrigin, '501');
    expect(response.status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('forwards only returnReference, dropping any other field', async () => {
    authorize();
    fetchBackendMock.mockResolvedValueOnce(Response.json({ status: 'ReturnReported' }));

    await proxyOperatorRefundReturn(
      request('/api/operator/refunds/501/return', {
        method: 'POST',
        body: JSON.stringify({ returnReference: 'FT-998877', refundId: 999, status: 'ReturnReported' }),
      }),
      '501',
    );

    const [path, init] = fetchBackendMock.mock.calls[1];
    expect(path).toBe('/api/v1/operator/refunds/501/return');
    expect(JSON.parse(init.body)).toEqual({ returnReference: 'FT-998877' });
  });

  it('sends null when the reference is missing or not a string', async () => {
    authorize();
    fetchBackendMock.mockResolvedValueOnce(Response.json({ status: 'ReturnReported' }));

    await proxyOperatorRefundReturn(
      request('/api/operator/refunds/501/return', { method: 'POST', body: JSON.stringify({}) }),
      '501',
    );

    const [, init] = fetchBackendMock.mock.calls[1];
    expect(JSON.parse(init.body)).toEqual({ returnReference: null });
  });
});
