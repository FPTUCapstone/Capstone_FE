import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PartnerRevenueClient } from './PartnerRevenueClient';

let mockSearchParams = new URLSearchParams('demo=1');

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/partner/revenue',
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

vi.mock('./OperatorRevenueView', () => ({
  OperatorRevenueView: () => <div data-testid="mock-operator-revenue-view">Revenue Content View</div>,
}));

describe('PartnerRevenueClient', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams('demo=1');
  });

  it('renders within PartnerWorkspaceLayout with revenue active tab and child view', () => {
    render(<PartnerRevenueClient />);

    expect(screen.getByTestId('mock-operator-revenue-view')).toBeDefined();
    expect(screen.getByRole('complementary', { name: /Thanh bên không gian làm việc đối tác/i })).toBeDefined();
  });
});
