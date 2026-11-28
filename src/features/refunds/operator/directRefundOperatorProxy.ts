import 'server-only';
import { cookies } from 'next/headers';

import { isSameOriginRequest } from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';

const REFRESH_COOKIE = 'tripmate_refresh';
const NO_STORE = { 'Cache-Control': 'no-store' } as const;
const CASE_ID_RE = /^[1-9]\d*$/;

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
      headers:
        init.body !== undefined
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

/** GET /api/v1/operator/direct-refunds/{caseId} */
export async function proxyOperatorListDirectRefundCases(request: Request): Promise<Response> {
  const session = await requireOperatorToken(request);
  if (!session.ok) return session.response;
  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of ['pageNumber', 'pageSize', 'status']) {
    const value = incoming.get(key);
    if (value !== null) query.set(key, value);
  }
  return forward(`/api/v1/operator/direct-refunds?${query}`, session.token, { method: 'GET', signal: request.signal });
}

/** GET /api/v1/operator/direct-refunds/{caseId} */
export async function proxyOperatorGetDirectRefundCase(
  request: Request,
  caseId: string,
): Promise<Response> {
  if (!CASE_ID_RE.test(caseId) || !Number.isSafeInteger(Number(caseId)))
    return failure('NOT_FOUND', 404);
  const session = await requireOperatorToken(request);
  if (!session.ok) return session.response;
  return forward(
    `/api/v1/operator/direct-refunds/${encodeURIComponent(caseId)}`,
    session.token,
    { method: 'GET', signal: request.signal },
  );
}

/** POST /api/v1/operator/direct-refunds/{caseId}/evidence  (multipart — forwarded as-is) */
export async function proxyOperatorUploadDirectRefundEvidence(
  request: Request,
  caseId: string,
): Promise<Response> {
  if (!CASE_ID_RE.test(caseId) || !Number.isSafeInteger(Number(caseId)))
    return failure('NOT_FOUND', 404);
  if (!isSameOriginRequest(request)) return failure('FORBIDDEN_ORIGIN', 403);

  const session = await requireOperatorToken(request);
  if (!session.ok) return session.response;

  // Forward multipart body as-is; DO NOT set Content-Type (fetch will set boundary)
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return failure('INVALID_REQUEST', 400);
  }

  try {
    const upstream = await fetchBackend(
      `/api/v1/operator/direct-refunds/${encodeURIComponent(caseId)}/evidence`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/json' },
        body: formData,
        signal: request.signal,
      },
    );
    const body: unknown = await upstream.json().catch(() => null);
    if (body === null) return failure('SERVICE_UNAVAILABLE', 502);
    return Response.json(body, { status: upstream.status, headers: NO_STORE });
  } catch {
    return failure('SERVICE_UNAVAILABLE', 503);
  }
}

/** POST /api/v1/operator/direct-refunds/{caseId}/transfers
 * Body: { reportedAmountVnd, bankReference, actualTransferredAtUtc, evidenceIds, expectedVersion }
 */
export async function proxyOperatorReportDirectRefundTransfer(
  request: Request,
  caseId: string,
): Promise<Response> {
  if (!CASE_ID_RE.test(caseId) || !Number.isSafeInteger(Number(caseId)))
    return failure('NOT_FOUND', 404);
  if (!isSameOriginRequest(request)) return failure('FORBIDDEN_ORIGIN', 403);

  const session = await requireOperatorToken(request);
  if (!session.ok) return session.response;

  let reqBody: unknown;
  try {
    reqBody = await request.json();
  } catch {
    return failure('INVALID_REQUEST', 400);
  }

  return forward(
    `/api/v1/operator/direct-refunds/${encodeURIComponent(caseId)}/transfers`,
    session.token,
    { method: 'POST', body: JSON.stringify(reqBody), signal: request.signal },
  );
}
