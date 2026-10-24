import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { resolveWebSessionMock, fetchBackendMock } = vi.hoisted(() => ({
  resolveWebSessionMock: vi.fn(),
  fetchBackendMock: vi.fn(),
}));

vi.mock('@/lib/server/webSession', () => ({ resolveWebSession: resolveWebSessionMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import { proxyActiveTrips } from './activeTripsProxy';

function request(query = '') {
  return new Request(`http://localhost:3001/api/admin/trips/active${query ? `?${query}` : ''}`);
}

beforeEach(() => resolveWebSessionMock.mockResolvedValue({ accessToken: 'admin-token', role: 'Administrator' }));
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
});
