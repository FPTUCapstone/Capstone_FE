import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

import { AdminChangePasswordView } from '../AdminChangePasswordView';

describe('AdminChangePasswordView', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the guarded Admin view pending backend integration without a network request', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(<AdminChangePasswordView />);

    expect(screen.getByRole('heading', { name: 'Đổi mật khẩu' })).toBeDefined();
    expect(screen.getAllByText('Administrator').length).toBe(2);
    expect(screen.getByText('Tính năng đổi mật khẩu đang chờ tích hợp máy chủ.')).toBeDefined();
    expect(
      (screen.getByRole('button', { name: 'Đổi mật khẩu' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    fireEvent.submit(container.querySelector('form')!);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText(/Mật khẩu đã được cập nhật thành công/)).toBeNull();
  });
});
