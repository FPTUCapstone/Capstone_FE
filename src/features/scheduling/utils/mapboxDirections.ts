/**
 * Road geometry of one itinerary leg from the Mapbox Directions API (public `pk.` token, called from the
 * browser like the address search). Never throws: a leg that cannot be routed is `null` and the map keeps
 * the straight dashed segment for it.
 */

import type { ItineraryRouteLeg, LngLat } from './mapGeometry';

const DIRECTIONS_BASE = 'https://api.mapbox.com/directions/v5/mapbox';
/** Oldest entries go first so a long session cannot grow the cache without bound. */
const MAX_CACHED_LEGS = 200;

// Only successful legs stay cached; the promise is shared so a repeated leg is never fetched twice.
const cache = new Map<string, Promise<LngLat[]>>();

export function clearRoadLegCache(): void {
  cache.clear();
}

function isLine(value: unknown): value is LngLat[] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    value.every(
      (point) =>
        Array.isArray(point) &&
        point.length >= 2 &&
        Number.isFinite(point[0]) &&
        Number.isFinite(point[1]),
    )
  );
}

async function requestRoad(leg: ItineraryRouteLeg, token: string): Promise<LngLat[]> {
  const coordinates = `${leg.from[0]},${leg.from[1]};${leg.to[0]},${leg.to[1]}`;
  const search = new URLSearchParams({
    geometries: 'geojson',
    overview: 'full',
    alternatives: 'false',
    access_token: token,
  });
  const response = await fetch(`${DIRECTIONS_BASE}/${leg.profile}/${coordinates}?${search}`);
  if (!response.ok) throw new Error(`Directions ${response.status}`);
  const body = (await response.json()) as { routes?: Array<{ geometry?: { coordinates?: unknown } }> };
  const line = body.routes?.[0]?.geometry?.coordinates;
  if (!isLine(line)) throw new Error('Directions returned no route');
  return line.map(([lng, lat]) => [lng, lat]);
}

export function fetchRoadLeg(leg: ItineraryRouteLeg, token: string): Promise<LngLat[] | null> {
  let pending = cache.get(leg.key);
  if (!pending) {
    const request = requestRoad(leg, token);
    pending = request;
    cache.set(leg.key, request);
    if (cache.size > MAX_CACHED_LEGS) cache.delete(cache.keys().next().value as string);
    request.catch(() => {
      if (cache.get(leg.key) === request) cache.delete(leg.key);
    });
  }
  return pending.then(
    (line) => line,
    () => null,
  );
}
