import {
  DEMO_RECOMMENDED_TOURS,
  DEMO_TOUR_DETAIL_HOI_AN,
} from '../data/tourDemoFixtures';
import { mapTourDetailResponse, parseTourDetailResponse } from './tourDetailResponse';
import type {
  ApiProblem,
  PagedToursResponseDto,
  TourDetailDto,
  TourRecommendationDto,
  TourRecommendationCriteriaDto,
  TourRecommendationsResponseDto,
  TourCategoryDto,
  TourSearchItemDto,
} from '../types/tour';
import { TourApiError } from '../types/tour';
import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase } from '@/lib/apiBase';
import { publicTourSearchVi } from '../resources/vi';

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
    || (value.aggregateRating !== undefined && !isNullableNumber(value.aggregateRating))
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
    aggregateRating: typeof value.aggregateRating === 'number' ? value.aggregateRating : null,
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
  try {
    const raw = await requestJson(endpoint, signal);
    return parsePagedTours(raw);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    if (error instanceof TourApiError && (error.status === 0 || error.status >= 500)) {
      throw new TourApiError(
        publicTourSearchVi.systemError,
        error.status,
        error.problem,
      );
    }
    throw error;
  }
}

export async function getTourCategories(signal?: AbortSignal): Promise<TourCategoryDto[]> {
  const raw = await requestJson('/api/tour-categories', signal);
  if (!Array.isArray(raw) || raw.some((item) => !isRecord(item)
    || typeof item.categoryId !== 'number'
    || typeof item.code !== 'string'
    || typeof item.name !== 'string')) {
    throw new TourApiError('Dữ liệu danh mục tour không hợp lệ.', 0);
  }
  return raw as TourCategoryDto[];
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

export interface RefreshTourRecommendationsCriteria {
  destination?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  minBudget?: number | null;
  maxBudget?: number | null;
}

function parseRecommendationCriteria(value: unknown): TourRecommendationCriteriaDto | null {
  if (value === null) return null;
  if (!isRecord(value)
    || !isOptionalNullableString(value.destination)
    || !isOptionalNullableString(value.startDate)
    || !isOptionalNullableString(value.endDate)
    || (value.minBudget !== undefined && !isNullableNumber(value.minBudget))
    || (value.maxBudget !== undefined && !isNullableNumber(value.maxBudget))) {
    throw new TourApiError('Dữ liệu tiêu chí gợi ý không hợp lệ.', 0);
  }
  return {
    destination: typeof value.destination === 'string' ? value.destination : null,
    startDate: typeof value.startDate === 'string' ? value.startDate : null,
    endDate: typeof value.endDate === 'string' ? value.endDate : null,
    minBudget: typeof value.minBudget === 'number' ? value.minBudget : null,
    maxBudget: typeof value.maxBudget === 'number' ? value.maxBudget : null,
  };
}

export function parseTourRecommendations(value: unknown): TourRecommendationsResponseDto {
  if (!isRecord(value)
    || typeof value.page !== 'number'
    || typeof value.pageSize !== 'number'
    || typeof value.totalCount !== 'number'
    || typeof value.totalPages !== 'number'
    || typeof value.asOfUtc !== 'string'
    || !Array.isArray(value.items)) {
    throw new TourApiError('Dữ liệu gợi ý tour không hợp lệ.', 0);
  }
  const items = value.items.map((raw): TourRecommendationDto => {
    if (!isRecord(raw)
      || typeof raw.matchingScore !== 'number'
      || !Array.isArray(raw.matchingReasons)
      || raw.matchingReasons.some((reason) => typeof reason !== 'string')) {
      throw new TourApiError('Dữ liệu gợi ý tour không hợp lệ.', 0);
    }
    const tour = parseTourSearchItem(raw.tour);
    if (raw.matchingScore <= 80
      || raw.matchingScore > 100
      || tour.availabilityStatus.toLowerCase() !== 'available'
      || tour.representativeScheduleId === null
      || (tour.remainingSlots ?? 0) <= 0) {
      throw new TourApiError('Dữ liệu gợi ý tour không hợp lệ.', 0);
    }
    return {
      tour,
      matchingScore: raw.matchingScore,
      matchingReasons: raw.matchingReasons as string[],
    };
  });
  return {
    page: value.page,
    pageSize: value.pageSize,
    totalCount: value.totalCount,
    totalPages: value.totalPages,
    asOfUtc: value.asOfUtc,
    criteria: parseRecommendationCriteria(value.criteria),
    items,
    isDemo: false,
  };
}

async function requestRecommendations(
  method: 'GET' | 'POST',
  page: number,
  criteria: RefreshTourRecommendationsCriteria | undefined,
  signal?: AbortSignal,
): Promise<TourRecommendationsResponseDto> {
  const token = AuthStorage.getAccessToken();
  if (!token) throw new TourApiError('Phiên đăng nhập đã hết hạn.', 401);
  let response: Response;
  try {
    response = await fetch(`${getApiBase()}/tour-recommendations${method === 'GET' ? `?page=${page}` : '/refresh'}`, {
      method,
      signal,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      },
      body: method === 'POST' ? JSON.stringify({
        destination: criteria?.destination || null,
        startDate: criteria?.startDate || null,
        endDate: criteria?.endDate || null,
        minBudget: criteria?.minBudget ?? null,
        maxBudget: criteria?.maxBudget ?? null,
      }) : undefined,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new TourApiError('Không thể tải gợi ý tour (MSG127).', 0);
  }
  const body = await readResponse(response);
  if (!response.ok) {
    const problem = asProblem(body);
    throw new TourApiError(
      problem?.errorCode === 'tour_recommendation.interest_tags_required'
        ? 'Bạn cần thiết lập ít nhất một sở thích du lịch.'
        : 'Không thể tải gợi ý tour (MSG127).',
      response.status,
      problem,
    );
  }
  return parseTourRecommendations(body);
}

let initialRefresh: Promise<TourRecommendationsResponseDto> | null = null;

/** GET latest; only a missing snapshot (criteria=null) triggers one deduplicated POST refresh. */
export async function getTourRecommendations(options?: {
  signal?: AbortSignal;
  allowDemo?: boolean;
  page?: number;
  initialCriteria?: RefreshTourRecommendationsCriteria;
}): Promise<TourRecommendationsResponseDto> {
  const demoAllowed = options?.allowDemo === true && isTourDemoAllowedInCurrentEnv();

  if (demoAllowed) {
    return {
      page: 1,
      pageSize: 20,
      totalCount: DEMO_RECOMMENDED_TOURS.length,
      totalPages: 1,
      asOfUtc: new Date(0).toISOString(),
      criteria: null,
      items: DEMO_RECOMMENDED_TOURS,
      isDemo: true,
    };
  }
  const page = options?.page ?? 1;
  const latest = await requestRecommendations('GET', page, undefined, options?.signal);
  if (latest.criteria !== null || page !== 1) return latest;
  initialRefresh ??= requestRecommendations('POST', 1, options?.initialCriteria, options?.signal)
    .finally(() => { initialRefresh = null; });
  return initialRefresh;
}

export function refreshTourRecommendations(
  criteria: RefreshTourRecommendationsCriteria,
  signal?: AbortSignal,
): Promise<TourRecommendationsResponseDto> {
  initialRefresh ??= requestRecommendations('POST', 1, criteria, signal)
    .finally(() => { initialRefresh = null; });
  return initialRefresh;
}

/** Tour ids are 64-bit integers; anything else cannot exist, so it never reaches the network. */
const TOUR_ID_PATTERN = /^\d{1,19}$/;

const TOUR_NOT_FOUND_MESSAGE =
  'Gói tour không tồn tại hoặc đã ngừng hiển thị công khai (MSG65).';
const TOUR_UNAVAILABLE_MESSAGE =
  'TripMate tạm thời không thể tải chi tiết tour. Vui lòng kiểm tra kết nối và thử lại (MSG127).';

/**
 * UC-26: View Tour Details.
 *
 * Calls the BFF route `/api/tours/{id}` (-> `GET /api/v1/tours/{id}`), validates the body strictly and maps it to
 * the page view model. Failures are classified by `TourApiError.status`: 404 = not found / not public (MSG65),
 * anything else = unavailable (MSG127). Demo data is returned only in an explicit demo opt-in
 * (non-production + NEXT_PUBLIC_ENABLE_DEMO_FIXTURES=true + allowDemo=true); production never falls back to it.
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

  if (!TOUR_ID_PATTERN.test(id)) {
    throw new TourApiError(TOUR_NOT_FOUND_MESSAGE, 404);
  }

  let raw: unknown;
  try {
    raw = await requestJson(`/api/tours/${encodeURIComponent(id)}`, options?.signal);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    if (error instanceof TourApiError) {
      throw new TourApiError(
        error.status === 404 ? TOUR_NOT_FOUND_MESSAGE : TOUR_UNAVAILABLE_MESSAGE,
        error.status,
        error.problem,
      );
    }
    throw new TourApiError(TOUR_UNAVAILABLE_MESSAGE, 0);
  }

  try {
    return mapTourDetailResponse(parseTourDetailResponse(raw));
  } catch (error) {
    if (error instanceof TourApiError) throw new TourApiError(TOUR_UNAVAILABLE_MESSAGE, 0);
    throw error;
  }
}
