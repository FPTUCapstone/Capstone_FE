import { describe, expect, it } from 'vitest';
import { isPublicNavigationRoute } from './publicRoutePredicate';

describe('isPublicNavigationRoute', () => {
  it('returns true for root public homepage', () => {
    expect(isPublicNavigationRoute('/')).toBe(true);
    expect(isPublicNavigationRoute('')).toBe(true);
  });

  it('returns true for core public exploration routes', () => {
    expect(isPublicNavigationRoute('/tours')).toBe(true);
    expect(isPublicNavigationRoute('/tours/101')).toBe(true);
    expect(isPublicNavigationRoute('/tours/101/book')).toBe(true);
    expect(isPublicNavigationRoute('/pois')).toBe(true);
    expect(isPublicNavigationRoute('/pois/202')).toBe(true);
    expect(isPublicNavigationRoute('/plan')).toBe(true);
    expect(isPublicNavigationRoute('/itineraries')).toBe(true);
    expect(isPublicNavigationRoute('/itinerary/303')).toBe(true);
  });

  it('returns true for traveler account pages', () => {
    expect(isPublicNavigationRoute('/account')).toBe(true);
    expect(isPublicNavigationRoute('/account/profile')).toBe(true);
    expect(isPublicNavigationRoute('/account/preferences')).toBe(true);
    expect(isPublicNavigationRoute('/account/trips')).toBe(true);
    expect(isPublicNavigationRoute('/bookings/555/ticket')).toBe(true);
  });

  it('returns false for admin workspace routes', () => {
    expect(isPublicNavigationRoute('/admin')).toBe(false);
    expect(isPublicNavigationRoute('/admin/login')).toBe(false);
    expect(isPublicNavigationRoute('/admin/users')).toBe(false);
    expect(isPublicNavigationRoute('/admin/payouts')).toBe(false);
    expect(isPublicNavigationRoute('/admin/reports')).toBe(false);
  });

  it('returns false for partner workspace routes', () => {
    expect(isPublicNavigationRoute('/partner')).toBe(false);
    expect(isPublicNavigationRoute('/partner/register')).toBe(false);
    expect(isPublicNavigationRoute('/partner/application')).toBe(false);
    expect(isPublicNavigationRoute('/partner/tours')).toBe(false);
    expect(isPublicNavigationRoute('/partner/revenue')).toBe(false);
  });

  it('returns false for standalone auth pages', () => {
    expect(isPublicNavigationRoute('/sign-in')).toBe(false);
    expect(isPublicNavigationRoute('/register')).toBe(false);
    expect(isPublicNavigationRoute('/forgot-password')).toBe(false);
    expect(isPublicNavigationRoute('/verify-account')).toBe(false);
    expect(isPublicNavigationRoute('/verify-email')).toBe(false);
  });

  it('returns false for standalone checkout, dev and payment handoff routes', () => {
    expect(isPublicNavigationRoute('/checkout/mock')).toBe(false);
    expect(isPublicNavigationRoute('/checkout/result')).toBe(false);
    expect(isPublicNavigationRoute('/bookings/123/pay')).toBe(false);
    expect(isPublicNavigationRoute('/dev/payment')).toBe(false);
  });
});
