import 'server-only';

import { cookies } from 'next/headers';
import { isSameOriginRequest } from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';
import type { ReviewableRecordKind } from '../types/canonicalReview';
import { isPositiveInt64 } from '../types/reviewableRecordId';

const MAX_BODY_BYTES = 26_000_000;
const safeErrorCodes = new Set([
  'trip_review.invalid_input', 'trip_review.not_found', 'trip_review.forbidden',
  'trip_review.booking_not_completed', 'trip_review.duplicate', 'trip_review.edit_expired',
  'trip_review.stale_version', 'trip_review.policy_rejected', 'trip_review.policy_unavailable',
  'trip_review.unsupported_subject', 'trip_review.unsupported_media_type',
  'trip_review.body_too_large',
]);

function result(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

async function token(signal: AbortSignal): Promise<string | null> {
  const refresh = (await cookies()).get('tripmate_refresh')?.value;
  if (!refresh) return null;
  const response = await fetchBackend('/api/v1/auth/web/refresh', {
    method: 'POST', headers: { Cookie: `tripmate_refresh=${encodeURIComponent(refresh)}` }, signal,
  });
  if (!response.ok) return null;
  const payload: unknown = await response.json().catch(() => null);
  const data = payload && typeof payload === 'object' && 'data' in payload ? payload.data : null;
  if (!data || typeof data !== 'object' || !('accessToken' in data) ||
      typeof data.accessToken !== 'string' || !('role' in data) || data.role !== 'Traveler') return null;
  return data.accessToken;
}

async function boundedBytes(request: Request): Promise<Uint8Array | null> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

function safeFilename(value: string): string {
  return value.replace(/[\r\n"\\]/g, '_').slice(0, 255) || 'image';
}

async function backendMultipart(form: FormData): Promise<{ body: Blob; contentType: string } | null> {
  const metadata = form.get('metadata');
  const files = form.getAll('files');
  if (typeof metadata !== 'string' || files.some((value) => typeof value === 'string') || files.length > 5 ||
      Array.from(form.keys()).some((key) => key !== 'metadata' && key !== 'files')) return null;
  const boundary = `tripmate-${crypto.randomUUID()}`;
  const parts: BlobPart[] = [
    `--${boundary}\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json; charset=utf-8\r\n\r\n${metadata}\r\n`,
  ];
  for (const value of files) {
    const file = value as File;
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${safeFilename(file.name)}"\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`, file, '\r\n');
  }
  parts.push(`--${boundary}--\r\n`);
  return { body: new Blob(parts), contentType: `multipart/form-data; boundary=${boundary}` };
}

export async function proxyCanonicalReview(
  request: Request, kind: ReviewableRecordKind, rawId: string,
): Promise<Response> {
  if (!isPositiveInt64(rawId)) return result({ errorCode: 'trip_review.invalid_input' }, 400);
  if (request.method !== 'GET' && !isSameOriginRequest(request)) return result({ errorCode: 'FORBIDDEN' }, 403);
  const length = request.headers.get('content-length');
  if (length && Number(length) > MAX_BODY_BYTES) return result({ errorCode: 'trip_review.body_too_large' }, 413);
  try {
    const accessToken = await token(request.signal);
    if (!accessToken) return result({ errorCode: 'UNAUTHENTICATED' }, 401);
    const namespace = kind === 'commerceBooking' ? 'bookings' : 'service-bookings';
    const headers = new Headers({ Authorization: `Bearer ${accessToken}` });
    let body: BodyInit | undefined;
    if (request.method === 'POST') {
      const bytes = await boundedBytes(request);
      if (!bytes) return result({ errorCode: 'trip_review.body_too_large' }, 413);
      const parsed = await new Response(bytes, { headers: {
        'Content-Type': request.headers.get('content-type') ?? '',
      } }).formData().catch(() => null);
      if (!parsed) return result({ errorCode: 'trip_review.invalid_input' }, 400);
      const multipart = await backendMultipart(parsed);
      if (!multipart) return result({ errorCode: 'trip_review.invalid_input' }, 400);
      body = multipart.body;
      headers.set('Content-Type', multipart.contentType);
    } else if (request.method === 'PUT') {
      const bytes = await boundedBytes(request);
      if (!bytes) return result({ errorCode: 'trip_review.body_too_large' }, 413);
      headers.set('Content-Type', 'application/json');
      body = bytes;
    }
    const upstream = await fetchBackend(`/api/v1/${namespace}/${rawId}/review`, {
      method: request.method, headers, body, signal: request.signal,
    });
    const payload: unknown = await upstream.json().catch(() => null);
    if (upstream.ok) return result(payload, upstream.status);
    const source = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
    const errorCode = typeof source.errorCode === 'string' && safeErrorCodes.has(source.errorCode)
      ? source.errorCode : upstream.status === 401 ? 'UNAUTHENTICATED'
        : upstream.status === 403 ? 'FORBIDDEN' : 'MSG127';
    return result({ errorCode }, upstream.status >= 500 && errorCode === 'MSG127' ? 503 : upstream.status);
  } catch {
    return result({ errorCode: 'MSG127' }, 503);
  }
}
