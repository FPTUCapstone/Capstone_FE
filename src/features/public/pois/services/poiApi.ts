import type {
  ApiProblem,
  PagedPois,
  PoiDetail,
  PoiOpeningHour,
  PoiPhoto,
  PoiSummary,
  PoiTag,
} from '../types/poi';
import { PoiApiError } from '../types/poi';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isNullableNumber(value: unknown): value is number | null {
  return typeof value === 'number' || value === null;
}

function parseSummary(value: unknown): PoiSummary {
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' ||
    typeof value.name !== 'string' ||
    typeof value.categoryId !== 'number' ||
    typeof value.categoryName !== 'string' ||
    typeof value.latitude !== 'number' ||
    typeof value.longitude !== 'number' ||
    !isNullableString(value.address) ||
    typeof value.indoorOutdoor !== 'string' ||
    typeof value.averageVisitDurationMinutes !== 'number' ||
    typeof value.hasShelter !== 'boolean' ||
    !isNullableNumber(value.averageRating) ||
    typeof value.reviewCount !== 'number' ||
    !isNullableString(value.thumbnailUrl) ||
    !isNullableNumber(value.distanceKm) ||
    typeof value.isOpenNow !== 'boolean'
  ) {
    throw new Error('Dữ liệu danh sách địa điểm không hợp lệ.');
  }
  return value as unknown as PoiSummary;
}

export function parsePagedPois(value: unknown): PagedPois {
  if (
    !isRecord(value) ||
    typeof value.page !== 'number' ||
    typeof value.pageSize !== 'number' ||
    typeof value.totalCount !== 'number' ||
    typeof value.totalPages !== 'number' ||
    !Array.isArray(value.items)
  ) {
    throw new Error('Dữ liệu phân trang địa điểm không hợp lệ.');
  }
  return {
    page: value.page,
    pageSize: value.pageSize,
    totalCount: value.totalCount,
    totalPages: value.totalPages,
    items: value.items.map(parseSummary),
  };
}

function parseOpeningHour(value: unknown): PoiOpeningHour {
  if (
    !isRecord(value) ||
    typeof value.dayOfWeek !== 'number' ||
    !isNullableString(value.openTime) ||
    !isNullableString(value.closeTime) ||
    typeof value.isClosed !== 'boolean'
  ) {
    throw new Error('Dữ liệu giờ mở cửa không hợp lệ.');
  }
  return value as unknown as PoiOpeningHour;
}

function parsePhoto(value: unknown): PoiPhoto {
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' ||
    typeof value.url !== 'string' ||
    !isNullableString(value.caption) ||
    typeof value.sortOrder !== 'number'
  ) {
    throw new Error('Dữ liệu hình ảnh địa điểm không hợp lệ.');
  }
  return value as unknown as PoiPhoto;
}

function parseTag(value: unknown): PoiTag {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    throw new Error('Dữ liệu thẻ địa điểm không hợp lệ.');
  }
  return value as unknown as PoiTag;
}

export function parsePoiDetail(value: unknown): PoiDetail {
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' ||
    typeof value.name !== 'string' ||
    typeof value.description !== 'string' ||
    typeof value.status !== 'string' ||
    typeof value.categoryId !== 'number' ||
    typeof value.categoryName !== 'string' ||
    typeof value.latitude !== 'number' ||
    typeof value.longitude !== 'number' ||
    !isNullableString(value.address) ||
    typeof value.indoorOutdoor !== 'string' ||
    typeof value.averageVisitDurationMinutes !== 'number' ||
    typeof value.hasShelter !== 'boolean' ||
    !isNullableNumber(value.scenicScore) ||
    !isNullableNumber(value.photoRating) ||
    !isNullableNumber(value.averageRating) ||
    typeof value.reviewCount !== 'number' ||
    typeof value.isOpenNow !== 'boolean' ||
    !Array.isArray(value.openingHours) ||
    !Array.isArray(value.photos) ||
    !Array.isArray(value.tags) ||
    typeof value.createdAtUtc !== 'string' ||
    typeof value.updatedAtUtc !== 'string'
  ) {
    throw new Error('Dữ liệu địa điểm không hợp lệ.');
  }

  return {
    id: value.id,
    name: value.name,
    description: value.description,
    status: value.status,
    categoryId: value.categoryId,
    categoryName: value.categoryName,
    latitude: value.latitude,
    longitude: value.longitude,
    address: value.address,
    indoorOutdoor: value.indoorOutdoor,
    averageVisitDurationMinutes: value.averageVisitDurationMinutes,
    hasShelter: value.hasShelter,
    scenicScore: value.scenicScore,
    photoRating: value.photoRating,
    averageRating: value.averageRating,
    reviewCount: value.reviewCount,
    isOpenNow: value.isOpenNow,
    openingHours: value.openingHours.map(parseOpeningHour),
    photos: value.photos.map(parsePhoto),
    tags: value.tags.map(parseTag),
    createdAtUtc: value.createdAtUtc,
    updatedAtUtc: value.updatedAtUtc,
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
    throw new PoiApiError('Không thể kết nối máy chủ khám phá.', 0);
  }

  const body = await readResponse(response);
  if (!response.ok) {
    const problem = asProblem(body);
    throw new PoiApiError(
      problem?.title ?? 'Không thể tải dữ liệu địa điểm.',
      response.status,
      problem,
    );
  }
  return body;
}

export async function fetchPois(query: URLSearchParams, signal?: AbortSignal): Promise<PagedPois> {
  return parsePagedPois(await requestJson(`/api/pois?${query.toString()}`, signal));
}

export async function fetchPoiDetail(id: string, signal?: AbortSignal): Promise<PoiDetail> {
  return parsePoiDetail(await requestJson(`/api/pois/${encodeURIComponent(id)}`, signal));
}
