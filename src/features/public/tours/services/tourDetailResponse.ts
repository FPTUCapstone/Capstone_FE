import {
  TourApiError,
  type TourCancellationRuleDto,
  type TourDetailDto,
  type TourItineraryDayDto,
  type TourScheduleDto,
} from '../types/tour';

/**
 * UC-26 wire contract: `GET /api/v1/tours/{tourId}` (Capstone_BE `TourDetailDto`).
 * Identity values are strings, prices are whole VND, timestamps are UTC ISO strings.
 * Optional values may arrive as null or be omitted; both are normalised to null here.
 */
export type TourAvailabilityStatus = 'available' | 'soldOut' | 'unknown';

export interface TourDetailWire {
  tourId: string;
  title: string;
  description: string | null;
  destination: string;
  destinations: string[];
  durationDays: number;
  basePrice: number;
  currency: string;
  operator: { name: string; contactPhone: string | null };
  images: { url: string; altText: string; caption: string | null; isPrimary: boolean }[];
  inclusions: string | null;
  exclusions: string | null;
  cancellationPolicy: { rules: TourCancellationRuleDto[] };
  itinerary: {
    dayNo: number;
    items: {
      sequenceNo: number;
      poi: { poiId: string; name: string; address: string | null; latitude: number; longitude: number };
      plannedTime: string | null;
      stayDurationMinutes: number;
      notes: string | null;
    }[];
  }[];
  schedules: {
    scheduleId: string;
    startAtUtc: string;
    endAtUtc: string;
    meetingPoint: string | null;
    registrationDeadlineAtUtc: string | null;
    adultPrice: number;
    childPrice: number | null;
    infantPrice: number | null;
    remainingSlots: number | null;
    availabilityStatus: TourAvailabilityStatus;
    bookable: boolean;
  }[];
  hasBookableSchedule: boolean;
  rating: { average: number | null; count: number };
  asOfUtc: string;
}

const INVALID = 'Dữ liệu chi tiết tour không hợp lệ.';

function invalid(): never {
  throw new TourApiError(INVALID, 0);
}

type Rec = Record<string, unknown>;

function asRecord(value: unknown): Rec {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) invalid();
  return value as Rec;
}

function asArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) invalid();
  return value;
}

function text(value: unknown, { allowEmpty = true }: { allowEmpty?: boolean } = {}): string {
  if (typeof value !== 'string') invalid();
  if (!allowEmpty && value.trim().length === 0) invalid();
  return value;
}

function nullableText(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return text(value);
}

function finiteNumber(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) invalid();
  return value;
}

function nonNegativeInteger(value: unknown): number {
  const number = finiteNumber(value);
  if (!Number.isInteger(number) || number < 0) invalid();
  return number;
}

function nullableNumber(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  return finiteNumber(value);
}

function nullableNonNegativeInteger(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  return nonNegativeInteger(value);
}

function bool(value: unknown): boolean {
  if (typeof value !== 'boolean') invalid();
  return value;
}

function availability(value: unknown): TourAvailabilityStatus {
  if (value !== 'available' && value !== 'soldOut' && value !== 'unknown') invalid();
  return value;
}

/** Validates the Backend payload field by field; anything unexpected is rejected, never rendered. */
export function parseTourDetailResponse(payload: unknown): TourDetailWire {
  const root = asRecord(payload);
  const operator = asRecord(root.operator);
  const policy = asRecord(root.cancellationPolicy);
  const rating = asRecord(root.rating);

  return {
    tourId: text(root.tourId, { allowEmpty: false }),
    title: text(root.title),
    description: nullableText(root.description),
    destination: text(root.destination),
    destinations: asArray(root.destinations).map((name) => text(name)),
    durationDays: nonNegativeInteger(root.durationDays),
    basePrice: finiteNumber(root.basePrice),
    currency: text(root.currency, { allowEmpty: false }),
    operator: { name: text(operator.name), contactPhone: nullableText(operator.contactPhone) },
    images: asArray(root.images).map((entry) => {
      const image = asRecord(entry);
      return {
        url: text(image.url, { allowEmpty: false }),
        altText: text(image.altText),
        caption: nullableText(image.caption),
        isPrimary: bool(image.isPrimary),
      };
    }),
    inclusions: nullableText(root.inclusions),
    exclusions: nullableText(root.exclusions),
    cancellationPolicy: {
      rules: asArray(policy.rules).map((entry) => {
        const rule = asRecord(entry);
        return {
          daysBeforeDeparture: nonNegativeInteger(rule.daysBeforeDeparture),
          cancellationFeePercent: finiteNumber(rule.cancellationFeePercent),
        };
      }),
    },
    itinerary: asArray(root.itinerary).map((entry) => {
      const day = asRecord(entry);
      return {
        dayNo: nonNegativeInteger(day.dayNo),
        items: asArray(day.items).map((itemEntry) => {
          const item = asRecord(itemEntry);
          const poi = asRecord(item.poi);
          return {
            sequenceNo: nonNegativeInteger(item.sequenceNo),
            poi: {
              poiId: text(poi.poiId, { allowEmpty: false }),
              name: text(poi.name),
              address: nullableText(poi.address),
              latitude: finiteNumber(poi.latitude),
              longitude: finiteNumber(poi.longitude),
            },
            plannedTime: nullableText(item.plannedTime),
            stayDurationMinutes: nonNegativeInteger(item.stayDurationMinutes),
            notes: nullableText(item.notes),
          };
        }),
      };
    }),
    schedules: asArray(root.schedules).map((entry) => {
      const schedule = asRecord(entry);
      return {
        scheduleId: text(schedule.scheduleId, { allowEmpty: false }),
        startAtUtc: text(schedule.startAtUtc, { allowEmpty: false }),
        endAtUtc: text(schedule.endAtUtc, { allowEmpty: false }),
        meetingPoint: nullableText(schedule.meetingPoint),
        registrationDeadlineAtUtc: nullableText(schedule.registrationDeadlineAtUtc),
        adultPrice: finiteNumber(schedule.adultPrice),
        childPrice: nullableNumber(schedule.childPrice),
        infantPrice: nullableNumber(schedule.infantPrice),
        remainingSlots: nullableNonNegativeInteger(schedule.remainingSlots),
        availabilityStatus: availability(schedule.availabilityStatus),
        bookable: bool(schedule.bookable),
      };
    }),
    hasBookableSchedule: bool(root.hasBookableSchedule),
    rating: { average: nullableNumber(rating.average), count: nonNegativeInteger(rating.count) },
    asOfUtc: text(root.asOfUtc, { allowEmpty: false }),
  };
}

function formatPercent(value: number): string {
  return `${Number.isInteger(value) ? value : Number(value.toFixed(2))}%`;
}

/**
 * Each rule applies from its notice period down to the next shorter rule (the Backend snapshot copies the
 * operator's template: 30 → free, 15 → 25 %, 7 → 50 %, 0 → 100 %).
 */
export function describeCancellationRules(rules: readonly TourCancellationRuleDto[]): string[] {
  const ordered = [...rules].sort((a, b) => b.daysBeforeDeparture - a.daysBeforeDeparture);
  return ordered.map((rule, index) => {
    const fee = rule.cancellationFeePercent === 0 ? 'miễn phí' : `phí ${formatPercent(rule.cancellationFeePercent)}`;
    const days = rule.daysBeforeDeparture;
    if (index === 0) {
      return days === 0
        ? `Hủy bất kỳ lúc nào: ${fee}`
        : `Hủy từ ${days} ngày trước ngày khởi hành: ${fee}`;
    }

    if (days === 0) {
      return `Hủy dưới ${ordered[index - 1].daysBeforeDeparture} ngày trước: ${fee}`;
    }

    const upper = ordered[index - 1].daysBeforeDeparture - 1;
    return upper === days
      ? `Hủy đúng ${days} ngày trước: ${fee}`
      : `Hủy từ ${days} đến ${upper} ngày trước: ${fee}`;
  });
}

function toLines(value: string | null): string[] {
  if (value === null) return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-•*]\s*/, '').trim())
    .filter((line) => line.length > 0);
}

function mapStatus(status: TourAvailabilityStatus): TourScheduleDto['status'] {
  if (status === 'available') return 'Available';
  if (status === 'soldOut') return 'SoldOut';
  return 'Scheduled';
}

/** Maps the validated wire payload to the page view model used by the detail and booking screens. */
export function mapTourDetailResponse(wire: TourDetailWire): TourDetailDto {
  const schedules: TourScheduleDto[] = wire.schedules.map((schedule) => ({
    scheduleId: schedule.scheduleId,
    tourId: wire.tourId,
    startDatetime: schedule.startAtUtc,
    endDatetime: schedule.endAtUtc,
    remainingSlots: schedule.remainingSlots ?? 0,
    price: schedule.adultPrice,
    currency: wire.currency,
    status: mapStatus(schedule.availabilityStatus),
    meetingPoint: schedule.meetingPoint ?? undefined,
    registrationDeadline: schedule.registrationDeadlineAtUtc ?? undefined,
    childPrice: schedule.childPrice ?? undefined,
    infantPrice: schedule.infantPrice ?? undefined,
    bookable: schedule.bookable,
  }));
  const meetingSchedule = schedules.find((schedule) => schedule.bookable) ?? schedules[0];
  const itinerary: TourItineraryDayDto[] = wire.itinerary.map((day) => ({
    dayNumber: day.dayNo,
    title: `Ngày ${day.dayNo}`,
    description: '',
    activities: [],
    stops: day.items.map((item) => ({
      sequenceNo: item.sequenceNo,
      poiId: item.poi.poiId,
      poiName: item.poi.name,
      address: item.poi.address ?? undefined,
      plannedTime: item.plannedTime ?? undefined,
      stayDurationMinutes: item.stayDurationMinutes,
      notes: item.notes ?? undefined,
    })),
  }));
  const rules = wire.cancellationPolicy.rules;

  return {
    tourId: wire.tourId,
    title: wire.title,
    description: wire.description ?? '',
    destinations: wire.destinations,
    destinationSummary: wire.destination,
    operatorName: wire.operator.name,
    operatorContact: wire.operator.contactPhone ?? undefined,
    durationDays: wire.durationDays,
    basePrice: wire.basePrice,
    currency: wire.currency,
    aggregateRating: wire.rating.count > 0 ? wire.rating.average : null,
    reviewCount: wire.rating.count,
    rating: { average: wire.rating.average, count: wire.rating.count },
    images: wire.images.map((image) => image.url),
    inclusions: toLines(wire.inclusions),
    exclusions: toLines(wire.exclusions),
    cancellationPolicy: describeCancellationRules(rules).join('\n'),
    cancellationRules: rules,
    meetingPoint: meetingSchedule?.meetingPoint ?? '',
    schedules,
    hasBookableSchedule: wire.hasBookableSchedule,
    itinerary,
    reviews: [],
    asOfUtc: wire.asOfUtc,
  };
}
