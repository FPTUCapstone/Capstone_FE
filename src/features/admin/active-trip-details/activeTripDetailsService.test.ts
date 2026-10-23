import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchActiveTripDetails, ActiveTripDetailsError } from './activeTripDetailsService';
import { parseActiveTripDetail } from './activeTripDetails';

const payload = {
  tripId: '42', tripCode: 'TRIP-42', tripType: 'Tour', currentState: 'Navigating',
  groupOrTraveler: 'Solo', destination: null, startedAtUtc: '2026-09-25T17:00:00Z',
  lastSyncedAtUtc: null, currentDay: 2, members: 1, openAlerts: 0, groupPanel: null,
  currentLocation: null, itineraryProgress: [], stateHistory: [], incidents: [],
  reroutingEvents: [], locationTrail: [],
};

afterEach(() => vi.unstubAllGlobals());

describe('active trip details service', () => {
  it('calls the same-origin proxy without a bearer token and parses the payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(payload));
    vi.stubGlobal('fetch', fetchMock);
    const detail = await fetchActiveTripDetails('42');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/trips/active/42');
    expect(init.credentials).toBe('same-origin');
    expect(init.headers).toEqual({ Accept: 'application/json' });
    expect(detail).toEqual(parseActiveTripDetail(payload));
  });

  it.each([400, 401, 403, 404, 503])('preserves upstream status %i', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })));
    await expect(fetchActiveTripDetails('42')).rejects.toMatchObject({ status });
  });

  it('maps network failure and malformed success payloads to the unavailable status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('failed')));
    await expect(fetchActiveTripDetails('42')).rejects.toBeInstanceOf(ActiveTripDetailsError);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ broken: true })));
    await expect(fetchActiveTripDetails('42')).rejects.toMatchObject({ status: 0 });
  });
});
