import {
  DEMO_RECOMMENDED_TOURS,
  DEMO_TOUR_DETAIL_HOI_AN,
} from '../data/tourDemoFixtures';
import type {
  ApiProblem,
  PagedToursResponseDto,
  TourDetailDto,
  TourRecommendationDto,
  TourSearchItemDto,
} from '../types/tour';
import { TourApiError } from '../types/tour';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isOptionalNullableString(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === 'string';
}

function isNullableNumber(value: unknown): value is number | null {
  return typeof value === 'number' || value === null;
}

export function parseTourSearchItem(value: unknown): TourSearchItemDto {
  if (
    !isRecord(value) ||
    typeof value.tourId !== 'string' ||
    typeof value.title !== 'string' ||
    !Array.isArray(value.destinations) ||
    typeof value.operatorName !== 'string' ||
    typeof value.durationDays !== 'number' ||
    typeof value.basePrice !== 'number' ||
    typeof value.currency !== 'string' ||
    !isNullableString(value.representativeScheduleId) ||
    !isNullableString(value.departureAtUtc) ||
    typeof value.availabilityStatus !== 'string' ||
    !isNullableNumber(value.remainingSlots) ||
    !isOptionalNullableString(value.thumbnailUrl)
  ) {
    throw new Error('Dữ liệu gói tour không hợp lệ.');
  }

  const normalizedThumbnailUrl =
    typeof value.thumbnailUrl === 'string' && value.thumbnailUrl.trim().length > 0
      ? value.thumbnailUrl
      : null;

  return {
    tourId: value.tourId,
    title: value.title,
    destinations: value.destinations.filter((d): d is string => typeof d === 'string'),
    operatorName: value.operatorName,
    durationDays: value.durationDays,
    basePrice: value.basePrice,
    currency: value.currency,
    representativeScheduleId: value.representativeScheduleId,
    departureAtUtc: value.departureAtUtc,
    availabilityStatus: value.availabilityStatus,
    remainingSlots: value.remainingSlots,
    thumbnailUrl: normalizedThumbnailUrl,
  };
}

export function parsePagedTours(value: unknown): PagedToursResponseDto {
  if (
    !isRecord(value) ||
    typeof value.page !== 'number' ||
    typeof value.pageSize !== 'number' ||
    typeof value.totalCount !== 'number' ||
    typeof value.totalPages !== 'number' ||
    typeof value.asOfUtc !== 'string' ||
    !Array.isArray(value.items)
  ) {
    throw new Error('Dữ liệu phân trang danh sách tour không hợp lệ.');
  }

  return {
    page: value.page,
    pageSize: value.pageSize,
    totalCount: value.totalCount,
    totalPages: value.totalPages,
    asOfUtc: value.asOfUtc,
    items: value.items.map(parseTourSearchItem),
  };
}

async function readResponse(response: Response): Promise<unknown> {
  const type = response.headers.get('content-type') ?? '';
  return type.includes('application/json') || type.includes('problem+json')
    ? response.json()
    : null;
}

function asProblem(value: unknown): ApiProblem | undefined {
  return isRecord(value) ? (value as ApiProblem) : undefined;
}

async function requestJson(path: string, signal?: AbortSignal): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(path, { signal, headers: { Accept: 'application/json' } });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new TourApiError('Không thể kết nối máy chủ tour.', 0);
  }

  const body = await readResponse(response);
  if (!response.ok) {
    const problem = asProblem(body);
    throw new TourApiError(
      problem?.title ?? 'Không thể tải dữ liệu tour.',
      response.status,
      problem,
    );
  }
  return body;
}

/**
 * UC-24: Search Tours
 * Calls the verified BFF endpoint /api/tours which forwards to GET /api/v1/tours.
 */
export async function searchTours(
  query: URLSearchParams,
  signal?: AbortSignal,
): Promise<PagedToursResponseDto> {
  const queryString = query.toString();
  const endpoint = queryString ? `/api/tours?${queryString}` : '/api/tours';
  const raw = await requestJson(endpoint, signal);
  return parsePagedTours(raw);
}

/**
 * Production gate for tour demo fixtures.
 * Strictly requires non-production environment AND explicit NEXT_PUBLIC_ENABLE_DEMO_FIXTURES === 'true'.
 * Production environment ALWAYS wins (returns false).
 */
export function isTourDemoAllowedInCurrentEnv(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES === 'true'
  );
}

/**
 * UC-25: Receive Tour Recommendations
 * Status: PENDING_BE_INTEGRATION
 *
 * Backend endpoint does not exist yet in Capstone_BE.
 * In production mode: returns empty array indicating pending integration.
 * In explicit demo opt-in mode (non-production + NEXT_PUBLIC_ENABLE_DEMO_FIXTURES=true + allowDemo=true):
 * returns DEMO_RECOMMENDED_TOURS.
 */
export async function getTourRecommendations(options?: {
  signal?: AbortSignal;
  allowDemo?: boolean;
}): Promise<{ items: TourRecommendationDto[]; isPendingBe: boolean; isDemo: boolean }> {
  const demoAllowed = options?.allowDemo === true && isTourDemoAllowedInCurrentEnv();

  if (demoAllowed) {
    return {
      items: DEMO_RECOMMENDED_TOURS,
      isPendingBe: false,
      isDemo: true,
    };
  }

  // Real production path: Backend recommendation API is not yet provisioned.
  // We do NOT call a phantom endpoint or fake a success response.
  return {
    items: [],
    isPendingBe: true,
    isDemo: false,
  };
}

/**
 * UC-26: View Tour Details
 * Status: PENDING_BE_INTEGRATION
 *
 * Backend endpoint GET /api/v1/tours/{id} does not exist yet in Capstone_BE.
 * In explicit demo opt-in mode (non-production + NEXT_PUBLIC_ENABLE_DEMO_FIXTURES=true + allowDemo=true):
 * returns DEMO_TOUR_DETAIL_HOI_AN.
 * In production mode: attempts to fetch via BFF. If not found or BE unavailable,
 * throws TourApiError so the UI renders the explicit pending/unavailable state.
 */
export async function getTourDetail(
  id: string,
  options?: {
    signal?: AbortSignal;
    allowDemo?: boolean;
  },
): Promise<TourDetailDto> {
  const demoAllowed = options?.allowDemo === true && isTourDemoAllowedInCurrentEnv();

  if (demoAllowed) {
    return {
      ...DEMO_TOUR_DETAIL_HOI_AN,
      tourId: id || DEMO_TOUR_DETAIL_HOI_AN.tourId,
    };
  }

  // Attempt to call future BFF route /api/tours/${id}
  try {
    const raw = await requestJson(`/api/tours/${encodeURIComponent(id)}`, options?.signal);
    if (isRecord(raw) && typeof raw.tourId === 'string') {
      return raw as unknown as TourDetailDto;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    // Mark as PENDING_BE_INTEGRATION
    throw new TourApiError(
      'Chi tiết tour đang chờ hoàn tất kết nối API từ máy chủ (UC-26 — PENDING_BE_INTEGRATION).',
      501,
    );
  }

  throw new TourApiError(
    'Chi tiết tour đang chờ hoàn tất kết nối API từ máy chủ (UC-26 — PENDING_BE_INTEGRATION).',
    501,
  );
}
