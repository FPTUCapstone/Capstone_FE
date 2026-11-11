import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as useWebSessionModule from '@/features/auth/session/useWebSession';
import * as useSafePathnameModule from '@/lib/routes/useSafePathname';
import { AccountWorkspaceShell } from '../AccountWorkspaceShell';

const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

vi.mock('@/features/account/profile/travelerProfileApi', () => ({
  TRAVELER_PROFILE_UPDATED_EVENT: 'tripmate:traveler-profile-updated',
  getTravelerProfile: vi.fn().mockResolvedValue({
    userId: 10,
    fullName: 'Hoang Van Traveler',
    email: 'traveler@tripmate.vn',
    phoneNumber: '0912345678',
    avatarUrl: '/images/avatar.jpg',
  }),
}));

describe('AccountWorkspaceShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated user to sign in with returnUrl', () => {
    vi.spyOn(useWebSessionModule, 'useWebSession').mockReturnValue({
      status: 'unauthenticated',
      context: null,
    });
    vi.spyOn(useSafePathnameModule, 'useSafePathname').mockReturnValue('/account/profile');

    render(
      <AccountWorkspaceShell>
        <div>Child Content</div>
      </AccountWorkspaceShell>
    );

    expect(mockReplace).toHaveBeenCalledWith('/sign-in?returnUrl=%2Faccount%2Fprofile');
  });

  it('redirects TourOperator to partner dashboard', () => {
    vi.spyOn(useWebSessionModule, 'useWebSession').mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 1,
        email: 'operator@tripmate.vn',
        fullName: 'Operator',
        role: 'TourOperator',
        status: 'Active',
        applicationStatus: 'Approved',
        applicationUnresolved: false,
        accessToken: 'token',
        accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
      },
    });

    render(
      <AccountWorkspaceShell>
        <div>Child Content</div>
      </AccountWorkspaceShell>
    );

    expect(mockReplace).toHaveBeenCalledWith('/partner');
  });

  it('renders loading skeleton while session is restoring', () => {
    vi.spyOn(useWebSessionModule, 'useWebSession').mockReturnValue({
      status: 'restoring',
      context: null,
    });

    render(
      <AccountWorkspaceShell>
        <div>Child Content</div>
      </AccountWorkspaceShell>
    );

    expect(screen.getByRole('status', { name: 'Đang tải không gian tài khoản' })).toBeDefined();
  });

  it('renders Master-Detail workspace layout for authenticated Traveler', () => {
    vi.spyOn(useWebSessionModule, 'useWebSession').mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 10,
        email: 'traveler@tripmate.vn',
        fullName: 'Hoang Van Traveler',
        role: 'Traveler',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'token',
        accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
      },
    });
    vi.spyOn(useSafePathnameModule, 'useSafePathname').mockReturnValue('/account/profile');

    render(
      <AccountWorkspaceShell>
        <div data-testid="detail-content">Traveler Profile Form Content</div>
      </AccountWorkspaceShell>
    );

    expect(mockReplace).not.toHaveBeenCalled();

    // Check Traveler Identity Card elements
    expect(screen.getAllByText('Hoang Van Traveler').length).toBeGreaterThan(0);
    expect(screen.getAllByText('traveler@tripmate.vn').length).toBeGreaterThan(0);
    expect(screen.getByText('Du khách TripMate')).toBeDefined();

    // Check Breadcrumb
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeDefined();
    expect(screen.getByText('Trang chủ')).toBeDefined();
    expect(screen.getByText('Tài khoản cá nhân')).toBeDefined();

    // Check Side-Rail Navigation and AI Atlas Tip Box
    expect(screen.getByText('TripMate AI Atlas')).toBeDefined();
    expect(screen.getByTestId('detail-content')).toBeDefined();
  });

  it('renders review routes directly without the Master-Detail sidebar rail', () => {
    vi.spyOn(useWebSessionModule, 'useWebSession').mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 10,
        email: 'traveler@tripmate.vn',
        fullName: 'Hoang Van Traveler',
        role: 'Traveler',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'token',
        accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
      },
    });
    vi.spyOn(useSafePathnameModule, 'useSafePathname').mockReturnValue('/account/trips/101/review');

    render(
      <AccountWorkspaceShell>
        <div data-testid="review-form-content">Review Form</div>
      </AccountWorkspaceShell>
    );

    // Sidebar should NOT be rendered
    expect(screen.queryByText('TripMate AI Atlas')).toBeNull();
    expect(screen.queryByText('Du khách TripMate')).toBeNull();
    expect(screen.getByTestId('review-form-content')).toBeDefined();
  });

  it('renders UC-29 e-ticket routes directly without the Master-Detail sidebar rail', () => {
    vi.spyOn(useWebSessionModule, 'useWebSession').mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 10,
        email: 'traveler@tripmate.vn',
        fullName: 'Hoang Van Traveler',
        role: 'Traveler',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'token',
        accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
      },
    });
    vi.spyOn(useSafePathnameModule, 'useSafePathname').mockReturnValue('/account/tickets/77');

    render(
      <AccountWorkspaceShell>
        <div data-testid="ticket-content">E-ticket</div>
      </AccountWorkspaceShell>
    );

    // The ticket page has its own breadcrumb and print layout; no profile header or sidebar.
    expect(screen.queryByText('TripMate AI Atlas')).toBeNull();
    expect(screen.queryByText('Hồ sơ cá nhân')).toBeNull();
    expect(screen.getByTestId('ticket-content')).toBeDefined();
  });
});
