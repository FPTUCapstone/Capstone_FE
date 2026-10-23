import { describe, expect, it } from 'vitest';
import { couponRouteDecision } from './couponRouteDecision';
import { ROUTES } from '@/lib/routes';
import type { WebAuthContext } from '@/features/auth/session/authSession';

const createMockContext = (overrides: Partial<WebAuthContext>): WebAuthContext => ({
  userId: 101,
  email: 'test@tripmate.vn',
  fullName: 'Test Operator',
  role: 'TourOperator',
  status: 'Active',
  applicationStatus: 'Approved',
  applicationUnresolved: false,
  accessToken: 'mock-token',
  accessTokenExpiresAtUtc: '2026-12-31T23:59:59Z',
  ...overrides,
});

describe('couponRouteDecision (BR-07 Access Control for UC-38/39)', () => {
  it('redirects unauthenticated guests (null context) to sign-in', () => {
    const decision = couponRouteDecision(null);
    expect(decision).toEqual({ action: 'redirect', href: ROUTES.signIn });
  });

  it('redirects travelers to home', () => {
    const context = createMockContext({
      role: 'Traveler',
      applicationStatus: null,
    });
    const decision = couponRouteDecision(context);
    expect(decision).toEqual({ action: 'redirect', href: ROUTES.home });
  });

  it('redirects administrators to admin dashboard', () => {
    const context = createMockContext({
      role: 'Administrator',
      applicationStatus: null,
    });
    const decision = couponRouteDecision(context);
    expect(decision).toEqual({ action: 'redirect', href: ROUTES.admin.dashboard });
  });

  it('redirects unapproved TourOperator with PendingApproval to partner application status', () => {
    const contextPending = createMockContext({
      role: 'TourOperator',
      applicationStatus: 'PendingApproval',
    });
    expect(couponRouteDecision(contextPending)).toEqual({
      action: 'redirect',
      href: ROUTES.partner.application,
    });
  });

  it('redirects unapproved TourOperator with Rejected to partner application status', () => {
    const contextRejected = createMockContext({
      role: 'TourOperator',
      applicationStatus: 'Rejected',
    });
    expect(couponRouteDecision(contextRejected)).toEqual({
      action: 'redirect',
      href: ROUTES.partner.application,
    });
  });

  it('redirects TourOperator with unresolved application state to partner application status', () => {
    const contextUnresolved = createMockContext({
      role: 'TourOperator',
      applicationStatus: null,
      applicationUnresolved: true,
    });
    expect(couponRouteDecision(contextUnresolved)).toEqual({
      action: 'redirect',
      href: ROUTES.partner.application,
    });
  });

  it('fails closed when TourOperator has non-Active account status', () => {
    const contextInactive = createMockContext({
      role: 'TourOperator',
      status: 'Inactive' as unknown as 'Active',
      applicationStatus: 'Approved',
    });
    expect(couponRouteDecision(contextInactive)).toEqual({
      action: 'redirect',
      href: ROUTES.signIn,
    });
  });

  it('allows active TourOperator with Approved application status', () => {
    const contextApproved = createMockContext({
      role: 'TourOperator',
      status: 'Active',
      applicationStatus: 'Approved',
      applicationUnresolved: false,
    });
    expect(couponRouteDecision(contextApproved)).toEqual({ action: 'allow' });
  });
});
