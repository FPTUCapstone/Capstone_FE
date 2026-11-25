import 'server-only';
import { cookies } from 'next/headers';
import { fetchBackend } from '@/lib/server/backend';
import { isSameOriginRequest } from '@/lib/server/adminSession';

const maximumBody = 1024 * 1024;
function json(body: unknown, status: number) { return Response.json(body, { status, headers: { 'Cache-Control': 'no-store, max-age=0' } }); }
function operation(method: string, path: string[]) {
  if (method === 'GET' && path.length === 1 && path[0] === 'current') return 'get';
  if (!/^[1-9]\d{0,18}$/.test(path[0] ?? '')) return null;
  if (method === 'GET' && path.length === 3 && path[1] === 'documents' && ['unsigned', 'signed'].includes(path[2])) return 'pdf';
  if (method === 'POST' && path.length === 2 && ['prepare', 'signing-challenges', 'sign'].includes(path[1])) return path[1] === 'sign' ? 'multipart' : 'json';
  return null;
}
async function boundedBody(request: Request | Response, limit = maximumBody): Promise<ArrayBuffer | null> {
  if (Number(request.headers.get('content-length')) > limit) return null;
  const reader = request.body?.getReader(); if (!reader) return new ArrayBuffer(0);
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const item = await reader.read(); if (item.done) break;
    length += item.value.byteLength;
    if (length > limit) { await reader.cancel(); return null; }
    chunks.push(item.value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes.buffer;
}
export async function proxyOperatorContracts(request: Request, path: string[]): Promise<Response> {
  const kind = operation(request.method, path);
  if (!kind) return json({}, 404);
  if (request.method !== 'GET' && !isSameOriginRequest(request)) return json({}, 403);
  try {
    let body: ArrayBuffer | undefined;
    const contentType = request.headers.get('content-type') ?? '';
    if (request.method === 'POST') {
      if (kind === 'multipart' ? !contentType.toLowerCase().startsWith('multipart/form-data;') : !contentType.toLowerCase().startsWith('application/json')) return json({}, 415);
      const bytes = await boundedBody(request);
      if (bytes === null) return json({}, 413);
      if (kind === 'json') { try { JSON.parse(new TextDecoder().decode(bytes)); } catch { return json({}, 400); } }
      body = bytes;
    }
    const refresh = (await cookies()).get('tripmate_refresh')?.value;
    if (!refresh) return json({}, 401);
    const refreshed = await fetchBackend('/api/v1/auth/web/refresh', { method: 'POST', headers: { Cookie: `tripmate_refresh=${encodeURIComponent(refresh)}` }, signal: request.signal });
    if (!refreshed.ok) return json({}, refreshed.status >= 500 ? 503 : 401);
    const session = await refreshed.json().catch(() => null);
    if (session?.data?.role !== 'TourOperator') return json({}, 403);
    const token = session?.data?.accessToken;
    if (typeof token !== 'string' || !token) return json({}, 401);
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (request.method === 'POST') headers['Content-Type'] = contentType;
    const upstream = await fetchBackend(`/api/v1/operator/contracts/${path.join('/')}`, { method: request.method, headers, body, signal: request.signal });
    if (upstream.ok && kind === 'pdf') {
      if (!(upstream.headers.get('content-type') ?? '').startsWith('application/pdf')) return json({}, 503);
      // Finish reading the private document before handing it to Next's response
      // stream; do not leave its lifetime tied to the upstream fetch signal.
      const pdf = await boundedBody(upstream, 50 * 1024 * 1024);
      if (!pdf || new TextDecoder().decode(pdf.slice(0, 5)) !== '%PDF-') return json({}, 503);
      if (new URL(request.url).searchParams.get('format') === 'preview') {
        return json({ contentType: 'application/pdf', contentBase64: Buffer.from(pdf).toString('base64') }, 200);
      }
      return new Response(pdf, { status: upstream.status, headers: { 'Content-Type': 'application/pdf', 'Content-Length': String(pdf.byteLength), 'Cache-Control': 'no-store, max-age=0', 'X-Content-Type-Options': 'nosniff', 'Content-Disposition': `inline; filename="operator-contract-${path[0]}-${path[2]}.pdf"` } });
    }
    if (upstream.status >= 500) return json({}, 503);
    const result = await upstream.json().catch(() => null);
    if (!upstream.ok) return json({ errorCode: typeof result?.errorCode === 'string' ? result.errorCode : undefined, retryAfterSeconds: Number.isFinite(result?.retryAfterSeconds) ? result.retryAfterSeconds : undefined }, upstream.status);
    return result ? json(result, upstream.status) : json({}, 503);
  } catch { return json({}, 503); }
}
