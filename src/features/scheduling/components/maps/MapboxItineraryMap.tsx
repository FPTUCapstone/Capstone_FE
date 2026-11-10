'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import { useEffect, useRef } from 'react';
import type { Map as MapboxMap, Marker as MapboxMarker } from 'mapbox-gl';

import { fetchRoadLeg } from '../../utils/mapboxDirections';
import { boundsOf, ItineraryMapModel, LngLat } from '../../utils/mapGeometry';
import {
  CHEVRON_IMAGE,
  createChevronImage,
  DIMMED_GLOW_OPACITY,
  DIMMED_OPACITY,
  DIMMED_STRAIGHT_OPACITY,
  GLOW_OPACITY,
  isFatalMapError,
  MAPBOX_STYLE,
  legColor,
  ROUTE_CASING_COLOR,
  ROUTE_LINE_COLOR,
  ROUTE_SELECTED_COLOR,
  STRAIGHT_LINE_OPACITY,
  widthByZoom,
} from './mapboxStyle';

interface MapboxItineraryMapProps {
  token: string;
  model: ItineraryMapModel;
  highlightedItemId: number | null;
  onSelectItem: (itemId: number) => void;
  /** Leg (`ItineraryRouteLeg.id`) shown on its own: fitted, drawn on top and the others dimmed. */
  selectedLegId?: string | null;
  /** WebGL, the library or the token is unusable: the page shows the order diagram/fallback card instead. */
  onUnavailable?: () => void;
}

interface DrawnMarker {
  marker: MapboxMarker;
  key: string;
  itemId: number | null;
  /** The element Mapbox positions (inline `transform`): never styled by us, except its stacking order. */
  element: HTMLElement;
  /** The visible circle inside it: all highlight styling goes here. */
  circle: HTMLElement;
}

/** Straight dashed segments: the whole route while it loads, then only the legs without a road. */
const ROUTE_SOURCE = 'itinerary-route';
/** Solid line along the real roads Mapbox Directions returned. */
const ROAD_SOURCE = 'itinerary-road';
/** The selected leg, drawn on top of the gradient. */
const SELECTED_SOURCE = 'itinerary-selected';

type GeoSource = { setData?: (data: unknown) => void };

const selectedData = (line: LngLat[] | null) => ({
  type: 'FeatureCollection',
  features: line
    ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: line } }]
    : [],
});

/** Fades the gradient, its glow, the arrows and the straight estimates while one leg is selected. */
function dimRoute(map: MapboxMap, dimmed: boolean) {
  const set = (layer: string, property: 'line-opacity' | 'icon-opacity', value: number) => {
    if (map.getLayer?.(layer)) map.setPaintProperty(layer, property, value);
  };
  set('itinerary-road-glow', 'line-opacity', dimmed ? DIMMED_GLOW_OPACITY : GLOW_OPACITY);
  set('itinerary-road-casing', 'line-opacity', dimmed ? DIMMED_OPACITY : 1);
  set('itinerary-road-line', 'line-opacity', dimmed ? DIMMED_OPACITY : 1);
  set('itinerary-road-chevrons', 'icon-opacity', dimmed ? DIMMED_OPACITY : 1);
  set('itinerary-route-line', 'line-opacity', dimmed ? DIMMED_STRAIGHT_OPACITY : STRAIGHT_LINE_OPACITY);
}

/** Road legs as one coloured feature each: the layers read the colour from the feature. */
const roadData = (legs: Array<{ color: string; coordinates: LngLat[] }>) => ({
  type: 'FeatureCollection',
  features: legs.map(({ color, coordinates }) => ({
    type: 'Feature',
    properties: { color },
    geometry: { type: 'LineString', coordinates },
  })),
});

const lineData = (coordinates: LngLat[][]) => ({
  type: 'Feature',
  properties: {},
  geometry: { type: 'MultiLineString', coordinates },
});

/**
 * A marker is a plain wrapper (the element Mapbox moves with an inline `transform`) around the visible circle.
 * Scaling, translating or rotating the wrapper — even through the individual `scale` property, which applies
 * outside `transform` — would move the marker, so hover and highlight styling lives on the circle only.
 */
function markerElement(label: string, title: string, color: string) {
  const element = document.createElement('div');
  element.className = 'h-7 w-7';
  const circle = document.createElement('button');
  circle.type = 'button';
  circle.textContent = label;
  circle.title = title;
  circle.setAttribute('aria-label', title);
  circle.style.setProperty('background-color', color);
  circle.className =
    'flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-black text-white shadow-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#103B39] hover:scale-115';
  element.appendChild(circle);
  return { element, circle };
}

function applyHighlight(
  markers: DrawnMarker[],
  highlightedItemId: number | null,
  legEndKeys: ReadonlySet<string>,
) {
  for (const { key, itemId, element, circle } of markers) {
    // `scale` is independent of `transform`, but it still must not be set on the positioned wrapper.
    const active = itemId !== null && itemId === highlightedItemId;
    if (active) {
      circle.setAttribute('aria-current', 'true');
      circle.style.setProperty('scale', '1.35');
      circle.style.setProperty('box-shadow', '0 0 0 4px rgba(0, 125, 110, 0.45), 0 4px 12px rgba(0,0,0,0.25)');
      element.style.setProperty('z-index', '10');
    } else if (legEndKeys.has(key)) {
      // The two ends of the selected leg.
      circle.removeAttribute('aria-current');
      circle.style.setProperty('scale', '1.25');
      circle.style.setProperty('box-shadow', `0 0 0 3px ${ROUTE_SELECTED_COLOR}, 0 4px 10px rgba(0,0,0,0.25)`);
      element.style.setProperty('z-index', '9');
    } else {
      circle.removeAttribute('aria-current');
      circle.style.setProperty('scale', '');
      circle.style.setProperty('box-shadow', '');
      element.style.setProperty('z-index', '');
    }
  }
}

/**
 * Itinerary map (Review 2, D9): numbered markers coloured by type, a straight route in visiting order, and
 * marker ↔ timeline highlight. Mapbox base map only — no Google data on it (spec §5).
 * The route follows real roads per leg (Mapbox Directions); a leg Directions cannot route stays a straight
 * dashed segment.
 */
export function MapboxItineraryMap({
  token,
  model,
  highlightedItemId,
  onSelectItem,
  selectedLegId = null,
  onUnavailable,
}: MapboxItineraryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<DrawnMarker[]>([]);
  const selectRef = useRef(onSelectItem);
  const unavailableRef = useRef(onUnavailable);
  const highlightRef = useRef(highlightedItemId);
  const drawRef = useRef<(() => void) | null>(null);
  const tokenRef = useRef(token);
  const drawCountRef = useRef(0);
  const modelRef = useRef(model);
  const selectedLegRef = useRef(selectedLegId);
  /** Roads of the legs of the current draw, by leg id (legs without a road are not in it). */
  const roadsRef = useRef(new Map<string, LngLat[]>());
  /** Leg currently applied to the map (null = whole route). */
  const appliedLegRef = useRef<string | null>(null);
  const legEndsRef = useRef<ReadonlySet<string>>(new Set());
  const applySelectionRef = useRef<(force: boolean) => void>(() => {});

  useEffect(() => {
    selectRef.current = onSelectItem;
    unavailableRef.current = onUnavailable;
    tokenRef.current = token;
  }, [onSelectItem, onUnavailable, token]);

  // Shows the selected leg (or the whole route): fit, selected line, dimmed rest, highlighted end markers.
  useEffect(() => {
    const fitAll = (map: MapboxMap, duration: number) => {
      const bounds = boundsOf(modelRef.current.markers.map((entry) => entry.position));
      if (!bounds) return;
      if (bounds[0][0] === bounds[1][0] && bounds[0][1] === bounds[1][1] && typeof map.easeTo === 'function') {
        map.easeTo({ center: bounds[0], zoom: 14, duration });
      } else {
        map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration });
      }
    };
    applySelectionRef.current = (force) => {
      const map = mapRef.current;
      if (!map) return;
      const wanted = selectedLegRef.current;
      const leg = wanted ? modelRef.current.legs.find((entry) => entry.id === wanted) ?? null : null;
      const line = leg ? roadsRef.current.get(leg.id) ?? [leg.from, leg.to] : null;
      const changed = (leg?.id ?? null) !== appliedLegRef.current;
      appliedLegRef.current = leg?.id ?? null;
      dimRoute(map, leg !== null);
      (map.getSource(SELECTED_SOURCE) as GeoSource | undefined)?.setData?.(selectedData(line));
      legEndsRef.current = leg ? new Set([leg.fromKey, leg.toKey]) : new Set();
      applyHighlight(markersRef.current, highlightRef.current, legEndsRef.current);
      if (!force && !changed) return;
      const bounds = line ? boundsOf(line) : null;
      if (bounds) map.fitBounds(bounds, { padding: 64, maxZoom: 16, duration: force ? 0 : 600 });
      else fitAll(map, force ? 0 : 600);
    };
  }, []);

  // Create the map once per token; the model is drawn by the effect below.
  useEffect(() => {
    let cancelled = false;
    let loaded = false;
    let map: MapboxMap | null = null;
    const giveUp = () => {
      if (cancelled) return;
      cancelled = true;
      unavailableRef.current?.();
    };
    void import('mapbox-gl')
      .then(({ default: mapboxgl }) => {
        if (cancelled || !containerRef.current) return;
        if (typeof mapboxgl.supported === 'function' && !mapboxgl.supported()) {
          giveUp();
          return;
        }
        mapboxgl.accessToken = token;
        map = new mapboxgl.Map({
          container: containerRef.current,
          style: MAPBOX_STYLE,
        });
        map.scrollZoom?.enable?.();
        map.addControl(new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }));
        mapRef.current = map;
        map.on('error', (event) => {
          if (isFatalMapError(event, loaded)) giveUp();
        });
        map.on('load', () => {
          if (cancelled || !map) return;
          loaded = true;
          map.addSource(ROUTE_SOURCE, {
            type: 'geojson',
            data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
          });
          map.addSource(ROAD_SOURCE, { type: 'geojson', data: roadData([]) as never });
          map.addSource(SELECTED_SOURCE, { type: 'geojson', data: selectedData(null) as never });
          const round = { 'line-join': 'round', 'line-cap': 'round' } as const;
          // Drawn in this order: soft glow, white casing, road line (coloured per leg), the faint dashed
          // straight estimate, then direction chevrons on top.
          map.addLayer({
            id: 'itinerary-road-glow',
            type: 'line',
            source: ROAD_SOURCE,
            layout: round,
            paint: {
              'line-color': ['get', 'color'],
              'line-width': widthByZoom([[10, 12], [14, 18], [18, 26]]) as never,
              'line-blur': 8,
              'line-opacity': GLOW_OPACITY,
            },
          });
          map.addLayer({
            id: 'itinerary-road-casing',
            type: 'line',
            source: ROAD_SOURCE,
            layout: round,
            paint: {
              'line-color': ROUTE_CASING_COLOR,
              'line-width': widthByZoom([[10, 7], [14, 10.5], [18, 15]]) as never,
            },
          });
          map.addLayer({
            id: 'itinerary-road-line',
            type: 'line',
            source: ROAD_SOURCE,
            layout: round,
            paint: {
              'line-color': ['get', 'color'],
              'line-width': widthByZoom([[10, 4], [14, 6.5], [18, 10]]) as never,
            },
          });
          map.addLayer({
            id: 'itinerary-route-line',
            type: 'line',
            source: ROUTE_SOURCE,
            paint: {
              'line-color': ROUTE_LINE_COLOR,
              'line-opacity': STRAIGHT_LINE_OPACITY,
              'line-width': widthByZoom([[10, 2], [14, 3], [18, 5]]) as never,
              'line-dasharray': [2, 1.5],
            },
          });
          try {
            if (!map.hasImage?.(CHEVRON_IMAGE)) map.addImage(CHEVRON_IMAGE, createChevronImage(), { pixelRatio: 2 });
            map.addLayer({
              id: 'itinerary-road-chevrons',
              type: 'symbol',
              source: ROAD_SOURCE,
              layout: {
                'symbol-placement': 'line',
                'symbol-spacing': 80,
                'icon-image': CHEVRON_IMAGE,
                'icon-size': widthByZoom([[10, 0.3], [14, 0.5], [18, 0.75]]) as never,
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
              },
            });
          } catch {
            // The line is complete without its direction arrows.
          }
          map.addLayer({
            id: 'itinerary-selected-casing',
            type: 'line',
            source: SELECTED_SOURCE,
            layout: round,
            paint: {
              'line-color': ROUTE_CASING_COLOR,
              'line-width': widthByZoom([[10, 9], [14, 14], [18, 20]]) as never,
            },
          });
          map.addLayer({
            id: 'itinerary-selected-line',
            type: 'line',
            source: SELECTED_SOURCE,
            layout: round,
            paint: {
              'line-color': ROUTE_SELECTED_COLOR,
              'line-width': widthByZoom([[10, 6], [14, 10], [18, 14]]) as never,
            },
          });
          drawRef.current?.();
        });
      })
      .catch(giveUp);
    return () => {
      cancelled = true;
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
      drawCountRef.current += 1;
      map?.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    modelRef.current = model;
    drawRef.current = () => {
      const map = mapRef.current;
      if (!map) return;
      drawCountRef.current += 1;
      const drawId = drawCountRef.current;
      roadsRef.current = new Map();
      void import('mapbox-gl').then(({ default: mapboxgl }) => {
        // The map may have been removed (unmount, token change) while the module was loading.
        if (mapRef.current !== map) return;
        markersRef.current.forEach(({ marker }) => marker.remove());
        markersRef.current = model.markers.map((entry) => {
          const { element, circle } = markerElement(entry.label, entry.title, entry.color);
          if (entry.itemId !== null) {
            const itemId = entry.itemId;
            element.addEventListener('click', () => selectRef.current(itemId));
          }
          const marker = new mapboxgl.Marker({ element }).setLngLat(entry.position).addTo(map);
          return { marker, key: entry.key, itemId: entry.itemId, element, circle };
        });
        const source = map.getSource(ROUTE_SOURCE) as GeoSource | undefined;
        source?.setData?.({ type: 'Feature', properties: {}, geometry: model.route });
        // Fits the whole route, or the selected leg, and highlights the markers.
        applySelectionRef.current(true);
        // Straight line is on screen; swap in the road of every leg that Directions can route.
        if (model.legs.length === 0) return;
        void Promise.all(model.legs.map((leg) => fetchRoadLeg(leg, tokenRef.current))).then((roads) => {
          // A newer draw, an unmount or a token change replaced this map state while Mapbox was answering.
          if (mapRef.current !== map || drawCountRef.current !== drawId) return;
          const routed: Array<{ color: string; coordinates: LngLat[] }> = [];
          const straight: LngLat[][] = [];
          roads.forEach((road, index) => {
            const { from, to } = model.legs[index];
            if (road) {
              routed.push({ color: legColor(index, model.legs.length), coordinates: road });
              roadsRef.current.set(model.legs[index].id, road);
            } else straight.push([from, to]);
          });
          const road = map.getSource(ROAD_SOURCE) as { setData?: (data: unknown) => void } | undefined;
          const route = map.getSource(ROUTE_SOURCE) as { setData?: (data: unknown) => void } | undefined;
          road?.setData?.(roadData(routed));
          route?.setData?.(lineData(straight));
          // The selected leg now follows its road.
          applySelectionRef.current(false);
        });
      });
    };
    drawRef.current();
  }, [model]);

  useEffect(() => {
    selectedLegRef.current = selectedLegId;
    applySelectionRef.current(false);
  }, [selectedLegId]);

  useEffect(() => {
    highlightRef.current = highlightedItemId;
    applyHighlight(markersRef.current, highlightedItemId, legEndsRef.current);
  }, [highlightedItemId]);

  return (
    <div
      ref={containerRef}
      data-lenis-prevent
      className="relative h-[360px] w-full overflow-hidden rounded-xl bg-slate-100 sm:h-[400px] lg:h-[420px]"
      role="region"
      aria-label="Bản đồ lộ trình"
    />
  );
}
