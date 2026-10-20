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
  usePathname: () => '/',
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
    render(<PublicNavigation />);
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
    render(<PublicNavigation />);
    await waitFor(() => expect(screen.getByText('Restored Traveler')).toBeDefined());
    expect(screen.queryByRole('link', { name: publicNavigationEn.account.signIn })).toBeNull();
    expect(screen.getByRole('button', { name: /Log out/i })).toBeDefined();
  });

  it('restores an authenticated Administrator with no Partner entry', async () => {
    mocks.webRefresh.mockImplementation(async () => AuthStorage.accept(context({ role: 'Administrator', fullName: 'Restored Admin' }), false));
    render(<PublicNavigation />);
    await waitFor(() => expect(screen.getByText('Restored Admin')).toBeDefined());
    expect(screen.queryByRole('link', { name: publicNavigationEn.links.forPartners })).toBeNull();
  });

  it.each([
    ['Approved', '/partner'],
    ['PendingApproval', '/partner/application'],
    ['Rejected', '/partner/application'],
  ])('restores a TourOperator %s and routes Partner to %s', async (applicationStatus, href) => {
    mocks.webRefresh.mockImplementation(async () => AuthStorage.accept(context({ role: 'TourOperator', fullName: 'Restored Operator', applicationStatus }), false));
    render(<PublicNavigation />);
    await waitFor(() => expect(screen.getByRole('link', { name: publicNavigationEn.links.forPartners })).toBeDefined());
    expect(screen.getByRole('link', { name: publicNavigationEn.links.forPartners }).getAttribute('href')).toBe(href);
  });

  it('preserves an unresolved TourOperator as the fail-closed application projection, not Approved', async () => {
    mocks.webRefresh.mockImplementation(async () => AuthStorage.accept(context({ role: 'TourOperator', fullName: 'Restored Operator', applicationStatus: null }), false));
    render(<PublicNavigation />);
    await waitFor(() => expect(screen.getByRole('link', { name: publicNavigationEn.links.forPartners })).toBeDefined());
    expect(screen.getByRole('link', { name: publicNavigationEn.links.forPartners }).getAttribute('href')).toBe('/partner/application');
  });

  it('settles unauthenticated when the refresh cookie is invalid (401)', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<PublicNavigation />);
    await waitFor(() => expect(screen.getByRole('link', { name: publicNavigationEn.account.signIn })).toBeDefined());
    expect(screen.queryByRole('status')).toBeNull();
    expect(AuthStorage.getContext()).toBeNull();
  });

  it('settles unauthenticated when there is no refresh cookie, exposing guest registration', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<PublicNavigation />);
    await waitFor(() => expect(screen.getByRole('link', { name: publicNavigationEn.links.forPartners })).toBeDefined());
    expect(screen.getByRole('link', { name: publicNavigationEn.links.forPartners }).getAttribute('href')).toBe('/partner/register');
    expect(screen.getByRole('link', { name: publicNavigationEn.account.register })).toBeDefined();
  });

  it('does not call webRefresh when a valid in-memory context already exists', () => {
    AuthStorage.accept(context({ fullName: 'Warm Context' }), false);
    render(<PublicNavigation />);
    expect(screen.getByText('Warm Context')).toBeDefined();
    expect(mocks.webRefresh).not.toHaveBeenCalled();
  });

  it('shows the saved Traveler avatar in the account menu after loading the profile', async () => {
    AuthStorage.accept(context(), false);
    vi.mocked(getTravelerProfile).mockResolvedValue({
      userId: 42, fullName: 'Test Traveler', email: 'traveler@example.com',
      phoneNumber: null, dateOfBirth: null, avatarUrl: 'https://res.cloudinary.com/test/avatar.png',
    });
    render(<PublicNavigation />);
    const accountLink = screen.getByRole('link', { name: publicNavigationEn.account.profileAria });
    await waitFor(() => expect(accountLink.querySelector('img')?.getAttribute('src'))
      .toBe('https://res.cloudinary.com/test/avatar.png'));
  });

  it('updates the account menu immediately after a successful profile save', async () => {
    AuthStorage.accept(context(), false);
    render(<PublicNavigation />);
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
    render(<PublicNavigation />);
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
    render(<PublicNavigation />);
    expect(screen.getByText('Warm Context')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Log out/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Log out/i }));
    await waitFor(() => expect(screen.getByRole('link', { name: publicNavigationEn.account.signIn })).toBeDefined());
    expect(screen.queryByRole('status')).toBeNull();
    expect(mocks.webRefresh).not.toHaveBeenCalled();
  });

  it('updates the navbar without a full reload when the AuthStorage context changes after settle', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<PublicNavigation />);
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
    render(<PublicNavigation />);
    await waitFor(() => expect(screen.getByRole('link', { name: publicNavigationEn.account.signIn })).toBeDefined());
    expect(screen.queryByText('Legacy User')).toBeNull();
  });
});

describe('PublicNavigation Partner item by role (BR6 product decision)', () => {
  beforeEach(() => {
    AuthStorage.clear();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('keeps the public POI discovery entry after the navigation redesign', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });

    render(<PublicNavigation />);

    const explore = await screen.findByRole('link', { name: publicNavigationEn.links.explore });
    expect(explore.getAttribute('href')).toBe('/pois');
  });

  it('keeps the generic Partner link to guest registration once settled unauthenticated', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    render(<PublicNavigation />);
    await waitFor(() => expect(screen.getByRole('link', { name: publicNavigationEn.links.forPartners })).toBeDefined());
    expect(screen.getByRole('link', { name: publicNavigationEn.links.forPartners }).getAttribute('href')).toBe('/partner/register');
    expect(screen.queryByRole('link', { name: 'Become a Tour Operator' })).toBeNull();
  });

  it('shows neither the Partner item nor an operator-registration CTA for an authenticated Traveler', () => {
    AuthStorage.accept(context(), false);
    render(<PublicNavigation />);
    expect(screen.queryByRole('link', { name: publicNavigationEn.links.forPartners })).toBeNull();
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
    expect(screen.getByRole('link', { name: publicNavigationEn.links.forPartners }).getAttribute('href')).toBe(href);
    expect(screen.queryByRole('link', { name: 'Become a Tour Operator' })).toBeNull();
  });

  it('keeps an unresolved TourOperator authenticated and points Partner at the application projection', () => {
    AuthStorage.accept(context({ role: 'TourOperator', fullName: 'Operator', applicationStatus: null }), false);
    render(<PublicNavigation />);
    expect(screen.getByRole('link', { name: publicNavigationEn.links.forPartners }).getAttribute('href')).toBe('/partner/application');
    expect(screen.queryByRole('link', { name: 'Become a Tour Operator' })).toBeNull();
  });

  it('does not expose the Partner registration entry to an authenticated Administrator', () => {
    AuthStorage.accept(context({ role: 'Administrator', fullName: 'Admin' }), false);
    render(<PublicNavigation />);
    expect(screen.queryByRole('link', { name: publicNavigationEn.links.forPartners })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Become a Tour Operator' })).toBeNull();
  });
});

describe('PublicNavigation Vietnamese localization & Mobile Drawer', () => {
  beforeEach(() => {
    AuthStorage.clear();
    localStorage.clear();
    sessionStorage.clear();
    mocks.webRefresh.mockResolvedValue(null);
  });

  it('renders Vietnamese navigation links when locale="vi"', async () => {
    render(<PublicNavigation locale="vi" />);
    expect(screen.getByRole('link', { name: 'Điểm đến' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Lập lịch trình' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Tour du lịch' })).toBeDefined();
  });

  it('opens and closes mobile navigation drawer with accessible triggers and escape key', async () => {
    render(<PublicNavigation locale="vi" />);
    const openBtn = screen.getByRole('button', { name: 'Mở menu điều hướng' });
    expect(openBtn.getAttribute('aria-expanded')).toBe('false');

    // Open drawer
    fireEvent.click(openBtn);
    expect(openBtn.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeDefined();

    // Close with close button
    const closeBtn = screen.getByRole('button', { name: 'Đóng menu' });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).toBeNull();

    // Open again and close with Escape key
    fireEvent.click(openBtn);
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeDefined();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders sliding pill indicator and updates active selection on click and hover', async () => {
    render(<PublicNavigation locale="vi" isLanding={true} />);

    // Sliding pill indicator is present
    const pill = screen.getByTestId('nav-sliding-pill');
    expect(pill).toBeDefined();

    // Hover pill indicator is also present
    const hoverPill = screen.getByTestId('nav-hover-pill');
    expect(hoverPill).toBeDefined();

    const planLink = screen.getByRole('link', { name: 'Lập lịch trình' });
    const poisLink = screen.getByRole('link', { name: 'Điểm đến' });

    // Initial landing state has no capsule tab active
    expect(poisLink.getAttribute('aria-current')).toBeNull();
    expect(planLink.getAttribute('aria-current')).toBeNull();

    // Click on plan updates selected key
    const preventNav = (e: MouseEvent) => e.preventDefault();
    planLink.addEventListener('click', preventNav, { once: true });
    fireEvent.click(planLink);
    expect(planLink.getAttribute('aria-current')).toBe('page');
    expect(planLink.className).toContain('text-[#005F56]');
    expect(poisLink.getAttribute('aria-current')).toBeNull();

    // Hovering over pois triggers dim hover state, but does NOT steal active selection
    fireEvent.mouseEnter(poisLink);
    expect(poisLink.className).toContain('text-[#121E28]');
    expect(planLink.getAttribute('aria-current')).toBe('page');
    expect(planLink.className).toContain('text-[#005F56]');

    // Leaving nav restores clean selected state
    const nav = planLink.closest('nav');
    if (nav) {
      fireEvent.mouseLeave(nav);
    }
    expect(planLink.getAttribute('aria-current')).toBe('page');
    expect(planLink.className).toContain('text-[#005F56]');
  });
});
