import { describe, expect, it } from 'vitest';
import { financeRouteDecision } from './financeRouteDecision';
import { ROUTES } from '@/lib/routes';
import type { WebAuthContext } from '@/features/auth/session/authSession';

const createMockContext = (
  overrides: Partial<WebAuthContext>
): WebAuthContext => ({
  userId: 101,
  email: 'test@tripmate.vn',
  fullName: 'Test User',
  role: 'TourOperator',
  status: 'Active',
  applicationStatus: 'Approved',
  applicationUnresolved: false,
  accessToken: 'mock-token',
  accessTokenExpiresAtUtc: '2026-12-31T23:59:59Z',
  ...overrides,
});

describe('financeRouteDecision', () => {
  it('redirects unauthenticated user (null context) to sign in', () => {
    const decision = financeRouteDecision(null);
    expect(decision).toEqual({ action: 'redirect', href: ROUTES.signIn });
  });

  it('redirects Traveler to home page', () => {
    const context = createMockContext({
      role: 'Traveler',
      applicationStatus: null,
    });
    const decision = financeRouteDecision(context);
    expect(decision).toEqual({ action: 'redirect', href: ROUTES.home });
  });

  it('redirects Administrator to admin console dashboard', () => {
    const context = createMockContext({
      role: 'Administrator',
      applicationStatus: null,
    });
    const decision = financeRouteDecision(context);
    expect(decision).toEqual({ action: 'redirect', href: ROUTES.admin.dashboard });
  });

  it('redirects TourOperator with PendingApproval application to partner application status', () => {
    const context = createMockContext({
      role: 'TourOperator',
      applicationStatus: 'PendingApproval',
    });
    const decision = financeRouteDecision(context);
    expect(decision).toEqual({
      action: 'redirect',
      href: ROUTES.partner.application,
    });
  });

  it('redirects TourOperator with Rejected application to partner application status', () => {
    const context = createMockContext({
      role: 'TourOperator',
      applicationStatus: 'Rejected',
    });
    const decision = financeRouteDecision(context);
    expect(decision).toEqual({
      action: 'redirect',
      href: ROUTES.partner.application,
    });
  });

  it('redirects TourOperator with unresolved application state to partner application', () => {
    const context = createMockContext({
      role: 'TourOperator',
      applicationStatus: 'Approved',
      applicationUnresolved: true,
    });
    const decision = financeRouteDecision(context);
    expect(decision).toEqual({
      action: 'redirect',
      href: ROUTES.partner.application,
    });
  });

  it('allows authenticated, active TourOperator with approved application', () => {
    const context = createMockContext({
      role: 'TourOperator',
      applicationStatus: 'Approved',
    });
    const decision = financeRouteDecision(context);
    expect(decision).toEqual({ action: 'allow' });
  });
});
