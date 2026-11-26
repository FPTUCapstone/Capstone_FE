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

/** CR-01: the queue is always served 20 records per page; the client cannot change it. */
export const TOUR_QUEUE_SERVER_PAGE_SIZE = 20;

const CHECKLIST_KEYS = [
  'contentCompleteness',
  'imageAppropriateness',
  'pricePlausibility',
  'policyCompliance',
  'itineraryFeasibility',
] as const;
const MAX_NOTE_LENGTH = 1000;
/** BR-115: a rejection reason is 1..500 characters, shared by both the first-time-submission and draft-version reject endpoints. */
export const MAX_REASON_LENGTH = 500;
export const MAX_BODY_BYTES = 8 * 1024;
const POSITIVE_INTEGER = /^[1-9]\d*$/;
const SAFE_ERROR_CODE = /^[a-z0-9._-]{1,100}$/i;

export type SessionCheck = { ok: true; token: string } | { ok: false; response: Response };

export function safeProblem(value: unknown, fallback: string): { title: string; errorCode?: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return { title: fallback };
  const body = value as Record<string, unknown>;
  const title = typeof body.title === 'string' && body.title.length <= 500 ? body.title : fallback;
  const errorCode =
    typeof body.errorCode === 'string' && SAFE_ERROR_CODE.test(body.errorCode) ? body.errorCode : undefined;
  return errorCode ? { title, errorCode } : { title };
}

/** Tour moderation is a Staff function (UC-60/61); an Administrator session is refused. */
export async function requireStaff(): Promise<SessionCheck> {
  const store = await cookies();
  const token = store.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  const session = token ? verifyAdminSessionFromCookies(store) : null;
  if (!token || !session) {
    return { ok: false, response: clearAdminSession(jsonNoStore({ title: 'Staff sign-in required.' }, 401)) };
  }
  if (session.role !== 'Staff') {
    return { ok: false, response: jsonNoStore({ title: 'Staff access is required for tour moderation.' }, 403) };
  }
  return { ok: true, token };
}

export async function forward(
  backendPath: string,
  token: string,
  init: { method: 'GET' | 'POST'; body?: string; signal?: AbortSignal },
): Promise<Response> {
  try {
    const upstream = await fetchBackend(backendPath, {
      method: init.method,
      headers:
        init.body !== undefined
          ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
          : { Authorization: `Bearer ${token}` },
      body: init.body,
      signal: init.signal,
    });
    if (upstream.status === 401) return clearAdminSession(jsonNoStore({ title: 'Staff sign-in required.' }, 401));
    if (upstream.status === 403) return jsonNoStore({ title: 'Staff access is required for tour moderation.' }, 403);

    const body: unknown = await upstream.json().catch(() => null);
    if (upstream.status >= 500) {
      // MSG127 arrives as a 503 carrying an errorCode; keep it so the UI can offer a retry with the exact wording.
      const problem = upstream.status === 503 ? safeProblem(body, '') : { title: '' };
      return problem.errorCode && problem.title
        ? jsonNoStore(problem, 503)
        : jsonNoStore({ title: 'The tour moderation service is temporarily unavailable.' }, 503);
    }
    if (body === null) return jsonNoStore({ title: 'The tour moderation service returned no data.' }, 503);
    if (upstream.status >= 400) {
      return jsonNoStore(safeProblem(body, 'The tour moderation request could not be processed.'), upstream.status);
    }
    return jsonNoStore(body, upstream.status);
  } catch {
    return jsonNoStore({ title: 'The tour moderation service could not be reached.' }, 503);
  }
}

/** A positive integer path id, shared across every tour/pending-change id this feature validates. */
export function isValidPositiveIntegerId(value: string): boolean {
  return POSITIVE_INTEGER.test(value) && Number.isSafeInteger(Number(value));
}

const isValidTourId = isValidPositiveIntegerId;

/**
 * Screen 13: the Staff review queue (backend `GET /api/v1/admin/tours`). Only `keyword` and `pageNumber` are
 * forwarded (the latter as the backend's `page`); the page size is forced.
 */
export async function proxyPendingTours(request: Request): Promise<Response> {
  const session = await requireStaff();
  if (!session.ok) return session.response;

  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  const keyword = incoming.get('keyword');
  if (keyword !== null) query.set('keyword', keyword);
  const pageNumber = incoming.get('pageNumber');
  if (pageNumber !== null) query.set('page', pageNumber);
  query.set('pageSize', String(TOUR_QUEUE_SERVER_PAGE_SIZE));

  return forward(`/api/v1/admin/tours?${query}`, session.token, { method: 'GET', signal: request.signal });
}

/** Screen 14: review detail of one pending tour. */
export async function proxyTourReview(request: Request, tourId: string): Promise<Response> {
  if (!isValidTourId(tourId)) return jsonNoStore({ title: 'A valid tour ID is required.' }, 400);
  const session = await requireStaff();
  if (!session.ok) return session.response;

  return forward(`/api/v1/admin/tours/${tourId}/review`, session.token, { method: 'GET', signal: request.signal });
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return null;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return null;
    const parsed: unknown = JSON.parse(text);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Approval: the full five-item checklist is mandatory and re-validated here, not trusted from the browser. */
export async function proxyApproveTour(request: Request, tourId: string): Promise<Response> {
  if (!isValidTourId(tourId)) return jsonNoStore({ title: 'A valid tour ID is required.' }, 400);
  if (!isSameOriginRequest(request)) return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  const session = await requireStaff();
  if (!session.ok) return session.response;

  const body = await readJsonObject(request);
  if (!body) return jsonNoStore({ title: 'Invalid JSON.' }, 400);

  const rawChecklist = body.checklist;
  if (typeof rawChecklist !== 'object' || rawChecklist === null || Array.isArray(rawChecklist)) {
    return jsonNoStore({ title: 'The review checklist is required.' }, 400);
  }
  const checklist: Record<string, boolean> = {};
  for (const key of CHECKLIST_KEYS) {
    const value = (rawChecklist as Record<string, unknown>)[key];
    if (typeof value !== 'boolean') return jsonNoStore({ title: 'The review checklist is incomplete.' }, 400);
    checklist[key] = value;
  }

  const note = body.note;
  if (note !== undefined && (typeof note !== 'string' || note.length > MAX_NOTE_LENGTH)) {
    return jsonNoStore({ title: 'The reviewer note is invalid.' }, 400);
  }

  const forwarded = typeof note === 'string' && note.trim() ? { checklist, note: note.trim() } : { checklist };
  return forward(`/api/v1/admin/tours/${tourId}/approve`, session.token, {
    method: 'POST',
    body: JSON.stringify(forwarded),
  });
}

/** Rejection: a reason of 1..500 characters is mandatory (BR-115). */
export async function proxyRejectTour(request: Request, tourId: string): Promise<Response> {
  if (!isValidTourId(tourId)) return jsonNoStore({ title: 'A valid tour ID is required.' }, 400);
  if (!isSameOriginRequest(request)) return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  const session = await requireStaff();
  if (!session.ok) return session.response;

  const body = await readJsonObject(request);
  if (!body) return jsonNoStore({ title: 'Invalid JSON.' }, 400);

  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!reason || reason.length > MAX_REASON_LENGTH) {
    return jsonNoStore({ title: 'A rejection reason of at most 500 characters is required.' }, 400);
  }

  return forward(`/api/v1/admin/tours/${tourId}/reject`, session.token, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}