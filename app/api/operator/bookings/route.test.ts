import { beforeEach, describe, expect, it, vi } from 'vitest';

const { proxyMock } = vi.hoisted(() => ({ proxyMock: vi.fn() }));
vi.mock('@/features/operator/bookings/api/operatorBookingProxy', () => ({ proxyOperatorBookings: proxyMock }));

import { GET, dynamic } from './route';
import * as routeModule from './route';

describe('GET /api/operator/bookings (UC-40 list BFF route)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    proxyMock.mockResolvedValue(Response.json({ items: [] }));
  });

  it('is never cached', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('delegates the request to the list proxy without a booking id', async () => {
    const request = new Request('https://tripmate.test/api/operator/bookings?status=Confirmed');

    const response = await GET(request);

    expect(proxyMock).toHaveBeenCalledTimes(1);
    expect(proxyMock).toHaveBeenCalledWith(request);
    expect(await response.json()).toEqual({ items: [] });
  });

  it('exposes only GET (the booking views are read-only)', () => {
    const methods = ['POST', 'PUT', 'PATCH', 'DELETE'].filter((method) => method in routeModule);
    expect(methods).toEqual([]);
  });
});
