import { LosslessNumber, parse, toSafeNumberOrThrow } from 'lossless-json';

import { isPositiveInt64 } from '@/features/reviews/types/reviewableRecordId';

import {
  TRIP_TABS,
  type BookingTripDetail,
  type BookingTripItem,
  type ItineraryTripDetail,
  type ItineraryTripItem,
  type TripActions,
  type TripCancellationInfo,
  type TripDetail,
  type TripHistoryPage,
  type TripListItem,
  type TripParticipantCounts,
  type TripRefundInfo,
  type TripReviewState,
  type TripScheduleInfo,
  type TripSessionInfo,
  type TripStop,
  type TripSummary,
  type TripTab,
  type TripTourInfo,
  type TripVisitStatus,
} from '../types/tripHistoryContract';

/** The backend answered 2xx with a body that does not match the Trip History contract. */
export class InvalidTripResponseError extends Error {
  constructor() {
    super('The trip history response does not match the contract.');
    this.name = 'InvalidTripResponseError';
  }
}

type Fields = Record<string, unknown>;

function invalid(): never {
  throw new InvalidTripResponseError();
}

function fields(value: unknown): Fields {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    value instanceof LosslessNumber ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    return invalid();
  }
  return value as Fields;
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : invalid();
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : invalid();
}

function nullableText(value: unknown): string | null {
  return value === null || value === undefined ? null : text(value);
}

function bool(value: unknown): boolean {
  return typeof value === 'boolean' ? value : invalid();
}

function instant(value: unknown): string {
  const candidate = text(value);
  return Number.isFinite(Date.parse(candidate)) ? candidate : invalid();
}

function nullableInstant(value: unknown): string | null {
  return value === null || value === undefined ? null : instant(value);
}

function optionalInstant(value: unknown): string | undefined {
  return value === null || value === undefined ? undefined : instant(value);
}

/** A whole number at or above `min`; a fractional or unsafe number is rejected, never rounded. */
function integer(value: unknown, min: number): number {
  if (!(value instanceof LosslessNumber) || !/^-?\d+$/.test(value.value)) return invalid();
  let parsed: number;
  try {
    parsed = toSafeNumberOrThrow(value.value);
  } catch {
    return invalid();
  }
  return parsed >= min ? parsed : invalid();
}

function money(value: unknown): number {
  if (!(value instanceof LosslessNumber)) return invalid();
  let parsed: number;
  try {
    parsed = toSafeNumberOrThrow(value.value);
  } catch {
    return invalid();
  }
  return parsed >= 0 ? parsed : invalid();
}

/** A positive int64 as a decimal string, so it never passes through a lossy JavaScript number. */
function identity(value: unknown): string {
  if (!(value instanceof LosslessNumber)) return invalid();
  return isPositiveInt64(value.value) ? value.value : invalid();
}

function nullableIdentity(value: unknown): string | null {
  return value === null || value === undefined ? null : identity(value);
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : invalid();
}

function actions(value: unknown): TripActions {
  const source = fields(value);
  return {
    canReview: bool(source.canReview),
    canViewETicket: bool(source.canViewETicket),
    ticketId: nullableIdentity(source.ticketId),
    canViewRefund: bool(source.canViewRefund),
  };
}

function reviewState(value: unknown): TripReviewState {
  const source = fields(value);
  if (!bool(source.exists)) return { exists: false };
  return { exists: true, reviewId: identity(source.reviewId), rating: ratingValue(source.rating) };
}

function ratingValue(value: unknown): number {
  const rating = integer(value, 1);
  return rating <= 5 ? rating : invalid();
}

function bookingItem(source: Fields): BookingTripItem {
  const id = identity(source.id);
  const record = fields(source.reviewableRecord);
  if (record.kind !== 'commerceBooking' || identity(record.id) !== id) invalid();
  return {
    kind: 'commerceBooking',
    id,
    tripType: oneOf(source.tripType, ['TourBooking'] as const),
    tab: oneOf<TripTab>(source.tab, TRIP_TABS),
    title: text(source.title),
    departureAtUtc: instant(source.departureAtUtc),
    status: text(source.status),
    bookingCode: text(source.bookingCode),
    participantCount: integer(source.participantCount, 0),
    totalAmount: money(source.totalAmount),
    reviewableRecord: { kind: 'commerceBooking', id },
    actions: actions(source.actions),
    review: reviewState(source.review),
  };
}

function itineraryItem(source: Fields): ItineraryTripItem {
  if (source.reviewableRecord !== null || source.review !== null) invalid();
  const stopCount = integer(source.stopCount, 0);
  const item: ItineraryTripItem = {
    kind: 'itinerary',
    id: identity(source.id),
    tripType: oneOf(source.tripType, ['SelfPlannedItinerary'] as const),
    tab: oneOf<TripTab>(source.tab, TRIP_TABS),
    title: text(source.title),
    departureAtUtc: instant(source.departureAtUtc),
    status: text(source.status),
    stopCount,
    reviewableRecord: null,
    actions: actions(source.actions),
    review: null,
  };
  if (source.visitedCount !== undefined && source.visitedCount !== null) {
    const visitedCount = integer(source.visitedCount, 0);
    if (visitedCount > stopCount) invalid();
    item.visitedCount = visitedCount;
  }
  return item;
}

function listItem(value: unknown): TripListItem {
  const source = fields(value);
  if (source.kind === 'commerceBooking') return bookingItem(source);
  if (source.kind === 'itinerary') return itineraryItem(source);
  return invalid();
}

function summary(value: unknown): TripSummary | undefined {
  if (value === null || value === undefined) return undefined;
  const source = fields(value);
  return {
    totalCompletedTrips: integer(source.totalCompletedTrips, 0),
    totalVisitedPois: integer(source.totalVisitedPois, 0),
  };
}

function read(textBody: string): unknown {
  try {
    return parse(textBody);
  } catch {
    return invalid();
  }
}

export function parseTripHistoryPage(body: string): TripHistoryPage {
  const source = fields(read(body));
  const result: TripHistoryPage = {
    items: array(source.items).map(listItem),
    page: integer(source.page, 1),
    pageSize: integer(source.pageSize, 1),
    totalCount: integer(source.totalCount, 0),
  };
  const totals = summary(source.summary);
  if (totals) result.summary = totals;
  return result;
}

function tour(value: unknown): TripTourInfo {
  const source = fields(value);
  return { title: text(source.title), destinationSummary: text(source.destinationSummary) };
}

function schedule(value: unknown): TripScheduleInfo {
  const source = fields(value);
  return {
    startAtUtc: instant(source.startAtUtc),
    endAtUtc: instant(source.endAtUtc),
    meetingPoint: nullableText(source.meetingPoint),
  };
}

function participants(value: unknown): TripParticipantCounts {
  const source = fields(value);
  return {
    adult: integer(source.adult, 0),
    child: integer(source.child, 0),
    infant: integer(source.infant, 0),
  };
}

function cancellation(value: unknown): TripCancellationInfo {
  const source = fields(value);
  return { cancelledAtUtc: nullableInstant(source.cancelledAtUtc), reason: nullableText(source.reason) };
}

function refund(value: unknown): TripRefundInfo {
  const source = fields(value);
  return { status: text(source.status), amount: money(source.amount), channel: nullableText(source.channel) };
}

const VISIT_STATUSES: readonly TripVisitStatus[] = ['Reached', 'Skipped', 'Pending'];

function stop(value: unknown): TripStop {
  const source = fields(value);
  const result: TripStop = {
    sequenceNo: integer(source.sequenceNo, 1),
    poiId: identity(source.poiId),
    poiName: text(source.poiName),
    plannedArrivalUtc: nullableInstant(source.plannedArrivalUtc),
    plannedDepartureUtc: nullableInstant(source.plannedDepartureUtc),
  };
  if (source.visitStatus !== undefined && source.visitStatus !== null) {
    result.visitStatus = oneOf(source.visitStatus, VISIT_STATUSES);
  }
  const reachedAtUtc = optionalInstant(source.reachedAtUtc);
  if (reachedAtUtc) result.reachedAtUtc = reachedAtUtc;
  const skippedAtUtc = optionalInstant(source.skippedAtUtc);
  if (skippedAtUtc) result.skippedAtUtc = skippedAtUtc;
  return result;
}

function session(value: unknown): TripSessionInfo {
  const source = fields(value);
  return {
    startedAtUtc: instant(source.startedAtUtc),
    endedAtUtc: nullableInstant(source.endedAtUtc),
    completionReason: nullableText(source.completionReason),
  };
}

export function parseTripDetail(body: string): TripDetail {
  const source = fields(read(body));

  if (source.kind === 'commerceBooking') {
    const detail: BookingTripDetail = {
      ...bookingItem(source),
      tour: tour(source.tour),
      schedule: schedule(source.schedule),
      participants: participants(source.participants),
    };
    if (source.cancellation !== undefined && source.cancellation !== null) {
      detail.cancellation = cancellation(source.cancellation);
    }
    if (source.refund !== undefined && source.refund !== null) detail.refund = refund(source.refund);
    return detail;
  }

  if (source.kind === 'itinerary') {
    const detail: ItineraryTripDetail = {
      ...itineraryItem(source),
      stops: array(source.stops).map(stop),
    };
    const validFromUtc = optionalInstant(source.validFromUtc);
    if (validFromUtc) detail.validFromUtc = validFromUtc;
    const validToUtc = optionalInstant(source.validToUtc);
    if (validToUtc) detail.validToUtc = validToUtc;
    if (source.session !== undefined && source.session !== null) detail.session = session(source.session);
    return detail;
  }

  return invalid();
}
