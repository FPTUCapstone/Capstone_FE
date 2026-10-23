import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createCoupon,
  updateCoupon,
  deactivateCoupon,
  activateCoupon,
  getOperatorCoupons,
  getOperatorCouponById,
  getEligibleTours,
  resetDemoCouponsStore,
  validateCreateCoupon,
  validateUpdateCoupon,
  isCouponExpired,
  deriveCouponTemporalStatus,
  getTodayDateString,
} from './operatorCouponService';
import {
  OPERATOR_COUPON_MESSAGES,
  type CreateCouponPayload,
  type UpdateCouponPayload,
} from '../types/couponLifecycle';

beforeEach(() => {
  resetDemoCouponsStore();
  vi.unstubAllEnvs();
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');
});

describe('operatorCouponService - validateCreateCoupon & Date Boundary (UC-38, BR-22)', () => {
  const baseValidPayload: CreateCouponPayload = {
    couponCode: 'TEST10',
    name: 'Khuyến mãi kiểm thử 10%',
    discountType: 'Percentage',
    discountValue: 10,
    maxDiscountAmount: 200000,
    minSpend: 500000,
    usageLimit: 50,
    usageLimitPerTraveler: 1,
    validFrom: '2026-10-10',
    validTo: '2026-10-30',
    appliesToAllTours: true,
    appliedTourIds: [],
  };

  it('passes on valid payload when validFrom < validTo', () => {
    const errors = validateCreateCoupon(baseValidPayload, {
      today: '2026-10-07',
      ownedTourIds: ['tour-142'],
    });
    expect(Object.keys(errors).length).toBe(0);
  });

  it('allows same-day coupon when validFrom == validTo per canonical BR-22', () => {
    const errors = validateCreateCoupon(
      {
        ...baseValidPayload,
        validFrom: '2026-10-15',
        validTo: '2026-10-15',
      },
      { today: '2026-10-07', ownedTourIds: ['tour-142'] }
    );
    expect(errors.validTo).toBeUndefined();
    expect(Object.keys(errors).length).toBe(0);
  });

  it('allows validTo == today when validFrom <= validTo (BR-22 boundary)', () => {
    const today = getTodayDateString();
    const sameDayTodayErrors = validateCreateCoupon(
      {
        ...baseValidPayload,
        validFrom: today,
        validTo: today,
      },
      { today }
    );
    expect(sameDayTodayErrors.validTo).toBeUndefined();

    const earlierStartTodayEndErrors = validateCreateCoupon(
      {
        ...baseValidPayload,
        validFrom: '2026-01-01',
        validTo: today,
      },
      { today }
    );
    expect(earlierStartTodayEndErrors.validTo).toBeUndefined();
  });

  it('rejects logically invalid date period with MSG29 when validFrom > validTo', () => {
    const errors = validateCreateCoupon(
      {
        ...baseValidPayload,
        validFrom: '2026-10-31',
        validTo: '2026-10-15',
      },
      { today: '2026-10-07' }
    );
    expect(errors.validTo).toBe(OPERATOR_COUPON_MESSAGES.INVALID_VALIDITY_PERIOD);
    expect(errors.validTo).toContain('Start date must not be later than end date');
  });

  it('rejects validTo < today with MSG29', () => {
    const errors = validateCreateCoupon(
      {
        ...baseValidPayload,
        validFrom: '2026-10-01',
        validTo: '2026-10-06',
      },
      { today: '2026-10-07' }
    );
    expect(errors.validTo).toBe(OPERATOR_COUPON_MESSAGES.INVALID_VALIDITY_PERIOD);
  });

  it('rejects empty mandatory fields with MSG01', () => {
    const errors = validateCreateCoupon({
      ...baseValidPayload,
      couponCode: '   ',
      name: '',
      validFrom: '',
      validTo: '',
    });
    expect(errors.couponCode).toBe(OPERATOR_COUPON_MESSAGES.REQUIRED_FIELD);
    expect(errors.name).toBe(OPERATOR_COUPON_MESSAGES.REQUIRED_FIELD);
    expect(errors.validFrom).toBe(OPERATOR_COUPON_MESSAGES.REQUIRED_FIELD);
    expect(errors.validTo).toBe(OPERATOR_COUPON_MESSAGES.REQUIRED_FIELD);
  });

  it('rejects non-positive numeric values with MSG143', () => {
    const errors = validateCreateCoupon({
      ...baseValidPayload,
      discountValue: -5,
      usageLimit: 0,
      maxDiscountAmount: -100,
      usageLimitPerTraveler: -1,
    });
    expect(errors.discountValue).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
    expect(errors.usageLimit).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
    expect(errors.maxDiscountAmount).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
    expect(errors.usageLimitPerTraveler).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
  });

  it('rejects percentage discount greater than 100%', () => {
    const errors = validateCreateCoupon({
      ...baseValidPayload,
      discountType: 'Percentage',
      discountValue: 105,
    });
    expect(errors.discountValue).toContain('100%');
  });

  it('rejects duplicate coupon code with MSG113 (BR-97)', () => {
    const errors = validateCreateCoupon(
      {
        ...baseValidPayload,
        couponCode: 'bana15',
      },
      { existingCodes: ['BANA15', 'DANANG50K'] }
    );
    expect(errors.couponCode).toBe(OPERATOR_COUPON_MESSAGES.DUPLICATE_CODE);
  });

  it('rejects tour scope when not appliesToAllTours and no tour selected (BR-98)', () => {
    const errors = validateCreateCoupon({
      ...baseValidPayload,
      appliesToAllTours: false,
      appliedTourIds: [],
    });
    expect(errors.appliedTourIds).toBeDefined();
  });

  it('rejects unowned tour in tour scope with MSG126 (BR-98, BR-102)', () => {
    const errors = validateCreateCoupon(
      {
        ...baseValidPayload,
        appliesToAllTours: false,
        appliedTourIds: ['unowned-tour-999'],
      },
      { ownedTourIds: ['tour-142', 'tour-148'] }
    );
    expect(errors.appliedTourIds).toBe(OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_TOUR_SCOPE);
  });
});

describe('operatorCouponService - validateUpdateCoupon (UC-39)', () => {
  const currentCoupon = {
    id: 'cp-bana15',
    couponCode: 'BANA15',
    name: 'Ba Na 15',
    operatorUserId: 101,
    discountType: 'Percentage' as const,
    discountValue: 15,
    maxDiscountAmount: 500000,
    minSpend: 1000000,
    usageLimit: 200,
    usageLimitPerTraveler: 1,
    validFrom: '2026-09-01',
    validTo: '2026-10-31',
    appliesToAllTours: true,
    appliedTourIds: [],
    usageCount: 86,
    status: 'Active' as const,
    createdAt: '2026-08-25T08:00:00Z',
    updatedAt: '2026-08-25T08:00:00Z',
  };

  it('passes on valid update payload including same-day validFrom == validTo', () => {
    const payload: UpdateCouponPayload = {
      name: 'Ba Na 15 Updated',
      discountValue: 18,
      usageLimit: 250,
      validFrom: '2026-10-20',
      validTo: '2026-10-20',
      appliesToAllTours: true,
      appliedTourIds: [],
    };
    const errors = validateUpdateCoupon(currentCoupon, payload, {
      today: '2026-10-07',
      ownedTourIds: ['tour-142'],
    });
    expect(Object.keys(errors).length).toBe(0);
  });

  it('rejects usage limit reduced below recorded usage count with MSG143 (BR-99)', () => {
    const payload: UpdateCouponPayload = {
      name: 'Ba Na 15 Updated',
      discountValue: 18,
      usageLimit: 80, // current usageCount is 86
      validFrom: '2026-09-01',
      validTo: '2026-10-31',
      appliesToAllTours: true,
      appliedTourIds: [],
    };
    const errors = validateUpdateCoupon(currentCoupon, payload);
    expect(errors.usageLimit).toBe(OPERATOR_COUPON_MESSAGES.USAGE_LIMIT_BELOW_USAGE_COUNT);
  });

  it('allows usage limit equal to recorded usage count (BR-99 floor boundary)', () => {
    const payload: UpdateCouponPayload = {
      name: 'Ba Na 15 Updated',
      discountValue: 18,
      usageLimit: 86, // equal to usageCount
      validFrom: '2026-09-01',
      validTo: '2026-10-31',
      appliesToAllTours: true,
      appliedTourIds: [],
    };
    const errors = validateUpdateCoupon(currentCoupon, payload);
    expect(errors.usageLimit).toBeUndefined();
  });

  it('rejects invalid validity period on update with MSG29 (BR-22)', () => {
    const payload: UpdateCouponPayload = {
      name: 'Ba Na 15 Updated',
      discountValue: 18,
      usageLimit: 100,
      validFrom: '2026-10-30',
      validTo: '2026-10-01',
      appliesToAllTours: true,
      appliedTourIds: [],
    };
    const errors = validateUpdateCoupon(currentCoupon, payload);
    expect(errors.validTo).toBe(OPERATOR_COUPON_MESSAGES.INVALID_VALIDITY_PERIOD);
  });

  it('rejects unowned tour in update scope with MSG126 (BR-98, BR-102)', () => {
    const payload: UpdateCouponPayload = {
      name: 'Ba Na 15 Updated',
      discountValue: 18,
      usageLimit: 100,
      validFrom: '2026-10-01',
      validTo: '2026-10-31',
      appliesToAllTours: false,
      appliedTourIds: ['unowned-tour-888'],
    };
    const errors = validateUpdateCoupon(currentCoupon, payload, {
      ownedTourIds: ['tour-142', 'tour-148'],
    });
    expect(errors.appliedTourIds).toBe(OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_TOUR_SCOPE);
  });
});

describe('operatorCouponService - Ownership Enforcement (BR-102, MSG126)', () => {
  it('succeeds when session userId matches coupon.operatorUserId', async () => {
    const res = await getOperatorCouponById('cp-bana15', {
      allowDemo: true,
      currentUserId: 101,
    });
    expect(res.status).toBe('SUCCESS');
    expect(res.data?.couponCode).toBe('BANA15');
    expect(res.data?.operatorUserId).toBe(101);
  });

  it('returns UNAUTHORIZED (MSG126) when session userId != coupon.operatorUserId on getOperatorCouponById', async () => {
    const res = await getOperatorCouponById('cp-bana15', {
      allowDemo: true,
      currentUserId: 999,
    });
    expect(res.status).toBe('UNAUTHORIZED');
    expect(res.message).toBe(OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_OWNER);
    expect(res.data).toBeUndefined();
  });

  it('blocks foreign operator update attempt and leaves coupon unchanged', async () => {
    const res = await updateCoupon(
      'cp-bana15',
      {
        name: 'Foreign Tamper Attempt',
        discountValue: 90,
        usageLimit: 500,
        validFrom: '2026-09-01',
        validTo: '2026-10-31',
        appliesToAllTours: true,
        appliedTourIds: [],
      },
      { allowDemo: true, currentUserId: 999 }
    );
    expect(res.status).toBe('UNAUTHORIZED');
    expect(res.message).toBe(OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_OWNER);

    const check = await getOperatorCouponById('cp-bana15', {
      allowDemo: true,
      currentUserId: 101,
    });
    expect(check.data?.name).toBe('Ưu đãi Bà Nà Hills tháng 9 & 10');
    expect(check.data?.discountValue).toBe(15);
  });

  it('blocks foreign operator deactivate attempt and leaves coupon unchanged', async () => {
    const res = await deactivateCoupon('cp-bana15', {
      allowDemo: true,
      currentUserId: 999,
    });
    expect(res.status).toBe('UNAUTHORIZED');
    expect(res.message).toBe(OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_OWNER);

    const check = await getOperatorCouponById('cp-bana15', {
      allowDemo: true,
      currentUserId: 101,
    });
    expect(check.data?.status).toBe('Active');
  });

  it('blocks foreign operator activate attempt and leaves coupon unchanged', async () => {
    await deactivateCoupon('cp-bana15', { allowDemo: true, currentUserId: 101 });

    const res = await activateCoupon('cp-bana15', {
      allowDemo: true,
      currentUserId: 999,
    });
    expect(res.status).toBe('UNAUTHORIZED');
    expect(res.message).toBe(OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_OWNER);

    const check = await getOperatorCouponById('cp-bana15', {
      allowDemo: true,
      currentUserId: 101,
    });
    expect(check.data?.status).toBe('Inactive');
  });

  it('fails closed when actor identity is missing in Demo ownership-sensitive operations (never falls back to 101)', async () => {
    const listNoActor = await getOperatorCoupons({ allowDemo: true });
    expect(listNoActor.status).toBe('UNAUTHORIZED');
    expect(listNoActor.data).toEqual([]);

    const getNoActor = await getOperatorCouponById('cp-bana15', { allowDemo: true });
    expect(getNoActor.status).toBe('UNAUTHORIZED');
    expect(getNoActor.data).toBeUndefined();

    const createNoActor = await createCoupon(
      {
        couponCode: 'NOACTOR10',
        name: 'No Actor Coupon',
        discountType: 'Percentage',
        discountValue: 10,
        usageLimit: 50,
        validFrom: '2026-10-10',
        validTo: '2026-10-30',
        appliesToAllTours: true,
        appliedTourIds: [],
      },
      { allowDemo: true }
    );
    expect(createNoActor.status).toBe('UNAUTHORIZED');

    const updateNoActor = await updateCoupon(
      'cp-bana15',
      {
        name: 'No Actor Update',
        discountValue: 15,
        usageLimit: 200,
        validFrom: '2026-09-01',
        validTo: '2026-10-31',
        appliesToAllTours: true,
        appliedTourIds: [],
      },
      { allowDemo: true }
    );
    expect(updateNoActor.status).toBe('UNAUTHORIZED');

    const deactNoActor = await deactivateCoupon('cp-bana15', { allowDemo: true });
    expect(deactNoActor.status).toBe('UNAUTHORIZED');

    const actNoActor = await activateCoupon('cp-bana15', { allowDemo: true });
    expect(actNoActor.status).toBe('UNAUTHORIZED');
  });

  it('sets authenticated currentUserId as owner on Create Coupon Demo', async () => {
    const createRes = await createCoupon(
      {
        couponCode: 'OP202PROMO',
        name: 'Khuyến mãi Operator 202',
        discountType: 'Flat',
        discountValue: 100000,
        usageLimit: 40,
        validFrom: '2026-10-10',
        validTo: '2026-10-30',
        appliesToAllTours: true,
        appliedTourIds: [],
      },
      { allowDemo: true, currentUserId: 202 }
    );
    expect(createRes.status).toBe('SUCCESS');
    expect(createRes.data?.operatorUserId).toBe(202);

    // Operator 101 cannot load Operator 202's coupon
    const foreignLookup = await getOperatorCouponById(createRes.data!.id, {
      allowDemo: true,
      currentUserId: 101,
    });
    expect(foreignLookup.status).toBe('UNAUTHORIZED');
  });
});

describe('operatorCouponService - Expired Coupon Reactivation & Temporal Status (BR-97)', () => {
  it('blocks activation when coupon is Inactive and validTo is yesterday', async () => {
    // cp-summer2026 is Inactive with validTo 2026-08-31
    const res = await activateCoupon('cp-summer2026', {
      allowDemo: true,
      currentUserId: 101,
      today: '2026-09-01', // yesterday was 2026-08-31
    });

    expect(res.status).toBe('VALIDATION_ERROR');
    expect(res.message).toBe(OPERATOR_COUPON_MESSAGES.EXPIRED_REACTIVATION_BLOCKED);
    expect(res.message).not.toBe(OPERATOR_COUPON_MESSAGES.ACTIVATE_SUCCESS);

    const check = await getOperatorCouponById('cp-summer2026', {
      allowDemo: true,
      currentUserId: 101,
    });
    expect(check.data?.status).toBe('Inactive');
    expect(deriveCouponTemporalStatus(check.data!, '2026-09-01')).toBe('Expired');
  });

  it('activates to Scheduled when validFrom is in the future and validTo is in the future', async () => {
    await deactivateCoupon('cp-fallvip', { allowDemo: true, currentUserId: 101 });

    const res = await activateCoupon('cp-fallvip', {
      allowDemo: true,
      currentUserId: 101,
      today: '2026-10-07', // validFrom is 2026-11-01, validTo is 2026-11-30
    });
    expect(res.status).toBe('SUCCESS');
    expect(res.data?.status).toBe('Scheduled');
    expect(res.message).toBe(OPERATOR_COUPON_MESSAGES.ACTIVATE_SUCCESS);
  });

  it('activates to Active when within currently valid period', async () => {
    await deactivateCoupon('cp-bana15', { allowDemo: true, currentUserId: 101 });

    const res = await activateCoupon('cp-bana15', {
      allowDemo: true,
      currentUserId: 101,
      today: '2026-10-07', // validFrom 2026-09-01, validTo 2026-10-31
    });
    expect(res.status).toBe('SUCCESS');
    expect(res.data?.status).toBe('Active');
    expect(res.message).toBe(OPERATOR_COUPON_MESSAGES.ACTIVATE_SUCCESS);
  });

  it('treats validTo === today as NOT expired', async () => {
    expect(isCouponExpired('2026-10-31', '2026-10-31')).toBe(false);
    expect(isCouponExpired('2026-10-30', '2026-10-31')).toBe(true);

    await deactivateCoupon('cp-bana15', { allowDemo: true, currentUserId: 101 });
    const res = await activateCoupon('cp-bana15', {
      allowDemo: true,
      currentUserId: 101,
      today: '2026-10-31', // exact final day of BANA15
    });
    expect(res.status).toBe('SUCCESS');
    expect(res.data?.status).toBe('Active');
  });
});

describe('operatorCouponService - CRUD and Lifecycle in Demo & Production', () => {
  it('returns truthful PENDING_BE_INTEGRATION in production mode for all actions', async () => {
    const listRes = await getOperatorCoupons({ allowDemo: false });
    expect(listRes.status).toBe('PENDING_BE_INTEGRATION');
    expect(listRes.message).toBe(OPERATOR_COUPON_MESSAGES.PENDING_BE_INTEGRATION);

    const getRes = await getOperatorCouponById('cp-bana15', { allowDemo: false });
    expect(getRes.status).toBe('PENDING_BE_INTEGRATION');

    const toursRes = await getEligibleTours({ allowDemo: false });
    expect(toursRes.status).toBe('PENDING_BE_INTEGRATION');

    const createRes = await createCoupon(
      {
        couponCode: 'NEW2026',
        name: 'New Code',
        discountType: 'Percentage',
        discountValue: 10,
        usageLimit: 50,
        validFrom: '2026-10-10',
        validTo: '2026-10-30',
        appliesToAllTours: true,
        appliedTourIds: [],
      },
      { allowDemo: false }
    );
    expect(createRes.status).toBe('PENDING_BE_INTEGRATION');

    const updateRes = await updateCoupon(
      'cp-bana15',
      {
        name: 'Updated',
        discountValue: 20,
        usageLimit: 100,
        validFrom: '2026-10-01',
        validTo: '2026-10-31',
        appliesToAllTours: true,
        appliedTourIds: [],
      },
      { allowDemo: false }
    );
    expect(updateRes.status).toBe('PENDING_BE_INTEGRATION');

    const deactRes = await deactivateCoupon('cp-bana15', { allowDemo: false });
    expect(deactRes.status).toBe('PENDING_BE_INTEGRATION');

    const actRes = await activateCoupon('cp-bana15', { allowDemo: false });
    expect(actRes.status).toBe('PENDING_BE_INTEGRATION');
  });

  it('performs complete Create Coupon flow in Demo mode (UC-38)', async () => {
    const createRes = await createCoupon(
      {
        couponCode: 'VNDISCOUNT',
        name: 'Khuyến mãi Việt Nam',
        discountType: 'Percentage',
        discountValue: 25,
        maxDiscountAmount: 300000,
        minSpend: 600000,
        usageLimit: 75,
        usageLimitPerTraveler: 1,
        validFrom: '2026-10-01',
        validTo: '2026-10-31',
        appliesToAllTours: true,
        appliedTourIds: [],
      },
      { allowDemo: true, currentUserId: 101 }
    );

    expect(createRes.status).toBe('SUCCESS');
    expect(createRes.data?.couponCode).toBe('VNDISCOUNT');
    expect(createRes.data?.usageCount).toBe(0);
    expect(createRes.message).toBe(OPERATOR_COUPON_MESSAGES.CREATE_SUCCESS);

    // Verify it appears in list
    const listRes = await getOperatorCoupons({ allowDemo: true, currentUserId: 101 });
    expect(listRes.status).toBe('SUCCESS');
    const createdInList = listRes.data?.find((c) => c.couponCode === 'VNDISCOUNT');
    expect(createdInList).toBeDefined();
    expect(createdInList?.name).toBe('Khuyến mãi Việt Nam');
  });

  it('rejects duplicate coupon code in Demo mode with MSG113 (BR-97)', async () => {
    const res = await createCoupon(
      {
        couponCode: 'BANA15', // already exists in fixtures
        name: 'Duplicate attempt',
        discountType: 'Percentage',
        discountValue: 15,
        usageLimit: 100,
        validFrom: '2026-10-01',
        validTo: '2026-10-31',
        appliesToAllTours: true,
        appliedTourIds: [],
      },
      { allowDemo: true, currentUserId: 101 }
    );

    expect(res.status).toBe('VALIDATION_ERROR');
    expect(res.errors?.couponCode).toBe(OPERATOR_COUPON_MESSAGES.DUPLICATE_CODE);
  });

  it('performs complete Update Coupon flow in Demo mode (UC-39)', async () => {
    const updateRes = await updateCoupon(
      'cp-bana15',
      {
        name: 'Ba Na Hills Siêu Giảm Giá Mùa Thu',
        discountValue: 20,
        maxDiscountAmount: 600000,
        minSpend: 1200000,
        usageLimit: 250,
        usageLimitPerTraveler: 2,
        validFrom: '2026-09-01',
        validTo: '2026-11-15',
        appliesToAllTours: false,
        appliedTourIds: ['tour-142'],
      },
      { allowDemo: true, currentUserId: 101 }
    );

    expect(updateRes.status).toBe('SUCCESS');
    expect(updateRes.data?.name).toBe('Ba Na Hills Siêu Giảm Giá Mùa Thu');
    expect(updateRes.data?.couponCode).toBe('BANA15'); // Code remains unchanged (BR-97)
    expect(updateRes.data?.usageCount).toBe(86); // Recorded usage count preserved
    expect(updateRes.data?.usageLimit).toBe(250);
    expect(updateRes.message).toBe(OPERATOR_COUPON_MESSAGES.UPDATE_SUCCESS);
  });

  it('returns NOT_FOUND for non-existent coupon ID when authenticated actor is supplied', async () => {
    const res = await getOperatorCouponById('cp-non-existent-999', {
      allowDemo: true,
      currentUserId: 101,
    });
    expect(res.status).toBe('NOT_FOUND');
    expect(res.message).toBe(OPERATOR_COUPON_MESSAGES.NOT_FOUND);
  });
});

describe('operatorCouponService - Tour Scope Ownership & Zero-Owned Bypass (A15 Review Remediation)', () => {
  it('1. getEligibleTours: actor 101 returns only tours owned by 101', async () => {
    const res = await getEligibleTours({ allowDemo: true, currentUserId: 101 });
    expect(res.status).toBe('SUCCESS');
    expect(res.data).toBeDefined();
    expect(res.data!.length).toBeGreaterThan(0);
    res.data!.forEach((tour) => {
      expect(String(tour.operatorUserId)).toBe('101');
    });
    const tourIds = res.data!.map((t) => t.id);
    expect(tourIds).toContain('tour-142');
    expect(tourIds).toContain('tour-148');
    expect(tourIds).toContain('tour-55');
    expect(tourIds).not.toContain('tour-89');
    expect(tourIds).not.toContain('tour-202');
  });

  it('2. getEligibleTours: actor 202 returns only tours owned by 202 and no 101 tours', async () => {
    const res = await getEligibleTours({ allowDemo: true, currentUserId: 202 });
    expect(res.status).toBe('SUCCESS');
    expect(res.data).toBeDefined();
    expect(res.data!.length).toBeGreaterThan(0);
    res.data!.forEach((tour) => {
      expect(String(tour.operatorUserId)).toBe('202');
    });
    const tourIds = res.data!.map((t) => t.id);
    expect(tourIds).toContain('tour-89');
    expect(tourIds).toContain('tour-202');
    expect(tourIds).not.toContain('tour-142');
    expect(tourIds).not.toContain('tour-148');
    expect(tourIds).not.toContain('tour-55');
  });

  it('3. getEligibleTours: missing actor fails closed with UNAUTHORIZED and empty data', async () => {
    const resNoActor = await getEligibleTours({ allowDemo: true });
    expect(resNoActor.status).toBe('UNAUTHORIZED');
    expect(resNoActor.data).toEqual([]);

    const resEmptyActor = await getEligibleTours({ allowDemo: true, currentUserId: '   ' });
    expect(resEmptyActor.status).toBe('UNAUTHORIZED');
    expect(resEmptyActor.data).toEqual([]);
  });

  it('4. Create: actor 202 selecting tour owned by 101 is rejected and creates no coupon', async () => {
    const payload: CreateCouponPayload = {
      couponCode: 'ACTOR202_FAIL',
      name: 'Unauthorized Scope Coupon',
      discountType: 'Percentage',
      discountValue: 10,
      usageLimit: 50,
      validFrom: '2026-10-10',
      validTo: '2026-10-30',
      appliesToAllTours: false,
      appliedTourIds: ['tour-142'], // owned by 101, not 202
    };

    const res = await createCoupon(payload, { allowDemo: true, currentUserId: 202 });
    expect(res.status).toBe('VALIDATION_ERROR');
    expect(res.errors?.appliedTourIds).toBe(OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_TOUR_SCOPE);

    // Verify coupon was not saved
    const checkRes = await getOperatorCouponById('ACTOR202_FAIL', { allowDemo: true, currentUserId: 202 });
    expect(checkRes.status).toBe('NOT_FOUND');
  });

  it('5. Create: actor 202 selecting own tour is accepted in Demo mode', async () => {
    const payload: CreateCouponPayload = {
      couponCode: 'ACTOR202_OK',
      name: 'Authorized Scope Coupon',
      discountType: 'Percentage',
      discountValue: 15,
      usageLimit: 100,
      validFrom: '2026-10-10',
      validTo: '2026-10-30',
      appliesToAllTours: false,
      appliedTourIds: ['tour-89', 'tour-202'], // both owned by 202
    };

    const res = await createCoupon(payload, { allowDemo: true, currentUserId: 202 });
    expect(res.status).toBe('SUCCESS');
    expect(res.data?.couponCode).toBe('ACTOR202_OK');
    expect(String(res.data?.operatorUserId)).toBe('202');
    expect(res.data?.appliedTourIds).toEqual(['tour-89', 'tour-202']);
  });

  it('6. Update: operator 101 owns coupon but tries to change scope to operator 202 tour -> rejected', async () => {
    const updateRes = await updateCoupon(
      'cp-bana15', // owned by 101
      {
        name: 'Ba Na Hills Scope Hijack Attempt',
        discountValue: 15,
        usageLimit: 200,
        validFrom: '2026-09-01',
        validTo: '2026-10-31',
        appliesToAllTours: false,
        appliedTourIds: ['tour-89'], // owned by 202, foreign to 101
      },
      { allowDemo: true, currentUserId: 101 }
    );

    expect(updateRes.status).toBe('VALIDATION_ERROR');
    expect(updateRes.errors?.appliedTourIds).toBe(OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_TOUR_SCOPE);

    // Verify original coupon was untouched
    const checkRes = await getOperatorCouponById('cp-bana15', { allowDemo: true, currentUserId: 101 });
    expect(checkRes.status).toBe('SUCCESS');
    expect(checkRes.data?.appliedTourIds).toEqual(['tour-142', 'tour-148']);
  });

  it('7. Zero-owned actor: owned tour set = [] cannot bypass validation with foreign selected ID', () => {
    const payload: CreateCouponPayload = {
      couponCode: 'ZERO_OWNED',
      name: 'Zero Owned Actor Attempt',
      discountType: 'Percentage',
      discountValue: 10,
      usageLimit: 50,
      validFrom: '2026-10-10',
      validTo: '2026-10-30',
      appliesToAllTours: false,
      appliedTourIds: ['tour-142'],
    };

    // When ownedTourIds is provided as empty array []
    const errors = validateCreateCoupon(payload, { ownedTourIds: [] });
    expect(errors.appliedTourIds).toBe(OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_TOUR_SCOPE);
  });

  it('8. appliesToAllTours: actor 101 resolves only operator 101 tours', async () => {
    const res = await getOperatorCouponById('cp-fallvip', { allowDemo: true, currentUserId: 101 });
    expect(res.status).toBe('SUCCESS');
    expect(res.data?.appliesToAllTours).toBe(true);
    expect(res.data?.appliedTours).toBeDefined();
    expect(res.data!.appliedTours!.length).toBe(3);
    res.data!.appliedTours!.forEach((t) => {
      expect(String(t.operatorUserId)).toBe('101');
    });
  });

  it('9. appliesToAllTours: actor 202 resolves only operator 202 tours', async () => {
    // Create an appliesToAllTours coupon for operator 202
    await createCoupon(
      {
        couponCode: 'ALL202',
        name: 'All 202 Tours',
        discountType: 'Percentage',
        discountValue: 10,
        usageLimit: 50,
        validFrom: '2026-10-10',
        validTo: '2026-10-30',
        appliesToAllTours: true,
        appliedTourIds: [],
      },
      { allowDemo: true, currentUserId: 202 }
    );

    const listRes = await getOperatorCoupons({ allowDemo: true, currentUserId: 202 });
    expect(listRes.status).toBe('SUCCESS');
    const coupon202 = listRes.data?.find((c) => c.couponCode === 'ALL202');
    expect(coupon202).toBeDefined();
    expect(coupon202!.appliedTours).toBeDefined();
    expect(coupon202!.appliedTours!.length).toBe(2);
    coupon202!.appliedTours!.forEach((t) => {
      expect(String(t.operatorUserId)).toBe('202');
    });
  });
});

describe('operatorCouponService - Asia/Ho_Chi_Minh Calendar Authority (CR-07 P1 Remediation)', () => {
  it('resolves getTodayDateString across the Vietnam midnight boundary (16:59:59Z vs 17:00:00Z UTC)', () => {
    // 2026-10-07T16:59:59Z is 2026-10-07 23:59:59 in Asia/Ho_Chi_Minh (UTC+7)
    const beforeVietnamMidnight = new Date('2026-10-07T16:59:59Z');
    expect(getTodayDateString(beforeVietnamMidnight)).toBe('2026-10-07');

    // 2026-10-07T17:00:00Z is 2026-10-08 00:00:00 in Asia/Ho_Chi_Minh (UTC+7), even though UTC date is still 2026-10-07
    const atVietnamMidnight = new Date('2026-10-07T17:00:00Z');
    expect(getTodayDateString(atVietnamMidnight)).toBe('2026-10-08');

    // 2026-10-07T23:30:00Z is 2026-10-08 06:30:00 in Asia/Ho_Chi_Minh (00:00-06:59 VN window)
    const earlyMorningVietnam = new Date('2026-10-07T23:30:00Z');
    expect(getTodayDateString(earlyMorningVietnam)).toBe('2026-10-08');
  });

  it('derives Active, Scheduled, Expired, and same-day validity accurately during 00:00–06:59 Vietnam time', async () => {
    // Simulate system clock at 2026-10-07T17:30:00Z (00:30:00 on 2026-10-08 in Vietnam)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-07T17:30:00Z'));

    try {
      const vnToday = getTodayDateString();
      expect(vnToday).toBe('2026-10-08');

      // 1. Coupon starting today in Vietnam (2026-10-08) must be Active, NOT Scheduled
      expect(
        deriveCouponTemporalStatus({
          status: 'Active',
          validFrom: '2026-10-08',
          validTo: '2026-10-31',
        })
      ).toBe('Active');

      // 2. Coupon ending yesterday in Vietnam (2026-10-07) must be Expired, NOT Active
      expect(isCouponExpired('2026-10-07')).toBe(true);
      expect(
        deriveCouponTemporalStatus({
          status: 'Active',
          validFrom: '2026-10-01',
          validTo: '2026-10-07',
        })
      ).toBe('Expired');

      // 3. Coupon ending today in Vietnam (validTo === today inclusive) must remain Active
      expect(isCouponExpired('2026-10-08')).toBe(false);
      expect(
        deriveCouponTemporalStatus({
          status: 'Active',
          validFrom: '2026-10-01',
          validTo: '2026-10-08',
        })
      ).toBe('Active');

      // 4. Coupon starting tomorrow in Vietnam (validFrom === tomorrow) must be Scheduled
      expect(
        deriveCouponTemporalStatus({
          status: 'Active',
          validFrom: '2026-10-09',
          validTo: '2026-10-31',
        })
      ).toBe('Scheduled');

      // 5. Same-day coupon (validFrom === validTo === Vietnam today) is valid and Active on create & update
      const createSameDayRes = await createCoupon(
        {
          couponCode: 'VNMIDNIGHT',
          name: 'Vietnam Midnight Flash Sale',
          discountType: 'Percentage',
          discountValue: 20,
          usageLimit: 100,
          validFrom: '2026-10-08',
          validTo: '2026-10-08',
          appliesToAllTours: true,
          appliedTourIds: [],
        },
        { allowDemo: true, currentUserId: 101 }
      );
      expect(createSameDayRes.status).toBe('SUCCESS');
      expect(createSameDayRes.data?.status).toBe('Active');

      // 6. Creating a coupon with validTo = 2026-10-07 (UTC today, but Vietnam yesterday) is rejected
      const expiredYesterdayInVnRes = await createCoupon(
        {
          couponCode: 'UTCTODAY_VNYESTERDAY',
          name: 'Expired in Vietnam',
          discountType: 'Percentage',
          discountValue: 10,
          usageLimit: 50,
          validFrom: '2026-10-01',
          validTo: '2026-10-07',
          appliesToAllTours: true,
          appliedTourIds: [],
        },
        { allowDemo: true, currentUserId: 101 }
      );
      expect(expiredYesterdayInVnRes.status).toBe('VALIDATION_ERROR');
      expect(expiredYesterdayInVnRes.errors?.validTo).toBe(
        OPERATOR_COUPON_MESSAGES.INVALID_VALIDITY_PERIOD
      );
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('operatorCouponService - Usage Limit Positive Integer Validation & Mutation Safety (P2 Review Remediation)', () => {
  const baseValidCreatePayload: CreateCouponPayload = {
    couponCode: 'INT_TEST_2026',
    name: 'Integer Usage Limit Test',
    discountType: 'Percentage',
    discountValue: 15,
    maxDiscountAmount: 300000,
    minSpend: 500000,
    usageLimit: 100,
    usageLimitPerTraveler: 1,
    validFrom: '2026-10-10',
    validTo: '2026-10-30',
    appliesToAllTours: true,
    appliedTourIds: [],
  };

  const baseValidUpdatePayload: UpdateCouponPayload = {
    name: 'Updated Integer Usage Limit',
    discountType: 'Percentage',
    discountValue: 15,
    maxDiscountAmount: 500000,
    minSpend: 1000000,
    usageLimit: 200,
    usageLimitPerTraveler: 1,
    validFrom: '2026-09-01',
    validTo: '2026-10-31',
    appliesToAllTours: true,
    appliedTourIds: [],
  };

  const invalidUsageLimits = [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
  const invalidPerTravelerLimits = [
    0,
    -1,
    0.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ];

  it.each(invalidUsageLimits)(
    'validateCreateCoupon and createCoupon reject invalid usageLimit = %s without mutating Demo store',
    async (invalidLimit) => {
      const beforeList = await getOperatorCoupons({ allowDemo: true, currentUserId: 101 });
      const beforeSnapshot = JSON.stringify(beforeList.data);

      const payload: CreateCouponPayload = {
        ...baseValidCreatePayload,
        couponCode: `BAD_LIMIT_${String(invalidLimit).replace(/[^a-zA-Z0-9]/g, '')}`,
        usageLimit: invalidLimit,
      };

      const directErrors = validateCreateCoupon(payload, { today: '2026-10-08' });
      expect(directErrors.usageLimit).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);

      const res = await createCoupon(payload, {
        allowDemo: true,
        currentUserId: 101,
        today: '2026-10-08',
      });
      expect(res.status).toBe('VALIDATION_ERROR');
      expect(res.status).not.toBe('SUCCESS');
      expect(res.errors?.usageLimit).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
      expect(res.data).toBeUndefined();

      const afterList = await getOperatorCoupons({ allowDemo: true, currentUserId: 101 });
      expect(JSON.stringify(afterList.data)).toBe(beforeSnapshot);
    }
  );

  it.each(invalidPerTravelerLimits)(
    'validateCreateCoupon and createCoupon reject invalid usageLimitPerTraveler = %s without mutating Demo store',
    async (invalidPerTraveler) => {
      const beforeList = await getOperatorCoupons({ allowDemo: true, currentUserId: 101 });
      const beforeSnapshot = JSON.stringify(beforeList.data);

      const payload: CreateCouponPayload = {
        ...baseValidCreatePayload,
        couponCode: `BAD_TRAVELER_${String(invalidPerTraveler).replace(/[^a-zA-Z0-9]/g, '')}`,
        usageLimitPerTraveler: invalidPerTraveler,
      };

      const directErrors = validateCreateCoupon(payload, { today: '2026-10-08' });
      expect(directErrors.usageLimitPerTraveler).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);

      const res = await createCoupon(payload, {
        allowDemo: true,
        currentUserId: 101,
        today: '2026-10-08',
      });
      expect(res.status).toBe('VALIDATION_ERROR');
      expect(res.status).not.toBe('SUCCESS');
      expect(res.errors?.usageLimitPerTraveler).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
      expect(res.data).toBeUndefined();

      const afterList = await getOperatorCoupons({ allowDemo: true, currentUserId: 101 });
      expect(JSON.stringify(afterList.data)).toBe(beforeSnapshot);
    }
  );

  it.each(invalidUsageLimits)(
    'validateUpdateCoupon and updateCoupon reject invalid usageLimit = %s without modifying existing coupon',
    async (invalidLimit) => {
      const beforeCouponRes = await getOperatorCouponById('cp-bana15', {
        allowDemo: true,
        currentUserId: 101,
      });
      expect(beforeCouponRes.status).toBe('SUCCESS');
      const originalCoupon = beforeCouponRes.data!;

      const payload: UpdateCouponPayload = {
        ...baseValidUpdatePayload,
        name: 'Tampered Name Should Not Persist',
        usageLimit: invalidLimit,
      };

      const directErrors = validateUpdateCoupon(originalCoupon, payload, { today: '2026-10-08' });
      expect(directErrors.usageLimit).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);

      const res = await updateCoupon('cp-bana15', payload, {
        allowDemo: true,
        currentUserId: 101,
        today: '2026-10-08',
      });
      expect(res.status).toBe('VALIDATION_ERROR');
      expect(res.status).not.toBe('SUCCESS');
      expect(res.errors?.usageLimit).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
      expect(res.data).toBeUndefined();

      const afterCouponRes = await getOperatorCouponById('cp-bana15', {
        allowDemo: true,
        currentUserId: 101,
      });
      expect(afterCouponRes.data?.name).toBe(originalCoupon.name);
      expect(afterCouponRes.data?.usageLimit).toBe(originalCoupon.usageLimit);
      expect(afterCouponRes.data?.usageCount).toBe(originalCoupon.usageCount);
      expect(afterCouponRes.data?.operatorUserId).toBe(originalCoupon.operatorUserId);
      expect(afterCouponRes.data?.status).toBe(originalCoupon.status);
    }
  );

  it.each(invalidPerTravelerLimits)(
    'validateUpdateCoupon and updateCoupon reject invalid usageLimitPerTraveler = %s without modifying existing coupon',
    async (invalidPerTraveler) => {
      const beforeCouponRes = await getOperatorCouponById('cp-bana15', {
        allowDemo: true,
        currentUserId: 101,
      });
      expect(beforeCouponRes.status).toBe('SUCCESS');
      const originalCoupon = beforeCouponRes.data!;

      const payload: UpdateCouponPayload = {
        ...baseValidUpdatePayload,
        name: 'Tampered Name Should Not Persist',
        usageLimit: 200,
        usageLimitPerTraveler: invalidPerTraveler,
      };

      const directErrors = validateUpdateCoupon(originalCoupon, payload, { today: '2026-10-08' });
      expect(directErrors.usageLimitPerTraveler).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);

      const res = await updateCoupon('cp-bana15', payload, {
        allowDemo: true,
        currentUserId: 101,
        today: '2026-10-08',
      });
      expect(res.status).toBe('VALIDATION_ERROR');
      expect(res.status).not.toBe('SUCCESS');
      expect(res.errors?.usageLimitPerTraveler).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
      expect(res.data).toBeUndefined();

      const afterCouponRes = await getOperatorCouponById('cp-bana15', {
        allowDemo: true,
        currentUserId: 101,
      });
      expect(afterCouponRes.data?.name).toBe(originalCoupon.name);
      expect(afterCouponRes.data?.usageLimit).toBe(originalCoupon.usageLimit);
      expect(afterCouponRes.data?.usageLimitPerTraveler).toBe(
        originalCoupon.usageLimitPerTraveler
      );
      expect(afterCouponRes.data?.usageCount).toBe(originalCoupon.usageCount);
      expect(afterCouponRes.data?.operatorUserId).toBe(originalCoupon.operatorUserId);
      expect(afterCouponRes.data?.status).toBe(originalCoupon.status);
    }
  );

  it('accepts valid integer boundaries for usageLimit (1, 100) and optional usageLimitPerTraveler (1, null, undefined) on Create and Update', async () => {
    // Create with usageLimit: 1 and usageLimitPerTraveler: 1
    const createMinErrors = validateCreateCoupon(
      {
        ...baseValidCreatePayload,
        usageLimit: 1,
        usageLimitPerTraveler: 1,
      },
      { today: '2026-10-08', ownedTourIds: ['tour-142'] }
    );
    expect(createMinErrors).toEqual({});

    // Create with usageLimit: 100 and usageLimitPerTraveler: null
    const createNullTravelerErrors = validateCreateCoupon(
      {
        ...baseValidCreatePayload,
        usageLimit: 100,
        usageLimitPerTraveler: null,
      },
      { today: '2026-10-08', ownedTourIds: ['tour-142'] }
    );
    expect(createNullTravelerErrors).toEqual({});

    // Create with usageLimit: 100 and usageLimitPerTraveler: undefined
    const createUndefinedTravelerErrors = validateCreateCoupon(
      {
        ...baseValidCreatePayload,
        usageLimit: 100,
        usageLimitPerTraveler: undefined,
      },
      { today: '2026-10-08', ownedTourIds: ['tour-142'] }
    );
    expect(createUndefinedTravelerErrors).toEqual({});

    // Update on a coupon with usageCount = 0 allows usageLimit: 1, 100 and usageLimitPerTraveler: 1, null, undefined
    const zeroUsageCouponRes = await getOperatorCouponById('cp-fallvip', {
      allowDemo: true,
      currentUserId: 101,
    });
    expect(zeroUsageCouponRes.data?.usageCount).toBe(0);

    expect(
      validateUpdateCoupon(
        zeroUsageCouponRes.data!,
        {
          ...baseValidUpdatePayload,
          validFrom: '2026-11-01',
          validTo: '2026-11-30',
          usageLimit: 1,
          usageLimitPerTraveler: 1,
        },
        { today: '2026-10-08', ownedTourIds: ['tour-142'] }
      )
    ).toEqual({});

    expect(
      validateUpdateCoupon(
        zeroUsageCouponRes.data!,
        {
          ...baseValidUpdatePayload,
          validFrom: '2026-11-01',
          validTo: '2026-11-30',
          usageLimit: 100,
          usageLimitPerTraveler: null,
        },
        { today: '2026-10-08', ownedTourIds: ['tour-142'] }
      )
    ).toEqual({});

    expect(
      validateUpdateCoupon(
        zeroUsageCouponRes.data!,
        {
          ...baseValidUpdatePayload,
          validFrom: '2026-11-01',
          validTo: '2026-11-30',
          usageLimit: 100,
          usageLimitPerTraveler: undefined,
        },
        { today: '2026-10-08', ownedTourIds: ['tour-142'] }
      )
    ).toEqual({});

    // Preserve BR-99 on Update: valid integer below usageCount is still rejected with USAGE_LIMIT_BELOW_USAGE_COUNT
    const banaCouponRes = await getOperatorCouponById('cp-bana15', {
      allowDemo: true,
      currentUserId: 101,
    });
    expect(banaCouponRes.data?.usageCount).toBe(86);
    const br99Errors = validateUpdateCoupon(
      banaCouponRes.data!,
      {
        ...baseValidUpdatePayload,
        usageLimit: 85, // valid positive integer, but < 86
      },
      { today: '2026-10-08', ownedTourIds: ['tour-142'] }
    );
    expect(br99Errors.usageLimit).toBe(OPERATOR_COUPON_MESSAGES.USAGE_LIMIT_BELOW_USAGE_COUNT);
  });
});

describe('operatorCouponService - Zero-Owned-Tour Coupon Scope Rejection (P1 Review Remediation)', () => {
  const validAllToursCreatePayload: CreateCouponPayload = {
    couponCode: 'ZEROTOUR10',
    name: 'Zero Tour All Scope Coupon',
    discountType: 'Percentage',
    discountValue: 10,
    maxDiscountAmount: 200000,
    minSpend: 500000,
    usageLimit: 50,
    usageLimitPerTraveler: 1,
    validFrom: '2026-10-10',
    validTo: '2026-10-30',
    appliesToAllTours: true,
    appliedTourIds: [],
  };

  const validAllToursUpdatePayload: UpdateCouponPayload = {
    name: 'Zero Tour Updated Coupon',
    discountType: 'Percentage',
    discountValue: 15,
    maxDiscountAmount: 500000,
    minSpend: 1000000,
    usageLimit: 200,
    usageLimitPerTraveler: 1,
    validFrom: '2026-09-01',
    validTo: '2026-10-31',
    appliesToAllTours: true,
    appliedTourIds: [],
  };

  it('1. Zero-owned-tour operator + appliesToAllTours=true: rejects validateCreateCoupon and createCoupon without inserting into Demo store', async () => {
    const zeroTourOperatorId = 303;
    const toursRes = await getEligibleTours({ allowDemo: true, currentUserId: zeroTourOperatorId });
    expect(toursRes.status).toBe('SUCCESS');
    expect(toursRes.data).toEqual([]);

    const directErrors = validateCreateCoupon(validAllToursCreatePayload, {
      today: '2026-10-08',
      ownedTourIds: [],
    });
    expect(directErrors.appliedTourIds).toBe(OPERATOR_COUPON_MESSAGES.NO_ELIGIBLE_TOURS);

    const createRes = await createCoupon(validAllToursCreatePayload, {
      allowDemo: true,
      currentUserId: zeroTourOperatorId,
      today: '2026-10-08',
    });
    expect(createRes.status).toBe('VALIDATION_ERROR');
    expect(createRes.status).not.toBe('SUCCESS');
    expect(createRes.errors?.appliedTourIds).toBe(OPERATOR_COUPON_MESSAGES.NO_ELIGIBLE_TOURS);
    expect(createRes.data).toBeUndefined();

    // Verify no coupon is inserted into the Demo store
    const zeroOperatorCoupons = await getOperatorCoupons({
      allowDemo: true,
      currentUserId: zeroTourOperatorId,
    });
    expect(zeroOperatorCoupons.data).toEqual([]);
  });

  it('2. Zero-owned-tour operator + appliesToAllTours=true: rejects validateUpdateCoupon and does not mutate existing coupon', async () => {
    const existingRes = await getOperatorCouponById('cp-bana15', {
      allowDemo: true,
      currentUserId: 101,
    });
    expect(existingRes.status).toBe('SUCCESS');
    const existingCoupon = existingRes.data!;

    // Direct validation when ownedTourIds is empty [] and appliesToAllTours is true
    const directErrors = validateUpdateCoupon(existingCoupon, validAllToursUpdatePayload, {
      today: '2026-10-08',
      ownedTourIds: [],
    });
    expect(directErrors.appliedTourIds).toBe(OPERATOR_COUPON_MESSAGES.NO_ELIGIBLE_TOURS);
  });

  it('3. Zero-owned-tour operator + specific scope (appliesToAllTours=false): rejects empty and non-empty appliedTourIds', async () => {
    const zeroTourOperatorId = 303;

    // Empty appliedTourIds
    const emptyScopeRes = await createCoupon(
      {
        ...validAllToursCreatePayload,
        couponCode: 'ZEROEMPTY',
        appliesToAllTours: false,
        appliedTourIds: [],
      },
      {
        allowDemo: true,
        currentUserId: zeroTourOperatorId,
        today: '2026-10-08',
      }
    );
    expect(emptyScopeRes.status).toBe('VALIDATION_ERROR');
    expect(emptyScopeRes.errors?.appliedTourIds).toBeDefined();

    // Selected foreign/unowned tour IDs when actor owns 0 tours
    const selectedScopeRes = await createCoupon(
      {
        ...validAllToursCreatePayload,
        couponCode: 'ZEROSELECTED',
        appliesToAllTours: false,
        appliedTourIds: ['tour-142'],
      },
      {
        allowDemo: true,
        currentUserId: zeroTourOperatorId,
        today: '2026-10-08',
      }
    );
    expect(selectedScopeRes.status).toBe('VALIDATION_ERROR');
    expect(selectedScopeRes.errors?.appliedTourIds).toBe(
      OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_TOUR_SCOPE
    );
  });

  it('4. Missing ownership context (ownedTourIds: undefined) fails closed on validateCreateCoupon and validateUpdateCoupon', async () => {
    const existingRes = await getOperatorCouponById('cp-bana15', {
      allowDemo: true,
      currentUserId: 101,
    });
    const existingCoupon = existingRes.data!;

    // Create with appliesToAllTours: true and ownedTourIds: undefined
    const createAllErrors = validateCreateCoupon(validAllToursCreatePayload, {
      today: '2026-10-08',
      ownedTourIds: undefined,
    });
    expect(createAllErrors.appliedTourIds).toBe(OPERATOR_COUPON_MESSAGES.NO_ELIGIBLE_TOURS);

    // Create with appliesToAllTours: false, appliedTourIds: ['tour-142'] and ownedTourIds: undefined
    const createSpecificErrors = validateCreateCoupon(
      {
        ...validAllToursCreatePayload,
        appliesToAllTours: false,
        appliedTourIds: ['tour-142'],
      },
      {
        today: '2026-10-08',
        ownedTourIds: undefined,
      }
    );
    expect(createSpecificErrors.appliedTourIds).toBe(
      OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_TOUR_SCOPE
    );

    // Update with appliesToAllTours: true and ownedTourIds: undefined
    const updateAllErrors = validateUpdateCoupon(existingCoupon, validAllToursUpdatePayload, {
      today: '2026-10-08',
      ownedTourIds: undefined,
    });
    expect(updateAllErrors.appliedTourIds).toBe(OPERATOR_COUPON_MESSAGES.NO_ELIGIBLE_TOURS);

    // Update with appliesToAllTours: false, appliedTourIds: ['tour-142'] and ownedTourIds: undefined
    const updateSpecificErrors = validateUpdateCoupon(
      existingCoupon,
      {
        ...validAllToursUpdatePayload,
        appliesToAllTours: false,
        appliedTourIds: ['tour-142'],
      },
      {
        today: '2026-10-08',
        ownedTourIds: undefined,
      }
    );
    expect(updateSpecificErrors.appliedTourIds).toBe(
      OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_TOUR_SCOPE
    );
  });

  it('5. Valid owned-tour operator (101) succeeds for appliesToAllTours=true and specific owned tours, and rejects foreign tours', async () => {
    const createAllRes = await createCoupon(
      {
        ...validAllToursCreatePayload,
        couponCode: 'VALID_ALL_101',
      },
      { allowDemo: true, currentUserId: 101, today: '2026-10-08' }
    );
    expect(createAllRes.status).toBe('SUCCESS');

    const createSpecificRes = await createCoupon(
      {
        ...validAllToursCreatePayload,
        couponCode: 'VALID_SPEC_101',
        appliesToAllTours: false,
        appliedTourIds: ['tour-142', 'tour-148'],
      },
      { allowDemo: true, currentUserId: 101, today: '2026-10-08' }
    );
    expect(createSpecificRes.status).toBe('SUCCESS');

    const createForeignRes = await createCoupon(
      {
        ...validAllToursCreatePayload,
        couponCode: 'FOREIGN_SPEC_101',
        appliesToAllTours: false,
        appliedTourIds: ['tour-142', 'tour-201'],
      },
      { allowDemo: true, currentUserId: 101, today: '2026-10-08' }
    );
    expect(createForeignRes.status).toBe('VALIDATION_ERROR');
    expect(createForeignRes.errors?.appliedTourIds).toBe(
      OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_TOUR_SCOPE
    );
  });
});

describe('operatorCouponService - Finite Monetary Values & Mutation Safety (Review #5457539219 Remediation)', () => {
  const validOptions = {
    today: '2026-10-08',
    ownedTourIds: ['tour-142', 'tour-148'],
  };

  const baseValidCreatePayload: CreateCouponPayload = {
    couponCode: 'FINITE_MONEY_2026',
    name: 'Finite Monetary Validation Test',
    discountType: 'Flat',
    discountValue: 150000,
    maxDiscountAmount: 300000,
    minSpend: 500000,
    usageLimit: 100,
    usageLimitPerTraveler: 1,
    validFrom: '2026-10-10',
    validTo: '2026-10-30',
    appliesToAllTours: true,
    appliedTourIds: [],
  };

  const baseValidUpdatePayload: UpdateCouponPayload = {
    name: 'Updated Finite Monetary Validation Test',
    discountType: 'Flat',
    discountValue: 150000,
    maxDiscountAmount: 300000,
    minSpend: 500000,
    usageLimit: 200,
    usageLimitPerTraveler: 1,
    validFrom: '2026-09-01',
    validTo: '2026-10-31',
    appliesToAllTours: true,
    appliedTourIds: [],
  };

  const invalidPositiveMoneyValues = [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    0,
    -1,
    -50000,
  ];

  const invalidMinSpendValues = [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    -1,
    -50000,
  ];

  it.each(invalidPositiveMoneyValues)(
    'rejects invalid discountValue = %s on both validateCreateCoupon and validateUpdateCoupon',
    async (invalidDiscount) => {
      const existingRes = await getOperatorCouponById('cp-bana15', {
        allowDemo: true,
        currentUserId: 101,
      });
      const currentCoupon = existingRes.data!;

      // FixedAmount
      const createFixedErrors = validateCreateCoupon(
        {
          ...baseValidCreatePayload,
          discountType: 'Flat',
          discountValue: invalidDiscount,
        },
        validOptions
      );
      expect(createFixedErrors.discountValue).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
      expect(Object.keys(createFixedErrors)).toEqual(['discountValue']);

      const updateFixedErrors = validateUpdateCoupon(
        currentCoupon,
        {
          ...baseValidUpdatePayload,
          discountType: 'Flat',
          discountValue: invalidDiscount,
        },
        validOptions
      );
      expect(updateFixedErrors.discountValue).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
      expect(Object.keys(updateFixedErrors)).toEqual(['discountValue']);

      // Percentage
      const createPctErrors = validateCreateCoupon(
        {
          ...baseValidCreatePayload,
          discountType: 'Percentage',
          discountValue: invalidDiscount,
        },
        validOptions
      );
      expect(createPctErrors.discountValue).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
      expect(Object.keys(createPctErrors)).toEqual(['discountValue']);

      const updatePctErrors = validateUpdateCoupon(
        currentCoupon,
        {
          ...baseValidUpdatePayload,
          discountType: 'Percentage',
          discountValue: invalidDiscount,
        },
        validOptions
      );
      expect(updatePctErrors.discountValue).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
      expect(Object.keys(updatePctErrors)).toEqual(['discountValue']);
    }
  );

  it.each(invalidPositiveMoneyValues)(
    'rejects invalid maxDiscountAmount = %s on both validateCreateCoupon and validateUpdateCoupon',
    async (invalidMaxDiscount) => {
      const existingRes = await getOperatorCouponById('cp-bana15', {
        allowDemo: true,
        currentUserId: 101,
      });
      const currentCoupon = existingRes.data!;

      const createErrors = validateCreateCoupon(
        {
          ...baseValidCreatePayload,
          maxDiscountAmount: invalidMaxDiscount,
        },
        validOptions
      );
      expect(createErrors.maxDiscountAmount).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
      expect(Object.keys(createErrors)).toEqual(['maxDiscountAmount']);

      const updateErrors = validateUpdateCoupon(
        currentCoupon,
        {
          ...baseValidUpdatePayload,
          maxDiscountAmount: invalidMaxDiscount,
        },
        validOptions
      );
      expect(updateErrors.maxDiscountAmount).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
      expect(Object.keys(updateErrors)).toEqual(['maxDiscountAmount']);
    }
  );

  it.each(invalidMinSpendValues)(
    'rejects invalid minSpend = %s on both validateCreateCoupon and validateUpdateCoupon',
    async (invalidMinSpend) => {
      const existingRes = await getOperatorCouponById('cp-bana15', {
        allowDemo: true,
        currentUserId: 101,
      });
      const currentCoupon = existingRes.data!;

      const createErrors = validateCreateCoupon(
        {
          ...baseValidCreatePayload,
          minSpend: invalidMinSpend,
        },
        validOptions
      );
      expect(createErrors.minSpend).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
      expect(Object.keys(createErrors)).toEqual(['minSpend']);

      const updateErrors = validateUpdateCoupon(
        currentCoupon,
        {
          ...baseValidUpdatePayload,
          minSpend: invalidMinSpend,
        },
        validOptions
      );
      expect(updateErrors.minSpend).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
      expect(Object.keys(updateErrors)).toEqual(['minSpend']);
    }
  );

  it('accepts positive finite monetary values, zero minSpend (0), and optional null/undefined maxDiscountAmount & minSpend on Create and Update', async () => {
    const existingRes = await getOperatorCouponById('cp-bana15', {
      allowDemo: true,
      currentUserId: 101,
    });
    const currentCoupon = existingRes.data!;

    // 1. Positive finite values
    expect(validateCreateCoupon(baseValidCreatePayload, validOptions)).toEqual({});
    expect(
      validateUpdateCoupon(currentCoupon, baseValidUpdatePayload, validOptions)
    ).toEqual({});

    // 2. Zero minSpend (0 is valid)
    expect(
      validateCreateCoupon(
        {
          ...baseValidCreatePayload,
          minSpend: 0,
        },
        validOptions
      )
    ).toEqual({});
    expect(
      validateUpdateCoupon(
        currentCoupon,
        {
          ...baseValidUpdatePayload,
          minSpend: 0,
        },
        validOptions
      )
    ).toEqual({});

    // 3. Optional maxDiscountAmount and minSpend as null
    expect(
      validateCreateCoupon(
        {
          ...baseValidCreatePayload,
          maxDiscountAmount: null,
          minSpend: null,
        },
        validOptions
      )
    ).toEqual({});
    expect(
      validateUpdateCoupon(
        currentCoupon,
        {
          ...baseValidUpdatePayload,
          maxDiscountAmount: null,
          minSpend: null,
        },
        validOptions
      )
    ).toEqual({});

    // 4. Optional maxDiscountAmount and minSpend as undefined
    expect(
      validateCreateCoupon(
        {
          ...baseValidCreatePayload,
          maxDiscountAmount: undefined,
          minSpend: undefined,
        },
        validOptions
      )
    ).toEqual({});
    expect(
      validateUpdateCoupon(
        currentCoupon,
        {
          ...baseValidUpdatePayload,
          maxDiscountAmount: undefined,
          minSpend: undefined,
        },
        validOptions
      )
    ).toEqual({});
  });

  it('enforces percentage boundary: accepts 100 and rejects 101 on Create and Update', async () => {
    const existingRes = await getOperatorCouponById('cp-bana15', {
      allowDemo: true,
      currentUserId: 101,
    });
    const currentCoupon = existingRes.data!;

    // 100% is accepted
    expect(
      validateCreateCoupon(
        {
          ...baseValidCreatePayload,
          discountType: 'Percentage',
          discountValue: 100,
        },
        validOptions
      )
    ).toEqual({});
    expect(
      validateUpdateCoupon(
        currentCoupon,
        {
          ...baseValidUpdatePayload,
          discountType: 'Percentage',
          discountValue: 100,
        },
        validOptions
      )
    ).toEqual({});

    // 101% is rejected with specialized percentage message
    const create101Errors = validateCreateCoupon(
      {
        ...baseValidCreatePayload,
        discountType: 'Percentage',
        discountValue: 101,
      },
      validOptions
    );
    expect(create101Errors.discountValue).toBe('Percentage discount cannot exceed 100%.');
    expect(Object.keys(create101Errors)).toEqual(['discountValue']);

    const update101Errors = validateUpdateCoupon(
      currentCoupon,
      {
        ...baseValidUpdatePayload,
        discountType: 'Percentage',
        discountValue: 101,
      },
      validOptions
    );
    expect(update101Errors.discountValue).toBe('Percentage discount cannot exceed 100%.');
    expect(Object.keys(update101Errors)).toEqual(['discountValue']);
  });

  it('mutation safety: createCoupon rejects fixed discountValue=Infinity, maxDiscountAmount=NaN, and minSpend=Infinity without inserting into Demo store', async () => {
    const beforeList = await getOperatorCoupons({ allowDemo: true, currentUserId: 101 });
    const beforeSnapshot = JSON.stringify(beforeList.data);

    // 1. Create with fixed discountValue: Infinity returns VALIDATION_ERROR and does not insert
    const infDiscountRes = await createCoupon(
      {
        ...baseValidCreatePayload,
        couponCode: 'INF_DISCOUNT',
        discountType: 'Flat',
        discountValue: Number.POSITIVE_INFINITY,
      },
      { allowDemo: true, currentUserId: 101, today: '2026-10-08' }
    );
    expect(infDiscountRes.status).toBe('VALIDATION_ERROR');
    expect(infDiscountRes.status).not.toBe('SUCCESS');
    expect(infDiscountRes.errors?.discountValue).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
    expect(infDiscountRes.data).toBeUndefined();

    // 2. Create with maxDiscountAmount: NaN does not insert a record
    const nanMaxDiscountRes = await createCoupon(
      {
        ...baseValidCreatePayload,
        couponCode: 'NAN_MAX_DISCOUNT',
        maxDiscountAmount: Number.NaN,
      },
      { allowDemo: true, currentUserId: 101, today: '2026-10-08' }
    );
    expect(nanMaxDiscountRes.status).toBe('VALIDATION_ERROR');
    expect(nanMaxDiscountRes.status).not.toBe('SUCCESS');
    expect(nanMaxDiscountRes.errors?.maxDiscountAmount).toBe(
      OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC
    );
    expect(nanMaxDiscountRes.data).toBeUndefined();

    // 3. Create with minSpend: Infinity does not insert a record
    const infMinSpendRes = await createCoupon(
      {
        ...baseValidCreatePayload,
        couponCode: 'INF_MIN_SPEND',
        minSpend: Number.POSITIVE_INFINITY,
      },
      { allowDemo: true, currentUserId: 101, today: '2026-10-08' }
    );
    expect(infMinSpendRes.status).toBe('VALIDATION_ERROR');
    expect(infMinSpendRes.status).not.toBe('SUCCESS');
    expect(infMinSpendRes.errors?.minSpend).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
    expect(infMinSpendRes.data).toBeUndefined();

    // Verify Demo store was not mutated by any of the three invalid create attempts
    const afterList = await getOperatorCoupons({ allowDemo: true, currentUserId: 101 });
    expect(JSON.stringify(afterList.data)).toBe(beforeSnapshot);
  });

  it('mutation safety: updateCoupon with invalid monetary values returns VALIDATION_ERROR and does not modify the existing coupon', async () => {
    const beforeCouponRes = await getOperatorCouponById('cp-bana15', {
      allowDemo: true,
      currentUserId: 101,
    });
    expect(beforeCouponRes.status).toBe('SUCCESS');
    const originalCoupon = beforeCouponRes.data!;
    const beforeSnapshot = JSON.stringify(originalCoupon);

    const invalidUpdatePayloads: Array<{
      field: 'discountValue' | 'maxDiscountAmount' | 'minSpend';
      payload: UpdateCouponPayload;
    }> = [
      {
        field: 'discountValue',
        payload: {
          ...baseValidUpdatePayload,
          name: 'Should Not Persist 1',
          discountType: 'Flat',
          discountValue: Number.POSITIVE_INFINITY,
        },
      },
      {
        field: 'discountValue',
        payload: {
          ...baseValidUpdatePayload,
          name: 'Should Not Persist 2',
          discountValue: Number.NaN,
        },
      },
      {
        field: 'maxDiscountAmount',
        payload: {
          ...baseValidUpdatePayload,
          name: 'Should Not Persist 3',
          maxDiscountAmount: Number.NaN,
        },
      },
      {
        field: 'maxDiscountAmount',
        payload: {
          ...baseValidUpdatePayload,
          name: 'Should Not Persist 4',
          maxDiscountAmount: Number.POSITIVE_INFINITY,
        },
      },
      {
        field: 'minSpend',
        payload: {
          ...baseValidUpdatePayload,
          name: 'Should Not Persist 5',
          minSpend: Number.POSITIVE_INFINITY,
        },
      },
      {
        field: 'minSpend',
        payload: {
          ...baseValidUpdatePayload,
          name: 'Should Not Persist 6',
          minSpend: Number.NaN,
        },
      },
    ];

    for (const { field, payload } of invalidUpdatePayloads) {
      const updateRes = await updateCoupon('cp-bana15', payload, {
        allowDemo: true,
        currentUserId: 101,
        today: '2026-10-08',
      });
      expect(updateRes.status).toBe('VALIDATION_ERROR');
      expect(updateRes.status).not.toBe('SUCCESS');
      expect(updateRes.errors?.[field]).toBe(OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC);
      expect(updateRes.data).toBeUndefined();

      const afterCouponRes = await getOperatorCouponById('cp-bana15', {
        allowDemo: true,
        currentUserId: 101,
      });
      expect(JSON.stringify(afterCouponRes.data)).toBe(beforeSnapshot);
    }
  });

  it('continues to create and update valid coupons accurately in Demo store', async () => {
    const createRes = await createCoupon(
      {
        ...baseValidCreatePayload,
        couponCode: 'VALID_FINITE_100',
        discountType: 'Percentage',
        discountValue: 100,
        maxDiscountAmount: 250000,
        minSpend: 0,
      },
      { allowDemo: true, currentUserId: 101, today: '2026-10-08' }
    );
    expect(createRes.status).toBe('SUCCESS');
    expect(createRes.data?.discountValue).toBe(100);
    expect(createRes.data?.maxDiscountAmount).toBe(250000);
    expect(createRes.data?.minSpend).toBe(0);

    const createdId = createRes.data!.id;
    const fetchedCreated = await getOperatorCouponById(createdId, {
      allowDemo: true,
      currentUserId: 101,
    });
    expect(fetchedCreated.status).toBe('SUCCESS');
    expect(fetchedCreated.data?.couponCode).toBe('VALID_FINITE_100');
    expect(fetchedCreated.data?.minSpend).toBe(0);

    const updateRes = await updateCoupon(
      createdId,
      {
        ...baseValidUpdatePayload,
        name: 'Updated Valid Finite Coupon',
        discountType: 'Flat',
        discountValue: 120000,
        maxDiscountAmount: null,
        minSpend: 300000,
        usageLimit: 150,
      },
      { allowDemo: true, currentUserId: 101, today: '2026-10-08' }
    );
    expect(updateRes.status).toBe('SUCCESS');
    expect(updateRes.data?.name).toBe('Updated Valid Finite Coupon');
    expect(updateRes.data?.discountValue).toBe(120000);
    expect(updateRes.data?.maxDiscountAmount).toBeNull();
    expect(updateRes.data?.minSpend).toBe(300000);

    const fetchedUpdated = await getOperatorCouponById(createdId, {
      allowDemo: true,
      currentUserId: 101,
    });
    expect(fetchedUpdated.data?.name).toBe('Updated Valid Finite Coupon');
    expect(fetchedUpdated.data?.discountValue).toBe(120000);
    expect(fetchedUpdated.data?.maxDiscountAmount).toBeNull();
    expect(fetchedUpdated.data?.minSpend).toBe(300000);
  });
});
