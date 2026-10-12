import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock } = vi.hoisted(() => ({ cookiesMock: vi.fn(), fetchBackendMock: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import { proxyPayoutRecords } from './payoutRecordsProxy';

beforeEach(() => {
  cookiesMock.mockResolvedValue({
    get: (name: string) => (name === 'tripmate_admin_access_token' ? { value: 'admin-token' } : undefined),
  });
});
afterEach(() => vi.clearAllMocks());

function requestWithQuery(query: string) {
  return new Request(`http://localhost:3000/api/admin/payouts${query}`);
}

describe('payout records proxy', () => {
  it('forwards allow-listed query keys with the admin cookie bearer', async () => {
    fetchBackendMock.mockResolvedValue(new Response(JSON.stringify({ items: [] }), { status: 200 }));
    const res = await proxyPayoutRecords(requestWithQuery('?keyword=PO-12&status=Paid&hax=1&pageNumber=2'));
    expect(res.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/payouts?keyword=PO-12&status=Paid&pageNumber=2');
    expect(init.headers.Authorization).toBe('Bearer admin-token');
  });

  it('answers 401 without contacting the backend when the cookie is missing', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    const res = await proxyPayoutRecords(requestWithQuery(''));
    expect(res.status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it.each([401, 403])('clears the admin session cookie when upstream answers %i', async status => {
    fetchBackendMock.mockResolvedValue(new Response('denied', { status }));
    const res = await proxyPayoutRecords(requestWithQuery(''));
    expect(res.status).toBe(status);
    const cookies = res.headers.getSetCookie();
    expect(cookies.some(c => c.startsWith('tripmate_admin_access_token=') && c.includes('Max-Age=0'))).toBe(true);
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
