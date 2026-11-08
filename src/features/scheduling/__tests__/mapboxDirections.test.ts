import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearRoadLegCache, fetchRoadLeg } from '../utils/mapboxDirections';
import type { ItineraryRouteLeg } from '../utils/mapGeometry';

type RoadLegInput = Pick<ItineraryRouteLeg, 'key' | 'from' | 'to' | 'profile'>;

const leg: RoadLegInput = {
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

  describe('remembering failures (A)', () => {
    const other: RoadLegInput = {
      key: 'driving:108.3,16.1;108.31,16.11',
      from: [108.3, 16.1],
      to: [108.31, 16.11],
      profile: 'driving',
    };
    const denied = { ok: false, status: 403, json: async () => ({}) };

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-11-08T08:00:00Z'));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('does not ask again for a failed leg until a few minutes have passed', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      fetchMock.mockResolvedValueOnce(directions(roadLine));

      expect(await fetchRoadLeg(leg, 'pk.test')).toBeNull();
      vi.advanceTimersByTime(60_000);
      expect(await fetchRoadLeg(leg, 'pk.test')).toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(5 * 60_000);
      expect(await fetchRoadLeg(leg, 'pk.test')).toEqual(roadLine);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it.each([401, 403])('stops calling Directions for every other leg after a %i', async (status) => {
      fetchMock.mockResolvedValue({ ok: false, status, json: async () => ({}) });

      expect(await fetchRoadLeg(leg, 'pk.test')).toBeNull();
      vi.advanceTimersByTime(60 * 60_000);
      expect(await fetchRoadLeg(other, 'pk.test')).toBeNull();
      expect(await fetchRoadLeg(leg, 'pk.test')).toBeNull();

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('keeps asking for other legs after an ordinary failure such as 422', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 422, json: async () => ({}) });
      fetchMock.mockResolvedValueOnce(directions(roadLine));

      expect(await fetchRoadLeg(leg, 'pk.test')).toBeNull();
      expect(await fetchRoadLeg(other, 'pk.test')).toEqual(roadLine);
    });

    it('still serves a leg routed before Directions was refused', async () => {
      fetchMock.mockResolvedValueOnce(directions(roadLine));
      fetchMock.mockResolvedValueOnce(denied);

      await fetchRoadLeg(leg, 'pk.test');
      await fetchRoadLeg(other, 'pk.test');

      expect(await fetchRoadLeg(leg, 'pk.test')).toEqual(roadLine);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('remembering routed legs across page loads (B)', () => {
    const STORAGE_KEY = 'tripmate:road-legs:v1';

    /** A page load: the module state is gone, sessionStorage is kept. */
    async function reloadedModule() {
      vi.resetModules();
      return import('../utils/mapboxDirections');
    }

    it('does not call Mapbox again for a leg routed before the page was reloaded', async () => {
      fetchMock.mockResolvedValue(directions(roadLine));
      await fetchRoadLeg(leg, 'pk.test');

      const reloaded = await reloadedModule();

      expect(await reloaded.fetchRoadLeg({ ...leg }, 'pk.test')).toEqual(roadLine);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('does not store failed legs', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
      await fetchRoadLeg(leg, 'pk.test');
      const reloaded = await reloadedModule();
      fetchMock.mockResolvedValue(directions(roadLine));

      expect(await reloaded.fetchRoadLeg(leg, 'pk.test')).toEqual(roadLine);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it.each([
      ['not JSON', 'not json'],
      ['not an object', '[1,2,3]'],
      ['a leg without a usable line', JSON.stringify({ [leg.key]: [[108.2, 'x']] })],
    ])('ignores stored data that is %s', async (_name, stored) => {
      sessionStorage.setItem(STORAGE_KEY, stored);
      fetchMock.mockResolvedValue(directions(roadLine));

      expect(await fetchRoadLeg(leg, 'pk.test')).toEqual(roadLine);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('keeps working when sessionStorage cannot be read or written', async () => {
      const broken = {
        getItem: () => { throw new Error('SecurityError'); },
        setItem: () => { throw new DOMException('full', 'QuotaExceededError'); },
        removeItem: () => {},
      };
      vi.stubGlobal('sessionStorage', broken);
      fetchMock.mockResolvedValue(directions(roadLine));

      expect(await fetchRoadLeg(leg, 'pk.test')).toEqual(roadLine);
    });

    it('keeps only the newest legs once there are too many to store', async () => {
      fetchMock.mockImplementation(async () => directions(roadLine));
      const legAt = (n: number): RoadLegInput => ({
        key: `driving:108,${n};108,${n + 1}`,
        from: [108, n],
        to: [108, n + 1],
        profile: 'driving',
      });
      for (let n = 0; n < 130; n += 1) await fetchRoadLeg(legAt(n), 'pk.test');

      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>;

      expect(Object.keys(stored)).toHaveLength(100);
      expect(stored[legAt(129).key]).toBeDefined();
      expect(stored[legAt(0).key]).toBeUndefined();
    });

    it('does not store a route that is too big, but still returns it', async () => {
      const huge = Array.from({ length: 40_000 }, (_, n) => [108 + n / 1e6, 16 + n / 1e6]);
      fetchMock.mockResolvedValue(directions(huge));

      expect(await fetchRoadLeg(leg, 'pk.test')).toHaveLength(40_000);
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
});
