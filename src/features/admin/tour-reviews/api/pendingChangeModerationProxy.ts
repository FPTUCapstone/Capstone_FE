import 'server-only';

import { isSameOriginRequest, jsonNoStore } from '@/lib/server/adminSession';

import {
  forward,
  isValidPositiveIntegerId,
  MAX_REASON_LENGTH,
  readJsonObject,
  requireStaff,
} from './tourModerationProxy';

/** TM-82 §5.6: the queue is always served 20 records per page; the client cannot change it. */
export const MODERATION_QUEUE_SERVER_PAGE_SIZE = 20;

/**
 * TM-82's combined Staff queue (first-time submissions + draft versions, tagged `kind`). Additive
 * alongside the existing `proxyPendingTours` — it does not replace it.
 */
export async function proxyModerationQueue(request: Request): Promise<Response> {
  const session = await requireStaff();
  if (!session.ok) return session.response;

  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  const page = incoming.get('page');
  if (page !== null) query.set('page', page);
  query.set('pageSize', String(MODERATION_QUEUE_SERVER_PAGE_SIZE));

  return forward(`/api/v1/admin/tours/moderation-queue?${query}`, session.token, {
    method: 'GET',
    signal: request.signal,
  });
}

/** Staff's detail view of a draft version's proposed values (spec TM-82 §5.2). */
export async function proxyPendingChangeDetail(request: Request, pendingChangeId: string): Promise<Response> {
  if (!isValidPositiveIntegerId(pendingChangeId)) {
    return jsonNoStore({ title: 'A valid pending-change ID is required.' }, 400);
  }
  const session = await requireStaff();
  if (!session.ok) return session.response;

  return forward(`/api/v1/admin/tours/pending-changes/${pendingChangeId}`, session.token, {
    method: 'GET',
    signal: request.signal,
  });
}

/** The live tour's current values, fetched alongside the draft version's proposed ones for the diff view. */
export async function proxyLiveTourForDiff(request: Request, tourId: string): Promise<Response> {
  if (!isValidPositiveIntegerId(tourId)) {
    return jsonNoStore({ title: 'A valid tour ID is required.' }, 400);
  }
  const session = await requireStaff();
  if (!session.ok) return session.response;

  return forward(`/api/v1/admin/tours/${tourId}`, session.token, {
    method: 'GET',
    signal: request.signal,
  });
}

/** Approving a draft version takes no body — unlike first-time-submission approval, there is no checklist. */
export async function proxyApproveDraftVersion(request: Request, pendingChangeId: string): Promise<Response> {
  if (!isValidPositiveIntegerId(pendingChangeId)) {
    return jsonNoStore({ title: 'A valid pending-change ID is required.' }, 400);
  }
  if (!isSameOriginRequest(request)) return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  const session = await requireStaff();
  if (!session.ok) return session.response;

  return forward(`/api/v1/admin/tours/pending-changes/${pendingChangeId}/approve`, session.token, {
    method: 'POST',
  });
}

/** Rejecting a draft version: a reason of 1..500 characters is mandatory (BR-115, same rule as first-time rejection). */
export async function proxyRejectDraftVersion(request: Request, pendingChangeId: string): Promise<Response> {
  if (!isValidPositiveIntegerId(pendingChangeId)) {
    return jsonNoStore({ title: 'A valid pending-change ID is required.' }, 400);
  }
  if (!isSameOriginRequest(request)) return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  const session = await requireStaff();
  if (!session.ok) return session.response;

  const body = await readJsonObject(request);
  if (!body) return jsonNoStore({ title: 'Invalid JSON.' }, 400);

  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!reason || reason.length > MAX_REASON_LENGTH) {
    return jsonNoStore({ title: `A rejection reason of at most ${MAX_REASON_LENGTH} characters is required.` }, 400);
  }

  return forward(`/api/v1/admin/tours/pending-changes/${pendingChangeId}/reject`, session.token, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
