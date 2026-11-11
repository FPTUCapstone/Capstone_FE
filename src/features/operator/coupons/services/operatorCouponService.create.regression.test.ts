import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createCoupon,
  deriveCouponTemporalStatus,
  getEligibleTours,
  getOperatorCoupons,
  getTodayDateString,
  resetDemoCouponsStore,
  validateCreateCoupon,
} from './operatorCouponService';
import {
  OPERATOR_COUPON_MESSAGES,
  type CreateCouponPayload,
} from '../types/couponLifecycle';

const validPayload: CreateCouponPayload = {
  couponCode: 'TEST10',
  name: 'Create coupon regression',
  discountType: 'Percentage',
  discountValue: 10,
  maxDiscountAmount: 200000,
  minSpend: 500000,
  usageLimit: 50,
  usageLimitPerTraveler: 1,
  validFrom: '2026-10-10',
  validTo: '2030-10-30',
  appliesToAllTours: false,
  appliedTourIds: ['tour-142'],
};

const validationOptions = {
  today: '2026-10-07',
  ownedTourIds: ['tour-142', 'tour-148'],
};

beforeEach(() => {
  resetDemoCouponsStore();
  vi.stubEnv('NODE_ENV', 'test');
});

afterEach(() => vi.unstubAllEnvs());

describe('operatorCouponService UC-38 create regression coverage', () => {
  it('accepts a valid create payload', () => {
    expect(validateCreateCoupon(validPayload, validationOptions)).toEqual({});
  });

  it('allows a same-day validity period', () => {
    const errors = validateCreateCoupon({
      ...validPayload,
      validFrom: '2026-10-15',
      validTo: '2026-10-15',
    }, validationOptions);
    expect(errors.validTo).toBeUndefined();
  });

  it('rejects an end date before the start date', () => {
    const errors = validateCreateCoupon({
      ...validPayload,
      validFrom: '2026-10-31',
      validTo: '2026-10-15',
    }, validationOptions);
    expect(errors.validTo).toBe(OPERATOR_COUPON_MESSAGES.INVALID_VALIDITY_PERIOD);
  });

  it('rejects an end date before today', () => {
    const errors = validateCreateCoupon({
      ...validPayload,
      validFrom: '2026-10-01',
      validTo: '2026-10-06',
    }, validationOptions);
    expect(errors.validTo).toBe(OPERATOR_COUPON_MESSAGES.INVALID_VALIDITY_PERIOD);
  });

  it('requires code, name and validity dates', () => {
    const errors = validateCreateCoupon({
      ...validPayload,
      couponCode: ' ',
      name: '',
      validFrom: '',
      validTo: '',
    }, validationOptions);
    expect(errors).toMatchObject({
      couponCode: OPERATOR_COUPON_MESSAGES.REQUIRED_FIELD,
      name: OPERATOR_COUPON_MESSAGES.REQUIRED_FIELD,
      validFrom: OPERATOR_COUPON_MESSAGES.REQUIRED_FIELD,
      validTo: OPERATOR_COUPON_MESSAGES.REQUIRED_FIELD,
    });
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'rejects invalid total usage limit %s',
    (usageLimit) => {
      expect(validateCreateCoupon({ ...validPayload, usageLimit }, validationOptions).usageLimit)
        .toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
    }
  );

  it.each([0, -1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'rejects invalid per-traveler usage limit %s',
    (usageLimitPerTraveler) => {
      expect(validateCreateCoupon({ ...validPayload, usageLimitPerTraveler }, validationOptions).usageLimitPerTraveler)
        .toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
    }
  );

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 0, -1])(
    'rejects invalid discount value %s',
    (discountValue) => {
      expect(validateCreateCoupon({ ...validPayload, discountValue }, validationOptions).discountValue)
        .toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
    }
  );

  it('accepts 100 percent and rejects a percentage above 100', () => {
    expect(validateCreateCoupon({ ...validPayload, discountValue: 100 }, validationOptions).discountValue)
      .toBeUndefined();
    expect(validateCreateCoupon({ ...validPayload, discountValue: 101 }, validationOptions).discountValue)
      .toContain('100%');
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 0, -1])(
    'rejects invalid maximum discount %s',
    (maxDiscountAmount) => {
      expect(validateCreateCoupon({ ...validPayload, maxDiscountAmount }, validationOptions).maxDiscountAmount)
        .toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
    }
  );

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -1])(
    'rejects invalid minimum spend %s',
    (minSpend) => {
      expect(validateCreateCoupon({ ...validPayload, minSpend }, validationOptions).minSpend)
        .toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
    }
  );

  it('allows zero minimum spend and omitted optional monetary fields', () => {
    expect(validateCreateCoupon({
      ...validPayload,
      minSpend: 0,
      maxDiscountAmount: null,
    }, validationOptions)).toEqual({});
  });

  it('rejects a duplicate code case-insensitively', () => {
    const errors = validateCreateCoupon({ ...validPayload, couponCode: ' test10 ' }, {
      ...validationOptions,
      existingCodes: ['TEST10'],
    });
    expect(errors.couponCode).toBe(OPERATOR_COUPON_MESSAGES.DUPLICATE_CODE);
  });

  it('requires a specific tour when all-tours is off', () => {
    const errors = validateCreateCoupon({
      ...validPayload,
      appliesToAllTours: false,
      appliedTourIds: [],
    }, validationOptions);
    expect(errors.appliedTourIds).toBeDefined();
  });

  it('rejects a tour owned by another operator', () => {
    const errors = validateCreateCoupon({
      ...validPayload,
      appliedTourIds: ['tour-202'],
    }, validationOptions);
    expect(errors.appliedTourIds).toBe(OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_TOUR_SCOPE);
  });

  it('fails closed when the owned-tour context is missing or empty', () => {
    expect(validateCreateCoupon(validPayload).appliedTourIds).toBeDefined();
    expect(validateCreateCoupon(validPayload, { ...validationOptions, ownedTourIds: [] }).appliedTourIds)
      .toBeDefined();
  });

  it('returns only eligible tours owned by the current operator', async () => {
    const result = await getEligibleTours({ allowDemo: true, currentUserId: 202 });
    expect(result.status).toBe('SUCCESS');
    expect(result.data?.length).toBeGreaterThan(0);
    expect(result.data?.every((tour) => tour.operatorUserId === 202)).toBe(true);
  });

  it('requires an actor before reading demo-owned tours', async () => {
    const result = await getEligibleTours({ allowDemo: true });
    expect(result).toMatchObject({ status: 'UNAUTHORIZED', data: [] });
  });

  it('creates and lists a valid fixture coupon for the authenticated owner', async () => {
    const created = await createCoupon({
      ...validPayload,
      couponCode: 'OWNER202',
      appliedTourIds: ['tour-202'],
    }, {
      allowDemo: true,
      currentUserId: 202,
      today: validationOptions.today,
    });
    expect(created).toMatchObject({ status: 'SUCCESS', data: { operatorUserId: 202 } });

    const list = await getOperatorCoupons({ allowDemo: true, currentUserId: 202 });
    expect(list.data?.some((coupon) => coupon.couponCode === 'OWNER202')).toBe(true);
  });

  it('does not mutate the fixture store after invalid creation', async () => {
    const before = await getOperatorCoupons({ allowDemo: true, currentUserId: 101 });
    const result = await createCoupon({ ...validPayload, usageLimit: 0 }, {
      allowDemo: true,
      currentUserId: 101,
      today: validationOptions.today,
    });
    const after = await getOperatorCoupons({ allowDemo: true, currentUserId: 101 });
    expect(result.status).toBe('VALIDATION_ERROR');
    expect(after.data).toEqual(before.data);
  });

  it('uses Vietnam calendar boundaries for today', () => {
    expect(getTodayDateString(new Date('2026-10-06T16:59:59Z'))).toBe('2026-10-06');
    expect(getTodayDateString(new Date('2026-10-06T17:00:00Z'))).toBe('2026-10-07');
  });

  it('derives scheduled, active and expired temporal states', () => {
    const base = { status: 'Active' as const, validFrom: '2026-10-10', validTo: '2026-10-20' };
    expect(deriveCouponTemporalStatus(base, '2026-10-07')).toBe('Scheduled');
    expect(deriveCouponTemporalStatus(base, '2026-10-10')).toBe('Active');
    expect(deriveCouponTemporalStatus(base, '2026-10-21')).toBe('Expired');
  });
});
