import { demoTripDetail, demoTripHistoryPage } from '../data/tripHistoryDemoFixtures';
import { tripReviewEn } from '../resources/en';
import {
  TRIP_HISTORY_PAGE_SIZE,
  TRIP_KINDS,
  type TripDetail,
  type TripHistoryFilter,
  type TripHistoryPage,
  type TripKind,
} from '../types/tripHistoryContract';
import { isTripDemoAllowedInCurrentEnv } from './tripHistoryApi';

const LIST_PATH = '/api/v1/traveler/trips';

export type TripClientErrorKind = 'accessDenied' | 'invalidDateRange' | 'notFound' | 'system';

/** A failure with a message that is safe to show: always one of the canonical resource strings. */
export class TripHistoryClientError extends Error {
  constructor(
    readonly kind: TripClientErrorKind,
    message: string,
    readonly status = 0,
  ) {
    super(message);
    this.name = 'TripHistoryClientError';
  }
}

export interface TripRequestOptions {
  /** `?demo=1`; honoured only outside production with `NEXT_PUBLIC_ENABLE_DEMO_FIXTURES=true`. */
  allowDemo?: boolean;
  signal?: AbortSignal;
}

function demoEnabled(options: TripRequestOptions): boolean {
  return Boolean(options.allowDemo) && isTripDemoAllowedInCurrentEnv();
}

const ACCESS_DENIED_CODES = new Set(['UNAUTHENTICATED', 'FORBIDDEN', 'trip_history.unauthorized', 'trip_history.forbidden']);

async function toError(response: Response, subject: 'history' | 'detail'): Promise<TripHistoryClientError> {
  const payload: unknown = await response.json().catch(() => null);
  const code =
    payload && typeof payload === 'object' && 'errorCode' in payload && typeof payload.errorCode === 'string'
      ? payload.errorCode
      : null;
  const denied = subject === 'history' ? tripReviewEn.errors.tripHistoryAccessDenied : tripReviewEn.errors.tripDetailAccessDenied;

  if (response.status === 401 || response.status === 403 || (code && ACCESS_DENIED_CODES.has(code))) {
    return new TripHistoryClientError('accessDenied', denied, response.status);
  }
  if (code === 'trip_history.invalid_date_range') {
    return new TripHistoryClientError('invalidDateRange', tripReviewEn.validation.invalidDateRange, response.status);
  }
  if (subject === 'detail' && code === 'trip_history.record_not_found') {
    return new TripHistoryClientError('notFound', tripReviewEn.errors.tripRecordUnavailable, response.status);
  }
  return new TripHistoryClientError('system', tripReviewEn.errors.systemError, response.status);
}

function systemError(status = 0): TripHistoryClientError {
  return new TripHistoryClientError('system', tripReviewEn.errors.systemError, status);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isCount(value: unknown, min: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min;
}

/**
 * The BFF has already validated the backend body against the contract; this only guards the browser
 * against a body that is not a trip page at all.
 */
function asPage(value: unknown): TripHistoryPage {
  if (
    !isObject(value) ||
    !Array.isArray(value.items) ||
    !isCount(value.page, 1) ||
    !isCount(value.pageSize, 1) ||
    !isCount(value.totalCount, 0) ||
    !value.items.every(
      (item) => isObject(item) && (TRIP_KINDS as readonly unknown[]).includes(item.kind) && typeof item.id === 'string',
    )
  ) {
    throw systemError();
  }
  return value as unknown as TripHistoryPage;
}

function asDetail(value: unknown, kind: TripKind, id: string): TripDetail {
  if (!isObject(value) || value.kind !== kind || value.id !== id) throw systemError();
  return value as unknown as TripDetail;
}

async function request(path: string, options: TripRequestOptions): Promise<Response> {
  try {
    return await fetch(path, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw systemError();
  }
}

export async function fetchTripHistory(
  filter: TripHistoryFilter,
  options: TripRequestOptions = {},
): Promise<TripHistoryPage> {
  if (demoEnabled(options)) return demoTripHistoryPage(filter);

  const query = new URLSearchParams({ tab: filter.tab });
  if (filter.tripType !== 'All') query.set('tripType', filter.tripType);
  if (filter.fromDate) query.set('fromDate', filter.fromDate);
  if (filter.toDate) query.set('toDate', filter.toDate);
  query.set('page', String(filter.page));
  query.set('pageSize', String(filter.pageSize ?? TRIP_HISTORY_PAGE_SIZE));

  const response = await request(`${LIST_PATH}?${query.toString()}`, options);
  if (!response.ok) throw await toError(response, 'history');
  return asPage(await response.json().catch(() => null));
}

export async function fetchTripDetail(
  kind: TripKind,
  id: string,
  options: TripRequestOptions = {},
): Promise<TripDetail> {
  if (demoEnabled(options)) {
    const demo = demoTripDetail(kind, id);
    if (!demo) {
      throw new TripHistoryClientError('notFound', tripReviewEn.errors.tripRecordUnavailable, 404);
    }
    return demo;
  }

  const response = await request(`${LIST_PATH}/${kind}/${encodeURIComponent(id)}`, options);
  if (!response.ok) throw await toError(response, 'detail');
  return asDetail(await response.json().catch(() => null), kind, id);
}
