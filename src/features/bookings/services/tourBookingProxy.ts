import 'server-only';

import { cookies } from 'next/headers';

import { isSameOriginRequest } from '@/lib/server/sameOrigin';
import { fetchBackend } from '@/lib/server/backend';

const REFRESH_COOKIE = 'tripmate_refresh';
const MAX_REQUEST_BYTES = 64 * 1024;

/**
 * UC-27 safe error codes, mirrored from Capstone_BE/specs/UC-27-book-tour-be-spec.md §7.
 * Any Backend errorCode outside this allowlist is reported as the generic MSG127 so the
 * client never renders a raw, unreviewed server message.
 */
const SAFE_CODES = new Set([
  'tour_booking.schedule_not_found',
  'tour_booking.schedule_not_open',
  'tour_booking.insufficient_capacity',
  'tour_booking.voucher_not_found',
  'tour_booking.voucher_not_eligible',
  'tour_booking.voucher_minimum_not_met',
  'tour_booking.voucher_usage_limit_reached',
  'tour_booking.participants_required',
  'tour_booking.idempotency_key_required',
  'tour_booking.idempotency_key_payload_mismatch',
  'tour_booking.too_many_unpaid_bookings',
]);

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

async function travelerAccessToken(signal: AbortSignal): Promise<{ token: string } | { status: number }> {
  const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refresh) return { status: 401 };
  const response = await fetchBackend('/api/v1/auth/web/refresh', {
    method: 'POST',
    headers: { Cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refresh)}` },
    signal,
  });
  if (!response.ok) return { status: 401 };
  const body: unknown = await response.json().catch(() => null);
  const data = body && typeof body === 'object' && 'data' in body ? body.data : null;
  if (!data || typeof data !== 'object') return { status: 401 };
  if (!('role' in data) || data.role !== 'Traveler') return { status: 403 };
  if (!('accessToken' in data) || typeof data.accessToken !== 'string' || !data.accessToken)
    return { status: 401 };
  return { token: data.accessToken };
}

function safeFailure(status: number, body: unknown): Response {
  if (status === 401) return json({ errorCode: 'UNAUTHENTICATED' }, 401);
  if (status === 403) return json({ errorCode: 'FORBIDDEN' }, 403);
  const source = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const code =
    typeof source.errorCode === 'string' && SAFE_CODES.has(source.errorCode)
      ? source.errorCode
      : status === 400
        ? 'tour_booking.invalid_request'
        : status === 409
          ? 'tour_booking.idempotency_key_payload_mismatch'
          : 'MSG127';
  const mappedStatus = status === 400 || status === 404 || status === 409 || status === 422 ? status : 503;
  return json({ errorCode: code }, mappedStatus);
}

async function boundedJsonBody(request: Request): Promise<unknown | Response> {
  const length = request.headers.get('content-length');
  if (length !== null && Number(length) > MAX_REQUEST_BYTES)
    return safeFailure(400, { errorCode: 'tour_booking.invalid_request' });
  const text = await request.text();
  if (text.length > MAX_REQUEST_BYTES) return safeFailure(400, { errorCode: 'tour_booking.invalid_request' });
  try {
    return text.length === 0 ? {} : JSON.parse(text);
  } catch {
    return safeFailure(400, { errorCode: 'tour_booking.invalid_request' });
  }
}

/** Server-only BFF proxy for POST /api/v1/traveler/tour-bookings/quote (read-only; never reserves capacity). */
export async function proxyQuoteTourBooking(request: Request): Promise<Response> {
  try {
    const auth = await travelerAccessToken(request.signal);
    if ('status' in auth) return safeFailure(auth.status, null);
    const body = await boundedJsonBody(request);
    if (body instanceof Response) return body;

    const upstream = await fetchBackend('/api/v1/traveler/tour-bookings/quote', {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: request.signal,
    });
    const result: unknown = await upstream.json().catch(() => null);
    if (!upstream.ok) return safeFailure(upstream.status, result);
    if (!result || typeof result !== 'object') return safeFailure(503, null);
    return json(result, 200);
  } catch {
    return safeFailure(503, null);
  }
}

/**
 * Server-only BFF proxy for POST /api/v1/traveler/tour-bookings (atomic, idempotent create).
 * Requires the browser's own Idempotency-Key header and forwards it unchanged, so a client
 * retry of the same request reaches the Backend with the same key instead of minting a new one.
 */
export async function proxyCreateTourBooking(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) return safeFailure(403, null);
  const idempotencyKey = request.headers.get('idempotency-key');
  if (!idempotencyKey) return safeFailure(400, { errorCode: 'tour_booking.idempotency_key_required' });

  try {
    const auth = await travelerAccessToken(request.signal);
    if ('status' in auth) return safeFailure(auth.status, null);
    const body = await boundedJsonBody(request);
    if (body instanceof Response) return body;

    const upstream = await fetchBackend('/api/v1/traveler/tour-bookings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(body),
      signal: request.signal,
    });
    const result: unknown = await upstream.json().catch(() => null);
    if (!upstream.ok) return safeFailure(upstream.status, result);
    if (!result || typeof result !== 'object') return safeFailure(503, null);
    return json(result, upstream.status);
  } catch {
    return safeFailure(503, null);
  }
}
