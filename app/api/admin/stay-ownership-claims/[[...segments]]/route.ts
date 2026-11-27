import { cookies } from 'next/headers';
import { fetchBackend } from '@/lib/server/backend';
import { ADMIN_ACCESS_TOKEN_COOKIE, isSameOriginRequest, verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

type RouteContext = { params: Promise<{ segments?: string[] }> };

async function forward(request: Request, { params }: RouteContext) {
  const path = (await params).segments?.join('/') ?? '';
  const method = request.method;
  if (!((method === 'GET' && !path) || (method === 'POST' && /^\d+\/review$/.test(path))))
    return Response.json({}, { status: 404 });
  if (method === 'POST' && !isSameOriginRequest(request)) return Response.json({}, { status: 403 });

  try {
    const store = await cookies();
    const session = verifyAdminSessionFromCookies(store);
    const token = store.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
    if (session?.role !== 'Staff' || session.mustChangePassword || !token) return Response.json({}, { status: 401 });
    const body = method === 'POST' ? await request.text() : undefined;
    if (body !== undefined && body.length > 8192) return Response.json({}, { status: 413 });
    const response = await fetchBackend(`/api/v1/admin/stay-ownership-claims${path ? `/${path}` : ''}`, {
      method, body, headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      }, cache: 'no-store',
    });
    return Response.json(await response.json().catch(() => ({})), {
      status: response.status, headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return Response.json({}, { status: 503 });
  }
}

export const GET = forward;
export const POST = forward;
