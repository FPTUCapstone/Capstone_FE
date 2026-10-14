import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestPayoutDialog } from './RequestPayoutDialog';
import type { SettlementPeriodDto } from '../../types/payoutLifecycle';

describe('RequestPayoutDialog (Screen #92)', () => {
  const mockPeriod: SettlementPeriodDto = {
    id: 'per-101-08-2026',
    operatorUserId: 101,
    periodCode: 'PER-2026-08',
    periodLabel: '01/08/2026 - 31/08/2026',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    completedToursCount: 2,
    grossRevenue: 19600000,
    commission: 1960000,
    payableNetAmount: 17640000,
    status: 'Closed',
    hasPendingPayout: false,
  };

  const mockBank = {
    operatorUserId: 101,
    accountHolder: 'NGUYEN VAN AN',
    bankName: 'Vietcombank',
    accountNumber: '1029384756',
  };

  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn().mockResolvedValue(true);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders period summary and read-only payable net amount', () => {
    render(
      <RequestPayoutDialog
        isOpen={true}
        period={mockPeriod}
        bankInfo={mockBank}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/01\/08\/2026 - 31\/08\/2026/i)).toBeDefined();
    expect(screen.getByText(/17\.640\.000 ₫/i)).toBeDefined();
    expect(screen.getByText(/NGUYEN VAN AN/i)).toBeDefined();
    expect(screen.getByText(/1029384756/i)).toBeDefined();
  });

  it('enforces CR-05 confirmation checkbox: submit is disabled until checked', () => {
    render(
      <RequestPayoutDialog
        isOpen={true}
        period={mockPeriod}
        bankInfo={mockBank}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const submitBtn = screen.getByRole('button', {
      name: /Confirm Payout Request/i,
    });
    expect(submitBtn.hasAttribute('disabled')).toBe(true);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(submitBtn.hasAttribute('disabled')).toBe(false);

    fireEvent.click(submitBtn);
    expect(mockOnSubmit).toHaveBeenCalledWith('per-101-08-2026', mockBank);
  });

  it('calls onClose when Cancel or Escape key is pressed', () => {
    render(
      <RequestPayoutDialog
        isOpen={true}
        period={mockPeriod}
        bankInfo={mockBank}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
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
      <RequestPayoutDialog
        isOpen={true}
        period={mockPeriod}
        bankInfo={mockBank}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
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
    let resolveSubmit: ((value: boolean) => void) | undefined;
    const pendingSubmit = vi.fn(
      () => new Promise<boolean>((resolve) => { resolveSubmit = resolve; })
    );

    render(
      <RequestPayoutDialog
        isOpen={true}
        period={mockPeriod}
        bankInfo={mockBank}
        onClose={mockOnClose}
        onSubmit={pendingSubmit}
      />
    );

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Payout Request/i }));

    const closeButton = screen.getByRole('button', { name: /Close dialog/i });
    expect(closeButton.hasAttribute('disabled')).toBe(true);
    fireEvent.click(closeButton);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).not.toHaveBeenCalled();

    resolveSubmit?.(false);
  });
});
