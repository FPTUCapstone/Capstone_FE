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
  it('A. redirects unauthenticated users (null context) to sign-in', () => {
    const decision = tourRouteDecision(null);
    expect(decision).toEqual({ action: 'redirect', href: ROUTES.signIn });
  });

  it('B. redirects travelers to home', () => {
    const context = createMockContext({
      role: 'Traveler',
      applicationStatus: null,
    });
    const decision = tourRouteDecision(context);
    expect(decision).toEqual({ action: 'redirect', href: ROUTES.home });
  });

  it('C. redirects administrators to admin dashboard', () => {
    const context = createMockContext({
      role: 'Administrator',
      applicationStatus: null,
    });
    const decision = tourRouteDecision(context);
    expect(decision).toEqual({ action: 'redirect', href: ROUTES.admin.dashboard });
  });

  it('C2. redirects staff to staff operations dashboard', () => {
    const context = createMockContext({
      role: 'Staff',
      applicationStatus: null,
    });
    const decision = tourRouteDecision(context);
    expect(decision).toEqual({ action: 'redirect', href: ROUTES.admin.staffDashboard });
  });

  it('D. redirects TourOperator with PendingApproval to partner application status', () => {
    const contextPending = createMockContext({
      role: 'TourOperator',
      applicationStatus: 'PendingApproval',
    });
    expect(tourRouteDecision(contextPending)).toEqual({
      action: 'redirect',
      href: ROUTES.partner.application,
    });
  });

  it('E. redirects TourOperator with Rejected to partner application status', () => {
    const contextRejected = createMockContext({
      role: 'TourOperator',
      applicationStatus: 'Rejected',
    });
    expect(tourRouteDecision(contextRejected)).toEqual({
      action: 'redirect',
      href: ROUTES.partner.application,
    });
  });

  it('F. redirects TourOperator with unresolved application state to partner application status', () => {
    const contextUnresolved = createMockContext({
      role: 'TourOperator',
      applicationStatus: null,
      applicationUnresolved: true,
    });
    expect(tourRouteDecision(contextUnresolved)).toEqual({
      action: 'redirect',
      href: ROUTES.partner.application,
    });
  });

  it('fails closed when TourOperator has non-Active status', () => {
    const contextInactive = createMockContext({
      role: 'TourOperator',
      status: 'Inactive' as unknown as 'Active',
      applicationStatus: 'Approved',
    });
    expect(tourRouteDecision(contextInactive)).toEqual({
      action: 'redirect',
      href: ROUTES.signIn,
    });
  });

  it('G. allows TourOperator with Active status and Approved application status', () => {
    const contextApproved = createMockContext({
      role: 'TourOperator',
      status: 'Active',
      applicationStatus: 'Approved',
      applicationUnresolved: false,
    });
    expect(tourRouteDecision(contextApproved)).toEqual({ action: 'allow' });
  });
});
