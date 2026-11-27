import { fetchBackend } from '@/lib/server/backend';
import { isSameOriginRequest } from '@/lib/server/adminSession';
import { providerServerContext } from '@/features/hotel-service-provider/server/workflowProxy';

type RouteContext = { params: Promise<{ segments: string[] }> };

async function forward(request: Request, { params }: RouteContext) {
  const path = (await params).segments.join('/');
  const method = request.method;
  const allowed = (method === 'GET' && /^(listings|inquiries(?:\/\d+)?)$/.test(path))
    || (method === 'PUT' && /^listings\/\d+$/.test(path))
    || (method === 'POST' && /^inquiries\/\d+\/reply$/.test(path));
  if (!allowed) return Response.json({}, { status: 404 });
  if (method !== 'GET' && !isSameOriginRequest(request)) return Response.json({}, { status: 403 });

  try {
    const session = await providerServerContext();
    if (session?.role !== 'ServiceProvider' || session.mustChangePassword) return Response.json({}, { status: 401 });
    const body = method === 'GET' ? undefined : await request.text();
    if (body !== undefined && body.length > 8192) return Response.json({}, { status: 413 });
    const beforeId = new URL(request.url).searchParams.get('beforeId');
    const query = beforeId && /^\d+$/.test(beforeId) ? `?beforeId=${beforeId}` : '';
    const response = await fetchBackend(`/api/v1/provider/stay-${path}${query}`, {
      method, body, headers: {
        Authorization: `Bearer ${session.token}`,
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
export const PUT = forward;
export const POST = forward;
