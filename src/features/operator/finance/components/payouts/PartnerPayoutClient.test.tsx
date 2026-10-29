import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PartnerPayoutClient } from './PartnerPayoutClient';

let mockSearchParams = new URLSearchParams('demo=1');

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/partner/payouts',
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
      companyName: 'Han River Travel Co.',
    },
  }),
}));

vi.mock('./OperatorPayoutView', () => ({
  OperatorPayoutView: () => <div data-testid="mock-operator-payout-view">Payout Content View</div>,
}));

describe('PartnerPayoutClient', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams('demo=1');
  });

  it('renders within PartnerWorkspaceLayout with payouts active tab and child view', () => {
    render(<PartnerPayoutClient />);

    expect(screen.getByTestId('mock-operator-payout-view')).toBeDefined();
    expect(screen.getByRole('complementary', { name: /Thanh bên không gian làm việc đối tác/i })).toBeDefined();
  });
});
