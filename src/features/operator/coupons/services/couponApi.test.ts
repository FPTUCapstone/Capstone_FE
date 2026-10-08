import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthStorage } from '@/features/auth/session/authSession';
import { createCoupon, getEligibleCouponTours } from './couponApi';

vi.mock('@/features/auth/session/authSession', () => ({
  AuthStorage: { getAccessToken: vi.fn() },
}));

describe('couponApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('loads eligible tours with the in-memory bearer token', async () => {
    vi.mocked(AuthStorage.getAccessToken).mockReturnValue('access-token');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([
      { tourId: 1, title: 'Da Nang highlights', destination: 'Da Nang', basePrice: 500000 },
    ]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getEligibleCouponTours()).resolves.toEqual([
      { id: 1, title: 'Da Nang highlights', destination: 'Da Nang', basePrice: 500000 },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/operator\/coupons\/eligible-tours$/),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer access-token' }) }),
    );
  });

  it('omits cap for a flat coupon', async () => {
    vi.mocked(AuthStorage.getAccessToken).mockReturnValue('access-token');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ couponId: 3, code: 'FLAT100' }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await createCoupon({
      code: 'flat100', discountType: 'Flat', discountValue: 100000,
      minOrderAmount: 200000, usageLimit: null, usageLimitPerUser: null,
      validFromUtc: '2026-10-05T00:00:00Z', validToUtc: '2026-10-06T00:00:00Z', applicableTourIds: [1],
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body) as Record<string, unknown>;
    expect(body).toEqual(expect.objectContaining({ code: 'FLAT100', discountType: 'Flat' }));
    expect(body).not.toHaveProperty('maxDiscountAmount');
  });

  it('reads coupon error codes from RFC 7807 extensions', async () => {
    vi.mocked(AuthStorage.getAccessToken).mockReturnValue('access-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      title: 'This coupon code already exists.',
      extensions: { errorCode: 'coupon.code_conflict' },
    }), { status: 409 })));

    await expect(createCoupon({
      code: 'TRIP10', discountType: 'Flat', discountValue: 100000,
      minOrderAmount: 0, usageLimit: null, usageLimitPerUser: null,
      validFromUtc: '2026-10-05T00:00:00Z', validToUtc: '2026-10-06T00:00:00Z', applicableTourIds: [1],
    })).rejects.toMatchObject({ status: 409, code: 'coupon.code_conflict' });
  });
});
