import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SettlementDetail } from './payoutSettlement';
import { PayoutSettlementDetailScreen } from './PayoutSettlementDetailScreen';
import { PayoutSettlementError, fetchSettlementDetail } from './payoutSettlementService';
import { approved, processing, withOutcome } from './settlementFixtures';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
}));
vi.mock('./payoutSettlementService', () => ({
  fetchSettlementDetail: vi.fn(),
  authorizeSettlement: vi.fn(),
  PayoutSettlementError: class extends Error {
    constructor(public status: number, public errorCode?: string, public errorMessage?: string, public currentStatus?: string) { super(); }
  },
}));

const fetchMock = vi.mocked(fetchSettlementDetail);

describe('PayoutSettlementDetailScreen', () => {
  beforeEach(() => {
    replace.mockClear();
    fetchMock.mockReset().mockResolvedValue(approved);
  });

  it('renders the approved payout: header, amounts, facts and masked beneficiary', async () => {
    render(<PayoutSettlementDetailScreen payoutId="123" />);
    expect(await screen.findByRole('heading', { name: 'PO-000123' })).toBeTruthy();
    expect(screen.getByLabelText('Payout status: Approved for settlement')).toBeTruthy();
    expect(screen.getByText(/Hoi An Tours/)).toBeTruthy();
    expect(screen.getByText(/01\/09\/2026 – 30\/09\/2026/)).toBeTruthy();

    const amounts = screen.getByRole('region', { name: 'Amount breakdown' });
    expect(within(amounts).getByText(/12\.000\.000/)).toBeTruthy();
    expect(within(amounts).getByText(/1\.200\.000.*10%/)).toBeTruthy();
    expect(within(amounts).getByText(/10\.800\.000/)).toBeTruthy();

    expect(screen.getByText('Staff user #5')).toBeTruthy();
    expect(screen.queryByText(/Administrator user/)).toBeNull();

    const beneficiary = screen.getByRole('region', { name: 'Beneficiary bank information' });
    expect(within(beneficiary).getByText('Vietcombank')).toBeTruthy();
    expect(within(beneficiary).getByText('Nguyen Van A')).toBeTruthy();
    expect(within(beneficiary).getByText('****1234')).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Settlement outcome' })).toBeNull();
    expect(screen.getByRole('link', { name: /Back to Payout Settlement/ }).getAttribute('href')).toBe('/admin/payouts/settlement');
  });

  it('shows Not available for missing beneficiary values', async () => {
    fetchMock.mockResolvedValue({
      ...approved, beneficiary: { bankName: null, accountHolder: null, maskedAccountNumber: null }, bankBinResolved: false,
    });
    render(<PayoutSettlementDetailScreen payoutId="123" />);
    const beneficiary = await screen.findByRole('region', { name: 'Beneficiary bank information' });
    expect(within(beneficiary).getAllByText('Not available')).toHaveLength(3);
  });

  it('shows the outcome of a processing payout with the authorizer', async () => {
    fetchMock.mockResolvedValue(processing);
    render(<PayoutSettlementDetailScreen payoutId="123" />);
    const outcome = await screen.findByRole('region', { name: 'Settlement outcome' });
    expect(within(outcome).getByText("Sent. Waiting for the bank's confirmation")).toBeTruthy();
    expect(screen.getByText('Administrator user #2')).toBeTruthy();
    expect(screen.getByLabelText('Payout status: Settlement processing')).toBeTruthy();
  });

  it('shows a settled payout as completed', async () => {
    fetchMock.mockResolvedValue(withOutcome('Settled', {
      gatewayState: 'Completed', failureCode: null, submittedAtUtc: '2026-11-01T09:00:05+00:00', reconciliationRequired: false,
    }));
    render(<PayoutSettlementDetailScreen payoutId="123" />);
    const outcome = await screen.findByRole('region', { name: 'Settlement outcome' });
    expect(within(outcome).getByText('Transfer completed')).toBeTruthy();
  });

  it('shows the friendly reason and the support code for a failed payout, with no retry control', async () => {
    fetchMock.mockResolvedValue(withOutcome('SettlementFailed', {
      gatewayState: 'Completed', failureCode: 'gateway_reversed', submittedAtUtc: '2026-11-01T09:00:05+00:00', reconciliationRequired: false,
    }));
    render(<PayoutSettlementDetailScreen payoutId="123" />);
    const outcome = await screen.findByRole('region', { name: 'Settlement outcome' });
    expect(within(outcome).getByText('The transfer was returned by the bank.')).toBeTruthy();
    expect(within(outcome).getByText('gateway_reversed')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /retry|authorize/i })).toBeNull();
  });

  it('falls back for an unknown failure code', async () => {
    fetchMock.mockResolvedValue(withOutcome('SettlementFailed', {
      gatewayState: 'Completed', failureCode: 'brand_new_code', submittedAtUtc: null, reconciliationRequired: false,
    }));
    render(<PayoutSettlementDetailScreen payoutId="123" />);
    expect(await screen.findByText('The transfer could not be completed.')).toBeTruthy();
  });

  it('shows the reconciliation banner and offers no retry', async () => {
    fetchMock.mockResolvedValue(withOutcome('SettlementProcessing', {
      gatewayState: 'ManualReconciliation', failureCode: null, submittedAtUtc: '2026-11-01T09:00:05+00:00', reconciliationRequired: true,
    }));
    render(<PayoutSettlementDetailScreen payoutId="123" />);
    const banner = await screen.findByRole('alert');
    expect(banner.textContent).toContain('stopped checking after 24 hours');
    expect(banner.textContent).toContain('PO-000123');
    expect(banner.textContent).toContain('no second transfer is created automatically');
    expect(screen.queryByRole('button', { name: /retry|authorize/i })).toBeNull();
  });

  it('shows the loading state first', () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    render(<PayoutSettlementDetailScreen payoutId="123" />);
    expect(screen.getByRole('status').textContent).toContain('Loading');
  });

  it.each([
    [404, 'The requested payout record was not found.'],
    [403, 'You do not have permission to access this function.'],
  ])('shows the message for %i', async (status, message) => {
    fetchMock.mockRejectedValue(new PayoutSettlementError(status));
    render(<PayoutSettlementDetailScreen payoutId="123" />);
    expect(await screen.findByText(message)).toBeTruthy();
  });

  it('redirects to sign-in on 401 with the detail URL as return URL', async () => {
    fetchMock.mockRejectedValue(new PayoutSettlementError(401));
    render(<PayoutSettlementDetailScreen payoutId="123" />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Fpayouts%2Fsettlement%2F123',
    ));
  });

  it('offers Retry after an outage', async () => {
    fetchMock.mockRejectedValueOnce(new PayoutSettlementError(503));
    render(<PayoutSettlementDetailScreen payoutId="123" />);
    expect(await screen.findByText('Unable to load the payout details')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('heading', { name: 'PO-000123' })).toBeTruthy();
  });

  it('ignores a stale response that arrives after a newer one (U03)', async () => {
    let resolveOld: (value: SettlementDetail) => void = () => {};
    fetchMock.mockReset()
      .mockResolvedValueOnce(approved)
      .mockReturnValueOnce(new Promise<SettlementDetail>((resolve) => { resolveOld = resolve; }))
      .mockResolvedValueOnce(processing);

    render(<PayoutSettlementDetailScreen payoutId="123" />);
    await screen.findByRole('heading', { name: 'PO-000123' });

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' })); // slow request
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' })); // newer request
    expect(await screen.findByLabelText('Payout status: Settlement processing')).toBeTruthy();

    resolveOld(approved);
    await Promise.resolve();
    expect(screen.getByLabelText('Payout status: Settlement processing')).toBeTruthy();
    expect(screen.queryByLabelText('Payout status: Approved for settlement')).toBeNull();
  });
});
