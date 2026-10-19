import 'server-only';
import { cookies } from 'next/headers';
import { fetchBackend } from '@/lib/server/backend';
const REFRESH_COOKIE = 'tripmate_refresh';
export async function proxyOperatorRevenue(request: Request, resource = "report"): Promise<Response> {
  try {
    const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
    if (!refresh) return Response.json({ errorCode: 'UNAUTHENTICATED' }, { status: 401 });
    const auth = await fetchBackend('/api/v1/auth/web/refresh', { method: 'POST', headers: { Cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refresh)}` }, signal: request.signal });
    const authBody = await auth.json().catch(() => null) as { data?: { accessToken?: string; role?: string } } | null;
    const token = authBody?.data?.accessToken;
    if (!auth.ok || !token || authBody?.data?.role !== 'TourOperator') return Response.json({ errorCode: 'UNAUTHENTICATED' }, { status: 401 });
    const url = new URL(request.url);
    const upstream = await fetchBackend(`/api/v1/operator/revenue/${resource}${url.search}`, { headers: { Authorization: `Bearer ${token}` }, signal: request.signal });
    const body = await upstream.json().catch(() => null);
    return Response.json(body ?? { errorCode: 'MSG127' }, { status: upstream.ok ? 200 : upstream.status, headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ errorCode: 'MSG127' }, { status: 503 }); }
}
