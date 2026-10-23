import { describe, expect, it } from 'vitest';

import {
  InvalidTripResponseError,
  parseTripDetail,
  parseTripHistoryPage,
} from './tripHistoryResponse';

const actions = (over = '') =>
  `{"canReview":true,"canViewETicket":true,"ticketId":77,"canViewRefund":false${over}}`;

const bookingItem = (over: Record<string, string> = {}) => {
  const fields: Record<string, string> = {
    kind: '"commerceBooking"',
    id: '123',
    tripType: '"TourBooking"',
    tab: '"Completed"',
    title: '"Hoi An Lantern Tour"',
    departureAtUtc: '"2026-10-01T02:00:00+00:00"',
    status: '"Completed"',
    bookingCode: '"TM-000123"',
    participantCount: '2',
    totalAmount: '3200000.00',
    reviewableRecord: '{"kind":"commerceBooking","id":123}',
    actions: actions(),
    review: '{"exists":false}',
    ...over,
  };
  return fields;
};

const itineraryItem = (over: Record<string, string> = {}) => ({
  kind: '"itinerary"',
  id: '45',
  tripType: '"SelfPlannedItinerary"',
  tab: '"Completed"',
  title: '"Da Nang 2 days"',
  departureAtUtc: '"2026-09-20T01:00:00+00:00"',
  status: '"Completed"',
  stopCount: '6',
  visitedCount: '5',
  reviewableRecord: 'null',
  actions: '{"canReview":false,"canViewETicket":false,"ticketId":null,"canViewRefund":false}',
  review: 'null',
  ...over,
});

const obj = (fields: Record<string, string>) =>
  `{${Object.entries(fields).map(([key, value]) => `"${key}":${value}`).join(',')}}`;

const page = (items: string[], over: Record<string, string> = {}) =>
  obj({
    items: `[${items.join(',')}]`,
    summary: '{"totalCompletedTrips":14,"totalVisitedPois":63}',
    page: '1',
    pageSize: '20',
    totalCount: '14',
    ...over,
  });

const without = (fields: Record<string, string>, key: string) => {
  const copy = { ...fields };
  delete copy[key];
  return copy;
};

describe('parseTripHistoryPage', () => {
  it('parses a booking and an itinerary and keeps every id as an exact string', () => {
    const result = parseTripHistoryPage(page([obj(bookingItem()), obj(itineraryItem())]));

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.totalCount).toBe(14);
    expect(result.summary).toEqual({ totalCompletedTrips: 14, totalVisitedPois: 63 });
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual({
      kind: 'commerceBooking',
      id: '123',
      tripType: 'TourBooking',
      tab: 'Completed',
      title: 'Hoi An Lantern Tour',
      departureAtUtc: '2026-10-01T02:00:00+00:00',
      status: 'Completed',
      bookingCode: 'TM-000123',
      participantCount: 2,
      totalAmount: 3_200_000,
      reviewableRecord: { kind: 'commerceBooking', id: '123' },
      actions: { canReview: true, canViewETicket: true, ticketId: '77', canViewRefund: false },
      review: { exists: false },
    });
    expect(result.items[1]).toEqual({
      kind: 'itinerary',
      id: '45',
      tripType: 'SelfPlannedItinerary',
      tab: 'Completed',
      title: 'Da Nang 2 days',
      departureAtUtc: '2026-09-20T01:00:00+00:00',
      status: 'Completed',
      stopCount: 6,
      visitedCount: 5,
      reviewableRecord: null,
      actions: { canReview: false, canViewETicket: false, ticketId: null, canViewRefund: false },
      review: null,
    });
  });

  it('keeps ids above 2^53 exact instead of rounding them', () => {
    const big = '9007199254740993';
    const item = bookingItem({
      id: big,
      reviewableRecord: `{"kind":"commerceBooking","id":${big}}`,
      actions: actions().replace('"ticketId":77', `"ticketId":${big}`),
    });

    const [parsed] = parseTripHistoryPage(page([obj(item)])).items;

    expect(parsed.id).toBe(big);
    expect(parsed.actions.ticketId).toBe(big);
    expect(parsed.reviewableRecord?.id).toBe(big);
  });

  it('leaves the summary undefined when the tab has none', () => {
    const result = parseTripHistoryPage(page([], { summary: 'null', totalCount: '0' }));
    expect(result.summary).toBeUndefined();
    expect(result.items).toEqual([]);

    const omitted = parseTripHistoryPage(
      obj({ items: '[]', page: '1', pageSize: '20', totalCount: '0' }),
    );
    expect(omitted.summary).toBeUndefined();
  });

  it('parses a reviewed booking with its review id and rating', () => {
    const reviewed = bookingItem({
      actions: actions().replace('"canReview":true', '"canReview":false'),
      review: '{"exists":true,"reviewId":41,"rating":4}',
    });

    const [item] = parseTripHistoryPage(page([obj(reviewed)])).items;

    expect(item.review).toEqual({ exists: true, reviewId: '41', rating: 4 });
    expect(item.actions.canReview).toBe(false);
  });

  it('accepts a Completed-tab itinerary without visitedCount and other tabs without it', () => {
    const upcoming = itineraryItem({ tab: '"Upcoming"', status: '"Active"' });
    const { visitedCount: _omit, ...rest } = upcoming;
    void _omit;

    const [item] = parseTripHistoryPage(page([obj(rest)], { summary: 'null' })).items;

    expect(item).not.toHaveProperty('visitedCount');
    expect(item.tab).toBe('Upcoming');
  });

  it('drops properties the contract does not define', () => {
    const noisy = bookingItem({
      secret: '"x"',
      actions: actions(',"debug":true'),
      reviewableRecord: '{"kind":"commerceBooking","id":123,"extra":1}',
      review: '{"exists":false,"hint":"x"}',
    });
    const text = page([obj(noisy)], { traceId: '"abc"', summary: '{"totalCompletedTrips":1,"totalVisitedPois":2,"x":3}' });

    const result = parseTripHistoryPage(text);

    expect(result).not.toHaveProperty('traceId');
    expect(result.items[0]).not.toHaveProperty('secret');
    expect(result.items[0].actions).not.toHaveProperty('debug');
    expect(result.items[0].reviewableRecord).toEqual({ kind: 'commerceBooking', id: '123' });
    expect(result.items[0].review).toEqual({ exists: false });
    expect(result.summary).toEqual({ totalCompletedTrips: 1, totalVisitedPois: 2 });
  });

  describe('rejects a malformed body', () => {
    const cases: Array<[string, string]> = [
      ['not JSON', '<html>502</html>'],
      ['empty body', ''],
      ['a JSON array', '[]'],
      ['items not an array', page([], { items: '{}' })],
      ['unknown kind', page([obj(bookingItem({ kind: '"serviceBooking"' }))])],
      ['tripType not matching the kind', page([obj(bookingItem({ tripType: '"SelfPlannedItinerary"' }))])],
      ['unknown tab', page([obj(bookingItem({ tab: '"Archived"' }))])],
      ['booking without bookingCode', page([obj(without(bookingItem(), 'bookingCode'))])],
      ['booking without totalAmount', page([obj(without(bookingItem(), 'totalAmount'))])],
      ['itinerary without stopCount', page([obj(without(itineraryItem(), 'stopCount'))])],
      ['bad date string', page([obj(bookingItem({ departureAtUtc: '"yesterday"' }))])],
      ['date that is not a string', page([obj(bookingItem({ departureAtUtc: '1759284000' }))])],
      ['actions missing a flag', page([obj(bookingItem({ actions: '{"canReview":true,"canViewETicket":true,"ticketId":1}' }))])],
      ['actions flag not boolean', page([obj(bookingItem({ actions: actions().replace('"canReview":true', '"canReview":"yes"') }))])],
      ['ticketId zero', page([obj(bookingItem({ actions: actions().replace('"ticketId":77', '"ticketId":0') }))])],
      ['ticketId fractional', page([obj(bookingItem({ actions: actions().replace('"ticketId":77', '"ticketId":1.5') }))])],
      ['id zero', page([obj(bookingItem({ id: '0' }))])],
      ['id negative', page([obj(bookingItem({ id: '-3' }))])],
      ['id a string', page([obj(bookingItem({ id: '"abc"' }))])],
      ['id beyond int64', page([obj(bookingItem({ id: '9223372036854775808' }))])],
      ['reviewableRecord id differing from the item id', page([obj(bookingItem({ reviewableRecord: '{"kind":"commerceBooking","id":124}' }))])],
      ['reviewableRecord of another kind', page([obj(bookingItem({ reviewableRecord: '{"kind":"serviceBooking","id":123}' }))])],
      ['booking with null reviewableRecord', page([obj(bookingItem({ reviewableRecord: 'null' }))])],
      ['booking with null review', page([obj(bookingItem({ review: 'null' }))])],
      ['review exists without a rating', page([obj(bookingItem({ review: '{"exists":true,"reviewId":41}' }))])],
      ['review rating above 5', page([obj(bookingItem({ review: '{"exists":true,"reviewId":41,"rating":6}' }))])],
      ['review rating zero', page([obj(bookingItem({ review: '{"exists":true,"reviewId":41,"rating":0}' }))])],
      ['itinerary with a reviewableRecord', page([obj(itineraryItem({ reviewableRecord: '{"kind":"commerceBooking","id":45}' }))])],
      ['itinerary with a review', page([obj(itineraryItem({ review: '{"exists":false}' }))])],
      ['negative totalCount', page([], { totalCount: '-1' })],
      ['page zero', page([], { page: '0' })],
      ['pageSize zero', page([], { pageSize: '0' })],
      ['fractional totalCount', page([], { totalCount: '1.5' })],
      ['negative summary count', page([], { summary: '{"totalCompletedTrips":-1,"totalVisitedPois":0}' })],
      ['summary missing a field', page([], { summary: '{"totalCompletedTrips":1}' })],
      ['negative participantCount', page([obj(bookingItem({ participantCount: '-2' }))])],
      ['visitedCount above stopCount', page([obj(itineraryItem({ visitedCount: '7' }))])],
    ];

    it.each(cases)('%s', (_name, body) => {
      expect(() => parseTripHistoryPage(body)).toThrow(InvalidTripResponseError);
    });
  });
});

const bookingDetail = (over: Record<string, string> = {}) =>
  obj({
    ...bookingItem(),
    tour: '{"title":"Hoi An Lantern Tour","destinationSummary":"Hoi An"}',
    schedule:
      '{"startAtUtc":"2026-10-01T02:00:00+00:00","endAtUtc":"2026-10-01T10:00:00+00:00","meetingPoint":"Old Town gate"}',
    participants: '{"adult":2,"child":1,"infant":0}',
    ...over,
  });

const itineraryDetail = (over: Record<string, string> = {}) =>
  obj({
    ...itineraryItem(),
    validFromUtc: '"2026-09-19T00:00:00+00:00"',
    validToUtc: '"2026-09-22T00:00:00+00:00"',
    stops:
      '[{"sequenceNo":1,"poiId":9,"poiName":"Dragon Bridge","plannedArrivalUtc":"2026-09-20T01:00:00+00:00",' +
      '"plannedDepartureUtc":"2026-09-20T02:00:00+00:00","visitStatus":"Reached","reachedAtUtc":"2026-09-20T01:05:00+00:00"},' +
      '{"sequenceNo":2,"poiId":10,"poiName":"My Khe Beach","plannedArrivalUtc":"2026-09-20T03:00:00+00:00",' +
      '"plannedDepartureUtc":"2026-09-20T04:00:00+00:00","visitStatus":"Skipped","skippedAtUtc":"2026-09-20T03:10:00+00:00"},' +
      '{"sequenceNo":3,"poiId":11,"poiName":"Han Market","plannedArrivalUtc":null,"plannedDepartureUtc":null,"visitStatus":"Pending"}]',
    session:
      '{"startedAtUtc":"2026-09-20T01:00:00+00:00","endedAtUtc":"2026-09-20T06:00:00+00:00","completionReason":"TravelerStopped"}',
    ...over,
  });

describe('parseTripDetail', () => {
  it('parses a completed booking with the tour, schedule and participants', () => {
    const detail = parseTripDetail(bookingDetail());

    expect(detail.kind).toBe('commerceBooking');
    if (detail.kind !== 'commerceBooking') throw new Error('unreachable');
    expect(detail.id).toBe('123');
    expect(detail.actions.ticketId).toBe('77');
    expect(detail.tour).toEqual({ title: 'Hoi An Lantern Tour', destinationSummary: 'Hoi An' });
    expect(detail.schedule).toEqual({
      startAtUtc: '2026-10-01T02:00:00+00:00',
      endAtUtc: '2026-10-01T10:00:00+00:00',
      meetingPoint: 'Old Town gate',
    });
    expect(detail.participants).toEqual({ adult: 2, child: 1, infant: 0 });
    expect(detail.cancellation).toBeUndefined();
    expect(detail.refund).toBeUndefined();
  });

  it('parses cancellation and a refund whose channel is null', () => {
    const text = bookingDetail({
      tab: '"Cancelled"',
      status: '"Cancelled"',
      actions: '{"canReview":false,"canViewETicket":false,"ticketId":null,"canViewRefund":true}',
      schedule: '{"startAtUtc":"2026-10-01T02:00:00+00:00","endAtUtc":"2026-10-01T10:00:00+00:00","meetingPoint":null}',
      cancellation: '{"cancelledAtUtc":"2026-08-20T00:00:00+00:00","reason":"Change of plans"}',
      refund: '{"status":"Processed","amount":800000.00,"channel":null}',
    });

    const detail = parseTripDetail(text);

    if (detail.kind !== 'commerceBooking') throw new Error('unreachable');
    expect(detail.cancellation).toEqual({ cancelledAtUtc: '2026-08-20T00:00:00+00:00', reason: 'Change of plans' });
    expect(detail.refund).toEqual({ status: 'Processed', amount: 800_000, channel: null });
    expect(detail.schedule.meetingPoint).toBeNull();
  });

  it('accepts a cancellation with no timestamp and no reason', () => {
    const detail = parseTripDetail(
      bookingDetail({ cancellation: '{"cancelledAtUtc":null,"reason":null}' }),
    );
    if (detail.kind !== 'commerceBooking') throw new Error('unreachable');
    expect(detail.cancellation).toEqual({ cancelledAtUtc: null, reason: null });
  });

  it('parses a completed itinerary with stops, visit data and the session', () => {
    const detail = parseTripDetail(itineraryDetail());

    if (detail.kind !== 'itinerary') throw new Error('unreachable');
    expect(detail.validFromUtc).toBe('2026-09-19T00:00:00+00:00');
    expect(detail.validToUtc).toBe('2026-09-22T00:00:00+00:00');
    expect(detail.stops).toEqual([
      {
        sequenceNo: 1,
        poiId: '9',
        poiName: 'Dragon Bridge',
        plannedArrivalUtc: '2026-09-20T01:00:00+00:00',
        plannedDepartureUtc: '2026-09-20T02:00:00+00:00',
        visitStatus: 'Reached',
        reachedAtUtc: '2026-09-20T01:05:00+00:00',
      },
      {
        sequenceNo: 2,
        poiId: '10',
        poiName: 'My Khe Beach',
        plannedArrivalUtc: '2026-09-20T03:00:00+00:00',
        plannedDepartureUtc: '2026-09-20T04:00:00+00:00',
        visitStatus: 'Skipped',
        skippedAtUtc: '2026-09-20T03:10:00+00:00',
      },
      {
        sequenceNo: 3,
        poiId: '11',
        poiName: 'Han Market',
        plannedArrivalUtc: null,
        plannedDepartureUtc: null,
        visitStatus: 'Pending',
      },
    ]);
    expect(detail.session).toEqual({
      startedAtUtc: '2026-09-20T01:00:00+00:00',
      endedAtUtc: '2026-09-20T06:00:00+00:00',
      completionReason: 'TravelerStopped',
    });
  });

  it('parses a planned itinerary: stops without visit data and no session', () => {
    const text = obj({
      ...itineraryItem({ tab: '"Upcoming"', status: '"Active"' }),
      stops:
        '[{"sequenceNo":1,"poiId":9,"poiName":"Dragon Bridge","plannedArrivalUtc":"2026-12-01T01:00:00+00:00","plannedDepartureUtc":"2026-12-01T02:00:00+00:00"}]',
    });

    const detail = parseTripDetail(text);

    if (detail.kind !== 'itinerary') throw new Error('unreachable');
    expect(detail.session).toBeUndefined();
    expect(detail.validFromUtc).toBeUndefined();
    expect(detail.stops[0]).not.toHaveProperty('visitStatus');
    expect(detail.stops[0].poiId).toBe('9');
  });

  it('accepts a session with a null end and reason', () => {
    const detail = parseTripDetail(
      itineraryDetail({ session: '{"startedAtUtc":"2026-09-20T01:00:00+00:00","endedAtUtc":null,"completionReason":null}' }),
    );
    if (detail.kind !== 'itinerary') throw new Error('unreachable');
    expect(detail.session).toEqual({ startedAtUtc: '2026-09-20T01:00:00+00:00', endedAtUtc: null, completionReason: null });
  });

  it('drops properties the contract does not define', () => {
    const detail = parseTripDetail(
      bookingDetail({ tour: '{"title":"T","destinationSummary":"D","operatorEmail":"x@y.z"}', leak: '"x"' }),
    );
    expect(detail).not.toHaveProperty('leak');
    if (detail.kind !== 'commerceBooking') throw new Error('unreachable');
    expect(detail.tour).toEqual({ title: 'T', destinationSummary: 'D' });
  });

  describe('rejects a malformed body', () => {
    const cases: Array<[string, string]> = [
      ['not JSON', 'oops'],
      ['unknown kind', bookingDetail({ kind: '"serviceBooking"' })],
      ['booking without tour', obj({
        ...bookingItem(),
        schedule: '{"startAtUtc":"2026-10-01T02:00:00+00:00","endAtUtc":"2026-10-01T10:00:00+00:00","meetingPoint":null}',
        participants: '{"adult":1,"child":0,"infant":0}',
      })],
      ['booking tour missing a title', bookingDetail({ tour: '{"destinationSummary":"Hoi An"}' })],
      ['booking schedule with a bad date', bookingDetail({ schedule: '{"startAtUtc":"x","endAtUtc":"2026-10-01T10:00:00+00:00","meetingPoint":null}' })],
      ['booking participants negative', bookingDetail({ participants: '{"adult":-1,"child":0,"infant":0}' })],
      ['booking participants missing a type', bookingDetail({ participants: '{"adult":1,"child":0}' })],
      ['refund without amount', bookingDetail({ refund: '{"status":"Processed","channel":null}' })],
      ['refund with negative amount', bookingDetail({ refund: '{"status":"Processed","amount":-1,"channel":null}' })],
      ['itinerary without stops', obj(itineraryItem())],
      ['itinerary stops not an array', itineraryDetail({ stops: '{}' })],
      ['stop with an unknown visitStatus', itineraryDetail({ stops: '[{"sequenceNo":1,"poiId":9,"poiName":"A","plannedArrivalUtc":null,"plannedDepartureUtc":null,"visitStatus":"Done"}]' })],
      ['stop with a bad poiId', itineraryDetail({ stops: '[{"sequenceNo":1,"poiId":0,"poiName":"A","plannedArrivalUtc":null,"plannedDepartureUtc":null}]' })],
      ['stop with a bad sequenceNo', itineraryDetail({ stops: '[{"sequenceNo":0,"poiId":9,"poiName":"A","plannedArrivalUtc":null,"plannedDepartureUtc":null}]' })],
      ['stop with a bad reachedAtUtc', itineraryDetail({ stops: '[{"sequenceNo":1,"poiId":9,"poiName":"A","plannedArrivalUtc":null,"plannedDepartureUtc":null,"visitStatus":"Reached","reachedAtUtc":"x"}]' })],
      ['session without startedAtUtc', itineraryDetail({ session: '{"endedAtUtc":null,"completionReason":null}' })],
      ['itinerary whose base card is invalid', itineraryDetail({ stopCount: '"six"' })],
    ];

    it.each(cases)('%s', (_name, body) => {
      expect(() => parseTripDetail(body)).toThrow(InvalidTripResponseError);
    });
  });
});
