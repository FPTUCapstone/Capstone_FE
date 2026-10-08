/**
 * UC-38: Create Coupon
 * UC-39: Update Coupon
 * Supporting Workspace: Promotional Coupons List
 *
 * Canonical SRS Reference: Report 3 §3.8.3.1, §3.8.3.2.
 * Business Rules: BR-22, BR-97, BR-98, BR-99, BR-100, BR-102.
 * Messages: MSG01, MSG29, MSG112, MSG113, MSG114, MSG126, MSG127, MSG143.
 */

export type CouponStatus = 'Active' | 'Scheduled' | 'Inactive' | 'Expired';

export type DiscountType = 'Percentage' | 'Flat';

export interface EligibleTourDto {
  id: string;
  tourCode: string;
  title: string;
  destination?: string;
  basePrice: number;
  status: string;
  operatorUserId: number | string;
}

export interface CouponDto {
  id: string;
  couponCode: string;
  name: string;
  operatorUserId: number | string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minSpend?: number | null;
  usageLimit: number;
  usageLimitPerTraveler?: number | null;
  validFrom: string; // YYYY-MM-DD
  validTo: string; // YYYY-MM-DD
  appliesToAllTours: boolean;
  appliedTourIds: string[];
  appliedTours?: EligibleTourDto[];
  usageCount: number;
  status: CouponStatus;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface CreateCouponPayload {
  couponCode: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minSpend?: number | null;
  usageLimit: number;
  usageLimitPerTraveler?: number | null;
  validFrom: string;
  validTo: string;
  appliesToAllTours: boolean;
  appliedTourIds: string[];
}

export interface UpdateCouponPayload {
  name: string;
  discountType?: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minSpend?: number | null;
  usageLimit: number;
  usageLimitPerTraveler?: number | null;
  validFrom: string;
  validTo: string;
  appliesToAllTours: boolean;
  appliedTourIds: string[];
  status?: CouponStatus;
}

export type CouponValidationErrors = Record<string, string | undefined>;

export type CouponActionStatus =
  | 'SUCCESS'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'PENDING_BE_INTEGRATION'
  | 'SYSTEM_ERROR'
  | 'NOT_FOUND';

export interface CouponActionResult<T = CouponDto> {
  status: CouponActionStatus;
  data?: T;
  message?: string;
  errors?: CouponValidationErrors;
  isDemo?: boolean;
}

export const OPERATOR_COUPON_DEFAULT_PAGE_SIZE = 20;

export const OPERATOR_COUPON_MESSAGES = {
  REQUIRED_FIELD: 'This field is required.',
  REQUIRED_SUMMARY: 'Please fill in all required fields.',
  DUPLICATE_CODE: 'Coupon code already exists in the system.',
  INVALID_NUMERIC:
    'Discount value, usage limit, or minimum spend must be valid positive numbers.',
  USAGE_LIMIT_BELOW_USAGE_COUNT:
    'Usage limit cannot be lower than the recorded redemptions count.',
  INVALID_VALIDITY_PERIOD:
    'Invalid validity period. Start date must not be later than end date, and end date cannot be in the past.',
  EXPIRED_REACTIVATION_BLOCKED:
    'Cannot reactivate an expired coupon. Please update the end date before activating.',
  UNAUTHORIZED_TOUR_SCOPE:
    'Selected tours include packages not owned by your tour operator account.',
  NO_ELIGIBLE_TOURS:
    'No eligible tours available. At least one owned eligible tour package is required to configure a coupon.',
  UNAUTHORIZED_OWNER:
    'Access denied. You can only view and manage coupons for your own tour operator account.',
  CREATE_SUCCESS: 'Coupon created successfully.',
  UPDATE_SUCCESS: 'Coupon updated successfully.',
  DEACTIVATE_SUCCESS: 'Coupon deactivated successfully.',
  ACTIVATE_SUCCESS: 'Coupon reactivated successfully.',
  SYSTEM_ERROR: 'Unable to save changes due to a system error. Please try again later.',
  PENDING_BE_INTEGRATION:
    'Backend coupon endpoints are currently under development (PENDING_BE_INTEGRATION).',
  NOT_FOUND: 'The requested coupon was not found.',
} as const;
