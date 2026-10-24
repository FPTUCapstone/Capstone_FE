import 'server-only';

import { jsonNoStore } from '@/lib/server/jsonNoStore';
import { fetchBackend } from '@/lib/server/backend';
import { resolveWebSession } from '@/lib/server/webSession';
import { isValidTripId } from './activeTripDetails';

/**
 * UC-59 same-origin proxy. The trip ID must be a canonical decimal string within the
 * signed 64-bit range before the backend is contacted; malformed segments answer 400.
 */
export async function proxyActiveTripDetails(id: string): Promise<Response> {
  if (!isValidTripId(id)) return jsonNoStore({ title: 'The trip reference is invalid.' }, 400);
  const session = await resolveWebSession();
  if (!session) return jsonNoStore({ title: 'Administrator sign-in required.' }, 401);
  try {
    const upstream = await fetchBackend(`/api/v1/admin/trips/active/${id}`, {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: `Bearer ${session.accessToken}` },
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
    const body: unknown = await upstream.json().catch(() => null);
    if (body === null) return jsonNoStore({ title: 'TripMate returned an invalid response.' }, 503);
    return jsonNoStore(body, upstream.status);
  } catch {
    return jsonNoStore({ title: 'TripMate is temporarily unable to process your request.' }, 503);
  }
}
