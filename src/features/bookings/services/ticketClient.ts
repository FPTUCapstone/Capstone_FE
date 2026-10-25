import { DEMO_TICKET_VIEW } from '../data/bookingDemoFixtures';
import { ticketMessages } from '../resources/ticketMessages';
import { TICKET_STATUSES, type TicketStatus, type TicketView } from '../types/ticket';
import { isBookingDemoAllowedInCurrentEnv } from './bookingApi';

export type TicketKey = { ticketId: string } | { bookingId: string };

export type TicketClientErrorKind = 'signIn' | 'forbidden' | 'notFound' | 'notConfirmed' | 'notRefreshable' | 'system';

/** A failure whose message is always one of the reviewed UC-29 strings. */
export class TicketClientError extends Error {
  constructor(
    readonly kind: TicketClientErrorKind,
    message: string,
    readonly status = 0,
    readonly ticketStatus?: TicketStatus,
  ) {
    super(message);
    this.name = 'TicketClientError';
  }
}

export interface TicketRequestOptions {
  /** `?demo=1`; honoured only outside production with `NEXT_PUBLIC_ENABLE_DEMO_FIXTURES=true`. */
  allowDemo?: boolean;
  signal?: AbortSignal;
}

const SIGN_IN_CODES = new Set(['UNAUTHENTICATED', 'ticket.unauthorized']);
const FORBIDDEN_CODES = new Set(['FORBIDDEN', 'ticket.forbidden']);

let demoRotation = 0;

function isStatus(value: unknown): value is TicketStatus {
  return typeof value === 'string' && (TICKET_STATUSES as readonly string[]).includes(value);
}

function systemError(status = 0): TicketClientError {
  return new TicketClientError('system', ticketMessages.msg127, status);
}

async function toError(response: Response): Promise<TicketClientError> {
  const payload: unknown = await response.json().catch(() => null);
  const source = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const code = typeof source.errorCode === 'string' ? source.errorCode : null;
  const status = response.status;

  if (status === 401 || (code && SIGN_IN_CODES.has(code))) {
    return new TicketClientError('signIn', ticketMessages.signIn, status);
  }
  if (status === 403 || (code && FORBIDDEN_CODES.has(code))) {
    return new TicketClientError('forbidden', ticketMessages.msg126, status);
  }
  if (code === 'ticket.not_found') return new TicketClientError('notFound', ticketMessages.notFound, status);
  if (code === 'ticket.booking_not_confirmed') {
    return new TicketClientError('notConfirmed', ticketMessages.msg138, status);
  }
  if (code === 'ticket.not_refreshable') {
    return new TicketClientError(
      'notRefreshable',
      ticketMessages.msg127,
      status,
      isStatus(source.ticketStatus) ? source.ticketStatus : undefined,
    );
  }
  return systemError(status);
}

/** The BFF has validated the Backend body; this only guards against a body that is not a ticket at all. */
function asTicket(value: unknown): TicketView {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    typeof (value as Record<string, unknown>).ticketId !== 'string' ||
    !isStatus((value as Record<string, unknown>).ticketStatus) ||
    !('qr' in value)
  ) {
    throw systemError();
  }
  return value as TicketView;
}

async function send(path: string, method: 'GET' | 'POST', options: TicketRequestOptions): Promise<TicketView> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw systemError();
  }
  if (!response.ok) throw await toError(response);
  return asTicket(await response.json().catch(() => null));
}

function demoEnabled(options: TicketRequestOptions): boolean {
  return Boolean(options.allowDemo) && isBookingDemoAllowedInCurrentEnv();
}

/** UC-29 view by ticket (Trip History) or by booking (payment result). */
export function fetchTicket(key: TicketKey, options: TicketRequestOptions = {}): Promise<TicketView> {
  if (demoEnabled(options)) return Promise.resolve({ ...DEMO_TICKET_VIEW });
  const path =
    'ticketId' in key
      ? `/api/v1/traveler/tickets/${encodeURIComponent(key.ticketId)}`
      : `/api/v1/traveler/bookings/${encodeURIComponent(key.bookingId)}/ticket`;
  return send(path, 'GET', options);
}

/** [Refresh QR Code]: the previous QR stops working at check-in. */
export function refreshTicketQr(ticketId: string, options: TicketRequestOptions = {}): Promise<TicketView> {
  if (demoEnabled(options)) {
    demoRotation += 1;
    return Promise.resolve({
      ...DEMO_TICKET_VIEW,
      qr: { content: `TM1.DEMO-NOT-A-REAL-TICKET-${demoRotation}.DEMO`, issuedAtUtc: new Date().toISOString() },
    });
  }
  return send(`/api/v1/traveler/tickets/${encodeURIComponent(ticketId)}/qr-code/refresh`, 'POST', options);
}
