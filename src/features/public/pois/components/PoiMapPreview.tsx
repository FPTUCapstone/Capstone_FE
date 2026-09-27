'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import type { PoiSummary } from '../types/poi';
import { projectPoiCoordinates } from '../utils/poiPresentation';
import { PoiImage } from './PoiImage';

interface PoiMapPreviewProps {
  items: PoiSummary[];
}

export function PoiMapPreview({ items }: PoiMapPreviewProps) {
  const projected = useMemo(() => projectPoiCoordinates(items), [items]);
  const [selectedId, setSelectedId] = useState<number | null>(items[0]?.id ?? null);

  const effectiveSelectedId = items.some(({ id }) => id === selectedId)
    ? selectedId
    : (items[0]?.id ?? null);
  const selected = items.find(({ id }) => id === effectiveSelectedId) ?? null;

  return (
    <section className="relative min-h-[510px] overflow-hidden rounded-[28px] border border-[#cfdbdf] bg-[#e8eff2] shadow-[0_14px_40px_rgba(0,21,42,.08)] lg:min-h-[680px]" aria-label="Bản đồ minh họa vị trí">
      <div className="absolute inset-0 bg-[linear-gradient(24deg,transparent_46%,rgba(255,255,255,.8)_47%,rgba(255,255,255,.8)_49%,transparent_50%),linear-gradient(112deg,transparent_62%,rgba(122,199,205,.22)_63%,rgba(122,199,205,.22)_72%,transparent_73%),radial-gradient(circle_at_20%_18%,#d5ebdf_0_9%,transparent_10%),#e8eff2]" />
      <div className="absolute left-4 top-4 z-20 max-w-[calc(100%-2rem)] rounded-xl border border-[#b9d9d2] bg-white/95 px-3 py-2 text-xs font-extrabold text-[#006b5f] shadow-sm backdrop-blur">
        Bản đồ minh họa vị trí
      </div>

      {projected.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
          <div className="max-w-sm rounded-2xl bg-white/90 p-6 shadow-sm">
            <p className="text-lg font-extrabold text-[#00152a]">Chưa có vị trí để hiển thị</p>
            <p className="mt-2 text-sm leading-relaxed text-[#5d6a71]">Thử thay đổi từ khóa hoặc bộ lọc để xem các địa điểm trên bản đồ.</p>
          </div>
        </div>
      ) : null}

      {projected.map((point) => {
        const poi = items.find(({ id }) => id === point.id);
        if (!poi) return null;
        const active = poi.id === effectiveSelectedId;
        return (
          <button
            key={poi.id}
            type="button"
            aria-label={`Chọn ${poi.name} trên bản đồ`}
            aria-pressed={active}
            className={`absolute z-10 flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white font-black text-white shadow-lg transition hover:scale-110 ${active ? 'bg-[#e65100]' : 'bg-[#007d6e]'}`}
            // Keep every marker in the map's upper content area so the responsive
            // preview card never hides a selectable pin on narrow viewports.
            style={{ left: `${point.x}%`, top: `${10 + point.y * 0.45}%` }}
            onClick={() => setSelectedId(poi.id)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" fill="currentColor" />
              <circle cx="12" cy="10" r="2.3" fill="white" />
            </svg>
          </button>
        );
      })}

      {selected ? (
        <article className="absolute bottom-4 left-4 right-4 z-20 rounded-2xl border border-[#d5e0e3] bg-white p-3 shadow-[0_18px_50px_rgba(0,21,42,.2)] sm:p-4">
          <div className="flex min-w-0 items-center gap-3">
            <PoiImage src={selected.thumbnailUrl} alt={selected.name} className="h-[72px] w-[72px] shrink-0 rounded-xl [&>span]:hidden sm:h-[84px] sm:w-[84px]" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-[.08em] text-[#007d6e]">Đang chọn</p>
              <h2 className="mt-1 line-clamp-2 text-base font-black leading-tight text-[#00152a]">{selected.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#53626a]">
                <span>{selected.categoryName}</span>
                <span className="font-bold text-[#006b5f]">{selected.isOpenNow ? '● Đang mở cửa' : '○ Đã đóng'}</span>
                {selected.distanceKm !== null ? <span>Cách {selected.distanceKm.toFixed(2)} km</span> : null}
              </div>
            </div>
            <Link
              href={`/pois/${selected.id}`}
              className="hidden min-h-11 shrink-0 items-center rounded-xl bg-[#007d6e] px-4 text-sm font-bold text-white sm:inline-flex"
            >
              Chi tiết →
            </Link>
          </div>
          <Link
            href={`/pois/${selected.id}`}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#007d6e] text-sm font-bold text-white sm:hidden"
          >
            Xem chi tiết →
          </Link>
        </article>
      ) : null}
    </section>
  );
}
