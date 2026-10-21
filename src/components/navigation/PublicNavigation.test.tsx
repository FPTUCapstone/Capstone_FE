import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStorage } from '@/features/auth/session/authSession';
import { announceTravelerProfileUpdated, getTravelerProfile } from '@/features/account/profile/travelerProfileApi';

const mocks = vi.hoisted(() => ({
  webRefresh: vi.fn(),
  webLogout: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mocks.replace,
    refresh: mocks.refresh,
  }),
}));

vi.mock('@/lib/authApi', () => ({
  webRefresh: mocks.webRefresh,
  webLogout: mocks.webLogout,
}));

vi.mock('@/features/account/profile/travelerProfileApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/account/profile/travelerProfileApi')>();
  return { ...actual, getTravelerProfile: vi.fn().mockRejectedValue(new Error('Unavailable')) };
});

const { PublicNavigation } = await import('./PublicNavigation');
const { publicNavigationEn } = await import('./resources/en');
const { publicNavigationVi } = await import('./resources/vi');

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
  vi.mocked(getTravelerProfile).mockReset().mockRejectedValue(new Error('Unavailable'));
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
    render(<PublicNavigation locale="en" />);
    // Empty in-memory context is NOT treated as Guest during restore.
    expect(screen.queryByRole('link', { name: publicNavigationEn.account.signIn })).toBeNull();
    expect(screen.queryByRole('button', { name: /Log out/i })).toBeNull();
    expect(screen.getByRole('status')).toBeDefined();
    expect(mocks.webRefresh).toHaveBeenCalledTimes(1);
    settleRefresh();
    await waitFor(() => expect(screen.getByText('Test Traveler')).toBeDefined());
  });

  it('restores an authenticated Traveler from a valid refresh cookie', async () => {
    mocks.webRefresh.mockImplementation(async () => AuthStorage.accept(context({ fullName: 'Restored Traveler' }), false));
    render(<PublicNavigation locale="en" />);
    await waitFor(() => expect(screen.getByText('Restored Traveler')).toBeDefined());
    expect(screen.queryByRole('link', { name: publicNavigationEn.account.signIn })).toBeNull();
    expect(screen.getByRole('button', { name: /Log out/i })).toBeDefined();
  });

  it('restores an authenticated Administrator with no Partner entry in primary nav', async () => {
    mocks.webRefresh.mockImplementation(async () => AuthStorage.accept(context({ role: 'Administrator', fullName: 'Restored Admin' }), false));
    render(<PublicNavigation locale="en" />);
    await waitFor(() => expect(screen.getByText('Restored Admin')).toBeDefined());
    expect(screen.queryByRole('link', { name: publicNavigationEn.links.forPartners })).toBeNull();
    expect(screen.queryByRole('button', { name: publicNavigationEn.account.partnerMenuAria })).toBeNull();
  });

  it('restores an authenticated TourOperator and renders role-aware account dropdown, not nav link', async () => {
    mocks.webRefresh.mockImplementation(async () => AuthStorage.accept(context({ role: 'TourOperator', fullName: 'Restored Operator', applicationStatus: 'Approved' }), false));
    render(<PublicNavigation locale="en" />);
    await waitFor(() => expect(screen.getByText('Restored Operator')).toBeDefined());
    // Not in primary nav
    expect(screen.queryByRole('link', { name: publicNavigationEn.links.forPartners })).toBeNull();
    // Dropdown trigger is present
    const operatorButton = screen.getByRole('button', { name: publicNavigationEn.account.partnerMenuAria });
    expect(operatorButton).toBeDefined();
    expect(operatorButton.getAttribute('aria-expanded')).toBe('false');

    // Open dropdown
    fireEvent.click(operatorButton);
    expect(operatorButton.getAttribute('aria-expanded')).toBe('true');
    const menu = screen.getByRole('menu', { name: publicNavigationEn.account.partnerMenuAria });
    expect(within(menu).getByRole('menuitem', { name: new RegExp(publicNavigationEn.account.partnerWorkspace, 'i') }).getAttribute('href')).toBe('/partner');
    expect(within(menu).getByRole('menuitem', { name: new RegExp(publicNavigationEn.account.partnerProfile, 'i') }).getAttribute('href')).toBe('/partner/profile');
  });

  it('preserves an unresolved TourOperator as the fail-closed application projection in dropdown', async () => {
    mocks.webRefresh.mockImplementation(async () => AuthStorage.accept(context({ role: 'TourOperator', fullName: 'Restored Operator', applicationStatus: null }), false));
    render(<PublicNavigation locale="en" />);
    await waitFor(() => expect(screen.getByText('Restored Operator')).toBeDefined());
    const operatorButton = screen.getByRole('button', { name: publicNavigationEn.account.partnerMenuAria });
    fireEvent.click(operatorButton);
    const menu = screen.getByRole('menu', { name: publicNavigationEn.account.partnerMenuAria });
    expect(within(menu).getByRole('menuitem', { name: new RegExp(publicNavigationEn.account.partnerApplication, 'i') }).getAttribute('href')).toBe('/partner/application');
    expect(within(menu).queryByRole('menuitem', { name: new RegExp(publicNavigationEn.account.partnerWorkspace, 'i') })).toBeNull();
  });

  it('settles unauthenticated when the refresh cookie is invalid (401)', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<PublicNavigation locale="en" />);
    await waitFor(() => expect(screen.getByRole('link', { name: publicNavigationEn.account.signIn })).toBeDefined());
    expect(screen.queryByRole('status')).toBeNull();
    expect(AuthStorage.getContext()).toBeNull();
  });

  it('settles unauthenticated when there is no refresh cookie, exposing guest sign-in / register, without partner link in primary nav', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<PublicNavigation locale="en" />);
    await waitFor(() => expect(screen.getByRole('link', { name: publicNavigationEn.account.signIn })).toBeDefined());
    expect(screen.queryByRole('link', { name: publicNavigationEn.links.forPartners })).toBeNull();
    expect(screen.getByRole('link', { name: publicNavigationEn.account.register })).toBeDefined();
  });

  it('does not call webRefresh when a valid in-memory context already exists', () => {
    AuthStorage.accept(context({ fullName: 'Warm Context' }), false);
    render(<PublicNavigation locale="en" />);
    expect(screen.getByText('Warm Context')).toBeDefined();
    expect(mocks.webRefresh).not.toHaveBeenCalled();
  });

  it('shows the saved Traveler avatar in the account menu after loading the profile', async () => {
    AuthStorage.accept(context(), false);
    vi.mocked(getTravelerProfile).mockResolvedValue({
      userId: 42, fullName: 'Test Traveler', email: 'traveler@example.com',
      phoneNumber: null, dateOfBirth: null, avatarUrl: 'https://res.cloudinary.com/test/avatar.png',
    });
    render(<PublicNavigation locale="en" />);
    const accountLink = screen.getByRole('link', { name: publicNavigationEn.account.profileAria });
    await waitFor(() => expect(accountLink.querySelector('img')?.getAttribute('src'))
      .toBe('https://res.cloudinary.com/test/avatar.png'));
  });

  it('updates the account menu immediately after a successful profile save', async () => {
    AuthStorage.accept(context(), false);
    render(<PublicNavigation locale="en" />);
    announceTravelerProfileUpdated({
      userId: 42, fullName: 'Updated Traveler', email: 'traveler@example.com',
      phoneNumber: null, dateOfBirth: null, avatarUrl: 'https://res.cloudinary.com/test/new.png',
    });
    const accountLink = screen.getByRole('link', { name: publicNavigationEn.account.profileAria });
    await waitFor(() => expect(accountLink.querySelector('img')?.getAttribute('src'))
      .toBe('https://res.cloudinary.com/test/new.png'));
    expect(screen.getByText('Updated Traveler')).toBeDefined();
  });

  it('does not replace a newly saved avatar with a stale GET response', async () => {
    let finishLoad!: (profile: Awaited<ReturnType<typeof getTravelerProfile>>) => void;
    vi.mocked(getTravelerProfile).mockReturnValue(new Promise((resolve) => { finishLoad = resolve; }));
    AuthStorage.accept(context(), false);
    render(<PublicNavigation locale="en" />);
    announceTravelerProfileUpdated({
      userId: 42, fullName: 'Updated Traveler', email: 'traveler@example.com',
      phoneNumber: null, dateOfBirth: null, avatarUrl: 'https://res.cloudinary.com/test/new.png',
    });
    finishLoad({
      userId: 42, fullName: 'Old Traveler', email: 'traveler@example.com',
      phoneNumber: null, dateOfBirth: null, avatarUrl: 'https://res.cloudinary.com/test/old.png',
    });
    const accountLink = screen.getByRole('link', { name: publicNavigationEn.account.profileAria });
    await waitFor(() => expect(accountLink.querySelector('img')?.getAttribute('src'))
      .toBe('https://res.cloudinary.com/test/new.png'));
    expect(screen.queryByText('Old Traveler')).toBeNull();
  });

  it('settles back to Sign In (not stuck restoring) when a warm session signs out', async () => {
    AuthStorage.accept(context({ fullName: 'Warm Context' }), false);
    mocks.webLogout.mockImplementation(async () => {
      AuthStorage.clear();
    });
    render(<PublicNavigation locale="en" />);
    expect(screen.getByText('Warm Context')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Log out/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Log out/i }));
    await waitFor(() => expect(screen.getByRole('link', { name: publicNavigationEn.account.signIn })).toBeDefined());
    expect(screen.queryByRole('status')).toBeNull();
    expect(mocks.webRefresh).not.toHaveBeenCalled();
  });

  it('updates the navbar without a full reload when the AuthStorage context changes after settle', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<PublicNavigation locale="en" />);
    await waitFor(() => expect(screen.getByRole('link', { name: publicNavigationEn.account.signIn })).toBeDefined());
    AuthStorage.accept(context({ fullName: 'Fresh Context' }), false);
    await waitFor(() => expect(screen.getByText('Fresh Context')).toBeDefined());
    expect(screen.queryByRole('link', { name: publicNavigationEn.account.signIn })).toBeNull();
    AuthStorage.clear();
    await waitFor(() => expect(screen.getByRole('link', { name: publicNavigationEn.account.signIn })).toBeDefined());
  });

  it('does not authenticate from legacy tripmate_access_token or Firebase state', async () => {
    localStorage.setItem('tripmate_access_token', 'legacy-token');
    localStorage.setItem('tripmate_user', JSON.stringify({ fullName: 'Legacy User', email: 'legacy@example.com' }));
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<PublicNavigation locale="en" />);
    await waitFor(() => expect(screen.getByRole('link', { name: publicNavigationEn.account.signIn })).toBeDefined());
    expect(screen.queryByText('Legacy User')).toBeNull();
  });
});

describe('PublicNavigation Partner Navigation v2.0 & Role dropdowns', () => {
  beforeEach(() => {
    AuthStorage.clear();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('keeps public POI discovery entry after navigation redesign', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<PublicNavigation locale="en" />);
    const explore = await screen.findByRole('link', { name: publicNavigationEn.links.explore });
    expect(explore.getAttribute('href')).toBe('/pois');
  });

  it('does NOT render For Partners link in primary nav for unauthenticated guests', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<PublicNavigation locale="en" />);
    await waitFor(() => expect(screen.getByRole('link', { name: publicNavigationEn.account.signIn })).toBeDefined());
    expect(screen.queryByRole('link', { name: publicNavigationEn.links.forPartners })).toBeNull();
  });

  it('does NOT render For Partners link or operator menu for an authenticated Traveler', () => {
    AuthStorage.accept(context(), false);
    render(<PublicNavigation locale="en" />);
    expect(screen.queryByRole('link', { name: publicNavigationEn.links.forPartners })).toBeNull();
    expect(screen.queryByRole('button', { name: publicNavigationEn.account.partnerMenuAria })).toBeNull();
  });

  it('renders Approved Tour Operator dropdown with workspace, profile, and logout in English', () => {
    AuthStorage.accept(context({ role: 'TourOperator', fullName: 'Skyline Travel', applicationStatus: 'Approved' }), false);
    render(<PublicNavigation locale="en" />);
    expect(screen.queryByRole('link', { name: publicNavigationEn.links.forPartners })).toBeNull();

    const trigger = screen.getByRole('button', { name: publicNavigationEn.account.partnerMenuAria });
    expect(trigger).toBeDefined();
    expect(screen.getByText('Skyline Travel')).toBeDefined();

    // Open dropdown
    fireEvent.click(trigger);
    const menu = screen.getByRole('menu', { name: publicNavigationEn.account.partnerMenuAria });
    const workspaceLink = within(menu).getByRole('menuitem', { name: new RegExp(publicNavigationEn.account.partnerWorkspace, 'i') });
    expect(workspaceLink.getAttribute('href')).toBe('/partner');

    const profileLink = within(menu).getByRole('menuitem', { name: new RegExp(publicNavigationEn.account.partnerProfile, 'i') });
    expect(profileLink.getAttribute('href')).toBe('/partner/profile');

    const logoutBtn = within(menu).getByRole('menuitem', { name: new RegExp(publicNavigationEn.account.logOut, 'i') });
    expect(logoutBtn).toBeDefined();

    // Dismiss with Escape key
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu', { name: publicNavigationEn.account.partnerMenuAria })).toBeNull();
  });

  it('renders Vietnamese labels by default', () => {
    AuthStorage.accept(context({ role: 'TourOperator', fullName: 'Hoi An Eco', applicationStatus: 'Approved' }), false);
    render(<PublicNavigation />);

    const trigger = screen.getByRole('button', { name: publicNavigationVi.account.partnerMenuAria });
    expect(trigger).toBeDefined();

    fireEvent.click(trigger);
    const menu = screen.getByRole('menu', { name: publicNavigationVi.account.partnerMenuAria });
    expect(within(menu).getByRole('menuitem', { name: new RegExp(publicNavigationVi.account.partnerWorkspace, 'i') })).toBeDefined();
    expect(within(menu).getByRole('menuitem', { name: new RegExp(publicNavigationVi.account.partnerProfile, 'i') })).toBeDefined();
  });

  it.each([
    ['PendingApproval', '/partner/application'],
    ['Rejected', '/partner/application'],
  ])('renders %s Tour Operator dropdown with application projection and no workspace entry', (applicationStatus, href) => {
    AuthStorage.accept(context({ role: 'TourOperator', fullName: 'Coastal Tours', applicationStatus }), false);
    render(<PublicNavigation locale="en" />);
    const trigger = screen.getByRole('button', { name: publicNavigationEn.account.partnerMenuAria });
    fireEvent.click(trigger);
    const menu = screen.getByRole('menu', { name: publicNavigationEn.account.partnerMenuAria });
    const appLink = within(menu).getByRole('menuitem', { name: new RegExp(publicNavigationEn.account.partnerApplication, 'i') });
    expect(appLink.getAttribute('href')).toBe(href);
    expect(within(menu).queryByRole('menuitem', { name: new RegExp(publicNavigationEn.account.partnerWorkspace, 'i') })).toBeNull();
  });

  it('keeps an unresolved TourOperator fail-closed pointing to application projection', () => {
    AuthStorage.accept(context({ role: 'TourOperator', fullName: 'Pending Ops', applicationStatus: null }), false);
    render(<PublicNavigation locale="en" />);
    const trigger = screen.getByRole('button', { name: publicNavigationEn.account.partnerMenuAria });
    fireEvent.click(trigger);
    const menu = screen.getByRole('menu', { name: publicNavigationEn.account.partnerMenuAria });
    expect(within(menu).getByRole('menuitem', { name: new RegExp(publicNavigationEn.account.partnerApplication, 'i') }).getAttribute('href')).toBe('/partner/application');
    expect(within(menu).queryByRole('menuitem', { name: new RegExp(publicNavigationEn.account.partnerWorkspace, 'i') })).toBeNull();
  });

  it('does NOT expose Tour Operator dropdown to an authenticated Administrator', () => {
    AuthStorage.accept(context({ role: 'Administrator', fullName: 'Super Admin' }), false);
    render(<PublicNavigation locale="en" />);
    expect(screen.queryByRole('button', { name: publicNavigationEn.account.partnerMenuAria })).toBeNull();
    expect(screen.queryByRole('link', { name: publicNavigationEn.links.forPartners })).toBeNull();
    expect(screen.getByRole('link', { name: /Super Admin/i }).getAttribute('href')).toBe('/admin');
  });

  it('closes dropdown when clicking outside', () => {
    AuthStorage.accept(context({ role: 'TourOperator', fullName: 'Skyline Travel', applicationStatus: 'Approved' }), false);
    render(
      <div>
        <div data-testid="outside-element">Outside</div>
        <PublicNavigation locale="en" />
      </div>
    );
    const trigger = screen.getByRole('button', { name: publicNavigationEn.account.partnerMenuAria });
    fireEvent.click(trigger);
    expect(screen.getByRole('menu', { name: publicNavigationEn.account.partnerMenuAria })).toBeDefined();

    fireEvent.mouseDown(screen.getByTestId('outside-element'));
    expect(screen.queryByRole('menu', { name: publicNavigationEn.account.partnerMenuAria })).toBeNull();
  });
});
