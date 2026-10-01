import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));

import { AdminChangePasswordView } from '../AdminChangePasswordView';

describe('AdminChangePasswordView', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders the guarded Admin view pending backend integration without a network request or fake identity card', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(<AdminChangePasswordView />);

    expect(screen.getByRole('heading', { name: 'Đổi mật khẩu' })).toBeDefined();
    expect(screen.queryByText('admin@tripmate.vn')).toBeNull();
    expect(screen.getByText('Tính năng đổi mật khẩu đang chờ tích hợp máy chủ.')).toBeDefined();

    const currentPasswordInput = screen.getByLabelText('Mật khẩu hiện tại') as HTMLInputElement;
    const newPasswordInput = screen.getByLabelText('Mật khẩu mới') as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText('Xác nhận mật khẩu mới') as HTMLInputElement;

    expect(currentPasswordInput.disabled).toBe(true);
    expect(newPasswordInput.disabled).toBe(true);
    expect(confirmPasswordInput.disabled).toBe(true);

    const submitButton = screen.getByRole('button', {
      name: 'Đổi mật khẩu',
    }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);

    fireEvent.submit(container.querySelector('form')!);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText(/Mật khẩu đã được cập nhật thành công/)).toBeNull();
  });

  it('navigates back to the admin dashboard when cancel is clicked', () => {
    render(<AdminChangePasswordView />);

    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(mocks.push).toHaveBeenCalledWith('/admin');
  });
});
