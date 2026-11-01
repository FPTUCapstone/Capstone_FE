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

import { isValidPayoutId } from '../payout-review/payoutReview';
import { SETTLEMENT_PAGE_SIZE } from './payoutSettlement';

const BACKEND_BASE = '/api/v1/admin/payout-settlements';
const ALLOWED_QUERY_PARAMETERS = ['keyword', 'status', 'periodFrom', 'periodTo', 'pageNumber'] as const;

function buildQueuePath(request: Request): string {
  const submitted = new URL(request.url).searchParams;
  const forwarded = new URLSearchParams();
  for (const name of ALLOWED_QUERY_PARAMETERS) {
    const value = submitted.get(name);
    if (value !== null) forwarded.set(name, value);
  }
  forwarded.set('pageSize', String(SETTLEMENT_PAGE_SIZE));
  return `${BACKEND_BASE}?${forwarded.toString()}`;
}

function safeErrorBody(value: unknown, fallbackTitle: string): Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return { title: fallbackTitle };

  const body = value as Record<string, unknown>;
  const title = typeof body.title === 'string' && body.title.length <= 500 ? body.title : fallbackTitle;
  const errorCode = typeof body.errorCode === 'string' && /^[a-z0-9._-]{1,100}$/i.test(body.errorCode)
    ? body.errorCode
    : undefined;
  const currentStatus = typeof body.currentStatus === 'string' && /^[A-Za-z]{1,40}$/.test(body.currentStatus)
    ? body.currentStatus
    : undefined;

  return { title, ...(errorCode ? { errorCode } : {}), ...(currentStatus ? { currentStatus } : {}) };
}

async function authorizeAdministrator(): Promise<{ token: string } | { response: Response }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  const session = verifyAdminSessionFromCookies(cookieStore);
  if (!token || !session) {
    return { response: clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401)) };
  }
  if (session.role !== 'Administrator') {
    return { response: jsonNoStore({ title: 'Administrator access is required for payout settlement.' }, 403) };
  }
  return { token };
}

async function forwardToBackend(path: string, init: { method: 'GET' | 'POST'; token: string }): Promise<Response> {
  try {
    const upstream = await fetchBackend(path, {
      method: init.method,
      headers: { Authorization: `Bearer ${init.token}` },
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

export async function proxyGetSettlementQueue(request: Request): Promise<Response> {
  const authorized = await authorizeAdministrator();
  if ('response' in authorized) return authorized.response;
  return forwardToBackend(buildQueuePath(request), { method: 'GET', token: authorized.token });
}

export async function proxyGetSettlementDetail(payoutId: string): Promise<Response> {
  if (!isValidPayoutId(payoutId)) return jsonNoStore({ title: 'The payout reference is invalid.' }, 400);
  const authorized = await authorizeAdministrator();
  if ('response' in authorized) return authorized.response;
  return forwardToBackend(`${BACKEND_BASE}/${payoutId}`, { method: 'GET', token: authorized.token });
}

export async function proxyAuthorizeSettlement(payoutId: string, request: Request): Promise<Response> {
  if (!isValidPayoutId(payoutId)) return jsonNoStore({ title: 'The payout reference is invalid.' }, 400);
  if (!isSameOriginRequest(request)) return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  const authorized = await authorizeAdministrator();
  if ('response' in authorized) return authorized.response;
  // The browser sends no body and the Administrator authorizes only; nothing from the request is forwarded.
  return forwardToBackend(`${BACKEND_BASE}/${payoutId}/authorize`, { method: 'POST', token: authorized.token });
}
