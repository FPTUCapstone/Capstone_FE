import 'server-only';
import { fetchBackend } from '@/lib/server/backend';
import { jsonNoStore } from '@/lib/server/jsonNoStore';
import { isSameOriginRequest } from '@/lib/server/sameOrigin';
import { resolveWebSession } from '@/lib/server/webSession';

export async function proxyPoi(request: Request, path: '/api/v1/admin/pois' | '/api/v1/admin/pois/catalogue') {
  if (request.method !== 'GET' && !isSameOriginRequest(request)) return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  const session = await resolveWebSession(request.signal);
  if (!session) return jsonNoStore({ title: 'Staff sign-in required.' }, 401);
  if (session.role !== 'Staff') return jsonNoStore({ title: 'Staff access is required.' }, 403);
  const token = session.accessToken;
  let body: string | undefined;
  if (request.method === 'POST') {
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return jsonNoStore({ title: 'JSON content is required.' }, 415);
    try { body = JSON.stringify(await request.json()); }
    catch { return jsonNoStore({ title: 'Invalid JSON.' }, 400); }
  }
  try {
    const upstream = await fetchBackend(path, { method: request.method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body });
    if (upstream.status >= 500) return jsonNoStore({ title: 'The POI service is unavailable. The save could not be confirmed.' }, 503);
    if (upstream.status === 401) {
      return jsonNoStore({ title: 'Staff sign-in required.' }, 401);
    }
    if (upstream.status === 403) {
      return jsonNoStore({ title: 'Staff access is required.' }, 403);
    }
    const result: unknown = await upstream.json().catch(() => null);
    return jsonNoStore(result ?? { title: 'The POI service returned no data.' }, upstream.status);
  } catch {
    return jsonNoStore({ title: 'The POI service could not be reached. The save could not be confirmed.' }, 503);
  }
}
