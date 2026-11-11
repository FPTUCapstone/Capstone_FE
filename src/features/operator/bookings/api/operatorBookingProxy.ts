import 'server-only';
import { cookies } from 'next/headers';
import { fetchBackend } from '@/lib/server/backend';

const REFRESH_COOKIE = 'tripmate_refresh';
const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/** The only query keys the browser may pass on to `GET /api/v1/operator/bookings`. */
const FORWARDED_QUERY_KEYS = [
  'tourId',
  'scheduleId',
  'status',
  'paymentStatus',
  'departureFrom',
  'departureTo',
  'keyword',
  'pageNumber',
  'pageSize',
] as const;

/** Booking ids are positive integers; anything else never reaches the backend path. */
const BOOKING_ID_PATTERN = /^\d+$/;

function failure(errorCode: string, status: number): Response {
  return Response.json({ errorCode }, { status, headers: NO_STORE });
}

/**
 * BFF proxy for the UC-40 operator booking endpoints. Same boundary as `operatorRevenueProxy`: the refresh
 * cookie is exchanged for a bearer token, the role must be TourOperator, and only then is the backend called.
 * The browser never sees the backend URL or the bearer token. Read-only (GET) by design.
 *
 * - `bookingId` undefined: the list (`GET /api/v1/operator/bookings`), forwarding whitelisted query keys.
 * - `bookingId` set: the detail (`GET /api/v1/operator/bookings/{bookingId}`), no query.
 */
export async function proxyOperatorBookings(request: Request, bookingId?: string): Promise<Response> {
  if (bookingId !== undefined && !BOOKING_ID_PATTERN.test(bookingId)) {
    return failure('INVALID_BOOKING_ID', 400);
  }

  try {
    const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
    if (!refresh) return failure('UNAUTHENTICATED', 401);

    const auth = await fetchBackend('/api/v1/auth/web/refresh', {
      method: 'POST',
      headers: { Cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refresh)}` },
      signal: request.signal,
    });
    const authBody = (await auth.json().catch(() => null)) as
      | { data?: { accessToken?: string; role?: string } }
      | null;
    const token = authBody?.data?.accessToken;
    if (!auth.ok || !token || authBody?.data?.role !== 'TourOperator') {
      return failure('UNAUTHENTICATED', 401);
    }

    let path = '/api/v1/operator/bookings';
    if (bookingId !== undefined) {
      path = `${path}/${bookingId}`;
    } else {
      const incoming = new URL(request.url).searchParams;
      const forwarded = new URLSearchParams();
      for (const key of FORWARDED_QUERY_KEYS) {
        const value = incoming.get(key);
        if (value) forwarded.set(key, value);
      }
      const query = forwarded.toString();
      if (query) path = `${path}?${query}`;
    }

    const upstream = await fetchBackend(path, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: request.signal,
    });
    const body = await upstream.json().catch(() => null);
    if (body === null) {
      // A body that is not JSON is never passed through: success without a body is a bad gateway.
      return failure('MSG127', upstream.ok ? 502 : upstream.status);
    }
    return Response.json(body, { status: upstream.status, headers: NO_STORE });
  } catch {
    return failure('MSG127', 503);
  }
}
