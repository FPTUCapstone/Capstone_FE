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

describe('OperatorPayoutView (UC-46)', () => {
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

  it('renders header, demo banner, settlement months, bank card, and history', async () => {
    render(<OperatorPayoutView />);

    expect(screen.getByRole('heading', { name: /Payout Settlement/i })).toBeDefined();
    expect(screen.getByText(/Demo Payout Mode Active/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Settlement Months/i })).toBeDefined();
      expect(screen.getByRole('heading', { name: /Beneficiary Bank Account/i })).toBeDefined();
      expect(screen.getByRole('heading', { name: /Payout Request History/i })).toBeDefined();
      expect(screen.getByText(/NGUYEN VAN AN/i)).toBeDefined();
    });
  });

  it('shows the available-to-withdraw summary aggregated across every unclaimed closed month', async () => {
    render(<OperatorPayoutView />);

    await waitFor(() => {
      expect(screen.getByText(/Available to withdraw/i)).toBeDefined();
      // July (3,600,000) + August (17,640,000) are both closed and unclaimed in the fixture.
      expect(screen.getByText(/21\.240\.000 ₫/i)).toBeDefined();
    });
  });

  it('opens the request dialog for the available balance and submits successfully', async () => {
    render(<OperatorPayoutView />);

    await waitFor(() => {
      expect(screen.getByText(/Available to withdraw/i)).toBeDefined();
    });

    const requestButton = screen.getByRole('button', { name: /Request Available Balance/i });
    expect(requestButton.hasAttribute('disabled')).toBe(false);
    fireEvent.click(requestButton);

    expect(await screen.findByRole('dialog')).toBeDefined();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Payout Request/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(await screen.findByRole('status')).toBeDefined();
  });

  it('shows September as still open (not part of the available balance) in the settlement table', async () => {
    render(<OperatorPayoutView />);

    await waitFor(() => {
      expect(screen.getByText(/September 2026/i)).toBeDefined();
    });

    const rows = screen.getAllByRole('row');
    const septemberRow = rows.find((row) => row.textContent?.includes('September 2026'));
    expect(septemberRow?.textContent).toMatch(/Still open/i);
  });

  it('shows a per-section error with Retry when a section fails to load, instead of a false empty state', async () => {
    mockSearchParams = new URLSearchParams('');
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    render(<OperatorPayoutView />);

    // Production mode (no ?demo=1): all four reads hit the BFF, which fails here. Each now throws
    // a PayoutLoadError that the view's own catch block turns into an error banner with Retry —
    // never a silently-empty table/balance/bank card, which would look identical to "nothing to
    // pay out" when the real cause is a network or backend failure.
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/No settlement months available/i)).toBeNull();
    expect(screen.getAllByRole('button', { name: /Retry/i }).length).toBeGreaterThan(0);

    vi.unstubAllGlobals();
  });

  it('re-fetches months/balance/history, closes the dialog, and warns the operator after a failed cancel (409)', async () => {
    mockSearchParams = new URLSearchParams('');
    let historyFetchCount = 0;
    const historyItem = {
      payoutCode: 'PO-RACE-000001', periodCount: 1, periodStart: '2026-09-01', periodEnd: '2026-09-30',
      payableNetAmount: 1_000_000, status: 'PendingReview', requestedAtUtc: '2026-10-01T00:00:00Z',
      settledAtUtc: null, rejectionReason: null, cancellable: true,
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/cancel')) {
        return new Response(JSON.stringify({ errorCode: 'PAYOUT_NOT_CANCELLABLE' }), { status: 409 });
      }
      if (url.includes('/settlement-months')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes('/available-balance')) {
        return new Response(JSON.stringify({
          periodCount: 0, paymentsReceived: 0, discountsGiven: 0, refundedAmount: 0, netSales: 0,
          commissionAmount: 0, adjustmentsOutstanding: 0, payableNetAmount: 0,
          requestable: false, blockReason: null, activePayoutCode: null,
        }), { status: 200 });
      }
      if (url.includes('/bank-account')) {
        return new Response(JSON.stringify({
          bankName: null, accountHolderName: null, maskedAccountNumber: null, updatedAtUtc: null,
        }), { status: 200 });
      }
      if (url.includes('/api/operator/payouts?')) {
        historyFetchCount += 1;
        return new Response(JSON.stringify({
          items: [historyItem], page: 1, pageSize: 20, totalCount: 1, totalPages: 1,
        }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<OperatorPayoutView />);
    await waitFor(() => expect(historyFetchCount).toBe(1));

    fireEvent.click(screen.getByRole('button', { name: /Cancel Request/i }));
    expect(await screen.findByRole('dialog')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Confirm Cancellation/i }));

    await waitFor(() => expect(historyFetchCount).toBe(2));
    // The dialog must close itself on PAYOUT_NOT_CANCELLABLE rather than stay open on the stale
    // `request` with a re-clickable Confirm button, and the operator must be told why — not left
    // to infer it from the table quietly changing underneath a dialog that just vanished.
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(await screen.findByText(/can no longer be cancelled/i)).toBeDefined();

    vi.unstubAllGlobals();
  });

  it('redirects to sign-in when a section load gets a 401 (expired session), instead of showing an error banner', async () => {
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
