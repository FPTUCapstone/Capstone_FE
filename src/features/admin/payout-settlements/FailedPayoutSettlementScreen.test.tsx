import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('./payoutSettlementsService', () => ({
  fetchFailedPayoutBatchDetail: vi.fn(),
  retryFailedPayoutBatch: vi.fn(),
  markPayoutBatchResolved: vi.fn(),
  PayoutSettlementsError: class extends Error {
    constructor(public status: number, public errorCode?: string, title?: string) {
      super(title);
    }
  },
}));

import {
  fetchFailedPayoutBatchDetail,
  markPayoutBatchResolved,
  PayoutSettlementsError,
  retryFailedPayoutBatch,
} from './payoutSettlementsService';
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
    vi.mocked(retryFailedPayoutBatch).mockReset().mockResolvedValue(undefined);
    vi.mocked(markPayoutBatchResolved).mockReset().mockResolvedValue(undefined);
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

  it('shows both actions only while status is SettlementFailed', async () => {
    render(<FailedPayoutSettlementScreen batchId={42} />);
    await screen.findByRole('table');
    expect(screen.getByRole('button', { name: 'Retry Transfer' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mark as Resolved' })).toBeTruthy();
  });

  it('hides every action once a status other than SettlementFailed is loaded', async () => {
    vi.mocked(fetchFailedPayoutBatchDetail).mockResolvedValue({ ...detail, status: 'Settled' as const });
    render(<FailedPayoutSettlementScreen batchId={42} />);
    await screen.findByRole('table');
    expect(screen.queryByRole('button', { name: 'Retry Transfer' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Mark as Resolved' })).toBeNull();
  });

  it('Retry Transfer: confirming calls the service, closes the dialog, and shows the re-fetched status (never assumed locally)', async () => {
    render(<FailedPayoutSettlementScreen batchId={42} />);
    await screen.findByRole('table');
    fireEvent.click(screen.getByRole('button', { name: 'Retry Transfer' }));
    const dialog = within(screen.getByRole('dialog'));
    vi.mocked(fetchFailedPayoutBatchDetail).mockResolvedValueOnce({ ...detail, status: 'Settled' as const });
    fireEvent.click(dialog.getByRole('button', { name: 'Retry Transfer' }));
    await waitFor(() => expect(retryFailedPayoutBatch).toHaveBeenCalledWith(42));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(await screen.findByText('Settled')).toBeTruthy();
    expect(fetchFailedPayoutBatchDetail).toHaveBeenCalledTimes(2);
  });

  it('Mark as Resolved: confirming with a reason calls the service and shows the re-fetched status', async () => {
    render(<FailedPayoutSettlementScreen batchId={42} />);
    await screen.findByRole('table');
    fireEvent.click(screen.getByRole('button', { name: 'Mark as Resolved' }));
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.change(dialog.getByLabelText('Reason'), { target: { value: 'Operator confirmed receipt out of band' } });
    vi.mocked(fetchFailedPayoutBatchDetail).mockResolvedValueOnce({ ...detail, status: 'Resolved' as const });
    fireEvent.click(dialog.getByRole('button', { name: 'Mark as Resolved' }));
    await waitFor(() => expect(markPayoutBatchResolved).toHaveBeenCalledWith(42, 'Operator confirmed receipt out of band'));
    expect(await screen.findByText('Resolved')).toBeTruthy();
  });

  // U03: an earlier reload's response, resolving after a later reload already committed its own
  // result, must not overwrite that newer result.
  it('ignores a stale reload response superseded by a newer reload before it resolves', async () => {
    vi.mocked(fetchFailedPayoutBatchDetail).mockReset().mockResolvedValueOnce(detail);
    let resolveSecondFetch: (value: typeof detail) => void = () => {};
    vi.mocked(fetchFailedPayoutBatchDetail).mockImplementationOnce(
      () => new Promise((resolve) => { resolveSecondFetch = resolve; }),
    );
    vi.mocked(fetchFailedPayoutBatchDetail).mockResolvedValueOnce({ ...detail, status: 'Resolved' as const });

    render(<FailedPayoutSettlementScreen batchId={42} />);
    await screen.findByRole('table');

    // First action (Retry Transfer): its own re-fetch (2nd call) is slow and stays pending.
    fireEvent.click(screen.getByRole('button', { name: 'Retry Transfer' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Retry Transfer' }));
    await waitFor(() => expect(retryFailedPayoutBatch).toHaveBeenCalledTimes(1));

    // The stale detail is still showing (2nd fetch hasn't resolved), so the actions are still
    // visible — a second action (Mark as Resolved) fires a 3rd fetch that resolves immediately.
    fireEvent.click(screen.getByRole('button', { name: 'Mark as Resolved' }));
    fireEvent.change(within(screen.getByRole('dialog')).getByLabelText('Reason'), { target: { value: 'Resolved manually' } });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Mark as Resolved' }));
    expect(await screen.findByText('Resolved')).toBeTruthy();

    // The stale 2nd fetch now resolves late — it must not revert the screen.
    resolveSecondFetch({ ...detail, status: 'SettlementFailed' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByText('Resolved')).toBeTruthy();
    expect(screen.queryByText('SettlementFailed')).toBeNull();
  });
});
