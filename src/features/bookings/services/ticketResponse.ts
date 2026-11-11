import { LosslessNumber, parse, toSafeNumberOrThrow } from 'lossless-json';

import { isPositiveInt64 } from '@/features/reviews/types/reviewableRecordId';

import { TICKET_STATUSES, type TicketQr, type TicketStatus, type TicketView } from '../types/ticket';

/** The backend answered 2xx with a body that does not match the UC-29 ticket contract. */
export class InvalidTicketResponseError extends Error {
  constructor() {
    super('The e-ticket response does not match the contract.');
    this.name = 'InvalidTicketResponseError';
  }
}

type Fields = Record<string, unknown>;

const DEPARTURE_DATE = /^\d{4}-\d{2}-\d{2}$/;

function invalid(): never {
  throw new InvalidTicketResponseError();
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

function text(value: unknown): string {
  return typeof value === 'string' && value.length > 0 ? value : invalid();
}

function nullableText(value: unknown): string | null {
  return value === null || value === undefined ? null : text(value);
}

function instant(value: unknown): string {
  const candidate = text(value);
  return Number.isFinite(Date.parse(candidate)) ? candidate : invalid();
}

function nullableInstant(value: unknown): string | null {
  return value === null || value === undefined ? null : instant(value);
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

/** A positive int64 as a decimal string, so it never passes through a lossy JavaScript number. */
function identity(value: unknown): string {
  if (!(value instanceof LosslessNumber)) return invalid();
  return isPositiveInt64(value.value) ? value.value : invalid();
}

function status(value: unknown): TicketStatus {
  return typeof value === 'string' && (TICKET_STATUSES as readonly string[]).includes(value)
    ? (value as TicketStatus)
    : invalid();
}

function qr(value: unknown): TicketQr | null {
  if (value === null) return null;
  const source = fields(value);
  return { content: text(source.content), issuedAtUtc: instant(source.issuedAtUtc) };
}

function read(body: string): unknown {
  try {
    return parse(body);
  } catch {
    return invalid();
  }
}

/** Strictly maps a UC-29 ticket body; unknown properties are dropped. */
export function parseTicket(body: string): TicketView {
  const source = fields(read(body));
  const tour = fields(source.tour);
  const schedule = fields(source.schedule);
  const participants = fields(source.participants);
  const validity = fields(source.validity);
  const departureDate = text(validity.departureDate);
  if (!DEPARTURE_DATE.test(departureDate)) invalid();
  if (!('qr' in source)) invalid();

  return {
    ticketId: identity(source.ticketId),
    ticketCode: text(source.ticketCode),
    bookingId: identity(source.bookingId),
    bookingCode: text(source.bookingCode),
    ticketStatus: status(source.ticketStatus),
    tour: { tourId: identity(tour.tourId), title: text(tour.title) },
    operatorName: typeof source.operatorName === 'string' ? source.operatorName : invalid(),
    schedule: {
      startAtUtc: instant(schedule.startAtUtc),
      endAtUtc: instant(schedule.endAtUtc),
      meetingPoint: nullableText(schedule.meetingPoint),
    },
    participantCount: integer(source.participantCount, 0),
    participants: {
      adult: integer(participants.adult, 0),
      child: integer(participants.child, 0),
      infant: integer(participants.infant, 0),
    },
    validity: {
      departureDate,
      timeZone: text(validity.timeZone),
      validFromUtc: instant(validity.validFromUtc),
      validUntilUtc: instant(validity.validUntilUtc),
    },
    checkedInAtUtc: nullableInstant(source.checkedInAtUtc),
    qr: qr(source.qr),
  };
}
