import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthStorage } from '@/features/auth/session/authSession';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  webLogout: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mocks.replace,
    refresh: mocks.refresh,
  }),
}));

vi.mock('@/lib/authApi', () => ({
  webLogout: mocks.webLogout,
}));

import LogoutButton from './LogoutButton';

import { operatorCommonEn } from '@/features/operator/common/resources/en';

describe('LogoutButton navbar layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AuthStorage.clear();
  });

  it('keeps the logout action at the compact navbar control height', () => {
    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /Log out/i });

    expect(button.className).toContain('min-h-9');
    expect(button.className).toContain('text-xs');
    expect(button.className).not.toContain('h-11');
  });

  it('portals the fixed dialog outside the filtered sticky header', () => {
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole('button', { name: /Log out/i }));

    const dialog = screen.getByRole('dialog');
    const overlay = dialog.parentElement;

    expect(overlay?.className).toContain('fixed');
    expect(overlay?.parentElement).toBe(document.body);
  });

  it('contains keyboard focus and restores it to the trigger after closing', () => {
    render(<LogoutButton />);

    const trigger = screen.getByRole('button', { name: /Log out/i });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog');
    const [cancel, confirm] = within(dialog).getAllByRole('button');
    expect(document.activeElement).toBe(cancel);

    confirm.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(cancel);

    cancel.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(confirm);

    fireEvent.click(cancel);
    expect(document.activeElement).toBe(trigger);
  });

  it('offers a single current-session logout action', async () => {
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole('button', { name: /Log out/i }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByRole('radiogroup')).toBeNull();
    expect(within(dialog).getAllByRole('button')).toHaveLength(2);

    fireEvent.click(within(dialog).getByRole('button', { name: 'Log out' }));

    await waitFor(() => expect(mocks.webLogout).toHaveBeenCalledTimes(1));
  });

  it('sends one request when two confirmations arrive before React re-renders', async () => {
    let resolveLogout!: () => void;
    const pendingLogout = new Promise<void>((resolve) => {
      resolveLogout = resolve;
    });
    mocks.webLogout.mockImplementation(() => pendingLogout);

    render(<LogoutButton />);
    fireEvent.click(screen.getByRole('button', { name: /Log out/i }));

    const confirm = within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Log out',
    });
    act(() => {
      confirm.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      confirm.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mocks.webLogout).toHaveBeenCalledTimes(1);

    resolveLogout();
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/sign-in'));
  });

  it('clears the local session only after the remote logout succeeds', async () => {
    AuthStorage.accept({
      userId: 42,
      email: 'traveler@example.com',
      fullName: 'Traveler',
      role: 'Traveler',
      status: 'Active',
      applicationStatus: null,
      accessToken: 'test-access',
      accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
    }, false);
    mocks.webLogout.mockResolvedValue(undefined);

    render(<LogoutButton />);
    fireEvent.click(screen.getByRole('button', { name: /Log out/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Log out',
    }));

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/sign-in'));
    expect(AuthStorage.getContext()).toBeNull();
  });

  it('keeps the session and offers retry when the remote logout fails', async () => {
    AuthStorage.accept({
      userId: 42,
      email: 'traveler@example.com',
      fullName: 'Traveler',
      role: 'Traveler',
      status: 'Active',
      applicationStatus: null,
      accessToken: 'test-access',
      accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
    }, false);
    mocks.webLogout.mockRejectedValue({ code: 'NETWORK', status: 0 });

    render(<LogoutButton />);
    fireEvent.click(screen.getByRole('button', { name: /Log out/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Log out',
    }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      operatorCommonEn.logout.errorMessage,
    );
    expect(AuthStorage.getContext()?.userId).toBe(42);
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
