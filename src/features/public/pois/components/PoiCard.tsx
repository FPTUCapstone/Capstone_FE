import Link from 'next/link';

import type { PoiSummary } from '../types/poi';
import { getPoiCategoryVisual } from '../utils/poiCategoryVisuals';
import { formatDuration, formatReviewCount } from '../utils/poiPresentation';
import { PoiCategoryIcon } from './PoiCategoryIcon';
import { PoiImage } from './PoiImage';

export interface PoiCardProps {
  poi: PoiSummary;
  isSelected?: boolean;
  onSelect?: (poi: PoiSummary) => void;
}

export function PoiCard({ poi, isSelected = false, onSelect }: PoiCardProps) {
  const categoryVisual = getPoiCategoryVisual(poi.categoryName);

  function handleCardClick() {
    onSelect?.(poi);
  }

  return (
    <article
      data-testid={`poi-card-${poi.id}`}
      data-selected={isSelected ? 'true' : 'false'}
      onClick={handleCardClick}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border transition-all duration-200 sm:flex-row ${
        isSelected
          ? 'border-[#174B4A] bg-[#F1F6F3] ring-1 ring-[#174B4A] shadow-[0_10px_28px_rgba(16,59,57,.12)]'
          : 'border-[#DCE2DD] bg-white shadow-[0_4px_16px_rgba(28,41,40,.04)] hover:-translate-y-0.5 hover:border-[#174B4A]/45 hover:shadow-[0_12px_30px_rgba(28,41,40,.08)]'
      }`}
    >
      {/* Thumbnail & compact status badge */}
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden sm:aspect-auto sm:w-44 md:w-48 lg:w-44 xl:w-52">
        <PoiImage
          src={poi.thumbnailUrl}
          alt={poi.name}
          categoryName={poi.categoryName}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute left-2.5 top-2.5 z-10">
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold text-white shadow-xs backdrop-blur-xs ${
              poi.isOpenNow ? 'bg-[#103B39]/90' : 'bg-[#3D4E4B]/85'
            }`}
          >
            {poi.isOpenNow ? '● Đang mở cửa' : '○ Đã đóng'}
          </span>
        </div>
      </div>

      {/* Information Body */}
      <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
        <div>
          {/* Eyebrow row: Category + Rating (only when rated) */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex min-w-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold ${categoryVisual.badgeClass}`}
            >
              <PoiCategoryIcon kind={categoryVisual.kind} className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{poi.categoryName}</span>
            </span>

            {poi.averageRating !== null ? (
              <p className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#FEF3C7] px-2 py-0.5 text-xs font-extrabold text-[#B45309]">
                <span aria-hidden="true">★</span>
                <span>{poi.averageRating.toFixed(1)}</span>
              </p>
            ) : null}
          </div>

          <h2 className="mt-2 line-clamp-1 min-w-0 text-base font-black tracking-[-0.02em] text-[#1C2928] transition-colors group-hover:text-[#103B39] sm:text-lg">
            <Link
              href={`/pois/${poi.id}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline focus:outline-hidden"
            >
              {poi.name}
            </Link>
          </h2>

          <p className="mt-1 line-clamp-1 text-xs text-[#5B6E69]">
            {poi.address ?? 'Địa chỉ đang được cập nhật'}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold text-[#4A5D58]">
            <span className="rounded-md border border-[#E5EAE6] bg-[#F7F5EF] px-2 py-0.5">
              ◷ {formatDuration(poi.averageVisitDurationMinutes)}
            </span>
            <span className="rounded-md border border-[#E5EAE6] bg-[#F7F5EF] px-2 py-0.5">
              {poi.indoorOutdoor === 'Outdoor'
                ? '☀ Ngoài trời'
                : poi.indoorOutdoor === 'Indoor'
                  ? '⌂ Trong nhà'
                  : '◐ Hỗn hợp'}
            </span>
            {poi.hasShelter ? (
              <span className="rounded-md border border-[#E5EAE6] bg-[#F7F5EF] px-2 py-0.5">
                ⌂ Mái che
              </span>
            ) : null}
            {poi.distanceKm !== null ? (
              <span className="rounded-md bg-[#E8F0EA] px-2 py-0.5 font-bold text-[#174B4A]">
                ⌖ Cách {poi.distanceKm.toFixed(2)} km
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-[#ECEEEB] pt-3">
          <p className="text-xs font-medium text-[#5B6E69]">
            {poi.reviewCount > 0
              ? `${formatReviewCount(poi.reviewCount)} lượt đánh giá`
              : 'Chưa có đánh giá'}
          </p>
          <Link
            href={`/pois/${poi.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex min-h-8 items-center justify-center rounded-lg bg-[#174B4A] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#103B39] focus-visible:outline-offset-2"
          >
            Xem chi tiết <span aria-hidden="true" className="ml-1">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
