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

const { BookingRouteGuard } = await import('./BookingRouteGuard');

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

function GuardedContent({ label = 'Protected Booking Workspace' }: { label?: string }) {
  return (
    <BookingRouteGuard>
      <div data-testid="protected-content">{label}</div>
    </BookingRouteGuard>
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

describe('BookingRouteGuard (BR-07 Runtime Route Protection)', () => {
  it('renders loading skeleton and does not flash content while session is restoring', async () => {
    let settleRefresh!: () => void;
    const gate = new Promise<void>((resolve) => {
      settleRefresh = resolve;
    });
    mocks.webRefresh.mockImplementation(async () => {
      await gate;
      return acceptSession({ role: 'TourOperator', applicationStatus: 'Approved' });
    });

    render(<GuardedContent />);

    expect(screen.queryByTestId('protected-content')).toBeNull();
    expect(screen.getByRole('status')).toBeDefined();
    expect(mocks.replace).not.toHaveBeenCalled();

    settleRefresh();
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeDefined();
    });
  });

  it('A. redirects unauthenticated user to sign-in and does not render protected content', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });

    render(<GuardedContent />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/sign-in');
    });
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });

  it('B. redirects Traveler away to home', async () => {
    acceptSession({ role: 'Traveler', applicationStatus: null });

    render(<GuardedContent />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/');
    });
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });

  it('C. redirects Administrator away to admin dashboard', async () => {
    acceptSession({ role: 'Administrator', applicationStatus: null });

    render(<GuardedContent />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/admin');
    });
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });

  it('D. redirects TourOperator with PendingApproval to partner application status', async () => {
    acceptSession({
      role: 'TourOperator',
      status: 'Active',
      applicationStatus: 'PendingApproval',
    });

    render(<GuardedContent />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/partner/application');
    });
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });

  it('E. redirects TourOperator with Rejected to partner application status', async () => {
    acceptSession({
      role: 'TourOperator',
      status: 'Active',
      applicationStatus: 'Rejected',
    });

    render(<GuardedContent />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/partner/application');
    });
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });

  it('F. redirects TourOperator with unresolved application state to partner application status', async () => {
    acceptSession({
      role: 'TourOperator',
      status: 'Active',
      applicationStatus: null,
      applicationUnresolved: true,
    });

    render(<GuardedContent />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/partner/application');
    });
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });

  it('G. allows authenticated TourOperator with Active status and Approved application status', async () => {
    acceptSession({
      role: 'TourOperator',
      status: 'Active',
      applicationStatus: 'Approved',
      applicationUnresolved: false,
    });

    render(<GuardedContent label="Customer Bookings Workspace" />);

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeDefined();
    });
    expect(screen.getByText('Customer Bookings Workspace')).toBeDefined();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('H. fails closed when unauthenticated even if ?demo=1 query is present', async () => {
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });

    render(<GuardedContent />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/sign-in');
    });
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });

  it('I. fails closed for Traveler even if ?demo=1 query is present', async () => {
    acceptSession({ role: 'Traveler', applicationStatus: null });

    render(<GuardedContent />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/');
    });
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });
});
