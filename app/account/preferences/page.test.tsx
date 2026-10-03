import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: mocks.replace,
    back: mocks.back,
  }),
}));

const mockUseWebSession = vi.fn();

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => mockUseWebSession(),
}));

vi.mock('@/features/account/preferences/travelPreferencesApi', () => ({
  getTravelPreferences: vi.fn().mockResolvedValue({
    interests: ['culture', 'nature', 'food'],
    travelStyle: 'couple',
    budgetLevel: 'standard',
    preferredTransport: 'motorbike',
    travelPace: 'balanced',
    foodPreference: 'noRestriction',
    autoApplyToPlans: true,
  }),
  updateTravelPreferences: vi.fn(),
  resetTravelPreferences: vi.fn(),
}));

import AccountPreferencesPage, { metadata } from './page';

describe('/account/preferences production route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWebSession.mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 1,
        email: 'traveler@tripmate.vn',
        fullName: 'Nguyen Van A',
        role: 'Traveler',
        status: 'Active',
        accessToken: 'mock-token',
      },
    });
  });

  it('exports appropriate metadata', () => {
    expect(metadata.title).toBe('Sở thích du lịch | TripMate');
  });

  it('renders the travel preferences page for authenticated traveler', async () => {
    render(<AccountPreferencesPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Sở thích du lịch \(UC-09\)/ })).toBeDefined();
    });

    expect(screen.getByRole('tab', { name: /Hồ sơ cá nhân/ })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Sở thích du lịch/ })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Bảo mật & Mật khẩu/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Lưu sở thích/ })).toBeDefined();
  });

  it('redirects unauthenticated user to sign in with returnUrl', () => {
    mockUseWebSession.mockReturnValue({
      status: 'unauthenticated',
      context: null,
    });

    render(<AccountPreferencesPage />);
    expect(mocks.replace).toHaveBeenCalledWith('/sign-in?returnUrl=%2Faccount%2Fpreferences');
  });

  it('redirects TourOperator to partner dashboard without rendering preferences', () => {
    mockUseWebSession.mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 2,
        email: 'operator@tripmate.vn',
        fullName: 'Operator User',
        role: 'TourOperator',
        status: 'Active',
        accessToken: 'operator-token',
      },
    });

    const { container } = render(<AccountPreferencesPage />);
    expect(container.firstChild).toBeNull();
    expect(mocks.replace).toHaveBeenCalledWith('/partner');
  });

  it('redirects Administrator to admin dashboard without rendering preferences', () => {
    mockUseWebSession.mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 3,
        email: 'admin@tripmate.vn',
        fullName: 'Admin User',
        role: 'Administrator',
        status: 'Active',
        accessToken: 'admin-token',
      },
    });

    const { container } = render(<AccountPreferencesPage />);
    expect(container.firstChild).toBeNull();
    expect(mocks.replace).toHaveBeenCalledWith('/admin');
  });
});
