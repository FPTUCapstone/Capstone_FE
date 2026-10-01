import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateSchedulingRequestPage } from '../components/CreateSchedulingRequestPage';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: mocks.replace,
  }),
}));

const mockUseWebSession = vi.fn();

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => mockUseWebSession(),
}));

vi.mock('@/components/navigation/PublicNavigation', () => ({
  PublicNavigation: () => <nav data-testid="public-navigation">Public Navigation</nav>,
}));

vi.mock('../components/CreateSchedulingRequestForm', () => ({
  CreateSchedulingRequestForm: ({ userId }: { userId?: string | number | null }) => (
    <div data-testid="scheduling-form">Form for user {userId}</div>
  ),
}));

describe('CreateSchedulingRequestPage (/plan - UC-10)', () => {
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

  afterEach(() => {
    cleanup();
  });

  it('renders page layout for authenticated Traveler', () => {
    render(<CreateSchedulingRequestPage />);

    expect(screen.getByTestId('public-navigation')).toBeDefined();
    expect(screen.getByText('Lập lịch trình thông minh')).toBeDefined();
    expect(
      screen.getByRole('heading', { name: /Lập Lịch Trình Du Lịch Tối Ưu/i, level: 1 }),
    ).toBeDefined();
    expect(screen.getByTestId('scheduling-form')).toBeDefined();
  });

  it('renders restoring indicator while session is restoring', () => {
    mockUseWebSession.mockReturnValue({
      status: 'restoring',
      context: null,
    });

    render(<CreateSchedulingRequestPage />);
    expect(screen.getByText('Đang tải kế hoạch du lịch…')).toBeDefined();
  });

  it('redirects unauthenticated user to sign in with returnUrl', () => {
    mockUseWebSession.mockReturnValue({
      status: 'unauthenticated',
      context: null,
    });

    render(<CreateSchedulingRequestPage />);
    expect(mocks.replace).toHaveBeenCalledWith('/sign-in?returnUrl=%2Fplan');
  });

  it('redirects TourOperator to partner dashboard without rendering planner', () => {
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

    const { container } = render(<CreateSchedulingRequestPage />);
    expect(container.firstChild).toBeNull();
    expect(mocks.replace).toHaveBeenCalledWith('/partner');
  });

  it('redirects Administrator to admin dashboard without rendering planner', () => {
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

    const { container } = render(<CreateSchedulingRequestPage />);
    expect(container.firstChild).toBeNull();
    expect(mocks.replace).toHaveBeenCalledWith('/admin');
  });
});
