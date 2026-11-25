import 'server-only';

import { cookies } from 'next/headers';
import { ADMIN_ACCESS_TOKEN_COOKIE, clearAdminSession, isSameOriginRequest, jsonNoStore, verifyAdminSessionFromCookies } from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';

const base = '/api/v1/admin/contract-templates';
const maxUploadBytes = 11 * 1024 * 1024;
const unavailable = { title: 'Contract template processing is temporarily unavailable. Please try again.' };

function operation(method: string, segments: string[]) {
  const [id, action, kind] = segments;
  if (!segments.length && ['GET', 'POST'].includes(method)) return { body: method === 'POST' ? 'multipart' : 'none', document: false };
  if (!/^\d+$/.test(id ?? '')) return null;
  if (segments.length === 1 && ['GET', 'PUT', 'DELETE'].includes(method)) return { body: method === 'PUT' ? 'multipart' : 'none', document: false };
  if (segments.length === 2 && ['preview', 'publish', 'versions'].includes(action) && method === 'POST') return { body: 'json', document: false };
  if (segments.length === 3 && action === 'documents' && ['source', 'preview'].includes(kind) && method === 'GET') return { body: 'none', document: true };
  return null;
}

export async function proxyContractTemplates(request: Request, segments: string[] = []): Promise<Response> {
  const entry = operation(request.method, segments);
  if (!entry) return jsonNoStore({ title: 'Not found.' }, 404);
  if (request.method !== 'GET' && !isSameOriginRequest(request)) return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return jsonNoStore({ title: 'Administrator sign-in required.' }, 401);
  const session = verifyAdminSessionFromCookies(cookieStore);
  if (!session) return clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401));
  if (session.role !== 'Administrator') return jsonNoStore({ title: 'Only an Administrator can manage contract templates.' }, 403);

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  const contentType = request.headers.get('content-type') ?? '';
  let body: BodyInit | undefined;
  if (entry.body === 'multipart') {
    if (!contentType.toLowerCase().startsWith('multipart/form-data;')) return jsonNoStore({ title: 'A DOCX multipart upload is required.' }, 415);
    const declared = Number(request.headers.get('content-length'));
    if (declared > maxUploadBytes) return jsonNoStore({ title: 'The upload is too large.' }, 413);
    // Bound streamed input as well as declared Content-Length; do not buffer an unlimited upload.
    const reader = request.body?.getReader();
    if (!reader) return jsonNoStore({ title: 'A DOCX upload is required.' }, 400);
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        length += next.value.byteLength;
        if (length > maxUploadBytes) { await reader.cancel(); return jsonNoStore({ title: 'The upload is too large.' }, 413); }
        chunks.push(next.value);
      }
    } catch { return jsonNoStore({ title: 'The upload could not be read.' }, 400); }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    body = bytes.buffer;
    headers['Content-Type'] = contentType;
  } else if (entry.body === 'json') {
    if (!contentType.toLowerCase().startsWith('application/json')) return jsonNoStore({ title: 'JSON content is required.' }, 415);
    try { body = JSON.stringify(await request.json()); } catch { return jsonNoStore({ title: 'Invalid JSON.' }, 400); }
    headers['Content-Type'] = 'application/json';
  }

  const search = new URL(request.url).searchParams;
  const forwarded = new URLSearchParams();
  if (!segments.length && request.method === 'GET') for (const key of ['status', 'page', 'pageSize']) { const value = search.get(key); if (value) forwarded.set(key, value); }
  const query = forwarded.size ? `?${forwarded}` : '';
  const path = `${base}${segments.length ? `/${segments.join('/')}` : ''}${query}`;
  try {
    const upstream = await fetchBackend(path, { method: request.method, headers, body });
    if (upstream.status === 401) return clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401));
    if (upstream.status === 403) return jsonNoStore({ title: 'Only an Administrator can manage contract templates.' }, 403);
    if (upstream.status >= 500) return jsonNoStore(unavailable, 503);
    if (upstream.status === 204) return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    if (entry.document && upstream.ok) {
      const type = segments[2] === 'preview' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      return new Response(upstream.body, { status: upstream.status, headers: {
        'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': `${segments[2] === 'preview' ? 'inline' : 'attachment'}; filename="contract-template-${segments[0]}.${segments[2] === 'preview' ? 'pdf' : 'docx'}"`,
      } });
    }
    const result: unknown = await upstream.json().catch(() => null);
    // Keep validation fields and stable error codes while excluding backend diagnostics.
    if (!upstream.ok && result && typeof result === 'object') {
      const problem = result as Record<string, unknown>;
      return jsonNoStore({ errorCode: problem.errorCode, errors: problem.errors, missingVariables: problem.missingVariables, unknownVariables: problem.unknownVariables, validationIssue: problem.validationIssue }, upstream.status);
    }
    return jsonNoStore(result ?? unavailable, upstream.status);
  } catch { return jsonNoStore(unavailable, 503); }
}
