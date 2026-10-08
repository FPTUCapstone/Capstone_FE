import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStorage, type WebAuthContext } from '@/features/auth/session/authSession';

const mocks = vi.hoisted(() => ({
  webRefresh: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('@/lib/authApi', () => ({
  webRefresh: mocks.webRefresh,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: mocks.replace,
  }),
}));

const { CouponRouteGuard } = await import('./CouponRouteGuard');

const acceptSession = (overrides: Record<string, unknown> = {}): WebAuthContext =>
  AuthStorage.accept(
    {
      userId: 101,
      email: 'operator@tripmate.vn',
      fullName: 'Tour Operator',
      role: 'TourOperator',
      status: 'Active',
      applicationStatus: 'Approved',
      applicationUnresolved: false,
      accessToken: 'test-access',
      accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(),
      ...overrides,
    } as unknown as WebAuthContext,
    false
  );

function GuardedCouponContent({ label = 'Protected Coupon Workspace' }: { label?: string }) {
  return (
    <CouponRouteGuard>
      <div data-testid="protected-coupon-content">{label}</div>
    </CouponRouteGuard>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  AuthStorage.clear();
  localStorage.clear();
  sessionStorage.clear();
});

describe('CouponRouteGuard (BR-07 Access Boundary for UC-38/39)', () => {
  it('renders loading skeleton and does not flash content while session is restoring', async () => {
    let settleRefresh!: () => void;
    const gate = new Promise<void>((resolve) => {
      settleRefresh = resolve;
    });
    mocks.webRefresh.mockImplementation(async () => {
      await gate;
      return acceptSession({ role: 'TourOperator', applicationStatus: 'Approved' });
    });

    render(<GuardedCouponContent />);

    expect(screen.queryByTestId('protected-coupon-content')).toBeNull();
    expect(screen.getByRole('status')).toBeDefined();
    expect(mocks.replace).not.toHaveBeenCalled();

    settleRefresh();
    await waitFor(() => {
      expect(screen.getByTestId('protected-coupon-content')).toBeDefined();
    });
  });

  it('redirects unauthenticated guest to sign-in and blocks access', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });

    render(<GuardedCouponContent />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/sign-in');
    });
    expect(screen.queryByTestId('protected-coupon-content')).toBeNull();
  });

  it('redirects Traveler to home and blocks access', async () => {
    acceptSession({ role: 'Traveler', applicationStatus: null });

    render(<GuardedCouponContent />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/');
    });
    expect(screen.queryByTestId('protected-coupon-content')).toBeNull();
  });

  it('redirects Administrator to admin dashboard and blocks access', async () => {
    acceptSession({ role: 'Administrator', applicationStatus: null });

    render(<GuardedCouponContent />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/admin');
    });
    expect(screen.queryByTestId('protected-coupon-content')).toBeNull();
  });

  it('redirects TourOperator with PendingApproval to partner application status', async () => {
    acceptSession({
      role: 'TourOperator',
      status: 'Active',
      applicationStatus: 'PendingApproval',
    });

    render(<GuardedCouponContent />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/partner/application');
    });
    expect(screen.queryByTestId('protected-coupon-content')).toBeNull();
  });

  it('redirects TourOperator with Rejected to partner application status', async () => {
    acceptSession({
      role: 'TourOperator',
      status: 'Active',
      applicationStatus: 'Rejected',
    });

    render(<GuardedCouponContent />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/partner/application');
    });
    expect(screen.queryByTestId('protected-coupon-content')).toBeNull();
  });

  it('redirects TourOperator with unresolved application state to partner application status', async () => {
    acceptSession({
      role: 'TourOperator',
      status: 'Active',
      applicationStatus: null,
      applicationUnresolved: true,
    });

    render(<GuardedCouponContent />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/partner/application');
    });
    expect(screen.queryByTestId('protected-coupon-content')).toBeNull();
  });

  it('allows active TourOperator with Approved application status', async () => {
    acceptSession({
      role: 'TourOperator',
      status: 'Active',
      applicationStatus: 'Approved',
      applicationUnresolved: false,
    });

    render(<GuardedCouponContent label="Coupon Management Workspace" />);

    await waitFor(() => {
      expect(screen.getByTestId('protected-coupon-content')).toBeDefined();
    });
    expect(screen.getByText('Coupon Management Workspace')).toBeDefined();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('fails closed when unauthenticated even if demo mode is requested', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });

    render(<GuardedCouponContent />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/sign-in');
    });
    expect(screen.queryByTestId('protected-coupon-content')).toBeNull();
  });

  it('fails closed for Traveler even if demo mode is requested', async () => {
    acceptSession({ role: 'Traveler', applicationStatus: null });

    render(<GuardedCouponContent />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/');
    });
    expect(screen.queryByTestId('protected-coupon-content')).toBeNull();
  });
});
