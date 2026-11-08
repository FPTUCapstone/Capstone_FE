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

/** Itinerary route line: brand primary (DESIGN.md `primary`), with a white casing under road segments. */
export const ROUTE_LINE_COLOR = '#174B4A';
export const ROUTE_CASING_COLOR = '#FFFFFF';
/** Straight estimates are the same colour, dashed and fainter than the road. */
export const STRAIGHT_LINE_OPACITY = 0.55;

/** Line width in pixels that grows with the zoom level: `[zoom, width]` stops. */
export function widthByZoom(stops: ReadonlyArray<readonly [number, number]>) {
  return ['interpolate', ['linear'], ['zoom'], ...stops.flat()];
}
