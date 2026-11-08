import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('./payoutSettlementsService', () => ({
  fetchFailedPayoutBatchDetail: vi.fn(),
  PayoutSettlementsError: class extends Error {
    constructor(public status: number, public errorCode?: string, title?: string) {
      super(title);
    }
  },
}));

import { fetchFailedPayoutBatchDetail, PayoutSettlementsError } from './payoutSettlementsService';
import { FailedPayoutSettlementScreen } from './FailedPayoutSettlementScreen';

const detail = {
  batchId: 42,
  tourOperatorUserId: 7,
  runDate: '2026-11-08',
  totalAmount: 1_800_000,
  status: 'SettlementFailed' as const,
  attemptCount: 2,
  attempts: [
    { attemptNumber: 1, sentAtUtc: '2026-11-08T03:00:00Z', outcome: 'Failed' as const, failureReason: 'bank_down' },
    { attemptNumber: 2, sentAtUtc: '2026-11-08T04:00:00Z', outcome: 'Timeout' as const, failureReason: null },
  ],
};

describe('FailedPayoutSettlementScreen', () => {
  beforeEach(() => {
    replace.mockClear();
    vi.mocked(fetchFailedPayoutBatchDetail).mockReset().mockResolvedValue(detail);
  });

  it('shows the header fields and every attempt row in order', async () => {
    render(<FailedPayoutSettlementScreen batchId={42} />);
    await screen.findByRole('table');
    const table = within(screen.getByRole('table'));

    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('SettlementFailed')).toBeTruthy();
    expect(screen.getByText('2', { selector: 'p' })).toBeTruthy(); // Attempt Count summary field

    const rows = table.getAllByRole('row').slice(1); // skip the header row
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('1');
    expect(rows[0].textContent).toContain('Failed');
    expect(rows[0].textContent).toContain('bank_down');
    expect(rows[1].textContent).toContain('2');
    expect(rows[1].textContent).toContain('Timeout');
    expect(rows[1].textContent).toContain('Not available');
  });

  it('shows a loading state before the detail resolves', () => {
    render(<FailedPayoutSettlementScreen batchId={42} />);
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('shows a not-found state for a batch that does not exist', async () => {
    vi.mocked(fetchFailedPayoutBatchDetail).mockRejectedValue(new PayoutSettlementsError(404, 'daily_payout.batch_not_found', 'Not found.'));
    render(<FailedPayoutSettlementScreen batchId={999999} />);
    expect(await screen.findByText(/could not be found/i)).toBeTruthy();
  });

  it('redirects to sign-in with a returnUrl on a 401', async () => {
    vi.mocked(fetchFailedPayoutBatchDetail).mockRejectedValue(new PayoutSettlementsError(401, undefined, 'Session expired.'));
    render(<FailedPayoutSettlementScreen batchId={42} />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Fpayout-settlements%2F42'));
  });

  it('shows a forbidden message on a 403', async () => {
    vi.mocked(fetchFailedPayoutBatchDetail).mockRejectedValue(new PayoutSettlementsError(403, undefined, 'Forbidden.'));
    render(<FailedPayoutSettlementScreen batchId={42} />);
    expect(await screen.findByRole('alert')).toBeTruthy();
  });

  it('shows a retry affordance on an unavailable (network/5xx) failure, and retrying re-fetches', async () => {
    vi.mocked(fetchFailedPayoutBatchDetail).mockRejectedValueOnce(new PayoutSettlementsError(503, undefined, 'Unavailable.'));
    render(<FailedPayoutSettlementScreen batchId={42} />);
    const retryButton = await screen.findByRole('button', { name: 'Retry' });
    vi.mocked(fetchFailedPayoutBatchDetail).mockResolvedValueOnce(detail);
    fireEvent.click(retryButton);
    expect(await screen.findByText('SettlementFailed')).toBeTruthy();
    expect(fetchFailedPayoutBatchDetail).toHaveBeenCalledTimes(2);
  });
});
