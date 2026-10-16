'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import { useEffect, useRef } from 'react';
import type { Map as MapboxMap, Marker as MapboxMarker } from 'mapbox-gl';

import type { GeoPoint } from '../../services/placeSearchApi';
import { boundsOf, circlePolygon, MARKER_COLORS } from '../../utils/mapGeometry';
import { isFatalMapError, MAPBOX_STYLE } from './mapboxStyle';

interface MapboxRadiusMapProps {
  token: string;
  center: GeoPoint;
  radiusKm: number;
  onUnavailable?: () => void;
}

const RADIUS_SOURCE = 'search-radius';

/** Exploration area of the create form (Review 2, D9): a circle that follows the radius slider. */
export function MapboxRadiusMap({ token, center, radiusKm, onUnavailable }: MapboxRadiusMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerRef = useRef<MapboxMarker | null>(null);
  const loadedRef = useRef(false);
  const drawRef = useRef<(() => void) | null>(null);
  const unavailableRef = useRef(onUnavailable);

  useEffect(() => {
    unavailableRef.current = onUnavailable;
  }, [onUnavailable]);

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
        mapRef.current = map;
        const element = document.createElement('div');
        element.className = 'h-4 w-4 rounded-full border-2 border-white shadow-md';
        element.style.backgroundColor = MARKER_COLORS.attraction;
        markerRef.current = new mapboxgl.Marker({ element });
        map.on('error', (event) => {
          if (isFatalMapError(event, loaded)) giveUp();
        });
        map.on('load', () => {
          if (cancelled || !map) return;
          loaded = true;
          map.addSource(RADIUS_SOURCE, {
            type: 'geojson',
            data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [] } },
          });
          map.addLayer({
            id: 'search-radius-fill',
            type: 'fill',
            source: RADIUS_SOURCE,
            paint: { 'fill-color': '#007d6e', 'fill-opacity': 0.12 },
          });
          map.addLayer({
            id: 'search-radius-outline',
            type: 'line',
            source: RADIUS_SOURCE,
            paint: { 'line-color': '#007d6e', 'line-width': 2 },
          });
          loadedRef.current = true;
          drawRef.current?.();
        });
      })
      .catch(giveUp);
    return () => {
      cancelled = true;
      loadedRef.current = false;
      markerRef.current?.remove();
      markerRef.current = null;
      map?.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    drawRef.current = () => {
      const map = mapRef.current;
      if (!map || !loadedRef.current) return;
      const circle = circlePolygon(center, radiusKm);
      const source = map.getSource(RADIUS_SOURCE) as { setData?: (data: unknown) => void } | undefined;
      source?.setData?.({ type: 'Feature', properties: {}, geometry: circle });
      markerRef.current?.setLngLat([center.longitude, center.latitude]).addTo(map);
      const bounds = boundsOf(circle.coordinates[0]);
      if (bounds) map.fitBounds(bounds, { padding: 24, duration: 0 });
    };
    drawRef.current();
  }, [center, radiusKm]);

  return (
    <div
      ref={containerRef}
      className="h-56 w-full overflow-hidden rounded-xl bg-slate-100"
      role="region"
      aria-label="Bản đồ khu vực khám phá"
    />
  );
}
