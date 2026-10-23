import 'server-only';

import { cookies } from 'next/headers';

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  clearAdminSession,
  jsonNoStore,
  verifyAdminSessionFromCookies,
} from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';

import { PAYOUTS_PAGE_SIZE } from './payoutRecords';

const ALLOWED_QUERY_PARAMETERS = [
  'keyword',
  'status',
  'periodFrom',
  'periodTo',
  'pageNumber',
] as const;

function buildUpstreamPath(request: Request): string {
  const submitted = new URL(request.url).searchParams;
  const forwarded = new URLSearchParams();

  for (const name of ALLOWED_QUERY_PARAMETERS) {
    const value = submitted.get(name);
    if (value !== null) forwarded.set(name, value);
  }

  forwarded.set('pageSize', String(PAYOUTS_PAGE_SIZE));

  const query = forwarded.toString();
  return `/api/v1/admin/payouts${query ? `?${query}` : ''}`;
}

function safeErrorBody(value: unknown, fallbackTitle: string): { title: string; errorCode?: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { title: fallbackTitle };
  }

  const body = value as Record<string, unknown>;
  const title = typeof body.title === 'string' && body.title.length <= 500
    ? body.title
    : fallbackTitle;
  const errorCode = typeof body.errorCode === 'string' && /^[a-z0-9._-]{1,100}$/i.test(body.errorCode)
    ? body.errorCode
    : undefined;

  return errorCode ? { title, errorCode } : { title };
}

export async function proxyPayoutRecords(request: Request): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  const session = verifyAdminSessionFromCookies(cookieStore);
  if (!token || !session) {
    return clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401));
  }

  if (session.role !== 'Staff') {
    return jsonNoStore({ title: 'Staff access is required for payout review.' }, 403);
  }

  try {
    const upstream = await fetchBackend(buildUpstreamPath(request), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: request.signal,
    });

    if (upstream.status >= 500) {
      return jsonNoStore({ title: 'The payout service is unavailable.' }, 503);
    }

    if (upstream.status === 401) {
      return clearAdminSession(jsonNoStore({
        title: 'Administrator sign-in required.',
      }, 401));
    }

    if (upstream.status === 403) {
      return jsonNoStore({ title: 'Administrator access is not allowed.' }, 403);
    }

    const result: unknown = await upstream.json().catch(() => null);
    if (result === null) {
      return jsonNoStore({ title: 'The payout service returned no data.' }, 503);
    }

    if (upstream.status >= 400) {
      return jsonNoStore(safeErrorBody(result, 'The payout request could not be processed.'), upstream.status);
    }

    return jsonNoStore(result, upstream.status);
  } catch {
    return jsonNoStore({ title: 'The payout service could not be reached.' }, 503);
  }
}
