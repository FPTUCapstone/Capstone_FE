import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStorage, type WebAuthContext } from '../session/authSession';

const mocks = vi.hoisted(() => ({ webRefresh: vi.fn(), push: vi.fn(), replace: vi.fn() }));
vi.mock('@/lib/authApi', () => ({ webRefresh: mocks.webRefresh }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push, replace: mocks.replace }) }));

const { PartnerRouteGuard } = await import('./PartnerRouteGuard');

const ctx = (overrides: Record<string, unknown> = {}): WebAuthContext => AuthStorage.accept({
  userId: 42, email: 'user@example.com', fullName: 'User', role: 'Traveler', status: 'Active',
  applicationStatus: null, applicationUnresolved: false, accessToken: 'test-access',
  accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(), ...overrides,
} as unknown as WebAuthContext, false);

function Guarded({ route }: { route: 'register' | 'dashboard' | 'application' | 'resubmit' }) {
  return (
    <PartnerRouteGuard route={route}>
      <p>protected:{route}</p>
    </PartnerRouteGuard>
  );
}

afterEach(() => { cleanup(); vi.clearAllMocks(); });
beforeEach(() => { AuthStorage.clear(); localStorage.clear(); sessionStorage.clear(); });

describe('PartnerRouteGuard (CR-11 runtime enforcement)', () => {
  it('H. renders nothing and issues no redirect while the session is still restoring', async () => {
    let settleRefresh!: () => void;
    const gate = new Promise<void>((resolve) => { settleRefresh = resolve; });
    mocks.webRefresh.mockImplementation(async () => { await gate; return ctx({ role: 'TourOperator', applicationStatus: 'PendingApproval' }); });
    render(<Guarded route="register" />);
    // No guest registration and no Partner content before restore settles.
    expect(screen.queryByText('protected:register')).toBeNull();
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).toBeDefined();
    settleRefresh();
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/partner/application'));
    expect(screen.queryByText('protected:register')).toBeNull();
  });

  it('A. renders guest registration content when settled unauthenticated', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<Guarded route="register" />);
    await waitFor(() => expect(screen.getByText('protected:register')).toBeDefined());
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('A. redirects guest away from /partner to public sign-in without rendering content', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<Guarded route="dashboard" />);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/sign-in'));
    expect(screen.queryByText('protected:dashboard')).toBeNull();
  });

  it('A. redirects guest away from /partner/application to public sign-in', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<Guarded route="application" />);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/sign-in'));
  });

  it('B. redirects a restored Traveler to home from every Partner route, never "Please sign in"', async () => {
    mocks.webRefresh.mockImplementation(async () => ctx());
    for (const route of ['register', 'dashboard', 'application'] as const) {
      cleanup();
      render(<Guarded route={route} />);
      await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/'));
      expect(screen.queryByText(`protected:${route}`)).toBeNull();
    }
    expect(screen.queryByText(/sign in/i)).toBeNull();
  });

  it('C. redirects a restored Administrator to /admin from every Partner route', async () => {
    mocks.webRefresh.mockImplementation(async () => ctx({ role: 'Administrator' }));
    for (const route of ['register', 'dashboard', 'application'] as const) {
      cleanup();
      render(<Guarded route={route} />);
      await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/admin'));
      expect(screen.queryByText(`protected:${route}`)).toBeNull();
    }
  });

  it('D. renders the approved workspace and redirects the other routes to /partner', async () => {
    mocks.webRefresh.mockImplementation(async () => ctx({ role: 'TourOperator', applicationStatus: 'Approved' }));
    render(<Guarded route="dashboard" />);
    await waitFor(() => expect(screen.getByText('protected:dashboard')).toBeDefined());
    expect(mocks.replace).not.toHaveBeenCalled();
    cleanup();
    mocks.webRefresh.mockImplementation(async () => ctx({ role: 'TourOperator', applicationStatus: 'Approved' }));
    render(<Guarded route="register" />);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/partner'));
    cleanup();
    render(<Guarded route="application" />);
    await waitFor(() => expect(mocks.replace).toHaveBeenLastCalledWith('/partner'));
  });

  it.each([
    ['E. PendingApproval', 'PendingApproval'],
    ['F. Rejected', 'Rejected'],
  ])('%s renders /partner/application and redirects dashboard/register away', async (_label, applicationStatus) => {
    mocks.webRefresh.mockImplementation(async () => ctx({ role: 'TourOperator', applicationStatus }));
    render(<Guarded route="application" />);
    await waitFor(() => expect(screen.getByText('protected:application')).toBeDefined());
    cleanup();
    mocks.webRefresh.mockImplementation(async () => ctx({ role: 'TourOperator', applicationStatus }));
    render(<Guarded route="dashboard" />);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/partner/application'));
    cleanup();
    mocks.webRefresh.mockImplementation(async () => ctx({ role: 'TourOperator', applicationStatus }));
    render(<Guarded route="register" />);
    await waitFor(() => expect(mocks.replace).toHaveBeenLastCalledWith('/partner/application'));
  });

  it('G. renders the fail-closed unresolved UI on /partner/application and redirects the others, inferring nothing', async () => {
    mocks.webRefresh.mockImplementation(async () => ctx({ role: 'TourOperator', applicationStatus: null }));
    render(<Guarded route="application" />);
    await waitFor(() => expect(screen.getByText('protected:application')).toBeDefined());
    cleanup();
    mocks.webRefresh.mockImplementation(async () => ctx({ role: 'TourOperator', applicationStatus: null }));
    render(<Guarded route="dashboard" />);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/partner/application'));
    cleanup();
    mocks.webRefresh.mockImplementation(async () => ctx({ role: 'TourOperator', applicationStatus: null }));
    render(<Guarded route="register" />);
    await waitFor(() => expect(mocks.replace).toHaveBeenLastCalledWith('/partner/application'));
  });

  it('hard navigation: empty memory + valid cookie restores the role and evaluates the matrix on it', async () => {
    // Simulate F5: module memory starts empty; the cookie-backed restore returns
    // an authenticated Traveler. /partner/register must NOT render guest content;
    // the restored role decides the redirect.
    mocks.webRefresh.mockImplementation(async () => ctx({ role: 'Traveler', fullName: 'Restored Traveler' }));
    render(<Guarded route="register" />);
    expect(screen.queryByText('protected:register')).toBeNull();
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/'));
    expect(screen.queryByText('protected:register')).toBeNull();
  });

  it.each([
    { label: 'guest', overrides: null, href: '/sign-in' },
    { label: 'Traveler', overrides: { role: 'Traveler' }, href: '/' },
    { label: 'Administrator', overrides: { role: 'Administrator' }, href: '/admin' },
    { label: 'Approved', overrides: { role: 'TourOperator', applicationStatus: 'Approved' }, href: '/partner' },
    { label: 'PendingApproval', overrides: { role: 'TourOperator', applicationStatus: 'PendingApproval' }, href: '/partner/application' },
    { label: 'unresolved', overrides: { role: 'TourOperator', applicationStatus: null }, href: '/partner/application' },
  ])('resubmit: denies $label toward $href without rendering the form', async ({ overrides, href }) => {
    if (overrides === null) mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    else mocks.webRefresh.mockImplementation(async () => ctx(overrides));
    render(<Guarded route="resubmit" />);
    expect(screen.queryByText('protected:resubmit')).toBeNull();
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith(href));
    expect(screen.queryByText('protected:resubmit')).toBeNull();
  });

  it('resubmit: allows Rejected (the only resubmission state)', async () => {
    mocks.webRefresh.mockImplementation(async () => ctx({ role: 'TourOperator', applicationStatus: 'Rejected' }));
    render(<Guarded route="resubmit" />);
    await waitFor(() => expect(screen.getByText('protected:resubmit')).toBeDefined());
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('resubmit restoring: no form and no redirect until S01 settles', async () => {
    let settleRefresh!: () => void;
    const gate = new Promise<void>((resolve) => { settleRefresh = resolve; });
    mocks.webRefresh.mockImplementation(async () => { await gate; return ctx({ role: 'TourOperator', applicationStatus: 'Rejected' }); });
    render(<Guarded route="resubmit" />);
    expect(screen.queryByText('protected:resubmit')).toBeNull();
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toBeDefined();
    settleRefresh();
    await waitFor(() => expect(screen.getByText('protected:resubmit')).toBeDefined());
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('hard navigation as Rejected: restore first, then the resubmit form is allowed', async () => {
    mocks.webRefresh.mockImplementation(async () => ctx({ role: 'TourOperator', applicationStatus: 'Rejected' }));
    render(<Guarded route="resubmit" />);
    // Cold start shows no form while restoring, then the restored Rejected
    // context authorizes the form without any redirect.
    await waitFor(() => expect(screen.getByText('protected:resubmit')).toBeDefined());
    expect(mocks.webRefresh).toHaveBeenCalledTimes(1);
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('hard navigation as PendingApproval: restore first, then redirect to /partner/application', async () => {
    mocks.webRefresh.mockImplementation(async () => ctx({ role: 'TourOperator', applicationStatus: 'PendingApproval' }));
    render(<Guarded route="resubmit" />);
    expect(screen.queryByText('protected:resubmit')).toBeNull();
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/partner/application'));
    expect(screen.queryByText('protected:resubmit')).toBeNull();
  });

  it('does not re-call webRefresh when a warm in-memory context already decides the route', () => {
    AuthStorage.accept(ctx({ role: 'TourOperator', applicationStatus: 'Approved' }), false);
    render(<Guarded route="dashboard" />);
    expect(screen.getByText('protected:dashboard')).toBeDefined();
    expect(mocks.webRefresh).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
