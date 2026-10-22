import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestPayoutDialog } from './RequestPayoutDialog';
import type { AvailableBalanceDto, SettlementMonthDto } from '../../types/payoutLifecycle';

describe('RequestPayoutDialog (UC-46)', () => {
  const mockBalance: AvailableBalanceDto = {
    periodCount: 2,
    paymentsReceived: 23_600_000,
    discountsGiven: 0,
    refundedAmount: 0,
    netSales: 23_600_000,
    commissionAmount: 2_360_000,
    adjustmentsOutstanding: 0,
    payableNetAmount: 21_240_000,
    requestable: true,
    blockReason: null,
    activePayoutCode: null,
  };

  const mockClaimedMonths: SettlementMonthDto[] = [
    {
      year: 2026, month: 7, monthStatus: 'Closed', eligibleBookingCount: 1,
      paymentsReceived: 4_000_000, discountsGiven: 0, refundedAmount: 0, netSales: 4_000_000,
      commissionAmount: 400_000, payableNetAmount: 3_600_000,
      coverage: 'AvailableBalance', payoutCode: null,
    },
    {
      year: 2026, month: 8, monthStatus: 'Closed', eligibleBookingCount: 2,
      paymentsReceived: 19_600_000, discountsGiven: 0, refundedAmount: 0, netSales: 19_600_000,
      commissionAmount: 1_960_000, payableNetAmount: 17_640_000,
      coverage: 'AvailableBalance', payoutCode: null,
    },
  ];

  const mockBank = {
    bankName: 'Vietcombank',
    accountHolderName: 'NGUYEN VAN AN',
    maskedAccountNumber: '******4756',
    updatedAtUtc: '2026-07-01T00:00:00Z',
  };

  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn().mockResolvedValue({ success: true });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the claimed months and read-only payable net amount', () => {
    render(
      <RequestPayoutDialog isOpen={true} balance={mockBalance} claimedMonths={mockClaimedMonths} bankInfo={mockBank} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/July 2026/i)).toBeDefined();
    expect(screen.getByText(/August 2026/i)).toBeDefined();
    expect(screen.getByText(/21\.240\.000 ₫/i)).toBeDefined();
    expect(screen.getByText(/NGUYEN VAN AN/i)).toBeDefined();
    expect(screen.getByText(/\*{6}4756/)).toBeDefined();
    expect(screen.queryByText('1029384756')).toBeNull();
  });

  it('enforces CR-05 confirmation checkbox: submit is disabled until checked', () => {
    render(
      <RequestPayoutDialog isOpen={true} balance={mockBalance} claimedMonths={mockClaimedMonths} bankInfo={mockBank} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    const submitBtn = screen.getByRole('button', { name: /Confirm Payout Request/i });
    expect(submitBtn.hasAttribute('disabled')).toBe(true);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(submitBtn.hasAttribute('disabled')).toBe(false);

    fireEvent.click(submitBtn);
    expect(mockOnSubmit).toHaveBeenCalledWith();
  });

  it('shows the server error message inline and keeps the dialog open on failure', async () => {
    const failingSubmit = vi.fn().mockResolvedValue({ success: false, errorCode: 'ACTIVE_PAYOUT_EXISTS' });
    render(
      <RequestPayoutDialog isOpen={true} balance={mockBalance} claimedMonths={mockClaimedMonths} bankInfo={mockBank} onClose={mockOnClose} onSubmit={failingSubmit} />
    );

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Payout Request/i }));

    expect(await screen.findByRole('alert')).toBeDefined();
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancel or Escape key is pressed', () => {
    render(
      <RequestPayoutDialog isOpen={true} balance={mockBalance} claimedMonths={mockClaimedMonths} bankInfo={mockBank} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });

  it('focuses the first control, traps Tab in both directions, and restores trigger focus', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = render(
      <RequestPayoutDialog isOpen={true} balance={mockBalance} claimedMonths={mockClaimedMonths} bankInfo={mockBank} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    const closeButton = screen.getByRole('button', { name: /Close dialog/i });
    const cancelButton = screen.getByRole('button', { name: /^Cancel$/i });
    expect(document.activeElement).toBe(closeButton);

    cancelButton.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(closeButton);

    closeButton.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(cancelButton);

    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('keeps every close path locked while payout submission is pending', async () => {
    let resolveSubmit: ((value: { success: boolean }) => void) | undefined;
    const pendingSubmit = vi.fn(
      () => new Promise<{ success: boolean }>((resolve) => { resolveSubmit = resolve; })
    );

    render(
      <RequestPayoutDialog isOpen={true} balance={mockBalance} claimedMonths={mockClaimedMonths} bankInfo={mockBank} onClose={mockOnClose} onSubmit={pendingSubmit} />
    );

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Payout Request/i }));

    const closeButton = screen.getByRole('button', { name: /Close dialog/i });
    expect(closeButton.hasAttribute('disabled')).toBe(true);
    fireEvent.click(closeButton);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).not.toHaveBeenCalled();

    resolveSubmit?.({ success: false });
  });
});
