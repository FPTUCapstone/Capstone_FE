import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/lib/routes';
import { bookingRouteDecision } from './bookingRouteDecision';
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

describe('bookingRouteDecision (BR-07 Runtime Route Boundary)', () => {
  it('redirects unauthenticated (null context) to sign-in', () => {
    const decision = bookingRouteDecision(null);
    expect(decision).toEqual({ action: 'redirect', href: ROUTES.signIn });
  });

  it('redirects Traveler to home', () => {
    const context = createMockContext({
      role: 'Traveler',
      applicationStatus: null,
    });
    expect(bookingRouteDecision(context)).toEqual({ action: 'redirect', href: ROUTES.home });
  });

  it('redirects Administrator to admin dashboard', () => {
    const context = createMockContext({
      role: 'Administrator',
      applicationStatus: null,
    });
    expect(bookingRouteDecision(context)).toEqual({
      action: 'redirect',
      href: ROUTES.admin.dashboard,
    });
  });

  it('redirects Staff to staff operations dashboard', () => {
    const context = createMockContext({
      role: 'Staff',
      applicationStatus: null,
    });
    expect(bookingRouteDecision(context)).toEqual({
      action: 'redirect',
      href: ROUTES.admin.staffDashboard,
    });
  });

  it('redirects inactive TourOperator to sign-in', () => {
    const context = createMockContext({
      role: 'TourOperator',
      status: 'Inactive' as unknown as 'Active',
      applicationStatus: 'Approved',
    });
    expect(bookingRouteDecision(context)).toEqual({ action: 'redirect', href: ROUTES.signIn });
  });

  it('redirects unapproved TourOperator to application status page', () => {
    const pendingContext = createMockContext({
      role: 'TourOperator',
      applicationStatus: 'PendingApproval',
    });
    expect(bookingRouteDecision(pendingContext)).toEqual({
      action: 'redirect',
      href: ROUTES.partner.application,
    });

    const rejectedContext = createMockContext({
      role: 'TourOperator',
      applicationStatus: 'Rejected',
    });
    expect(bookingRouteDecision(rejectedContext)).toEqual({
      action: 'redirect',
      href: ROUTES.partner.application,
    });
  });

  it('redirects TourOperator with unresolved application status to application page', () => {
    const unresolvedContext = createMockContext({
      role: 'TourOperator',
      applicationStatus: 'Approved',
      applicationUnresolved: true,
    });
    expect(bookingRouteDecision(unresolvedContext)).toEqual({
      action: 'redirect',
      href: ROUTES.partner.application,
    });
  });

  it('allows active TourOperator with approved application status', () => {
    const approvedContext = createMockContext({
      role: 'TourOperator',
      status: 'Active',
      applicationStatus: 'Approved',
      applicationUnresolved: false,
    });
    expect(bookingRouteDecision(approvedContext)).toEqual({ action: 'allow' });
  });
});
