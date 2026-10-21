import Link from 'next/link';

import type { PoiSummary } from '../types/poi';
import { formatDuration, formatReviewCount } from '../utils/poiPresentation';
import { PoiImage } from './PoiImage';

export interface PoiCardProps {
  poi: PoiSummary;
  isSelected?: boolean;
  onSelect?: (poi: PoiSummary) => void;
}

export function PoiCard({ poi, isSelected = false, onSelect }: PoiCardProps) {
  function handleCardClick() {
    onSelect?.(poi);
  }

  return (
    <article
      data-testid={`poi-card-${poi.id}`}
      data-selected={isSelected ? 'true' : 'false'}
      onClick={handleCardClick}
      className={`group relative flex flex-col sm:flex-row overflow-hidden rounded-[24px] border transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-[#007d6e] bg-[#f4faf8] shadow-[0_12px_32px_rgba(0,125,110,.14)] ring-2 ring-[#007d6e]'
          : 'border-[#dce4e8] bg-white shadow-[0_8px_24px_rgba(0,21,42,.05)] hover:-translate-y-0.5 hover:border-[#b4cfc9] hover:shadow-[0_14px_36px_rgba(0,21,42,.09)]'
      }`}
    >
      {/* Thumbnail & Badges Container */}
      <div className="relative w-full sm:w-44 md:w-48 lg:w-40 xl:w-48 shrink-0 aspect-[16/10] sm:aspect-auto">
        <PoiImage
          src={poi.thumbnailUrl}
          alt={poi.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5 z-10">
          <span className="rounded-full bg-[#00152a]/90 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
            {poi.categoryName}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-xs ${
              poi.isOpenNow ? 'bg-[#007d6e]' : 'bg-[#66727b]'
            }`}
          >
            {poi.isOpenNow ? '● Đang mở cửa' : '○ Đã đóng'}
          </span>
        </div>
      </div>

      {/* Information Body */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 min-w-0">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h2 className="line-clamp-1 min-w-0 text-lg font-black tracking-[-0.02em] text-[#00152a] group-hover:text-[#007d6e] transition-colors sm:text-xl">
              <Link
                href={`/pois/${poi.id}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline focus:outline-hidden"
              >
                {poi.name}
              </Link>
            </h2>
            <p className="shrink-0 font-extrabold text-[#007d6e] text-sm">
              <span className="text-[#e65100]" aria-hidden="true">★</span>{' '}
              {poi.averageRating?.toFixed(1) ?? 'Chưa có'}
            </p>
          </div>

          <p className="mt-1 line-clamp-1 text-xs text-[#59656d]">
            {poi.address ?? 'Địa chỉ đang được cập nhật'}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold text-[#30434c]">
            <span className="rounded-md bg-[#eef3f4] px-2.5 py-1">◷ {formatDuration(poi.averageVisitDurationMinutes)}</span>
            <span className="rounded-md bg-[#eef3f4] px-2.5 py-1">
              {poi.indoorOutdoor === 'Outdoor' ? '☀ Ngoài trời' : poi.indoorOutdoor === 'Indoor' ? '⌂ Trong nhà' : '◐ Hỗn hợp'}
            </span>
            {poi.hasShelter ? <span className="rounded-md bg-[#eef3f4] px-2.5 py-1">⌂ Mái che</span> : null}
            {poi.distanceKm !== null ? (
              <span className="rounded-md bg-[#e4f5f1] px-2.5 py-1 text-[#006b5f] font-bold">
                ⌖ Cách {poi.distanceKm.toFixed(2)} km
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#edf2f4] pt-3">
          <p className="text-xs text-[#67737b]">
            {poi.reviewCount > 0 ? `${formatReviewCount(poi.reviewCount)} lượt đánh giá` : 'Chưa có đánh giá'}
          </p>
          <Link
            href={`/pois/${poi.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex min-h-9 items-center justify-center rounded-lg bg-[#007d6e] px-3.5 text-xs font-bold text-white hover:bg-[#006b5f] transition-colors focus-visible:outline-offset-2"
          >
            Xem chi tiết <span aria-hidden="true" className="ml-1.5">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
