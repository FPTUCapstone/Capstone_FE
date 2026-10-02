import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { isValidPayoutId } from './payoutDetails';
import { PayoutDetailsError, fetchPayoutDetails } from './payoutDetailsService';
import { PayoutDetailsScreen } from './PayoutDetailsScreen';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('./payoutDetailsService', () => ({
  fetchPayoutDetails: vi.fn(),
  PayoutDetailsError: class extends Error {
    constructor(public status: number, public errorCode?: string, public errorMessage?: string) { super(); }
  },
}));

const detail = {
  payoutId: '1', payoutCode: 'PO-1',
  operator: { userId: '2', companyName: 'Danang Tourist Co., Ltd' },
  periodStart: '2026-08-01', periodEnd: '2026-08-31',
  grossRevenue: 10000000, commissionRate: 10, commissionAmount: 1000000, netAmount: 9000000,
  requestedAtUtc: '2026-09-01T02:30:00Z', status: 'Requested' as const,
  bookings: [
    { bookingId: '801', bookingCode: 'BK-2026-000801', tourName: 'Hoi An Night Walk', paidAmount: 10000000, refundedAmount: 0, netAmount: 8000000 },
    { bookingId: '802', bookingCode: 'BK-2026-000802', tourName: null, paidAmount: 300000, refundedAmount: 100000, netAmount: 2000000 },
  ],
};

describe('PayoutDetailsScreen', () => {
  beforeEach(() => {
    replace.mockClear();
    vi.mocked(fetchPayoutDetails).mockReset().mockResolvedValue(detail);
  });

  it('renders header, breakdown, bookings, and the two disabled placeholders', async () => {
    render(<PayoutDetailsScreen payoutId="1" />);
    expect(await screen.findByRole('heading', { name: 'PO-1' })).toBeTruthy();
    expect(screen.getAllByText('Danang Tourist Co., Ltd').length).toBeGreaterThan(0);
    expect(screen.getByText('01/08/2026 – 31/08/2026')).toBeTruthy();
    expect(screen.getByText('Commission Rate')).toBeTruthy();
    expect(screen.getByText('10%')).toBeTruthy();
    expect(screen.getByText('Net Payout Amount')).toBeTruthy();
    expect(screen.getByText('BK-2026-000801')).toBeTruthy();
    expect(screen.getByText('Hoi An Night Walk')).toBeTruthy();
    expect(screen.getByText('Not available')).toBeTruthy();
    const confirm = screen.getByRole('button', { name: 'Confirm Settlement' });
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
    expect((confirm as HTMLButtonElement).title).toContain('UC-65');
    const exportButton = screen.getByRole('button', { name: 'Export Payout Statement' });
    expect((exportButton as HTMLButtonElement).disabled).toBe(true);
  });

  it('renders the MSG128 empty-bookings row when no contributing bookings exist', async () => {
    vi.mocked(fetchPayoutDetails).mockResolvedValue({ ...detail, bookings: [] });
    render(<PayoutDetailsScreen payoutId="1" />);
    expect(await screen.findByText('No data is available for the selected criteria.')).toBeTruthy();
  });

  it('shows the locked MSG128 wording with a back action on 404', async () => {
    vi.mocked(fetchPayoutDetails).mockRejectedValue(new PayoutDetailsError(404, 'Payouts.NotFound'));
    render(<PayoutDetailsScreen payoutId="1" />);
    expect(await screen.findByText('No records found matching your criteria.')).toBeTruthy();
    expect(screen.getByText('← Back to Payout Records')).toBeTruthy();
  });

  it('redirects to admin login on 401 with a return URL', async () => {
    vi.mocked(fetchPayoutDetails).mockRejectedValue(new PayoutDetailsError(401));
    render(<PayoutDetailsScreen payoutId="1" />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Fpayouts%2F1'));
  });

  it('shows the forbidden message on 403', async () => {
    vi.mocked(fetchPayoutDetails).mockRejectedValue(new PayoutDetailsError(403));
    render(<PayoutDetailsScreen payoutId="1" />);
    expect(await screen.findByText('You do not have permission to access this function.')).toBeTruthy();
  });

  it('shows the verbatim server message on 400 without a Retry control', async () => {
    vi.mocked(fetchPayoutDetails).mockRejectedValue(new PayoutDetailsError(
      400, 'payout.invalid_field', 'PeriodFrom is outside the supported range.'));
    render(<PayoutDetailsScreen payoutId="1" />);
    expect(await screen.findByText('PeriodFrom is outside the supported range.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('rejects invalid payout IDs at the page boundary without an API call', () => {
    expect(isValidPayoutId('1abc')).toBe(false);
    expect(isValidPayoutId('0')).toBe(false);
    expect(isValidPayoutId('9223372036854775808')).toBe(false);
    expect(fetchPayoutDetails).not.toHaveBeenCalled();
  });

  it('recovers through Retry after an unavailable response', async () => {
    vi.mocked(fetchPayoutDetails)
      .mockRejectedValueOnce(new PayoutDetailsError(503))
      .mockResolvedValueOnce(detail);
    render(<PayoutDetailsScreen payoutId="1" />);
    expect(await screen.findByText(/temporarily unable to process/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('heading', { name: 'PO-1' })).toBeTruthy();
    expect(fetchPayoutDetails).toHaveBeenCalledTimes(2);
  });
});
