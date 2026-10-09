import 'server-only';

import { cookies } from 'next/headers';

import { fetchBackend } from '@/lib/server/backend';

const REFRESH_COOKIE = 'tripmate_refresh';

function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

async function operatorToken(signal: AbortSignal): Promise<string | null> {
  const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refresh) return null;
  const response = await fetchBackend('/api/v1/auth/web/refresh', {
    method: 'POST',
    headers: { Cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refresh)}` },
    signal,
  });
  if (!response.ok) return null;
  const body: unknown = await response.json().catch(() => null);
  if (!body || typeof body !== 'object' || !('data' in body)) return null;
  const data = body.data;
  if (!data || typeof data !== 'object' || !('accessToken' in data) ||
      typeof data.accessToken !== 'string' || !data.accessToken) return null;
  if (!('role' in data) || data.role !== 'TourOperator') return null;
  return data.accessToken;
}

function safeFailure(status: number, body: unknown): Response {
  const source = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const result: Record<string, unknown> = {};
  if (typeof source.errorCode === 'string') result.errorCode = source.errorCode;
  if (source.errors && typeof source.errors === 'object') result.errors = source.errors;
  if (status === 401) result.errorCode = 'UNAUTHENTICATED';
  if (status === 403) result.errorCode = 'FORBIDDEN';
  if (status >= 500) result.errorCode = 'MSG127';
  return json(result, status >= 500 ? 503 : status);
}

export async function proxyOperatorApplication(request: Request): Promise<Response> {
  try {
    const token = await operatorToken(request.signal);
    if (!token) return safeFailure(401, null);

    let body: FormData | undefined;
    if (request.method === 'PUT') body = await request.formData();
    const upstream = await fetchBackend(
      request.method === 'PUT'
        ? '/api/v1/operator/application/resubmit'
        : '/api/v1/operator/application',
      {
        method: request.method,
        headers: { Authorization: `Bearer ${token}` },
        body,
        signal: request.signal,
      },
    );
    const result: unknown = await upstream.json().catch(() => null);
    if (!upstream.ok) return safeFailure(upstream.status, result);
    if (result === null) return safeFailure(503, null);
    return json(result, upstream.status);
  } catch {
    return safeFailure(503, null);
  }
}

