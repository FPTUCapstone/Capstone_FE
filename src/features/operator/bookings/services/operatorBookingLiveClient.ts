/**
 * Live (non-demo) UC-40 calls. The browser only ever talks to the same-origin BFF routes
 * (`/api/operator/bookings`, `/api/operator/bookings/{id}`, `/api/operator/revenue/tours`); every
 * response is validated by `bookingApiParsers` before it is returned, and every failure is reduced to
 * one of the catalogue messages (MSG126 access, MSG31 date range, MSG127 system). No fixture is used here.
 */
import {
  OPERATOR_BOOKING_DEFAULT_PAGE_SIZE,
  type BookingDetailDto,
  type BookingFilterParams,
  type BookingListResult,
} from '../types/bookingLifecycle';
import {
  parseBookingDetailResponse,
  parseBookingListResponse,
  parseBookingTourOptionsResponse,
  type BookingTourOption,
} from '../utils/bookingApiParsers';

export type BookingFailureCode = 'MSG126' | 'MSG127' | 'MSG31';

const LIST_ROUTE = '/api/operator/bookings';
const TOUR_OPTIONS_ROUTE = '/api/operator/revenue/tours';

/** BE/BFF error codes that mean "this operator may not see this" (BR-105 / role / approval). */
const ACCESS_DENIED_CODES: readonly string[] = [
  'UNAUTHENTICATED',
  'operator_tour.access_required',
  'operator_booking.forbidden',
  'operator_booking.not_found',
];

type LiveResponse = { ok: true; body: unknown } | { ok: false; code: BookingFailureCode };

function errorCodeFrom(body: unknown): string | null {
  if (typeof body === 'object' && body !== null && 'errorCode' in body) {
    const code = (body as { errorCode?: unknown }).errorCode;
    return typeof code === 'string' ? code : null;
  }
  return null;
}

function classifyFailure(status: number, body: unknown): BookingFailureCode {
  const errorCode = errorCodeFrom(body);
  if (errorCode === 'operator_booking.invalid_date_range') return 'MSG31';
  if (status === 401 || status === 403 || status === 404) return 'MSG126';
  if (errorCode !== null && ACCESS_DENIED_CODES.includes(errorCode)) return 'MSG126';
  return 'MSG127';
}

async function requestJson(url: string): Promise<LiveResponse> {
  try {
    const response = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, code: classifyFailure(response.status, body) };
    if (body === null) return { ok: false, code: 'MSG127' };
    return { ok: true, body };
  } catch {
    return { ok: false, code: 'MSG127' };
  }
}

/** Maps the screen filters to the BFF query (only meaningful values are sent; `ALL` means no filter). */
export function buildLiveListQuery(params: BookingFilterParams): string {
  const query = new URLSearchParams();
  if (params.tourId && params.tourId !== 'ALL') query.set('tourId', params.tourId);
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.startDate) query.set('departureFrom', params.startDate.slice(0, 10));
  if (params.endDate) query.set('departureTo', params.endDate.slice(0, 10));
  const keyword = params.searchKeyword?.trim();
  if (keyword) query.set('keyword', keyword);
  query.set('pageNumber', String(Math.max(1, params.page || 1)));
  query.set('pageSize', String(Math.max(1, params.pageSize || OPERATOR_BOOKING_DEFAULT_PAGE_SIZE)));
  return query.toString();
}

export async function fetchLiveBookingList(
  params: BookingFilterParams
): Promise<{ ok: true; result: BookingListResult } | { ok: false; code: BookingFailureCode }> {
  const response = await requestJson(`${LIST_ROUTE}?${buildLiveListQuery(params)}`);
  if (!response.ok) return response;
  try {
    return { ok: true, result: parseBookingListResponse(response.body) };
  } catch {
    return { ok: false, code: 'MSG127' };
  }
}

export async function fetchLiveBookingDetail(
  bookingId: string
): Promise<{ ok: true; booking: BookingDetailDto } | { ok: false; code: BookingFailureCode }> {
  const response = await requestJson(`${LIST_ROUTE}/${bookingId}`);
  if (!response.ok) return response;
  try {
    return { ok: true, booking: parseBookingDetailResponse(response.body) };
  } catch {
    return { ok: false, code: 'MSG127' };
  }
}

/** Owned tours for the tour filter. Never throws: a failure only disables the filter. */
export async function fetchLiveTourOptions(): Promise<{ options: BookingTourOption[]; failed: boolean }> {
  const response = await requestJson(TOUR_OPTIONS_ROUTE);
  if (!response.ok) return { options: [], failed: true };
  try {
    return { options: parseBookingTourOptionsResponse(response.body), failed: false };
  } catch {
    return { options: [], failed: true };
  }
}

/** A booking id from the list is always a digit string; anything else is not a live booking. */
export function isLiveBookingId(bookingId: string): boolean {
  return /^\d+$/.test(bookingId);
}
