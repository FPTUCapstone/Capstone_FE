import 'server-only';
import { cookies } from 'next/headers';
import { fetchBackend } from '@/lib/server/backend';
import { ADMIN_ACCESS_TOKEN_COOKIE, clearAdminSession, isSameOriginRequest, jsonNoStore, verifyAdminSessionFromCookies } from '@/lib/server/adminSession';
import { routeMessages } from './route-api';

const failure = (status: number, code: 'MSG126' | 'MSG127') => jsonNoStore({ title: routeMessages[code], errorCode: code }, status);

export async function proxyRoutes(request: Request, options = false): Promise<Response> {
  if (request.method !== 'GET' && !isSameOriginRequest(request)) return failure(403, 'MSG126');
  const store = await cookies();
  const session = verifyAdminSessionFromCookies(store);
  const token = store.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  if (!session || !token) return clearAdminSession(failure(401, 'MSG126'));
  if (session.role !== 'Staff') return failure(403, 'MSG126');
  const query = new URLSearchParams();
  if (request.method === 'GET' && !options) {
    for (const [name, value] of new URL(request.url).searchParams) if (name === 'page' || name === 'pageSize') query.append(name, value);
  }
  const path = `/api/v1/admin/routes${options ? '/options' : ''}${query.size ? `?${query}` : ''}`;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  let body: string | undefined;
  if (request.method === 'POST') {
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return jsonNoStore({ title: 'JSON content is required.' }, 415);
    try { body = JSON.stringify(await request.json()); }
    catch { return jsonNoStore({ title: 'Invalid JSON.' }, 400); }
    headers['Idempotency-Key'] = request.headers.get('Idempotency-Key') ?? '';
  }
  try {
    const upstream = await fetchBackend(path, { method: request.method, headers, body, signal: request.signal });
    if (upstream.status === 401) return clearAdminSession(failure(401, 'MSG126'));
    if (upstream.status === 403) return failure(403, 'MSG126');
    if (upstream.status >= 500) return failure(503, 'MSG127');
    const result: unknown = await upstream.json().catch(() => null);
    return result === null ? failure(502, 'MSG127') : jsonNoStore(result, upstream.status);
  } catch { return failure(503, 'MSG127'); }
}
