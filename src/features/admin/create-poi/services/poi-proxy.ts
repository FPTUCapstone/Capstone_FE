import 'server-only';
import { cookies } from 'next/headers';
import { fetchBackend } from '@/lib/server/backend';
import { ADMIN_ACCESS_TOKEN_COOKIE, clearAdminSession, isSameOriginRequest, jsonNoStore } from '@/lib/server/adminSession';

export async function proxyPoi(request: Request, path: '/api/v1/admin/pois' | '/api/v1/admin/pois/catalogue') {
  if (request.method !== 'GET' && !isSameOriginRequest(request)) return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  const token = (await cookies()).get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return jsonNoStore({ title: 'Administrator sign-in required.' }, 401);
  let body: string | undefined;
  if (request.method === 'POST') {
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return jsonNoStore({ title: 'JSON content is required.' }, 415);
    try { body = JSON.stringify(await request.json()); }
    catch { return jsonNoStore({ title: 'Invalid JSON.' }, 400); }
  }
  try {
    const upstream = await fetchBackend(path, { method: request.method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body });
    if (upstream.status >= 500) return jsonNoStore({ title: 'The POI service is unavailable. The save could not be confirmed.' }, 502);
    const result: unknown = await upstream.json().catch(() => null);
    const response = jsonNoStore(result ?? { title: 'The POI service returned no data.' }, upstream.status);
    return upstream.status === 401 || upstream.status === 403 ? clearAdminSession(response) : response;
  } catch {
    return jsonNoStore({ title: 'The POI service could not be reached. The save could not be confirmed.' }, 502);
  }
}
