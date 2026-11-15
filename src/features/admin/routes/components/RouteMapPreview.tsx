'use client';

import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from 'react';
import { getMapboxPublicToken } from '@/lib/mapboxToken';
import { fetchRoadLeg } from '@/features/scheduling/utils/mapboxDirections';
import type { RoutePoi, RouteTransportMode } from '../services/route-api';
import { routeMessages } from '../services/route-api';

interface Props { from?: RoutePoi; to?: RoutePoi; mode: RouteTransportMode | '' }
type PreviewState = 'loading' | 'ready' | 'unavailable';
const unavailable = routeMessages.MSG127;

export function RouteMapPreview({ from, to, mode }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<{ key: string; state: PreviewState } | null>(null);
  const token = getMapboxPublicToken();
  const key = from && to && mode ? `${from.id}:${to.id}:${mode}` : '';

  useEffect(() => {
    if (!token || !from || !to || from.id === to.id || !mode || !container.current) return;
    let disposed = false;
    let map: import('mapbox-gl').Map | null = null;
    const fromPoint: [number, number] = [from.longitude, from.latitude];
    const toPoint: [number, number] = [to.longitude, to.latitude];
    const profile = mode === 'Walking' ? 'walking' : 'driving';
    async function draw() {
      try {
        const [{ default: mapbox }, line] = await Promise.all([
          import('mapbox-gl'),
          fetchRoadLeg({ key: `${profile}:${fromPoint.join(',')};${toPoint.join(',')}`, from: fromPoint, to: toPoint, profile }, token!),
        ]);
        if (disposed || !container.current) return;
        if (!line) { setPreview({ key, state: 'unavailable' }); return; }
        map = new mapbox.Map({ container: container.current, accessToken: token!, style: 'mapbox://styles/mapbox/streets-v12', center: fromPoint, zoom: 11, attributionControl: true });
        map.addControl(new mapbox.NavigationControl(), 'top-right');
        map.on('error', () => { if (!disposed) setPreview({ key, state: 'unavailable' }); });
        map.on('load', () => {
          if (disposed || !map) return;
          new mapbox.Marker().setLngLat(fromPoint).setPopup(new mapbox.Popup().setText(`Origin: ${from!.name}`)).addTo(map);
          new mapbox.Marker().setLngLat(toPoint).setPopup(new mapbox.Popup().setText(`Destination: ${to!.name}`)).addTo(map);
          map.addSource('route-preview', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: line } } });
          const color = getComputedStyle(container.current!).getPropertyValue('--color-primary').trim() || 'currentColor';
          map.addLayer({ id: 'route-preview-line', type: 'line', source: 'route-preview', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': color, 'line-width': 5 } });
          const bounds: [[number, number], [number, number]] = [
            [Math.min(...line.map(point => point[0]), fromPoint[0], toPoint[0]), Math.min(...line.map(point => point[1]), fromPoint[1], toPoint[1])],
            [Math.max(...line.map(point => point[0]), fromPoint[0], toPoint[0]), Math.max(...line.map(point => point[1]), fromPoint[1], toPoint[1])],
          ];
          const fitRoute = () => { if (!disposed) map?.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 0 }); };
          fitRoute();
          map.on('resize', fitRoute);
          setPreview({ key, state: 'ready' });
        });
      } catch { if (!disposed) setPreview({ key, state: 'unavailable' }); }
    }
    void draw();
    return () => { disposed = true; map?.remove(); };
  }, [from, to, mode, token, key]);

  const valid = Boolean(key && from && to && from.id !== to.id);
  const state = preview?.key === key ? preview.state : 'loading';
  const message = !token ? 'Map preview is unavailable because the map service is not configured.'
    : !valid ? 'Select two different Active points of interest and a transport mode to preview the route.'
    : state === 'unavailable' ? unavailable : state === 'loading' ? 'Loading route preview…' : null;
  return <div className="mt-4 space-y-3">
    {from && to && <p className="text-sm font-medium">{from.name} → {to.name}</p>}
    {message && <p role="status" className="rounded-xl bg-brand-surface p-4 text-sm text-text-secondary">{message}</p>}
    <div ref={container} data-lenis-prevent className={`h-80 w-full overflow-hidden rounded-xl border border-border ${!valid || !token || state === 'unavailable' ? 'hidden' : ''}`} aria-label="Map of origin, destination and provider route" />
    {valid && <p className="text-xs leading-relaxed text-text-secondary">Mapbox road geometry preview. {mode === 'PublicTransit' || mode === 'Motorbike' ? 'This mode uses the existing driving road profile; transit schedules and vehicle restrictions are not represented. ' : ''}Stored distance and travel time use the values entered by Staff.</p>}
  </div>;
}
