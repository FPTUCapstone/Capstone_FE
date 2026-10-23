import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStorage, type WebAuthContext } from '@/features/auth/session/authSession';
import { OPERATOR_BOOKING_MESSAGES } from '@/features/operator/bookings/types/bookingLifecycle';
import OperatorBookingsPage from './page';

let mockSearchParams = new URLSearchParams('');

const mocks = vi.hoisted(() => ({
  webRefresh: vi.fn(),
}));

vi.mock('@/lib/authApi', () => ({
  webRefresh: mocks.webRefresh,
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

function seedOperatorSession(userId = 101) {
  AuthStorage.accept(
    {
      userId,
      email: `operator${userId}@example.com`,
      fullName: `Operator ${userId}`,
      role: 'TourOperator',
      status: 'Active',
      applicationStatus: 'Approved',
      applicationUnresolved: false,
      accessToken: 'test-operator-token',
      accessTokenExpiresAtUtc: new Date(Date.now() + 3600_000).toISOString(),
    } as unknown as WebAuthContext,
    false
  );
}

describe('OperatorBookingsPage (/partner/bookings)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      NEXT_PUBLIC_ENABLE_DEMO_FIXTURES: 'true',
    };
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    mockSearchParams = new URLSearchParams('');
    seedOperatorSession(101);
  });

  afterEach(() => {
    cleanup();
    AuthStorage.clear();
    localStorage.clear();
    sessionStorage.clear();
    process.env = originalEnv;
  });

  it('renders booking management workspace in production NO_BACKEND mode by default', async () => {
    mockSearchParams = new URLSearchParams('');
    render(<OperatorBookingsPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Customer Booking Management/i })
      ).toBeDefined();
      expect(
        screen.getByText(OPERATOR_BOOKING_MESSAGES.PENDING_BE_INTEGRATION)
      ).toBeDefined();
    });
  });

  it('renders demo workspace for signed-in operator 101 when ?demo=1 query parameter is provided', async () => {
    mockSearchParams = new URLSearchParams('demo=1');
    render(<OperatorBookingsPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Customer Booking Management/i })
      ).toBeDefined();
      expect(screen.getByText(/Demo Preview Mode/i)).toBeDefined();
      expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      expect(screen.queryByText('BK-20260925-9999')).toBeNull();
    });
  });

  it('fails closed with MSG126 when ?demo=1 is accessed without a valid operator session', async () => {
    AuthStorage.clear();
    mockSearchParams = new URLSearchParams('demo=1');
    render(<OperatorBookingsPage />);

    await waitFor(() => {
      expect(screen.getByText(OPERATOR_BOOKING_MESSAGES.MSG126)).toBeDefined();
    });
    expect(screen.queryByText('BK-20260919-0141')).toBeNull();
  });
});
