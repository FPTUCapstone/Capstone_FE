import {
  ACTIVE_TRIPS_PAGE_SIZE,
  parseActiveTripsResponse,
  serializeActiveTripsSearch,
  type ActiveTripsResponse,
  type ActiveTripsSearch,
} from './activeTrips';

export class ActiveTripsError extends Error {
  constructor(public readonly status: number, public readonly serverMessage?: string) {
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
    const serverMessage = body && typeof body === 'object' && typeof (body as { title?: unknown }).title === 'string'
      ? (body as { title: string }).title
      : undefined;
    throw new ActiveTripsError(response.status, serverMessage);
  }
  try {
    return parseActiveTripsResponse(body);
  } catch {
    throw new ActiveTripsError(0);
  }
}
