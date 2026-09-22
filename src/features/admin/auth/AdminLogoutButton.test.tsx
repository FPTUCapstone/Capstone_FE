import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mocks.replace,
    refresh: mocks.refresh,
  }),
}));

import AdminLogoutButton from './AdminLogoutButton';

describe('AdminLogoutButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.replace.mockReset();
    mocks.refresh.mockReset();
  });

  it('deletes the current admin session and redirects only after logout succeeds', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));

    render(<AdminLogoutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out of administration' }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Đăng xuất' }),
    );

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/admin/login'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/session');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'DELETE' });
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('keeps the admin signed in after an HTTP error and allows a successful retry', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    render(<AdminLogoutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out of administration' }));

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Đăng xuất' }));

    expect((await within(dialog).findByRole('alert')).textContent).toBe(
      'Không thể đăng xuất. Vui lòng thử lại.',
    );
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
    await waitFor(() => {
      const retryButton = within(dialog).getByRole('button', { name: 'Đăng xuất' });
      expect((retryButton as HTMLButtonElement).disabled).toBe(false);
    });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Đăng xuất' }));

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/admin/login'));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['network failure', new TypeError('Failed to fetch')],
    ['request timeout', new DOMException('The operation was aborted', 'AbortError')],
  ])('keeps the admin signed in after %s', async (_case, error) => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(error);

    render(<AdminLogoutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out of administration' }));

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Đăng xuất' }));

    expect((await within(dialog).findByRole('alert')).textContent).toBe(
      'Không thể đăng xuất. Vui lòng thử lại.',
    );
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
