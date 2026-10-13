/**
 * TripMate UC-10 — Create Scheduling Request Types & Data Contracts
 * Strictly aligned with Capstone_BE SchedulingRequestsController & Domain Enums
 */


export type TransportMode = 'Walking' | 'Motorbike' | 'Car' | 'PublicTransit';


export type RestPreference = 'Auto' | 'None' | 'Frequent';

export type ItineraryItemKind = 'Visit' | 'Rest';

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
      typeof i.isUnavailable !== 'boolean'
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
        typeof i.recommendationReason !== 'string')
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
