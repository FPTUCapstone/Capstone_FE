import 'server-only';
import { cookies } from 'next/headers';
import { fetchBackend } from '@/lib/server/backend';
import { isSameOriginRequest } from '@/lib/server/adminSession';

const REFRESH_COOKIE = 'tripmate_refresh';

/**
 * BFF proxy for UC-46 operator payout endpoints, following the same pattern as
 * operatorRevenueProxy.ts: exchange the refresh cookie for a bearer token, verify the
 * TourOperator role, then forward to the backend. The browser never sees the backend URL or
 * the bearer token.
 */
export async function proxyOperatorPayout(
  request: Request,
  resourcePath: string,
  options: { method?: string; forwardQuery?: boolean } = {}
): Promise<Response> {
  const method = options.method ?? request.method;
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !isSameOriginRequest(request)) {
    return Response.json({ errorCode: 'OPERATOR_NOT_APPROVED' }, {
      status: 403,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  try {
    const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
    if (!refresh) return Response.json({ errorCode: 'OPERATOR_NOT_APPROVED' }, { status: 401 });

    const auth = await fetchBackend('/api/v1/auth/web/refresh', {
      method: 'POST',
      headers: { Cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refresh)}` },
      signal: request.signal,
    });
    const authBody = (await auth.json().catch(() => null)) as
      | { data?: { accessToken?: string; role?: string } }
      | null;
    const token = authBody?.data?.accessToken;
    if (!auth.ok || !token || authBody?.data?.role !== 'TourOperator') {
      return Response.json({ errorCode: 'OPERATOR_NOT_APPROVED' }, { status: 401 });
    }

    const url = new URL(request.url);
    const search = options.forwardQuery === false ? '' : url.search;

    const init: RequestInit = {
      method,
      headers: { Authorization: `Bearer ${token}` },
      signal: request.signal,
    };
    if (method === 'POST' || method === 'PUT') {
      const bodyText = await request.text();
      if (bodyText) {
        init.body = bodyText;
        init.headers = { ...init.headers, 'Content-Type': 'application/json' };
      }
    }

    const backendPath = resourcePath ? `/api/v1/operator/payouts/${resourcePath}` : '/api/v1/operator/payouts';
    const upstream = await fetchBackend(`${backendPath}${search}`, init);
    const body = await upstream.json().catch(() => null);
    return Response.json(body ?? { errorCode: 'SYSTEM_ERROR' }, {
      status: upstream.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return Response.json({ errorCode: 'SYSTEM_ERROR' }, { status: 503 });
  }
}
