/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';

import type { TourSearchItemDto } from '../types/tour';
import { formatDateDisplay, formatVndPrice } from '../utils/tourQuery';

interface TourCardProps {
  tour: TourSearchItemDto;
  searchContextQuery?: string;
}

export function TourCard({ tour, searchContextQuery }: TourCardProps) {
  const detailHref = `/tours/${encodeURIComponent(tour.tourId)}${
    searchContextQuery ? `?${searchContextQuery}` : ''
  }`;

  const isAvailable =
    tour.availabilityStatus.toLowerCase() !== 'soldout' &&
    (tour.remainingSlots === null || tour.remainingSlots > 0);

  return (
    <article
      data-testid="tour-card"
      data-tour-id={tour.tourId}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg"
    >
      {/* Thumbnail area */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
        {tour.thumbnailUrl ? (
          <img
            src={tour.thumbnailUrl}
            alt={tour.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-teal-50 text-slate-400">
            <span className="material-symbols-outlined text-4xl text-teal-600/40">tour</span>
          </div>
        )}

        {/* Destination tags */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
          {tour.destinations.map((dest) => (
            <span
              key={dest}
              className="rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-bold text-slate-800 shadow-xs backdrop-blur-xs"
            >
              {dest}
            </span>
          ))}
        </div>

        {/* Availability Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold shadow-xs backdrop-blur-xs ${
              isAvailable ? 'bg-teal-700/90 text-white' : 'bg-red-600/90 text-white'
            }`}
          >
            <span className="material-symbols-outlined text-xs">
              {isAvailable ? 'check_circle' : 'block'}
            </span>
            <span>
              {isAvailable
                ? tour.remainingSlots !== null
                  ? `Còn ${tour.remainingSlots} chỗ`
                  : 'Còn chỗ'
                : 'Hết chỗ'}
            </span>
          </span>
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Operator & Duration */}
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 truncate font-medium text-slate-600">
            <span className="material-symbols-outlined text-sm text-teal-600">business</span>
            <span className="truncate">{tour.operatorName}</span>
          </span>
          <span className="flex shrink-0 items-center gap-0.5 font-semibold text-slate-700">
            <span className="material-symbols-outlined text-sm text-slate-400">schedule</span>
            <span>{tour.durationDays} ngày</span>
          </span>
        </div>

        {/* Tour Title */}
        <h3 className="mb-3 line-clamp-2 text-base font-bold text-[#00152a] group-hover:text-[#007d6e] transition-colors">
          <Link href={detailHref} className="focus:outline-hidden focus:underline">
            {tour.title}
          </Link>
        </h3>

        {/* Departure info */}
        <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-600">
          <span className="material-symbols-outlined text-sm text-teal-600">calendar_month</span>
          <span>Khởi hành: </span>
          <span className="font-semibold text-slate-800">
            {formatDateDisplay(tour.departureAtUtc)}
          </span>
        </div>

        {/* Price & CTA */}
        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-3">
          <div>
            <span className="block text-[11px] text-slate-500">Giá từ</span>
            <span className="text-lg font-black text-[#007d6e]">
              {formatVndPrice(tour.basePrice)}
            </span>
          </div>

          <Link
            href={detailHref}
            className="inline-flex items-center gap-1 rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-bold text-[#007d6e] transition hover:bg-[#007d6e] hover:text-white"
            aria-label={`Xem chi tiết tour ${tour.title}`}
          >
            <span>Chi tiết</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
