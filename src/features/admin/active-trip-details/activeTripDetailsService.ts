import { parseActiveTripDetail, type ActiveTripDetail } from './activeTripDetails';

export class ActiveTripDetailsError extends Error {
  constructor(public readonly status: number) {
    super('Unable to load the active trip details.');
    this.name = 'ActiveTripDetailsError';
  }
}

export async function fetchActiveTripDetails(
  tripId: string,
  signal?: AbortSignal,
): Promise<ActiveTripDetail> {
  let response: Response;
  try {
    response = await fetch(`/api/admin/trips/active/${encodeURIComponent(tripId)}`, {
      signal,
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ActiveTripDetailsError(0);
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new ActiveTripDetailsError(response.status);
  try {
    return parseActiveTripDetail(body);
  } catch {
    throw new ActiveTripDetailsError(0);
  }
}
