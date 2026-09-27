import { describe, expect, it } from 'vitest';
import { AuthStorage, type WebAuthContext } from '../session/authSession';
import { partnerRouteDecision } from './partnerRouteDecision';

const ctx = (overrides: Record<string, unknown> = {}): WebAuthContext => AuthStorage.accept({
  userId: 42, email: 'user@example.com', fullName: 'User', role: 'Traveler', status: 'Active',
  applicationStatus: null, applicationUnresolved: false, accessToken: 'test-access',
  accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(), ...overrides,
} as unknown as WebAuthContext, false);

describe('partnerRouteDecision (CR-11 matrix, evaluated only after restore settles)', () => {
  describe('A. Guest (settled unauthenticated)', () => {
    it('allows /partner/register (future UC-02 entry point)', () => {
      expect(partnerRouteDecision('register', null)).toEqual({ action: 'allow' });
    });
    it('denies /partner to the public sign-in destination', () => {
      expect(partnerRouteDecision('dashboard', null)).toEqual({ action: 'redirect', href: '/sign-in' });
    });
    it('denies /partner/application to the public sign-in destination', () => {
      expect(partnerRouteDecision('application', null)).toEqual({ action: 'redirect', href: '/sign-in' });
    });
  });

  describe('B. Traveler (never sees "Please sign in", lands on own destination)', () => {
    it.each([
      ['register', '/'],
      ['dashboard', '/'],
      ['application', '/'],
    ] as const)('denies %s by redirecting to %s', (route, href) => {
      expect(partnerRouteDecision(route, ctx())).toEqual({ action: 'redirect', href });
    });
  });

  describe('C. Administrator', () => {
    it.each([
      ['register', '/admin'],
      ['dashboard', '/admin'],
      ['application', '/admin'],
    ] as const)('denies %s by redirecting to %s', (route, href) => {
      expect(partnerRouteDecision(route, ctx({ role: 'Administrator' }))).toEqual({ action: 'redirect', href });
    });
  });

  describe('D. TourOperator Approved', () => {
    const approved = ctx({ role: 'TourOperator', applicationStatus: 'Approved' });
    it('allows /partner', () => {
      expect(partnerRouteDecision('dashboard', approved)).toEqual({ action: 'allow' });
    });
    it('denies registration, redirects to /partner', () => {
      expect(partnerRouteDecision('register', approved)).toEqual({ action: 'redirect', href: '/partner' });
    });
    it('redirects /partner/application to /partner', () => {
      expect(partnerRouteDecision('application', approved)).toEqual({ action: 'redirect', href: '/partner' });
    });
  });

  describe.each([
    ['E. TourOperator PendingApproval', 'PendingApproval'],
    ['F. TourOperator Rejected', 'Rejected'],
  ])('%s', (_label, applicationStatus) => {
    const operator = ctx({ role: 'TourOperator', applicationStatus });
    it('allows /partner/application', () => {
      expect(partnerRouteDecision('application', operator)).toEqual({ action: 'allow' });
    });
    it('redirects /partner to /partner/application', () => {
      expect(partnerRouteDecision('dashboard', operator)).toEqual({ action: 'redirect', href: '/partner/application' });
    });
    it('denies registration, redirects to /partner/application', () => {
      expect(partnerRouteDecision('register', operator)).toEqual({ action: 'redirect', href: '/partner/application' });
    });
  });

  describe('G. TourOperator unresolved (null application status)', () => {
    const unresolved = ctx({ role: 'TourOperator', applicationStatus: null });
    it('allows /partner/application solely for the existing fail-closed unresolved UI', () => {
      expect(partnerRouteDecision('application', unresolved)).toEqual({ action: 'allow' });
    });
    it('redirects /partner to /partner/application without inferring a state', () => {
      expect(partnerRouteDecision('dashboard', unresolved)).toEqual({ action: 'redirect', href: '/partner/application' });
    });
    it('denies registration toward /partner/application', () => {
      expect(partnerRouteDecision('register', unresolved)).toEqual({ action: 'redirect', href: '/partner/application' });
    });
    it('denies resubmit toward /partner/application without inferring Rejected', () => {
      expect(partnerRouteDecision('resubmit', unresolved)).toEqual({ action: 'redirect', href: '/partner/application' });
    });
  });

  describe('Resubmit is its own permission (never inherited from the application screen)', () => {
    it('denies a guest toward public sign-in', () => {
      expect(partnerRouteDecision('resubmit', null)).toEqual({ action: 'redirect', href: '/sign-in' });
    });
    it('denies a Traveler toward home', () => {
      expect(partnerRouteDecision('resubmit', ctx())).toEqual({ action: 'redirect', href: '/' });
    });
    it('denies an Administrator toward the admin dashboard', () => {
      expect(partnerRouteDecision('resubmit', ctx({ role: 'Administrator' }))).toEqual({ action: 'redirect', href: '/admin' });
    });
    it('denies an Approved operator toward /partner', () => {
      expect(partnerRouteDecision('resubmit', ctx({ role: 'TourOperator', applicationStatus: 'Approved' }))).toEqual({ action: 'redirect', href: '/partner' });
    });
    it('denies PendingApproval (still under review) toward /partner/application', () => {
      expect(partnerRouteDecision('resubmit', ctx({ role: 'TourOperator', applicationStatus: 'PendingApproval' }))).toEqual({ action: 'redirect', href: '/partner/application' });
    });
    it('allows Rejected (the only resubmission state)', () => {
      expect(partnerRouteDecision('resubmit', ctx({ role: 'TourOperator', applicationStatus: 'Rejected' }))).toEqual({ action: 'allow' });
    });
  });
});
