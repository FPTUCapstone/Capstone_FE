import { render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as useWebSessionModule from '@/features/auth/session/useWebSession';
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

describe('TripHistoryPage Access Control (TRIP-2, TRIP-3)', () => {
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

  it('Allows authenticated Traveler to render page', () => {
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
    expect(container.querySelector('h1')?.textContent).toContain('Chuyến đi của tôi');
  });
});
