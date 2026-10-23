'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import { useEffect, useRef } from 'react';
import type { Map as MapboxMap, Marker as MapboxMarker } from 'mapbox-gl';

import { boundsOf, ItineraryMapModel } from '../../utils/mapGeometry';
import { isFatalMapError, MAPBOX_STYLE } from './mapboxStyle';

interface MapboxItineraryMapProps {
  token: string;
  model: ItineraryMapModel;
  highlightedItemId: number | null;
  onSelectItem: (itemId: number) => void;
  /** WebGL, the library or the token is unusable: the page shows the order diagram instead. */
  onUnavailable?: () => void;
}

interface DrawnMarker {
  marker: MapboxMarker;
  itemId: number | null;
  element: HTMLElement;
}

const ROUTE_SOURCE = 'itinerary-route';

function markerElement(label: string, title: string, color: string): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.title = title;
  element.setAttribute('aria-label', title);
  element.style.setProperty('background-color', color);
  element.className =
    'flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-black text-white shadow-md transition-transform';
  return element;
}

function applyHighlight(markers: DrawnMarker[], highlightedItemId: number | null) {
  for (const { itemId, element } of markers) {
    const active = itemId !== null && itemId === highlightedItemId;
    if (active) element.setAttribute('aria-current', 'true');
    else element.removeAttribute('aria-current');
    element.style.setProperty('transform', active ? 'scale(1.35)' : '');
    element.style.setProperty('z-index', active ? '2' : '');
  }
}

/**
 * Itinerary map (Review 2, D9): numbered markers coloured by type, a straight route in visiting order, and
 * marker ↔ timeline highlight. Mapbox base map only — no Google data on it (spec §5).
 */
export function MapboxItineraryMap({
  token,
  model,
  highlightedItemId,
  onSelectItem,
  onUnavailable,
}: MapboxItineraryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<DrawnMarker[]>([]);
  const selectRef = useRef(onSelectItem);
  const unavailableRef = useRef(onUnavailable);
  const highlightRef = useRef(highlightedItemId);
  const drawRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    selectRef.current = onSelectItem;
    unavailableRef.current = onUnavailable;
  }, [onSelectItem, onUnavailable]);

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
        mapboxgl.accessToken = token;
        map = new mapboxgl.Map({ container: containerRef.current, style: MAPBOX_STYLE });
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));
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
          map.addLayer({
            id: 'itinerary-route-line',
            type: 'line',
            source: ROUTE_SOURCE,
            paint: { 'line-color': '#007d6e', 'line-width': 3, 'line-dasharray': [2, 1.5] },
          });
          drawRef.current?.();
        });
      })
      .catch(giveUp);
    return () => {
      cancelled = true;
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
      map?.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    drawRef.current = () => {
      const map = mapRef.current;
      if (!map) return;
      void import('mapbox-gl').then(({ default: mapboxgl }) => {
        // The map may have been removed (unmount, token change) while the module was loading.
        if (mapRef.current !== map) return;
        markersRef.current.forEach(({ marker }) => marker.remove());
        markersRef.current = model.markers.map((entry) => {
          const element = markerElement(entry.label, entry.title, entry.color);
          if (entry.itemId !== null) {
            const itemId = entry.itemId;
            element.addEventListener('click', () => selectRef.current(itemId));
          }
          const marker = new mapboxgl.Marker({ element }).setLngLat(entry.position).addTo(map);
          return { marker, itemId: entry.itemId, element };
        });
        applyHighlight(markersRef.current, highlightRef.current);
        const source = map.getSource(ROUTE_SOURCE) as { setData?: (data: unknown) => void } | undefined;
        source?.setData?.({ type: 'Feature', properties: {}, geometry: model.route });
        const bounds = boundsOf(model.markers.map((entry) => entry.position));
        if (bounds) map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 0 });
      });
    };
    drawRef.current();
  }, [model]);

  useEffect(() => {
    highlightRef.current = highlightedItemId;
    applyHighlight(markersRef.current, highlightedItemId);
  }, [highlightedItemId]);

  return (
    <div
      ref={containerRef}
      className="h-72 w-full overflow-hidden rounded-xl bg-slate-100 sm:h-80"
      role="region"
      aria-label="Bản đồ lộ trình"
    />
  );
}
