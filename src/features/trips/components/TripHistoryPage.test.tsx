import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { publicNavigationEn } from '@/components/navigation/resources/en';
import { accountCommonEn } from '@/features/account/common/resources/en';
import * as useWebSessionModule from '@/features/auth/session/useWebSession';
import { ROUTES } from '@/lib/routes';
import { tripReviewEn } from '../resources/en';
import { TripHistoryPage } from './TripHistoryPage';

const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue('1'),
  }),
}));

describe('TripHistoryPage Access Control (TRIP-2, TRIP-3, CR-09)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TRIP-2: Redirects unauthenticated user to sign in with returnUrl', () => {
    vi.spyOn(useWebSessionModule, 'useWebSession').mockReturnValue({
      status: 'unauthenticated',
      context: null,
    });

    render(<TripHistoryPage />);

    expect(mockReplace).toHaveBeenCalledWith(
      '/sign-in?returnUrl=%2Faccount%2Ftrips'
    );
  });

  it('TRIP-3: Redirects TourOperator to partner dashboard', () => {
    vi.spyOn(useWebSessionModule, 'useWebSession').mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 1,
        email: 'operator@tripmate.vn',
        fullName: 'Operator One',
        role: 'TourOperator',
        status: 'Active',
        applicationStatus: 'Approved',
        applicationUnresolved: false,
        accessToken: 'token',
        accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
      },
    });

    render(<TripHistoryPage />);

    expect(mockReplace).toHaveBeenCalledWith('/partner');
  });

  it('TRIP-3: Redirects Administrator to admin dashboard', () => {
    vi.spyOn(useWebSessionModule, 'useWebSession').mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 2,
        email: 'admin@tripmate.vn',
        fullName: 'Admin User',
        role: 'Administrator',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'token',
        accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
      },
    });

    render(<TripHistoryPage />);

    expect(mockReplace).toHaveBeenCalledWith('/admin');
  });

  it('Allows authenticated Traveler to render page with English title and English shared navigation (CR-09)', () => {
    vi.spyOn(useWebSessionModule, 'useWebSession').mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 3,
        email: 'traveler@tripmate.vn',
        fullName: 'Traveler Test',
        role: 'Traveler',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'token',
        accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
      },
    });

    const { container } = render(<TripHistoryPage />);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(container.querySelector('h1')?.textContent).toContain(
      tripReviewEn.tripHistory.pageTitle
    );

    // PublicNavigation rendered in English
    expect(screen.getByRole('navigation', { name: publicNavigationEn.navAria })).toBeDefined();
    expect(screen.getByRole('link', { name: publicNavigationEn.links.explore })).toBeDefined();
    expect(screen.getByRole('link', { name: publicNavigationEn.links.destinations })).toBeDefined();
    expect(screen.getByRole('link', { name: publicNavigationEn.links.smartItinerary })).toBeDefined();
    expect(screen.getByRole('link', { name: publicNavigationEn.links.weatherRerouting })).toBeDefined();
    expect(screen.getByRole('link', { name: publicNavigationEn.links.localTours })).toBeDefined();

    // AccountWorkspaceNav rendered in English
    expect(
      screen.getByRole('navigation', { name: accountCommonEn.navigation.workspaceNavAria })
    ).toBeDefined();
    expect(screen.getByRole('tab', { name: /Personal Profile/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Travel Preferences/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Security & Password/i })).toBeDefined();
    expect(
      screen.getByRole('tab', { name: new RegExp(accountCommonEn.navigation.tabs.trips, 'i') })
    ).toBeDefined();
  });

  it('Preserves all partner and account route definitions after develop reconciliation', () => {
    expect(ROUTES.partner.profile).toBe('/partner/profile');
    expect(ROUTES.partner.bookings).toBe('/partner/bookings');
    expect(ROUTES.partner.createCoupon).toBe('/partner/coupons/create');
    expect(ROUTES.account.trips).toBe('/account/trips');
    expect(ROUTES.account.tripReview('trip-01')).toBe('/account/trips/trip-01/review');
  });
});
