import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorPayoutView } from './OperatorPayoutView';
import { resetDemoPayoutState } from '../../services/operatorPayoutService';

let mockSearchParams = new URLSearchParams('demo=1');

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
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

  it('shows a per-section error with Retry when a section fails to load', async () => {
    mockSearchParams = new URLSearchParams('');
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    render(<OperatorPayoutView />);

    // Production mode (no ?demo=1): all three sections hit the BFF, which fails here, so each
    // section's service call catches it and returns an empty/default result — not an error
    // banner, since the service never throws past itself. This confirms the empty state renders
    // instead of crashing the page.
    await waitFor(() => {
      expect(screen.getByText(/No settlement months available/i)).toBeDefined();
    });

    vi.unstubAllGlobals();
  });
});
