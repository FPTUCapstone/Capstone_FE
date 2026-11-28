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

const STMT_ID_RE = /^[1-9]\d*$/;

type SessionCheck = { ok: true; token: string } | { ok: false; response: Response };

async function requireAdminSession(allowStaff: boolean): Promise<SessionCheck> {
  const store = await cookies();
  const token = store.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  const session = token ? verifyAdminSessionFromCookies(store) : null;
  if (!token || !session) {
    return { ok: false, response: clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401)) };
  }
  if (session.role !== 'Administrator' && !(allowStaff && session.role === 'Staff')) {
    return { ok: false, response: jsonNoStore({ title: 'Administrator access required.' }, 403) };
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
    if (upstream.status >= 500) return jsonNoStore({ title: 'Commission service temporarily unavailable.' }, 503);
    if (upstream.status === 401) return clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401));
    const body: unknown = await upstream.json().catch(() => null);
    if (body === null) return jsonNoStore({ title: 'The service returned no data.' }, 503);
    if (upstream.status >= 400) return jsonNoStore(body, upstream.status);
    return jsonNoStore(body, upstream.status);
  } catch {
    return jsonNoStore({ title: 'Commission service could not be reached.' }, 503);
  }
}

/** GET /api/v1/admin/commission-statements?pageNumber=&pageSize=&tourOperatorUserId= */
export async function proxyAdminListCommissionStatements(
  request: Request,
): Promise<Response> {
  const session = await requireAdminSession(true);
  if (!session.ok) return session.response;

  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of ['pageNumber', 'pageSize', 'status', 'tourOperatorUserId']) {
    const v = incoming.get(key);
    if (v !== null) query.append(key, v);
  }
  return forward(`/api/v1/admin/commission-statements?${query}`, session.token, {
    method: 'GET',
    signal: request.signal,
  });
}

/** GET /api/v1/admin/commission-statements/{id} */
export async function proxyAdminGetCommissionStatement(
  request: Request,
  id: string,
): Promise<Response> {
  if (!STMT_ID_RE.test(id) || !Number.isSafeInteger(Number(id)))
    return jsonNoStore({ title: 'Invalid statement ID.' }, 400);
  const session = await requireAdminSession(true);
  if (!session.ok) return session.response;
  return forward(
    `/api/v1/admin/commission-statements/${encodeURIComponent(id)}`,
    session.token,
    { method: 'GET', signal: request.signal },
  );
}

/** POST /api/v1/admin/commission-statements — issue a new statement.
 * Body: { tourOperatorUserId, period (YYYY-MM) }
 */
export async function proxyAdminIssueCommissionStatement(
  request: Request,
): Promise<Response> {
  if (!isSameOriginRequest(request)) return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  const session = await requireAdminSession(false);
  if (!session.ok) return session.response;

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return jsonNoStore({ title: 'Invalid JSON.' }, 400);
  }
  const rec =
    typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  const tourOperatorUserId =
    typeof rec.tourOperatorUserId === 'number' ? rec.tourOperatorUserId : null;
  const period = typeof rec.period === 'string' ? rec.period : null;
  if (!tourOperatorUserId || !period)
    return jsonNoStore({ title: 'tourOperatorUserId and period are required.' }, 400);

  return forward('/api/v1/admin/commission-statements', session.token, {
    method: 'POST',
    body: JSON.stringify({ tourOperatorUserId, period }),
    signal: request.signal,
  });
}
