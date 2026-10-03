import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useWebSession } from '@/features/auth/session/useWebSession';
import { TravelerProfilePage } from '../TravelerProfilePage';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mocks.replace,
    push: mocks.push,
  }),
}));

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: vi.fn(),
}));

vi.mock('../travelerProfileApi', () => ({
  getTravelerProfile: vi.fn().mockResolvedValue({
    fullName: 'Test Traveler',
    email: 'traveler@tripmate.com',
    phoneNumber: '0901234567',
  }),
  updateTravelerProfile: vi.fn(),
}));

describe('TravelerProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects unauthenticated user to /sign-in with returnUrl', () => {
    vi.mocked(useWebSession).mockReturnValue({
      status: 'unauthenticated',
      context: null,
    });

    render(<TravelerProfilePage />);
    expect(mocks.replace).toHaveBeenCalledWith('/sign-in?returnUrl=%2Faccount%2Fprofile');
  });

  it('renders loading indicator while restoring session', () => {
    vi.mocked(useWebSession).mockReturnValue({
      status: 'restoring',
      context: null,
    });

    render(<TravelerProfilePage />);
    expect(screen.getByText('Đang tải thông tin tài khoản…')).toBeDefined();
  });

  it('renders workspace navigation tabs and profile form for authenticated user', async () => {
    vi.mocked(useWebSession).mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 1,
        email: 'traveler@tripmate.com',
        fullName: 'Test Traveler',
        role: 'Traveler',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'mock-token',
        accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(),
      },
    });

    render(<TravelerProfilePage />);

    expect(screen.getByText('Hồ sơ cá nhân')).toBeDefined();
    expect(screen.getByText('Sở thích du lịch')).toBeDefined();
    expect(screen.getByText('Bảo mật & Mật khẩu')).toBeDefined();
  });

  it('redirects an authenticated Tour Operator to partner dashboard without rendering traveler profile', () => {
    vi.mocked(useWebSession).mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 2,
        email: 'operator@tripmate.com',
        fullName: 'Test Operator',
        role: 'TourOperator',
        status: 'Active',
        applicationStatus: 'Approved',
        applicationUnresolved: false,
        accessToken: 'operator-token',
        accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(),
      },
    });

    const { container } = render(<TravelerProfilePage />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Thông tin cá nhân' })).toBeNull();
    expect(mocks.replace).toHaveBeenCalledWith('/partner');
  });

  it('redirects an authenticated Administrator to admin dashboard without rendering traveler profile', () => {
    vi.mocked(useWebSession).mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 99,
        email: 'admin@tripmate.com',
        fullName: 'Admin User',
        role: 'Administrator',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'admin-token',
        accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(),
      },
    });

    const { container } = render(<TravelerProfilePage />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Thông tin cá nhân' })).toBeNull();
    expect(mocks.replace).toHaveBeenCalledWith('/admin');
  });
});
