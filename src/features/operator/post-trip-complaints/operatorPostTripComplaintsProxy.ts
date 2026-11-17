import 'server-only';
import { cookies } from 'next/headers';
import { isSameOriginRequest } from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';

const REFRESH_COOKIE = 'tripmate_refresh';
const NO_STORE = { 'Cache-Control': 'no-store' } as const;
const idPattern = /^\d+$/;
const actions = new Set(['AcceptFullRefund', 'ProposePartialRefund', 'Reject']);
const failure = (errorCode: string, status: number) => Response.json({ errorCode }, { status, headers: NO_STORE });

async function token(request: Request): Promise<string | Response> {
  const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refresh) return failure('UNAUTHENTICATED', 401);
  try {
    const auth = await fetchBackend('/api/v1/auth/web/refresh', { method: 'POST', headers: { Cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refresh)}` }, signal: request.signal });
    const body = await auth.json().catch(() => null) as { data?: { accessToken?: string; role?: string } } | null;
    const accessToken = body?.data?.accessToken;
    return auth.ok && accessToken && body?.data?.role === 'TourOperator' ? accessToken : failure('UNAUTHENTICATED', 401);
  } catch { return failure('SYSTEM_ERROR', 503); }
}

async function forward(request: Request, path: string, init: RequestInit): Promise<Response> {
  const accessToken = await token(request);
  if (accessToken instanceof Response) return accessToken;
  try {
    const upstream = await fetchBackend(path, { ...init, signal: request.signal, headers: { Authorization: `Bearer ${accessToken}`, ...init.headers } });
    const body = await upstream.json().catch(() => null);
    return Response.json(body ?? { errorCode: 'SYSTEM_ERROR' }, { status: upstream.status, headers: NO_STORE });
  } catch { return failure('SYSTEM_ERROR', 503); }
}

async function forwardDownload(request: Request, path: string): Promise<Response> {
  const accessToken = await token(request);
  if (accessToken instanceof Response) return accessToken;
  try {
    const upstream = await fetchBackend(path, {
      method: 'GET',
      signal: request.signal,
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!upstream.ok) return failure('EVIDENCE_UNAVAILABLE', upstream.status);

    const headers = new Headers({ 'Cache-Control': 'private, no-store' });
    for (const name of ['content-type', 'content-disposition', 'content-length']) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    return failure('SYSTEM_ERROR', 503);
  }
}

export function proxyOperatorComplaintList(request: Request): Promise<Response> {
  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of ['status', 'page', 'pageSize']) { const value = incoming.get(key); if (value) query.set(key, value); }
  return forward(request, `/api/v1/operator/post-trip-complaints?${query}`, { method: 'GET' });
}
export function proxyOperatorComplaintDetail(request: Request, id: string): Promise<Response> {
  return idPattern.test(id) ? forward(request, `/api/v1/operator/post-trip-complaints/${id}`, { method: 'GET' }) : Promise.resolve(failure('INVALID_COMPLAINT_ID', 400));
}
export async function proxyOperatorComplaintResponse(request: Request, id: string): Promise<Response> {
  if (!idPattern.test(id)) return failure('INVALID_COMPLAINT_ID', 400);
  if (!isSameOriginRequest(request)) return failure('FORBIDDEN_ORIGIN', 403);
  const key = request.headers.get('Idempotency-Key');
  if (!key) return failure('INVALID_IDEMPOTENCY_KEY', 400);
  const input = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!input || !actions.has(String(input.action))) return failure('INVALID_ACTION', 400);
  const body = JSON.stringify({
    action: input.action,
    proposedRefundAmount: input.proposedRefundAmount,
    proposalReason: input.proposalReason,
    rejectionReason: input.rejectionReason,
  });
  return forward(request, `/api/v1/operator/post-trip-complaints/${id}/response`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key }, body });
}

export function proxyOperatorComplaintEvidenceDownload(
  request: Request,
  complaintId: string,
  evidenceId: string,
): Promise<Response> {
  if (!idPattern.test(complaintId) || !idPattern.test(evidenceId)) {
    return Promise.resolve(failure('INVALID_EVIDENCE_ID', 400));
  }
  return forwardDownload(
    request,
    `/api/v1/operator/post-trip-complaints/${complaintId}/evidence/${evidenceId}/download`,
  );
}
