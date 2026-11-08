/**
 * Road geometry of one itinerary leg from the Mapbox Directions API (public `pk.` token, called from the
 * browser like the address search). Never throws: a leg that cannot be routed is `null` and the map keeps
 * the straight dashed segment for it.
 *
 * Calls are kept to a minimum: routed legs are remembered in memory and in `sessionStorage` (a reload does
 * not ask again), failed legs are not retried for a few minutes, and a refused token (401/403) stops all
 * further calls for the rest of the page session.
 */

import type { ItineraryRouteLeg, LngLat } from './mapGeometry';

const DIRECTIONS_BASE = 'https://api.mapbox.com/directions/v5/mapbox';
/** Oldest entries go first so a long session cannot grow the caches without bound. */
const MAX_CACHED_LEGS = 200;
/** A failed leg is not asked again for this long (day-tab switches redraw the same legs). */
const FAILURE_TTL_MS = 5 * 60_000;
const STORAGE_KEY = 'tripmate:road-legs:v1';
const MAX_STORED_LEGS = 100;
/** Well under the ~5 MB sessionStorage quota, which other features share. */
const MAX_STORED_CHARS = 500_000;

class DirectionsError extends Error {
  constructor(readonly status: number | null) {
    super(status === null ? 'Directions returned no route' : `Directions ${status}`);
  }
}

// Successful legs; the promise is shared so a repeated leg is never fetched twice at once.
const cache = new Map<string, Promise<LngLat[]>>();
// Failed legs and when they may be tried again.
const failedUntil = new Map<string, number>();
// Routed legs read from / written to sessionStorage (null = not loaded yet).
let stored: Map<string, LngLat[]> | null = null;
// Mapbox refused the token (401/403): asking again cannot help.
let refused = false;

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
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

function storedLegs(): Map<string, LngLat[]> {
  if (stored) return stored;
  stored = new Map();
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      for (const [key, line] of Object.entries(parsed)) {
        if (isLine(line)) stored.set(key, line);
      }
    }
  } catch {
    // Unreadable or corrupt: start empty.
  }
  return stored;
}

function remember(key: string, line: LngLat[]): void {
  const legs = storedLegs();
  legs.delete(key);
  legs.set(key, line);
  while (legs.size > MAX_STORED_LEGS) legs.delete(legs.keys().next().value as string);
  try {
    let json = JSON.stringify(Object.fromEntries(legs));
    // Too big for the budget: drop the oldest legs; a single route over the budget is not stored.
    while (json.length > MAX_STORED_CHARS && legs.size > 0) {
      legs.delete(legs.keys().next().value as string);
      json = JSON.stringify(Object.fromEntries(legs));
    }
    if (legs.size > 0) storage()?.setItem(STORAGE_KEY, json);
  } catch {
    // Storage full or unavailable: the in-memory cache still works.
  }
}

/** Forgets every remembered leg, failure and refusal (memory and sessionStorage). */
export function clearRoadLegCache(): void {
  cache.clear();
  failedUntil.clear();
  stored = null;
  refused = false;
  try {
    storage()?.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
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
  if (!response.ok) throw new DirectionsError(response.status);
  const body = (await response.json()) as { routes?: Array<{ geometry?: { coordinates?: unknown } }> };
  const line = body.routes?.[0]?.geometry?.coordinates;
  if (!isLine(line)) throw new DirectionsError(null);
  return line.map(([lng, lat]) => [lng, lat]);
}

export function fetchRoadLeg(leg: ItineraryRouteLeg, token: string): Promise<LngLat[] | null> {
  const known = cache.get(leg.key);
  if (known) return known.then((line) => line, () => null);

  const saved = storedLegs().get(leg.key);
  if (saved) {
    cache.set(leg.key, Promise.resolve(saved));
    return Promise.resolve(saved);
  }

  if (refused || (failedUntil.get(leg.key) ?? 0) > Date.now()) return Promise.resolve(null);

  const request = requestRoad(leg, token);
  cache.set(leg.key, request);
  if (cache.size > MAX_CACHED_LEGS) cache.delete(cache.keys().next().value as string);
  return request.then(
    (line) => {
      remember(leg.key, line);
      return line;
    },
    (error: unknown) => {
      if (cache.get(leg.key) === request) cache.delete(leg.key);
      failedUntil.set(leg.key, Date.now() + FAILURE_TTL_MS);
      if (failedUntil.size > MAX_CACHED_LEGS) failedUntil.delete(failedUntil.keys().next().value as string);
      if (error instanceof DirectionsError && (error.status === 401 || error.status === 403)) refused = true;
      return null;
    },
  );
}
