import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UserAccountStatusDialog } from '@/features/admin/user-accounts/components/UserAccountStatusDialog';

describe('UserAccountStatusDialog (UC-48 Lock Account & UC-49 Unlock Account)', () => {
  it('renders nothing while closed', () => {
    const { container } = render(
      <UserAccountStatusDialog
        accountLabel="traveler@example.com"
        isOpen={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(container.innerHTML).toBe('');
  });

  it('requires a non-whitespace reason before confirming a lock intent and passes selected category', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <UserAccountStatusDialog
        accountLabel="traveler@example.com"
        isOpen
        operation="lock"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Lock user account' })).toBeTruthy();
    expect(screen.getByText(/traveler@example.com/)).toBeTruthy();

    const reason = screen.getByRole('textbox', { name: 'Internal moderation notes' });
    const confirm = screen.getByRole('button', { name: 'Confirm account lock' }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);

    fireEvent.change(reason, { target: { value: '   ' } });
    expect(confirm.disabled).toBe(true);

    fireEvent.change(reason, { target: { value: 'Repeated payment fraud' } });
    expect(confirm.disabled).toBe(false);
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith({
      reason: 'Repeated payment fraud',
      category: 'Violation of tour safety & travel regulations',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('clears a previous reason before reopening for another account', () => {
    const { rerender } = render(
      <UserAccountStatusDialog
        accountLabel="first@example.com"
        isOpen
        operation="lock"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Internal moderation notes' }), {
      target: { value: 'First account reason' },
    });

    rerender(
      <UserAccountStatusDialog
        accountLabel="first@example.com"
        isOpen={false}
        operation="lock"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    rerender(
      <UserAccountStatusDialog
        accountLabel="second@example.com"
        isOpen
        operation="lock"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(
      (screen.getByRole('textbox', { name: 'Internal moderation notes' }) as HTMLTextAreaElement)
        .value,
    ).toBe('');
    expect((screen.getByRole('button', { name: 'Confirm account lock' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it('keeps keyboard focus inside an open dialog and lets Escape cancel it', () => {
    const onCancel = vi.fn();
    render(
      <UserAccountStatusDialog
        accountLabel="traveler@example.com"
        isOpen
        operation="lock"
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />,
    );

    const reason = screen.getByRole('textbox', { name: 'Internal moderation notes' });
    const confirm = screen.getByRole('button', { name: 'Confirm account lock' });
    const closeBtn = screen.getByLabelText('Close');
    const dialog = screen.getByRole('dialog', { name: 'Lock user account' });

    expect(document.activeElement).toBe(reason);

    fireEvent.change(reason, { target: { value: 'Verified administrative reason' } });

    // Tab forward from last element wraps to first
    confirm.focus();
    fireEvent.keyDown(confirm, { key: 'Tab' });
    expect(document.activeElement).toBe(closeBtn);

    // Shift+Tab backwards from first element wraps to last
    closeBtn.focus();
    fireEvent.keyDown(closeBtn, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(confirm);

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('restores focus to the trigger element when the dialog closes', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Open Dialog';
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const { rerender } = render(
      <UserAccountStatusDialog
        accountLabel="traveler@example.com"
        isOpen
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(document.activeElement).not.toBe(trigger);

    rerender(
      <UserAccountStatusDialog
        accountLabel="traveler@example.com"
        isOpen={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(document.activeElement).toBe(trigger);
    document.body.removeChild(trigger);
  });

  it('renders unlock dialog with lock history area according to SRS 3.9.1.3 and confirms unlock', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <UserAccountStatusDialog
        accountLabel="Trần Văn B (tranvanb.travel@gmail.com)"
        isOpen
        operation="unlock"
        onCancel={onCancel}
        onConfirm={onConfirm}
        lockedReason="Detected irregular payment transactions"
        lockedBy="Admin Security Lead"
        lockedAt="28/01/2026 10:00"
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Unlock user account' })).toBeTruthy();
    expect(screen.getByText('Lock History & Context')).toBeTruthy();
    expect(screen.getByText('Detected irregular payment transactions')).toBeTruthy();
    expect(screen.getByText('Admin Security Lead')).toBeTruthy();
    expect(screen.getByText('28/01/2026 10:00')).toBeTruthy();

    const reason = screen.getByRole('textbox', { name: 'Internal moderation notes' });
    const confirm = screen.getByRole('button', { name: 'Confirm account unlock' }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);

    fireEvent.change(reason, { target: { value: 'Proof of address and KYC verified' } });
    expect(confirm.disabled).toBe(false);

    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith({
      reason: 'Proof of address and KYC verified',
      category: 'Complaint resolved & verified with traveler',
    });
  });

  it('displays fallback pending integration label when lock history details are omitted', () => {
    render(
      <UserAccountStatusDialog
        accountLabel="traveler@example.com"
        isOpen
        operation="unlock"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Unlock user account' })).toBeTruthy();
    expect(screen.getAllByText('Unavailable pending backend integration').length).toBe(3);
  });
});
