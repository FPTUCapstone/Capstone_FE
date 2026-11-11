import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as couponApi from './couponApi';
import {
  activateCoupon,
  createCoupon,
  deactivateCoupon,
  getEligibleTours,
  getOperatorCouponById,
  getOperatorCoupons,
  resetDemoCouponsStore,
  updateCoupon,
  validateCreateCoupon,
  validateUpdateCoupon,
} from './operatorCouponService';
import type { CouponDto, CreateCouponPayload, UpdateCouponPayload } from '../types/couponLifecycle';

vi.mock('./couponApi', () => ({
  getEligibleCouponTours: vi.fn(),
  listOperatorCoupons: vi.fn(),
  getOperatorCoupon: vi.fn(),
  updateOperatorCoupon: vi.fn(),
  setOperatorCouponActivation: vi.fn(),
}));

const apiCoupon = {
  couponId: 31, ownerOperatorUserId: 101, code: 'TRIP10', name: 'Trip 10',
  discountType: 'Percentage' as const, discountValue: 10, maxDiscountAmount: 50000,
  minOrderAmount: 100000, usageLimit: null, usageLimitPerUser: 1, usedCount: 2,
  validFromUtc: '2026-10-01T00:00:00Z', validToUtc: '2030-12-01T00:00:00Z',
  status: 'Active' as const, createdAtUtc: '2026-09-01T00:00:00Z',
  updatedAtUtc: '2026-10-01T00:00:00Z', applicableTourIds: [4, 5],
};

const currentCoupon: CouponDto = {
  id: '31', couponCode: 'TRIP10', name: 'Trip 10', operatorUserId: 101,
  discountType: 'Percentage', discountValue: 10, maxDiscountAmount: 50000,
  minSpend: 100000, usageLimit: null, usageLimitPerTraveler: 1, usageCount: 2,
  validFrom: '2026-10-01', validTo: '2030-12-01', validFromUtc: apiCoupon.validFromUtc,
  validToUtc: apiCoupon.validToUtc, appliesToAllTours: false, appliedTourIds: ['4', '5'],
  status: 'Active', createdAt: apiCoupon.createdAtUtc, updatedAt: apiCoupon.updatedAtUtc,
};

const updatePayload: UpdateCouponPayload = {
  name: 'Trip 10', discountType: 'Percentage', discountValue: 12,
  maxDiscountAmount: 50000, minSpend: 100000, usageLimit: null,
  usageLimitPerTraveler: null, validFrom: apiCoupon.validFromUtc,
  validTo: apiCoupon.validToUtc, appliesToAllTours: false, appliedTourIds: ['4'],
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => vi.unstubAllEnvs());

describe('operatorCouponService UC-39 production API', () => {
  it('maps canonical list and detail without converting unlimited to zero', async () => {
    vi.mocked(couponApi.listOperatorCoupons).mockResolvedValue([apiCoupon]);
    vi.mocked(couponApi.getOperatorCoupon).mockResolvedValue(apiCoupon);
    const list = await getOperatorCoupons({ currentUserId: 101 });
    const detail = await getOperatorCouponById('31', { currentUserId: 101 });
    expect(list).toMatchObject({ status: 'SUCCESS' });
    expect(list.data?.[0]).toMatchObject({ id: '31', usageLimit: null, appliedTourIds: ['4', '5'] });
    expect(detail.data?.validFromUtc).toBe(apiCoupon.validFromUtc);
  });

  it('requires an authenticated operator identity before any private request', async () => {
    expect((await getOperatorCoupons()).status).toBe('UNAUTHORIZED');
    expect((await getOperatorCouponById('31')).status).toBe('UNAUTHORIZED');
    expect((await updateCoupon('31', updatePayload)).status).toBe('UNAUTHORIZED');
    expect((await activateCoupon('31')).status).toBe('UNAUTHORIZED');
    expect((await deactivateCoupon('31')).status).toBe('UNAUTHORIZED');
    expect(couponApi.listOperatorCoupons).not.toHaveBeenCalled();
    expect(couponApi.getOperatorCoupon).not.toHaveBeenCalled();
  });

  it('fails closed when backend ownership does not match the signed-in operator', async () => {
    vi.mocked(couponApi.getOperatorCoupon).mockResolvedValue({ ...apiCoupon, ownerOperatorUserId: 202 });
    const result = await getOperatorCouponById('31', { currentUserId: 101 });
    expect(result.status).toBe('SYSTEM_ERROR');
    expect(result.data).toBeUndefined();
  });

  it('sends current tour IDs and immutable discount type to update API', async () => {
    vi.mocked(couponApi.updateOperatorCoupon).mockResolvedValue(apiCoupon);
    const result = await updateCoupon('31', {
      ...updatePayload, appliesToAllTours: true, appliedTourIds: [],
    }, { currentUserId: 101, eligibleTourIds: ['4', '5'] });
    expect(result.status).toBe('SUCCESS');
    expect(couponApi.updateOperatorCoupon).toHaveBeenCalledWith('31', expect.objectContaining({
      discountType: 'Percentage', usageLimit: null, applicableTourIds: [4, 5],
    }));
  });

  it('rejects malformed production dates and tour IDs before update API', async () => {
    const result = await updateCoupon('31', {
      ...updatePayload, validFrom: '2026-10-01', appliedTourIds: ['tour-4'],
    }, { currentUserId: 101 });
    expect(result.status).toBe('VALIDATION_ERROR');
    expect(couponApi.updateOperatorCoupon).not.toHaveBeenCalled();
  });

  it('calls backend activation endpoints and verifies returned ownership', async () => {
    vi.mocked(couponApi.setOperatorCouponActivation)
      .mockResolvedValueOnce({ ...apiCoupon, status: 'Disabled' })
      .mockResolvedValueOnce(apiCoupon);
    expect((await deactivateCoupon('31', { currentUserId: 101 })).status).toBe('SUCCESS');
    expect((await activateCoupon('31', { currentUserId: 101 })).status).toBe('SUCCESS');
    expect(couponApi.setOperatorCouponActivation).toHaveBeenNthCalledWith(1, '31', false);
    expect(couponApi.setOperatorCouponActivation).toHaveBeenNthCalledWith(2, '31', true);
  });

  it('maps backend authorization, conflict, validation, not-found and system failures', async () => {
    for (const [status, expected] of [[401, 'UNAUTHORIZED'], [404, 'NOT_FOUND'], [409, 'CONFLICT'], [422, 'VALIDATION_ERROR'], [500, 'SYSTEM_ERROR']] as const) {
      vi.mocked(couponApi.getOperatorCoupon).mockRejectedValueOnce({ status });
      expect((await getOperatorCouponById('31', { currentUserId: 101 })).status).toBe(expected);
    }
  });
});

describe('operatorCouponService UC-39 validation', () => {
  const options = { ownedTourIds: ['4', '5'], now: new Date('2026-10-26T00:00:00Z') };

  it('allows unlimited or a total limit equal to usage count', () => {
    expect(validateUpdateCoupon(currentCoupon, updatePayload, options)).toEqual({});
    expect(validateUpdateCoupon(currentCoupon, { ...updatePayload, usageLimit: 2 }, options)).toEqual({});
  });

  it('rejects a total limit below usage and changing an elapsed start instant', () => {
    expect(validateUpdateCoupon(currentCoupon, { ...updatePayload, usageLimit: 1 }, options).usageLimit).toBeDefined();
    expect(validateUpdateCoupon(currentCoupon, {
      ...updatePayload, validFrom: '2026-09-30T00:00:00Z',
    }, options).validFrom).toBeDefined();
  });

  it('rejects changing discount type or selecting a foreign tour', () => {
    expect(validateUpdateCoupon(currentCoupon, {
      ...updatePayload, discountType: 'Flat', appliedTourIds: ['999'],
    }, options)).toMatchObject({ discountType: expect.any(String), appliedTourIds: expect.any(String) });
  });

  it('associates a name longer than 120 characters with the name field', () => {
    expect(validateUpdateCoupon(currentCoupon, {
      ...updatePayload, name: 'N'.repeat(121),
    }, options)).toMatchObject({ name: expect.any(String) });
  });

  it('maps backend validation details to editable form fields', async () => {
    vi.mocked(couponApi.updateOperatorCoupon).mockRejectedValue({
      status: 400,
      fieldErrors: { Name: 'Name must not exceed 120 characters.' },
    });
    await expect(updateCoupon('31', updatePayload, {
      currentUserId: 101, eligibleTourIds: ['4', '5'],
    })).resolves.toMatchObject({
      status: 'VALIDATION_ERROR',
      errors: { name: 'Name must not exceed 120 characters.' },
    });
  });
});

describe('operatorCouponService UC-38 create fixture support', () => {
  beforeEach(() => {
    resetDemoCouponsStore();
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');
  });

  const createPayload: CreateCouponPayload = {
    couponCode: 'NEW38', name: 'Create coupon fixture', discountType: 'Flat',
    discountValue: 50000, maxDiscountAmount: null, minSpend: 100000,
    usageLimit: 20, usageLimitPerTraveler: 1, validFrom: '2026-10-26',
    validTo: '2030-12-01', appliesToAllTours: false, appliedTourIds: ['tour-142'],
  };

  it('keeps owned-tour fixtures available to the UC-38 create page', async () => {
    const result = await getEligibleTours({ allowDemo: true, currentUserId: 101 });
    expect(result.status).toBe('SUCCESS');
    expect(result.data?.length).toBeGreaterThan(0);
    expect(result.data?.every((tour) => tour.operatorUserId === 101)).toBe(true);
  });

  it('creates a fixture coupon only when UC-38 explicitly enables fixture mode', async () => {
    const result = await createCoupon(createPayload, {
      allowDemo: true, currentUserId: 101, today: '2026-10-26',
    });
    expect(result.status).toBe('SUCCESS');
    expect(result.data).toMatchObject({ couponCode: 'NEW38', operatorUserId: 101 });
  });

  it('retains create validation for duplicate codes, date ranges and tour ownership', () => {
    expect(validateCreateCoupon(createPayload, {
      existingCodes: ['NEW38'], ownedTourIds: ['tour-142'], today: '2026-10-26',
    }).couponCode).toBeDefined();
    expect(validateCreateCoupon({ ...createPayload, validTo: '2026-10-25' }, {
      existingCodes: [], ownedTourIds: ['tour-142'], today: '2026-10-26',
    }).validTo).toBeDefined();
    expect(validateCreateCoupon({ ...createPayload, appliedTourIds: ['foreign-tour'] }, {
      existingCodes: [], ownedTourIds: ['tour-142'], today: '2026-10-26',
    }).appliedTourIds).toBeDefined();
  });
});
