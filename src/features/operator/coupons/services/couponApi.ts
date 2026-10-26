import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase } from '@/lib/apiBase';

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

export interface OperatorCouponRecord {
  couponId: number;
  ownerOperatorUserId: number;
  code: string;
  name: string;
  discountType: 'Percentage' | 'Flat';
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usedCount: number;
  validFromUtc: string;
  validToUtc: string;
  status: 'Active' | 'Expired' | 'Disabled';
  createdAtUtc: string;
  updatedAtUtc: string;
  applicableTourIds: number[];
}

export interface UpdateOperatorCouponInput {
  name: string;
  discountType: 'Percentage' | 'Flat';
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  validFromUtc: string;
  validToUtc: string;
  applicableTourIds: number[];
}

export class CouponApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | undefined,
    message: string,
    public readonly fieldErrors?: Record<string, string>,
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

function requireCouponId(id: string): string {
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    throw new CouponApiError(400, 'INVALID_ID', 'The coupon ID is invalid.');
  }
  return id;
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function isNullableLimit(value: unknown): value is number | null {
  return value === null || (Number.isSafeInteger(value) && Number(value) > 0);
}

function isUtcInstant(value: unknown): value is string {
  return typeof value === 'string' && /(?:Z|[+-]\d\d:\d\d)$/.test(value)
    && Number.isFinite(Date.parse(value));
}

function isOperatorCouponRecord(value: unknown): value is OperatorCouponRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return Number.isSafeInteger(v.couponId) && Number(v.couponId) > 0
    && Number.isSafeInteger(v.ownerOperatorUserId) && Number(v.ownerOperatorUserId) > 0
    && typeof v.code === 'string' && v.code.length > 0
    && typeof v.name === 'string' && v.name.length > 0
    && (v.discountType === 'Percentage' || v.discountType === 'Flat')
    && typeof v.discountValue === 'number' && Number.isFinite(v.discountValue) && v.discountValue > 0
    && isNullableNumber(v.maxDiscountAmount)
    && typeof v.minOrderAmount === 'number' && Number.isFinite(v.minOrderAmount) && v.minOrderAmount >= 0
    && isNullableLimit(v.usageLimit) && isNullableLimit(v.usageLimitPerUser)
    && Number.isSafeInteger(v.usedCount) && Number(v.usedCount) >= 0
    && isUtcInstant(v.validFromUtc) && isUtcInstant(v.validToUtc)
    && (v.status === 'Active' || v.status === 'Expired' || v.status === 'Disabled')
    && isUtcInstant(v.createdAtUtc) && isUtcInstant(v.updatedAtUtc)
    && Array.isArray(v.applicableTourIds)
    && v.applicableTourIds.every((id: unknown) => Number.isSafeInteger(id) && Number(id) > 0);
}

async function couponRequest(path: string, init: RequestInit = {}): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${getApiBase()}/operator/coupons${path}`, {
      ...init,
      headers: authenticatedHeaders(),
      cache: 'no-store',
      signal: init.signal ?? AbortSignal.timeout(15000),
    });
  } catch (error) {
    if (error instanceof CouponApiError) throw error;
    throw new CouponApiError(0, 'NETWORK', 'Unable to reach coupons. Check your connection and try again.');
  }
  if (!response.ok) return parseError(response);
  try {
    return await response.json() as unknown;
  } catch {
    throw new CouponApiError(response.status, 'INVALID_RESPONSE', 'The coupon response was incomplete. Refresh and try again.');
  }
}

function requireCouponRecord(value: unknown): OperatorCouponRecord {
  if (!isOperatorCouponRecord(value)) {
    throw new CouponApiError(200, 'INVALID_RESPONSE', 'The coupon response was incomplete. Refresh and try again.');
  }
  return value;
}

export async function listOperatorCoupons(signal?: AbortSignal): Promise<OperatorCouponRecord[]> {
  const value = await couponRequest('', { signal });
  if (!Array.isArray(value) || !value.every(isOperatorCouponRecord)) {
    throw new CouponApiError(200, 'INVALID_RESPONSE', 'The coupon list was incomplete. Refresh and try again.');
  }
  return value;
}

export async function getOperatorCoupon(id: string, signal?: AbortSignal): Promise<OperatorCouponRecord> {
  return requireCouponRecord(await couponRequest(`/${requireCouponId(id)}`, { signal }));
}

export async function updateOperatorCoupon(id: string, input: UpdateOperatorCouponInput): Promise<OperatorCouponRecord> {
  return requireCouponRecord(await couponRequest(`/${requireCouponId(id)}`, {
    method: 'PUT', body: JSON.stringify(input),
  }));
}

export async function setOperatorCouponActivation(id: string, active: boolean): Promise<OperatorCouponRecord> {
  return requireCouponRecord(await couponRequest(`/${requireCouponId(id)}/${active ? 'activate' : 'deactivate'}`, {
    method: 'POST',
  }));
}

async function parseError(response: Response): Promise<never> {
  let code: string | undefined;
  let message = errorMessageFor(response.status);
  let fieldErrors: Record<string, string> | undefined;
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
      if (candidate.errors && typeof candidate.errors === 'object' && !Array.isArray(candidate.errors)) {
        const parsed = Object.entries(candidate.errors as Record<string, unknown>)
          .flatMap(([field, value]) => {
            const first = Array.isArray(value) ? value.find((item) => typeof item === 'string') : value;
            return typeof first === 'string' && first.trim() ? [[field, first] as const] : [];
          });
        if (parsed.length > 0) fieldErrors = Object.fromEntries(parsed);
      }
    }
  } catch {
    // Keep the safe status-specific text when the response is not JSON.
  }
  throw new CouponApiError(response.status, code, message, fieldErrors);
}

function isEligibleTour(value: unknown): value is { tourId: number; title: string; destination: string | null; basePrice: number } {
  return !!value && typeof value === 'object'
    && Number.isSafeInteger((value as { tourId?: unknown }).tourId)
    && typeof (value as { title?: unknown }).title === 'string'
    && ((value as { destination?: unknown }).destination === null || typeof (value as { destination?: unknown }).destination === 'string')
    && typeof (value as { basePrice?: unknown }).basePrice === 'number';
}

export async function getEligibleCouponTours(signal?: AbortSignal): Promise<EligibleCouponTour[]> {
  let response: Response;
  try {
    response = await fetch(`${getApiBase()}/operator/coupons/eligible-tours`, {
      headers: authenticatedHeaders(),
      cache: 'no-store',
      signal: signal ?? AbortSignal.timeout(15000),
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
