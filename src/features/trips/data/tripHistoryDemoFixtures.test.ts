import { describe, expect, it } from 'vitest';

import { parseTripDetail, parseTripHistoryPage } from '../services/tripHistoryResponse';
import {
  TRIP_TABS,
  type BookingTripDetail,
  type ItineraryTripDetail,
  type TripDetail,
  type TripHistoryPage,
} from '../types/tripHistoryContract';
import {
  DEMO_TRIP_DETAILS,
  demoTripDetail,
  demoTripHistoryPage,
} from './tripHistoryDemoFixtures';

/** Writes a value the way the backend does: identities are JSON numbers, not strings. */
function asWire(value: unknown): string {
  const ids = new Set(['id', 'ticketId', 'reviewId', 'poiId']);
  return JSON.stringify(value, (key, item) => (ids.has(key) && typeof item === 'string' ? Number(item) : item));
}

const all = (tab: (typeof TRIP_TABS)[number], over: Partial<Parameters<typeof demoTripHistoryPage>[0]> = {}) =>
  demoTripHistoryPage({ tab, tripType: 'All', page: 1, ...over });

const ids = (page: TripHistoryPage) => page.items.map((item) => `${item.kind}:${item.id}`);

describe('demo fixtures follow the TM-78 contract', () => {
  it.each(TRIP_TABS)('the %s list page passes the strict contract parser', (tab) => {
    const page = all(tab);

    expect(() => parseTripHistoryPage(asWire(page))).not.toThrow();
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((item) => item.tab === tab)).toBe(true);
  });

  it('every detail passes the strict contract parser', () => {
    expect(DEMO_TRIP_DETAILS.length).toBeGreaterThanOrEqual(8);
    for (const detail of DEMO_TRIP_DETAILS) {
      expect(() => parseTripDetail(asWire(detail))).not.toThrow();
    }
  });

  it('covers both kinds and every state the screen has to render', () => {
    const byId = (id: string) => DEMO_TRIP_DETAILS.find((detail) => detail.id === id) as TripDetail;
    const bookings = DEMO_TRIP_DETAILS.filter((d): d is BookingTripDetail => d.kind === 'commerceBooking');
    const itineraries = DEMO_TRIP_DETAILS.filter((d): d is ItineraryTripDetail => d.kind === 'itinerary');

    expect(bookings.length).toBeGreaterThan(0);
    expect(itineraries.length).toBeGreaterThan(0);
    expect(bookings.some((d) => d.tab === 'Completed' && d.actions.canReview && !d.review.exists)).toBe(true);
    expect(bookings.some((d) => d.tab === 'Completed' && !d.actions.canReview && d.review.exists)).toBe(true);
    expect(bookings.some((d) => d.tab === 'Upcoming' && d.actions.canViewETicket && d.actions.ticketId)).toBe(true);
    expect(bookings.some((d) => d.tab === 'Cancelled' && d.actions.canViewRefund && d.refund)).toBe(true);
    expect(bookings.some((d) => d.tab === 'Cancelled' && !d.actions.canViewRefund)).toBe(true);
    expect(itineraries.some((d) => d.tab === 'Completed' && d.visitedCount !== undefined && d.visitedCount < d.stopCount)).toBe(true);
    expect(itineraries.some((d) => d.session?.completionReason === 'Expired')).toBe(true);
    expect(itineraries.some((d) => d.tab === 'Upcoming')).toBe(true);
    expect(itineraries.some((d) => d.tab === 'Cancelled')).toBe(true);
    expect(byId('9001')).toBeDefined();
  });

  it('keeps the actions consistent with the record, as the backend does', () => {
    for (const detail of DEMO_TRIP_DETAILS) {
      if (detail.kind === 'itinerary') {
        expect(detail.actions).toEqual({ canReview: false, canViewETicket: false, ticketId: null, canViewRefund: false });
        expect(detail.reviewableRecord).toBeNull();
        expect(detail.review).toBeNull();
        if (detail.tab === 'Completed') {
          const reached = detail.stops.filter((stop) => stop.visitStatus === 'Reached').length;
          expect(detail.visitedCount).toBe(reached);
          expect(detail.stopCount).toBe(detail.stops.length);
        }
      } else {
        expect(detail.reviewableRecord).toEqual({ kind: 'commerceBooking', id: detail.id });
        expect(detail.actions.canReview).toBe(detail.status === 'Completed' && !detail.review.exists);
        expect(detail.actions.canViewETicket).toBe(detail.actions.ticketId !== null);
        expect(detail.actions.canViewRefund).toBe(detail.status === 'Cancelled' && detail.refund !== undefined);
      }
    }
  });

  it('a list item is exactly the card part of its detail', () => {
    for (const tab of TRIP_TABS) {
      for (const item of all(tab).items) {
        const detail = demoTripDetail(item.kind, item.id);
        expect(detail).not.toBeNull();
        expect(detail).toMatchObject(item);
      }
    }
    expect(demoTripDetail('itinerary', '999999')).toBeNull();
    expect(demoTripDetail('commerceBooking', '5001')).toBeNull();
  });
});

describe('demo list behaves like the backend list', () => {
  it('orders by departure descending, then bookings before itineraries, then id descending', () => {
    const page = all('Completed');

    expect(ids(page)).toEqual(['commerceBooking:9001', 'commerceBooking:9002', 'itinerary:5001', 'itinerary:5002']);
    const sameInstant = page.items.filter((item) => item.departureAtUtc === page.items[1].departureAtUtc);
    expect(sameInstant.map((item) => item.kind)).toEqual(['commerceBooking', 'itinerary']);
  });

  it('adds the summary on the Completed tab only', () => {
    expect(all('Completed').summary).toEqual({ totalCompletedTrips: 4, totalVisitedPois: 4 });
    expect(all('Upcoming').summary).toBeUndefined();
    expect(all('Cancelled').summary).toBeUndefined();
  });

  it('filters by trip type and keeps the summary in step with the filter', () => {
    const bookings = all('Completed', { tripType: 'TourBooking' });
    const itineraries = all('Completed', { tripType: 'SelfPlannedItinerary' });

    expect(bookings.items.every((item) => item.kind === 'commerceBooking')).toBe(true);
    expect(bookings.summary).toEqual({ totalCompletedTrips: 2, totalVisitedPois: 0 });
    expect(itineraries.items.every((item) => item.kind === 'itinerary')).toBe(true);
    expect(itineraries.summary).toEqual({ totalCompletedTrips: 2, totalVisitedPois: 4 });
  });

  it('filters by Vietnam calendar days, inclusive of both ends', () => {
    // 9001 departs 2026-10-01T02:00Z = 09:00 on 2026-10-01 in Vietnam.
    expect(ids(all('Completed', { fromDate: '2026-10-01', toDate: '2026-10-01' }))).toEqual(['commerceBooking:9001']);
    expect(all('Completed', { fromDate: '2026-09-30', toDate: '2026-09-30' }).items).toEqual([]);
    expect(ids(all('Completed', { fromDate: '2026-10-01' }))).toEqual(['commerceBooking:9001']);
    expect(ids(all('Completed', { toDate: '2026-08-31' }))).toEqual(['itinerary:5002']);
  });

  it('pages the result and keeps totalCount on every page', () => {
    const first = all('Completed', { page: 1, pageSize: 3 });
    const second = all('Completed', { page: 2, pageSize: 3 });
    const beyond = all('Completed', { page: 3, pageSize: 3 });

    expect(first.items).toHaveLength(3);
    expect(second.items).toHaveLength(1);
    expect(beyond.items).toEqual([]);
    expect([first.totalCount, second.totalCount, beyond.totalCount]).toEqual([4, 4, 4]);
    expect([...ids(first), ...ids(second)]).toEqual(ids(all('Completed')));
    expect(first.pageSize).toBe(3);
    expect(second.page).toBe(2);
  });

  it('returns an empty page, not an error, when nothing matches', () => {
    const page = all('Cancelled', { tripType: 'SelfPlannedItinerary', fromDate: '2030-01-01' });

    expect(page.items).toEqual([]);
    expect(page.totalCount).toBe(0);
  });
});
