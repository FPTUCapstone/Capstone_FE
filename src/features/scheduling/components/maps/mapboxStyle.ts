import { MARKER_COLORS } from '../../utils/mapGeometry';

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

/** Road legs shade from the start colour to the colour of the end marker, in visiting order. */
export const ROUTE_START_COLOR = '#006B5F';
export const ROUTE_END_COLOR = MARKER_COLORS.end;

const channelsOf = (hex: string) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));

/** Colour at progress `t` (0 = start, 1 = end, clamped) of the start → end ramp, as lowercase `#rrggbb`. */
export function routeColorAt(t: number): string {
  const progress = Math.min(1, Math.max(0, t));
  const from = channelsOf(ROUTE_START_COLOR);
  const to = channelsOf(ROUTE_END_COLOR);
  const mixed = from.map((channel, index) => Math.round(channel + (to[index] - channel) * progress));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

/** Colour of leg `index` among `count` legs; a leg keeps its colour even when another leg has no road. */
export const legColor = (index: number, count: number) => routeColorAt(count <= 1 ? 0 : index / (count - 1));

/** Direction chevron along the road, drawn into a raw bitmap at runtime (no image file, no canvas). */
export const CHEVRON_IMAGE = 'itinerary-chevron';
export const CHEVRON_IMAGE_SIZE = 32;

function distanceToSegment(px: number, py: number, [ax, ay]: number[], [bx, by]: number[]): number {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** A white "›" pointing along +x (Mapbox turns it to follow the line), antialiased on a transparent bitmap. */
export function createChevronImage(): { width: number; height: number; data: Uint8ClampedArray } {
  const size = CHEVRON_IMAGE_SIZE;
  const data = new Uint8ClampedArray(size * size * 4);
  const tail: number[] = [9, 6.5];
  const tip: number[] = [22, 16];
  const wing: number[] = [9, 25.5];
  const halfThickness = 2.5;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const distance = Math.min(
        distanceToSegment(x + 0.5, y + 0.5, tail, tip),
        distanceToSegment(x + 0.5, y + 0.5, tip, wing),
      );
      const coverage = Math.min(1, Math.max(0, halfThickness + 0.5 - distance));
      if (coverage > 0) data.set([255, 255, 255, Math.round(coverage * 255)], (y * size + x) * 4);
    }
  }
  return { width: size, height: size, data };
}

/** Leg picked in the timeline: brand accent (DESIGN.md `accent`), drawn above everything else. */
export const ROUTE_SELECTED_COLOR = '#B96D4C';
/** Opacity of the other legs while one leg is selected, and the normal values they return to. */
export const DIMMED_OPACITY = 0.25;
export const DIMMED_GLOW_OPACITY = 0.08;
export const DIMMED_STRAIGHT_OPACITY = 0.2;
export const GLOW_OPACITY = 0.3;
