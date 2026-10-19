/**
 * Review 2 display rules for itinerary prices, legs and edits (spec D1, D5, D9, D11).
 * Pure functions: the components only render what these return.
 */

import { formatVnd } from '@/lib/priceLabel';

import type {
  ItinerarySuggestionDto,
  StopInfeasibleDetails,
  StopInfeasibleReason,
  ItineraryDetailItemDto,
  TransportMode,
} from '../types/schedulingTypes';

/** The one way a stop is named in the UI: its place name, or its position for an unnamed stop. */
export function stopDisplayName(item: Pick<ItineraryDetailItemDto, 'poiName' | 'sequenceNo'>): string {
  return item.poiName ?? `điểm dừng ${item.sequenceNo}`;
}

export interface ItineraryCostSplit {
  tickets: number;
  food: number;
  total: number;
  /** Visit stops whose price is not known yet. */
  unknownCount: number;
}

/** D11-7: split visit costs into tickets and food (client-side by costKind). */
export function splitItineraryCosts(
  items: Array<Pick<ItineraryDetailItemDto, 'kind' | 'poiId' | 'estimatedCost' | 'costKind'>>,
): ItineraryCostSplit {
  let tickets = 0;
  let food = 0;
  let unknownCount = 0;
  for (const item of items) {
    if (item.kind !== 'Visit' || item.poiId === null) continue;
    if (item.estimatedCost === null || item.estimatedCost === undefined) {
      unknownCount += 1;
      continue;
    }
    if (item.costKind === 'AverageSpend') food += item.estimatedCost;
    else tickets += item.estimatedCost;
  }
  return { tickets, food, total: tickets + food, unknownCount };
}

/** "850 m" under one kilometre, otherwise "9,4 km"; null when the distance is unknown. */
export function formatLegDistance(meters: number | null | undefined): string | null {
  if (meters === null || meters === undefined || !Number.isFinite(meters)) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = Math.round(meters / 100) / 10;
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(km)} km`;
}

export function formatMinutes(minutes: number): string {
  const total = Math.round(Math.abs(minutes));
  if (total < 60) return `${total} phút`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${hours} giờ` : `${hours} giờ ${rest} phút`;
}

export function formatLegDuration(minutes: number): string {
  return `khoảng ${formatMinutes(minutes)}`;
}

/** Average walking pace used for the "you could walk" hint (≈ 4.8 km/h). */
const WALKING_METERS_PER_MINUTE = 80;

/** D5: a leg under 1 km that is not walked suggests walking instead. */
export function walkHint(
  meters: number | null | undefined,
  mode: TransportMode | null | undefined,
): string | null {
  if (meters === null || meters === undefined || meters >= 1000 || mode === 'Walking') return null;
  const minutes = Math.max(1, Math.ceil(meters / WALKING_METERS_PER_MINUTE));
  return `Gần, có thể đi bộ ~${minutes} phút`;
}

export const LEG_MODE_LABELS: Record<TransportMode, string> = {
  Walking: '🚶 Đi bộ',
  Motorbike: '🛵 Xe máy',
  Car: '🚗 Ô tô/taxi',
  PublicTransit: '🚌 Xe buýt',
};

export const MOTORBIKE_ESTIMATE_NOTE = 'ⓘ Thời gian xe máy là ước tính theo đường ô tô';

export const RADIUS_WARNING_THRESHOLD_KM = 30;

/** D9 fallback: a wide radius makes long rides likely. */
export function radiusWarning(radiusKm: number): string | null {
  if (radiusKm <= RADIUS_WARNING_THRESHOLD_KM) return null;
  return `Bán kính ${radiusKm} km khá rộng: lịch trình có thể gồm những chặng đi xa và mất nhiều thời gian di chuyển.`;
}

function arrivalMinutes(iso: string): number | null {
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? null : Math.round(time / 60000);
}

/** D11-3: arrival shift (minutes, + later / - earlier) of each POI kept between two versions. */
export function diffArrivalMinutes(
  before: ItineraryDetailItemDto[],
  after: ItineraryDetailItemDto[],
): Map<number, number> {
  const previous = new Map<number, number>();
  for (const item of before) {
    if (item.poiId === null || item.kind !== 'Visit') continue;
    const minutes = arrivalMinutes(item.plannedArrival);
    if (minutes !== null) previous.set(item.poiId, minutes);
  }
  const shifts = new Map<number, number>();
  for (const item of after) {
    if (item.poiId === null || item.kind !== 'Visit') continue;
    const old = previous.get(item.poiId);
    const now = arrivalMinutes(item.plannedArrival);
    if (old === undefined || now === null || now === old) continue;
    shifts.set(item.poiId, now - old);
  }
  return shifts;
}

export function arrivalShiftLabel(deltaMinutes: number): string {
  return deltaMinutes > 0
    ? `⟲ lùi ${formatMinutes(deltaMinutes)}`
    : `⟲ sớm hơn ${formatMinutes(deltaMinutes)}`;
}

/** "HH:mm" of an ISO instant in Vietnam time, or null. */
function vietnamClock(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export type PoiNameLookup = (poiId: number | null) => string | null;

interface ReasonContext {
  plannedArrival?: string | null;
  closesAt: string | null;
  overflowMinutes: number | null;
  overflowVnd: number | null;
}

/**
 * Why a stop does not fit, as a lower-case predicate about that stop. The single source of these texts
 * for both the save error (§3.4) and the greyed suggestions (§3.5).
 */
const REASON_TEXT: Record<StopInfeasibleReason, (context: ReasonContext) => string> = {
  ClosedAtArrival: ({ plannedArrival, closesAt }) => {
    const arrival = vietnamClock(plannedArrival ?? null);
    if (closesAt && arrival) return `đóng cửa lúc ${closesAt}, dự kiến đến lúc ${arrival}`;
    return closesAt ? `đã đóng cửa khi đến (đóng lúc ${closesAt})` : 'đã đóng cửa khi đến';
  },
  ExceedsEndTime: ({ overflowMinutes }) =>
    overflowMinutes ? `vượt giờ kết thúc ${formatMinutes(overflowMinutes)}` : 'vượt giờ kết thúc',
  ExceedsBudget: ({ overflowVnd }) =>
    overflowVnd ? `vượt ngân sách ${formatVnd(overflowVnd)}` : 'vượt ngân sách',
  OutsideRadius: () => 'nằm ngoài bán kính khám phá',
  Inactive: () => 'không còn hoạt động',
  NoOpeningHours: () => 'chưa có giờ mở cửa',
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** D4: Vietnamese explanation of a 422 `itinerary.stop_infeasible`, naming the failing stop. */
export function describeStopInfeasible(
  details: StopInfeasibleDetails,
  nameOf: PoiNameLookup,
): string {
  const prefix = 'Không thể lưu thay đổi: ';
  if (!details.reason) return `${prefix}lịch trình mới không còn khả thi.`;
  const resolvedName = nameOf(details.poiId);
  if (!resolvedName && details.reason === 'ExceedsEndTime') {
    return `${prefix}lịch trình ${REASON_TEXT[details.reason](details)}.`;
  }
  const name = resolvedName ?? 'địa điểm này';
  return `${prefix}"${name}" ${REASON_TEXT[details.reason](details)}.`;
}

/** D11-2: short reason shown on a suggestion. */
export function unfitReasonLabel(
  suggestion: Pick<
    ItinerarySuggestionDto,
    'poiId' | 'unfitReason' | 'unfitPoiId' | 'overflowMinutes' | 'overflowVnd' | 'closesAt'
  >,
  nameOf: PoiNameLookup,
): string {
  if (!suggestion.unfitReason) return 'Không vừa lịch trình hiện tại';
  if (suggestion.unfitReason === 'ExceedsEndTime') {
    return suggestion.overflowMinutes
      ? `Vượt giờ kết thúc ${formatMinutes(suggestion.overflowMinutes)}`
      : 'Vượt giờ kết thúc';
  }
  const text = REASON_TEXT[suggestion.unfitReason](suggestion);

  // A later stop it pushes past closing time is named; otherwise the reason is about this place.
  const otherStop =
    suggestion.unfitPoiId !== null && suggestion.unfitPoiId !== suggestion.poiId
      ? nameOf(suggestion.unfitPoiId)
      : null;
  return otherStop ? `Làm "${otherStop}" ${text}` : capitalize(text);
}


function vietnamDay(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

const time = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : Number.NaN);

/**
 * D11-1: index of the item after which the "🍜 Bữa trưa?" card goes — the leg closest to 12:00 — when
 * the trip covers 11:00–13:30 (Vietnam time) and has no food stop yet; otherwise null.
 */
export function lunchCardAfterIndex(
  items: ItineraryDetailItemDto[],
  validFrom: string | null | undefined,
  validTo: string | null | undefined,
): number | null {
  if (items.length === 0) return null;
  if (items.some((item) => item.kind === 'Visit' && item.costKind === 'AverageSpend')) return null;

  const start = Number.isNaN(time(validFrom)) ? time(items[0].plannedArrival) : time(validFrom);
  const end = Number.isNaN(time(validTo))
    ? time(items[items.length - 1].plannedDeparture)
    : time(validTo);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;

  const days = [...new Set(items.map((item) => vietnamDay(item.plannedArrival)).filter(Boolean))];
  const lunchDay = days.find((day) =>
    start <= time(`${day}T11:00:00+07:00`) && end >= time(`${day}T13:30:00+07:00`));
  if (!lunchDay) return null;

  const noon = time(`${lunchDay}T12:00:00+07:00`);
  const lastLeg = Math.max(items.length - 2, 0);
  let best: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index <= lastLeg; index += 1) {
    const leave = time(items[index].plannedDeparture);
    const arrive = items[index + 1] ? time(items[index + 1].plannedArrival) : leave;
    if (Number.isNaN(leave) || Number.isNaN(arrive)) continue;
    const distance = Math.abs((leave + arrive) / 2 - noon);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  }
  return best;
}
