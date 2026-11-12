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

const canonicalPositiveInteger = /^[1-9]\d*$/;

export function parseBatchId(value: string): number | null {
  if (!canonicalPositiveInteger.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function safeProblem(value: unknown, fallback: string): { title: string; errorCode?: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return { title: fallback };
  const body = value as Record<string, unknown>;
  const title = typeof body.title === 'string' && body.title.length <= 500 ? body.title : fallback;
  const errorCode = typeof body.errorCode === 'string' && /^[a-z0-9._-]{1,100}$/i.test(body.errorCode) ? body.errorCode : undefined;
  return errorCode ? { title, errorCode } : { title };
}

type SessionCheck = { ok: true; token: string } | { ok: false; response: Response };

/** `allowStaff` true for UC-72's list (Staff or Administrator); false for UC-73's detail and
 * every action (Administrator only). */
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

async function forward(backendPath: string, token: string, init: { method: string; body?: string }): Promise<Response> {
  try {
    const upstream = await fetchBackend(backendPath, {
      method: init.method,
      headers: init.body !== undefined ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { Authorization: `Bearer ${token}` },
      body: init.body,
    });
    if (upstream.status >= 500) return jsonNoStore({ title: 'The payout settlement service is temporarily unavailable.' }, 503);
    if (upstream.status === 401) return clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401));
    if (upstream.status === 403) return jsonNoStore({ title: 'Administrator access is not allowed.' }, 403);
    const body: unknown = await upstream.json().catch(() => null);
    if (body === null) return jsonNoStore({ title: 'The payout settlement service returned no data.' }, 503);
    if (upstream.status >= 400) return jsonNoStore(safeProblem(body, 'The payout settlement request could not be processed.'), upstream.status);
    return jsonNoStore(body, upstream.status);
  } catch {
    return jsonNoStore({ title: 'The payout settlement service could not be reached.' }, 503);
  }
}

const LIST_QUERY_FIELDS = ['status', 'runDateFrom', 'runDateTo', 'pageNumber', 'pageSize'] as const;

/** UC-72: `GET /admin/payout-settlements`. Staff or Administrator. */
export async function proxyPayoutSettlementsList(request: Request): Promise<Response> {
  const session = await requireSession(true);
  if (!session.ok) return session.response;

  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of LIST_QUERY_FIELDS) {
    const value = incoming.get(key);
    if (value !== null) query.set(key, value);
  }
  return forward(`/api/v1/admin/payout-settlements?${query}`, session.token, { method: 'GET' });
}

/** UC-73: `GET /admin/payout-settlements/{batchId}`. Administrator only. */
export async function proxyFailedPayoutBatchDetail(_request: Request, batchId: string): Promise<Response> {
  if (parseBatchId(batchId) === null) return jsonNoStore({ title: 'A valid payout batch ID is required.' }, 400);
  const session = await requireSession(false);
  if (!session.ok) return session.response;
  return forward(`/api/v1/admin/payout-settlements/${batchId}`, session.token, { method: 'GET' });
}

export type PayoutBatchAction = 'retry' | 'resolve';

/** UC-73's two mutually-exclusive actions on a failed batch (v2: `carry-over` and
 * `manual-settlement` removed, `resolve` added). Administrator only; each is a same-origin
 * POST. `resolve` forwards only `reason` from the request body — every other field, including a
 * client-supplied `batchId` or `status`, is dropped. */
export async function proxyPayoutBatchAction(request: Request, batchId: string, action: PayoutBatchAction): Promise<Response> {
  if (parseBatchId(batchId) === null) return jsonNoStore({ title: 'A valid payout batch ID is required.' }, 400);
  if (!isSameOriginRequest(request)) return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  const session = await requireSession(false);
  if (!session.ok) return session.response;

  let body: string | undefined;
  if (action === 'resolve') {
    let parsed: unknown;
    try {
      parsed = await request.json();
    } catch {
      return jsonNoStore({ title: 'Invalid JSON.' }, 400);
    }
    const reason =
      typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? (parsed as Record<string, unknown>).reason : undefined;
    body = JSON.stringify({ reason: typeof reason === 'string' ? reason : null });
  }

  return forward(`/api/v1/admin/payout-settlements/${batchId}/${action}`, session.token, { method: 'POST', body });
}
