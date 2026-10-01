import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  useWebSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace, back: vi.fn() }),
}));

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: mocks.useWebSession,
}));

import AccountSecurityPage, { metadata } from './page';

describe('/account/security production route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
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

  it('renders the authenticated page pending backend integration without a network request', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(<AccountSecurityPage />);

    expect(screen.getByRole('heading', { name: 'Đổi mật khẩu' })).toBeDefined();
    expect(screen.getAllByText('Nguyen Van A').length).toBe(2);
    expect(screen.getByText('Tính năng đổi mật khẩu đang chờ tích hợp máy chủ.')).toBeDefined();
    expect(
      (screen.getByRole('button', { name: 'Đổi mật khẩu' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    fireEvent.submit(container.querySelector('form')!);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses the same safe pending screen for an authenticated Tour Operator', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
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

    const { container } = render(<AccountSecurityPage />);

    expect(screen.getByText('TourOperator')).toBeDefined();
    expect(
      (screen.getByRole('button', { name: 'Đổi mật khẩu' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    fireEvent.submit(container.querySelector('form')!);
    expect(fetchMock).not.toHaveBeenCalled();
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
