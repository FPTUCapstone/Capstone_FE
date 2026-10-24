import { describe, expect, it } from 'vitest';

import { parsePlatformBookingsResponse, parsePlatformBookingsSearch, serializePlatformBookingsSearch } from './platformBookings';

const response = {
  pageNumber: 1, pageSize: 20, totalCount: 1, totalPages: 1,
  items: [{ bookingId: '12', bookingCode: 'BK-12', traveler: { userId: '3', fullName: 'Traveler', email: 't@example.com' }, tour: { tourId: '4', title: 'Tour', operatorUserId: '5', operatorName: 'Operator', scheduleId: '6', startAtUtc: '2026-10-30T02:00:00Z' }, quantity: 1, subtotalAmount: 500000, discountAmount: 0, totalAmount: 500000, status: 'Confirmed', paymentStatus: 'Paid', bookedAtUtc: '2026-10-23T02:00:00Z' }],
};

describe('platform booking contract', () => {
  it('parses only a complete backend booking response', () => {
    expect(parsePlatformBookingsResponse(response).items[0].bookingCode).toBe('BK-12');
    expect(() => parsePlatformBookingsResponse({ ...response, items: [{ ...response.items[0], paymentStatus: 'Mystery' }] })).toThrow();
  });

  it('round-trips Vietnam calendar-day filters through URL query parameters', () => {
    const query = serializePlatformBookingsSearch({
      keyword: '', status: 'Confirmed', paymentStatus: 'Paid', bookedFrom: '2026-10-20', bookedTo: '2026-10-21', pageNumber: 1,
    });
    expect(query.get('bookedFromUtc')).toBe('2026-10-20T00:00:00+07:00');
    expect(query.get('bookedToUtc')).toBe('2026-10-21T23:59:59.999+07:00');
    expect(parsePlatformBookingsSearch(query)).toMatchObject({
      status: 'Confirmed', paymentStatus: 'Paid', bookedFrom: '2026-10-20', bookedTo: '2026-10-21',
    });
  });
});
