import {
  isCouponDemoAllowedInCurrentEnv,
  INITIAL_DEMO_COUPONS,
  DEMO_ELIGIBLE_TOURS,
} from '../data/operatorCouponDemoFixtures';
import {
  OPERATOR_COUPON_MESSAGES,
  type CouponActionResult,
  type CouponDto,
  type CouponStatus,
  type CouponValidationErrors,
  type CreateCouponPayload,
  type EligibleTourDto,
  type UpdateCouponPayload,
} from '../types/couponLifecycle';

/**
 * In-memory state store for Demo fixtures during interactive testing and exploration.
 * Never used in production mode.
 */
let demoCouponsStore: CouponDto[] = [...INITIAL_DEMO_COUPONS];

/**
 * Resets the in-memory demo coupon store back to initial fixtures.
 * Useful for automated tests and isolated resets.
 */
export function resetDemoCouponsStore(): void {
  demoCouponsStore = [...INITIAL_DEMO_COUPONS];
}

/**
 * Returns today's ISO date string (YYYY-MM-DD) in the canonical Vietnam timezone (Asia/Ho_Chi_Minh, CR-07).
 */
export function getTodayDateString(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';

  return `${year}-${month}-${day}`;
}

/**
 * Determines whether a coupon's validity period has expired relative to today (BR-22, BR-97).
 * Note: validTo === today is NOT expired (same-day / final-day coupons remain valid through today).
 */
export function isCouponExpired(
  validTo: string,
  today: string = getTodayDateString()
): boolean {
  if (!validTo) return false;
  return validTo < today;
}

/**
 * Derives the temporal display/runtime status of a coupon from its stored status and validity dates.
 */
export function deriveCouponTemporalStatus(
  coupon: Pick<CouponDto, 'status' | 'validFrom' | 'validTo'>,
  today: string = getTodayDateString()
): CouponStatus {
  if (isCouponExpired(coupon.validTo, today)) {
    return 'Expired';
  }
  if (coupon.status === 'Inactive') {
    return 'Inactive';
  }
  if (coupon.validFrom > today) {
    return 'Scheduled';
  }
  return 'Active';
}

/**
 * Verifies that an authenticated actor identity is present and non-empty.
 * Ownership-sensitive Demo operations fail closed when actor identity is missing.
 */
function hasValidActorIdentity(
  currentUserId: number | string | undefined | null
): currentUserId is number | string {
  if (currentUserId === undefined || currentUserId === null) return false;
  if (typeof currentUserId === 'number') {
    return Number.isFinite(currentUserId) && currentUserId > 0;
  }
  return currentUserId.trim().length > 0;
}

/**
 * Returns demo tours owned by the given actor (A5).
 * Fails closed (empty array) when actor is missing/invalid.
 */
export function getDemoOwnedTours(
  currentUserId: number | string | undefined | null
): EligibleTourDto[] {
  if (!hasValidActorIdentity(currentUserId)) {
    return [];
  }
  return DEMO_ELIGIBLE_TOURS.filter(
    (tour) => String(tour.operatorUserId) === String(currentUserId)
  );
}

/**
 * Verifies that a numeric usage counter limit is a finite positive integer (Report 3 V2 §3.8.3.1, §3.8.3.2 -> MSG143).
 * Never rounds or truncates fractional inputs.
 */
function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * Verifies that a monetary / discount amount is a finite positive number (> 0).
 * Rejects NaN, +Infinity, -Infinity, zero, and negative numbers.
 */
function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * Verifies that an optional minimum-spend amount is a finite non-negative number (>= 0).
 * Rejects NaN, +Infinity, -Infinity, and negative numbers while allowing 0.
 */
function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * Validates Coupon creation payload per Report 3 §3.8.3.1 and BR-97, BR-98, BR-100, BR-102, BR-22.
 */
export function validateCreateCoupon(
  payload: CreateCouponPayload,
  options?: {
    existingCodes?: string[];
    ownedTourIds?: string[];
    today?: string;
  }
): CouponValidationErrors {
  const errors: CouponValidationErrors = {};

  // Mandatory text fields (Report 3 §3.8.3.1 -> MSG01)
  if (!payload.couponCode || payload.couponCode.trim().length === 0) {
    errors.couponCode = OPERATOR_COUPON_MESSAGES.REQUIRED_FIELD;
  }
  if (!payload.name || payload.name.trim().length === 0) {
    errors.name = OPERATOR_COUPON_MESSAGES.REQUIRED_FIELD;
  }
  if (!payload.discountType) {
    errors.discountType = OPERATOR_COUPON_MESSAGES.REQUIRED_FIELD;
  }

  // Numeric fields validation (MSG143)
  if (!isPositiveFiniteNumber(payload.discountValue)) {
    errors.discountValue = OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC;
  } else if (payload.discountType === 'Percentage' && payload.discountValue > 100) {
    errors.discountValue = 'Percentage discount cannot exceed 100%.';
  }

  if (payload.maxDiscountAmount !== undefined && payload.maxDiscountAmount !== null) {
    if (!isPositiveFiniteNumber(payload.maxDiscountAmount)) {
      errors.maxDiscountAmount = OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC;
    }
  }

  if (payload.minSpend !== undefined && payload.minSpend !== null) {
    if (!isNonNegativeFiniteNumber(payload.minSpend)) {
      errors.minSpend = OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC;
    }
  }

  if (!isPositiveInteger(payload.usageLimit)) {
    errors.usageLimit = OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC;
  }

  if (payload.usageLimitPerTraveler !== undefined && payload.usageLimitPerTraveler !== null) {
    if (!isPositiveInteger(payload.usageLimitPerTraveler)) {
      errors.usageLimitPerTraveler = OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC;
    }
  }

  // Validity period validation (BR-22 -> MSG29): Valid From must not be later than Valid To (validFrom <= validTo)
  const today = options?.today || getTodayDateString();
  if (!payload.validFrom) {
    errors.validFrom = OPERATOR_COUPON_MESSAGES.REQUIRED_FIELD;
  }
  if (!payload.validTo) {
    errors.validTo = OPERATOR_COUPON_MESSAGES.REQUIRED_FIELD;
  }
  if (payload.validFrom && payload.validTo) {
    if (payload.validFrom > payload.validTo || payload.validTo < today) {
      errors.validTo = OPERATOR_COUPON_MESSAGES.INVALID_VALIDITY_PERIOD;
    }
  }

  // Tour scope & ownership validation (BR-98, BR-102 -> MSG126)
  // Fail closed when ownership context is missing or the operator owns zero eligible tours,
  // regardless of whether appliesToAllTours is true or specific tours are selected.
  const hasVerifiedOwnedTours =
    Array.isArray(options?.ownedTourIds) && options.ownedTourIds.length > 0;

  if (!hasVerifiedOwnedTours) {
    if (!payload.appliesToAllTours && payload.appliedTourIds && payload.appliedTourIds.length > 0) {
      errors.appliedTourIds = OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_TOUR_SCOPE;
    } else {
      errors.appliedTourIds = OPERATOR_COUPON_MESSAGES.NO_ELIGIBLE_TOURS;
    }
  } else if (!payload.appliesToAllTours) {
    if (!payload.appliedTourIds || payload.appliedTourIds.length === 0) {
      errors.appliedTourIds = 'Please select at least one tour package or apply to all tours.';
    } else {
      const hasUnownedTour = payload.appliedTourIds.some(
        (id) => !options.ownedTourIds!.includes(id)
      );
      if (hasUnownedTour) {
        errors.appliedTourIds = OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_TOUR_SCOPE;
      }
    }
  }

  // Duplicate code check (BR-97 -> MSG113)
  if (
    payload.couponCode &&
    options?.existingCodes &&
    options.existingCodes.length > 0
  ) {
    const normalizedInput = payload.couponCode.trim().toUpperCase();
    const isDuplicate = options.existingCodes.some(
      (code) => code.trim().toUpperCase() === normalizedInput
    );
    if (isDuplicate) {
      errors.couponCode = OPERATOR_COUPON_MESSAGES.DUPLICATE_CODE;
    }
  }

  return errors;
}

/**
 * Validates Coupon update payload per Report 3 §3.8.3.2 and BR-99, BR-98, BR-22.
 */
export function validateUpdateCoupon(
  currentCoupon: CouponDto,
  payload: UpdateCouponPayload,
  options?: {
    ownedTourIds?: string[];
    today?: string;
  }
): CouponValidationErrors {
  const errors: CouponValidationErrors = {};

  // Mandatory fields (Report 3 §3.8.3.2 -> MSG01)
  if (!payload.name || payload.name.trim().length === 0) {
    errors.name = OPERATOR_COUPON_MESSAGES.REQUIRED_FIELD;
  }

  // Numeric fields validation (MSG143)
  const discountType = payload.discountType || currentCoupon.discountType;
  if (!isPositiveFiniteNumber(payload.discountValue)) {
    errors.discountValue = OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC;
  } else if (discountType === 'Percentage' && payload.discountValue > 100) {
    errors.discountValue = 'Percentage discount cannot exceed 100%.';
  }

  if (payload.maxDiscountAmount !== undefined && payload.maxDiscountAmount !== null) {
    if (!isPositiveFiniteNumber(payload.maxDiscountAmount)) {
      errors.maxDiscountAmount = OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC;
    }
  }

  if (payload.minSpend !== undefined && payload.minSpend !== null) {
    if (!isNonNegativeFiniteNumber(payload.minSpend)) {
      errors.minSpend = OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC;
    }
  }

  // BR-99: Usage Limit must be a positive integer and not reduced below recorded Usage Count (MSG143)
  if (!isPositiveInteger(payload.usageLimit)) {
    errors.usageLimit = OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC;
  } else if (payload.usageLimit < currentCoupon.usageCount) {
    errors.usageLimit = OPERATOR_COUPON_MESSAGES.USAGE_LIMIT_BELOW_USAGE_COUNT;
  }

  if (payload.usageLimitPerTraveler !== undefined && payload.usageLimitPerTraveler !== null) {
    if (!isPositiveInteger(payload.usageLimitPerTraveler)) {
      errors.usageLimitPerTraveler = OPERATOR_COUPON_MESSAGES.INVALID_NUMERIC;
    }
  }

  // Validity period validation (BR-22 -> MSG29): Valid From must not be later than Valid To (validFrom <= validTo)
  const today = options?.today || getTodayDateString();
  if (!payload.validFrom) {
    errors.validFrom = OPERATOR_COUPON_MESSAGES.REQUIRED_FIELD;
  }
  if (!payload.validTo) {
    errors.validTo = OPERATOR_COUPON_MESSAGES.REQUIRED_FIELD;
  }
  if (payload.validFrom && payload.validTo) {
    if (payload.validFrom > payload.validTo || payload.validTo < today) {
      errors.validTo = OPERATOR_COUPON_MESSAGES.INVALID_VALIDITY_PERIOD;
    }
  }

  // Tour scope & ownership validation (BR-98, BR-102 -> MSG126)
  // Fail closed when ownership context is missing or the operator owns zero eligible tours,
  // regardless of whether appliesToAllTours is true or specific tours are selected.
  const hasVerifiedOwnedTours =
    Array.isArray(options?.ownedTourIds) && options.ownedTourIds.length > 0;

  if (!hasVerifiedOwnedTours) {
    if (!payload.appliesToAllTours && payload.appliedTourIds && payload.appliedTourIds.length > 0) {
      errors.appliedTourIds = OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_TOUR_SCOPE;
    } else {
      errors.appliedTourIds = OPERATOR_COUPON_MESSAGES.NO_ELIGIBLE_TOURS;
    }
  } else if (!payload.appliesToAllTours) {
    if (!payload.appliedTourIds || payload.appliedTourIds.length === 0) {
      errors.appliedTourIds = 'Please select at least one tour package or apply to all tours.';
    } else {
      const hasUnownedTour = payload.appliedTourIds.some(
        (id) => !options.ownedTourIds!.includes(id)
      );
      if (hasUnownedTour) {
        errors.appliedTourIds = OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_TOUR_SCOPE;
      }
    }
  }

  return errors;
}

/**
 * Retrieves the operator's coupons list.
 * In production mode: returns truthful PENDING_BE_INTEGRATION since BE endpoints are not yet merged.
 * In demo mode: returns owned coupons from memory store.
 */
export async function getOperatorCoupons(options?: {
  allowDemo?: boolean;
  currentUserId?: number | string;
}): Promise<CouponActionResult<CouponDto[]>> {
  const allowDemo = Boolean(options?.allowDemo) && isCouponDemoAllowedInCurrentEnv();

  if (allowDemo) {
    if (!hasValidActorIdentity(options?.currentUserId)) {
      return {
        status: 'UNAUTHORIZED',
        message: OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_OWNER,
        data: [],
        isDemo: true,
      };
    }

    const ownedCoupons = demoCouponsStore.filter(
      (coupon) => String(coupon.operatorUserId) === String(options.currentUserId)
    );

    // Enrich with tour summaries scoped to the coupon owner's owned tours (A12)
    const enriched = ownedCoupons.map((coupon) => {
      const ownerTours = getDemoOwnedTours(coupon.operatorUserId);
      const appliedTours = coupon.appliesToAllTours
        ? ownerTours
        : ownerTours.filter((t) => coupon.appliedTourIds.includes(t.id));
      return {
        ...coupon,
        appliedTours,
      };
    });

    return {
      status: 'SUCCESS',
      data: enriched,
      isDemo: true,
    };
  }

  return {
    status: 'PENDING_BE_INTEGRATION',
    message: OPERATOR_COUPON_MESSAGES.PENDING_BE_INTEGRATION,
    data: [],
    isDemo: false,
  };
}

/**
 * Retrieves eligible owned tour packages for scope selection (UC-38 & UC-39).
 * In demo mode: returns only tours owned by the authenticated currentUserId (A6).
 */
export async function getEligibleTours(options?: {
  allowDemo?: boolean;
  currentUserId?: number | string;
}): Promise<CouponActionResult<EligibleTourDto[]>> {
  const allowDemo = Boolean(options?.allowDemo) && isCouponDemoAllowedInCurrentEnv();

  if (allowDemo) {
    if (!hasValidActorIdentity(options?.currentUserId)) {
      return {
        status: 'UNAUTHORIZED',
        message: OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_OWNER,
        data: [],
        isDemo: true,
      };
    }

    const ownedTours = getDemoOwnedTours(options.currentUserId);
    return {
      status: 'SUCCESS',
      data: ownedTours,
      isDemo: true,
    };
  }

  return {
    status: 'PENDING_BE_INTEGRATION',
    message: OPERATOR_COUPON_MESSAGES.PENDING_BE_INTEGRATION,
    data: [],
    isDemo: false,
  };
}

/**
 * Retrieves a single coupon by ID or Coupon Code.
 * Enforces ownership (BR-102) using authenticated currentUserId; fails closed if actor is missing.
 */
export async function getOperatorCouponById(
  id: string,
  options?: {
    allowDemo?: boolean;
    currentUserId?: number | string;
  }
): Promise<CouponActionResult<CouponDto>> {
  const allowDemo = Boolean(options?.allowDemo) && isCouponDemoAllowedInCurrentEnv();

  if (allowDemo) {
    if (!hasValidActorIdentity(options?.currentUserId)) {
      return {
        status: 'UNAUTHORIZED',
        message: OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_OWNER,
        isDemo: true,
      };
    }

    const decodedId = decodeURIComponent(id);
    const coupon = demoCouponsStore.find(
      (c) => c.id === decodedId || c.couponCode.toUpperCase() === decodedId.toUpperCase()
    );

    if (!coupon) {
      return {
        status: 'NOT_FOUND',
        message: OPERATOR_COUPON_MESSAGES.NOT_FOUND,
        isDemo: true,
      };
    }

    // Ownership check (BR-102 -> MSG126)
    if (String(coupon.operatorUserId) !== String(options.currentUserId)) {
      return {
        status: 'UNAUTHORIZED',
        message: OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_OWNER,
        isDemo: true,
      };
    }

    const ownerTours = getDemoOwnedTours(coupon.operatorUserId);
    const appliedTours = coupon.appliesToAllTours
      ? ownerTours
      : ownerTours.filter((t) => coupon.appliedTourIds.includes(t.id));

    return {
      status: 'SUCCESS',
      data: {
        ...coupon,
        appliedTours,
      },
      isDemo: true,
    };
  }

  return {
    status: 'PENDING_BE_INTEGRATION',
    message: OPERATOR_COUPON_MESSAGES.PENDING_BE_INTEGRATION,
    isDemo: false,
  };
}

/**
 * UC-38: Create Coupon
 * Requires authenticated currentUserId in Demo mode (never falls back to 101).
 */
export async function createCoupon(
  payload: CreateCouponPayload,
  options?: {
    allowDemo?: boolean;
    currentUserId?: number | string;
    today?: string;
  }
): Promise<CouponActionResult<CouponDto>> {
  const allowDemo = Boolean(options?.allowDemo) && isCouponDemoAllowedInCurrentEnv();

  if (allowDemo) {
    if (!hasValidActorIdentity(options?.currentUserId)) {
      return {
        status: 'UNAUTHORIZED',
        message: OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_OWNER,
        isDemo: true,
      };
    }

    const existingCodes = demoCouponsStore.map((c) => c.couponCode);
    const ownedTours = getDemoOwnedTours(options.currentUserId);
    const ownedTourIds = ownedTours.map((t) => t.id);
    const today = options?.today || getTodayDateString();

    const errors = validateCreateCoupon(payload, { existingCodes, ownedTourIds, today });
    if (Object.keys(errors).length > 0) {
      return {
        status: 'VALIDATION_ERROR',
        errors,
        message: OPERATOR_COUPON_MESSAGES.REQUIRED_SUMMARY,
        isDemo: true,
      };
    }

    const initialStatus = deriveCouponTemporalStatus(
      {
        status: 'Active',
        validFrom: payload.validFrom,
        validTo: payload.validTo,
      },
      today
    );
    const cleanCode = payload.couponCode.trim().toUpperCase();
    const newId = `cp-${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString(36)}`;

    const newCoupon: CouponDto = {
      id: newId,
      couponCode: cleanCode,
      name: payload.name.trim(),
      operatorUserId: options.currentUserId,
      discountType: payload.discountType,
      discountValue: Number(payload.discountValue),
      maxDiscountAmount:
        payload.maxDiscountAmount !== undefined && payload.maxDiscountAmount !== null
          ? Number(payload.maxDiscountAmount)
          : null,
      minSpend:
        payload.minSpend !== undefined && payload.minSpend !== null
          ? Number(payload.minSpend)
          : null,
      usageLimit: Number(payload.usageLimit),
      usageLimitPerTraveler:
        payload.usageLimitPerTraveler !== undefined && payload.usageLimitPerTraveler !== null
          ? Number(payload.usageLimitPerTraveler)
          : null,
      validFrom: payload.validFrom,
      validTo: payload.validTo,
      appliesToAllTours: payload.appliesToAllTours,
      appliedTourIds: payload.appliesToAllTours ? [] : payload.appliedTourIds,
      usageCount: 0,
      status: initialStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: true,
    };

    demoCouponsStore = [newCoupon, ...demoCouponsStore];

    return {
      status: 'SUCCESS',
      data: newCoupon,
      message: OPERATOR_COUPON_MESSAGES.CREATE_SUCCESS,
      isDemo: true,
    };
  }

  return {
    status: 'PENDING_BE_INTEGRATION',
    message: OPERATOR_COUPON_MESSAGES.PENDING_BE_INTEGRATION,
    isDemo: false,
  };
}

/**
 * UC-39: Update Coupon
 * Note: Coupon code is read-only / immutable (BR-97).
 * Enforces ownership (BR-102) using authenticated currentUserId; fails closed if actor is missing.
 */
export async function updateCoupon(
  id: string,
  payload: UpdateCouponPayload,
  options?: {
    allowDemo?: boolean;
    currentUserId?: number | string;
    today?: string;
  }
): Promise<CouponActionResult<CouponDto>> {
  const allowDemo = Boolean(options?.allowDemo) && isCouponDemoAllowedInCurrentEnv();

  if (allowDemo) {
    if (!hasValidActorIdentity(options?.currentUserId)) {
      return {
        status: 'UNAUTHORIZED',
        message: OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_OWNER,
        isDemo: true,
      };
    }

    const decodedId = decodeURIComponent(id);
    const existingIndex = demoCouponsStore.findIndex(
      (c) => c.id === decodedId || c.couponCode.toUpperCase() === decodedId.toUpperCase()
    );

    if (existingIndex === -1) {
      return {
        status: 'NOT_FOUND',
        message: OPERATOR_COUPON_MESSAGES.NOT_FOUND,
        isDemo: true,
      };
    }

    const currentCoupon = demoCouponsStore[existingIndex];

    // Ownership check (BR-102 -> MSG126)
    if (String(currentCoupon.operatorUserId) !== String(options.currentUserId)) {
      return {
        status: 'UNAUTHORIZED',
        message: OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_OWNER,
        isDemo: true,
      };
    }

    const ownedTours = getDemoOwnedTours(options.currentUserId);
    const ownedTourIds = ownedTours.map((t) => t.id);
    const today = options?.today || getTodayDateString();
    const errors = validateUpdateCoupon(currentCoupon, payload, { ownedTourIds, today });
    if (Object.keys(errors).length > 0) {
      return {
        status: 'VALIDATION_ERROR',
        errors,
        message: errors.usageLimit || OPERATOR_COUPON_MESSAGES.REQUIRED_SUMMARY,
        isDemo: true,
      };
    }

    let newStatus = payload.status || currentCoupon.status;
    if (newStatus !== 'Inactive') {
      newStatus = deriveCouponTemporalStatus(
        {
          status: 'Active',
          validFrom: payload.validFrom,
          validTo: payload.validTo,
        },
        today
      );
    }

    const updatedCoupon: CouponDto = {
      ...currentCoupon,
      name: payload.name.trim(),
      discountType: payload.discountType || currentCoupon.discountType,
      discountValue: Number(payload.discountValue),
      maxDiscountAmount:
        payload.maxDiscountAmount !== undefined && payload.maxDiscountAmount !== null
          ? Number(payload.maxDiscountAmount)
          : null,
      minSpend:
        payload.minSpend !== undefined && payload.minSpend !== null
          ? Number(payload.minSpend)
          : null,
      usageLimit: Number(payload.usageLimit),
      usageLimitPerTraveler:
        payload.usageLimitPerTraveler !== undefined && payload.usageLimitPerTraveler !== null
          ? Number(payload.usageLimitPerTraveler)
          : null,
      validFrom: payload.validFrom,
      validTo: payload.validTo,
      appliesToAllTours: payload.appliesToAllTours,
      appliedTourIds: payload.appliesToAllTours ? [] : payload.appliedTourIds,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      isDemo: true,
    };

    demoCouponsStore[existingIndex] = updatedCoupon;

    return {
      status: 'SUCCESS',
      data: updatedCoupon,
      message: OPERATOR_COUPON_MESSAGES.UPDATE_SUCCESS,
      isDemo: true,
    };
  }

  return {
    status: 'PENDING_BE_INTEGRATION',
    message: OPERATOR_COUPON_MESSAGES.PENDING_BE_INTEGRATION,
    isDemo: false,
  };
}

/**
 * UC-39 Alternative Flow: Deactivate Coupon
 * Sets status to Inactive.
 * BR-100: Discounts already applied to previous bookings remain unchanged.
 */
export async function deactivateCoupon(
  id: string,
  options?: {
    allowDemo?: boolean;
    currentUserId?: number | string;
  }
): Promise<CouponActionResult<CouponDto>> {
  const allowDemo = Boolean(options?.allowDemo) && isCouponDemoAllowedInCurrentEnv();

  if (allowDemo) {
    if (!hasValidActorIdentity(options?.currentUserId)) {
      return {
        status: 'UNAUTHORIZED',
        message: OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_OWNER,
        isDemo: true,
      };
    }

    const decodedId = decodeURIComponent(id);
    const existingIndex = demoCouponsStore.findIndex(
      (c) => c.id === decodedId || c.couponCode.toUpperCase() === decodedId.toUpperCase()
    );

    if (existingIndex === -1) {
      return {
        status: 'NOT_FOUND',
        message: OPERATOR_COUPON_MESSAGES.NOT_FOUND,
        isDemo: true,
      };
    }

    const current = demoCouponsStore[existingIndex];
    if (String(current.operatorUserId) !== String(options.currentUserId)) {
      return {
        status: 'UNAUTHORIZED',
        message: OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_OWNER,
        isDemo: true,
      };
    }

    const deactivated: CouponDto = {
      ...current,
      status: 'Inactive',
      updatedAt: new Date().toISOString(),
    };
    demoCouponsStore[existingIndex] = deactivated;

    return {
      status: 'SUCCESS',
      data: deactivated,
      message: OPERATOR_COUPON_MESSAGES.DEACTIVATE_SUCCESS,
      isDemo: true,
    };
  }

  return {
    status: 'PENDING_BE_INTEGRATION',
    message: OPERATOR_COUPON_MESSAGES.PENDING_BE_INTEGRATION,
    isDemo: false,
  };
}

/**
 * Activate Coupon (reactivate an inactive coupon).
 * Enforces BR-97 / BR-22: Expired coupons (validTo < today) cannot be reactivated.
 */
export async function activateCoupon(
  id: string,
  options?: {
    allowDemo?: boolean;
    currentUserId?: number | string;
    today?: string;
  }
): Promise<CouponActionResult<CouponDto>> {
  const allowDemo = Boolean(options?.allowDemo) && isCouponDemoAllowedInCurrentEnv();

  if (allowDemo) {
    if (!hasValidActorIdentity(options?.currentUserId)) {
      return {
        status: 'UNAUTHORIZED',
        message: OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_OWNER,
        isDemo: true,
      };
    }

    const decodedId = decodeURIComponent(id);
    const existingIndex = demoCouponsStore.findIndex(
      (c) => c.id === decodedId || c.couponCode.toUpperCase() === decodedId.toUpperCase()
    );

    if (existingIndex === -1) {
      return {
        status: 'NOT_FOUND',
        message: OPERATOR_COUPON_MESSAGES.NOT_FOUND,
        isDemo: true,
      };
    }

    const current = demoCouponsStore[existingIndex];
    if (String(current.operatorUserId) !== String(options.currentUserId)) {
      return {
        status: 'UNAUTHORIZED',
        message: OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_OWNER,
        isDemo: true,
      };
    }

    const today = options?.today || getTodayDateString();
    if (isCouponExpired(current.validTo, today)) {
      return {
        status: 'VALIDATION_ERROR',
        errors: {
          validTo: OPERATOR_COUPON_MESSAGES.EXPIRED_REACTIVATION_BLOCKED,
        },
        message: OPERATOR_COUPON_MESSAGES.EXPIRED_REACTIVATION_BLOCKED,
        isDemo: true,
      };
    }

    const activeStatus = deriveCouponTemporalStatus(
      {
        status: 'Active',
        validFrom: current.validFrom,
        validTo: current.validTo,
      },
      today
    );

    const activated: CouponDto = {
      ...current,
      status: activeStatus,
      updatedAt: new Date().toISOString(),
    };
    demoCouponsStore[existingIndex] = activated;

    return {
      status: 'SUCCESS',
      data: activated,
      message: OPERATOR_COUPON_MESSAGES.ACTIVATE_SUCCESS,
      isDemo: true,
    };
  }

  return {
    status: 'PENDING_BE_INTEGRATION',
    message: OPERATOR_COUPON_MESSAGES.PENDING_BE_INTEGRATION,
    isDemo: false,
  };
}
