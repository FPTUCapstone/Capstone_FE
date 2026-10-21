'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import type { PoiSummary } from '../types/poi';
import { PoiImage } from './PoiImage';

export interface PoiMapboxViewProps {
  items: PoiSummary[];
  selectedId: number | null;
  onSelectPoi: (id: number) => void;
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

function buildMarkerContent(poi: PoiSummary, isSelected: boolean): HTMLElement {
  const container = document.createElement('div');
  container.className = 'poi-marker-container group relative flex items-center justify-center';

  // Hover Tooltip Annotation Badge
  const tooltipWrapper = document.createElement('div');
  tooltipWrapper.className =
    'pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-max max-w-[260px] opacity-0 -translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto shadow-2xl';

  const tooltipCard = document.createElement('div');
  tooltipCard.className =
    'rounded-xl border border-[#cfe1de] bg-white/98 p-3 shadow-xl backdrop-blur-xs text-left';

  // Category, Rating, Status Row
  const headerRow = document.createElement('div');
  headerRow.className = 'flex items-center gap-1.5 text-[10px] font-bold';

  const categoryBadge = document.createElement('span');
  categoryBadge.className = 'rounded-full bg-[#00152a] px-2 py-0.5 text-white';
  categoryBadge.textContent = poi.categoryName;
  headerRow.appendChild(categoryBadge);

  if (poi.averageRating !== null) {
    const ratingBadge = document.createElement('span');
    ratingBadge.className = 'text-[#e65100] font-black';
    ratingBadge.textContent = `★ ${poi.averageRating.toFixed(1)}`;
    headerRow.appendChild(ratingBadge);
  }

  const statusBadge = document.createElement('span');
  statusBadge.className = poi.isOpenNow ? 'text-[#007d6e]' : 'text-[#68767c]';
  statusBadge.textContent = poi.isOpenNow ? '● Đang mở cửa' : '○ Đã đóng';
  headerRow.appendChild(statusBadge);

  tooltipCard.appendChild(headerRow);

  // Safe POI Name text node
  const nameEl = document.createElement('p');
  nameEl.className = 'mt-1.5 text-xs font-black text-[#00152a] leading-tight line-clamp-1';
  nameEl.textContent = poi.name;
  tooltipCard.appendChild(nameEl);

  // Safe Address text node (if present)
  if (poi.address && poi.address.trim()) {
    const addressEl = document.createElement('p');
    addressEl.className = 'mt-0.5 text-[11px] text-[#55666e] line-clamp-1';
    addressEl.textContent = poi.address;
    tooltipCard.appendChild(addressEl);
  }

  // Action Cue Row
  const footerRow = document.createElement('div');
  footerRow.className =
    'mt-1.5 flex items-center justify-between text-[10px] text-[#007d6e] font-extrabold border-t border-[#e8eff1] pt-1.5';

  const footerText = document.createElement('span');
  footerText.textContent = 'Nhấp để xem chi tiết';
  const footerArrow = document.createElement('span');
  footerArrow.textContent = '→';

  footerRow.appendChild(footerText);
  footerRow.appendChild(footerArrow);
  tooltipCard.appendChild(footerRow);

  tooltipWrapper.appendChild(tooltipCard);

  // Tooltip triangle pointer
  const arrowPointer = document.createElement('div');
  arrowPointer.className =
    'mx-auto h-0 w-0 border-x-5 border-t-5 border-x-transparent border-t-[#cfe1de]';
  tooltipWrapper.appendChild(arrowPointer);

  container.appendChild(tooltipWrapper);

  // Nested Pin Body (SVG constructed via DOM APIs without untrusted markup)
  const pinBody = document.createElement('div');
  pinBody.className = `flex items-center justify-center rounded-full border-2 border-white shadow-lg transition-all duration-200 cursor-pointer ${
    isSelected
      ? 'bg-[#e65100] scale-125 z-30 w-10 h-10 ring-4 ring-[#e65100]/30'
      : 'bg-[#007d6e] hover:scale-115 z-10 w-8 h-8 hover:bg-[#006b5f]'
  }`;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'w-4 h-4 text-white fill-current pointer-events-none');
  svg.setAttribute('aria-hidden', 'true');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'
  );
  svg.appendChild(path);
  pinBody.appendChild(svg);

  container.appendChild(pinBody);

  return container;
}

export function PoiMapboxView({ items, selectedId, onSelectPoi }: PoiMapboxViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<number, mapboxgl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const isMapboxConfigured = Boolean(token && token.trim().length > 0);
  const isSupported = checkWebGLSupported();

  let staticError: string | null = null;
  if (!isMapboxConfigured) {
    staticError = 'Chưa cấu hình Mapbox Access Token. Bản đồ địa lý tạm thời không khả dụng.';
  } else if (!isSupported) {
    staticError = 'Trình duyệt hoặc môi trường hiện tại không hỗ trợ WebGL để hiển thị bản đồ địa lý.';
  }

  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const mapError = staticError ?? runtimeError;

  const validItems = useMemo(
    () => items.filter((poi) => isValidCoordinate(poi.latitude, poi.longitude)),
    [items]
  );

  const effectiveSelectedId = items.some(({ id }) => id === selectedId)
    ? selectedId
    : (items[0]?.id ?? null);

  const selectedPoi = items.find(({ id }) => id === effectiveSelectedId) ?? null;

  // Initialize Mapbox map instance
  useEffect(() => {
    if (staticError || !mapContainerRef.current) return;

    try {
      mapboxgl.accessToken = token ?? '';

      const initialCenter: [number, number] = validItems.length > 0
        ? [validItems[0].longitude, validItems[0].latitude]
        : [108.2022, 16.0544];

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialCenter,
        zoom: validItems.length > 0 ? 11 : 9,
        attributionControl: true,
      });

      // Enable mouse wheel zoom as requested, isolated from page Lenis via data-lenis-prevent
      map.scrollZoom.enable();

      // Add navigation controls (zoom in/out, compass)
      map.addControl(
        new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }),
        'top-right'
      );

      map.on('load', () => {
        setMapLoaded(true);
        map.resize();
      });

      // Keep Mapbox canvas synchronized with container dimensions at all times
      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          map.resize();
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      // Initial resize kicks to guarantee immediate 100% full coverage
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => map.resize());
      }
      const t1 = setTimeout(() => map.resize(), 100);
      const t2 = setTimeout(() => map.resize(), 400);

      map.on('error', (e) => {
        if (e.error?.message?.includes('style') || e.error?.message?.includes('token')) {
          setRuntimeError('Không thể tải kiểu bản đồ Mapbox. Vui lòng kiểm tra quyền truy cập.');
        }
      });

      mapRef.current = map;

      const markers = markersRef.current;
      return () => {
        resizeObserver?.disconnect();
        clearTimeout(t1);
        clearTimeout(t2);
        markers.forEach((marker) => marker.remove());
        markers.clear();
        map.remove();
        mapRef.current = null;
        setMapLoaded(false);
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khởi tạo bản đồ';
      queueMicrotask(() => {
        setRuntimeError(`Không thể khởi tạo bản đồ Mapbox: ${message}`);
      });
    }
  }, [staticError, token, validItems]);

  // Synchronize Markers whenever validItems, effectiveSelectedId or mapLoaded changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clear old markers that are no longer in validItems
    const currentValidIds = new Set(validItems.map((poi) => poi.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentValidIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Create or update markers with nested structure to prevent CSS transform jitter
    validItems.forEach((poi) => {
      const isSelected = poi.id === effectiveSelectedId;
      const existing = markersRef.current.get(poi.id);

      if (existing) {
        const rootEl = existing.getElement();
        if (rootEl) {
          rootEl.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
          rootEl.setAttribute('aria-label', `${poi.name} - ${poi.categoryName}`);
          rootEl.replaceChildren(buildMarkerContent(poi, isSelected));
        }
      } else {
        const rootEl = document.createElement('div');
        rootEl.className = 'poi-mapbox-marker-root cursor-pointer outline-none select-none';
        rootEl.setAttribute('role', 'button');
        rootEl.setAttribute('tabindex', '0');
        rootEl.setAttribute('aria-label', `${poi.name} - ${poi.categoryName}`);
        rootEl.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        rootEl.setAttribute('data-poi-id', String(poi.id));
        rootEl.appendChild(buildMarkerContent(poi, isSelected));

        rootEl.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectPoi(poi.id);
        });

        const marker = new mapboxgl.Marker({ element: rootEl })
          .setLngLat([poi.longitude, poi.latitude])
          .addTo(map);

        markersRef.current.set(poi.id, marker);
      }
    });

    if (validItems.length === 1) {
      map.flyTo({
        center: [validItems[0].longitude, validItems[0].latitude],
        zoom: 14,
        essential: true,
      });
    } else if (validItems.length > 1) {
      try {
        const bounds = new mapboxgl.LngLatBounds();
        validItems.forEach((poi) => bounds.extend([poi.longitude, poi.latitude]));
        map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 1000 });
      } catch {
        // Fallback gracefully
      }
    }
  }, [validItems, effectiveSelectedId, mapLoaded, onSelectPoi]);

  // Center on selected POI when selection changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !effectiveSelectedId) return;

    const target = validItems.find((p) => p.id === effectiveSelectedId);
    if (target) {
      map.flyTo({
        center: [target.longitude, target.latitude],
        zoom: Math.max(map.getZoom(), 13),
        essential: true,
        duration: 800,
      });
    }
  }, [effectiveSelectedId, validItems]);

  return (
    <section
      data-lenis-prevent="true"
      className="relative h-[560px] w-full overflow-hidden rounded-[28px] border border-[#cfdbdf] bg-[#e8eff2] shadow-[0_14px_40px_rgba(0,21,42,.08)] lg:h-[720px] xl:h-[760px]"
      aria-label="Bản đồ địa lý khám phá địa điểm"
    >
      {/* Fallback state when token is missing, WebGL fails or map error occurs */}
      {mapError ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-8 text-center bg-[#f3f6f7]">
          <div className="max-w-md rounded-2xl border border-[#d3dfe3] bg-white p-6 shadow-sm">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#fde8e8] text-2xl text-[#c81e1e]" aria-hidden="true">
              ⌖
            </span>
            <p className="mt-4 text-base font-extrabold text-[#00152a]">Bản đồ địa lý chưa khả dụng</p>
            <p className="mt-2 text-xs leading-relaxed text-[#5d6a71]">{mapError}</p>
            <p className="mt-3 text-[11px] font-semibold text-[#007d6e]">
              Danh sách kết quả bên trái vẫn hoạt động bình thường với đầy đủ thông tin địa điểm.
            </p>
          </div>
        </div>
      ) : null}

      {/* Mapbox Canvas Container */}
      <div
        ref={mapContainerRef}
        data-testid="mapbox-gl-container"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
        className="!absolute !inset-0 !h-full !w-full"
      />

      {/* Map Header Status Badge */}
      <div className="absolute left-4 top-4 z-20 max-w-[calc(100%-4rem)] rounded-xl border border-[#b9d9d2] bg-white/95 px-3 py-2 text-xs font-extrabold text-[#006b5f] shadow-sm backdrop-blur">
        Bản đồ địa lý tương tác (Mapbox)
      </div>

      {/* Empty Coordinates State */}
      {validItems.length === 0 && !mapError ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-8 text-center bg-white/60 backdrop-blur-xs">
          <div className="max-w-sm rounded-2xl bg-white/95 p-6 shadow-sm border border-[#dce5e8]">
            <p className="text-base font-extrabold text-[#00152a]">Chưa có tọa độ hiển thị</p>
            <p className="mt-2 text-xs leading-relaxed text-[#5d6a71]">
              Các địa điểm trong bộ lọc hiện tại chưa có tọa độ khả dụng để đặt điểm mốc trên bản đồ.
            </p>
          </div>
        </div>
      ) : null}

      {/* Selected POI Floating Preview Card */}
      {selectedPoi ? (
        <article
          className="absolute bottom-4 left-4 right-4 z-20 rounded-2xl border border-[#d5e0e3] bg-white p-3.5 shadow-[0_18px_50px_rgba(0,21,42,.2)] sm:p-4 transition-all duration-300"
          aria-label={`Chi tiết xem trước: ${selectedPoi.name}`}
        >
          <div className="flex min-w-0 items-center gap-3.5">
            <PoiImage
              src={selectedPoi.thumbnailUrl}
              alt={selectedPoi.name}
              className="h-[74px] w-[74px] shrink-0 rounded-xl sm:h-[86px] sm:w-[86px]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[.08em] text-[#007d6e] bg-[#e4f5f1] px-2 py-0.5 rounded-full">
                  Đang chọn trên bản đồ
                </span>
                <span className="text-xs font-extrabold text-[#e65100]">
                  ★ {selectedPoi.averageRating?.toFixed(1) ?? 'Chưa có'}
                </span>
              </div>
              <h2 className="mt-1 line-clamp-1 text-base font-black leading-tight text-[#00152a]">
                {selectedPoi.name}
              </h2>
              <p className="mt-0.5 line-clamp-1 text-xs text-[#59656d]">
                {selectedPoi.address ?? 'Địa chỉ đang cập nhật'}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#53626a]">
                <span className="font-semibold text-[#30434c]">{selectedPoi.categoryName}</span>
                <span className={`font-bold ${selectedPoi.isOpenNow ? 'text-[#006b5f]' : 'text-[#68767c]'}`}>
                  {selectedPoi.isOpenNow ? '● Đang mở cửa' : '○ Đã đóng'}
                </span>
                {selectedPoi.distanceKm !== null ? (
                  <span className="text-[#006b5f] font-semibold">
                    ⌖ Cách {selectedPoi.distanceKm.toFixed(2)} km
                  </span>
                ) : null}
              </div>
            </div>
            <Link
              href={`/pois/${selectedPoi.id}`}
              className="hidden min-h-11 shrink-0 items-center rounded-xl bg-[#007d6e] px-4 text-sm font-bold text-white hover:bg-[#006b5f] transition sm:inline-flex"
            >
              Xem chi tiết →
            </Link>
          </div>
          <div className="mt-3 flex sm:hidden">
            <Link
              href={`/pois/${selectedPoi.id}`}
              className="flex min-h-11 w-full items-center justify-center rounded-xl bg-[#007d6e] px-4 text-sm font-bold text-white"
            >
              Xem chi tiết địa điểm →
            </Link>
          </div>
        </article>
      ) : null}
    </section>
  );
}
