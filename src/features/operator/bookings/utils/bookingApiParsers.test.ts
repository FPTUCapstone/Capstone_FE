import { describe, expect, it } from 'vitest';
import {
  BookingApiParseError,
  parseBookingDetailResponse,
  parseBookingListResponse,
  parseBookingTourOptionsResponse,
} from './bookingApiParsers';

import { detailExample, listExample } from './bookingApiFixtures';

type Json = Record<string, unknown>;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
function without(source: Json, key: string): Json {
  const copy = clone(source);
  delete copy[key];
  return copy;
}

describe('parseBookingListResponse', () => {
  it('accepts the contract example and maps pageNumber to page', () => {
    const result = parseBookingListResponse(listExample());

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.totalCount).toBe(37);
    expect(result.totalPages).toBe(2);
    expect(result.summary).toEqual({ totalBookings: 37, totalParticipants: 112, totalConfirmedAmount: 98400000 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].booker.email).toBe('a@example.com');
    expect(result.items[0].checkedInAtUtc).toBeNull();
  });

  it('accepts an empty page with a zero summary', () => {
    const empty = {
      pageNumber: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
      summary: { totalBookings: 0, totalParticipants: 0, totalConfirmedAmount: 0 },
      items: [],
    };
    expect(parseBookingListResponse(empty).items).toEqual([]);
  });

  it('accepts a null booker e-mail and a present check-in time', () => {
    const body = listExample();
    body.items[0].booker.email = null as unknown as string;
    body.items[0].checkInStatus = 'CheckedIn';
    body.items[0].checkedInAtUtc = '2026-11-02T01:00:00+00:00' as unknown as null;
    const item = parseBookingListResponse(body).items[0];
    expect(item.booker.email).toBeNull();
    expect(item.checkedInAtUtc).toBe('2026-11-02T01:00:00+00:00');
  });

  it('does not copy unknown extra fields onto the parsed item', () => {
    const body = listExample() as Json;
    (body.items as Json[])[0].internalNote = 'secret';
    const item = parseBookingListResponse(body)!.items[0] as unknown as Json;
    expect('internalNote' in item).toBe(false);
  });

  it.each([
    ['null body', null],
    ['array body', []],
    ['string body', 'nope'],
  ])('rejects %s', (_label, body) => {
    expect(() => parseBookingListResponse(body)).toThrow(BookingApiParseError);
  });

  it.each(['pageNumber', 'pageSize', 'totalCount', 'totalPages', 'summary', 'items'])(
    'rejects a missing %s',
    (key) => {
      expect(() => parseBookingListResponse(without(listExample(), key))).toThrow(BookingApiParseError);
    }
  );

  it.each([
    ['unknown status', (b: ReturnType<typeof listExample>) => { b.items[0].status = 'Open'; }],
    ['unknown payment status', (b: ReturnType<typeof listExample>) => { b.items[0].paymentStatus = 'Maybe'; }],
    ['unknown check-in status', (b: ReturnType<typeof listExample>) => { b.items[0].checkInStatus = 'Late'; }],
    ['numeric booking id', (b: ReturnType<typeof listExample>) => { (b.items[0] as Json).bookingId = 1201; }],
    ['non-numeric tour id', (b: ReturnType<typeof listExample>) => { b.items[0].tour.tourId = 'abc'; }],
    ['negative amount', (b: ReturnType<typeof listExample>) => { b.items[0].totalAmount = -1; }],
    ['non-finite amount', (b: ReturnType<typeof listExample>) => { (b.items[0] as Json).totalAmount = 'NaN'; }],
    ['zero quantity', (b: ReturnType<typeof listExample>) => { b.items[0].quantity = 0; }],
    ['fractional quantity', (b: ReturnType<typeof listExample>) => { b.items[0].quantity = 1.5; }],
    ['non-ISO schedule start', (b: ReturnType<typeof listExample>) => { b.items[0].schedule.startAtUtc = 'tomorrow'; }],
    ['non-ISO booked at', (b: ReturnType<typeof listExample>) => { b.items[0].bookedAtUtc = '20/10/2026'; }],
    ['missing booker name', (b: ReturnType<typeof listExample>) => { delete (b.items[0].booker as Json).fullName; }],
    ['non-array items', (b: ReturnType<typeof listExample>) => { (b as Json).items = {}; }],
    ['negative summary participants', (b: ReturnType<typeof listExample>) => { b.summary.totalParticipants = -2; }],
    ['summary not an object', (b: ReturnType<typeof listExample>) => { (b as Json).summary = 3; }],
    ['page number below one', (b: ReturnType<typeof listExample>) => { b.pageNumber = 0; }],
  ])('rejects %s', (_label, mutate) => {
    const body = listExample();
    mutate(body);
    expect(() => parseBookingListResponse(body)).toThrow(BookingApiParseError);
  });
});

describe('parseBookingDetailResponse', () => {
  it('accepts the contract example', () => {
    const detail = parseBookingDetailResponse(detailExample());

    expect(detail.bookingId).toBe('1201');
    expect(detail.booker.phoneNumber).toBe('+84901234567');
    expect(detail.participants).toEqual([
      { fullName: 'Nguyen Van A', participantType: 'Adult' },
      { fullName: 'Nguyen Thi B', participantType: 'Child' },
    ]);
    expect(detail.payment?.gateway).toBe('PayOS');
    expect(detail.coupon?.code).toBe('SUMMER10');
    expect(detail.ticket?.status).toBe('Valid');
    expect(detail.canCancel).toBe(true);
    expect(detail.cancelBlockedReason).toBeNull();
  });

  it('accepts null ticket, payment, coupon, meeting point and phone number', () => {
    const body = detailExample() as Json;
    body.ticket = null;
    body.payment = null;
    body.coupon = null;
    body.paidAmount = 0;
    (body.schedule as Json).meetingPoint = null;
    (body.booker as Json).phoneNumber = null;

    const detail = parseBookingDetailResponse(body);
    expect(detail.ticket).toBeNull();
    expect(detail.payment).toBeNull();
    expect(detail.coupon).toBeNull();
    expect(detail.schedule.meetingPoint).toBeNull();
    expect(detail.booker.phoneNumber).toBeNull();
  });

  it('accepts a cancelled booking with a blocked reason and cancellation info', () => {
    const body = detailExample() as Json;
    body.status = 'Cancelled';
    body.cancelledAtUtc = '2026-10-25T01:00:00+00:00';
    body.cancelReason = 'TourOperator: weather';
    body.canCancel = false;
    body.cancelBlockedReason = 'InvalidStatus';
    const detail = parseBookingDetailResponse(body);
    expect(detail.cancelBlockedReason).toBe('InvalidStatus');
    expect(detail.cancelReason).toBe('TourOperator: weather');
  });

  it('drops fields the contract says are never returned, even if a response carries them', () => {
    const body = detailExample() as Json;
    (body.participants as Json[])[0].idDocumentNumber = 'P1234567';
    (body.participants as Json[])[0].age = 30;
    (body.payment as Json).rawResponse = 'gateway-secret';
    (body.payment as Json).checkoutUrl = 'https://pay.example/secret';

    const json = JSON.stringify(parseBookingDetailResponse(body));
    expect(json).not.toContain('P1234567');
    expect(json).not.toContain('gateway-secret');
    expect(json).not.toContain('pay.example');
    expect(json).not.toContain('"age"');
  });

  it.each([
    'bookingId',
    'status',
    'paymentStatus',
    'tour',
    'schedule',
    'booker',
    'participants',
    'checkInStatus',
    'paidAmount',
    'subtotalAmount',
    'totalAmount',
    'canCancel',
  ])('rejects a missing %s', (key) => {
    expect(() => parseBookingDetailResponse(without(detailExample(), key))).toThrow(BookingApiParseError);
  });

  it.each([
    ['unknown participant type', (b: Json) => { ((b.participants as Json[])[0]).participantType = 'Senior'; }],
    ['unknown gateway', (b: Json) => { (b.payment as Json).gateway = 'Bitcoin'; }],
    ['unknown payment transaction status', (b: Json) => { (b.payment as Json).status = 'Done'; }],
    ['unknown ticket status', (b: Json) => { (b.ticket as Json).status = 'Torn'; }],
    ['unknown blocked reason', (b: Json) => { b.cancelBlockedReason = 'Weather'; }],
    ['non-boolean canCancel', (b: Json) => { b.canCancel = 'yes'; }],
    ['negative paid amount', (b: Json) => { b.paidAmount = -5; }],
    ['negative coupon discount', (b: Json) => { (b.coupon as Json).discountAmount = -1; }],
    ['non-ISO ticket issue time', (b: Json) => { (b.ticket as Json).issuedAtUtc = 'x'; }],
    ['non-ISO payment time', (b: Json) => { (b.payment as Json).succeededAtUtc = 'x'; }],
    ['participant without a name', (b: Json) => { delete ((b.participants as Json[])[0]).fullName; }],
    ['participants not an array', (b: Json) => { b.participants = 'none'; }],
    ['non-numeric booker id', (b: Json) => { (b.booker as Json).userId = 'u1'; }],
  ])('rejects %s', (_label, mutate) => {
    const body = detailExample() as Json;
    mutate(body);
    expect(() => parseBookingDetailResponse(body)).toThrow(BookingApiParseError);
  });
});

describe('parseBookingTourOptionsResponse', () => {
  it('accepts the revenue tours array and keeps id and title only', () => {
    const options = parseBookingTourOptionsResponse([
      { id: 101, code: 'TOUR-00101', title: 'Ba Na Hills full-day tour', isActive: true },
      { id: 55, code: 'TOUR-00055', title: 'Food trail', isActive: false },
    ]);
    expect(options).toEqual([
      { id: '101', title: 'Ba Na Hills full-day tour' },
      { id: '55', title: 'Food trail' },
    ]);
  });

  it.each([
    ['not an array', {}],
    ['entry without id', [{ code: 'X', title: 'T' }]],
    ['entry without title', [{ id: 1, code: 'X' }]],
    ['non-positive id', [{ id: 0, code: 'X', title: 'T' }]],
    ['string id', [{ id: '1', code: 'X', title: 'T' }]],
  ])('rejects %s', (_label, body) => {
    expect(() => parseBookingTourOptionsResponse(body)).toThrow(BookingApiParseError);
  });
});
