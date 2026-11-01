import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PayoutSettlementDetailScreen } from './PayoutSettlementDetailScreen';
import {
  PayoutSettlementError,
  authorizeSettlement,
  fetchSettlementDetail,
} from './payoutSettlementService';
import { approved, processing } from './settlementFixtures';

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
const authorizeMock = vi.mocked(authorizeSettlement);
const accepted = {
  payoutId: '123', payoutCode: 'PO-000123', status: 'SettlementProcessing' as const, authorizedAtUtc: '2026-11-01T09:00:00+00:00',
};

async function openDialog() {
  render(<PayoutSettlementDetailScreen payoutId="123" />);
  fireEvent.click(await screen.findByRole('button', { name: 'Authorize settlement' }));
  return screen.findByRole('dialog');
}

const confirmButton = () => screen.getByRole('button', { name: /Confirm settlement|Authorizing/ });

describe('settlement action area', () => {
  beforeEach(() => {
    replace.mockClear();
    fetchMock.mockReset().mockResolvedValue(approved);
    authorizeMock.mockReset();
  });

  it('offers Authorize only for a payout waiting for authorization', async () => {
    render(<PayoutSettlementDetailScreen payoutId="123" />);
    const button = await screen.findByRole('button', { name: 'Authorize settlement' }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it.each([
    ['SettlementProcessing', /runs automatically/],
    ['Settled', /no further action/i],
    ['SettlementFailed', /no further action/i],
  ] as const)('shows no button for %s', async (status, text) => {
    fetchMock.mockResolvedValue({ ...processing, status });
    render(<PayoutSettlementDetailScreen payoutId="123" />);
    const area = await screen.findByRole('region', { name: 'Settlement action' });
    expect(within(area).queryByRole('button')).toBeNull();
    expect(area.textContent).toMatch(text);
  });

  it('disables the button and explains when the bank is not in the standard list', async () => {
    fetchMock.mockResolvedValue({ ...approved, bankBinResolved: false });
    render(<PayoutSettlementDetailScreen payoutId="123" />);
    const button = await screen.findByRole('button', { name: 'Authorize settlement' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(screen.getByText(/does not match the standard bank list/)).toBeTruthy();
    expect(button.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('disables the button when the beneficiary is incomplete', async () => {
    fetchMock.mockResolvedValue({
      ...approved, beneficiary: { bankName: 'Vietcombank', accountHolder: null, maskedAccountNumber: '****1234' },
    });
    render(<PayoutSettlementDetailScreen payoutId="123" />);
    const button = await screen.findByRole('button', { name: 'Authorize settlement' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(screen.getByText(/not completed the bank account details/)).toBeTruthy();
  });
});

describe('authorize dialog', () => {
  beforeEach(() => {
    replace.mockClear();
    fetchMock.mockReset().mockResolvedValue(approved);
    authorizeMock.mockReset();
  });

  it('shows the payout, the amount, the masked beneficiary and the warning before anything is sent', async () => {
    const dialog = await openDialog();
    expect(within(dialog).getByRole('heading', { name: 'Authorize PO-000123' })).toBeTruthy();
    expect(dialog.textContent).toContain('Hoi An Tours');
    expect(dialog.textContent).toMatch(/10\.800\.000/);
    expect(dialog.textContent).toContain('Vietcombank');
    expect(dialog.textContent).toContain('Nguyen Van A');
    expect(dialog.textContent).toContain('****1234');
    expect(dialog.textContent).toContain('you do not transfer money yourself');
    expect(within(dialog).queryByRole('textbox')).toBeNull();
    expect(authorizeMock).not.toHaveBeenCalled();
  });

  it('cancels without sending anything', async () => {
    const dialog = await openDialog();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(authorizeMock).not.toHaveBeenCalled();
  });

  it('closes on Escape when no request is in flight', async () => {
    await openDialog();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('sends exactly one request on a double click and then shows the processing payout', async () => {
    let finish: (value: typeof accepted) => void = () => {};
    authorizeMock.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    fetchMock.mockResolvedValueOnce(approved).mockResolvedValueOnce(processing);

    await openDialog();
    fireEvent.click(confirmButton());
    fireEvent.click(confirmButton());
    expect(authorizeMock).toHaveBeenCalledTimes(1);
    expect((confirmButton() as HTMLButtonElement).disabled).toBe(true);

    finish(accepted);
    expect(await screen.findByLabelText('Payout status: Settlement processing')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Settlement authorized. The transfer is being processed.')).toBeTruthy();
    expect(authorizeMock).toHaveBeenCalledWith('123');
  });

  it('does not close on Escape while the request is in flight', async () => {
    authorizeMock.mockReturnValue(new Promise(() => {}));
    await openDialog();
    fireEvent.click(confirmButton());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('on 409 closes the dialog, warns and shows the reloaded status', async () => {
    authorizeMock.mockRejectedValue(
      new PayoutSettlementError(409, 'payout.not_approved_for_settlement', 'x', 'SettlementProcessing'),
    );
    fetchMock.mockResolvedValueOnce(approved).mockResolvedValueOnce(processing);

    await openDialog();
    fireEvent.click(confirmButton());

    expect(await screen.findByText(/no longer waiting for authorization/)).toBeTruthy();
    expect(await screen.findByLabelText('Payout status: Settlement processing')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it.each([
    ['payout.beneficiary_incomplete', /bank account details are incomplete/],
    ['payout.bank_bin_unresolved', /does not match the standard bank list/],
    ['payout.amount_invalid', /cannot be sent/],
    ['payout.something_else', /could not be authorized/],
  ])('on 422 %s closes the dialog, shows the mapped error and reloads', async (errorCode, text) => {
    authorizeMock.mockRejectedValue(new PayoutSettlementError(422, errorCode, 'x'));
    await openDialog();
    fireEvent.click(confirmButton());

    expect(await screen.findByText(text)).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('on 404 shows the payout as unavailable', async () => {
    authorizeMock.mockRejectedValue(new PayoutSettlementError(404, 'payout.not_found'));
    await openDialog();
    fireEvent.click(confirmButton());
    expect(await screen.findByText('The requested payout record was not found.')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('on 403 shows access denied', async () => {
    authorizeMock.mockRejectedValue(new PayoutSettlementError(403));
    await openDialog();
    fireEvent.click(confirmButton());
    expect(await screen.findByText('You do not have permission to access this function.')).toBeTruthy();
  });

  it('on 401 redirects to sign-in with the detail URL', async () => {
    authorizeMock.mockRejectedValue(new PayoutSettlementError(401));
    await openDialog();
    fireEvent.click(confirmButton());
    await waitFor(() => expect(replace).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Fpayouts%2Fsettlement%2F123',
    ));
  });

  it.each([[503], [0]])('on %i keeps the dialog open with a message and allows a manual retry', async (status) => {
    authorizeMock.mockRejectedValueOnce(new PayoutSettlementError(status)).mockResolvedValueOnce(accepted);
    fetchMock.mockResolvedValueOnce(approved).mockResolvedValueOnce(processing);

    const dialog = await openDialog();
    fireEvent.click(confirmButton());

    expect(await within(dialog).findByText(/temporarily unable to process your request/)).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect((confirmButton() as HTMLButtonElement).disabled).toBe(false);
    expect(authorizeMock).toHaveBeenCalledTimes(1);

    fireEvent.click(confirmButton());
    expect(await screen.findByLabelText('Payout status: Settlement processing')).toBeTruthy();
    expect(authorizeMock).toHaveBeenCalledTimes(2);
  });

  it('never shows the full account number anywhere', async () => {
    const dialog = await openDialog();
    expect(document.body.textContent).not.toMatch(/\d{9,}/);
    expect(dialog.textContent).toContain('****1234');
  });
});
