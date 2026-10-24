import 'server-only';

import { jsonNoStore } from '@/lib/server/jsonNoStore';
import { fetchBackend } from '@/lib/server/backend';
import { resolveWebSession } from '@/lib/server/webSession';
import { ACTIVE_TRIPS_MESSAGES } from './activeTrips';

const ALLOWED_QUERY_KEYS = new Set([
  'keyword', 'tripType', 'destination', 'startDateFrom', 'startDateTo', 'alertState', 'pageNumber',
]);

const invalidDateRange = {
  errorCode: 'ActiveTrips.InvalidDateRange',
  title: ACTIVE_TRIPS_MESSAGES.invalidDates,
  field: 'dates',
} as const;

const invalidFilter = {
  errorCode: 'ActiveTrips.InvalidFilter',
  title: ACTIVE_TRIPS_MESSAGES.invalidFilter,
  field: 'filters',
} as const;

export async function proxyActiveTrips(request: Request): Promise<Response> {
  const session = await resolveWebSession(request.signal);
  if (!session) return jsonNoStore({ title: 'Administrator sign-in required.' }, 401);

  const source = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  source.forEach((value, key) => {
    if (ALLOWED_QUERY_KEYS.has(key)) query.append(key, value);
  });
  query.set('pageSize', '20');
  const path = `/api/v1/admin/trips/active?${query.toString()}`;

  try {
    const upstream = await fetchBackend(path, {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: `Bearer ${session.accessToken}` },
      signal: request.signal,
    });
    if (upstream.status === 401 || upstream.status === 403) {
      const title = upstream.status === 401
        ? 'Administrator sign-in required.'
        : 'You do not have permission to access this function.';
      return jsonNoStore({ title }, upstream.status);
    }
    if (upstream.status >= 500) {
      return jsonNoStore({ title: 'TripMate is temporarily unable to process your request.' }, 503);
    }
    if (upstream.status === 400) {
      const body: unknown = await upstream.json().catch(() => null);
      const errorCode = body && typeof body === 'object' &&
        (body as { errorCode?: unknown }).errorCode === 'ActiveTrips.InvalidDateRange'
        ? invalidDateRange
        : invalidFilter;
      return jsonNoStore(errorCode, 400);
    }
    if (!upstream.ok) {
      return jsonNoStore({ title: 'TripMate is temporarily unable to process your request.' }, 503);
    }
    const body: unknown = await upstream.json().catch(() => null);
    if (body === null) return jsonNoStore({ title: 'TripMate returned an invalid response.' }, 503);
    return jsonNoStore(body);
  } catch {
    return jsonNoStore({ title: 'TripMate is temporarily unable to process your request.' }, 503);
  }
}
