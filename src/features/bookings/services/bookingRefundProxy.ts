import 'server-only';

import { cookies } from 'next/headers';

import { fetchBackend } from '@/lib/server/backend';

const REFRESH_COOKIE = 'tripmate_refresh';

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

/**
 * Unlike tourBookingProxy.ts's travelerAccessToken (Traveler-only), this proxy
 * serves UC-42/UC-71 refund status to both roles the Backend itself authorizes
 * for GET /api/v1/bookings/{id}/refund: Traveler and TourOperator.
 */
async function refundViewerAccessToken(signal: AbortSignal): Promise<{ token: string } | { status: number }> {
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
  if (!('role' in data) || (data.role !== 'Traveler' && data.role !== 'TourOperator')) return { status: 403 };
  if (!('accessToken' in data) || typeof data.accessToken !== 'string' || !data.accessToken)
    return { status: 401 };
  return { token: data.accessToken };
}

function safeFailure(status: number, body: unknown): Response {
  if (status === 401) return json({ errorCode: 'UNAUTHENTICATED' }, 401);
  if (status === 403) return json({ errorCode: 'REFUND_STATUS_FORBIDDEN' }, 403);
  if (status === 404) {
    const source = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    return json({ errorCode: source.errorCode ?? 'booking.cancellation.not_found' }, 404);
  }
  return json({ errorCode: 'MSG127' }, 503);
}

/** Server-only BFF proxy for GET /api/v1/bookings/{id}/refund (read-only). */
export async function proxyGetBookingRefundStatus(request: Request, bookingId: string): Promise<Response> {
  try {
    const auth = await refundViewerAccessToken(request.signal);
    if ('status' in auth) return safeFailure(auth.status, null);

    const upstream = await fetchBackend(`/api/v1/bookings/${bookingId}/refund`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${auth.token}` },
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
