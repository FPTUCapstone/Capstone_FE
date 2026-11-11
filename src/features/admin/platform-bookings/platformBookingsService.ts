import { parsePlatformBookingsResponse, serializePlatformBookingsSearch, type PlatformBookingsResponse, type PlatformBookingsSearch } from './platformBookings';

export class PlatformBookingsError extends Error {
  constructor(public readonly status: number, public readonly messageFromServer?: string) { super('Unable to load platform bookings.'); }
}

export async function fetchPlatformBookings(search: PlatformBookingsSearch, signal?: AbortSignal): Promise<PlatformBookingsResponse> {
  try {
    const query = serializePlatformBookingsSearch(search).toString();
    const response = await fetch(`/api/admin/bookings${query ? `?${query}` : ''}`, { signal, credentials: 'same-origin', headers: { Accept: 'application/json' } });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) throw new PlatformBookingsError(response.status, body && typeof body === 'object' && typeof (body as { title?: unknown }).title === 'string' ? (body as { title: string }).title : undefined);
    return parsePlatformBookingsResponse(body);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    if (error instanceof PlatformBookingsError) throw error;
    throw new PlatformBookingsError(0);
  }
}
