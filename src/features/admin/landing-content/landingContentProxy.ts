import 'server-only';
import { fetchBackend } from '@/lib/server/backend';
import { jsonNoStore } from '@/lib/server/jsonNoStore';
import { isSameOriginRequest } from '@/lib/server/sameOrigin';
import { resolveWebSession } from '@/lib/server/webSession';
import { landingContentEn } from './resources/en';

const UPSTREAM_BASE = '/api/v1/admin/landing-content';

// 5 MB image (BR-16) plus multipart framing; larger bodies are refused before they are buffered.
const MAX_MEDIA_BODY_BYTES = 6 * 1024 * 1024;

type BodyKind = 'none' | 'json' | 'multipart';

// The only operations this proxy forwards. The upstream path is built from
// these entries, never from request input.
const ALLOWED: Record<string, { upstream: string; body: BodyKind }> = {
  'GET ': { upstream: UPSTREAM_BASE, body: 'none' },
  'PUT draft': { upstream: `${UPSTREAM_BASE}/draft`, body: 'json' },
  'POST publish': { upstream: `${UPSTREAM_BASE}/publish`, body: 'json' },
  'POST restore': { upstream: `${UPSTREAM_BASE}/restore`, body: 'json' },
  'POST media': { upstream: `${UPSTREAM_BASE}/media`, body: 'multipart' },
  'GET approved-tours': { upstream: `${UPSTREAM_BASE}/approved-tours`, body: 'none' },
};

const SIGN_IN_REQUIRED = { title: 'Administrator or Staff sign-in required.' };
const UNAVAILABLE = { title: landingContentEn.errors.unavailable };

/**
 * Same-origin proxy for UC-66. The bearer token only ever exists in the
 * HttpOnly admin session cookie; the browser never sees or stores it.
 * Administrator and Staff sessions are allowed; any other role is denied.
 */
export async function proxyLandingContent(request: Request, path: string[] | undefined): Promise<Response> {
  const entry = ALLOWED[`${request.method} ${(path ?? []).join('/')}`];
  if (!entry) return jsonNoStore({ title: 'Not found.' }, 404);

  if (request.method !== 'GET' && !isSameOriginRequest(request)) {
    return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  }

  const session = await resolveWebSession(request.signal);
  if (!session) return jsonNoStore(SIGN_IN_REQUIRED, 401);
  if (session.role !== 'Administrator' && session.role !== 'Staff') {
    return jsonNoStore({ title: landingContentEn.errors.forbidden }, 403);
  }

  const contentType = request.headers.get('content-type') ?? '';
  const headers: Record<string, string> = { Authorization: `Bearer ${session.accessToken}` };
  let body: string | ArrayBuffer | undefined;
  if (entry.body === 'json') {
    if (!contentType.toLowerCase().startsWith('application/json')) {
      return jsonNoStore({ title: 'JSON content is required.' }, 415);
    }
    try {
      body = JSON.stringify(await request.json());
    } catch {
      return jsonNoStore({ title: 'Invalid JSON.' }, 400);
    }
    headers['Content-Type'] = 'application/json';
  } else if (entry.body === 'multipart') {
    if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
      return jsonNoStore({ title: 'Multipart content is required.' }, 415);
    }
    const declared = Number(request.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_MEDIA_BODY_BYTES) {
      return jsonNoStore({ title: 'The upload is too large.' }, 413);
    }
    body = await request.arrayBuffer();
    if (body.byteLength > MAX_MEDIA_BODY_BYTES) return jsonNoStore({ title: 'The upload is too large.' }, 413);
    headers['Content-Type'] = contentType;
  }

  try {
    const upstream = await fetchBackend(entry.upstream, { method: request.method, headers, body });
    if (upstream.status >= 500) return jsonNoStore(UNAVAILABLE, 503);
    if (upstream.status === 401) return jsonNoStore(SIGN_IN_REQUIRED, 401);
    // Upstream detail (trace ids, internals) is not exposed for these; 409 and 422 carry user-facing field data.
    if (upstream.status === 403) return jsonNoStore({ title: landingContentEn.errors.forbidden }, 403);
    if (upstream.status === 404) return jsonNoStore({ title: 'Not found.' }, 404);
    const result: unknown = await upstream.json().catch(() => null);
    return jsonNoStore(result ?? UNAVAILABLE, upstream.status);
  } catch {
    return jsonNoStore(UNAVAILABLE, 503);
  }
}
