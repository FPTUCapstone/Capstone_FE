import 'server-only';
import { cookies } from 'next/headers';

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  clearAdminSession,
  isSameOriginRequest,
  jsonNoStore,
  verifyAdminSessionFromCookies,
} from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';

const REFUND_ID_PATTERN = /^\d+$/;
const LIST_QUERY_FIELDS = ['status', 'pageNumber', 'pageSize'] as const;

export function isValidRefundId(value: string): boolean {
  return REFUND_ID_PATTERN.test(value);
}

type SessionCheck = { ok: true; token: string } | { ok: false; response: Response };

/** `allowStaff` true for the Screen 2 list (Staff or Administrator); false for every action a
 * Staff member may not take (Administrator only), same split as `payoutSettlementsProxy`. */
async function requireSession(allowStaff: boolean): Promise<SessionCheck> {
  const store = await cookies();
  const token = store.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  const session = token ? verifyAdminSessionFromCookies(store) : null;
  if (!token || !session) {
    return { ok: false, response: clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401)) };
  }
  if (session.role !== 'Administrator' && !(allowStaff && session.role === 'Staff')) {
    const title = allowStaff ? 'Staff or Administrator access is required.' : 'Administrator access is not allowed.';
    return { ok: false, response: jsonNoStore({ title }, 403) };
  }
  return { ok: true, token };
}

function safeProblem(value: unknown, fallback: string): { title: string; errorCode?: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return { title: fallback };
  const body = value as Record<string, unknown>;
  const title = typeof body.title === 'string' && body.title.length <= 500 ? body.title : fallback;
  const errorCode = typeof body.errorCode === 'string' && /^[a-z0-9._-]{1,100}$/i.test(body.errorCode) ? body.errorCode : undefined;
  return errorCode ? { title, errorCode } : { title };
}

async function forward(
  backendPath: string,
  token: string,
  init: { method: string; body?: string; headers?: Record<string, string> },
): Promise<Response> {
  try {
    const upstream = await fetchBackend(backendPath, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
      body: init.body,
    });
    if (upstream.status >= 500) return jsonNoStore({ title: 'The refund service is temporarily unavailable.' }, 503);
    if (upstream.status === 401) return clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401));
    if (upstream.status === 403) return jsonNoStore({ title: 'Administrator access is not allowed.' }, 403);
    const body: unknown = await upstream.json().catch(() => null);
    if (body === null) return jsonNoStore({ title: 'The refund service returned no data.' }, 503);
    if (upstream.status >= 400) return jsonNoStore(safeProblem(body, 'The refund request could not be processed.'), upstream.status);
    return jsonNoStore(body, upstream.status);
  } catch {
    return jsonNoStore({ title: 'The refund service could not be reached.' }, 503);
  }
}

/** Screens 2/3: `GET /api/v1/admin/refunds?status=...`. Staff reads `ReturnReported`
 * (Reconciliation screen); Administrator reads `Escalated`/`Reconciliation` (Escalated Monitor) —
 * same endpoint, different `status` query value (Q-FE3, BE spec §3.3). */
export async function proxyAdminRefundsList(request: Request): Promise<Response> {
  const session = await requireSession(true);
  if (!session.ok) return session.response;

  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of LIST_QUERY_FIELDS) {
    for (const value of incoming.getAll(key)) query.append(key, value);
  }
  return forward(`/api/v1/admin/refunds?${query}`, session.token, { method: 'GET' });
}

/** Screen 3's `[View Details]`: `GET /api/v1/admin/refunds/{refundId}`. Administrator only
 * (Staff acts from the list row directly and never opens this detail). */
export async function proxyAdminRefundDetail(request: Request, refundId: string): Promise<Response> {
  if (!isValidRefundId(refundId)) return jsonNoStore({ title: 'A valid refund ID is required.' }, 400);
  const session = await requireSession(false);
  if (!session.ok) return session.response;
  return forward(`/api/v1/admin/refunds/${refundId}`, session.token, { method: 'GET' });
}

/** Screen 2 `[Confirm Receipt]`: `POST /api/v1/admin/refunds/{refundId}/return-received`. Staff
 * or Administrator; no request body (UC-42 step 7 — Staff only confirms receipt, nothing to
 * supply). */
export async function proxyAdminRefundReturnReceived(request: Request, refundId: string): Promise<Response> {
  if (!isValidRefundId(refundId)) return jsonNoStore({ title: 'A valid refund ID is required.' }, 400);
  if (!isSameOriginRequest(request)) return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  const session = await requireSession(true);
  if (!session.ok) return session.response;
  return forward(`/api/v1/admin/refunds/${refundId}/return-received`, session.token, { method: 'POST' });
}

/** Screen 3's manual-completion flow: `POST /api/v1/admin/refunds/{refundId}/resolve`.
 * Administrator only. Forwards only `gatewayReference`, as the backend's `Complete` action; the
 * backend requires an `Idempotency-Key` for it, generated here per submission. */
export async function proxyAdminRefundResolve(request: Request, refundId: string): Promise<Response> {
  if (!isValidRefundId(refundId)) return jsonNoStore({ title: 'A valid refund ID is required.' }, 400);
  if (!isSameOriginRequest(request)) return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  const session = await requireSession(false);
  if (!session.ok) return session.response;

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return jsonNoStore({ title: 'Invalid JSON.' }, 400);
  }
  const gatewayReference =
    typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>).gatewayReference
      : undefined;
  const body = JSON.stringify({
    action: 'Complete',
    gatewayReference: typeof gatewayReference === 'string' ? gatewayReference : null,
  });

  return forward(`/api/v1/admin/refunds/${refundId}/resolve`, session.token, {
    method: 'POST',
    body,
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  });
}
