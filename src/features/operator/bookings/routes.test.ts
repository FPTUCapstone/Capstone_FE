import { describe, expect, it } from 'vitest';
import {
  OPERATOR_BOOKING_ROUTES,
  buildBookingListUrl,
  withBookingDemoMode,
} from './routes';

describe('OPERATOR_BOOKING_ROUTES', () => {
  it('defines the canonical booking list route', () => {
    expect(OPERATOR_BOOKING_ROUTES.list).toBe('/partner/bookings');
  });
});

describe('buildBookingListUrl (CR-01 Context Preservation)', () => {
  it('returns clean base route when no params are given', () => {
    expect(buildBookingListUrl()).toBe('/partner/bookings');
  });

  it('includes page only when page > 1', () => {
    expect(buildBookingListUrl({ page: 1 })).toBe('/partner/bookings');
    expect(buildBookingListUrl({ page: 2 })).toBe('/partner/bookings?page=2');
  });

  it('preserves status, tourId, date range, searchKeyword, and demo flag', () => {
    const url = buildBookingListUrl({
      page: 3,
      status: 'Confirmed',
      tourId: 'tour-142',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      searchKeyword: '0141',
      isDemo: true,
    });
    expect(url).toBe(
      '/partner/bookings?page=3&status=Confirmed&tourId=tour-142&startDate=2026-09-01&endDate=2026-09-30&searchKeyword=0141&demo=1'
    );
  });

  it('ignores ALL filters and empty search strings', () => {
    const url = buildBookingListUrl({
      status: 'ALL',
      tourId: 'ALL',
      searchKeyword: '   ',
      isDemo: false,
    });
    expect(url).toBe('/partner/bookings');
  });
});

describe('withBookingDemoMode', () => {
  it('returns the same href when isDemo is false', () => {
    expect(withBookingDemoMode('/partner/bookings', false)).toBe('/partner/bookings');
    expect(withBookingDemoMode('/partner/bookings')).toBe('/partner/bookings');
  });

  it('appends ?demo=1 when isDemo is true and no query params exist', () => {
    expect(withBookingDemoMode('/partner/bookings', true)).toBe('/partner/bookings?demo=1');
  });

  it('appends &demo=1 when other query params exist', () => {
    expect(withBookingDemoMode('/partner/bookings?status=Confirmed', true)).toBe(
      '/partner/bookings?status=Confirmed&demo=1'
    );
  });

  it('does not duplicate demo=1 if already present', () => {
    expect(withBookingDemoMode('/partner/bookings?demo=1', true)).toBe(
      '/partner/bookings?demo=1'
    );
  });

  it('preserves hash fragments while adding demo=1', () => {
    expect(withBookingDemoMode('/partner/bookings#section-a', true)).toBe(
      '/partner/bookings?demo=1#section-a'
    );
  });

  it('returns empty string unchanged', () => {
    expect(withBookingDemoMode('', true)).toBe('');
  });
});
