import 'server-only';

import { cookies } from 'next/headers';

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  clearAdminSession,
  jsonNoStore,
  verifyAdminSessionFromCookies,
} from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';

const allowed = ['reportType', 'periodKey', 'bookingType', 'operatorUserId', 'destinationId', 'exportOperationId'] as const;

function upstreamPath(request: Request, suffix = ''): string {
  const source = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of allowed) {
    const value = source.get(key);
    if (value !== null) query.set(key, value);
  }
  if (suffix === '/export') {
    const format = source.get('format');
    if (format !== null) query.set('format', format);
  }
  return `/api/v1/admin/statistical-reports${suffix}${query.size ? `?${query.toString()}` : ''}`;
}

async function authorize() {
  const store = await cookies();
  const token = store.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  const session = verifyAdminSessionFromCookies(store);
  if (!token || !session || session.role !== 'Administrator') return null;
  return token;
}

export async function proxyStatisticalReport(request: Request): Promise<Response> {
  const token = await authorize();
  if (!token) return clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401));
  try {
    const upstream = await fetchBackend(upstreamPath(request), { headers: { Authorization: `Bearer ${token}` }, signal: request.signal });
    const body: unknown = await upstream.json().catch(() => null);
    if (upstream.status === 401) return clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401));
    if (body === null) return jsonNoStore({ title: 'The statistical reporting service is unavailable.' }, 503);
    return jsonNoStore(body, upstream.status);
  } catch {
    return jsonNoStore({ title: 'The statistical reporting service could not be reached.' }, 503);
  }
}

export async function proxyStatisticalReportExport(request: Request): Promise<Response> {
  const token = await authorize();
  if (!token) return clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401));
  try {
    const upstream = await fetchBackend(upstreamPath(request, '/export'), { headers: { Authorization: `Bearer ${token}` }, signal: request.signal });
    if (!upstream.ok) {
      const body: unknown = await upstream.json().catch(() => null);
      return jsonNoStore(body ?? { title: 'The statistical report export failed.' }, upstream.status);
    }
    const headers = new Headers();
    headers.set('Content-Type', upstream.headers.get('Content-Type') ?? 'application/octet-stream');
    const disposition = upstream.headers.get('Content-Disposition');
    if (disposition) headers.set('Content-Disposition', disposition);
    headers.set('Cache-Control', 'no-store');
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    return jsonNoStore({ title: 'The statistical reporting service could not be reached.' }, 503);
  }
}
