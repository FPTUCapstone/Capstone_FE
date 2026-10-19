import {
  ACTIVE_TRIPS_PAGE_SIZE,
  parseActiveTripsResponse,
  serializeActiveTripsSearch,
  type ActiveTripsResponse,
  type ActiveTripsSearch,
} from './activeTrips';

export class ActiveTripsError extends Error {
  constructor(
    public readonly status: number,
    public readonly serverMessage?: string,
    public readonly errorCode?: 'ActiveTrips.InvalidDateRange' | 'ActiveTrips.InvalidFilter',
  ) {
    super('Unable to load active trips.');
    this.name = 'ActiveTripsError';
  }
}

export async function fetchActiveTrips(
  search: ActiveTripsSearch,
  signal?: AbortSignal,
): Promise<ActiveTripsResponse> {
  const query = serializeActiveTripsSearch(search);
  query.set('pageSize', String(ACTIVE_TRIPS_PAGE_SIZE));
  let response: Response;
  try {
    response = await fetch(`/api/admin/trips/active?${query.toString()}`, {
      signal,
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ActiveTripsError(0);
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const errorCode = response.status === 400 && body && typeof body === 'object' &&
      ((body as { errorCode?: unknown }).errorCode === 'ActiveTrips.InvalidDateRange' ||
       (body as { errorCode?: unknown }).errorCode === 'ActiveTrips.InvalidFilter')
      ? (body as { errorCode: 'ActiveTrips.InvalidDateRange' | 'ActiveTrips.InvalidFilter' }).errorCode
      : undefined;
    const serverMessage = errorCode && typeof (body as { title?: unknown }).title === 'string'
      ? (body as { title: string }).title
      : undefined;
    throw new ActiveTripsError(response.status, serverMessage, errorCode);
  }
  try {
    return parseActiveTripsResponse(body);
  } catch {
    throw new ActiveTripsError(0);
  }
}
