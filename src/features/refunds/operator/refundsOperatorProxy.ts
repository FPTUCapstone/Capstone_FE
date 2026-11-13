import 'server-only';
import { cookies } from 'next/headers';

import { isSameOriginRequest } from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';

const REFRESH_COOKIE = 'tripmate_refresh';
const NO_STORE = { 'Cache-Control': 'no-store' } as const;
const REFUND_ID_PATTERN = /^\d+$/;

function failure(errorCode: string, status: number): Response {
  return Response.json({ errorCode }, { status, headers: NO_STORE });
}

type TokenCheck = { ok: true; token: string } | { ok: false; response: Response };

/** Exchanges the refresh cookie for a bearer token and verifies the TourOperator role, same
 * pattern as `operatorPayoutProxy.ts` / `operatorBookingProxy.ts`. The browser never sees the
 * backend URL or the bearer token. */
async function requireOperatorToken(request: Request): Promise<TokenCheck> {
  const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refresh) return { ok: false, response: failure('UNAUTHENTICATED', 401) };

  const auth = await fetchBackend('/api/v1/auth/web/refresh', {
    method: 'POST',
    headers: { Cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refresh)}` },
    signal: request.signal,
  });
  const authBody = (await auth.json().catch(() => null)) as { data?: { accessToken?: string; role?: string } } | null;
  const token = authBody?.data?.accessToken;
  if (!auth.ok || !token || authBody?.data?.role !== 'TourOperator') {
    return { ok: false, response: failure('UNAUTHENTICATED', 401) };
  }
  return { ok: true, token };
}

async function forward(backendPath: string, token: string, init: { method: string; body?: string }): Promise<Response> {
  try {
    const upstream = await fetchBackend(backendPath, {
      method: init.method,
      headers: init.body !== undefined ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { Authorization: `Bearer ${token}` },
      body: init.body,
    });
    const body: unknown = await upstream.json().catch(() => null);
    if (body === null) return failure('MSG127', upstream.ok ? 502 : upstream.status);
    return Response.json(body, { status: upstream.status, headers: NO_STORE });
  } catch {
    return failure('MSG127', 503);
  }
}

const LIST_QUERY_FIELDS = ['status', 'pageNumber', 'pageSize'] as const;

/** `GET /api/v1/operator/refunds`: the signed-in Tour Operator's own refund requests. Only the
 * known query fields are forwarded; the backend scopes the result to the operator itself. */
export async function proxyOperatorRefundsList(request: Request): Promise<Response> {
  const session = await requireOperatorToken(request);
  if (!session.ok) return session.response;

  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of LIST_QUERY_FIELDS) {
    const value = incoming.get(key);
    if (value !== null) query.append(key, value);
  }
  return forward(`/api/v1/operator/refunds?${query}`, session.token, { method: 'GET' });
}

/** UC-42 screen 90: `GET /api/v1/operator/refunds/{refundId}`. Tour Operator only. */
export async function proxyOperatorRefundDetail(request: Request, refundId: string): Promise<Response> {
  if (!REFUND_ID_PATTERN.test(refundId)) return failure('INVALID_REFUND_ID', 400);
  const session = await requireOperatorToken(request);
  if (!session.ok) return session.response;
  return forward(`/api/v1/operator/refunds/${refundId}`, session.token, { method: 'GET' });
}

/** UC-42 step 3: `POST /api/v1/operator/refunds/{refundId}/confirm`. No request body — the spec's
 * API contract table is explicit that confirmation carries none, so nothing from the incoming
 * request is ever forwarded. */
export async function proxyOperatorRefundConfirm(request: Request, refundId: string): Promise<Response> {
  if (!REFUND_ID_PATTERN.test(refundId)) return failure('INVALID_REFUND_ID', 400);
  if (!isSameOriginRequest(request)) return failure('FORBIDDEN_ORIGIN', 403);
  const session = await requireOperatorToken(request);
  if (!session.ok) return session.response;
  return forward(`/api/v1/operator/refunds/${refundId}/confirm`, session.token, { method: 'POST' });
}

/** UC-42 step 5: `POST /api/v1/operator/refunds/{refundId}/return`. Forwards only
 * `returnReference` — any other field in the request body is dropped, same discipline as
 * `payoutSettlementsProxy`'s `resolve` action. */
export async function proxyOperatorRefundReturn(request: Request, refundId: string): Promise<Response> {
  if (!REFUND_ID_PATTERN.test(refundId)) return failure('INVALID_REFUND_ID', 400);
  if (!isSameOriginRequest(request)) return failure('FORBIDDEN_ORIGIN', 403);
  const session = await requireOperatorToken(request);
  if (!session.ok) return session.response;

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return failure('INVALID_JSON', 400);
  }
  const returnReference =
    typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>).returnReference
      : undefined;
  const body = JSON.stringify({ returnReference: typeof returnReference === 'string' ? returnReference : null });

  return forward(`/api/v1/operator/refunds/${refundId}/return`, session.token, { method: 'POST', body });
}
