import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorPayoutView } from './OperatorPayoutView';
import { resetDemoPayoutState } from '../../services/operatorPayoutService';

let mockSearchParams = new URLSearchParams('demo=1');
const mockRouterReplace = vi.fn();
const mockRouterPush = vi.fn();
// Next.js's real useRouter() returns a stable object across renders; this mock must too, or a
// dependency on `router` in a hook (as redirectToSignInIfExpired has) retriggers its effect on
// every render and loops forever.
const mockRouter = { push: mockRouterPush, replace: mockRouterReplace };

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => mockRouter,
}));

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => ({
    status: 'authenticated',
    context: {
      userId: 101,
      role: 'TourOperator',
      status: 'Active',
      applicationStatus: 'Approved',
      email: 'operator101@test.com',
    },
  }),
}));

// The UC-46 "Request Payout Settlement" sections (available balance, settlement months, payout
// request history, request/cancel dialogs) were removed along with that model
// (DAILY-PAYOUT-TRANSFER, SRS v11). This view is now the beneficiary bank account settings only.
describe('OperatorPayoutView (beneficiary bank account)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRouterReplace.mockClear();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      NEXT_PUBLIC_ENABLE_DEMO_FIXTURES: 'true',
    };
    mockSearchParams = new URLSearchParams('demo=1');
    resetDemoPayoutState();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('renders header, demo banner, and the bank card', async () => {
    render(<OperatorPayoutView />);

    expect(screen.getByRole('heading', { name: /Beneficiary Bank Account/i, level: 1 })).toBeDefined();
    expect(screen.getByText(/Demo Payout Mode Active/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText(/NGUYEN VAN AN/i)).toBeDefined();
    });
  });

  it('enforces BR-105: foreign operator data is isolated', async () => {
    vi.doMock('@/features/auth/session/useWebSession', () => ({
      useWebSession: () => ({
        status: 'authenticated',
        context: { userId: 202, role: 'TourOperator', status: 'Active', applicationStatus: 'Approved', email: 'operator202@test.com' },
      }),
    }));

    render(<OperatorPayoutView />);

    await waitFor(() => {
      expect(screen.queryByText(/LE THI MAI/i)).toBeDefined();
    });
  });

  it('edits and saves the bank account, showing a success toast', async () => {
    render(<OperatorPayoutView />);

    await waitFor(() => {
      expect(screen.getByText(/NGUYEN VAN AN/i)).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /Edit Bank Details/i }));
    fireEvent.change(screen.getByLabelText(/Bank Name/i), { target: { value: 'BIDV' } });
    fireEvent.change(screen.getByLabelText(/Account Holder/i), { target: { value: 'NGUYEN VAN AN TEST' } });
    fireEvent.change(screen.getByLabelText(/Account Number/i), { target: { value: '9988776655' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Bank Details/i }));

    expect(await screen.findByRole('status')).toBeDefined();
    expect(await screen.findByText(/successfully/i)).toBeDefined();
  });

  it('shows an error with Retry when the bank account fails to load, instead of a false empty state', async () => {
    mockSearchParams = new URLSearchParams('');
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    render(<OperatorPayoutView />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });
    expect(screen.getByRole('button', { name: /Retry/i })).toBeDefined();

    vi.unstubAllGlobals();
  });

  it('redirects to sign-in when the bank account load gets a 401 (expired session)', async () => {
    mockSearchParams = new URLSearchParams('');
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    render(<OperatorPayoutView />);

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/sign-in');
    });

    vi.unstubAllGlobals();
  });
});
