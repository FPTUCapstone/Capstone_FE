import { describe, expect, it } from 'vitest';

import { safeAdminReturnPath, resolveSignInReturnUrl } from './signInReturnUrl';

const ADMIN_DASHBOARD = '/admin';
const STAFF_DASHBOARD = '/admin/staff';
const PUBLIC_DESTINATION = '/';

describe('safeAdminReturnPath', () => {
  it.each([
    ['/admin', '/admin'],
    ['/admin/audit-logs?pageNumber=2', '/admin/audit-logs?pageNumber=2'],
    ['/admin/reports?demo=true', '/admin/reports?demo=true'],
    ['/admin/payouts#top', '/admin/payouts#top'],
  ])('keeps the same-origin administration path %s', (value, expected) => {
    expect(safeAdminReturnPath(value)).toBe(expected);
  });

  it.each([
    undefined,
    '',
    ['/admin'],
    'https://attacker.example/admin',
    '//attacker.example/admin',
    '/\\attacker.example/admin',
    '/traveler/trips',
    '/adminx',
    '/admin/login',
    '/admin/login/',
    '/admin/forgot-password',
  ])('rejects %j', (value) => {
    expect(safeAdminReturnPath(value)).toBeNull();
  });
});

describe('resolveSignInReturnUrl', () => {
  it('uses the role destination when no returnUrl is given', () => {
    expect(resolveSignInReturnUrl(undefined, 'Administrator', ADMIN_DASHBOARD)).toBe(ADMIN_DASHBOARD);
    expect(resolveSignInReturnUrl(undefined, 'Staff', STAFF_DASHBOARD)).toBe(STAFF_DASHBOARD);
  });

  it('honors an allowed administration page for an Administrator', () => {
    expect(resolveSignInReturnUrl('/admin/audit-logs', 'Administrator', ADMIN_DASHBOARD)).toBe('/admin/audit-logs');
    expect(resolveSignInReturnUrl('/admin/reports', 'Administrator', ADMIN_DASHBOARD)).toBe('/admin/reports');
  });

  it('falls back for an Administrator on the Staff-only POI page', () => {
    expect(resolveSignInReturnUrl('/admin/catalogue/points-of-interest/new', 'Administrator', ADMIN_DASHBOARD))
      .toBe(ADMIN_DASHBOARD);
  });

  it('honors only the Staff allow-list for a Staff user', () => {
    expect(resolveSignInReturnUrl('/admin/payouts', 'Staff', STAFF_DASHBOARD)).toBe('/admin/payouts');
    expect(resolveSignInReturnUrl('/admin/account/security', 'Staff', STAFF_DASHBOARD)).toBe('/admin/account/security');
    expect(resolveSignInReturnUrl('/admin/catalogue/points-of-interest/new', 'Staff', STAFF_DASHBOARD))
      .toBe('/admin/catalogue/points-of-interest/new');
    expect(resolveSignInReturnUrl('/admin/reports', 'Staff', STAFF_DASHBOARD)).toBe(STAFF_DASHBOARD);
    expect(resolveSignInReturnUrl('/admin/audit-logs', 'Staff', STAFF_DASHBOARD)).toBe(STAFF_DASHBOARD);
    expect(resolveSignInReturnUrl('/admin', 'Staff', STAFF_DASHBOARD)).toBe(STAFF_DASHBOARD);
  });

  it('never forwards an administration returnUrl to a Traveler or Tour Operator', () => {
    expect(resolveSignInReturnUrl('/admin/audit-logs', 'Traveler', PUBLIC_DESTINATION)).toBe(PUBLIC_DESTINATION);
    expect(resolveSignInReturnUrl('/admin/audit-logs', 'TourOperator', '/partner')).toBe('/partner');
  });

  it('keeps a null destination when the role has no landing page yet', () => {
    expect(resolveSignInReturnUrl('/admin/audit-logs', 'TourOperator', null)).toBeNull();
  });

  it('ignores an unsafe returnUrl and uses the role destination', () => {
    expect(resolveSignInReturnUrl('https://attacker.example/admin', 'Administrator', ADMIN_DASHBOARD)).toBe(ADMIN_DASHBOARD);
    expect(resolveSignInReturnUrl('/admin/login', 'Administrator', ADMIN_DASHBOARD)).toBe(ADMIN_DASHBOARD);
  });
});
