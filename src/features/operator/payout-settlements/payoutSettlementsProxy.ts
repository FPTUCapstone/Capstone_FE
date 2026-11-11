import 'server-only';

import { cookies } from 'next/headers';

import { fetchBackend } from '@/lib/server/backend';

const REFRESH_COOKIE = 'tripmate_refresh';
const QUERY_FIELDS = ['page', 'pageSize'] as const;

/**
 * PD-13 (Payout Settlement History): a Tour Operator's own settlements, read-only. Follows the
 * same refresh-cookie-exchange pattern as `operatorPayoutProxy.ts`, but targets the distinct
 * `/api/v1/operator/payout-settlements` path (not the legacy `/payouts` UC-46 one), so it is its
 * own small proxy rather than another resource path on `proxyOperatorPayout`.
 */
export async function proxyOperatorPayoutSettlements(request: Request): Promise<Response> {
  try {
    const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
    if (!refresh) return Response.json({ errorCode: 'OPERATOR_NOT_APPROVED' }, { status: 401 });

    const auth = await fetchBackend('/api/v1/auth/web/refresh', {
      method: 'POST',
      headers: { Cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refresh)}` },
      signal: request.signal,
    });
    const authBody = (await auth.json().catch(() => null)) as { data?: { accessToken?: string; role?: string } } | null;
    const token = authBody?.data?.accessToken;
    if (!auth.ok || !token || authBody?.data?.role !== 'TourOperator') {
      return Response.json({ errorCode: 'OPERATOR_NOT_APPROVED' }, { status: 401 });
    }

    const incoming = new URL(request.url).searchParams;
    const query = new URLSearchParams();
    for (const key of QUERY_FIELDS) {
      const value = incoming.get(key);
      if (value !== null) query.set(key, value);
    }

    const upstream = await fetchBackend(`/api/v1/operator/payout-settlements?${query}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: request.signal,
    });
    const body = await upstream.json().catch(() => null);
    return Response.json(body ?? { errorCode: 'SYSTEM_ERROR' }, {
      status: upstream.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return Response.json({ errorCode: 'SYSTEM_ERROR' }, { status: 503 });
  }
}
