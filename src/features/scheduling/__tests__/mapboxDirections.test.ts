import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearRoadLegCache, fetchRoadLeg } from '../utils/mapboxDirections';
import type { ItineraryRouteLeg } from '../utils/mapGeometry';

const leg: ItineraryRouteLeg = {
  key: 'driving:108.2,16.05;108.22,16.06',
  from: [108.2, 16.05],
  to: [108.22, 16.06],
  profile: 'driving',
};
const roadLine = [[108.2, 16.05], [108.21, 16.052], [108.22, 16.06]];

const directions = (coordinates: unknown) => ({
  ok: true,
  status: 200,
  json: async () => ({ code: 'Ok', routes: [{ geometry: { type: 'LineString', coordinates } }] }),
});

describe('fetchRoadLeg (Mapbox Directions per leg)', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    clearRoadLegCache();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks the profile of the leg for a full GeoJSON route between its two ends', async () => {
    fetchMock.mockResolvedValue(directions(roadLine));

    const result = await fetchRoadLeg({ ...leg, profile: 'walking' }, 'pk.test');

    expect(result).toEqual(roadLine);
    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.origin + url.pathname).toBe(
      'https://api.mapbox.com/directions/v5/mapbox/walking/108.2,16.05;108.22,16.06',
    );
    expect(url.searchParams.get('geometries')).toBe('geojson');
    expect(url.searchParams.get('overview')).toBe('full');
    expect(url.searchParams.get('access_token')).toBe('pk.test');
  });

  it.each([
    ['an HTTP error (restricted token, too long, rate limit)', () => fetchMock.mockResolvedValue({ ok: false, status: 403, json: async () => ({}) })],
    ['a network failure', () => fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))],
    ['no route found', () => fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ code: 'NoRoute', routes: [] }) })],
    ['a geometry that is not a coordinate list', () => fetchMock.mockResolvedValue(directions('oops'))],
    ['a geometry with fewer than two points', () => fetchMock.mockResolvedValue(directions([[108.2, 16.05]]))],
    ['non-numeric coordinates', () => fetchMock.mockResolvedValue(directions([[108.2, 'x'], [108.3, 16.1]]))],
    ['a body that is not JSON', () => fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => { throw new SyntaxError('bad'); } })],
  ])('gives null for %s', async (_name, arrange) => {
    arrange();

    await expect(fetchRoadLeg(leg, 'pk.test')).resolves.toBeNull();
  });

  it('asks Mapbox once for a leg that is wanted again, even while the first answer is pending', async () => {
    fetchMock.mockResolvedValue(directions(roadLine));

    const [first, second] = await Promise.all([fetchRoadLeg(leg, 'pk.test'), fetchRoadLeg(leg, 'pk.test')]);
    const third = await fetchRoadLeg({ ...leg }, 'pk.test');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect([first, second, third]).toEqual([roadLine, roadLine, roadLine]);
  });

  it('does not remember a failed leg, so a later draw can try again', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    fetchMock.mockResolvedValueOnce(directions(roadLine));

    expect(await fetchRoadLeg(leg, 'pk.test')).toBeNull();
    expect(await fetchRoadLeg(leg, 'pk.test')).toEqual(roadLine);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
