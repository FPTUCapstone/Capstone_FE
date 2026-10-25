import 'server-only';

import { cookies } from 'next/headers';

import { fetchBackend } from '@/lib/server/backend';
import { isPositiveInt64 } from '@/features/reviews/types/reviewableRecordId';

import { TICKET_STATUSES } from '../types/ticket';
import { InvalidTicketResponseError, parseTicket } from './ticketResponse';

const REFRESH_COOKIE = 'tripmate_refresh';

/**
 * Backend error codes the browser may see (UC-29 contract). Any other code, and any non-JSON body, is
 * reported as the generic MSG127 so an unreviewed server message never reaches the page.
 */
const SAFE_ERROR_CODES = new Set([
  'ticket.unauthorized',
  'ticket.forbidden',
  'ticket.not_found',
  'ticket.booking_not_confirmed',
  'ticket.not_issued',
  'ticket.not_refreshable',
]);

function answer(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function failure(errorCode: string, status: number): Response {
  return answer({ errorCode }, status);
}

/**
 * Exchanges the HttpOnly refresh cookie for a Traveler access token. The token lives only inside this
 * request; the browser never sees it. (The same exchange exists in the other feature proxies; sharing it
 * is out of scope for this task, as in UC-32.)
 */
async function travelerToken(signal: AbortSignal): Promise<string | null> {
  const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refresh) return null;
  const response = await fetchBackend('/api/v1/auth/web/refresh', {
    method: 'POST',
    headers: { Cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refresh)}` },
    signal,
  });
  if (!response.ok) return null;
  const payload: unknown = await response.json().catch(() => null);
  const data = payload && typeof payload === 'object' && 'data' in payload ? payload.data : null;
  if (
    !data ||
    typeof data !== 'object' ||
    !('accessToken' in data) ||
    typeof data.accessToken !== 'string' ||
    !('role' in data) ||
    data.role !== 'Traveler'
  ) {
    return null;
  }
  return data.accessToken;
}

async function upstreamError(upstream: Response): Promise<Response> {
  const payload: unknown = await upstream.json().catch(() => null);
  const source = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const code = typeof source.errorCode === 'string' ? source.errorCode : null;
  if (code && SAFE_ERROR_CODES.has(code)) {
    const status = source.ticketStatus;
    return code === 'ticket.not_refreshable' &&
      typeof status === 'string' &&
      (TICKET_STATUSES as readonly string[]).includes(status)
      ? answer({ errorCode: code, ticketStatus: status }, upstream.status)
      : failure(code, upstream.status);
  }
  if (upstream.status === 401) return failure('UNAUTHENTICATED', 401);
  if (upstream.status === 403) return failure('FORBIDDEN', 403);
  return failure('MSG127', upstream.status >= 500 ? 503 : upstream.status);
}

async function forward(request: Request, id: string, method: 'GET' | 'POST', backendPath: string): Promise<Response> {
  if (!isPositiveInt64(id)) return failure('ticket.not_found', 404);
  try {
    const accessToken = await travelerToken(request.signal);
    if (!accessToken) return failure('UNAUTHENTICATED', 401);
    const upstream = await fetchBackend(backendPath, {
      method,
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: request.signal,
    });
    if (!upstream.ok) return await upstreamError(upstream);
    try {
      return answer(parseTicket(await upstream.text()), 200);
    } catch (error) {
      if (error instanceof InvalidTicketResponseError) return failure('ticket.invalid_response', 502);
      throw error;
    }
  } catch {
    return failure('MSG127', 503);
  }
}

/** `GET /api/v1/traveler/tickets/{ticketId}`: the e-ticket linked from Trip History. */
export function proxyGetTicket(request: Request, ticketId: string): Promise<Response> {
  return forward(request, ticketId, 'GET', `/api/v1/traveler/tickets/${ticketId}`);
}

/** `GET /api/v1/traveler/bookings/{bookingId}/ticket`: the e-ticket opened after a payment. */
export function proxyGetBookingTicket(request: Request, bookingId: string): Promise<Response> {
  return forward(request, bookingId, 'GET', `/api/v1/traveler/bookings/${bookingId}/ticket`);
}

/** `POST /api/v1/traveler/tickets/{ticketId}/qr-code/refresh`: revokes the QR and issues a new one. */
export function proxyRefreshTicketQr(request: Request, ticketId: string): Promise<Response> {
  return forward(request, ticketId, 'POST', `/api/v1/traveler/tickets/${ticketId}/qr-code/refresh`);
}
