import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockUserId = 7;
vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => ({
    status: 'authenticated',
    context: { userId: mockUserId, role: 'TourOperator', status: 'Active', applicationStatus: 'Approved', email: 'operator@test.local' },
  }),
}));
vi.mock('./payoutSettlementsService', () => ({
  fetchOperatorPayoutSettlementHistory: vi.fn(),
  OperatorPayoutSettlementsError: class extends Error {
    constructor(public status: number, public errorCode?: string, title?: string) {
      super(title);
    }
  },
}));

import type { PayoutSettlementListItem, PayoutSettlementsResponse } from './payoutSettlements';
import { fetchOperatorPayoutSettlementHistory, OperatorPayoutSettlementsError } from './payoutSettlementsService';
import { PayoutSettlementHistoryScreen } from './PayoutSettlementHistoryScreen';

const ownRow = {
  settlementId: 101,
  bookingId: 55,
  tourOperatorUserId: 7,
  runDate: '2026-11-08',
  kind: 'Main' as const,
  payoutAmount: 1_800_000,
  status: 'Settled' as const,
  transferReference: 'SIM-TRX-001',
};

const otherOperatorRow = { ...ownRow, settlementId: 102, bookingId: 56, tourOperatorUserId: 8 };

function response(
  items: PayoutSettlementListItem[],
  overrides: Partial<Omit<PayoutSettlementsResponse, 'items'>> = {},
): PayoutSettlementsResponse {
  return { pageNumber: 1, pageSize: 20, totalCount: items.length, items, ...overrides };
}

describe('PayoutSettlementHistoryScreen', () => {
  beforeEach(() => {
    mockUserId = 7;
    vi.mocked(fetchOperatorPayoutSettlementHistory).mockReset().mockResolvedValue(response([ownRow]));
  });

  it('renders the operator\'s own settlement row', async () => {
    render(<PayoutSettlementHistoryScreen />);
    expect(await screen.findByText('55')).toBeTruthy();
    expect(screen.getByText('Settled')).toBeTruthy();
    expect(screen.getByText('SIM-TRX-001')).toBeTruthy();
  });

  it('filters out a row for a different operator even if one were ever returned (defence-in-depth)', async () => {
    vi.mocked(fetchOperatorPayoutSettlementHistory).mockResolvedValue(response([ownRow, otherOperatorRow]));
    render(<PayoutSettlementHistoryScreen />);
    await screen.findByText('55');
    expect(screen.queryByText('56')).toBeNull();
  });

  it('shows a loading state before the history resolves', () => {
    render(<PayoutSettlementHistoryScreen />);
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('shows an empty-state message when there is no history', async () => {
    vi.mocked(fetchOperatorPayoutSettlementHistory).mockResolvedValue(response([]));
    render(<PayoutSettlementHistoryScreen />);
    expect(await screen.findByText(/no payout settlements/i)).toBeTruthy();
  });

  it('shows a forbidden message on a 403', async () => {
    vi.mocked(fetchOperatorPayoutSettlementHistory).mockRejectedValue(new OperatorPayoutSettlementsError(403, undefined, 'Forbidden.'));
    render(<PayoutSettlementHistoryScreen />);
    expect(await screen.findByRole('alert')).toBeTruthy();
  });

  it('shows a retry affordance on an unavailable (network/5xx) failure, and retrying re-fetches', async () => {
    vi.mocked(fetchOperatorPayoutSettlementHistory).mockRejectedValueOnce(new OperatorPayoutSettlementsError(503, undefined, 'Unavailable.'));
    render(<PayoutSettlementHistoryScreen />);
    const retryButton = await screen.findByRole('button', { name: 'Retry' });
    vi.mocked(fetchOperatorPayoutSettlementHistory).mockResolvedValueOnce(response([ownRow]));
    fireEvent.click(retryButton);
    expect(await screen.findByText('Settled')).toBeTruthy();
    expect(fetchOperatorPayoutSettlementHistory).toHaveBeenCalledTimes(2);
  });

  it('paginates using totalCount and pageSize', async () => {
    vi.mocked(fetchOperatorPayoutSettlementHistory).mockResolvedValueOnce(response([ownRow], { pageNumber: 1, pageSize: 1, totalCount: 3 }));
    render(<PayoutSettlementHistoryScreen />);
    await screen.findByText('Settled');
    expect(screen.getByText(/Page 1 of 3/)).toBeTruthy();
    vi.mocked(fetchOperatorPayoutSettlementHistory).mockResolvedValueOnce(response([ownRow], { pageNumber: 2, pageSize: 1, totalCount: 3 }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(fetchOperatorPayoutSettlementHistory).toHaveBeenCalledWith(2, 20, expect.anything()));
  });
});
