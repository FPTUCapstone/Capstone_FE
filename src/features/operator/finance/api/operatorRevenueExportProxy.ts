import 'server-only';

import { cookies } from 'next/headers';

import { isSameOriginRequest } from '@/lib/server/sameOrigin';
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
  const source = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const result: Record<string, unknown> = {};
  if (typeof source.errorCode === 'string') result.errorCode = source.errorCode;
  if (source.errors && typeof source.errors === 'object') result.errors = source.errors;
  if (status === 401) result.errorCode = 'UNAUTHENTICATED';
  if (status === 403) result.errorCode = 'MSG126';
  if (status >= 500) result.errorCode = 'MSG127';
  return json(result, status >= 500 ? 503 : status);
}

/** POST create (immutable filter snapshot) and GET paginated history — same BE resource. */
export async function proxyRevenueExports(request: Request): Promise<Response> {
  if (request.method === 'POST' && !isSameOriginRequest(request)) return safeFailure(403, null);

  try {
    const token = await operatorToken(request.signal);
    if (!token) return safeFailure(401, null);

    let body: string | undefined;
    if (request.method === 'POST') {
      try {
        body = JSON.stringify(await request.json());
      } catch {
        return safeFailure(400, { errorCode: 'MSG01' });
      }
    }

    const url = new URL(request.url);
    const path = `/api/v1/operator/revenue/exports${request.method === 'GET' ? url.search : ''}`;
    const upstream = await fetchBackend(path, {
      method: request.method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body,
      signal: request.signal,
    });

    const result: unknown = await upstream.json().catch(() => null);
    if (!upstream.ok) return safeFailure(upstream.status, result);
    if (result === null) return safeFailure(503, null);
    return json(result, upstream.status);
  } catch {
    return safeFailure(503, null);
  }
}

/**
 * Fetches the backend's short-lived signed storage URL and streams the file through this
 * origin, so the signed URL itself never reaches the browser (never a bearer/storage URL in
 * client state).
 */
export async function proxyDownloadRevenueExport(request: Request, exportId: string): Promise<Response> {
  try {
    const token = await operatorToken(request.signal);
    if (!token) return safeFailure(401, null);

    if (!/^\d+$/.test(exportId)) return safeFailure(404, { errorCode: 'revenue_export.not_found' });

    const metaResponse = await fetchBackend(`/api/v1/operator/revenue/exports/${exportId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: request.signal,
    });
    const meta: unknown = await metaResponse.json().catch(() => null);
    if (!metaResponse.ok) return safeFailure(metaResponse.status, meta);
    if (!meta || typeof meta !== 'object' || !('downloadUrl' in meta) || !('fileName' in meta) ||
        typeof meta.downloadUrl !== 'string' || typeof meta.fileName !== 'string') {
      return safeFailure(503, null);
    }

    const fileResponse = await fetch(meta.downloadUrl, { signal: request.signal });
    if (!fileResponse.ok || !fileResponse.body) {
      return safeFailure(502, { errorCode: 'MSG106' });
    }

    const safeFileName = meta.fileName.replace(/["\r\n]/g, '');
    return new Response(fileResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch {
    return safeFailure(503, null);
  }
}
