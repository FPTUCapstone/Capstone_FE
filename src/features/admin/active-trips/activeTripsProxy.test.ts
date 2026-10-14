import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock, verifyAdminSessionMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  fetchBackendMock: vi.fn(),
  verifyAdminSessionMock: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));
vi.mock('@/lib/server/adminSession', () => ({
  ADMIN_ACCESS_TOKEN_COOKIE: 'tripmate_admin_access_token',
  clearAdminSession: (response: Response) => {
    response.headers.append('Set-Cookie', 'tripmate_admin_access_token=; Max-Age=0');
    return response;
  },
  jsonNoStore: (body: unknown, status = 200) => Response.json(body, { status }),
  verifyAdminSessionFromCookies: verifyAdminSessionMock,
}));

import { proxyActiveTrips } from './activeTripsProxy';

function cookieJar(token?: string) {
  return { get: (name: string) => name === 'tripmate_admin_access_token' && token ? { value: token } : undefined };
}

function request(query = '') {
  return new Request(`http://localhost:3001/api/admin/trips/active${query ? `?${query}` : ''}`);
}

beforeEach(() => {
  cookiesMock.mockResolvedValue(cookieJar('admin-token'));
  verifyAdminSessionMock.mockReturnValue({ role: 'Staff' });
});
afterEach(() => vi.clearAllMocks());

describe('active trips proxy', () => {
  it('maps an upstream typed date error to the safe BFF contract without leaking details', async () => {
    fetchBackendMock.mockResolvedValue(new Response(JSON.stringify({
      errorCode: 'ActiveTrips.InvalidDateRange', title: 'Unhandled database detail', detail: 'internal only', traceId: 'secret-trace', errors: { startDateFrom: ['raw'] },
    }), { status: 400 }));

    const response = await proxyActiveTrips(request('startDateFrom=2026-09-30'));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      errorCode: 'ActiveTrips.InvalidDateRange',
      title: 'The submitted Start Date range is logically invalid.',
      field: 'dates',
    });
  });

  it('maps an unrecognized upstream 400 to a generic safe filter contract', async () => {
    fetchBackendMock.mockResolvedValue(new Response(JSON.stringify({
      errorCode: 'Other.Invalid', title: 'Internal implementation detail', detail: 'secret',
    }), { status: 400 }));

    const response = await proxyActiveTrips(request('tripType=invalid'));

    expect(await response.json()).toEqual({
      errorCode: 'ActiveTrips.InvalidFilter',
      title: 'One or more filters are invalid. Please review and try again.',
      field: 'filters',
    });
  });

  it('uses the fixed page size and does not forward a manually supplied pageSize', async () => {
    fetchBackendMock.mockResolvedValue(new Response(JSON.stringify({ items: [] }), { status: 200 }));

    await proxyActiveTrips(request('pageNumber=2&pageSize=100&unknown=discarded'));

    expect(fetchBackendMock.mock.calls[0][0]).toBe('/api/v1/admin/trips/active?pageNumber=2&pageSize=20');
    expect(fetchBackendMock.mock.calls[0][1].headers.Authorization).toBe('Bearer admin-token');
  });

  it('answers 401 without contacting backend when cookie is missing', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    verifyAdminSessionMock.mockReturnValue(null);
    const response = await proxyActiveTrips(request());
    expect(response.status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('rejects an Administrator session with 403 before contacting backend', async () => {
    verifyAdminSessionMock.mockReturnValue({ role: 'Administrator' });
    const response = await proxyActiveTrips(request());
    expect(response.status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });
});
