import type { ItinerarySummaryDto } from '../services/schedulingApi';
import {
  formatVietnamDayLabel,
  formatVietnamTime,
  TRIPMATE_TIME_ZONE,
  type TransportMode,
  vietnamDayKey,
} from '../types/schedulingTypes';

export type TripFilter = 'all' | 'confirmed' | 'draft' | 'shared';

export interface DateStub {
  weekday: string;
  day: string;
  month: string;
  shortLabel: string;
}

export interface ClassifiedTrips {
  live: ItinerarySummaryDto[];
  upcoming: ItinerarySummaryDto[];
  drafts: ItinerarySummaryDto[];
  archive: ItinerarySummaryDto[];
}

const GENERIC_GENERATED_TITLE_PATTERN = /^Generated itinerary(?:\s*-\s*.+)?$/i;

const WEEKDAY_LABELS: Record<string, { stub: string; full: string }> = {
  Mon: { stub: 'TH 2', full: 'Thứ 2' },
  Tue: { stub: 'TH 3', full: 'Thứ 3' },
  Wed: { stub: 'TH 4', full: 'Thứ 4' },
  Thu: { stub: 'TH 5', full: 'Thứ 5' },
  Fri: { stub: 'TH 6', full: 'Thứ 6' },
  Sat: { stub: 'TH 7', full: 'Thứ 7' },
  Sun: { stub: 'CN', full: 'CN' },
};

const TRANSPORT_LABELS: Record<TransportMode, string> = {
  Motorbike: 'Xe máy',
  Car: 'Ô tô',
  Walking: 'Đi bộ',
  PublicTransit: 'Xe buýt',
};

function normalizeStopNames(previewStopNames: string[] | null | undefined): string[] {
  return (previewStopNames ?? [])
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
    .slice(0, 3);
}

/**
 * Replaces the raw backend boilerplate title (`Generated itinerary - 25 Nov 2026`) with a scannable
 * route title built from top visit stops, while preserving any custom title verbatim.
 */
export function formatTripDisplayTitle(
  trip: Pick<ItinerarySummaryDto, 'title' | 'previewStopNames' | 'validFrom'>,
): string {
  const trimmed = trip.title?.trim();
  const isGenericGenerated = trimmed ? GENERIC_GENERATED_TITLE_PATTERN.test(trimmed) : false;
  if (trimmed && !isGenericGenerated) {
    return trimmed;
  }

  const stops = normalizeStopNames(trip.previewStopNames);
  if (stops.length >= 2) {
    return `${stops[0]} – ${stops[1]}`;
  }
  if (stops.length === 1) {
    return `Hành trình ${stops[0]}`;
  }

  if (trip.validFrom) {
    const dayLabel = formatVietnamDayLabel(trip.validFrom);
    if (dayLabel) {
      return `Lịch trình ${dayLabel}`;
    }
  }

  return 'Lịch trình chưa đặt tên';
}

/**
 * Formats the horizontal route summary chain (`Stop A -> Stop B -> Stop C -> +2 điểm`).
 */
export function formatRoutePreview(
  previewStopNames: string[] | null | undefined,
  stopCount: number,
): string | null {
  const stops = normalizeStopNames(previewStopNames);
  if (stops.length === 0) return null;

  const remaining = stopCount > stops.length ? ` → +${stopCount - stops.length} điểm` : '';
  return `${stops.join(' → ')}${remaining}`;
}

/**
 * Formats compact duration (`7g 54p`, `8g`, `45p`), or null if timestamps are invalid.
 */
export function formatTripDuration(validFrom: string | null, validTo: string | null): string | null {
  if (!validFrom || !validTo) return null;
  const start = Date.parse(validFrom);
  const end = Date.parse(validTo);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

  const totalMinutes = Math.round((end - start) / 60_000);
  if (totalMinutes <= 0) return null;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}p`;
  if (minutes === 0) return `${hours}g`;
  return `${hours}g ${minutes}p`;
}

/**
 * Formats compact Vietnam-timezone window (`05:00 – 12:54`, or `+N ngày` when multi-day).
 */
export function formatTimeRange(validFrom: string | null, validTo: string | null): string | null {
  if (!validFrom) return null;
  const startTime = formatVietnamTime(validFrom);
  if (startTime === '--:--') return null;

  if (!validTo) return startTime;
  const endTime = formatVietnamTime(validTo);
  if (endTime === '--:--') return startTime;

  const startDay = vietnamDayKey(validFrom);
  const endDay = vietnamDayKey(validTo);
  if (startDay && endDay && startDay !== endDay) {
    const dayDiff = Math.max(
      1,
      Math.round((Date.parse(`${endDay}T00:00:00Z`) - Date.parse(`${startDay}T00:00:00Z`)) / 86_400_000),
    );
    return `${startTime} – ${endTime} (+${dayDiff} ngày)`;
  }

  return `${startTime} – ${endTime}`;
}

/**
 * Formats compact Vietnam calendar date parts for the ticket stub and featured card pill.
 */
export function formatDateStub(validFrom: string | null): DateStub | null {
  if (!validFrom) return null;
  const date = new Date(validFrom);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TRIPMATE_TIME_ZONE,
    weekday: 'short',
    day: '2-digit',
    month: 'numeric',
  }).formatToParts(date);

  const rawWeekday = parts.find((part) => part.type === 'weekday')?.value ?? '';
  const rawDay = parts.find((part) => part.type === 'day')?.value ?? '';
  const rawMonth = parts.find((part) => part.type === 'month')?.value ?? '';
  const weekday = WEEKDAY_LABELS[rawWeekday];
  const monthNumber = Number(rawMonth);
  if (!weekday || !rawDay || !Number.isFinite(monthNumber)) return null;

  const paddedMonth = String(monthNumber).padStart(2, '0');
  return {
    weekday: weekday.stub,
    day: rawDay,
    month: `Th${monthNumber}`,
    shortLabel: `${weekday.full}, ${rawDay}/${paddedMonth}`,
  };
}

export function formatTransportLabel(mode: TransportMode | null | undefined): string | null {
  if (!mode) return null;
  return TRANSPORT_LABELS[mode] ?? null;
}

export function isConfirmedTrip(trip: ItinerarySummaryDto): boolean {
  return (
    trip.openNavigationSessionId !== null ||
    trip.status === 'Active' ||
    trip.status === 'Accepted'
  );
}

export function isDraftTrip(trip: ItinerarySummaryDto): boolean {
  return trip.openNavigationSessionId === null && trip.status === 'Draft';
}

/**
 * Groups itineraries into visual sections while preserving incoming backend order within each bucket.
 */
export function classifyTrips(
  trips: ItinerarySummaryDto[],
  nowMs = Date.now(),
): ClassifiedTrips {
  const live: ItinerarySummaryDto[] = [];
  const upcoming: ItinerarySummaryDto[] = [];
  const drafts: ItinerarySummaryDto[] = [];
  const archive: ItinerarySummaryDto[] = [];

  for (const trip of trips) {
    if (trip.openNavigationSessionId !== null) {
      live.push(trip);
      continue;
    }

    if (trip.status === 'Accepted') {
      upcoming.push(trip);
      continue;
    }

    if (trip.status === 'Active') {
      const validToMs = trip.validTo ? Date.parse(trip.validTo) : Number.NaN;
      if (!trip.validTo || !Number.isFinite(validToMs) || validToMs >= nowMs) {
        upcoming.push(trip);
      } else {
        archive.push(trip);
      }
      continue;
    }

    if (trip.status === 'Draft') {
      drafts.push(trip);
      continue;
    }

    archive.push(trip);
  }

  return { live, upcoming, drafts, archive };
}

export function filterTrips(
  trips: ItinerarySummaryDto[],
  filter: TripFilter,
  searchQuery: string,
): ItinerarySummaryDto[] {
  const byStatus = trips.filter((trip) => {
    if (filter === 'confirmed') return isConfirmedTrip(trip);
    if (filter === 'draft') return isDraftTrip(trip);
    if (filter === 'shared') return !trip.canManage;
    return true;
  });

  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (!normalizedQuery) return byStatus;

  const numericQuery = normalizedQuery.replace(/^#/, '');
  return byStatus.filter((trip) => {
    const idText = String(trip.itineraryId);
    if (`#${idText}`.includes(normalizedQuery)) return true;
    if (numericQuery.length > 0 && idText.includes(numericQuery)) return true;
    if ((trip.title ?? '').toLowerCase().includes(normalizedQuery)) return true;
    if (formatTripDisplayTitle(trip).toLowerCase().includes(normalizedQuery)) return true;
    return (trip.previewStopNames ?? []).some((name) =>
      name.toLowerCase().includes(normalizedQuery),
    );
  });
}

export function countTripsByFilter(
  trips: ItinerarySummaryDto[],
  totalCount: number,
): Record<TripFilter, number> {
  return {
    all: Math.max(totalCount, trips.length),
    confirmed: trips.filter(isConfirmedTrip).length,
    draft: trips.filter(isDraftTrip).length,
    shared: trips.filter((trip) => !trip.canManage).length,
  };
}
