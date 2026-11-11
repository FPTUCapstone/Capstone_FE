import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthStorage } from '@/features/auth/session/authSession';
import { createCoupon, getEligibleCouponTours, listOperatorCoupons, getOperatorCoupon, updateOperatorCoupon, setOperatorCouponActivation } from './couponApi';

const backendCoupon = {
  couponId: 31, ownerOperatorUserId: 101, code: 'TRIP10', name: 'Trip 10',
  discountType: 'Percentage', discountValue: 10, maxDiscountAmount: 50000,
  minOrderAmount: 100000, usageLimit: null, usageLimitPerUser: 1, usedCount: 2,
  validFromUtc: '2026-10-01T00:00:00Z', validToUtc: '2026-12-01T00:00:00Z',
  status: 'Active', createdAtUtc: '2026-09-01T00:00:00Z', updatedAtUtc: '2026-10-01T00:00:00Z',
  applicableTourIds: [4, 5],
};

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

  it('loads and validates owned coupon responses with the bearer token', async () => {
    vi.mocked(AuthStorage.getAccessToken).mockReturnValue('access-token');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([backendCoupon]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(listOperatorCoupons()).resolves.toEqual([backendCoupon]);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/operator\/coupons$/),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer access-token' }) }));

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(backendCoupon), { status: 200 }));
    await expect(getOperatorCoupon('31')).resolves.toEqual(backendCoupon);
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/operator\/coupons\/31$/);
  });

  it('rejects malformed coupon records and invalid IDs without a request', async () => {
    vi.mocked(AuthStorage.getAccessToken).mockReturnValue('access-token');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ ...backendCoupon, usedCount: '2' }]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(listOperatorCoupons()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
    await expect(getOperatorCoupon('TRIP10')).rejects.toMatchObject({ code: 'INVALID_ID' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('serializes the full update including null limits and maps usage conflict', async () => {
    vi.mocked(AuthStorage.getAccessToken).mockReturnValue('access-token');
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(backendCoupon), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ errorCode: 'coupon.usage_conflict' }), { status: 409 }));
    vi.stubGlobal('fetch', fetchMock);
    const input = {
      name: 'Trip 10', discountType: 'Percentage' as const, discountValue: 12,
      maxDiscountAmount: 50000, minOrderAmount: 100000, usageLimit: null,
      usageLimitPerUser: null, validFromUtc: backendCoupon.validFromUtc,
      validToUtc: backendCoupon.validToUtc, applicableTourIds: [4, 5],
    };
    await expect(updateOperatorCoupon('31', input)).resolves.toEqual(backendCoupon);
    expect(fetchMock.mock.calls[0][1].method).toBe('PUT');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(input);
    await expect(updateOperatorCoupon('31', input)).rejects.toMatchObject({ status: 409, code: 'coupon.usage_conflict' });
  });

  it('keeps activation separate and validates its response', async () => {
    vi.mocked(AuthStorage.getAccessToken).mockReturnValue('access-token');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...backendCoupon, status: 'Disabled' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(setOperatorCouponActivation('31', false)).resolves.toMatchObject({ status: 'Disabled' });
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/operator\/coupons\/31\/deactivate$/);
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
  });

  it('keeps safe field errors from a validation problem response', async () => {
    vi.mocked(AuthStorage.getAccessToken).mockReturnValue('access-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      title: 'One or more validation errors occurred.',
      errors: { Name: ['Name must not exceed 120 characters.'] },
    }), { status: 400 })));

    await expect(updateOperatorCoupon('31', {
      name: 'N'.repeat(121), discountType: 'Percentage', discountValue: 10,
      maxDiscountAmount: 50000, minOrderAmount: 0, usageLimit: null,
      usageLimitPerUser: 1, validFromUtc: backendCoupon.validFromUtc,
      validToUtc: backendCoupon.validToUtc, applicableTourIds: [4],
    })).rejects.toMatchObject({
      status: 400,
      fieldErrors: { Name: 'Name must not exceed 120 characters.' },
    });
  });
});
