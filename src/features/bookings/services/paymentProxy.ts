import 'server-only';

import { cookies } from 'next/headers';

import { isSameOriginRequest } from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';

const REFRESH_COOKIE = 'tripmate_refresh';
const MAX_REQUEST_BYTES = 64 * 1024;

const SAFE_CODES = new Set([
  'PAYMENT_BOOKING_NOT_ELIGIBLE',
  'PAYMENT_BOOKING_EXPIRED',
  'PAYMENT_NOT_FOUND',
  'PAYMENT_MOCK_DISABLED',
  'PAYMENT_GATEWAY_UNAVAILABLE',
  'PAYMENT_CALLBACK_INVALID',
  'UNAUTHENTICATED',
  'FORBIDDEN',
]);

function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

async function travelerAccessToken(
  signal: AbortSignal,
): Promise<{ token: string } | { status: number }> {
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
  if (!('accessToken' in data) || typeof data.accessToken !== 'string' || !data.accessToken) {
    return { status: 401 };
  }
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
        ? 'PAYMENT_BOOKING_NOT_ELIGIBLE'
        : status === 404
          ? 'PAYMENT_NOT_FOUND'
          : 'PAYMENT_GATEWAY_UNAVAILABLE';
  const mappedStatus =
    status === 400 || status === 404 || status === 409 || status === 422 ? status : 503;
  return json({ errorCode: code }, mappedStatus);
}

export async function proxyCreateOrReusePayment(
  request: Request,
  bookingId: string,
): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return json({ errorCode: 'FORBIDDEN' }, 403);
  }

  const auth = await travelerAccessToken(request.signal);
  if ('status' in auth) {
    return safeFailure(auth.status, null);
  }

  const id = encodeURIComponent(bookingId);
  const response = await fetchBackend(`/api/v1/traveler/bookings/${id}/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    signal: request.signal,
  });

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    return safeFailure(response.status, body);
  }

  const payload =
    body && typeof body === 'object' && 'data' in body ? (body as { data: unknown }).data : body;
  return json(payload, 200);
}

export async function proxyGetBookingPaymentStatus(
  request: Request,
  bookingId: string,
): Promise<Response> {
  const auth = await travelerAccessToken(request.signal);
  if ('status' in auth) {
    return safeFailure(auth.status, null);
  }

  const id = encodeURIComponent(bookingId);
  const response = await fetchBackend(`/api/v1/traveler/bookings/${id}/payment`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${auth.token}`,
      Accept: 'application/json',
    },
    signal: request.signal,
  });

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    return safeFailure(response.status, body);
  }

  const payload =
    body && typeof body === 'object' && 'data' in body ? (body as { data: unknown }).data : body;
  return json(payload, 200);
}

export async function proxyCompleteMockPayment(
  request: Request,
  paymentId: string,
): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return json({ errorCode: 'FORBIDDEN' }, 403);
  }

  const length = request.headers.get('content-length');
  if (length !== null && Number(length) > MAX_REQUEST_BYTES) {
    return safeFailure(400, { errorCode: 'PAYMENT_CALLBACK_INVALID' });
  }
  const text = await request.text();
  if (text.length > MAX_REQUEST_BYTES) {
    return safeFailure(400, { errorCode: 'PAYMENT_CALLBACK_INVALID' });
  }

  let parsed: unknown = {};
  try {
    parsed = text.length === 0 ? {} : JSON.parse(text);
  } catch {
    return safeFailure(400, { errorCode: 'PAYMENT_CALLBACK_INVALID' });
  }

  const auth = await travelerAccessToken(request.signal);
  if ('status' in auth) {
    return safeFailure(auth.status, null);
  }

  const id = encodeURIComponent(paymentId);
  const response = await fetchBackend(`/api/v1/traveler/payments/${id}/mock-outcome`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(parsed),
    signal: request.signal,
  });

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    return safeFailure(response.status, body);
  }

  const payload =
    body && typeof body === 'object' && 'data' in body ? (body as { data: unknown }).data : body;
  return json(payload, 200);
}
