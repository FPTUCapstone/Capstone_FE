import 'server-only';

import { cookies } from 'next/headers';

import { fetchBackend } from '@/lib/server/backend';
import { isPositiveInt64 } from '@/features/reviews/types/reviewableRecordId';

import { TRIP_KINDS } from '../types/tripHistoryContract';
import {
  InvalidTripResponseError,
  parseTripDetail,
  parseTripHistoryPage,
} from './tripHistoryResponse';

const REFRESH_COOKIE = 'tripmate_refresh';
const BACKEND_TRIPS_PATH = '/api/v1/traveler/trips';
const MAX_QUERY_VALUE_LENGTH = 32;

/** The only query keys the list endpoint understands (TM-78 contract); anything else is dropped. */
const LIST_QUERY_KEYS = ['tab', 'tripType', 'fromDate', 'toDate', 'page', 'pageSize'] as const;

/**
 * Backend error codes the browser may see. Any other code, and any non-JSON body, is reported as the
 * generic MSG127 so an unreviewed server message never reaches the page.
 */
const SAFE_ERROR_CODES = new Set([
  'trip_history.invalid_tab',
  'trip_history.invalid_trip_type',
  'trip_history.invalid_date_range',
  'trip_history.invalid_paging',
  'trip_history.invalid_record',
  'trip_history.unauthorized',
  'trip_history.forbidden',
  'trip_history.record_not_found',
]);

function answer(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function failure(errorCode: string, status: number): Response {
  return answer({ errorCode }, status);
}

/**
 * Exchanges the HttpOnly refresh cookie for a Traveler access token. The token lives only inside this
 * request; the browser never sees it. (The same exchange exists in the other feature proxies; sharing it
 * is out of scope for this task.)
 */
async function travelerToken(signal: AbortSignal): Promise<string | null> {
  const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refresh) return null;
  const response = await fetchBackend('/api/v1/auth/web/refresh', {
    method: 'POST',
    headers: { Cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refresh)}` },
    signal,
  });
  if (!response.ok) return null;
  const payload: unknown = await response.json().catch(() => null);
  const data = payload && typeof payload === 'object' && 'data' in payload ? payload.data : null;
  if (
    !data ||
    typeof data !== 'object' ||
    !('accessToken' in data) ||
    typeof data.accessToken !== 'string' ||
    !('role' in data) ||
    data.role !== 'Traveler'
  ) {
    return null;
  }
  return data.accessToken;
}

async function upstreamError(upstream: Response): Promise<Response> {
  const payload: unknown = await upstream.json().catch(() => null);
  const source = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const code = typeof source.errorCode === 'string' ? source.errorCode : null;
  if (code && SAFE_ERROR_CODES.has(code)) return failure(code, upstream.status);
  if (upstream.status === 401) return failure('UNAUTHENTICATED', 401);
  if (upstream.status === 403) return failure('FORBIDDEN', 403);
  return failure('MSG127', upstream.status >= 500 ? 503 : upstream.status);
}

async function forward<T>(
  request: Request,
  backendPath: string,
  parseBody: (body: string) => T,
): Promise<Response> {
  try {
    const accessToken = await travelerToken(request.signal);
    if (!accessToken) return failure('UNAUTHENTICATED', 401);
    const upstream = await fetchBackend(backendPath, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: request.signal,
    });
    if (!upstream.ok) return await upstreamError(upstream);
    try {
      return answer(parseBody(await upstream.text()), 200);
    } catch (error) {
      if (error instanceof InvalidTripResponseError) return failure('trip_history.invalid_response', 502);
      throw error;
    }
  } catch {
    return failure('MSG127', 503);
  }
}

/** `GET /api/v1/traveler/trips`: the signed-in Traveler's trips for one tab. */
export async function proxyTripHistoryList(request: Request): Promise<Response> {
  const incoming = new URL(request.url).searchParams;
  const outgoing = new URLSearchParams();
  for (const key of LIST_QUERY_KEYS) {
    const value = incoming.get(key);
    if (value !== null && value.length <= MAX_QUERY_VALUE_LENGTH) outgoing.set(key, value);
  }
  const query = outgoing.toString();
  return forward(request, query ? `${BACKEND_TRIPS_PATH}?${query}` : BACKEND_TRIPS_PATH, parseTripHistoryPage);
}

/** `GET /api/v1/traveler/trips/{kind}/{id}`: one record the Traveler owns. */
export async function proxyTripDetail(request: Request, kind: string, id: string): Promise<Response> {
  if (!(TRIP_KINDS as readonly string[]).includes(kind) || !isPositiveInt64(id)) {
    return failure('trip_history.invalid_record', 400);
  }
  return forward(request, `${BACKEND_TRIPS_PATH}/${kind}/${id}`, parseTripDetail);
}
