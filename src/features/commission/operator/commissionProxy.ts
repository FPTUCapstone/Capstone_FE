import 'server-only';
import { cookies } from 'next/headers';

import { isSameOriginRequest } from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';

const REFRESH_COOKIE = 'tripmate_refresh';
const NO_STORE = { 'Cache-Control': 'no-store' } as const;
const STMT_ID_RE = /^[1-9]\d*$/;

function failure(errorCode: string, status: number): Response {
  return Response.json({ errorCode }, { status, headers: NO_STORE });
}

type TokenCheck = { ok: true; token: string } | { ok: false; response: Response };

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

async function forward(
  backendPath: string,
  token: string,
  init: { method: string; body?: string; signal?: AbortSignal },
): Promise<Response> {
  try {
    const upstream = await fetchBackend(backendPath, {
      method: init.method,
      headers: init.body !== undefined
        ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' }
        : { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      body: init.body,
      signal: init.signal,
    });
    const body: unknown = await upstream.json().catch(() => null);
    if (body === null) return failure('SERVICE_UNAVAILABLE', upstream.ok ? 502 : upstream.status);
    return Response.json(body, { status: upstream.status, headers: NO_STORE });
  } catch {
    return failure('SERVICE_UNAVAILABLE', 503);
  }
}

/** GET /api/v1/operator/commission-statements?pageNumber=&pageSize= */
export async function proxyOperatorListCommissionStatements(
  request: Request,
): Promise<Response> {
  const session = await requireOperatorToken(request);
  if (!session.ok) return session.response;

  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of ['pageNumber', 'pageSize', 'status', 'period']) {
    const v = incoming.get(key);
    if (v !== null) query.append(key, v);
  }
  return forward(`/api/v1/operator/commission-statements?${query}`, session.token, {
    method: 'GET',
    signal: request.signal,
  });
}

/** GET /api/v1/operator/commission-statements/{id} */
export async function proxyOperatorGetCommissionStatement(
  request: Request,
  id: string,
): Promise<Response> {
  if (!STMT_ID_RE.test(id) || !Number.isSafeInteger(Number(id)))
    return failure('NOT_FOUND', 404);
  const session = await requireOperatorToken(request);
  if (!session.ok) return session.response;
  return forward(
    `/api/v1/operator/commission-statements/${encodeURIComponent(id)}`,
    session.token,
    { method: 'GET', signal: request.signal },
  );
}

/** POST /api/v1/operator/commission-statements/{id}/payment-link
 * Creates a payOS payment link for the commission invoice.
 */
export async function proxyOperatorCreateCommissionPaymentLink(
  request: Request,
  id: string,
): Promise<Response> {
  if (!STMT_ID_RE.test(id) || !Number.isSafeInteger(Number(id)))
    return failure('NOT_FOUND', 404);
  if (!isSameOriginRequest(request)) return failure('FORBIDDEN_ORIGIN', 403);
  const session = await requireOperatorToken(request);
  if (!session.ok) return session.response;
  return forward(
    `/api/v1/operator/commission-statements/${encodeURIComponent(id)}/payment-link`,
    session.token,
    { method: 'POST', signal: request.signal },
  );
}

export async function proxyOperatorMockCommissionPayment(request: Request, id: string): Promise<Response> {
  if (!STMT_ID_RE.test(id) || !Number.isSafeInteger(Number(id))) return failure('NOT_FOUND', 404);
  if (!isSameOriginRequest(request)) return failure('FORBIDDEN_ORIGIN', 403);
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => key !== 'paymentId') ||
    !('paymentId' in body) || typeof body.paymentId !== 'number' || !Number.isSafeInteger(body.paymentId) || body.paymentId <= 0) return failure('INVALID_PAYMENT', 400);
  const session = await requireOperatorToken(request);
  if (!session.ok) return session.response;
  return forward(`/api/v1/operator/commission-statements/${encodeURIComponent(id)}/mock-complete`, session.token,
    { method: 'POST', body: JSON.stringify({ paymentId: body.paymentId }), signal: request.signal });
}
