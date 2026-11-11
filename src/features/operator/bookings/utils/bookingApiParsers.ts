/**
 * Runtime validation of the Backend UC-40 responses (`Capstone_BE/docs/UC-40-api-contract.md`).
 * Every live response is parsed here before it reaches a component: a body that does not match the
 * contract throws `BookingApiParseError` and the caller treats it as a system failure. Parsed values are
 * rebuilt field by field, so a field the contract says is never returned (ID documents, gateway payloads)
 * cannot reach the UI even if a response carried it.
 */
import type {
  BookingBookerDetailDto,
  BookingBookerDto,
  BookingCouponDto,
  BookingDetailDto,
  BookingListItemDto,
  BookingListResult,
  BookingParticipantDto,
  BookingPaymentDto,
  BookingScheduleDetailDto,
  BookingScheduleDto,
  BookingStatus,
  BookingSummaryMetrics,
  BookingTicketDto,
  BookingTourDto,
  CancelBlockedReason,
  CheckInStatus,
  ParticipantType,
  PaymentGateway,
  PaymentStatus,
  PaymentTransactionStatus,
  TicketStatus,
} from '../types/bookingLifecycle';

export class BookingApiParseError extends Error {
  constructor(public readonly path: string) {
    super(`Invalid booking API response at ${path}.`);
    this.name = 'BookingApiParseError';
  }
}

const BOOKING_STATUSES: readonly BookingStatus[] = [
  'PendingPayment',
  'Confirmed',
  'Cancelled',
  'Completed',
  'Expired',
];
const PAYMENT_STATUSES: readonly PaymentStatus[] = ['Unpaid', 'Paid', 'Refunded', 'PartiallyRefunded'];
const CHECK_IN_STATUSES: readonly CheckInStatus[] = ['NotCheckedIn', 'CheckedIn'];
const PARTICIPANT_TYPES: readonly ParticipantType[] = ['Adult', 'Child', 'Infant'];
const PAYMENT_GATEWAYS: readonly PaymentGateway[] = ['Mock', 'PayOS', 'VNPAY', 'MoMo', 'Stripe'];
const TICKET_STATUSES: readonly TicketStatus[] = ['Valid', 'Used', 'Cancelled', 'Expired'];
const PAYMENT_TRANSACTION_STATUSES: readonly PaymentTransactionStatus[] = [
  'Pending',
  'Success',
  'Cancelled',
  'Expired',
  'Failed',
];
const CANCEL_BLOCKED_REASONS: readonly CancelBlockedReason[] = ['InvalidStatus', 'CheckedIn'];

type Json = Record<string, unknown>;

function isRecord(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function record(value: unknown, path: string): Json {
  if (!isRecord(value)) throw new BookingApiParseError(path);
  return value;
}

function text(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new BookingApiParseError(path);
  return value;
}

function nullableText(value: unknown, path: string): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') throw new BookingApiParseError(path);
  return value;
}

/** Ids are JSON strings holding a positive integer. */
function id(value: unknown, path: string): string {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) throw new BookingApiParseError(path);
  return value;
}

function timestamp(value: unknown, path: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new BookingApiParseError(path);
  }
  return value;
}

function nullableTimestamp(value: unknown, path: string): string | null {
  return value === null ? null : timestamp(value, path);
}

function money(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new BookingApiParseError(path);
  return value;
}

function count(value: unknown, path: string, minimum = 0): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum) {
    throw new BookingApiParseError(path);
  }
  return value;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], path: string): T {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    throw new BookingApiParseError(path);
  }
  return value as T;
}

function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new BookingApiParseError(path);
  return value;
}

function tour(value: unknown, path: string): BookingTourDto {
  const source = record(value, path);
  return { tourId: id(source.tourId, `${path}.tourId`), title: text(source.title, `${path}.title`) };
}

function schedule(value: unknown, path: string): BookingScheduleDto {
  const source = record(value, path);
  return {
    scheduleId: id(source.scheduleId, `${path}.scheduleId`),
    startAtUtc: timestamp(source.startAtUtc, `${path}.startAtUtc`),
    endAtUtc: timestamp(source.endAtUtc, `${path}.endAtUtc`),
  };
}

function scheduleDetail(value: unknown, path: string): BookingScheduleDetailDto {
  const source = record(value, path);
  return { ...schedule(source, path), meetingPoint: nullableText(source.meetingPoint, `${path}.meetingPoint`) };
}

function booker(value: unknown, path: string): BookingBookerDto {
  const source = record(value, path);
  return {
    userId: id(source.userId, `${path}.userId`),
    fullName: text(source.fullName, `${path}.fullName`),
    email: nullableText(source.email, `${path}.email`),
  };
}

function bookerDetail(value: unknown, path: string): BookingBookerDetailDto {
  const source = record(value, path);
  return { ...booker(source, path), phoneNumber: nullableText(source.phoneNumber, `${path}.phoneNumber`) };
}

function listItem(value: unknown, path: string): BookingListItemDto {
  const source = record(value, path);
  return {
    bookingId: id(source.bookingId, `${path}.bookingId`),
    bookingCode: text(source.bookingCode, `${path}.bookingCode`),
    tour: tour(source.tour, `${path}.tour`),
    schedule: schedule(source.schedule, `${path}.schedule`),
    booker: booker(source.booker, `${path}.booker`),
    quantity: count(source.quantity, `${path}.quantity`, 1),
    totalAmount: money(source.totalAmount, `${path}.totalAmount`),
    discountAmount: money(source.discountAmount, `${path}.discountAmount`),
    status: oneOf(source.status, BOOKING_STATUSES, `${path}.status`),
    paymentStatus: oneOf(source.paymentStatus, PAYMENT_STATUSES, `${path}.paymentStatus`),
    checkInStatus: oneOf(source.checkInStatus, CHECK_IN_STATUSES, `${path}.checkInStatus`),
    checkedInAtUtc: nullableTimestamp(source.checkedInAtUtc, `${path}.checkedInAtUtc`),
    bookedAtUtc: timestamp(source.bookedAtUtc, `${path}.bookedAtUtc`),
  };
}

function summary(value: unknown, path: string): BookingSummaryMetrics {
  const source = record(value, path);
  return {
    totalBookings: count(source.totalBookings, `${path}.totalBookings`),
    totalParticipants: count(source.totalParticipants, `${path}.totalParticipants`),
    totalConfirmedAmount: money(source.totalConfirmedAmount, `${path}.totalConfirmedAmount`),
  };
}

/** Parses `GET /api/v1/operator/bookings` into the list result the UI renders. */
export function parseBookingListResponse(body: unknown): BookingListResult {
  const source = record(body, 'list');
  return {
    page: count(source.pageNumber, 'list.pageNumber', 1),
    pageSize: count(source.pageSize, 'list.pageSize', 1),
    totalCount: count(source.totalCount, 'list.totalCount'),
    totalPages: count(source.totalPages, 'list.totalPages'),
    summary: summary(source.summary, 'list.summary'),
    items: array(source.items, 'list.items').map((item, index) => listItem(item, `list.items[${index}]`)),
  };
}

function participant(value: unknown, path: string): BookingParticipantDto {
  const source = record(value, path);
  return {
    fullName: text(source.fullName, `${path}.fullName`),
    participantType: oneOf(source.participantType, PARTICIPANT_TYPES, `${path}.participantType`),
  };
}

function ticket(value: unknown, path: string): BookingTicketDto | null {
  if (value === null) return null;
  const source = record(value, path);
  return {
    ticketCode: text(source.ticketCode, `${path}.ticketCode`),
    status: oneOf(source.status, TICKET_STATUSES, `${path}.status`),
    issuedAtUtc: timestamp(source.issuedAtUtc, `${path}.issuedAtUtc`),
    expiresAtUtc: nullableTimestamp(source.expiresAtUtc, `${path}.expiresAtUtc`),
  };
}

function payment(value: unknown, path: string): BookingPaymentDto | null {
  if (value === null) return null;
  const source = record(value, path);
  return {
    gateway: oneOf(source.gateway, PAYMENT_GATEWAYS, `${path}.gateway`),
    gatewayTransactionRef: nullableText(source.gatewayTransactionRef, `${path}.gatewayTransactionRef`),
    status: oneOf(source.status, PAYMENT_TRANSACTION_STATUSES, `${path}.status`),
    amount: money(source.amount, `${path}.amount`),
    succeededAtUtc: nullableTimestamp(source.succeededAtUtc, `${path}.succeededAtUtc`),
  };
}

function coupon(value: unknown, path: string): BookingCouponDto | null {
  if (value === null) return null;
  const source = record(value, path);
  return {
    code: text(source.code, `${path}.code`),
    name: text(source.name, `${path}.name`),
    discountAmount: money(source.discountAmount, `${path}.discountAmount`),
  };
}

/** Parses `GET /api/v1/operator/bookings/{bookingId}`. */
export function parseBookingDetailResponse(body: unknown): BookingDetailDto {
  const source = record(body, 'detail');
  if (typeof source.canCancel !== 'boolean') throw new BookingApiParseError('detail.canCancel');
  const blocked =
    source.cancelBlockedReason === null
      ? null
      : oneOf(source.cancelBlockedReason, CANCEL_BLOCKED_REASONS, 'detail.cancelBlockedReason');

  return {
    bookingId: id(source.bookingId, 'detail.bookingId'),
    bookingCode: text(source.bookingCode, 'detail.bookingCode'),
    status: oneOf(source.status, BOOKING_STATUSES, 'detail.status'),
    paymentStatus: oneOf(source.paymentStatus, PAYMENT_STATUSES, 'detail.paymentStatus'),
    bookedAtUtc: timestamp(source.bookedAtUtc, 'detail.bookedAtUtc'),
    cancelledAtUtc: nullableTimestamp(source.cancelledAtUtc, 'detail.cancelledAtUtc'),
    cancelReason: nullableText(source.cancelReason, 'detail.cancelReason'),
    tour: tour(source.tour, 'detail.tour'),
    schedule: scheduleDetail(source.schedule, 'detail.schedule'),
    booker: bookerDetail(source.booker, 'detail.booker'),
    quantity: count(source.quantity, 'detail.quantity', 1),
    participants: array(source.participants, 'detail.participants').map((item, index) =>
      participant(item, `detail.participants[${index}]`)
    ),
    ticket: ticket(source.ticket, 'detail.ticket'),
    checkInStatus: oneOf(source.checkInStatus, CHECK_IN_STATUSES, 'detail.checkInStatus'),
    checkedInAtUtc: nullableTimestamp(source.checkedInAtUtc, 'detail.checkedInAtUtc'),
    payment: payment(source.payment, 'detail.payment'),
    paidAmount: money(source.paidAmount, 'detail.paidAmount'),
    subtotalAmount: money(source.subtotalAmount, 'detail.subtotalAmount'),
    discountAmount: money(source.discountAmount, 'detail.discountAmount'),
    totalAmount: money(source.totalAmount, 'detail.totalAmount'),
    coupon: coupon(source.coupon, 'detail.coupon'),
    canCancel: source.canCancel,
    cancelBlockedReason: blocked,
  };
}

export interface BookingTourOption {
  id: string;
  title: string;
}

/**
 * Parses the owned-tour list used for the tour filter (BFF `GET /api/operator/revenue/tours`,
 * a plain array of `{ id, code, title, isActive }`). Only the id and the title are kept.
 */
export function parseBookingTourOptionsResponse(body: unknown): BookingTourOption[] {
  return array(body, 'tours').map((entry, index) => {
    const source = record(entry, `tours[${index}]`);
    if (typeof source.id !== 'number' || !Number.isSafeInteger(source.id) || source.id <= 0) {
      throw new BookingApiParseError(`tours[${index}].id`);
    }
    return { id: String(source.id), title: text(source.title, `tours[${index}].title`) };
  });
}
