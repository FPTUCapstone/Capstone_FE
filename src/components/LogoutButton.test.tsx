import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  webLogout: vi.fn(),
  webLogoutAll: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mocks.replace,
    refresh: mocks.refresh,
  }),
}));

vi.mock('@/lib/authApi', () => ({
  webLogout: mocks.webLogout,
  webLogoutAll: mocks.webLogoutAll,
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
});
