/**
 * The traveler's "Yêu thích" mark on a place (UC-10 feedback, §3.2). Signed-in Travelers only:
 * the API answers 401 without a token and 403 for other roles.
 */

import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase } from '@/lib/apiBase';
import { requestJson } from '@/lib/jsonRequest';
import { isBoolean, isFiniteNumber, isRecord } from '@/lib/typeGuards';

export interface PoiFavoriteDto {
  poiId: number;
  isFavorite: boolean;
}

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

function isFavorite(value: unknown): value is PoiFavoriteDto {
  return isRecord(value) && isFiniteNumber(value.poiId) && isBoolean(value.isFavorite);
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
