/**
 * Map data for the Web maps (Review 2, D9): the exploration-radius circle of the create form and the
 * numbered stops + straight route of an itinerary. Pure: the Mapbox components only draw this.
 */

import type { GeoPoint } from '../services/placeSearchApi';
import type { ItineraryDetailDto, TransportMode } from '../types/schedulingTypes';

/** [longitude, latitude] as GeoJSON expects. */
export type LngLat = [number, number];

const EARTH_RADIUS_KM = 6371.0088;

/** A geodesic circle as a GeoJSON polygon (closed ring, `steps` + 1 points, starting due north). */
export function circlePolygon(
  center: GeoPoint,
  radiusKm: number,
  steps = 64,
): { type: 'Polygon'; coordinates: LngLat[][] } {
  const lat = (center.latitude * Math.PI) / 180;
  const lng = (center.longitude * Math.PI) / 180;
  const angular = radiusKm / EARTH_RADIUS_KM;
  const ring: LngLat[] = [];
  for (let step = 0; step < steps; step += 1) {
    const bearing = (2 * Math.PI * step) / steps;
    const pointLat = Math.asin(
      Math.sin(lat) * Math.cos(angular) + Math.cos(lat) * Math.sin(angular) * Math.cos(bearing),
    );
    const pointLng =
      lng +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angular) * Math.cos(lat),
        Math.cos(angular) - Math.sin(lat) * Math.sin(pointLat),
      );
    ring.push([(pointLng * 180) / Math.PI, (pointLat * 180) / Math.PI]);
  }
  ring.push(ring[0]);
  return { type: 'Polygon', coordinates: [ring] };
}

export type MapMarkerKind = 'start' | 'end' | 'attraction' | 'food';

export const MARKER_COLORS: Record<MapMarkerKind, string> = {
  start: '#1C2928',
  end: '#7c3aed',
  attraction: '#103B39',
  food: '#d97706',
};

export const MARKER_TITLES: Record<MapMarkerKind, string> = {
  start: 'Điểm xuất phát',
  end: 'Điểm kết thúc',
  attraction: 'Điểm tham quan',
  food: 'Quán ăn',
};

export interface ItineraryMapMarker {
  key: string;
  kind: MapMarkerKind;
  label: string;
  title: string;
  color: string;
  position: LngLat;
  /** Timeline item this marker stands for (null for start/end). */
  itemId: number | null;
}

/** Mapbox Directions profile of a leg. Mapbox has no motorbike/transit profile: those drive. */
export type RouteProfile = 'walking' | 'driving';

/** One hop between two consecutive points of the route; drawn along real roads when Directions answers. */
export interface ItineraryRouteLeg {
  /** Profile + rounded ends: identifies the leg for caching. */
  key: string;
  /** `${fromKey}>${toKey}`: identifies the leg for selection (timeline ↔ map). */
  id: string;
  /** Key of the marker at each end: `start`, `item-<itemId>` or `end`. */
  fromKey: string;
  toKey: string;
  from: LngLat;
  to: LngLat;
  profile: RouteProfile;
}

export interface ItineraryMapModel {
  markers: ItineraryMapMarker[];
  route: { type: 'LineString'; coordinates: LngLat[] };
  legs: ItineraryRouteLeg[];
}

/** Id of the leg between two consecutive stops, as the timeline and the map both know it. */
export const legIdBetweenItems = (fromItemId: number, toItemId: number) => `item-${fromItemId}>item-${toItemId}`;

const profileOf = (mode: TransportMode | null | undefined): RouteProfile =>
  mode === 'Walking' ? 'walking' : 'driving';

const roundedPoint = (point: LngLat) => `${Number(point[0].toFixed(5))},${Number(point[1].toFixed(5))}`;

interface RoutePoint {
  key: string;
  position: LngLat;
  mode: TransportMode | null | undefined;
}

function buildLegs(points: RoutePoint[]): ItineraryRouteLeg[] {
  const legs: ItineraryRouteLeg[] = [];
  for (let index = 1; index < points.length; index += 1) {
    const { position: from, key: fromKey } = points[index - 1];
    const { position: to, mode, key: toKey } = points[index];
    if (samePlace(from, to)) continue;
    const profile = profileOf(mode);
    legs.push({
      key: `${profile}:${roundedPoint(from)};${roundedPoint(to)}`,
      id: `${fromKey}>${toKey}`,
      fromKey,
      toKey,
      from,
      to,
      profile,
    });
  }
  return legs;
}

const samePlace = (a: LngLat, b: LngLat) =>
  Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;

export function buildItineraryMapModel(
  itinerary: Pick<ItineraryDetailDto, 'items'> &
    Partial<Pick<ItineraryDetailDto, 'startLocation' | 'endLocation' | 'transportMode'>>,
): ItineraryMapModel {
  const stops: ItineraryMapMarker[] = [];
  const itemModes = new Map<string, TransportMode | null | undefined>();
  for (const item of itinerary.items) {
    if (typeof item.latitude !== 'number' || typeof item.longitude !== 'number') continue;
    const kind: MapMarkerKind = item.costKind === 'AverageSpend' ? 'food' : 'attraction';
    stops.push({
      key: `item-${item.itemId}`,
      kind,
      label: String(item.sequenceNo),
      title: item.poiName ?? MARKER_TITLES[kind],
      color: MARKER_COLORS[kind],
      position: [item.longitude, item.latitude],
      itemId: item.itemId,
    });
    itemModes.set(`item-${item.itemId}`, item.transportModeFromPrevious);
  }
  if (stops.length === 0) return { markers: [], route: { type: 'LineString', coordinates: [] }, legs: [] };

  const markers: ItineraryMapMarker[] = [];
  const route: LngLat[] = [];
  const points: RoutePoint[] = [];
  const start = itinerary.startLocation;
  const startPosition: LngLat | null = start ? [start.longitude, start.latitude] : null;
  if (start && startPosition) {
    markers.push({
      key: 'start',
      kind: 'start',
      label: 'B',
      title: start.address ?? MARKER_TITLES.start,
      color: MARKER_COLORS.start,
      position: startPosition,
      itemId: null,
    });
    route.push(startPosition);
    points.push({ key: 'start', position: startPosition, mode: null });
  }
  markers.push(...stops);
  route.push(...stops.map((stop) => stop.position));
  for (const stop of stops) {
    const mode = itemModes.get(stop.key) ?? itinerary.transportMode;
    points.push({ key: stop.key, position: stop.position, mode });
  }

  const end = itinerary.endLocation;
  if (end) {
    const endPosition: LngLat = [end.longitude, end.latitude];
    // A trip that returns to the start keeps one marker; the route still closes the loop.
    if (!startPosition || !samePlace(startPosition, endPosition)) {
      markers.push({
        key: 'end',
        kind: 'end',
        label: 'K',
        title: end.address ?? MARKER_TITLES.end,
        color: MARKER_COLORS.end,
        position: endPosition,
        itemId: null,
      });
    }
    route.push(endPosition);
    const endsAtStart = startPosition !== null && samePlace(startPosition, endPosition);
    points.push({ key: endsAtStart ? 'start' : 'end', position: endPosition, mode: itinerary.transportMode });
  }
  return { markers, route: { type: 'LineString', coordinates: route }, legs: buildLegs(points) };
}

/** South-west and north-east corners around all points. */
export function boundsOf(points: LngLat[]): [LngLat, LngLat] | null {
  if (points.length === 0) return null;
  let west = points[0][0];
  let east = points[0][0];
  let south = points[0][1];
  let north = points[0][1];
  for (const [lng, lat] of points) {
    west = Math.min(west, lng);
    east = Math.max(east, lng);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }
  return [[west, south], [east, north]];
}
