import { beforeEach, describe, expect, it, vi } from 'vitest';

const { proxyMock } = vi.hoisted(() => ({ proxyMock: vi.fn() }));
vi.mock('@/features/operator/bookings/api/operatorBookingProxy', () => ({ proxyOperatorBookings: proxyMock }));

import { GET, dynamic } from './route';
import * as routeModule from './route';

describe('GET /api/operator/bookings/[bookingId] (UC-40 detail BFF route)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    proxyMock.mockResolvedValue(Response.json({ bookingId: '1201' }));
  });

  it('is never cached', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('awaits the async params and delegates the raw booking id to the proxy, which validates it', async () => {
    const request = new Request('https://tripmate.test/api/operator/bookings/1201');

    const response = await GET(request, { params: Promise.resolve({ bookingId: '1201' }) });

    expect(proxyMock).toHaveBeenCalledWith(request, '1201');
    expect(await response.json()).toEqual({ bookingId: '1201' });
  });

  it('does not decode or alter an unusual id: validation belongs to the proxy', async () => {
    const request = new Request('https://tripmate.test/api/operator/bookings/..%2Fpayouts');

    await GET(request, { params: Promise.resolve({ bookingId: '../payouts' }) });

    expect(proxyMock).toHaveBeenCalledWith(request, '../payouts');
  });

  it('exposes only GET (the booking views are read-only)', () => {
    const methods = ['POST', 'PUT', 'PATCH', 'DELETE'].filter((method) => method in routeModule);
    expect(methods).toEqual([]);
  });
});
