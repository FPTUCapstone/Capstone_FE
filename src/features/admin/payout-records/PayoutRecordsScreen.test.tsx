import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PayoutRecordsError, fetchPayoutRecords } from './payoutRecordsService';
import type { PayoutsResponse } from './payoutRecords';
import { PayoutRecordsScreen } from './PayoutRecordsScreen';

const push = vi.fn();
const replace = vi.fn();
let query = '';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams(query),
}));
vi.mock('./payoutRecordsService', () => ({
  fetchPayoutRecords: vi.fn(),
  PayoutRecordsError: class extends Error {
    constructor(public status: number, public errorCode?: string, public errorMessage?: string) { super(); }
  },
}));

const response: PayoutsResponse = {
  summary: { pendingRequests: 1, totalRequestedAmount: 9190000, totalConfirmedAmount: 532500 },
  pageNumber: 1, pageSize: 20, totalCount: 2, totalPages: 1,
  items: [
    {
      payoutId: '12', payoutCode: 'PO-12',
      operator: { userId: '2', companyName: 'Da Nang Tours' },
      periodStart: '2026-08-01', periodEnd: '2026-08-31',
      grossRevenue: 10000000, commissionAmount: 1000000, netAmount: 9000000,
      requestedAtUtc: '2026-09-01T02:30:00Z', status: 'Requested',
    },
    {
      payoutId: '11', payoutCode: 'PO-11',
      operator: { userId: '3', companyName: 'Hoi An Walks' },
      periodStart: '2026-07-01', periodEnd: '2026-07-31',
      grossRevenue: 500000, commissionAmount: 62500, netAmount: 437500,
      requestedAtUtc: null, status: 'Confirmed',
    },
  ],
};

describe('PayoutRecordsScreen', () => {
  beforeEach(() => {
    query = ''; push.mockClear(); replace.mockClear();
    vi.mocked(fetchPayoutRecords).mockReset().mockResolvedValue(response);
  });

  it('renders summary cards, rows, and the disabled View Details action', async () => {
    render(<PayoutRecordsScreen />);
    expect(await screen.findByText('Da Nang Tours')).toBeTruthy();
    expect(screen.getByText('Pending Requests')).toBeTruthy();
    expect(screen.getByText('Total Requested Amount')).toBeTruthy();
    expect(screen.getByText('Total Confirmed Amount')).toBeTruthy();
    expect(screen.getByText('PO-12')).toBeTruthy();
    expect(screen.getByText('01/08/2026 – 31/08/2026')).toBeTruthy();
    expect(screen.getByText('Not available')).toBeTruthy();
    expect(screen.getAllByText('Requested').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Confirmed').length).toBeGreaterThan(0);
    const action = screen.getAllByRole('button', { name: /View Details for PO-/ })[0];
    expect(action).toBeTruthy();
    expect((action as HTMLButtonElement).disabled).toBe(true);
    expect((action as HTMLButtonElement).title).toContain('UC-64');
  });

  it('shows MSG128 and keeps the filters on an empty match', async () => {
    vi.mocked(fetchPayoutRecords).mockResolvedValue({
      ...response, totalCount: 0, totalPages: 0, items: [],
      summary: { pendingRequests: 0, totalRequestedAmount: 0, totalConfirmedAmount: 0 },
    });
    render(<PayoutRecordsScreen />);
    expect(await screen.findByText('No data is available for the selected criteria.')).toBeTruthy();
    expect((screen.getByLabelText('Keyword') as HTMLInputElement).value).toBe('');
  });

  it('blocks an inverted period range before any request', async () => {
    render(<PayoutRecordsScreen />);
    await screen.findByText('Da Nang Tours');
    expect(fetchPayoutRecords).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText('Period From'), { target: { value: '2026-09-10' } });
    fireEvent.change(screen.getByLabelText('Period To'), { target: { value: '2026-09-01' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(screen.getByRole('alert').textContent).toContain('logically invalid');
    expect(push).not.toHaveBeenCalled();
    expect(fetchPayoutRecords).toHaveBeenCalledTimes(1);
  });

  it('redirects a missing or expired Administrator session to login', async () => {
    vi.mocked(fetchPayoutRecords).mockRejectedValue(new PayoutRecordsError(401));
    render(<PayoutRecordsScreen />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Fpayouts'));
  });

  it('shows the server validation message for a 400 without claiming a service failure', async () => {
    vi.mocked(fetchPayoutRecords).mockRejectedValue(new PayoutRecordsError(
      400, 'payout.invalid_field', 'PeriodFrom is outside the supported range.'));
    render(<PayoutRecordsScreen />);
    expect(await screen.findByText('PeriodFrom is outside the supported range.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('recovers through Retry after an unavailable response', async () => {
    vi.mocked(fetchPayoutRecords)
      .mockRejectedValueOnce(new PayoutRecordsError(503))
      .mockResolvedValueOnce(response);
    render(<PayoutRecordsScreen />);
    expect(await screen.findByText(/temporarily unable to process/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('PO-12')).toBeTruthy();
    expect(fetchPayoutRecords).toHaveBeenCalledTimes(2);
  });

  it('paginates with the applied filters preserved in the URL (PC-03)', async () => {
    query = 'keyword=PO-';
    vi.mocked(fetchPayoutRecords).mockResolvedValue({ ...response, totalPages: 2 });
    render(<PayoutRecordsScreen />);
    expect(await screen.findByText('PO-12')).toBeTruthy();
    expect(fetchPayoutRecords).toHaveBeenCalledWith(
      { keyword: 'PO-', status: '', periodFrom: '', periodTo: '', pageNumber: 1 },
      expect.anything());
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(push).toHaveBeenCalledWith('/admin/payouts?keyword=PO-&pageNumber=2');
  });
});
