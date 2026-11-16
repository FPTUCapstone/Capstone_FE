import 'server-only';

import { cookies } from 'next/headers';
import { fetchBackend } from '@/lib/server/backend';
import { isSameOriginRequest } from '@/lib/server/adminSession';
import { parseAmendPostTripComplaintEvidenceResponse, parseMyPostTripComplaints, parsePostTripComplaintContext, parseSubmitPostTripComplaintResponse } from './postTripComplaintResponse';
import { MAX_EVIDENCE_FILE_BYTES, MAX_EVIDENCE_FILES, MAX_EVIDENCE_TOTAL_BYTES, isComplaintCategory } from '../schemas/postTripComplaintValidation';

const REFRESH_COOKIE = 'tripmate_refresh';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_REQUEST_BYTES = MAX_EVIDENCE_TOTAL_BYTES + 256 * 1024;
const SAFE_CODES = new Set(['complaint.window_closed', 'complaint.already_exists', 'complaint.evidence_limit', 'complaint.evidence_type', 'complaint.evidence_amendment_unavailable', 'complaint.idempotency_key_payload_mismatch', 'complaint.validation_failed', 'complaint.not_found', 'complaint.forbidden', 'complaint.unauthorized']);

function json(body: unknown, status: number): Response { return Response.json(body, { status, headers: { 'Cache-Control': 'no-store, max-age=0' } }); }
function validId(value: string): boolean { return /^[1-9]\d*$/.test(value); }
function unwrap(payload: unknown): unknown { return payload && typeof payload === 'object' && 'data' in payload ? (payload as { data: unknown }).data : payload; }

async function travelerToken(signal: AbortSignal): Promise<string | null> {
  const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refresh) return null;
  const response = await fetchBackend('/api/v1/auth/web/refresh', { method: 'POST', headers: { Cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refresh)}` }, signal }).catch(() => null);
  if (!response?.ok) return null;
  const payload: unknown = await response.json().catch(() => null);
  const data = unwrap(payload);
  return data && typeof data === 'object' && 'accessToken' in data && typeof data.accessToken === 'string' && 'role' in data && data.role === 'Traveler' ? data.accessToken : null;
}

async function failure(upstream: Response): Promise<Response> {
  const body: unknown = await upstream.json().catch(() => null);
  const source = unwrap(body);
  const code = source && typeof source === 'object' && 'errorCode' in source && typeof source.errorCode === 'string' ? source.errorCode : null;
  if (code && SAFE_CODES.has(code) && upstream.status >= 400 && upstream.status < 500) return json({ errorCode: code }, upstream.status);
  if (upstream.status === 401) return json({ errorCode: 'UNAUTHENTICATED' }, 401);
  if (upstream.status === 403) return json({ errorCode: 'FORBIDDEN' }, 403);
  return json({ errorCode: 'complaint.storage_unavailable' }, 503);
}

async function createBackendMultipart(request: Request): Promise<{ body: Blob; contentType: string } | null> {
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_REQUEST_BYTES)) return null;
  const form = await request.formData().catch(() => null);
  if (!form || Array.from(form.keys()).some((key) => key !== 'reasonCategory' && key !== 'reasonDetail' && key !== 'evidence')) return null;
  const category = form.get('reasonCategory'); const detail = form.get('reasonDetail'); const evidence = form.getAll('evidence');
  if (!isComplaintCategory(category) || typeof detail !== 'string' || detail.trim().length === 0 || detail.trim().length > 2000 || evidence.length > MAX_EVIDENCE_FILES || evidence.some((value) => typeof value === 'string')) return null;
  const files = evidence as File[];
  if (files.some((file) => file.size > MAX_EVIDENCE_FILE_BYTES) || files.reduce((total, file) => total + file.size, 0) > MAX_EVIDENCE_TOTAL_BYTES) return null;
  const boundary = `tripmate-${crypto.randomUUID()}`;
  const safeName = (name: string) => name.replace(/[\r\n"\\]/g, '_').slice(0, 255) || 'evidence';
  const parts: BlobPart[] = [
    `--${boundary}\r\nContent-Disposition: form-data; name="reasonCategory"\r\n\r\n${category}\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="reasonDetail"\r\n\r\n${detail.trim()}\r\n`,
  ];
  for (const file of files) parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="evidence"; filename="${safeName(file.name)}"\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`, file, '\r\n');
  parts.push(`--${boundary}--\r\n`);
  return { body: new Blob(parts), contentType: `multipart/form-data; boundary=${boundary}` };
}

async function createEvidenceAmendmentMultipart(request: Request): Promise<{ body: Blob; contentType: string } | null> {
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_REQUEST_BYTES)) return null;
  const form = await request.formData().catch(() => null);
  if (!form || Array.from(form.keys()).some((key) => key !== 'evidence')) return null;
  const evidence = form.getAll('evidence');
  if (evidence.length === 0 || evidence.length > MAX_EVIDENCE_FILES || evidence.some((value) => typeof value === 'string')) return null;
  const files = evidence as File[];
  if (files.some((file) => file.size <= 0 || file.size > MAX_EVIDENCE_FILE_BYTES) || files.reduce((total, file) => total + file.size, 0) > MAX_EVIDENCE_TOTAL_BYTES) return null;
  const boundary = `tripmate-${crypto.randomUUID()}`;
  const safeName = (name: string) => name.replace(/[\r\n"\\]/g, '_').slice(0, 255) || 'evidence';
  const parts: BlobPart[] = [];
  for (const file of files) parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="evidence"; filename="${safeName(file.name)}"\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`, file, '\r\n');
  parts.push(`--${boundary}--\r\n`);
  return { body: new Blob(parts), contentType: `multipart/form-data; boundary=${boundary}` };
}

export async function proxyGetPostTripComplaintContext(request: Request, bookingId: string): Promise<Response> {
  if (!validId(bookingId)) return json({ errorCode: 'complaint.not_found' }, 404);
  const token = await travelerToken(request.signal); if (!token) return json({ errorCode: 'UNAUTHENTICATED' }, 401);
  const upstream = await fetchBackend(`/api/v1/traveler/bookings/${encodeURIComponent(bookingId)}/post-trip-complaint`, { method: 'GET', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, signal: request.signal }).catch(() => null);
  if (!upstream) return json({ errorCode: 'complaint.storage_unavailable' }, 503);
  if (!upstream.ok) return failure(upstream);
  try { return json(parsePostTripComplaintContext(await upstream.json()), 200); } catch { return json({ errorCode: 'complaint.invalid_response' }, 502); }
}

export async function proxyGetMyPostTripComplaints(request: Request): Promise<Response> {
  const token = await travelerToken(request.signal); if (!token) return json({ errorCode: 'UNAUTHENTICATED' }, 401);
  const upstream = await fetchBackend('/api/v1/traveler/post-trip-complaints', { method: 'GET', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, signal: request.signal }).catch(() => null);
  if (!upstream) return json({ errorCode: 'complaint.storage_unavailable' }, 503);
  if (!upstream.ok) return failure(upstream);
  try { return json(parseMyPostTripComplaints(await upstream.json()), 200); } catch { return json({ errorCode: 'complaint.invalid_response' }, 502); }
}

export async function proxyPostTripComplaint(request: Request, bookingId: string): Promise<Response> {
  if (!validId(bookingId)) return json({ errorCode: 'complaint.not_found' }, 404);
  if (!isSameOriginRequest(request)) return json({ errorCode: 'FORBIDDEN' }, 403);
  const key = request.headers.get('Idempotency-Key') ?? '';
  if (!UUID.test(key)) return json({ errorCode: 'INVALID_IDEMPOTENCY_KEY' }, 400);
  const token = await travelerToken(request.signal); if (!token) return json({ errorCode: 'UNAUTHENTICATED' }, 401);
  const multipart = await createBackendMultipart(request); if (!multipart) return json({ errorCode: 'complaint.validation_failed' }, 400);
  const upstream = await fetchBackend(`/api/v1/traveler/bookings/${encodeURIComponent(bookingId)}/post-trip-complaints`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': multipart.contentType, 'Idempotency-Key': key }, body: multipart.body, signal: request.signal }).catch(() => null);
  if (!upstream) return json({ errorCode: 'complaint.storage_unavailable' }, 503);
  if (!upstream.ok) return failure(upstream);
  try { return json(parseSubmitPostTripComplaintResponse(await upstream.json()), upstream.status); } catch { return json({ errorCode: 'complaint.invalid_response' }, 502); }
}

export async function proxyPostPostTripComplaintEvidenceAmendment(request: Request, bookingId: string): Promise<Response> {
  if (!validId(bookingId)) return json({ errorCode: 'complaint.not_found' }, 404);
  if (!isSameOriginRequest(request)) return json({ errorCode: 'FORBIDDEN' }, 403);
  const key = request.headers.get('Idempotency-Key') ?? '';
  if (!UUID.test(key)) return json({ errorCode: 'INVALID_IDEMPOTENCY_KEY' }, 400);
  const token = await travelerToken(request.signal); if (!token) return json({ errorCode: 'UNAUTHENTICATED' }, 401);
  const multipart = await createEvidenceAmendmentMultipart(request); if (!multipart) return json({ errorCode: 'complaint.validation_failed' }, 400);
  const upstream = await fetchBackend(`/api/v1/traveler/bookings/${encodeURIComponent(bookingId)}/post-trip-complaint/evidence`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': multipart.contentType, 'Idempotency-Key': key }, body: multipart.body, signal: request.signal }).catch(() => null);
  if (!upstream) return json({ errorCode: 'complaint.storage_unavailable' }, 503);
  if (!upstream.ok) return failure(upstream);
  try { return json(parseAmendPostTripComplaintEvidenceResponse(await upstream.json()), upstream.status); } catch { return json({ errorCode: 'complaint.invalid_response' }, 502); }
}

export async function proxyDownloadPostTripComplaintEvidence(request: Request, bookingId: string, evidenceId: string): Promise<Response> {
  if (!validId(bookingId) || !validId(evidenceId)) return json({ errorCode: 'complaint.not_found' }, 404);
  const token = await travelerToken(request.signal); if (!token) return json({ errorCode: 'UNAUTHENTICATED' }, 401);
  const upstream = await fetchBackend(`/api/v1/traveler/bookings/${encodeURIComponent(bookingId)}/post-trip-complaint/evidence/${encodeURIComponent(evidenceId)}/download`, { method: 'GET', headers: { Authorization: `Bearer ${token}` }, signal: request.signal }).catch(() => null);
  if (!upstream) return json({ errorCode: 'complaint.storage_unavailable' }, 503);
  if (!upstream.ok) return failure(upstream);
  const headers = new Headers({ 'Cache-Control': 'private, no-store' });
  for (const name of ['content-type', 'content-disposition', 'content-length']) {
    const value = upstream.headers.get(name); if (value) headers.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}
