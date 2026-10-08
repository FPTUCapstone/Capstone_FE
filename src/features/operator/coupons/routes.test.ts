import { describe, expect, it } from 'vitest';
import { OPERATOR_COUPON_ROUTES, withCouponDemoMode } from './routes';

describe('OPERATOR_COUPON_ROUTES', () => {
  it('defines correct static and dynamic route paths', () => {
    expect(OPERATOR_COUPON_ROUTES.list).toBe('/partner/coupons');
    expect(OPERATOR_COUPON_ROUTES.create).toBe('/partner/coupons/new');
    expect(OPERATOR_COUPON_ROUTES.edit('CP-01')).toBe('/partner/coupons/CP-01/edit');
    expect(OPERATOR_COUPON_ROUTES.edit('coupon with spaces')).toBe(
      '/partner/coupons/coupon%20with%20spaces/edit'
    );
  });
});

describe('withCouponDemoMode', () => {
  it('returns unchanged href when isDemo is false', () => {
    expect(withCouponDemoMode('/partner/coupons', false)).toBe('/partner/coupons');
    expect(withCouponDemoMode('/partner/coupons/new', false)).toBe('/partner/coupons/new');
    expect(withCouponDemoMode('/partner/coupons/1/edit', false)).toBe('/partner/coupons/1/edit');
  });

  it('returns empty string when href is empty', () => {
    expect(withCouponDemoMode('', true)).toBe('');
    expect(withCouponDemoMode('', false)).toBe('');
  });

  it('appends ?demo=1 when isDemo is true and no query exists', () => {
    expect(withCouponDemoMode('/partner/coupons', true)).toBe('/partner/coupons?demo=1');
    expect(withCouponDemoMode('/partner/coupons/new', true)).toBe('/partner/coupons/new?demo=1');
  });

  it('preserves existing query parameters and appends demo=1', () => {
    expect(withCouponDemoMode('/partner/coupons?status=Active', true)).toBe(
      '/partner/coupons?status=Active&demo=1'
    );
  });

  it('does not duplicate demo=1 if already present', () => {
    expect(withCouponDemoMode('/partner/coupons?demo=1', true)).toBe('/partner/coupons?demo=1');
    expect(withCouponDemoMode('/partner/coupons?status=Active&demo=1', true)).toBe(
      '/partner/coupons?status=Active&demo=1'
    );
  });

  it('preserves hash fragments after query params', () => {
    expect(withCouponDemoMode('/partner/coupons#rules', true)).toBe('/partner/coupons?demo=1#rules');
    expect(withCouponDemoMode('/partner/coupons?tab=1#rules', true)).toBe(
      '/partner/coupons?tab=1&demo=1#rules'
    );
  });
});
