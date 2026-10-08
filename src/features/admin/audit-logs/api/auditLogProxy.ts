import 'server-only';

import { cookies } from 'next/headers';

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  clearAdminSession,
  jsonNoStore,
  verifyAdminSessionFromCookies,
} from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';

const ALLOWED_QUERY_PARAMETERS = [
  'keyword',
  'actionType',
  'actorRole',
  'affectedEntity',
  'fromDateUtc',
  'toDateUtc',
  'pageNumber',
  'pageSize',
] as const;

function buildUpstreamPath(request: Request): string {
  const submitted = new URL(request.url).searchParams;
  const forwarded = new URLSearchParams();

  for (const name of ALLOWED_QUERY_PARAMETERS) {
    const value = submitted.get(name);
    if (value !== null) forwarded.set(name, value);
  }

  const query = forwarded.toString();
  return `/api/v1/admin/audit-logs${query ? `?${query}` : ''}`;
}

export async function proxyAuditLogs(request: Request): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return jsonNoStore({ title: 'Administrator sign-in required.' }, 401);

  if (typeof verifyAdminSessionFromCookies === 'function') {
    const session = verifyAdminSessionFromCookies(cookieStore);
    if (!session) {
      return clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401));
    }
    if (session.role === 'Staff') {
      return jsonNoStore({ title: 'Administrator access is not allowed.' }, 403);
    }
  }

  try {
    const upstream = await fetchBackend(buildUpstreamPath(request), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: request.signal,
    });

    if (upstream.status >= 500) {
      return jsonNoStore({ title: 'The audit log service is unavailable.' }, 503);
    }

    if (upstream.status === 401) {
      return clearAdminSession(
        jsonNoStore({ title: 'Administrator sign-in required.' }, 401),
      );
    }

    if (upstream.status === 403) {
      return jsonNoStore({ title: 'Administrator access is not allowed.' }, 403);
    }

    const result: unknown = await upstream.json().catch(() => null);
    if (result === null) {
      return jsonNoStore({ title: 'The audit log service returned no data.' }, 503);
    }

    return jsonNoStore(result, upstream.status);
  } catch {
    return jsonNoStore({ title: 'The audit log service could not be reached.' }, 503);
  }
}

export async function proxyAuditLogDetail(
  request: Request,
  id: string,
): Promise<Response> {
  if (!/^[1-9]\d*$/.test(id)) {
    return jsonNoStore({ title: 'A valid audit log ID is required.' }, 400);
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return jsonNoStore({ title: 'Administrator sign-in required.' }, 401);

  if (typeof verifyAdminSessionFromCookies === 'function') {
    const session = verifyAdminSessionFromCookies(cookieStore);
    if (!session) {
      return clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401));
    }
    if (session.role === 'Staff') {
      return jsonNoStore({ title: 'Administrator access is not allowed.' }, 403);
    }
  }

  try {
    const upstream = await fetchBackend(`/api/v1/admin/audit-logs/${id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: request.signal,
    });

    if (upstream.status >= 500) {
      return jsonNoStore({ title: 'The audit log service is unavailable.' }, 503);
    }

    if (upstream.status === 401) {
      return clearAdminSession(
        jsonNoStore({ title: 'Administrator sign-in required.' }, 401),
      );
    }

    if (upstream.status === 403) {
      return jsonNoStore({ title: 'Administrator access is not allowed.' }, 403);
    }

    const result: unknown = await upstream.json().catch(() => null);
    if (result === null) {
      return jsonNoStore({ title: 'The audit log service returned no data.' }, 503);
    }

    return jsonNoStore(result, upstream.status);
  } catch {
    return jsonNoStore({ title: 'The audit log service could not be reached.' }, 503);
  }
}
