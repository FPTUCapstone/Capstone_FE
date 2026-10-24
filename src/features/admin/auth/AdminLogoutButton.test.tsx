import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('@/lib/authApi', () => ({ webLogout: mocks.webLogout }));

import AdminLogoutButton from './AdminLogoutButton';

const LOGOUT_ERROR = 'Unable to sign out of the administration workspace. Please try again.';

describe('AdminLogoutButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.replace.mockReset();
    mocks.refresh.mockReset();
    mocks.webLogout.mockReset();
  });

  it('signs out through the web logout and redirects to sign-in only after it succeeds', async () => {
    mocks.webLogout.mockResolvedValue(undefined);

    render(<AdminLogoutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out of administration' }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: /Log out|Đăng xuất/i }),
    );

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/sign-in'));
    expect(mocks.webLogout).toHaveBeenCalledTimes(1);
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('sends one request when two confirmations arrive before React re-renders', async () => {
    let resolveLogout!: () => void;
    mocks.webLogout.mockImplementation(
      () => new Promise<void>((resolve) => {
        resolveLogout = resolve;
      }),
    );

    render(<AdminLogoutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out of administration' }));

    const confirm = within(screen.getByRole('dialog')).getByRole('button', {
      name: /Log out|Đăng xuất/i,
    });
    act(() => {
      confirm.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      confirm.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mocks.webLogout).toHaveBeenCalledTimes(1);

    resolveLogout();
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/sign-in'));
  });

  it('keeps the admin signed in after a failed logout and allows a successful retry', async () => {
    mocks.webLogout
      .mockRejectedValueOnce({ status: 500, message: 'internal detail' })
      .mockResolvedValueOnce(undefined);

    render(<AdminLogoutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out of administration' }));

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /Log out|Đăng xuất/i }));

    expect((await within(dialog).findByRole('alert')).textContent).toBe(LOGOUT_ERROR);
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
    await waitFor(() => {
      const retryButton = within(dialog).getByRole('button', { name: /Log out|Đăng xuất/i });
      expect((retryButton as HTMLButtonElement).disabled).toBe(false);
    });

    fireEvent.click(within(dialog).getByRole('button', { name: /Log out|Đăng xuất/i }));

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/sign-in'));
    expect(mocks.webLogout).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['network failure', { code: 'NETWORK', message: 'Sign out unavailable.', status: 0 }],
    ['request timeout', new DOMException('The operation was aborted', 'AbortError')],
  ])('keeps the admin signed in after %s', async (_case, error) => {
    mocks.webLogout.mockRejectedValue(error);

    render(<AdminLogoutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out of administration' }));

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /Log out|Đăng xuất/i }));

    expect((await within(dialog).findByRole('alert')).textContent).toBe(LOGOUT_ERROR);
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
