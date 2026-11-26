/**
 * The traveler's "Yêu thích" mark on a place (UC-10 feedback, §3.2). Signed-in Travelers only:
 * the API answers 401 without a token and 403 for other roles.
 */

import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase } from '@/lib/apiBase';
import { requestJson } from '@/lib/jsonRequest';
import { isBoolean, isFiniteNumber, isRecord, isString } from '@/lib/typeGuards';

export interface PoiFavoriteDto {
  poiId: number;
  isFavorite: boolean;
}

export interface FavoritePoiItem {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  latitude: number;
  longitude: number;
  address: string | null;
  indoorOutdoor: string;
  averageVisitDurationMinutes: number;
  hasShelter: boolean;
  averageRating: number | null;
  reviewCount: number;
  thumbnailUrl: string | null;
  isOpenNow: boolean;
  favoritedAtUtc: string;
}

export interface PagedFavoritePois {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: FavoritePoiItem[];
}

export const DEFAULT_FAVORITE_POIS_PAGE_SIZE = 12;

/** `status` is the HTTP status, 0 when the server could not be reached, 502 for an unexpected body. */
export class PoiFavoriteError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'PoiFavoriteError';
  }
}

interface RequestOptions {
  accessToken?: string;
  signal?: AbortSignal;
}

export interface ListFavoritePoisOptions extends RequestOptions {
  page?: number;
  pageSize?: number;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value);
}

function isFavorite(value: unknown): value is PoiFavoriteDto {
  return isRecord(value) && isFiniteNumber(value.poiId) && isBoolean(value.isFavorite);
}

function isFavoritePoiItem(value: unknown): value is FavoritePoiItem {
  return (
    isRecord(value) &&
    isFiniteNumber(value.id) &&
    isString(value.name) &&
    isFiniteNumber(value.categoryId) &&
    isString(value.categoryName) &&
    isFiniteNumber(value.latitude) &&
    isFiniteNumber(value.longitude) &&
    isNullableString(value.address) &&
    isString(value.indoorOutdoor) &&
    isFiniteNumber(value.averageVisitDurationMinutes) &&
    isBoolean(value.hasShelter) &&
    isNullableNumber(value.averageRating) &&
    isFiniteNumber(value.reviewCount) &&
    isNullableString(value.thumbnailUrl) &&
    isBoolean(value.isOpenNow) &&
    isString(value.favoritedAtUtc)
  );
}

function isPagedFavoritePois(value: unknown): value is PagedFavoritePois {
  return (
    isRecord(value) &&
    isFiniteNumber(value.page) &&
    isFiniteNumber(value.pageSize) &&
    isFiniteNumber(value.totalCount) &&
    isFiniteNumber(value.totalPages) &&
    Array.isArray(value.items) &&
    value.items.every(isFavoritePoiItem)
  );
}

async function request(
  poiId: number,
  method: 'GET' | 'PUT' | 'DELETE',
  options?: RequestOptions,
): Promise<PoiFavoriteDto> {
  const { status, body } = await requestJson(`${getApiBase()}/pois/${poiId}/favorite`, {
    method,
    accessToken: options?.accessToken ?? AuthStorage.getContext()?.accessToken,
    signal: options?.signal,
    networkError: () => new PoiFavoriteError('Không thể kết nối máy chủ TripMate.', 0),
  });
  if (status !== 200) {
    throw new PoiFavoriteError('Không thực hiện được thao tác yêu thích lúc này.', status);
  }
  if (!isFavorite(body)) {
    throw new PoiFavoriteError('Dữ liệu yêu thích không hợp lệ.', 502);
  }
  return body;
}

export function getPoiFavorite(poiId: number, options?: RequestOptions): Promise<PoiFavoriteDto> {
  return request(poiId, 'GET', options);
}

/** PUT turns the favorite on, DELETE turns it off; both are idempotent and take no body. */
export function setPoiFavorite(
  poiId: number,
  favorite: boolean,
  options?: RequestOptions,
): Promise<PoiFavoriteDto> {
  return request(poiId, favorite ? 'PUT' : 'DELETE', options);
}

export async function listFavoritePois(
  options?: ListFavoritePoisOptions,
): Promise<PagedFavoritePois> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? DEFAULT_FAVORITE_POIS_PAGE_SIZE;
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  const { status, body } = await requestJson(`${getApiBase()}/pois/favorites?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store',
    accessToken: options?.accessToken ?? AuthStorage.getContext()?.accessToken,
    signal: options?.signal,
    networkError: () => new PoiFavoriteError('Không thể kết nối máy chủ TripMate.', 0),
  });
  if (status !== 200) {
    throw new PoiFavoriteError('Không thể tải danh sách địa điểm yêu thích lúc này.', status);
  }
  if (!isPagedFavoritePois(body)) {
    throw new PoiFavoriteError('Dữ liệu danh sách địa điểm yêu thích không hợp lệ.', 502);
  }
  return body;
}
