'use client';

import Link from 'next/link';

import { PoiCategoryIcon } from '@/features/public/pois/components/PoiCategoryIcon';
import { PoiImage } from '@/features/public/pois/components/PoiImage';
import type { FavoritePoiItem } from '@/features/public/pois/services/poiFavoriteApi';
import { getPoiCategoryVisual } from '@/features/public/pois/utils/poiCategoryVisuals';
import { formatDuration, formatReviewCount } from '@/features/public/pois/utils/poiPresentation';
import { ROUTES } from '@/lib/routes';

interface FavoritePoiCardProps {
  poi: FavoritePoiItem;
  isRemoving: boolean;
  onRemove: (poi: FavoritePoiItem) => void;
}

const SAVED_DATE_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
});

function formatSavedDate(isoString: string): string | null {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return null;
  return SAVED_DATE_FORMATTER.format(parsed);
}

export function FavoritePoiCard({ poi, isRemoving, onRemove }: FavoritePoiCardProps) {
  const categoryVisual = getPoiCategoryVisual(poi.categoryName);
  const savedDate = formatSavedDate(poi.favoritedAtUtc);
  const detailHref = ROUTES.poi(poi.id);

  return (
    <article
      data-testid={`favorite-poi-card-${poi.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white shadow-[0_4px_16px_rgba(28,41,40,.04)] transition-all duration-200 hover:border-[#174B4A]/45 hover:shadow-[0_12px_30px_rgba(28,41,40,.08)] sm:flex-row"
    >
      {/* Thumbnail & Open Status */}
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden sm:aspect-auto sm:w-48 md:w-52">
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

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
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

          <h2 className="mt-2 line-clamp-1 text-base font-bold tracking-tight text-[#1C2928] transition-colors group-hover:text-[#103B39] sm:text-lg">
            <Link href={detailHref} className="hover:underline focus-visible:outline-hidden">
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
            {savedDate ? (
              <span className="rounded-md bg-[#E8F0EA] px-2 py-0.5 font-semibold text-[#174B4A]">
                Đã lưu {savedDate}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#ECEEEB] pt-3">
          <p className="text-xs font-medium text-[#5B6E69]">
            {poi.reviewCount > 0
              ? `${formatReviewCount(poi.reviewCount)} lượt đánh giá`
              : 'Chưa có đánh giá'}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isRemoving}
              onClick={() => onRemove(poi)}
              aria-label={`Bỏ yêu thích ${poi.name}`}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-55"
            >
              <span
                className="material-symbols-outlined text-[16px]"
                aria-hidden="true"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                favorite
              </span>
              <span>{isRemoving ? 'Đang gỡ…' : 'Bỏ yêu thích'}</span>
            </button>

            <Link
              href={detailHref}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#174B4A] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#103B39] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174B4A]"
            >
              Xem chi tiết <span aria-hidden="true" className="ml-1">→</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
