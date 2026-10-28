import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CancelPayoutDialog } from './CancelPayoutDialog';

const request = {
  payoutCode: 'PO-202609-000101',
  periodCount: 1,
  periodStart: '2026-09-01',
  periodEnd: '2026-09-30',
  payableNetAmount: 8_000_000,
  status: 'PendingReview' as const,
  requestedAtUtc: '2026-10-01T00:00:00Z',
  settledAtUtc: null,
  rejectionReason: null,
  cancellable: true,
};

describe('CancelPayoutDialog accessibility', () => {
  it('focuses the first control, traps Tab, handles Escape, and restores trigger focus', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const onClose = vi.fn();

    const { unmount } = render(
      <CancelPayoutDialog
        isOpen={true}
        request={request}
        onClose={onClose}
        onConfirmCancel={vi.fn().mockResolvedValue({ success: true })}
      />
    );

    const keepButton = screen.getByRole('button', { name: /Keep Request/i });
    const confirmButton = screen.getByRole('button', { name: /Confirm Cancellation/i });
    expect(document.activeElement).toBe(keepButton);

    confirmButton.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(keepButton);

    keepButton.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(confirmButton);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
