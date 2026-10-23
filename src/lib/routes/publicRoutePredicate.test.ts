import { describe, expect, it } from 'vitest';
import { isPublicNavigationRoute } from './publicRoutePredicate';

describe('isPublicNavigationRoute (Strict Positive Whitelist)', () => {
  it('returns true for root public homepage', () => {
    expect(isPublicNavigationRoute('/')).toBe(true);
    expect(isPublicNavigationRoute('///')).toBe(true);
  });

  it('returns true for about page', () => {
    expect(isPublicNavigationRoute('/about')).toBe(true);
    expect(isPublicNavigationRoute('/about/')).toBe(true);
  });

  it('returns false for empty, null, or undefined', () => {
    expect(isPublicNavigationRoute('')).toBe(false);
    expect(isPublicNavigationRoute(null)).toBe(false);
    expect(isPublicNavigationRoute(undefined)).toBe(false);
  });

  it('returns true for core public exploration routes and trailing slashes', () => {
    expect(isPublicNavigationRoute('/tours')).toBe(true);
    expect(isPublicNavigationRoute('/tours/')).toBe(true);
    expect(isPublicNavigationRoute('/tours/101')).toBe(true);
    expect(isPublicNavigationRoute('/tours/101/book')).toBe(true);
    expect(isPublicNavigationRoute('/pois')).toBe(true);
    expect(isPublicNavigationRoute('/pois/202')).toBe(true);
    expect(isPublicNavigationRoute('/plan')).toBe(true);
    expect(isPublicNavigationRoute('/itineraries')).toBe(true);
    expect(isPublicNavigationRoute('/itinerary/303')).toBe(true);
  });

  it('does NOT reject legitimate routes containing "pay" substring', () => {
    expect(isPublicNavigationRoute('/tours/pay-as-you-go-adventure')).toBe(true);
    expect(isPublicNavigationRoute('/pois/pay-valley-heritage')).toBe(true);
  });

  it('returns true for all traveler account pages and subroutes', () => {
    expect(isPublicNavigationRoute('/account')).toBe(true);
    expect(isPublicNavigationRoute('/account/profile')).toBe(true);
    expect(isPublicNavigationRoute('/account/preferences')).toBe(true);
    expect(isPublicNavigationRoute('/account/security')).toBe(true);
    expect(isPublicNavigationRoute('/account/trips')).toBe(true);
    expect(isPublicNavigationRoute('/account/trips/trip-01/review')).toBe(true);
    expect(isPublicNavigationRoute('/account/reviews/commerceBooking/rev-101')).toBe(true);
    expect(isPublicNavigationRoute('/account/reviews/serviceBooking/rev-202')).toBe(true);
  });

  it('returns true for trips and reviews direct routes', () => {
    expect(isPublicNavigationRoute('/trips')).toBe(true);
    expect(isPublicNavigationRoute('/trips/trip-01')).toBe(true);
    expect(isPublicNavigationRoute('/reviews')).toBe(true);
    expect(isPublicNavigationRoute('/reviews/rev-101')).toBe(true);
  });

  it('returns true for booking and checkout flows which utilize PublicNavigation', () => {
    expect(isPublicNavigationRoute('/bookings/555/ticket')).toBe(true);
    expect(isPublicNavigationRoute('/bookings/123/pay')).toBe(true);
    expect(isPublicNavigationRoute('/checkout/result')).toBe(true);
    expect(isPublicNavigationRoute('/checkout/mock')).toBe(true);
  });

  it('returns false for admin workspace routes', () => {
    expect(isPublicNavigationRoute('/admin')).toBe(false);
    expect(isPublicNavigationRoute('/admin/login')).toBe(false);
    expect(isPublicNavigationRoute('/admin/users')).toBe(false);
    expect(isPublicNavigationRoute('/admin/payouts')).toBe(false);
    expect(isPublicNavigationRoute('/admin/reports')).toBe(false);
  });

  it('returns false for partner workspace routes, including /partner/bookings', () => {
    expect(isPublicNavigationRoute('/partner')).toBe(false);
    expect(isPublicNavigationRoute('/partner/register')).toBe(false);
    expect(isPublicNavigationRoute('/partner/application')).toBe(false);
    expect(isPublicNavigationRoute('/partner/tours')).toBe(false);
    expect(isPublicNavigationRoute('/partner/revenue')).toBe(false);
    expect(isPublicNavigationRoute('/partner/bookings')).toBe(false);
    expect(isPublicNavigationRoute('/partner/bookings/456')).toBe(false);
  });

  it('returns false for standalone auth pages', () => {
    expect(isPublicNavigationRoute('/sign-in')).toBe(false);
    expect(isPublicNavigationRoute('/register')).toBe(false);
    expect(isPublicNavigationRoute('/forgot-password')).toBe(false);
    expect(isPublicNavigationRoute('/verify-account')).toBe(false);
    expect(isPublicNavigationRoute('/verify-email')).toBe(false);
  });

  it('returns false for developer-only routes', () => {
    expect(isPublicNavigationRoute('/dev')).toBe(false);
    expect(isPublicNavigationRoute('/dev/payment')).toBe(false);
  });

  it('returns false for deliberately unknown or unsupported 404 paths (no leakage)', () => {
    expect(isPublicNavigationRoute('/random-unsupported-path')).toBe(false);
    expect(isPublicNavigationRoute('/route-that-does-not-exist')).toBe(false);
    expect(isPublicNavigationRoute('/api/v1/something')).toBe(false);
    expect(isPublicNavigationRoute('/unknown/sub/path')).toBe(false);
  });
});
