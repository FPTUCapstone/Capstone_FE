import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountModerationForm } from './AccountModerationForm';

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const actions = [
  { locked: false, action: 'lock', button: 'Lock account', confirm: 'Confirm lock', reasonLabel: 'Reason for locking',
    success: 'Account locked. The account holder has been notified.' },
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
    render(<AccountModerationForm accountId="42" locked={action.locked} />);
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
    render(<AccountModerationForm accountId="42" locked={action.locked} />);
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
    render(<AccountModerationForm accountId="42" locked={action.locked} />);
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
    render(<AccountModerationForm accountId="42" locked={action.locked} />);
    const dialog = openConfirmation(action);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close confirmation' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(request).not.toHaveBeenCalled();
  });

  it.each(actions)('sends one $action request on double confirm and blocks dismissal while pending', async (action) => {
    let resolveRequest!: (response: Response) => void;
    const request = vi.fn().mockReturnValue(new Promise<Response>((resolve) => { resolveRequest = resolve; }));
    vi.stubGlobal('fetch', request);
    render(<AccountModerationForm accountId="42" locked={action.locked} />);
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
    const view = render(<AccountModerationForm accountId="42" locked={action.locked} />);
    fireEvent.click(within(openConfirmation(action)).getByRole('button', { name: action.confirm }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    view.rerender(<AccountModerationForm accountId="42" locked={!action.locked} />);
    expect(screen.getByRole('status').textContent).toContain(action.success);
    expect(screen.getByRole('button', { name: action.locked ? 'Lock account' : 'Unlock account' })).toBeTruthy();
  });

  it.each([400, 401, 403, 404, 409])('preserves the API error response for %i without success feedback', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ title: `Denied ${status}` }, { status })));
    render(<AccountModerationForm accountId="42" locked={false} />);
    fireEvent.click(within(openConfirmation(actions[0])).getByRole('button', { name: 'Confirm lock' }));
    expect((await screen.findByRole('alert')).textContent).toBe(`Denied ${status}`);
    expect(screen.queryByRole('status')).toBeNull();
    expect(refresh).not.toHaveBeenCalled();
    expect((screen.getByLabelText('Reason for locking') as HTMLTextAreaElement).value).toBe('Resolved');
  });

  it('preserves the network failure message without success feedback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network unavailable')));
    render(<AccountModerationForm accountId="42" locked={false} />);
    fireEvent.click(within(openConfirmation(actions[0])).getByRole('button', { name: 'Confirm lock' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Account management is temporarily unavailable.');
    expect(screen.queryByRole('status')).toBeNull();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('requires a nonblank reason of at most 200 characters, including programmatic submission', () => {
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    render(<AccountModerationForm accountId="42" locked={false} />);
    const input = screen.getByLabelText('Reason for locking') as HTMLTextAreaElement;
    const button = screen.getByRole('button', { name: 'Lock account' }) as HTMLButtonElement;
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
    render(<AccountModerationForm accountId="42" locked={false} />);
    const dialog = openConfirmation(actions[0]);
    const first = within(dialog).getByRole('button', { name: 'Close confirmation' });
    const last = within(dialog).getByRole('button', { name: 'Confirm lock' });
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('allows dismissing the success toast', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ updated: true })));
    render(<AccountModerationForm accountId="42" locked={false} />);
    fireEvent.click(within(openConfirmation(actions[0])).getByRole('button', { name: 'Confirm lock' }));
    await screen.findByRole('status');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByRole('status')).toBeNull();
  });
});
