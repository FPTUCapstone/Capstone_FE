'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export interface PoiDetailMapboxViewProps {
  latitude: number;
  longitude: number;
  name: string;
  address?: string | null;
}

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

function checkWebGLSupported(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (typeof mapboxgl.supported === 'function') {
      return mapboxgl.supported();
    }
  } catch {
    return false;
  }
  return true;
}

export function PoiDetailMapboxView({
  latitude,
  longitude,
  name,
  address,
}: PoiDetailMapboxViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const isMapboxConfigured = Boolean(token && token.trim().length > 0);
  const validCoordinates = isValidCoordinate(latitude, longitude);
  const isSupported = checkWebGLSupported();

  let staticError: string | null = null;
  if (!validCoordinates) {
    staticError = 'Tọa độ địa lý của địa điểm này chưa hợp lệ hoặc đang cập nhật.';
  } else if (!isMapboxConfigured) {
    staticError = 'Chưa cấu hình Mapbox Access Token. Bản đồ địa lý tạm thời không khả dụng.';
  } else if (!isSupported) {
    staticError = 'Trình duyệt hoặc môi trường hiện tại không hỗ trợ WebGL.';
  }

  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const mapError = staticError ?? runtimeError;

  useEffect(() => {
    if (staticError || !mapContainerRef.current) return;

    try {
      mapboxgl.accessToken = token ?? '';

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [longitude, latitude],
        zoom: 14,
        attributionControl: true,
      });

      // Enable mouse wheel zoom, isolated from page Lenis via data-lenis-prevent
      map.scrollZoom.enable();

      // Navigation controls
      map.addControl(
        new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }),
        'top-right'
      );

      // Create Custom Marker element with nested structure to prevent CSS transform jitter
      const rootEl = document.createElement('div');
      rootEl.className = 'poi-detail-mapbox-marker-root cursor-pointer outline-none select-none';
      rootEl.setAttribute('role', 'img');
      rootEl.setAttribute('aria-label', `Vị trí ${name}`);
      rootEl.innerHTML = `
        <div class="flex items-center justify-center rounded-full border-3 border-white bg-[#007d6e] shadow-xl w-10 h-10 ring-4 ring-[#007d6e]/20 transition-transform duration-200 hover:scale-110 hover:bg-[#006b5f]">
          <svg viewBox="0 0 24 24" class="w-5 h-5 text-white fill-current pointer-events-none" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `;

      const marker = new mapboxgl.Marker({ element: rootEl })
        .setLngLat([longitude, latitude])
        .addTo(map);

      // Keep Mapbox canvas synchronized with container dimensions at all times
      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          map.resize();
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => map.resize());
      }
      const t1 = setTimeout(() => map.resize(), 100);
      const t2 = setTimeout(() => map.resize(), 400);

      map.on('load', () => {
        map.resize();
      });

      markerRef.current = marker;
      mapRef.current = map;

      return () => {
        resizeObserver?.disconnect();
        clearTimeout(t1);
        clearTimeout(t2);
        marker.remove();
        map.remove();
        mapRef.current = null;
        markerRef.current = null;
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khởi tạo bản đồ';
      queueMicrotask(() => {
        setRuntimeError(`Không thể khởi tạo bản đồ Mapbox: ${message}`);
      });
    }
  }, [latitude, longitude, name, staticError, token]);

  return (
    <div
      data-lenis-prevent="true"
      className="relative h-[260px] w-full overflow-hidden rounded-2xl border border-[#d5e0e3] bg-[#eef2f4]"
      title={address ?? undefined}
    >
      {mapError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-[#f3f6f7]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fde8e8] text-xl text-[#c81e1e]" aria-hidden="true">
            ⌖
          </span>
          <p className="mt-2 text-xs font-bold text-[#00152a]">Bản đồ vị trí chưa khả dụng</p>
          <p className="mt-1 text-[11px] text-[#5d6a71]">{mapError}</p>
        </div>
      ) : null}

      <div
        ref={mapContainerRef}
        data-testid="poi-detail-mapbox-container"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
        className="!absolute !inset-0 !h-full !w-full"
      />

      <div className="absolute bottom-2 left-2 z-10 rounded-md bg-white/90 px-2 py-1 text-[10px] font-bold text-[#365058] shadow-sm backdrop-blur-xs">
        Bản đồ vị trí (Mapbox)
      </div>
    </div>
  );
}
