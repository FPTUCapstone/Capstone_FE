import Link from 'next/link';

import type { PoiSummary } from '../types/poi';
import { formatDuration, formatReviewCount } from '../utils/poiPresentation';
import { PoiImage } from './PoiImage';

interface PoiCardProps {
  poi: PoiSummary;
}

export function PoiCard({ poi }: PoiCardProps) {
  return (
    <article className="group overflow-hidden rounded-[24px] border border-[#dce4e8] bg-white shadow-[0_12px_36px_rgba(0,21,42,.07)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(0,21,42,.11)] focus-within:ring-2 focus-within:ring-[#006b5f]">
      <div className="relative">
        <PoiImage src={poi.thumbnailUrl} alt={poi.name} className="aspect-[16/9] w-full" />
        <div className="absolute left-4 top-4 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
          <span className="rounded-full bg-[#00152a]/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
            {poi.categoryName}
          </span>
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold text-white ${poi.isOpenNow ? 'bg-[#007d6e]' : 'bg-[#66727b]'}`}
          >
            {poi.isOpenNow ? '● Đang mở cửa' : '○ Đã đóng'}
          </span>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="line-clamp-2 min-w-0 text-xl font-black tracking-[-0.02em] text-[#00152a] sm:text-2xl">
            {poi.name}
          </h2>
          <p className="shrink-0 font-extrabold text-[#007d6e]">
            <span className="text-[#e65100]" aria-hidden="true">★</span>{' '}
            {poi.averageRating?.toFixed(1) ?? 'Chưa có'}
          </p>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#59656d]">
          {poi.address ?? 'Địa chỉ đang được cập nhật'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#30434c]">
          <span className="rounded-lg bg-[#eef3f4] px-3 py-2">◷ {formatDuration(poi.averageVisitDurationMinutes)}</span>
          <span className="rounded-lg bg-[#eef3f4] px-3 py-2">
            {poi.indoorOutdoor === 'Outdoor' ? '☀ Ngoài trời' : poi.indoorOutdoor === 'Indoor' ? '⌂ Trong nhà' : '◐ Hỗn hợp'}
          </span>
          {poi.hasShelter ? <span className="rounded-lg bg-[#eef3f4] px-3 py-2">⌂ Có mái che</span> : null}
          {poi.distanceKm !== null ? (
            <span className="rounded-lg bg-[#e4f5f1] px-3 py-2 text-[#006b5f]">⌖ Cách {poi.distanceKm.toFixed(2)} km</span>
          ) : null}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#e5ebee] pt-4">
          <p className="text-xs text-[#67737b]">
            {poi.reviewCount > 0 ? `${formatReviewCount(poi.reviewCount)} lượt đánh giá` : 'Chưa có đánh giá'}
          </p>
          <Link
            href={`/pois/${poi.id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#007d6e] px-5 text-sm font-bold text-white hover:bg-[#006b5f] focus-visible:outline-offset-2"
          >
            Xem chi tiết <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
