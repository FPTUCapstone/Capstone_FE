import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStorage } from '@/features/auth/session/authSession';

const mocks = vi.hoisted(() => ({ webRefresh: vi.fn() }));
vi.mock('@/lib/authApi', () => ({ webRefresh: mocks.webRefresh }));

const { PublicNavigation } = await import('./PublicNavigation');

const context = (overrides: Record<string, unknown> = {}) => ({
  userId: 42,
  email: 'traveler@example.com',
  fullName: 'Test Traveler',
  role: 'Traveler',
  status: 'Active',
  applicationStatus: null,
  applicationUnresolved: false,
  accessToken: 'test-access',
  accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(),
  ...overrides,
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('PublicNavigation S01 restore-aware runtime', () => {
  beforeEach(() => {
    AuthStorage.clear();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('starts in a restoring state, calls webRefresh once, and does not render Guest before it settles', async () => {
    let settleRefresh!: () => void;
    const gate = new Promise<void>((resolve) => { settleRefresh = resolve; });
    mocks.webRefresh.mockImplementation(async () => { await gate; return AuthStorage.accept(context(), false); });
    render(<PublicNavigation />);
    // Empty in-memory context is NOT treated as Guest during restore.
    expect(screen.queryByRole('link', { name: 'Đăng nhập' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Đăng xuất' })).toBeNull();
    expect(screen.getByRole('status')).toBeDefined();
    expect(mocks.webRefresh).toHaveBeenCalledTimes(1);
    settleRefresh();
    await waitFor(() => expect(screen.getByText('Test Traveler')).toBeDefined());
  });

  it('restores an authenticated Traveler from a valid refresh cookie', async () => {
    mocks.webRefresh.mockImplementation(async () => AuthStorage.accept(context({ fullName: 'Restored Traveler' }), false));
    render(<PublicNavigation />);
    await waitFor(() => expect(screen.getByText('Restored Traveler')).toBeDefined());
    expect(screen.queryByRole('link', { name: 'Đăng nhập' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Đăng xuất' })).toBeDefined();
  });

  it('restores an authenticated Administrator with no Partner entry', async () => {
    mocks.webRefresh.mockImplementation(async () => AuthStorage.accept(context({ role: 'Administrator', fullName: 'Restored Admin' }), false));
    render(<PublicNavigation />);
    await waitFor(() => expect(screen.getByText('Restored Admin')).toBeDefined());
    expect(screen.queryByRole('link', { name: 'Dành cho Đối tác' })).toBeNull();
  });

  it.each([
    ['Approved', '/partner'],
    ['PendingApproval', '/partner/application'],
    ['Rejected', '/partner/application'],
  ])('restores a TourOperator %s and routes Partner to %s', async (applicationStatus, href) => {
    mocks.webRefresh.mockImplementation(async () => AuthStorage.accept(context({ role: 'TourOperator', fullName: 'Restored Operator', applicationStatus }), false));
    render(<PublicNavigation />);
    await waitFor(() => expect(screen.getByRole('link', { name: 'Dành cho Đối tác' })).toBeDefined());
    expect(screen.getByRole('link', { name: 'Dành cho Đối tác' }).getAttribute('href')).toBe(href);
  });

  it('preserves an unresolved TourOperator as the fail-closed application projection, not Approved', async () => {
    mocks.webRefresh.mockImplementation(async () => AuthStorage.accept(context({ role: 'TourOperator', fullName: 'Restored Operator', applicationStatus: null }), false));
    render(<PublicNavigation />);
    await waitFor(() => expect(screen.getByRole('link', { name: 'Dành cho Đối tác' })).toBeDefined());
    expect(screen.getByRole('link', { name: 'Dành cho Đối tác' }).getAttribute('href')).toBe('/partner/application');
  });

  it('settles unauthenticated when the refresh cookie is invalid (401)', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<PublicNavigation />);
    await waitFor(() => expect(screen.getByRole('link', { name: 'Đăng nhập' })).toBeDefined());
    expect(screen.queryByRole('status')).toBeNull();
    expect(AuthStorage.getContext()).toBeNull();
  });

  it('settles unauthenticated when there is no refresh cookie, exposing guest registration', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<PublicNavigation />);
    await waitFor(() => expect(screen.getByRole('link', { name: 'Dành cho Đối tác' })).toBeDefined());
    expect(screen.getByRole('link', { name: 'Dành cho Đối tác' }).getAttribute('href')).toBe('/partner/register');
    expect(screen.getByRole('link', { name: 'Đăng ký' })).toBeDefined();
  });

  it('does not call webRefresh when a valid in-memory context already exists', () => {
    AuthStorage.accept(context({ fullName: 'Warm Context' }), false);
    render(<PublicNavigation />);
    expect(screen.getByText('Warm Context')).toBeDefined();
    expect(mocks.webRefresh).not.toHaveBeenCalled();
  });

  it('settles back to Sign In (not stuck restoring) when a warm session signs out', async () => {
    AuthStorage.accept(context({ fullName: 'Warm Context' }), false);
    render(<PublicNavigation />);
    expect(screen.getByText('Warm Context')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }));
    await waitFor(() => expect(screen.getByRole('link', { name: 'Đăng nhập' })).toBeDefined());
    expect(screen.queryByRole('status')).toBeNull();
    expect(mocks.webRefresh).not.toHaveBeenCalled();
  });

  it('updates the navbar without a full reload when the AuthStorage context changes after settle', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<PublicNavigation />);
    await waitFor(() => expect(screen.getByRole('link', { name: 'Đăng nhập' })).toBeDefined());
    AuthStorage.accept(context({ fullName: 'Fresh Context' }), false);
    await waitFor(() => expect(screen.getByText('Fresh Context')).toBeDefined());
    expect(screen.queryByRole('link', { name: 'Đăng nhập' })).toBeNull();
    AuthStorage.clear();
    await waitFor(() => expect(screen.getByRole('link', { name: 'Đăng nhập' })).toBeDefined());
  });

  it('does not authenticate from legacy tripmate_access_token or Firebase state', async () => {
    localStorage.setItem('tripmate_access_token', 'legacy-token');
    localStorage.setItem('tripmate_user', JSON.stringify({ fullName: 'Legacy User', email: 'legacy@example.com' }));
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<PublicNavigation />);
    await waitFor(() => expect(screen.getByRole('link', { name: 'Đăng nhập' })).toBeDefined());
    expect(screen.queryByText('Legacy User')).toBeNull();
  });
});

describe('PublicNavigation Partner item by role (BR6 product decision)', () => {
  beforeEach(() => {
    AuthStorage.clear();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('keeps the generic Partner link to guest registration once settled unauthenticated', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<PublicNavigation />);
    await waitFor(() => expect(screen.getByRole('link', { name: 'Dành cho Đối tác' })).toBeDefined());
    expect(screen.getByRole('link', { name: 'Dành cho Đối tác' }).getAttribute('href')).toBe('/partner/register');
    expect(screen.queryByRole('link', { name: 'Become a Tour Operator' })).toBeNull();
  });

  it('shows neither the Partner item nor an operator-registration CTA for an authenticated Traveler', () => {
    AuthStorage.accept(context(), false);
    render(<PublicNavigation />);
    expect(screen.queryByRole('link', { name: 'Dành cho Đối tác' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Become a Tour Operator' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Register Tour Operator account' })).toBeNull();
  });

  it.each([
    ['Approved', '/partner'],
    ['PendingApproval', '/partner/application'],
    ['Rejected', '/partner/application'],
  ])('routes the Partner item for a TourOperator %s context to its own destination', (applicationStatus, href) => {
    AuthStorage.accept(context({ role: 'TourOperator', fullName: 'Operator', applicationStatus }), false);
    render(<PublicNavigation />);
    expect(screen.getByRole('link', { name: 'Dành cho Đối tác' }).getAttribute('href')).toBe(href);
    expect(screen.queryByRole('link', { name: 'Become a Tour Operator' })).toBeNull();
  });

  it('keeps an unresolved TourOperator authenticated and points Partner at the application projection', () => {
    AuthStorage.accept(context({ role: 'TourOperator', fullName: 'Operator', applicationStatus: null }), false);
    render(<PublicNavigation />);
    expect(screen.getByRole('link', { name: 'Dành cho Đối tác' }).getAttribute('href')).toBe('/partner/application');
    expect(screen.queryByRole('link', { name: 'Become a Tour Operator' })).toBeNull();
  });

  it('does not expose the Partner registration entry to an authenticated Administrator', () => {
    AuthStorage.accept(context({ role: 'Administrator', fullName: 'Admin' }), false);
    render(<PublicNavigation />);
    expect(screen.queryByRole('link', { name: 'Dành cho Đối tác' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Become a Tour Operator' })).toBeNull();
  });
});
