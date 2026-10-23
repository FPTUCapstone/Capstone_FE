import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  useWebSession: vi.fn(),
  getTravelerProfile: vi.fn(),
  execute: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace, back: vi.fn() }),
}));

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: mocks.useWebSession,
}));

vi.mock('@/features/account/profile/travelerProfileApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/account/profile/travelerProfileApi')>()),
  getTravelerProfile: mocks.getTravelerProfile,
}));

vi.mock('@/features/account/security/webChangePasswordCapability', () => ({
  createWebChangePasswordCapability: () => ({ status: 'available', execute: mocks.execute }),
}));

import AccountSecurityPage, { metadata } from './page';

describe('/account/security production route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    mocks.getTravelerProfile.mockResolvedValue({
      userId: 1,
      fullName: 'Nguyen Van A',
      email: 'traveler@tripmate.vn',
      phoneNumber: null,
      dateOfBirth: null,
      avatarUrl: null,
    });
    mocks.execute.mockResolvedValue(undefined);
    mocks.useWebSession.mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 1,
        email: 'traveler@tripmate.vn',
        fullName: 'Nguyen Van A',
        role: 'Traveler',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'mock-token',
        accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
      },
    });
  });

  it('exports appropriate metadata', () => {
    expect(metadata.title).toBe('Đổi mật khẩu | TripMate');
  });

  it('renders the authenticated page with the production capability available', () => {
    render(<AccountSecurityPage />);

    expect(screen.getByRole('heading', { name: 'Đổi mật khẩu' })).toBeDefined();
    expect(screen.getAllByText('Nguyen Van A').length).toBe(2);
    expect(screen.getByLabelText('Mật khẩu hiện tại')).toBeDefined();
    expect(screen.getByLabelText('Mật khẩu mới')).toBeDefined();
    expect(screen.getByLabelText('Xác nhận mật khẩu mới')).toBeDefined();
    expect(screen.getByRole('tab', { name: /Personal Profile/ })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Travel Preferences/ })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Security & Password/ })).toBeDefined();
    expect(screen.getByRole('tab', { name: /My Trips/ })).toBeDefined();
    expect(screen.queryByText('Tính năng đổi mật khẩu đang chờ tích hợp máy chủ.')).toBeNull();
    expect(
      (screen.getByRole('button', { name: 'Đổi mật khẩu' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it('submits a valid form through the injected production capability', async () => {
    const { container } = render(<AccountSecurityPage />);

    fireEvent.change(screen.getByLabelText('Mật khẩu hiện tại'), {
      target: { value: 'CurrentPass123!' },
    });
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), {
      target: { value: 'NewSecurePass456@' },
    });
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu mới'), {
      target: { value: 'NewSecurePass456@' },
    });
    fireEvent.submit(container.querySelector('form')!);

    await vi.waitFor(() => {
      expect(mocks.execute).toHaveBeenCalledWith({
        currentPassword: 'CurrentPass123!',
        newPassword: 'NewSecurePass456@',
        confirmPassword: 'NewSecurePass456@',
      });
    });
  });

  it('uses the same production capability for an authenticated Tour Operator', () => {
    mocks.useWebSession.mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 2,
        email: 'operator@tripmate.vn',
        fullName: 'TripMate Operator',
        role: 'TourOperator',
        status: 'Active',
        applicationStatus: 'Approved',
        applicationUnresolved: false,
        accessToken: 'mock-operator-token',
        accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
      },
    });

    render(<AccountSecurityPage />);

    expect(screen.getByText('TourOperator')).toBeDefined();
    expect(
      (screen.getByRole('button', { name: 'Đổi mật khẩu' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it('redirects an unauthenticated user to sign in with the return URL', () => {
    mocks.useWebSession.mockReturnValue({ status: 'unauthenticated', context: null });

    const { container } = render(<AccountSecurityPage />);

    expect(container.firstChild).toBeNull();
    expect(mocks.replace).toHaveBeenCalledWith('/sign-in?returnUrl=%2Faccount%2Fsecurity');
  });

  it('redirects an authenticated Administrator to the admin account security route without rendering the public form', () => {
    mocks.useWebSession.mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 99,
        email: 'admin@tripmate.vn',
        fullName: 'Admin User',
        role: 'Administrator',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'admin-token',
        accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
      },
    });

    const { container } = render(<AccountSecurityPage />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Đổi mật khẩu' })).toBeNull();
    expect(mocks.replace).toHaveBeenCalledWith('/admin/account/security');
  });
});
