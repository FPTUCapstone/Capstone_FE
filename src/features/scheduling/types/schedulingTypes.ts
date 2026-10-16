/**
 * TripMate UC-10 — Create Scheduling Request Types & Data Contracts
 * Strictly aligned with Capstone_BE SchedulingRequestsController & Domain Enums
 */

import { COST_KINDS, type CostKind } from '@/lib/priceLabel';
import { isBoolean, isFiniteNumber as isNumber, isOneOf, isOptional, isRecord, isString } from '@/lib/typeGuards';


export type TransportMode = 'Walking' | 'Motorbike' | 'Car' | 'PublicTransit';


export type RestPreference = 'Auto' | 'None' | 'Frequent';

export type ItineraryItemKind = 'Visit' | 'Rest';

/** Modes a single leg can be switched to (PUT /itineraries/{id}/items `stops`). */
export type LegTransportMode = 'Walking' | 'Motorbike' | 'Car';

/** One visit of the itinerary as sent to PUT /itineraries/{id}/items (`stops`, §3.4). */
export interface ItineraryStopInput {
  poiId: number;
  /** Omitted → trip default; ignored on the last stop. */
  transportModeToNext?: LegTransportMode;
}

export const LEG_TRANSPORT_MODES: readonly LegTransportMode[] = ['Walking', 'Motorbike', 'Car'];
export const TRANSPORT_MODES: readonly TransportMode[] = ['Walking', 'Motorbike', 'Car', 'PublicTransit'];

export interface CreateSchedulingRequestPayload {
  startAt: string; // ISO 8601 format e.g. 2026-10-20T08:00:00+07:00
  timeZoneId: string; // Asia/Ho_Chi_Minh
  startLatitude: number;
  startLongitude: number;
  explorationLatitude: number;
  explorationLongitude: number;
  endPoiId: number | null;
  returnToStart: boolean;
  availableMinutes: number; // 60 to 720
  transportMode: TransportMode;
  searchRadiusKm: number; // 1 to 50
  budgetVnd: number | null;
  mandatoryPoiIds?: number[];
  restPreference: RestPreference;
}

export interface SchedulingItemDto {
  sequenceNo: number;
  poiId: number | null;
  poiName: string | null;
  itemKind: ItineraryItemKind;
  plannedArrival: string;
  plannedDeparture: string;
  stayDurationMinutes: number;
  travelDurationToNextMinutes: number | null;
  estimatedCost: number | null;
  isMandatory: boolean;
  recommendationReason: string | null;
  travelDistanceToNextMeters?: number | null;
  transportModeToNext?: TransportMode | null;
  costKind?: CostKind;
}

export interface SchedulingResponseDto {
  schedulingRequestId: number;
  itineraryId: number;
  title: string;
  status: string;
  totalEstimatedCost: number;
  totalDurationMinutes: number;
  items: SchedulingItemDto[];
  isDemoFixture?: boolean;
}

export interface SchedulingFormValues {
  destinationId: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  availableHours: number; // 1 to 12
  searchRadiusKm: number; // 1 to 50
  returnToStart: boolean;
  transportMode: TransportMode;
  restPreference: RestPreference;
  budgetVnd: number | '';
}

export const TRIPMATE_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export function getVietnamCalendarDate(now?: Date): string {
  const d = now ?? new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TRIPMATE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(d);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

export function getVietnamTomorrowDateString(now?: Date): string {
  const today = getVietnamCalendarDate(now);
  const [y, m, d] = today.split('-').map(Number);
  const nextDate = new Date(Date.UTC(y, m - 1, d + 1));
  const nextY = nextDate.getUTCFullYear();
  const nextM = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
  const nextD = String(nextDate.getUTCDate()).padStart(2, '0');
  return `${nextY}-${nextM}-${nextD}`;
}

export function buildVietnamStartAtIso(date: string, time: string): string {
  return `${date}T${time}:00+07:00`;
}

export function isFutureVietnamStartAt(date: string, time: string, now?: Date): boolean {
  if (!date || !time) return false;
  const startInstant = new Date(buildVietnamStartAtIso(date, time)).getTime();
  const currentInstant = (now ?? new Date()).getTime();
  return !isNaN(startInstant) && startInstant > currentInstant;
}

export function getTodayDateString(now?: Date): string {
  return getVietnamCalendarDate(now);
}

export function getTomorrowDateString(now?: Date): string {
  return getVietnamTomorrowDateString(now);
}

export interface ItineraryDetailItemDto {
  itemId: number;
  sequenceNo: number;
  poiId: number | null;
  poiName: string | null;
  category: string | null;
  kind: ItineraryItemKind;
  plannedArrival: string;
  plannedDeparture: string;
  travelDurationFromPreviousMinutes: number | null;
  stayDurationMinutes: number;
  estimatedCost: number | null;
  isMandatory: boolean;
  recommendationReason: string | null;
  isUnavailable: boolean;
  latitude?: number | null;
  longitude?: number | null;
  costKind?: CostKind;
  /** Road distance of the leg into this stop; null for itineraries planned before Review 2. */
  travelDistanceFromPreviousMeters?: number | null;
  /** Mode used to reach this stop. */
  transportModeFromPrevious?: TransportMode | null;
  address?: string | null;
  isDurationCompressed?: boolean;
}

export interface ItineraryLocationDto {
  latitude: number;
  longitude: number;
  address: string | null;
}

export interface ItineraryDetailDto {
  itineraryId: number;
  schedulingRequestId: number;
  title: string | null;
  version: number;
  status: string;
  validFrom: string | null;
  validTo: string | null;
  canManage: boolean;
  totalEstimatedCost: number;
  totalDurationMinutes: number;
  items: ItineraryDetailItemDto[];
  isDemoFixture?: boolean;
  /** Someone is navigating this trip on the mobile app: regenerate/adjust are locked. */
  isNavigationInProgress?: boolean;
  /** Trip default transport mode. */
  transportMode?: TransportMode | null;
  startLocation?: ItineraryLocationDto | null;
  endLocation?: ItineraryLocationDto | null;
  /** Budget per person of the scheduling request; null = no budget given (§3.1). */
  budgetVnd?: number | null;
}

const isTransportMode = isOneOf(TRANSPORT_MODES);
const isCostKind = isOneOf(COST_KINDS);
/** `costKind` may be missing on older responses, but never null or an unknown value. */
const isOptionalCostKind = (value: unknown) => value === undefined || isCostKind(value);

function isLocation(v: unknown): boolean {
  if (!isRecord(v)) return false;
  return isNumber(v.latitude) && isNumber(v.longitude) && isOptional(v.address, isString);
}

export function isValidItineraryId(itineraryId: unknown): boolean {
  if (typeof itineraryId === 'number') {
    return Number.isSafeInteger(itineraryId) && itineraryId > 0;
  }
  if (typeof itineraryId === 'string') {
    const trimmed = itineraryId.trim();
    if (!/^\d+$/.test(trimmed)) return false;
    const parsed = Number(trimmed);
    return Number.isSafeInteger(parsed) && parsed > 0;
  }
  return false;
}

export function isValidItineraryDetailDto(data: unknown): data is ItineraryDetailDto {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Partial<ItineraryDetailDto>;
  if (
    typeof candidate.itineraryId !== 'number' ||
    typeof candidate.schedulingRequestId !== 'number' ||
    (candidate.title !== undefined &&
      candidate.title !== null &&
      typeof candidate.title !== 'string') ||
    typeof candidate.version !== 'number' ||
    typeof candidate.status !== 'string' ||
    (candidate.validFrom !== undefined &&
      candidate.validFrom !== null &&
      typeof candidate.validFrom !== 'string') ||
    (candidate.validTo !== undefined &&
      candidate.validTo !== null &&
      typeof candidate.validTo !== 'string') ||
    typeof candidate.canManage !== 'boolean' ||
    typeof candidate.totalEstimatedCost !== 'number' ||
    typeof candidate.totalDurationMinutes !== 'number' ||
    !Array.isArray(candidate.items)
  ) {
    return false;
  }
  if (candidate.isDemoFixture !== undefined && typeof candidate.isDemoFixture !== 'boolean') {
    return false;
  }
  if (
    candidate.isNavigationInProgress !== undefined &&
    typeof candidate.isNavigationInProgress !== 'boolean'
  ) {
    return false;
  }
  if (
    !isOptional(candidate.transportMode, isTransportMode) ||
    !isOptional(candidate.startLocation, isLocation) ||
    !isOptional(candidate.endLocation, isLocation) ||
    !isOptional(candidate.budgetVnd, isNumber)
  ) {
    return false;
  }
  for (const item of candidate.items) {
    if (!item || typeof item !== 'object') return false;
    const i = item as Partial<ItineraryDetailItemDto>;
    if (
      typeof i.itemId !== 'number' ||
      typeof i.sequenceNo !== 'number' ||
      (i.poiId !== undefined && i.poiId !== null && typeof i.poiId !== 'number') ||
      (i.poiName !== undefined && i.poiName !== null && typeof i.poiName !== 'string') ||
      (i.category !== undefined && i.category !== null && typeof i.category !== 'string') ||
      (i.kind !== 'Visit' && i.kind !== 'Rest') ||
      typeof i.plannedArrival !== 'string' ||
      typeof i.plannedDeparture !== 'string' ||
      (i.travelDurationFromPreviousMinutes !== undefined &&
        i.travelDurationFromPreviousMinutes !== null &&
        typeof i.travelDurationFromPreviousMinutes !== 'number') ||
      typeof i.stayDurationMinutes !== 'number' ||
      (i.estimatedCost !== undefined &&
        i.estimatedCost !== null &&
        typeof i.estimatedCost !== 'number') ||
      typeof i.isMandatory !== 'boolean' ||
      (i.recommendationReason !== undefined &&
        i.recommendationReason !== null &&
        typeof i.recommendationReason !== 'string') ||
      typeof i.isUnavailable !== 'boolean' ||
      !isOptional(i.latitude, isNumber) ||
      !isOptional(i.longitude, isNumber) ||
      !isOptionalCostKind(i.costKind) ||
      !isOptional(i.travelDistanceFromPreviousMeters, isNumber) ||
      !isOptional(i.transportModeFromPrevious, isTransportMode) ||
      !isOptional(i.address, isString) ||
      !isOptional(i.isDurationCompressed, isBoolean)
    ) {
      return false;
    }
  }
  return true;
}

export function isValidSchedulingResponseDto(data: unknown): data is SchedulingResponseDto {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Partial<SchedulingResponseDto>;
  if (
    typeof candidate.schedulingRequestId !== 'number' ||
    typeof candidate.itineraryId !== 'number' ||
    typeof candidate.title !== 'string' ||
    typeof candidate.status !== 'string' ||
    typeof candidate.totalEstimatedCost !== 'number' ||
    typeof candidate.totalDurationMinutes !== 'number' ||
    !Array.isArray(candidate.items)
  ) {
    return false;
  }
  if (candidate.isDemoFixture !== undefined && typeof candidate.isDemoFixture !== 'boolean') {
    return false;
  }
  for (const item of candidate.items) {
    if (!item || typeof item !== 'object') return false;
    const i = item as Partial<SchedulingItemDto>;
    if (
      typeof i.sequenceNo !== 'number' ||
      (i.poiId !== undefined && i.poiId !== null && typeof i.poiId !== 'number') ||
      (i.poiName !== undefined && i.poiName !== null && typeof i.poiName !== 'string') ||
      (i.itemKind !== 'Visit' && i.itemKind !== 'Rest') ||
      typeof i.plannedArrival !== 'string' ||
      typeof i.plannedDeparture !== 'string' ||
      typeof i.stayDurationMinutes !== 'number' ||
      (i.travelDurationToNextMinutes !== undefined &&
        i.travelDurationToNextMinutes !== null &&
        typeof i.travelDurationToNextMinutes !== 'number') ||
      (i.estimatedCost !== undefined && i.estimatedCost !== null && typeof i.estimatedCost !== 'number') ||
      typeof i.isMandatory !== 'boolean' ||
      (i.recommendationReason !== undefined &&
        i.recommendationReason !== null &&
        typeof i.recommendationReason !== 'string') ||
      !isOptional(i.travelDistanceToNextMeters, isNumber) ||
      !isOptional(i.transportModeToNext, isTransportMode) ||
      !isOptionalCostKind(i.costKind)
    ) {
      return false;
    }
  }
  return true;
}

/** Shortest trip a Traveler can plan (minutes). */
export const MIN_AVAILABLE_MINUTES = 60;

/** Longest trip: one continuous window of 72 hours that may cross midnight. */
export const MAX_AVAILABLE_MINUTES = 72 * 60;

/**
 * Validates the free "Thời lượng" input (hours + minutes). Returns the total in minutes,
 * or a Vietnamese error message.
 */
export function parseAvailableDuration(
  hours: string,
  minutes: string,
): { minutes: number; error: null } | { minutes: null; error: string } {
  const parse = (value: string): number | null => {
    const trimmed = value.trim();
    if (trimmed === '') return 0;
    return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
  };
  const h = parse(hours);
  const m = parse(minutes);
  if (h === null || m === null || m > 59) {
    return { minutes: null, error: 'Nhập số giờ nguyên và số phút từ 0 đến 59.' };
  }
  const total = h * 60 + m;
  if (total < MIN_AVAILABLE_MINUTES) {
    return { minutes: null, error: 'Thời lượng tối thiểu là 1 giờ.' };
  }
  if (total > MAX_AVAILABLE_MINUTES) {
    return { minutes: null, error: 'Thời lượng tối đa là 72 giờ (3 ngày).' };
  }
  return { minutes: total, error: null };
}

/**
 * Planned end of a trip given its Vietnam wall-clock start ("YYYY-MM-DD", "HH:mm"): the end
 * time, its date (dd/MM) and how many calendar days after the start it falls.
 */
export function calculateTripEnd(
  startDate: string,
  startTime: string,
  availableMinutes: number,
): { time: string; date: string; dayOffset: number } | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDate);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(startTime);
  if (!dateMatch || !timeMatch) return null;
  // Wall-clock arithmetic in UTC fields: no device time zone or DST involved.
  const start = Date.UTC(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
  );
  const end = new Date(start + availableMinutes * 60_000);
  const startDay = Date.UTC(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3]));
  const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const pad = (value: number) => String(value).padStart(2, '0');
  return {
    time: `${pad(end.getUTCHours())}:${pad(end.getUTCMinutes())}`,
    date: `${pad(end.getUTCDate())}/${pad(end.getUTCMonth() + 1)}`,
    dayOffset: Math.round((endDay - startDay) / 86_400_000),
  };
}

/** Vietnam calendar day of an ISO instant as "YYYY-MM-DD" (for grouping stops by day). */
export function vietnamDayKey(isoString?: string): string | null {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TRIPMATE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** "Thứ Sáu, 16/10" in Vietnam time. */
export function formatVietnamDayLabel(isoString?: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: TRIPMATE_TIME_ZONE,
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  }).format(d);
}

export function formatVietnamTime(isoString?: string): string {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:--';
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: TRIPMATE_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return '--:--';
  }
}

// ─── Review 2: stop feasibility and suggestions (§3.4, §3.5) ─────────────────────────────────

export const STOP_INFEASIBLE_REASONS = [
  'ClosedAtArrival',
  'ExceedsEndTime',
  'ExceedsBudget',
  'OutsideRadius',
  'Inactive',
  'NoOpeningHours',
] as const;

export type StopInfeasibleReason = (typeof STOP_INFEASIBLE_REASONS)[number];

export const isStopInfeasibleReason = isOneOf(STOP_INFEASIBLE_REASONS);

export const DISTANCE_SOURCES = ['Road', 'StraightLine'] as const;

/** Problem-details extensions of 422 `itinerary.stop_infeasible`. */
export interface StopInfeasibleDetails {
  poiId: number | null;
  /** null when the API sent no reason or one this client does not know. */
  reason: StopInfeasibleReason | null;
  plannedArrival: string | null;
  /** "HH:mm" */
  closesAt: string | null;
  overflowMinutes: number | null;
  overflowVnd: number | null;
}

export interface TripadvisorRatingDto {
  locationId: number;
  rating: number | null;
  reviewCount: number;
  ratingImageUrl: string | null;
  /** Kept for the contract; TripMate never links out to Tripadvisor. */
  url: string | null;
  /**
   * true = there are recent reviews to read; false = none (Tripadvisor serves only a recent pool, so a
   * place can count reviews with nothing to show); null or absent = not checked.
   */
  hasRecentReviews?: boolean | null;
}

export type SuggestionKind = 'Food' | 'Replace';

export type SuggestionQuery =
  | { kind: 'Food'; afterItemId: number }
  | { kind: 'Replace'; replaceItemId: number };

export interface ItinerarySuggestionDto {
  poiId: number;
  name: string;
  category: string | null;
  thumbnailUrl: string | null;
  address: string | null;
  costKind: CostKind;
  estimatedCost: number | null;
  distanceFromPreviousMeters: number | null;
  /** How much longer the whole trip becomes (negative when shorter). */
  detourMinutes: number | null;
  distanceSource: (typeof DISTANCE_SOURCES)[number];
  estimatedArrival: string | null;
  openAtArrival: boolean | null;
  /** "HH:mm" */
  closesAt: string | null;
  /** null = routing unavailable, fit unknown. */
  fitsItinerary: boolean | null;
  unfitReason: StopInfeasibleReason | null;
  unfitPoiId: number | null;
  overflowMinutes: number | null;
  overflowVnd: number | null;
  tripadvisor: TripadvisorRatingDto | null;
}

export interface ItinerarySuggestionsDto {
  itineraryId: number;
  kind: SuggestionKind;
  searchRadiusKm: number;
  items: ItinerarySuggestionDto[];
}

export function isValidTripadvisorRating(v: unknown): v is TripadvisorRatingDto {
  if (!isRecord(v)) return false;
  const t = v as Partial<TripadvisorRatingDto>;
  return (
    isNumber(t.locationId) &&
    isOptional(t.rating, isNumber) &&
    isNumber(t.reviewCount) &&
    isOptional(t.ratingImageUrl, isString) &&
    isOptional(t.url, isString) &&
    isOptional(t.hasRecentReviews, isBoolean)
  );
}

function isValidSuggestion(v: unknown): boolean {
  if (!isRecord(v)) return false;
  const s = v as Partial<ItinerarySuggestionDto>;
  return (
    isNumber(s.poiId) &&
    isString(s.name) &&
    isOptional(s.category, isString) &&
    isOptional(s.thumbnailUrl, isString) &&
    isOptional(s.address, isString) &&
    isCostKind(s.costKind) &&
    isOptional(s.estimatedCost, isNumber) &&
    isOptional(s.distanceFromPreviousMeters, isNumber) &&
    isOptional(s.detourMinutes, isNumber) &&
    isOneOf(DISTANCE_SOURCES)(s.distanceSource) &&
    isOptional(s.estimatedArrival, isString) &&
    isOptional(s.openAtArrival, isBoolean) &&
    isOptional(s.closesAt, isString) &&
    isOptional(s.fitsItinerary, isBoolean) &&
    isOptional(s.unfitReason, isStopInfeasibleReason) &&
    isOptional(s.unfitPoiId, isNumber) &&
    isOptional(s.overflowMinutes, isNumber) &&
    isOptional(s.overflowVnd, isNumber) &&
    isOptional(s.tripadvisor, isValidTripadvisorRating)
  );
}

export function isValidItinerarySuggestionsDto(v: unknown): v is ItinerarySuggestionsDto {
  if (!isRecord(v)) return false;
  const d = v as Partial<ItinerarySuggestionsDto>;
  return (
    isNumber(d.itineraryId) &&
    (d.kind === 'Food' || d.kind === 'Replace') &&
    isNumber(d.searchRadiusKm) &&
    Array.isArray(d.items) &&
    d.items.every(isValidSuggestion)
  );
}
