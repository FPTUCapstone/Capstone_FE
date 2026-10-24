import 'server-only';

import { cookies } from 'next/headers';

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  clearAdminSession,
  isSameOriginRequest,
  jsonNoStore,
  verifyAdminSessionFromCookies,
} from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';

import { isValidPayoutId } from './payoutReview';

function safeErrorBody(value: unknown, fallbackTitle: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { title: fallbackTitle };
  }

  const body = value as Record<string, unknown>;
  const title = typeof body.title === 'string' && body.title.length <= 500 ? body.title : fallbackTitle;
  const errorCode = typeof body.errorCode === 'string' && /^[a-z0-9._-]{1,100}$/i.test(body.errorCode)
    ? body.errorCode
    : undefined;
  const currentStatus = typeof body.currentStatus === 'string' && /^[A-Za-z]{1,40}$/.test(body.currentStatus)
    ? body.currentStatus
    : undefined;
  const errors = isSafeReasonErrors(body.errors) ? body.errors : undefined;

  return {
    title,
    ...(errorCode ? { errorCode } : {}),
    ...(currentStatus ? { currentStatus } : {}),
    ...(errors ? { errors } : {}),
  };
}

function isSafeReasonErrors(value: unknown): value is { reason: string[] } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const reason = (value as Record<string, unknown>).reason;
  return Array.isArray(reason) && reason.length <= 10
    && reason.every((entry) => typeof entry === 'string' && entry.length <= 500);
}

async function authorizeStaffRequest(): Promise<
  { token: string } | { response: Response }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  const session = verifyAdminSessionFromCookies(cookieStore);
  if (!token || !session) {
    return { response: clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401)) };
  }
  if (session.role !== 'Staff') {
    return { response: jsonNoStore({ title: 'Staff access is required for payout review.' }, 403) };
  }
  return { token };
}

async function forwardToBackend(
  path: string,
  init: { method: 'GET' | 'POST'; token: string; body?: unknown },
): Promise<Response> {
  try {
    const upstream = await fetchBackend(path, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${init.token}`,
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    });

    if (upstream.status >= 500) {
      return jsonNoStore({ title: 'The payout service is unavailable.' }, 503);
    }
    if (upstream.status === 401) {
      return clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401));
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

export async function proxyGetPayoutDetail(payoutId: string): Promise<Response> {
  if (!isValidPayoutId(payoutId)) return jsonNoStore({ title: 'The payout reference is invalid.' }, 400);
  const authorized = await authorizeStaffRequest();
  if ('response' in authorized) return authorized.response;
  return forwardToBackend(`/api/v1/admin/payouts/${payoutId}`, { method: 'GET', token: authorized.token });
}

export async function proxyApprovePayout(payoutId: string, request: Request): Promise<Response> {
  if (!isValidPayoutId(payoutId)) return jsonNoStore({ title: 'The payout reference is invalid.' }, 400);
  if (!isSameOriginRequest(request)) {
    return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  }
  const authorized = await authorizeStaffRequest();
  if ('response' in authorized) return authorized.response;
  return forwardToBackend(`/api/v1/admin/payouts/${payoutId}/approve`, { method: 'POST', token: authorized.token });
}

export async function proxyRejectPayout(payoutId: string, request: Request): Promise<Response> {
  if (!isValidPayoutId(payoutId)) return jsonNoStore({ title: 'The payout reference is invalid.' }, 400);
  if (!isSameOriginRequest(request)) {
    return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  }
  const authorized = await authorizeStaffRequest();
  if ('response' in authorized) return authorized.response;

  const submitted: unknown = await request.json().catch(() => null);
  const reason = typeof submitted === 'object' && submitted !== null && !Array.isArray(submitted)
    && typeof (submitted as Record<string, unknown>).reason === 'string'
    ? (submitted as Record<string, unknown>).reason as string
    : '';

  // Only `reason` is ever forwarded upstream, regardless of what other fields the browser sent.
  return forwardToBackend(`/api/v1/admin/payouts/${payoutId}/reject`, {
    method: 'POST',
    token: authorized.token,
    body: { reason },
  });
}
