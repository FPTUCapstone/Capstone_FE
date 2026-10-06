import { describe, expect, it } from 'vitest';
import { OPERATOR_BOOKING_ROUTES, withBookingDemoMode } from './routes';

describe('OPERATOR_BOOKING_ROUTES', () => {
  it('defines the canonical booking list route', () => {
    expect(OPERATOR_BOOKING_ROUTES.list).toBe('/partner/bookings');
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
