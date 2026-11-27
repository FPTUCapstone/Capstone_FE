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

const CASE_ID_RE = /^[1-9]\d*$/;
const LIST_QUERY_FIELDS = ['status', 'pageNumber', 'pageSize'] as const;

/** Private file bytes must stay behind the same Admin session as the case. */
export async function proxyAdminDownloadDirectRefundEvidence(request: Request, caseId: string, evidenceId: string): Promise<Response> {
  if (![caseId, evidenceId].every(id => CASE_ID_RE.test(id) && Number.isSafeInteger(Number(id))))
    return jsonNoStore({ title: 'Invalid evidence ID.' }, 400);
  const session = await requireAdminSession();
  if (!session.ok) return session.response;
  const download = new URL(request.url).searchParams.get('download') === '1';
  try {
    const upstream = await fetchBackend(`/api/v1/admin/direct-refund-disputes/${encodeURIComponent(caseId)}/evidence/${encodeURIComponent(evidenceId)}${download ? '?download=true' : ''}`, {
      headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/pdf,image/png,image/jpeg' },
      signal: request.signal,
    });
    if (!upstream.ok) {
      if (upstream.status === 401) return clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401));
      return jsonNoStore({ title: upstream.status === 404 ? 'Không tìm thấy bằng chứng.' : 'Chưa thể tải bằng chứng. Vui lòng thử lại.' }, [403, 404].includes(upstream.status) ? upstream.status : 503);
    }
    const contentType = upstream.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
    if (!contentType || !['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(contentType))
      return jsonNoStore({ title: 'Unsupported evidence format.' }, 502);
    const bytes = await upstream.arrayBuffer();
    if (bytes.byteLength === 0 || bytes.byteLength > 5 * 1024 * 1024)
      return jsonNoStore({ title: 'Invalid evidence file.' }, 502);
    return new Response(bytes, { headers: {
      'Content-Type': contentType,
      'Content-Disposition': upstream.headers.get('Content-Disposition') ?? (download ? 'attachment' : 'inline'),
      'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "sandbox; default-src 'none'",
    } });
  } catch {
    return jsonNoStore({ title: 'Chưa thể tải bằng chứng. Vui lòng thử lại.' }, 503);
  }
}

type SessionCheck = { ok: true; token: string } | { ok: false; response: Response };

/** Admin-only — Staff may not resolve disputes. */
async function requireAdminSession(): Promise<SessionCheck> {
  const store = await cookies();
  const token = store.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  const session = token ? verifyAdminSessionFromCookies(store) : null;
  if (!token || !session) {
    return { ok: false, response: clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401)) };
  }
  if (session.role !== 'Administrator') {
    return { ok: false, response: jsonNoStore({ title: 'Administrator access required.' }, 403) };
  }
  return { ok: true, token };
}

function safeProblem(value: unknown, fallback: string): { title: string; errorCode?: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return { title: fallback };
  const body = value as Record<string, unknown>;
  const title = typeof body.title === 'string' && body.title.length <= 500 ? body.title : fallback;
  const errorCode =
    typeof body.errorCode === 'string' && /^[a-z0-9._-]{1,100}$/i.test(body.errorCode)
      ? body.errorCode
      : undefined;
  return errorCode ? { title, errorCode } : { title };
}

async function forward(
  backendPath: string,
  token: string,
  init: { method: string; body?: string; signal?: AbortSignal },
): Promise<Response> {
  try {
    const upstream = await fetchBackend(backendPath, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.body,
      signal: init.signal,
    });
    if (upstream.status >= 500) return jsonNoStore({ title: 'Direct refund service is temporarily unavailable.' }, 503);
    if (upstream.status === 401) return clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401));
    if (upstream.status === 403) return jsonNoStore({ title: 'Administrator access required.' }, 403);
    if (upstream.status === 204) return new Response(null, { status: 204 });
    const body: unknown = await upstream.json().catch(() => null);
    if (body === null) return jsonNoStore({ title: 'The service returned no data.' }, 503);
    if (upstream.status >= 400) return jsonNoStore(safeProblem(body, 'The request could not be processed.'), upstream.status);
    return jsonNoStore(body, upstream.status);
  } catch {
    return jsonNoStore({ title: 'Direct refund service could not be reached.' }, 503);
  }
}

/** GET /api/v1/admin/direct-refund-disputes — list disputed cases (paginated). */
export async function proxyAdminListDirectRefundDisputes(
  request: Request,
): Promise<Response> {
  const session = await requireAdminSession();
  if (!session.ok) return session.response;

  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of LIST_QUERY_FIELDS) {
    const v = incoming.get(key);
    if (v !== null) query.append(key, v);
  }
  return forward(`/api/v1/admin/direct-refund-disputes?${query}`, session.token, {
    method: 'GET',
    signal: request.signal,
  });
}

/** GET /api/v1/admin/direct-refund-disputes/{caseId} — full case detail with evidence. */
export async function proxyAdminGetDirectRefundDispute(
  request: Request,
  caseId: string,
): Promise<Response> {
  if (!CASE_ID_RE.test(caseId) || !Number.isSafeInteger(Number(caseId)))
    return jsonNoStore({ title: 'Invalid case ID.' }, 400);
  const session = await requireAdminSession();
  if (!session.ok) return session.response;
  return forward(
    `/api/v1/admin/direct-refund-disputes/${encodeURIComponent(caseId)}`,
    session.token,
    { method: 'GET', signal: request.signal },
  );
}

/** POST /api/v1/admin/direct-refund-disputes/{caseId}/resolve
 * Body: { resolution, reason, expectedVersion }
 * resolution: "Completed" | "CorrectionRequired" | "MoreEvidenceRequired"
 */
export async function proxyAdminResolveDirectRefundDispute(
  request: Request,
  caseId: string,
): Promise<Response> {
  if (!CASE_ID_RE.test(caseId) || !Number.isSafeInteger(Number(caseId)))
    return jsonNoStore({ title: 'Invalid case ID.' }, 400);
  if (!isSameOriginRequest(request)) return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);

  const session = await requireAdminSession();
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
  const resolution = typeof rec.resolution === 'string' ? rec.resolution : null;
  const reason = typeof rec.reason === 'string' ? rec.reason.trim() : null;
  const expectedVersion = rec.expectedVersion ?? null;

  if (!resolution) return jsonNoStore({ title: 'resolution is required.' }, 400);
  if (!reason) return jsonNoStore({ title: 'reason is required.' }, 400);

  const payload = { resolution, reason, expectedVersion };
  return forward(
    `/api/v1/admin/direct-refund-disputes/${encodeURIComponent(caseId)}/resolve`,
    session.token,
    { method: 'POST', body: JSON.stringify(payload), signal: request.signal },
  );
}
