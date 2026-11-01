import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SettlementQueue } from './payoutSettlement';
import { PayoutSettlementQueueScreen } from './PayoutSettlementQueueScreen';
import { PayoutSettlementError, fetchSettlementQueue } from './payoutSettlementService';

const push = vi.fn();
const replace = vi.fn();
let query = '';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams(query),
}));
vi.mock('./payoutSettlementService', () => ({
  fetchSettlementQueue: vi.fn(),
  PayoutSettlementError: class extends Error {
    constructor(public status: number, public errorCode?: string, public errorMessage?: string) { super(); }
  },
}));

const queue: SettlementQueue = {
  pageNumber: 1, pageSize: 20, totalCount: 2, totalPages: 2, totalAmount: 9437500,
  items: [
    {
      payoutId: '12', payoutCode: 'PO-12',
      operator: { userId: '2', companyName: 'Da Nang Tours' },
      periodStart: '2026-08-01', periodEnd: '2026-08-31', periodCount: 1,
      grossRevenue: 10000000, commissionAmount: 1000000, netAmount: 9000000,
      requestedAtUtc: '2026-09-01T02:30:00Z', status: 'ApprovedForSettlement',
    },
    {
      payoutId: '11', payoutCode: 'PO-11',
      operator: { userId: '3', companyName: 'Hoi An Walks' },
      periodStart: '2026-07-01', periodEnd: '2026-09-30', periodCount: 3,
      grossRevenue: 500000, commissionAmount: 62500, netAmount: 437500,
      requestedAtUtc: null, status: 'SettlementProcessing',
    },
  ],
};

const fetchMock = vi.mocked(fetchSettlementQueue);

describe('PayoutSettlementQueueScreen', () => {
  beforeEach(() => {
    query = ''; push.mockClear(); replace.mockClear();
    fetchMock.mockReset().mockResolvedValue(queue);
  });

  it('renders the summary, rows, badges and review links', async () => {
    render(<PayoutSettlementQueueScreen />);
    expect(await screen.findByText('Da Nang Tours')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Payout Settlement' })).toBeTruthy();
    expect(screen.getByText('Records')).toBeTruthy();
    expect(screen.getByText('Total Net Payout')).toBeTruthy();
    expect(screen.getByText('PO-12')).toBeTruthy();
    expect(screen.getByText('01/08/2026 – 31/08/2026')).toBeTruthy();
    expect(screen.getByText('· 3 months')).toBeTruthy();
    expect(screen.getByText('Not available')).toBeTruthy();
    expect(screen.getByLabelText('Payout status: Approved for settlement')).toBeTruthy();
    expect(screen.getByLabelText('Payout status: Settlement processing')).toBeTruthy();

    const review = screen.getByRole('link', { name: 'Review for PO-12' });
    expect(review.getAttribute('href')).toBe('/admin/payouts/settlement/12');
    const view = screen.getByRole('link', { name: 'View for PO-11' });
    expect(view.getAttribute('href')).toBe('/admin/payouts/settlement/11');

    const region = screen.getByLabelText('Settlement queue table; scroll horizontally on small screens');
    expect(region.tabIndex).toBe(0);
    expect(region.className).toContain('overflow-x-auto');
  });

  it('offers exactly the four settlement statuses and no Staff-only status', async () => {
    render(<PayoutSettlementQueueScreen />);
    await screen.findByText('Da Nang Tours');
    const options = screen.getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(['Approved for settlement', 'Settlement processing', 'Settled', 'Settlement failed']);
  });

  it('loads the search taken from the URL', async () => {
    query = 'status=Settled&keyword=Hoi&pageNumber=2';
    render(<PayoutSettlementQueueScreen />);
    await screen.findByText('Da Nang Tours');
    expect(fetchMock.mock.calls[0][0]).toEqual({
      keyword: 'Hoi', status: 'Settled', periodFrom: '', periodTo: '', pageNumber: 2,
    });
    expect((screen.getByLabelText('Status') as HTMLSelectElement).value).toBe('Settled');
  });

  it('applies filters by navigating to the shareable URL', async () => {
    render(<PayoutSettlementQueueScreen />);
    await screen.findByText('Da Nang Tours');
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'SettlementFailed' } });
    fireEvent.change(screen.getByLabelText('Keyword'), { target: { value: '  Hoi An ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));
    expect(push).toHaveBeenCalledWith('/admin/payouts/settlement?keyword=Hoi+An&status=SettlementFailed');
  });

  it('blocks an inverted period range without calling the service again', async () => {
    render(<PayoutSettlementQueueScreen />);
    await screen.findByText('Da Nang Tours');
    fireEvent.change(screen.getByLabelText('Period From'), { target: { value: '2026-09-30' } });
    fireEvent.change(screen.getByLabelText('Period To'), { target: { value: '2026-09-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));
    expect((await screen.findByRole('alert')).textContent).toContain('logically invalid');
    expect(push).not.toHaveBeenCalled();
  });

  it('clears back to the default queue', async () => {
    query = 'status=Settled';
    render(<PayoutSettlementQueueScreen />);
    await screen.findByText('Da Nang Tours');
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(push).toHaveBeenCalledWith('/admin/payouts/settlement');
  });

  it('pages with Next and Previous', async () => {
    render(<PayoutSettlementQueueScreen />);
    await screen.findByText('Da Nang Tours');
    expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(push).toHaveBeenCalledWith('/admin/payouts/settlement?pageNumber=2');
  });

  it('shows the empty message', async () => {
    fetchMock.mockResolvedValue({ ...queue, totalCount: 0, totalPages: 0, totalAmount: 0, items: [] });
    render(<PayoutSettlementQueueScreen />);
    expect(await screen.findByText('No data is available for the selected criteria.')).toBeTruthy();
  });

  it('shows access denied on 403', async () => {
    fetchMock.mockRejectedValue(new PayoutSettlementError(403));
    render(<PayoutSettlementQueueScreen />);
    expect(await screen.findByText('You do not have permission to access this function.')).toBeTruthy();
  });

  it('shows the backend message on a 400', async () => {
    fetchMock.mockRejectedValue(new PayoutSettlementError(400, 'payout.invalid_status', 'The status filter is not supported.'));
    render(<PayoutSettlementQueueScreen />);
    expect(await screen.findByText('The status filter is not supported.')).toBeTruthy();
  });

  it('redirects to sign-in on 401 with the queue as return URL', async () => {
    fetchMock.mockRejectedValue(new PayoutSettlementError(401));
    render(<PayoutSettlementQueueScreen />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Fpayouts%2Fsettlement'));
  });

  it('offers Retry after an outage and reloads', async () => {
    fetchMock.mockRejectedValueOnce(new PayoutSettlementError(503));
    render(<PayoutSettlementQueueScreen />);
    expect(await screen.findByText('Unable to load the settlement queue')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Da Nang Tours')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('refreshes on demand', async () => {
    render(<PayoutSettlementQueueScreen />);
    await screen.findByText('Da Nang Tours');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
