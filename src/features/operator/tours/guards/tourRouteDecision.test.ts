import { describe, expect, it } from 'vitest';
import { tourRouteDecision } from './tourRouteDecision';
import { ROUTES } from '@/lib/routes';
import type { WebAuthContext } from '@/features/auth/session/authSession';

const createMockContext = (overrides: Partial<WebAuthContext>): WebAuthContext => ({
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

describe('tourRouteDecision (BR-07 Access Boundary)', () => {
  it('redirects unauthenticated users to sign-in', () => {
    const decision = tourRouteDecision(null);
    expect(decision).toEqual({ action: 'redirect', href: ROUTES.signIn });
  });

  it('redirects travelers to home', () => {
    const context = createMockContext({
      role: 'Traveler',
      applicationStatus: null,
    });
    const decision = tourRouteDecision(context);
    expect(decision).toEqual({ action: 'redirect', href: ROUTES.home });
  });

  it('redirects administrators to admin dashboard', () => {
    const context = createMockContext({
      role: 'Administrator',
      applicationStatus: null,
    });
    const decision = tourRouteDecision(context);
    expect(decision).toEqual({ action: 'redirect', href: ROUTES.admin.dashboard });
  });

  it('redirects unapproved tour operators to partner application status', () => {
    const contextPending = createMockContext({
      role: 'TourOperator',
      applicationStatus: 'PendingApproval',
    });
    expect(tourRouteDecision(contextPending)).toEqual({
      action: 'redirect',
      href: ROUTES.partner.application,
    });

    const contextRejected = createMockContext({
      role: 'TourOperator',
      applicationStatus: 'Rejected',
    });
    expect(tourRouteDecision(contextRejected)).toEqual({
      action: 'redirect',
      href: ROUTES.partner.application,
    });
  });

  it('allows approved tour operators', () => {
    const contextApproved = createMockContext({
      role: 'TourOperator',
      applicationStatus: 'Approved',
    });
    expect(tourRouteDecision(contextApproved)).toEqual({ action: 'allow' });
  });
});
