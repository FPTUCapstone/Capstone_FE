import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

describe('LogoutButton navbar layout', () => {
  it('keeps the logout action at the compact navbar control height', () => {
    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /Đăng xuất/i });

    expect(button.className).toContain('min-h-9');
    expect(button.className).toContain('text-xs');
    expect(button.className).not.toContain('h-11');
  });

  it('portals the fixed dialog outside the filtered sticky header', () => {
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole('button', { name: /Đăng xuất/i }));

    const dialog = screen.getByRole('dialog');
    const overlay = dialog.parentElement;

    expect(overlay?.className).toContain('fixed');
    expect(overlay?.parentElement).toBe(document.body);
  });

  it('offers a single current-session logout action', async () => {
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole('button', { name: /Đăng xuất/i }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByRole('radiogroup')).toBeNull();
    expect(within(dialog).getAllByRole('button')).toHaveLength(2);

    fireEvent.click(within(dialog).getByRole('button', { name: 'Đăng xuất' }));

    await waitFor(() => expect(mocks.webLogout).toHaveBeenCalledTimes(1));
  });
});
