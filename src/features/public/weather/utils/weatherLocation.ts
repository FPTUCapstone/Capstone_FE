import {
  DEFAULT_TIME_ZONE_ID,
  DEFAULT_WEATHER_LOCATION,
  SUGGESTED_LOCATIONS,
} from '../data/suggestedLocations';
import type { WeatherCoordinates, WeatherLocation } from '../types/weatherForecast';

/** Vietnam bounding box enforced by Capstone_BE `GET /api/v1/weather/forecast`. */
export const VIETNAM_BOUNDS = {
  minLat: 6,
  maxLat: 24,
  minLon: 102,
  maxLon: 118,
} as const;

export const OUT_OF_VIETNAM_ERROR_MESSAGE = 'Chỉ hỗ trợ địa điểm trong Việt Nam.';

const SUGGESTED_MATCH_EPSILON = 0.015;

export function isWithinVietnamBounds(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= VIETNAM_BOUNDS.minLat &&
    latitude <= VIETNAM_BOUNDS.maxLat &&
    longitude >= VIETNAM_BOUNDS.minLon &&
    longitude <= VIETNAM_BOUNDS.maxLon
  );
}

export function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

export function weatherCoordinateKey(coords: WeatherCoordinates): string {
  return `${roundCoordinate(coords.latitude)},${roundCoordinate(coords.longitude)}`;
}

export function findMatchingSuggestedLocation(
  coords: WeatherCoordinates,
  name?: string | null,
): WeatherLocation | null {
  const trimmedName = name?.trim().toLowerCase() ?? '';
  for (const location of SUGGESTED_LOCATIONS) {
    const closeEnough =
      Math.abs(location.latitude - coords.latitude) < SUGGESTED_MATCH_EPSILON &&
      Math.abs(location.longitude - coords.longitude) < SUGGESTED_MATCH_EPSILON;
    if (!closeEnough) continue;
    if (!trimmedName || location.name.toLowerCase() === trimmedName) {
      return location;
    }
  }
  return null;
}

export interface SearchParamsLike {
  get(name: string): string | null;
}

function parseFiniteParam(raw: string | null): number | null {
  if (!raw || !raw.trim()) return null;
  const parsed = Number(raw.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseWeatherLocationFromSearchParams(
  params: SearchParamsLike,
): WeatherLocation {
  const latitude = parseFiniteParam(params.get('lat'));
  const longitude = parseFiniteParam(params.get('lon'));
  if (latitude === null || longitude === null || !isWithinVietnamBounds(latitude, longitude)) {
    return DEFAULT_WEATHER_LOCATION;
  }

  const rawName = params.get('name')?.trim() ?? '';
  const suggested = findMatchingSuggestedLocation({ latitude, longitude }, rawName);
  if (suggested) return suggested;

  return {
    name: rawName || `${latitude.toFixed(2)}°B, ${longitude.toFixed(2)}°Đ`,
    latitude,
    longitude,
    timeZoneId: DEFAULT_TIME_ZONE_ID,
  };
}

export function buildWeatherLocationQuery(
  location: Pick<WeatherLocation, 'latitude' | 'longitude' | 'name'>,
): string {
  const lat = String(roundCoordinate(location.latitude));
  const lon = String(roundCoordinate(location.longitude));
  const name = location.name.trim();
  const base = `lat=${lat}&lon=${lon}`;
  return name ? `${base}&name=${encodeURIComponent(name)}` : base;
}
