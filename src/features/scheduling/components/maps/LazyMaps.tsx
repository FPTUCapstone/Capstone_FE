'use client';

import dynamic from 'next/dynamic';

function MapLoading() {
  return (
    <div className="flex h-56 w-full items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-500">
      Đang tải bản đồ…
    </div>
  );
}

/** mapbox-gl needs the browser (WebGL): client-only, loaded on demand (Review 2, D9). */
export const LazyItineraryMap = dynamic(
  () => import('./MapboxItineraryMap').then((module) => module.MapboxItineraryMap),
  { ssr: false, loading: MapLoading },
);

export const LazyRadiusMap = dynamic(
  () => import('./MapboxRadiusMap').then((module) => module.MapboxRadiusMap),
  { ssr: false, loading: MapLoading },
);
