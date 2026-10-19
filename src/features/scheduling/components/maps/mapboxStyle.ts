/** Base map of the Web maps: Mapbox data only (no Google data on Mapbox maps, spec §5). */
export const MAPBOX_STYLE = 'mapbox://styles/mapbox/streets-v12';

/**
 * Whether a Mapbox `error` event means the map cannot be used (bad or URL-restricted token, style not
 * loadable) rather than a single tile failing on a working map.
 */
export function isFatalMapError(event: unknown, loaded: boolean): boolean {
  if (!loaded) return true;
  const status = (event as { error?: { status?: unknown } } | null)?.error?.status;
  return status === 401 || status === 403;
}
