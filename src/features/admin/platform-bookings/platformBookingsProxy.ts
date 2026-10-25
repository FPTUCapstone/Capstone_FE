import 'server-only';

import { cookies } from 'next/headers';

import { ADMIN_ACCESS_TOKEN_COOKIE, clearAdminSession, jsonNoStore, verifyAdminSessionFromCookies } from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';
import { PLATFORM_BOOKINGS_PAGE_SIZE } from './platformBookings';

const allowed = ['keyword', 'status', 'paymentStatus', 'bookedFromUtc', 'bookedToUtc', 'tourId', 'pageNumber'] as const;

function safeProblem(value: unknown, fallback: string): { title: string; errorCode?: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return { title: fallback };
  const body = value as Record<string, unknown>;
  const title = typeof body.title === 'string' && body.title.length <= 500 ? body.title : fallback;
  const errorCode = typeof body.errorCode === 'string' && /^[a-z0-9._-]{1,100}$/i.test(body.errorCode) ? body.errorCode : undefined;
  return errorCode ? { title, errorCode } : { title };
}

export async function proxyPlatformBookings(request: Request): Promise<Response> {
  const store = await cookies(); const token = store.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value; const session = verifyAdminSessionFromCookies(store);
  if (!token || !session) return clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401));
  if (session.role !== 'Staff') return jsonNoStore({ title: 'Staff access is required for platform booking operations.' }, 403);
  const incoming = new URL(request.url).searchParams; const query = new URLSearchParams();
  for (const key of allowed) { const value = incoming.get(key); if (value !== null) query.set(key, value); }
  query.set('pageSize', String(PLATFORM_BOOKINGS_PAGE_SIZE));
  try {
    const upstream = await fetchBackend(`/api/v1/admin/bookings?${query}`, { method: 'GET', headers: { Authorization: `Bearer ${token}` }, signal: request.signal });
    if (upstream.status >= 500) return jsonNoStore({ title: 'The booking register is temporarily unavailable.' }, 503);
    if (upstream.status === 401) return clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401));
    if (upstream.status === 403) return jsonNoStore({ title: 'Administrator access is not allowed.' }, 403);
    const body: unknown = await upstream.json().catch(() => null);
    if (body === null) return jsonNoStore({ title: 'The booking service returned no data.' }, 503);
    if (upstream.status >= 400) return jsonNoStore(safeProblem(body, 'The booking request could not be processed.'), upstream.status);
    return jsonNoStore(body, upstream.status);
  } catch { return jsonNoStore({ title: 'The booking register could not be reached.' }, 503); }
}
