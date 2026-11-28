import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountModerationForm } from './AccountModerationForm';

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const account = { fullName: 'Nguyen Van A', email: null, role: 'TourOperator', statusLabel: 'Pending contract signature' };

const actions = [
  { locked: true, action: 'unlock', button: 'Unlock account', confirm: 'Confirm unlock', reasonLabel: 'Reason for unlocking',
    success: 'Account unlocked. The account holder has been notified.' },
];

function openConfirmation(action: typeof actions[number]) {
  fireEvent.change(screen.getByLabelText(action.reasonLabel), { target: { value: 'Resolved' } });
  const opener = screen.getByRole('button', { name: action.button });
  opener.focus();
  fireEvent.click(opener);
  return screen.getByRole('dialog');
}

describe('AccountModerationForm', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    refresh.mockReset();
  });

  it.each(actions)('requires confirmation before sending $action', async (action) => {
    const request = vi.fn().mockResolvedValue(Response.json({ updated: true }));
    vi.stubGlobal('fetch', request);
    render(<AccountModerationForm accountId="42" locked={action.locked} account={account} />);
    const dialog = openConfirmation(action);
    expect(request).not.toHaveBeenCalled();
    expect(within(dialog).getByText('Are you sure you want to continue? This action may not be reversible.')).toBeTruthy();
    expect(within(dialog).getByText('Resolved')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: action.confirm }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(`/api/admin/users/42/${action.action}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'Resolved' }),
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain(action.success);
    expect((screen.getByLabelText(action.reasonLabel) as HTMLTextAreaElement).value).toBe('');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText(action.reasonLabel)));
  });

  it.each(actions)('cancels $action without sending a request or clearing the reason', (action) => {
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    render(<AccountModerationForm accountId="42" locked={action.locked} account={account} />);
    const dialog = openConfirmation(action);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(request).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect((screen.getByLabelText(action.reasonLabel) as HTMLTextAreaElement).value).toBe('Resolved');
  });

  it.each(actions)('closes $action confirmation with Escape without sending a request', (action) => {
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    render(<AccountModerationForm accountId="42" locked={action.locked} account={account} />);
    const opener = screen.getByRole('button', { name: action.button });
    opener.focus();
    openConfirmation(action);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(request).not.toHaveBeenCalled();
  });

  it.each(actions)('closes $action with the close control without sending a request', (action) => {
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    render(<AccountModerationForm accountId="42" locked={action.locked} account={account} />);
    const dialog = openConfirmation(action);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close confirmation' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(request).not.toHaveBeenCalled();
  });

  it.each(actions)('sends one $action request on double confirm and blocks dismissal while pending', async (action) => {
    let resolveRequest!: (response: Response) => void;
    const request = vi.fn().mockReturnValue(new Promise<Response>((resolve) => { resolveRequest = resolve; }));
    vi.stubGlobal('fetch', request);
    render(<AccountModerationForm accountId="42" locked={action.locked} account={account} />);
    const dialog = openConfirmation(action);
    const confirm = within(dialog).getByRole('button', { name: action.confirm });
    act(() => {
      confirm.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      confirm.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect((within(dialog).getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText(action.reasonLabel) as HTMLTextAreaElement).disabled).toBe(true);
    expect(request).toHaveBeenCalledTimes(1);
    await act(async () => { resolveRequest(Response.json({ updated: true })); });
    expect(refresh).toHaveBeenCalledOnce();
  });

  it.each(actions)('keeps the completed $action success message when refresh updates account status', async (action) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ updated: true })));
    const view = render(<AccountModerationForm accountId="42" locked={action.locked} account={account} />);
    fireEvent.click(within(openConfirmation(action)).getByRole('button', { name: action.confirm }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    view.rerender(<AccountModerationForm accountId="42" locked={!action.locked} account={account} />);
    expect(screen.getByRole('status').textContent).toContain(action.success);
    expect(screen.getByRole('button', { name: action.locked ? 'Lock account' : 'Unlock account' })).toBeTruthy();
  });

  it('moves focus to Lock account when refresh flips the status after a successful unlock', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ updated: true })));
    const view = render(<AccountModerationForm accountId="42" locked={true} account={account} />);
    fireEvent.click(within(openConfirmation(actions[0])).getByRole('button', { name: 'Confirm unlock' }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    view.rerender(<AccountModerationForm accountId="42" locked={false} account={account} />);
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Lock account' }));
  });

  it.each([400, 401, 403, 404, 409])('preserves the API error response for %i without success feedback', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ title: `Denied ${status}` }, { status })));
    render(<AccountModerationForm accountId="42" locked={true} account={account} />);
    fireEvent.click(within(openConfirmation(actions[0])).getByRole('button', { name: 'Confirm unlock' }));
    expect((await screen.findByRole('alert')).textContent).toBe(`Denied ${status}`);
    expect(screen.queryByRole('status')).toBeNull();
    expect(refresh).not.toHaveBeenCalled();
    expect((screen.getByLabelText('Reason for unlocking') as HTMLTextAreaElement).value).toBe('Resolved');
  });

  it('shows the outstanding amount and retains the same reason when Staff retries after settlement', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(Response.json({ messageCode: 'MSG199', outstandingAmountVnd: 1250000 }, { status: 409 }))
      .mockResolvedValueOnce(Response.json({ updated: true }));
    vi.stubGlobal('fetch', request);
    render(<AccountModerationForm accountId="42" locked account={account} />);
    fireEvent.click(within(openConfirmation(actions[0])).getByRole('button', { name: 'Confirm unlock' }));
    expect((await screen.findByRole('alert')).textContent)
      .toBe('This account cannot be unlocked until its outstanding amount of 1.250.000 VND is fully paid.');
    expect(refresh).not.toHaveBeenCalled();
    expect((screen.getByLabelText('Reason for unlocking') as HTMLTextAreaElement).value).toBe('Resolved');

    fireEvent.click(screen.getByRole('button', { name: 'Unlock account' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirm unlock' }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(request.mock.calls[0]).toEqual(request.mock.calls[1]);
  });

  it('shows the account summary and previous lock details in the unlock confirmation', () => {
    render(<AccountModerationForm accountId="42" locked account={{ ...account, statusLabel: 'Locked' }}
      currentLock={{ reason: 'Outstanding balance', actor: 'System', at: '16/11/2026, 01:30:00' }}
    />);
    const dialog = within(openConfirmation(actions[0]));
    expect(dialog.getByText(account.fullName)).toBeTruthy();
    expect(dialog.getByText('Locked')).toBeTruthy();
    expect(dialog.getByText('Outstanding balance')).toBeTruthy();
    expect(dialog.getByText('System')).toBeTruthy();
    expect(dialog.getByText('16/11/2026, 01:30:00')).toBeTruthy();
  });

  it('preserves the network failure message without success feedback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network unavailable')));
    render(<AccountModerationForm accountId="42" locked={true} account={account} />);
    fireEvent.click(within(openConfirmation(actions[0])).getByRole('button', { name: 'Confirm unlock' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Account management is temporarily unavailable.');
    expect(screen.queryByRole('status')).toBeNull();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('requires a nonblank reason of at most 200 characters, including programmatic submission', () => {
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    render(<AccountModerationForm accountId="42" locked={true} account={account} />);
    const input = screen.getByLabelText('Reason for unlocking') as HTMLTextAreaElement;
    const button = screen.getByRole('button', { name: 'Unlock account' }) as HTMLButtonElement;
    expect(input.required).toBe(true);
    expect(input.maxLength).toBe(200);
    expect(button.disabled).toBe(true);
    for (const invalid of [' ', 'x'.repeat(201)]) {
      fireEvent.change(input, { target: { value: invalid } });
      fireEvent.submit(input.closest('form')!);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(request).not.toHaveBeenCalled();
    }
    fireEvent.change(input, { target: { value: 'x'.repeat(200) } });
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('traps keyboard focus inside the confirmation dialog', () => {
    render(<AccountModerationForm accountId="42" locked={true} account={account} />);
    const dialog = openConfirmation(actions[0]);
    const first = within(dialog).getByRole('button', { name: 'Close confirmation' });
    const last = within(dialog).getByRole('button', { name: 'Confirm unlock' });
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('allows dismissing the success toast', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ updated: true })));
    render(<AccountModerationForm accountId="42" locked={true} account={account} />);
    fireEvent.click(within(openConfirmation(actions[0])).getByRole('button', { name: 'Confirm unlock' }));
    await screen.findByRole('status');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByRole('status')).toBeNull();
  });

  describe('lock', () => {
    const MSG123 = 'Please enter a reason.';
    const MSG127 = 'TripMate is temporarily unable to process your request. Please check your connection and try again.';
    const MSG189 = 'Account locked. The account holder has been notified.';
    const firstCategory = 'Violation of tour safety & travel regulations';
    const fraud = 'Payment fraud or irregular chargebacks';

    function renderLock() {
      return render(<AccountModerationForm accountId="42" locked={false} account={account} />);
    }

    function openLockDialog() {
      const opener = screen.getByRole('button', { name: 'Lock account' });
      opener.focus();
      fireEvent.click(opener);
      return screen.getByRole('dialog');
    }

    function fillReason(dialog: HTMLElement, category: string, note: string) {
      fireEvent.change(within(dialog).getByLabelText('Lock reason'), { target: { value: category } });
      fireEvent.change(within(dialog).getByLabelText('Additional details'), { target: { value: note } });
    }

    function confirmButton(dialog: HTMLElement) {
      return within(dialog).getByRole('button', { name: 'Confirm lock' }) as HTMLButtonElement;
    }

    it('opens the lock dialog with the account summary and impact note without sending a request', () => {
      const request = vi.fn();
      vi.stubGlobal('fetch', request);
      renderLock();
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(screen.queryByLabelText('Lock reason')).toBeNull();
      const dialog = openLockDialog();
      expect(within(dialog).getByText('Nguyen Van A')).toBeTruthy();
      expect(within(dialog).getByText('—')).toBeTruthy();
      expect(within(dialog).getByText('TourOperator')).toBeTruthy();
      expect(within(dialog).getByText('Pending contract signature')).toBeTruthy();
      expect(within(dialog).getByText(
        'Locking this account prevents any further sign-in and terminates all of its active sessions.',
      )).toBeTruthy();
      expect(request).not.toHaveBeenCalled();
    });

    it('shows MSG123 and keeps the dialog open when no category is selected', () => {
      const request = vi.fn();
      vi.stubGlobal('fetch', request);
      renderLock();
      const dialog = openLockDialog();
      expect(within(dialog).queryByText(MSG123)).toBeNull();
      fireEvent.click(confirmButton(dialog));
      expect(within(dialog).getByText(MSG123)).toBeTruthy();
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(request).not.toHaveBeenCalled();
    });

    it('sends the composed category and note reason, closes the dialog and refreshes', async () => {
      const request = vi.fn().mockResolvedValue(Response.json({ updated: true }));
      vi.stubGlobal('fetch', request);
      renderLock();
      const dialog = openLockDialog();
      fillReason(dialog, fraud, ' chargebacks ');
      fireEvent.click(confirmButton(dialog));
      await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
      expect(request).toHaveBeenCalledTimes(1);
      expect(request).toHaveBeenCalledWith('/api/admin/users/42/lock', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Payment fraud or irregular chargebacks: chargebacks' }),
      });
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(screen.getByRole('status').textContent).toContain(MSG189);
    });

    it('sends only the trimmed note for Other', async () => {
      const request = vi.fn().mockResolvedValue(Response.json({ updated: true }));
      vi.stubGlobal('fetch', request);
      renderLock();
      const dialog = openLockDialog();
      fillReason(dialog, 'Other', ' spam ');
      fireEvent.click(confirmButton(dialog));
      await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
      expect(request).toHaveBeenCalledWith('/api/admin/users/42/lock', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'spam' }),
      });
    });

    it('treats a whitespace-only note for Other as missing', () => {
      const request = vi.fn();
      vi.stubGlobal('fetch', request);
      renderLock();
      const dialog = openLockDialog();
      fillReason(dialog, 'Other', '   ');
      fireEvent.click(confirmButton(dialog));
      expect(within(dialog).getByText(MSG123)).toBeTruthy();
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(request).not.toHaveBeenCalled();
    });

    it('blocks a composed reason over 200 characters without truncating the note', () => {
      const request = vi.fn();
      vi.stubGlobal('fetch', request);
      renderLock();
      const dialog = openLockDialog();
      fillReason(dialog, 'Other', 'x'.repeat(180));
      fireEvent.change(within(dialog).getByLabelText('Lock reason'), { target: { value: firstCategory } });
      const confirm = confirmButton(dialog);
      expect(confirm.disabled).toBe(true);
      expect(within(dialog).getByText('Reason must be at most 200 characters.')).toBeTruthy();
      expect((within(dialog).getByLabelText('Additional details') as HTMLTextAreaElement).value).toHaveLength(180);
      fireEvent.click(confirm);
      expect(request).not.toHaveBeenCalled();
    });

    it('sends one lock request on double confirm and ignores Escape while pending', async () => {
      let resolveRequest!: (response: Response) => void;
      const request = vi.fn().mockReturnValue(new Promise<Response>((resolve) => { resolveRequest = resolve; }));
      vi.stubGlobal('fetch', request);
      renderLock();
      const dialog = openLockDialog();
      fillReason(dialog, fraud, '');
      const confirm = confirmButton(dialog);
      act(() => {
        confirm.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        confirm.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(confirm.textContent).toBe('Updating…');
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect((within(dialog).getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(true);
      expect((within(dialog).getByLabelText('Lock reason') as HTMLSelectElement).value).toBe(fraud);
      expect(request).toHaveBeenCalledTimes(1);
      await act(async () => { resolveRequest(Response.json({ updated: true })); });
      expect(refresh).toHaveBeenCalledOnce();
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it.each([400, 401, 403, 404, 409, 503])(
      'shows the API error for %i inside the dialog and keeps the draft',
      async (status) => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ title: `Denied ${status}` }, { status })));
        renderLock();
        const dialog = openLockDialog();
        fillReason(dialog, fraud, 'details');
        fireEvent.click(confirmButton(dialog));
        await waitFor(() => expect(within(dialog).getByRole('alert').textContent).toContain(`Denied ${status}`));
        expect(screen.getByRole('dialog')).toBe(dialog);
        expect((within(dialog).getByLabelText('Lock reason') as HTMLSelectElement).value).toBe(fraud);
        expect((within(dialog).getByLabelText('Additional details') as HTMLTextAreaElement).value).toBe('details');
        expect(screen.queryByRole('status')).toBeNull();
        expect(refresh).not.toHaveBeenCalled();
      },
    );

    it('falls back to MSG127 when the error response has no title', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('oops', { status: 500 })));
      renderLock();
      const dialog = openLockDialog();
      fillReason(dialog, fraud, '');
      fireEvent.click(confirmButton(dialog));
      await waitFor(() => expect(within(dialog).getByRole('alert').textContent).toContain(MSG127));
      expect(screen.getByRole('dialog')).toBe(dialog);
    });

    it('shows MSG127 inside the dialog when the request fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network unavailable')));
      renderLock();
      const dialog = openLockDialog();
      fillReason(dialog, fraud, '');
      fireEvent.click(confirmButton(dialog));
      await waitFor(() => expect(within(dialog).getByRole('alert').textContent).toContain(MSG127));
      expect(screen.getByRole('dialog')).toBe(dialog);
      expect(screen.queryByRole('status')).toBeNull();
      expect(refresh).not.toHaveBeenCalled();
    });

    it.each([
      { how: 'Cancel', close: (dialog: HTMLElement) => fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' })) },
      { how: 'Escape', close: () => fireEvent.keyDown(document, { key: 'Escape' }) },
      { how: 'the close control',
        close: (dialog: HTMLElement) => fireEvent.click(within(dialog).getByRole('button', { name: 'Close confirmation' })) },
    ])('closes with $how without a request, keeps the draft and clears old errors', async ({ close }) => {
      const request = vi.fn().mockResolvedValue(Response.json({ title: 'Denied 409' }, { status: 409 }));
      vi.stubGlobal('fetch', request);
      renderLock();
      const opener = screen.getByRole('button', { name: 'Lock account' });

      // A missing-reason error is cleared by closing.
      let dialog = openLockDialog();
      fireEvent.click(confirmButton(dialog));
      expect(within(dialog).getByText(MSG123)).toBeTruthy();
      close(dialog);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(opener);
      dialog = openLockDialog();
      expect(within(dialog).queryByText(MSG123)).toBeNull();

      // A server error is cleared by closing; the draft is kept.
      fillReason(dialog, fraud, 'details');
      fireEvent.click(confirmButton(dialog));
      await waitFor(() => expect(within(dialog).getByRole('alert').textContent).toContain('Denied 409'));
      request.mockClear();
      close(dialog);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(request).not.toHaveBeenCalled();
      dialog = openLockDialog();
      expect((within(dialog).getByLabelText('Lock reason') as HTMLSelectElement).value).toBe(fraud);
      expect((within(dialog).getByLabelText('Additional details') as HTMLTextAreaElement).value).toBe('details');
      expect(within(dialog).queryByRole('alert')).toBeNull();
      expect(request).not.toHaveBeenCalled();
    });

    it('keeps the lock success message and shows Unlock account after refresh flips the status', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ updated: true })));
      const view = renderLock();
      const dialog = openLockDialog();
      fillReason(dialog, fraud, '');
      fireEvent.click(confirmButton(dialog));
      await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
      view.rerender(<AccountModerationForm accountId="42" locked={true} account={account} />);
      expect(screen.getByRole('status').textContent).toContain(MSG189);
      expect(screen.getByRole('button', { name: 'Unlock account' })).toBeTruthy();
    });

    it('keeps keyboard focus inside the dialog on the server error after a failed lock', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ title: 'Denied 409' }, { status: 409 })));
      renderLock();
      const dialog = openLockDialog();
      fillReason(dialog, fraud, '');
      fireEvent.click(confirmButton(dialog));
      await waitFor(() => expect(within(dialog).getByRole('alert').textContent).toContain('Denied 409'));
      expect(dialog.contains(document.activeElement)).toBe(true);
      expect(document.activeElement).toBe(within(dialog).getByRole('alert'));
    });

    it('keeps keyboard focus inside the dialog on MSG127 after a rejected lock request', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network unavailable')));
      renderLock();
      const dialog = openLockDialog();
      fillReason(dialog, fraud, '');
      fireEvent.click(confirmButton(dialog));
      await waitFor(() => expect(within(dialog).getByRole('alert').textContent).toContain(MSG127));
      expect(dialog.contains(document.activeElement)).toBe(true);
      expect(document.activeElement).toBe(within(dialog).getByRole('alert'));
    });

    it('clears the category and note after a successful lock', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ updated: true })));
      renderLock();
      let dialog = openLockDialog();
      fillReason(dialog, fraud, 'details');
      fireEvent.click(confirmButton(dialog));
      await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
      expect(screen.queryByRole('dialog')).toBeNull();
      dialog = openLockDialog();
      expect((within(dialog).getByLabelText('Lock reason') as HTMLSelectElement).value).toBe('');
      expect((within(dialog).getByLabelText('Additional details') as HTMLTextAreaElement).value).toBe('');
    });

    it('replaces a stale server error with MSG123 when the reason is then missing', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ title: 'Denied 409' }, { status: 409 })));
      renderLock();
      const dialog = openLockDialog();
      fillReason(dialog, fraud, '');
      fireEvent.click(confirmButton(dialog));
      await waitFor(() => expect(within(dialog).getByRole('alert').textContent).toContain('Denied 409'));
      fireEvent.change(within(dialog).getByLabelText('Lock reason'), { target: { value: '' } });
      fireEvent.click(confirmButton(dialog));
      expect(within(dialog).getByText(MSG123)).toBeTruthy();
      expect(within(dialog).queryByText('Denied 409')).toBeNull();
    });

    it('moves focus to the unlock reason when refresh flips the status after a successful lock', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ updated: true })));
      const view = renderLock();
      const dialog = openLockDialog();
      fillReason(dialog, fraud, '');
      fireEvent.click(confirmButton(dialog));
      await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
      view.rerender(<AccountModerationForm accountId="42" locked={true} account={account} />);
      expect(document.activeElement).not.toBe(document.body);
      expect(document.activeElement).toBe(screen.getByLabelText('Reason for unlocking'));
    });

    it('traps keyboard focus inside the lock dialog', () => {
      renderLock();
      const dialog = openLockDialog();
      const first = within(dialog).getByRole('button', { name: 'Close confirmation' });
      const last = confirmButton(dialog);
      last.focus();
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(document.activeElement).toBe(first);
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(last);
    });
  });
});
