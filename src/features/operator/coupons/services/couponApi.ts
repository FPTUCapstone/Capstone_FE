import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase } from '@/lib/authApi';

export interface EligibleCouponTour {
  id: number;
  title: string;
  destination: string | null;
  basePrice: number;
}

export interface CreateCouponInput {
  code: string;
  discountType: 'Percentage' | 'Flat';
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  validFromUtc: string;
  validToUtc: string;
  applicableTourIds: number[];
}

export interface CreateCouponResult {
  couponId: number;
  code: string;
}

export class CouponApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = 'CouponApiError';
  }
}

function authenticatedHeaders(): HeadersInit {
  const accessToken = AuthStorage.getAccessToken();
  if (!accessToken) {
    throw new CouponApiError(401, 'AUTH_REQUIRED', 'Please sign in again to manage coupons.');
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

function errorMessageFor(status: number): string {
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'Only approved tour operators can manage coupons.';
  if (status === 409) return 'This coupon code is already in use.';
  if (status === 422) return 'Review the coupon details and selected tours.';
  return 'We could not complete that request. Please try again.';
}

async function parseError(response: Response): Promise<never> {
  let code: string | undefined;
  let message = errorMessageFor(response.status);
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object') {
      const candidate = body as Record<string, unknown>;
      if (typeof candidate.errorCode === 'string') code = candidate.errorCode;
      else if (typeof candidate.code === 'string') code = candidate.code;
      else if (candidate.extensions && typeof candidate.extensions === 'object'
          && typeof (candidate.extensions as Record<string, unknown>).errorCode === 'string') {
        code = (candidate.extensions as Record<string, unknown>).errorCode as string;
      }
      // Only surface server text for expected client-validation errors.
      if (response.status === 400 && typeof candidate.title === 'string') message = candidate.title;
    }
  } catch {
    // Keep the safe status-specific text when the response is not JSON.
  }
  throw new CouponApiError(response.status, code, message);
}

function isEligibleTour(value: unknown): value is { tourId: number; title: string; destination: string | null; basePrice: number } {
  return !!value && typeof value === 'object'
    && Number.isSafeInteger((value as { tourId?: unknown }).tourId)
    && typeof (value as { title?: unknown }).title === 'string'
    && ((value as { destination?: unknown }).destination === null || typeof (value as { destination?: unknown }).destination === 'string')
    && typeof (value as { basePrice?: unknown }).basePrice === 'number';
}

export async function getEligibleCouponTours(): Promise<EligibleCouponTour[]> {
  let response: Response;
  try {
    response = await fetch(`${getApiBase()}/operator/coupons/eligible-tours`, {
      headers: authenticatedHeaders(),
    });
  } catch (error) {
    if (error instanceof CouponApiError) throw error;
    throw new CouponApiError(0, 'NETWORK', 'Unable to load your approved tours. Check your connection and try again.');
  }
  if (!response.ok) return parseError(response);

  const body: unknown = await response.json();
  if (!Array.isArray(body) || !body.every(isEligibleTour)) {
    throw new CouponApiError(response.status, 'INVALID_RESPONSE', 'We could not load your approved tours. Please try again.');
  }

  return body.map((tour) => ({
    id: tour.tourId,
    title: tour.title,
    destination: tour.destination,
    basePrice: tour.basePrice,
  }));
}

export async function createCoupon(input: CreateCouponInput): Promise<CreateCouponResult> {
  const body = {
    code: input.code.trim().toUpperCase(),
    discountType: input.discountType,
    discountValue: input.discountValue,
    ...(input.discountType === 'Percentage' ? { maxDiscountAmount: input.maxDiscountAmount } : {}),
    minOrderAmount: input.minOrderAmount,
    usageLimit: input.usageLimit,
    usageLimitPerUser: input.usageLimitPerUser,
    validFromUtc: input.validFromUtc,
    validToUtc: input.validToUtc,
    applicableTourIds: input.applicableTourIds,
  };

  let response: Response;
  try {
    response = await fetch(`${getApiBase()}/operator/coupons`, {
      method: 'POST',
      headers: authenticatedHeaders(),
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof CouponApiError) throw error;
    throw new CouponApiError(0, 'NETWORK', 'Unable to create the coupon. Check your connection and try again.');
  }
  if (!response.ok) return parseError(response);

  const result: unknown = await response.json();
  if (!result || typeof result !== 'object'
    || !Number.isSafeInteger((result as { couponId?: unknown }).couponId)
    || typeof (result as { code?: unknown }).code !== 'string') {
    throw new CouponApiError(response.status, 'INVALID_RESPONSE', 'The coupon was created, but the response was incomplete. Refresh before creating another.');
  }

  return result as CreateCouponResult;
}
