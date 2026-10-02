import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useWebSession } from '@/features/auth/session/useWebSession';
import { TourBookingPage } from './TourBookingPage';

const mockReplace = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: vi.fn(),
}));

function setNodeEnv(val?: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = val;
}

describe('TourBookingPage (UC-27 Route & Role Guards)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('demo');
    mockSearchParams.delete('scheduleId');
  });

  it('redirects unauthenticated users to sign-in with returnUrl when demo is inactive', async () => {
    vi.mocked(useWebSession).mockReturnValue({
      status: 'unauthenticated',
      context: null,
    });

    render(<TourBookingPage id="9007199254740995" />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('/sign-in?returnUrl=%2Ftours%2F9007199254740995%2Fbook'),
      );
    });
  });

  it('renders 403 Forbidden screen when authenticated user is a TourOperator', async () => {
    vi.mocked(useWebSession).mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 2,
        email: 'operator@partner.vn',
        fullName: 'Đối Tác Tour',
        role: 'TourOperator',
        status: 'Active',
        applicationStatus: 'Approved',
        applicationUnresolved: false,
        accessToken: 'token',
        accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
      },
    });

    render(<TourBookingPage id="9007199254740995" />);

    await waitFor(() => {
      expect(screen.getByText('Tài khoản không thuộc phạm vi Đặt tour')).toBeTruthy();
      expect(screen.getAllByText(/TourOperator/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/chỉ dành riêng cho tài khoản Du khách/)).toBeTruthy();
    });
  });

  it('renders 403 Forbidden screen when authenticated user is an Administrator', async () => {
    vi.mocked(useWebSession).mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 99,
        email: 'admin@tripmate.vn',
        fullName: 'Admin Quản Trị',
        role: 'Administrator',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'token',
        accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
      },
    });

    render(<TourBookingPage id="9007199254740995" />);

    await waitFor(() => {
      expect(screen.getByText('Tài khoản không thuộc phạm vi Đặt tour')).toBeTruthy();
      expect(screen.getAllByText(/Administrator/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders booking form in demo mode when demo=1 is enabled in non-production', async () => {
    setNodeEnv('development');
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
    mockSearchParams.set('demo', '1');

    vi.mocked(useWebSession).mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 1,
        email: 'traveler@tripmate.vn',
        fullName: 'Nguyễn Minh Phúc',
        role: 'Traveler',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'token',
        accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
      },
    });

    render(<TourBookingPage id="9007199254740995" />);

    await waitFor(() => {
      expect(screen.getByText('Xác nhận đặt tour (UC-27)')).toBeTruthy();
      expect(
        screen.getAllByText(/Hành Trình Di Sản Phố Cổ Hội An/).length,
      ).toBeGreaterThanOrEqual(1);
    });
  });
});
