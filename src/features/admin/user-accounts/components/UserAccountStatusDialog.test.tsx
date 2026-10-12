import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UserAccountStatusDialog } from '@/features/admin/user-accounts/components/UserAccountStatusDialog';

describe('UserAccountStatusDialog (UC-48 Lock Account)', () => {
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
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    rerender(
      <UserAccountStatusDialog
        accountLabel="second@example.com"
        isOpen
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
});
