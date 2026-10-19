import { describe, expect, it } from 'vitest';

import { TourApiError } from '../types/tour';
import {
  describeCancellationRules,
  mapTourDetailResponse,
  parseTourDetailResponse,
  type TourDetailWire,
} from './tourDetailResponse';

function validWire(): Record<string, unknown> {
  return {
    tourId: '9007199254740993',
    title: 'Hội An food tour',
    description: 'Hai ngày khám phá ẩm thực.',
    destination: 'Hội An, Đà Nẵng',
    destinations: ['Hội An', 'Đà Nẵng'],
    durationDays: 2,
    basePrice: 1500000,
    currency: 'VND',
    operator: { name: 'Hoi An Tours', contactPhone: '0900000000' },
    images: [
      { url: 'https://cdn.example.test/a.jpg', altText: 'A', caption: 'Phố cổ', isPrimary: true },
      { url: 'https://cdn.example.test/b.jpg', altText: 'B', caption: null, isPrimary: false },
    ],
    inclusions: 'Bữa sáng\n- Hướng dẫn viên\r\n\n  • Vé tham quan  ',
    exclusions: null,
    cancellationPolicy: {
      rules: [
        { daysBeforeDeparture: 30, cancellationFeePercent: 0 },
        { daysBeforeDeparture: 15, cancellationFeePercent: 25 },
        { daysBeforeDeparture: 7, cancellationFeePercent: 50 },
        { daysBeforeDeparture: 0, cancellationFeePercent: 100 },
      ],
    },
    itinerary: [
      {
        dayNo: 1,
        items: [
          {
            sequenceNo: 1,
            poi: { poiId: '100', name: 'Phố cổ Hội An', address: 'Trần Phú', latitude: 15.88, longitude: 108.33 },
            plannedTime: '08:30',
            stayDurationMinutes: 90,
            notes: 'Có hướng dẫn viên',
          },
          {
            sequenceNo: 2,
            poi: { poiId: '101', name: 'Chùa Cầu', address: null, latitude: 15.87, longitude: 108.32 },
            plannedTime: null,
            stayDurationMinutes: 30,
            notes: null,
          },
        ],
      },
    ],
    schedules: [
      {
        scheduleId: '11',
        startAtUtc: '2026-11-01T01:00:00Z',
        endAtUtc: '2026-11-03T10:00:00Z',
        meetingPoint: 'Sảnh khách sạn',
        registrationDeadlineAtUtc: '2026-10-30T10:00:00Z',
        adultPrice: 1500000,
        childPrice: 900000,
        infantPrice: 0,
        remainingSlots: 7,
        availabilityStatus: 'available',
        bookable: true,
      },
      {
        scheduleId: '12',
        startAtUtc: '2026-11-10T01:00:00Z',
        endAtUtc: '2026-11-12T10:00:00Z',
        meetingPoint: null,
        registrationDeadlineAtUtc: null,
        adultPrice: 1600000,
        childPrice: null,
        infantPrice: null,
        remainingSlots: 0,
        availabilityStatus: 'soldOut',
        bookable: false,
      },
    ],
    hasBookableSchedule: true,
    rating: { average: 4.5, count: 2 },
    asOfUtc: '2026-10-17T03:00:00Z',
  };
}

function without(source: Record<string, unknown>, key: string): Record<string, unknown> {
  const copy = { ...source };
  delete copy[key];
  return copy;
}

function parseValid(): TourDetailWire {
  return parseTourDetailResponse(validWire());
}

describe('parseTourDetailResponse', () => {
  it('accepts a complete Backend payload and keeps every field', () => {
    const wire = parseValid();

    expect(wire.tourId).toBe('9007199254740993');
    expect(wire.destinations).toEqual(['Hội An', 'Đà Nẵng']);
    expect(wire.operator).toEqual({ name: 'Hoi An Tours', contactPhone: '0900000000' });
    expect(wire.schedules[1].availabilityStatus).toBe('soldOut');
    expect(wire.itinerary[0].items[0].poi.poiId).toBe('100');
    expect(wire.rating).toEqual({ average: 4.5, count: 2 });
  });

  it('treats omitted optional values like null', () => {
    const payload = validWire();
    delete payload.description;
    delete payload.inclusions;
    (payload.operator as Record<string, unknown>) = { name: 'Only name' };
    (payload.rating as Record<string, unknown>) = { count: 0 };
    const schedule = (payload.schedules as Record<string, unknown>[])[1];
    delete schedule.meetingPoint;
    delete schedule.childPrice;
    delete schedule.registrationDeadlineAtUtc;
    delete schedule.remainingSlots;

    const wire = parseTourDetailResponse(payload);

    expect(wire.description).toBeNull();
    expect(wire.inclusions).toBeNull();
    expect(wire.operator.contactPhone).toBeNull();
    expect(wire.rating.average).toBeNull();
    expect(wire.schedules[1].meetingPoint).toBeNull();
    expect(wire.schedules[1].childPrice).toBeNull();
    expect(wire.schedules[1].remainingSlots).toBeNull();
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'tour'],
    ['a number', 7],
  ])('rejects %s as the whole payload', (_label, payload) => {
    expect(() => parseTourDetailResponse(payload)).toThrow(TourApiError);
  });

  it.each([
    ['missing tourId', (p: Record<string, unknown>) => without(p, 'tourId')],
    ['numeric tourId (ids must stay strings)', (p: Record<string, unknown>) => ({ ...p, tourId: 12 })],
    ['empty tourId', (p: Record<string, unknown>) => ({ ...p, tourId: '' })],
    ['missing title', (p: Record<string, unknown>) => without(p, 'title')],
    ['non-string title', (p: Record<string, unknown>) => ({ ...p, title: 5 })],
    ['missing destination summary', (p: Record<string, unknown>) => without(p, 'destination')],
    ['destinations not an array', (p: Record<string, unknown>) => ({ ...p, destinations: 'Hội An' })],
    ['destinations with a non-string', (p: Record<string, unknown>) => ({ ...p, destinations: ['Hội An', 3] })],
    ['string basePrice', (p: Record<string, unknown>) => ({ ...p, basePrice: '1500000' })],
    ['NaN durationDays', (p: Record<string, unknown>) => ({ ...p, durationDays: Number.NaN })],
    ['missing currency', (p: Record<string, unknown>) => without(p, 'currency')],
    ['missing operator', (p: Record<string, unknown>) => without(p, 'operator')],
    ['operator without a name', (p: Record<string, unknown>) => ({ ...p, operator: { contactPhone: '1' } })],
    ['images not an array', (p: Record<string, unknown>) => ({ ...p, images: 'x' })],
    ['image without url', (p: Record<string, unknown>) => ({ ...p, images: [{ altText: 'a', isPrimary: true }] })],
    ['image with non-boolean isPrimary', (p: Record<string, unknown>) => ({ ...p, images: [{ url: 'u', altText: 'a', isPrimary: 'yes' }] })],
    ['missing cancellationPolicy', (p: Record<string, unknown>) => without(p, 'cancellationPolicy')],
    ['cancellation rule with a string fee', (p: Record<string, unknown>) => ({ ...p, cancellationPolicy: { rules: [{ daysBeforeDeparture: 3, cancellationFeePercent: '10' }] } })],
    ['itinerary not an array', (p: Record<string, unknown>) => ({ ...p, itinerary: {} })],
    ['stop without a poi', (p: Record<string, unknown>) => ({ ...p, itinerary: [{ dayNo: 1, items: [{ sequenceNo: 1, stayDurationMinutes: 5 }] }] })],
    ['numeric poiId', (p: Record<string, unknown>) => ({ ...p, itinerary: [{ dayNo: 1, items: [{ sequenceNo: 1, stayDurationMinutes: 5, poi: { poiId: 100, name: 'x', latitude: 1, longitude: 1 } }] }] })],
    ['schedules not an array', (p: Record<string, unknown>) => ({ ...p, schedules: null })],
    ['numeric scheduleId', (p: Record<string, unknown>) => ({ ...p, schedules: [{ ...(p.schedules as Record<string, unknown>[])[0], scheduleId: 11 }] })],
    ['unknown availabilityStatus', (p: Record<string, unknown>) => ({ ...p, schedules: [{ ...(p.schedules as Record<string, unknown>[])[0], availabilityStatus: 'almost' }] })],
    ['non-boolean bookable', (p: Record<string, unknown>) => ({ ...p, schedules: [{ ...(p.schedules as Record<string, unknown>[])[0], bookable: 1 }] })],
    ['missing adultPrice', (p: Record<string, unknown>) => ({ ...p, schedules: [without((p.schedules as Record<string, unknown>[])[0], 'adultPrice')] })],
    ['missing hasBookableSchedule', (p: Record<string, unknown>) => without(p, 'hasBookableSchedule')],
    ['missing rating', (p: Record<string, unknown>) => without(p, 'rating')],
    ['negative rating count', (p: Record<string, unknown>) => ({ ...p, rating: { average: null, count: -1 } })],
    ['fractional rating count', (p: Record<string, unknown>) => ({ ...p, rating: { average: 4, count: 1.5 } })],
    ['missing asOfUtc', (p: Record<string, unknown>) => without(p, 'asOfUtc')],
  ])('rejects a payload with %s', (_label, mutate) => {
    expect(() => parseTourDetailResponse(mutate(validWire()))).toThrow(TourApiError);
  });
});

describe('mapTourDetailResponse', () => {
  it('maps the identity, pricing and operator fields', () => {
    const tour = mapTourDetailResponse(parseValid());

    expect(tour.tourId).toBe('9007199254740993');
    expect(tour.title).toBe('Hội An food tour');
    expect(tour.description).toBe('Hai ngày khám phá ẩm thực.');
    expect(tour.destinations).toEqual(['Hội An', 'Đà Nẵng']);
    expect(tour.destinationSummary).toBe('Hội An, Đà Nẵng');
    expect(tour.operatorName).toBe('Hoi An Tours');
    expect(tour.operatorContact).toBe('0900000000');
    expect(tour.durationDays).toBe(2);
    expect(tour.basePrice).toBe(1500000);
    expect(tour.currency).toBe('VND');
    expect(tour.isDemo).toBeUndefined();
    expect(tour.reviews).toEqual([]);
    expect(tour.asOfUtc).toBe('2026-10-17T03:00:00Z');
  });

  it('turns multi-line terms into trimmed bullet-free lists and null into an empty list', () => {
    const tour = mapTourDetailResponse(parseValid());

    expect(tour.inclusions).toEqual(['Bữa sáng', 'Hướng dẫn viên', 'Vé tham quan']);
    expect(tour.exclusions).toEqual([]);
  });

  it('keeps images in the order the Backend sent them', () => {
    expect(mapTourDetailResponse(parseValid()).images).toEqual([
      'https://cdn.example.test/a.jpg',
      'https://cdn.example.test/b.jpg',
    ]);
  });

  it('maps availability to the status vocabulary and never makes unknown bookable', () => {
    const payload = validWire();
    const schedules = payload.schedules as Record<string, unknown>[];
    schedules.push({
      ...schedules[0],
      scheduleId: '13',
      availabilityStatus: 'unknown',
      remainingSlots: null,
      bookable: false,
    });

    const mapped = mapTourDetailResponse(parseTourDetailResponse(payload)).schedules;

    expect(mapped.map((schedule) => schedule.status)).toEqual(['Available', 'SoldOut', 'Scheduled']);
    expect(mapped.map((schedule) => schedule.remainingSlots)).toEqual([7, 0, 0]);
    expect(mapped.map((schedule) => schedule.bookable)).toEqual([true, false, false]);
  });

  it('uses the adult price as the schedule price and exposes the optional prices and deadline', () => {
    const [first, second] = mapTourDetailResponse(parseValid()).schedules;

    expect(first.price).toBe(1500000);
    expect(first.childPrice).toBe(900000);
    expect(first.infantPrice).toBe(0);
    expect(first.registrationDeadline).toBe('2026-10-30T10:00:00Z');
    expect(first.meetingPoint).toBe('Sảnh khách sạn');
    expect(first.startDatetime).toBe('2026-11-01T01:00:00Z');
    expect(second.childPrice).toBeUndefined();
    expect(second.meetingPoint).toBeUndefined();
  });

  it('picks the meeting point of the first bookable schedule, else the first schedule', () => {
    const payload = validWire();
    const schedules = payload.schedules as Record<string, unknown>[];
    schedules[0].bookable = false;
    schedules[0].availabilityStatus = 'soldOut';
    schedules[0].meetingPoint = 'Cổng A';
    schedules[1].bookable = true;
    schedules[1].availabilityStatus = 'available';
    schedules[1].remainingSlots = 3;
    schedules[1].meetingPoint = 'Cổng B';
    expect(mapTourDetailResponse(parseTourDetailResponse(payload)).meetingPoint).toBe('Cổng B');

    schedules[1].bookable = false;
    expect(mapTourDetailResponse(parseTourDetailResponse(payload)).meetingPoint).toBe('Cổng A');

    expect(mapTourDetailResponse(parseTourDetailResponse({ ...validWire(), schedules: [] })).meetingPoint).toBe('');
  });

  it('maps the rating and hides the average when there are no reviews', () => {
    const rated = mapTourDetailResponse(parseValid());
    expect(rated.aggregateRating).toBe(4.5);
    expect(rated.reviewCount).toBe(2);
    expect(rated.rating).toEqual({ average: 4.5, count: 2 });

    const unrated = mapTourDetailResponse(
      parseTourDetailResponse({ ...validWire(), rating: { average: null, count: 0 } }),
    );
    expect(unrated.aggregateRating).toBeNull();
    expect(unrated.reviewCount).toBe(0);
  });

  it('keeps the itinerary stops structured and labels each day', () => {
    const [day] = mapTourDetailResponse(parseValid()).itinerary;

    expect(day.dayNumber).toBe(1);
    expect(day.title).toBe('Ngày 1');
    expect(day.activities).toEqual([]);
    expect(day.stops).toEqual([
      {
        sequenceNo: 1,
        poiId: '100',
        poiName: 'Phố cổ Hội An',
        address: 'Trần Phú',
        plannedTime: '08:30',
        stayDurationMinutes: 90,
        notes: 'Có hướng dẫn viên',
      },
      {
        sequenceNo: 2,
        poiId: '101',
        poiName: 'Chùa Cầu',
        address: undefined,
        plannedTime: undefined,
        stayDurationMinutes: 30,
        notes: undefined,
      },
    ]);
  });

  it('exposes the cancellation rules and a readable summary string', () => {
    const tour = mapTourDetailResponse(parseValid());

    expect(tour.cancellationRules).toEqual([
      { daysBeforeDeparture: 30, cancellationFeePercent: 0 },
      { daysBeforeDeparture: 15, cancellationFeePercent: 25 },
      { daysBeforeDeparture: 7, cancellationFeePercent: 50 },
      { daysBeforeDeparture: 0, cancellationFeePercent: 100 },
    ]);
    expect(tour.cancellationPolicy).toBe(describeCancellationRules(tour.cancellationRules ?? []).join('\n'));
  });

  it('reports when no departure can be booked', () => {
    const tour = mapTourDetailResponse(
      parseTourDetailResponse({ ...validWire(), schedules: [], hasBookableSchedule: false }),
    );

    expect(tour.schedules).toEqual([]);
    expect(tour.hasBookableSchedule).toBe(false);
  });
});

describe('describeCancellationRules', () => {
  it('describes each rule as a notice range with its fee', () => {
    expect(
      describeCancellationRules([
        { daysBeforeDeparture: 30, cancellationFeePercent: 0 },
        { daysBeforeDeparture: 15, cancellationFeePercent: 25 },
        { daysBeforeDeparture: 7, cancellationFeePercent: 50 },
        { daysBeforeDeparture: 0, cancellationFeePercent: 100 },
      ]),
    ).toEqual([
      'Hủy từ 30 ngày trước ngày khởi hành: miễn phí',
      'Hủy từ 15 đến 29 ngày trước: phí 25%',
      'Hủy từ 7 đến 14 ngày trước: phí 50%',
      'Hủy dưới 7 ngày trước: phí 100%',
    ]);
  });

  it('handles a single rule, adjacent cutoffs and fractional fees', () => {
    expect(describeCancellationRules([{ daysBeforeDeparture: 0, cancellationFeePercent: 100 }])).toEqual([
      'Hủy bất kỳ lúc nào: phí 100%',
    ]);
    expect(
      describeCancellationRules([
        { daysBeforeDeparture: 8, cancellationFeePercent: 10.5 },
        { daysBeforeDeparture: 7, cancellationFeePercent: 20 },
      ]),
    ).toEqual(['Hủy từ 8 ngày trước ngày khởi hành: phí 10.5%', 'Hủy đúng 7 ngày trước: phí 20%']);
  });

  it('sorts rules by notice and returns nothing for no rules', () => {
    expect(
      describeCancellationRules([
        { daysBeforeDeparture: 0, cancellationFeePercent: 100 },
        { daysBeforeDeparture: 10, cancellationFeePercent: 0 },
      ]),
    ).toEqual(['Hủy từ 10 ngày trước ngày khởi hành: miễn phí', 'Hủy dưới 10 ngày trước: phí 100%']);
    expect(describeCancellationRules([])).toEqual([]);
  });
});
