import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock } = vi.hoisted(() => ({ cookiesMock: vi.fn(), fetchBackendMock: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import { proxyOperatorRefundsList } from './refundsOperatorProxy';

const origin = 'http://localhost:3000';
const request = (path: string) => new Request(`${origin}${path}`, { headers: { origin } });

describe('proxyOperatorRefundsList', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    cookiesMock.mockResolvedValue({ get: () => ({ value: 'refresh-token' }) });
  });

  it('answers 401 without calling the backend when there is no refresh cookie', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    const response = await proxyOperatorRefundsList(request('/api/operator/refunds'));
    expect(response.status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('forwards only the known query fields with the bearer token', async () => {
    fetchBackendMock.mockResolvedValueOnce(Response.json({ data: { accessToken: 'access-token', role: 'TourOperator' } }));
    fetchBackendMock.mockResolvedValueOnce(Response.json({ pageNumber: 2, pageSize: 20, totalCount: 0, items: [] }));

    const response = await proxyOperatorRefundsList(
      request('/api/operator/refunds?pageNumber=2&pageSize=20&status=Pending&operatorId=99'),
    );

    expect(response.status).toBe(200);
    expect(fetchBackendMock).toHaveBeenNthCalledWith(
      2,
      '/api/v1/operator/refunds?status=Pending&pageNumber=2&pageSize=20',
      expect.objectContaining({ method: 'GET', headers: { Authorization: 'Bearer access-token' } }),
    );
  });
});
