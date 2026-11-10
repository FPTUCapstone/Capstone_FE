import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock } = vi.hoisted(() => ({ cookiesMock: vi.fn(), fetchBackendMock: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import { proxyOperatorPayoutSettlements } from './payoutSettlementsProxy';

function request(query = '') {
  return new Request(`http://localhost:3000/api/operator/payout-settlements${query}`);
}
function authorize(role = 'TourOperator') {
  fetchBackendMock.mockResolvedValueOnce(Response.json({ data: { accessToken: 'access', role } }));
}

describe('proxyOperatorPayoutSettlements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookiesMock.mockResolvedValue({ get: () => ({ value: 'refresh' }) });
  });

  it('exchanges the refresh cookie and forwards pagination to the history endpoint', async () => {
    authorize();
    fetchBackendMock.mockResolvedValueOnce(Response.json({ items: [] }));
    const response = await proxyOperatorPayoutSettlements(request('?page=2&pageSize=10&unexpected=1'));
    expect(response.status).toBe(200);
    expect(fetchBackendMock).toHaveBeenNthCalledWith(
      2,
      '/api/v1/operator/payout-settlements?page=2&pageSize=10',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer access' }) }),
    );
  });

  it('returns 401 when the refresh cookie is missing', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    const response = await proxyOperatorPayoutSettlements(request());
    expect(response.status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it.each([{ data: { accessToken: 'access', role: 'Traveler' } }, {}, null])(
    'returns 401 for a role other than TourOperator',
    async (context) => {
      fetchBackendMock.mockResolvedValueOnce(Response.json(context));
      const response = await proxyOperatorPayoutSettlements(request());
      expect(response.status).toBe(401);
      expect(fetchBackendMock).toHaveBeenCalledTimes(1);
    },
  );

  it('passes through the backend status and body', async () => {
    authorize();
    fetchBackendMock.mockResolvedValueOnce(Response.json({ title: 'Forbidden.' }, { status: 403 }));
    const response = await proxyOperatorPayoutSettlements(request());
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ title: 'Forbidden.' });
  });

  it('maps a network failure to a retryable 503', async () => {
    fetchBackendMock.mockRejectedValueOnce(new Error('private upstream detail'));
    const response = await proxyOperatorPayoutSettlements(request());
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ errorCode: 'SYSTEM_ERROR' });
  });
});
