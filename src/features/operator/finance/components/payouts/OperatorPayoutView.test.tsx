import { render, screen, waitFor } from '@testing-library/react';
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

describe('OperatorPayoutView (Screen #91)', () => {
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

  it('renders Screen #91 with header, demo banner, settlement periods, bank card, and history', async () => {
    render(<OperatorPayoutView />);

    expect(screen.getByRole('heading', { name: /Payout Settlement/i })).toBeDefined();
    expect(screen.getByText(/Demo Payout Mode Active/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Settlement Periods/i })).toBeDefined();
      expect(screen.getByRole('heading', { name: /Beneficiary Bank Account/i })).toBeDefined();
      expect(screen.getByRole('heading', { name: /Payout Request History/i })).toBeDefined();
      expect(screen.getByText(/NGUYEN VAN AN/i)).toBeDefined();
    });
  });

  it('displays truthful PENDING_BE_INTEGRATION notice when demo query is absent', async () => {
    mockSearchParams = new URLSearchParams('');
    render(<OperatorPayoutView />);

    await waitFor(() => {
      expect(screen.getAllByText(/Backend Integration Pending/i).length).toBeGreaterThan(0);
      expect(
        screen.getByText(/Payout settlement and banking integration is pending/i)
      ).toBeDefined();
    });
  });

  it('keeps payout and bank mutation actions disabled with an accessible backend-pending explanation', async () => {
    render(<OperatorPayoutView />);

    await waitFor(() => {
      expect(screen.getByText(/01\/08\/2026 - 31\/08\/2026/i)).toBeDefined();
    });

    const requestButtons = screen.getAllByRole('button', { name: /Request Payout/i });
    expect(requestButtons[0].hasAttribute('disabled')).toBe(true);
    const editBtn = screen.getByRole('button', { name: /Edit Bank Details/i });
    expect(editBtn.hasAttribute('disabled')).toBe(true);
    expect(screen.getAllByText('Backend integration pending').length).toBeGreaterThan(0);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
