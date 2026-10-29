/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';

import type { TourSearchItemDto } from '../types/tour';
import { formatDateDisplay, formatVndPrice } from '../utils/tourQuery';
import { devTourSearchCopy } from '../resources/en';

interface TourCardProps {
  tour: TourSearchItemDto;
  searchContextQuery?: string;
  aggregateRating?: number | null;
  copy?: TourCardCopy;
}

export interface TourCardCopy {
  soldOut: string;
  availableSlots: (count: number) => string;
  available: string;
  noSchedule: string;
  unknown: string;
  days: (count: number) => string;
  departure: string;
  priceFrom: string;
  details: string;
  detailsAria: (title: string) => string;
}

const legacyCopy: TourCardCopy = {
  soldOut: 'Hết chỗ', availableSlots: (count) => `Còn ${count} chỗ`, available: 'Còn chỗ',
  noSchedule: 'Chưa có lịch khởi hành', unknown: 'Chưa xác định', days: (count) => `${count} ngày`,
  departure: 'Khởi hành:', priceFrom: 'Giá từ', details: 'Chi tiết', detailsAria: (title) => `Xem chi tiết tour ${title}`,
};

export interface TourAvailabilityPresentation {
  label: string;
  badgeClass: string;
  icon: string;
}

export function getTourAvailabilityPresentation(
  status: string,
  remainingSlots: number | null,
  copy: TourCardCopy = legacyCopy,
): TourAvailabilityPresentation {
  const normalized = (status || '').trim().toLowerCase();

  if (normalized === 'available') {
    if (remainingSlots === 0) {
      return {
        label: copy.soldOut,
        badgeClass: 'bg-red-600/90 text-white',
        icon: 'block',
      };
    }
    if (remainingSlots !== null && remainingSlots > 0) {
      return {
        label: copy.availableSlots(remainingSlots),
        badgeClass: 'bg-teal-700/90 text-white',
        icon: 'check_circle',
      };
    }
    return {
      label: copy.available,
      badgeClass: 'bg-teal-700/90 text-white',
      icon: 'check_circle',
    };
  }

  if (normalized === 'soldout') {
    return {
      label: copy.soldOut,
      badgeClass: 'bg-red-600/90 text-white',
      icon: 'block',
    };
  }

  if (normalized === 'noupcomingschedule') {
    return {
      label: copy.noSchedule,
      badgeClass: 'bg-amber-600/90 text-white',
      icon: 'event_busy',
    };
  }

  return {
    label: copy.unknown,
    badgeClass: 'bg-slate-600/90 text-white',
    icon: 'help',
  };
}

export function TourCard({ tour, searchContextQuery, aggregateRating, copy = legacyCopy }: TourCardProps) {
  const detailHref = `/tours/${encodeURIComponent(tour.tourId)}${
    searchContextQuery ? `?${searchContextQuery}` : ''
  }`;

  const availability = getTourAvailabilityPresentation(
    tour.availabilityStatus,
    tour.remainingSlots,
    copy,
  );

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
          <div
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-teal-50 text-slate-400"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-4xl text-teal-600/40">
              tour
            </span>
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
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold shadow-xs backdrop-blur-xs ${availability.badgeClass}`}
          >
            <span className="material-symbols-outlined text-xs">
              {availability.icon}
            </span>
            <span>{availability.label}</span>
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
            <span>{copy.days(tour.durationDays)}</span>
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
          <span>{copy.departure} </span>
          <span className="font-semibold text-slate-800">
            {formatDateDisplay(tour.departureAtUtc)}
          </span>
        </div>

        {aggregateRating !== undefined && <p className="mb-3 text-sm text-slate-600">{aggregateRating === null ? devTourSearchCopy.ratingUnknown : `${devTourSearchCopy.rating}: ${aggregateRating.toFixed(1)} / 5`}</p>}

        {/* Price & CTA */}
        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-3">
          <div>
            <span className="block text-[11px] text-slate-500">{copy.priceFrom}</span>
            <span className="text-lg font-black text-[#007d6e]">
              {formatVndPrice(tour.basePrice)}
            </span>
          </div>

          <Link
            href={detailHref}
            className="inline-flex items-center gap-1 rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-bold text-[#007d6e] transition hover:bg-[#007d6e] hover:text-white"
            aria-label={copy.detailsAria(tour.title)}
          >
            <span>{copy.details}</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
