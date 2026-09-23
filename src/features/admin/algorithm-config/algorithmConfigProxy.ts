import 'server-only';
import { cookies } from 'next/headers';
import { fetchBackend } from '@/lib/server/backend';
import { ADMIN_ACCESS_TOKEN_COOKIE, clearAdminSession, isSameOriginRequest, jsonNoStore } from '@/lib/server/adminSession';

const UPSTREAM_PATH = '/api/v1/admin/system-configs/algorithm-parameters';

/**
 * Same-origin proxy for UC-57. The bearer token only ever exists in the
 * HttpOnly admin session cookie; the browser never sees or stores it.
 */
export async function proxyAlgorithmParameters(request: Request) {
  if (request.method !== 'GET' && !isSameOriginRequest(request)) return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  const token = (await cookies()).get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return jsonNoStore({ title: 'Administrator sign-in required.' }, 401);
  let body: string | undefined;
  if (request.method === 'PUT') {
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return jsonNoStore({ title: 'JSON content is required.' }, 415);
    try { body = JSON.stringify(await request.json()); }
    catch { return jsonNoStore({ title: 'Invalid JSON.' }, 400); }
  }
  try {
    const upstream = await fetchBackend(UPSTREAM_PATH, { method: request.method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body });
    if (upstream.status >= 500) return jsonNoStore({ title: 'The configuration service is unavailable. The request could not be confirmed.' }, 503);
    if (upstream.status === 401 || upstream.status === 403) {
      return clearAdminSession(jsonNoStore({ title: upstream.status === 401 ? 'Administrator sign-in required.' : 'Administrator access is not allowed.' }, upstream.status));
    }
    const result: unknown = await upstream.json().catch(() => null);
    return jsonNoStore(result ?? { title: 'The configuration service returned no data.' }, upstream.status);
  } catch {
    return jsonNoStore({ title: 'The configuration service could not be reached. The request could not be confirmed.' }, 503);
  }
}
