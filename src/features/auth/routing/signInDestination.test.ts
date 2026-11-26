import { describe, expect, it } from 'vitest';
import type { WebAuthContext } from '../session/authSession';
import { resolveSafeReturnPath, resolveSignInDestination } from './signInDestination';

const traveler: WebAuthContext = {
  userId: 10,
  email: 'traveler@example.com',
  fullName: 'Traveler',
  role: 'Traveler',
  status: 'Active',
  applicationStatus: null,
  applicationUnresolved: false,
  accessToken: 'token',
  accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
};

const approvedOperator: WebAuthContext = {
  ...traveler,
  role: 'TourOperator',
  applicationStatus: 'Approved',
};

const pendingOperator: WebAuthContext = {
  ...traveler,
  role: 'TourOperator',
  applicationStatus: 'PendingApproval',
};

describe('resolveSignInDestination', () => {
  it('honours safe relative returnTo and returnUrl targets for eligible roles', () => {
    expect(resolveSignInDestination(traveler, '/messages')).toBe('/messages');
    expect(resolveSignInDestination(traveler, '/itineraries')).toBe('/itineraries');
    expect(resolveSignInDestination(approvedOperator, '/messages?tab=group')).toBe('/messages?tab=group');
  });

  it('blocks open redirects, protocol-relative URLs, backslashes, and auth loop paths', () => {
    expect(resolveSafeReturnPath('https://evil.com/messages', traveler)).toBeNull();
    expect(resolveSafeReturnPath('//evil.com/messages', traveler)).toBeNull();
    expect(resolveSafeReturnPath('/\\evil.com', traveler)).toBeNull();
    expect(resolveSafeReturnPath('/sign-in?returnTo=/messages', traveler)).toBeNull();
    expect(resolveSignInDestination(traveler, '//evil.com')).toBe('/');
  });

  it('enforces role restrictions and onboarding precedence over return targets', () => {
    expect(resolveSignInDestination(traveler, '/admin/users')).toBe('/');
    expect(resolveSignInDestination(traveler, '/partner')).toBe('/');
    expect(resolveSignInDestination(approvedOperator, '/itineraries')).toBe('/partner');
    expect(resolveSignInDestination(pendingOperator, '/messages')).toBe('/partner/application');
    expect(resolveSignInDestination({ ...traveler, mustChangePassword: true }, '/messages')).toBe('/first-password');
  });
});
