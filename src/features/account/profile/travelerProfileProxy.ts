import 'server-only';

import { cookies } from 'next/headers';

import { isSameOriginRequest } from '@/lib/server/sameOrigin';
import { fetchBackend } from '@/lib/server/backend';

const REFRESH_COOKIE = 'tripmate_refresh';
const MAX_REQUEST_BYTES = 6 * 1024 * 1024;
const safeCodes = new Set(['MSG01', 'MSG02', 'MSG04', 'MSG19', 'MSG127', 'MSG_PHONE_DUP',
  'traveler.profile_forbidden', 'traveler.profile_not_found']);

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

async function travelerToken(signal: AbortSignal): Promise<{ token: string } | { status: number }> {
  const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refresh) return { status: 401 };
  const response = await fetchBackend('/api/v1/auth/web/refresh', {
    method: 'POST',
    headers: { Cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refresh)}` },
    signal,
  });
  if (!response.ok) return { status: 401 };
  const body: unknown = await response.json().catch(() => null);
  const data = body && typeof body === 'object' && 'data' in body ? body.data : null;
  if (!data || typeof data !== 'object') return { status: 401 };
  if (!('role' in data) || data.role !== 'Traveler') return { status: 403 };
  if (!('accessToken' in data) || typeof data.accessToken !== 'string' || !data.accessToken)
    return { status: 401 };
  return { token: data.accessToken };
}

function safeFailure(status: number, body: unknown): Response {
  if (status === 401) return json({ errorCode: 'UNAUTHENTICATED' }, 401);
  if (status === 403) return json({ errorCode: 'FORBIDDEN' }, 403);
  if (status === 404) return json({ errorCode: 'traveler.profile_not_found' }, 404);
  const source = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  if (status === 409 && source.errorCode === 'MSG_PHONE_DUP')
    return json({ errorCode: 'MSG_PHONE_DUP' }, 409);
  const code = typeof source.errorCode === 'string' && safeCodes.has(source.errorCode)
    ? source.errorCode : status === 400 ? 'MSG02' : 'MSG127';
  return json({ errorCode: code }, status === 400 ? 400 : 503);
}

async function boundedMultipart(request: Request): Promise<FormData | Response> {
  if (!request.body) return safeFailure(400, { errorCode: 'MSG02' });
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_REQUEST_BYTES) {
      await reader.cancel();
      return safeFailure(400, { errorCode: 'MSG19' });
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return await new Request(request.url, {
      method: 'PUT',
      headers: { 'Content-Type': request.headers.get('content-type') ?? '' },
      body: bytes,
    }).formData();
  } catch {
    return safeFailure(400, { errorCode: 'MSG02' });
  }
}

export async function proxyTravelerProfile(request: Request): Promise<Response> {
  if (request.method === 'PUT') {
    if (!isSameOriginRequest(request)) return safeFailure(403, null);
    const length = request.headers.get('content-length');
    if (length !== null && Number(length) > MAX_REQUEST_BYTES)
      return safeFailure(400, { errorCode: 'MSG19' });
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('multipart/form-data'))
      return safeFailure(400, { errorCode: 'MSG02' });
  }
  try {
    const auth = await travelerToken(request.signal);
    if ('status' in auth) return safeFailure(auth.status, null);
    let body: FormData | undefined;
    if (request.method === 'PUT') {
      const parsed = await boundedMultipart(request);
      if (parsed instanceof Response) return parsed;
      body = parsed;
      const avatar = body.get('avatar');
      if (avatar instanceof File && (avatar.size > 5 * 1024 * 1024 || avatar.size === 0))
        return safeFailure(400, { errorCode: 'MSG19' });
    }
    const upstream = await fetchBackend('/api/v1/traveler/profile', {
      method: request.method,
      headers: { Authorization: `Bearer ${auth.token}` },
      body,
      signal: request.signal,
    });
    const result: unknown = await upstream.json().catch(() => null);
    if (!upstream.ok) return safeFailure(upstream.status, result);
    if (!result || typeof result !== 'object') return safeFailure(503, null);
    return json(result, upstream.status);
  } catch {
    return safeFailure(503, null);
  }
}
