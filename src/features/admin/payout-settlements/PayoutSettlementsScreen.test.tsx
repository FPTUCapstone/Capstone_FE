import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();
const replace = vi.fn();
let query = '';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams(query),
}));
vi.mock('./payoutSettlementsService', () => ({
  fetchPayoutSettlements: vi.fn(),
  PayoutSettlementsError: class extends Error {
    constructor(public status: number, public errorCode?: string, title?: string) {
      super(title);
    }
  },
}));

import { fetchPayoutSettlements, PayoutSettlementsError } from './payoutSettlementsService';
import type { PayoutSettlementListItem, PayoutSettlementsResponse } from './payoutSettlements';
import { PayoutSettlementsScreen } from './PayoutSettlementsScreen';

const settledRow = {
  settlementId: 101,
  bookingId: 55,
  tourOperatorUserId: 7,
  runDate: '2026-11-08',
  kind: 'Main' as const,
  payoutAmount: 1_800_000,
  status: 'Settled' as const,
  transferReference: 'SIM-TRX-001',
};

const failedRow = {
  settlementId: 102,
  bookingId: 56,
  tourOperatorUserId: 8,
  runDate: '2026-11-08',
  kind: 'Main' as const,
  payoutAmount: 900_000,
  status: 'SettlementFailed' as const,
  transferReference: null,
};

const awaitingRow = {
  settlementId: null,
  bookingId: 57,
  tourOperatorUserId: 9,
  runDate: null,
  kind: 'Main' as const,
  payoutAmount: 450_000,
  status: 'Awaiting Window' as const,
  transferReference: null,
};

function response(
  items: PayoutSettlementListItem[],
  overrides: Partial<Omit<PayoutSettlementsResponse, 'items'>> = {},
): PayoutSettlementsResponse {
  return { pageNumber: 1, pageSize: 20, totalCount: items.length, items, ...overrides };
}

describe('PayoutSettlementsScreen', () => {
  beforeEach(() => {
    query = '';
    push.mockClear();
    replace.mockClear();
    vi.mocked(fetchPayoutSettlements).mockReset().mockResolvedValue(response([settledRow]));
  });

  it('renders every status and the Awaiting Window / null runDate row without crashing', async () => {
    vi.mocked(fetchPayoutSettlements).mockResolvedValue(response([settledRow, failedRow, awaitingRow]));
    render(<PayoutSettlementsScreen viewerRole="Administrator" />);
    await screen.findByRole('table');
    const table = within(screen.getByRole('table'));
    expect(table.getByText('Settled')).toBeTruthy();
    expect(table.getByText('SettlementFailed')).toBeTruthy();
    expect(table.getByText('Awaiting Window')).toBeTruthy();
    expect(table.getByText('SIM-TRX-001')).toBeTruthy();
  });

  it('shows a View Details link on a SettlementFailed row for an Administrator viewer', async () => {
    vi.mocked(fetchPayoutSettlements).mockResolvedValue(response([failedRow]));
    render(<PayoutSettlementsScreen viewerRole="Administrator" />);
    await screen.findByRole('table');
    expect(screen.getByRole('link', { name: /view details/i }).getAttribute('href')).toBe('/admin/payout-settlements/102');
  });

  it('does not show a View Details link for a Staff viewer, even on a SettlementFailed row', async () => {
    vi.mocked(fetchPayoutSettlements).mockResolvedValue(response([failedRow]));
    render(<PayoutSettlementsScreen viewerRole="Staff" />);
    await screen.findByRole('table');
    expect(screen.queryByRole('link', { name: /view details/i })).toBeNull();
  });

  it('does not show a View Details link on a non-failed row for an Administrator viewer', async () => {
    vi.mocked(fetchPayoutSettlements).mockResolvedValue(response([settledRow]));
    render(<PayoutSettlementsScreen viewerRole="Administrator" />);
    await screen.findByRole('table');
    expect(screen.queryByRole('link', { name: /view details/i })).toBeNull();
  });

  it('shows the SRS empty-filter message when there are no rows', async () => {
    vi.mocked(fetchPayoutSettlements).mockResolvedValue(response([], { totalCount: 0 }));
    render(<PayoutSettlementsScreen viewerRole="Staff" />);
    expect(await screen.findByText('No payout settlements match the filters')).toBeTruthy();
  });

  it('redirects a missing or expired session to sign-in with a return URL', async () => {
    vi.mocked(fetchPayoutSettlements).mockRejectedValue(new PayoutSettlementsError(401, undefined, 'Session expired.'));
    render(<PayoutSettlementsScreen viewerRole="Staff" />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Fpayout-settlements'));
  });

  it('shows a retry affordance on an unavailable (network/5xx) failure', async () => {
    vi.mocked(fetchPayoutSettlements).mockRejectedValue(new PayoutSettlementsError(503, undefined, 'Unavailable.'));
    render(<PayoutSettlementsScreen viewerRole="Staff" />);
    expect(await screen.findByRole('button', { name: 'Retry' })).toBeTruthy();
  });

  it('shows a forbidden message on a 403', async () => {
    vi.mocked(fetchPayoutSettlements).mockRejectedValue(new PayoutSettlementsError(403, undefined, 'Forbidden.'));
    render(<PayoutSettlementsScreen viewerRole="Staff" />);
    expect(await screen.findByRole('alert')).toBeTruthy();
  });

  it('blocks an inverted run-date range before navigating or fetching again', async () => {
    render(<PayoutSettlementsScreen viewerRole="Staff" />);
    await screen.findByRole('table');
    fireEvent.change(screen.getByLabelText('Run Date From'), { target: { value: '2026-11-08' } });
    fireEvent.change(screen.getByLabelText('Run Date To'), { target: { value: '2026-11-01' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(screen.getByRole('alert').textContent).toContain('on or after');
    expect(push).not.toHaveBeenCalled();
  });

  it('applies a status filter by navigating with the new query', async () => {
    render(<PayoutSettlementsScreen viewerRole="Staff" />);
    await screen.findByRole('table');
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'Awaiting Window' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(push).toHaveBeenCalledWith('/admin/payout-settlements?status=Awaiting+Window');
  });

  it('paginates using totalCount and pageSize', async () => {
    vi.mocked(fetchPayoutSettlements).mockResolvedValue(response([settledRow], { pageNumber: 2, pageSize: 1, totalCount: 3 }));
    render(<PayoutSettlementsScreen viewerRole="Staff" />);
    await screen.findByRole('table');
    expect(screen.getByText(/Page 2 of 3/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(push).toHaveBeenCalledWith('/admin/payout-settlements?pageNumber=3');
  });
});
