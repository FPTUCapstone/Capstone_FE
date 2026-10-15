import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  execute: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));

vi.mock('../adminChangePasswordCapability', () => ({
  createAdminChangePasswordCapability: () => ({ status: 'available', execute: mocks.execute }),
}));

import { AdminChangePasswordView } from '../AdminChangePasswordView';

describe('AdminChangePasswordView', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders the guarded Admin view with the production capability available and no fake identity card', () => {
    const { container } = render(<AdminChangePasswordView />);

    expect(screen.getByRole('heading', { name: 'Đổi mật khẩu' })).toBeDefined();
    expect(screen.queryByText('admin@tripmate.vn')).toBeNull();
    expect(screen.queryByText('Tính năng đổi mật khẩu đang chờ tích hợp máy chủ.')).toBeNull();

    const currentPasswordInput = screen.getByLabelText('Mật khẩu hiện tại') as HTMLInputElement;
    const newPasswordInput = screen.getByLabelText('Mật khẩu mới') as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText('Xác nhận mật khẩu mới') as HTMLInputElement;

    expect(currentPasswordInput.disabled).toBe(false);
    expect(newPasswordInput.disabled).toBe(false);
    expect(confirmPasswordInput.disabled).toBe(false);

    const submitButton = screen.getByRole('button', {
      name: 'Đổi mật khẩu',
    }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(false);

    fireEvent.submit(container.querySelector('form')!);
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(screen.queryByText(/Mật khẩu đã được cập nhật thành công/)).toBeNull();
  });

  it('submits a valid form through the injected production capability', async () => {
    mocks.execute.mockResolvedValue(undefined);
    const { container } = render(<AdminChangePasswordView />);

    fireEvent.change(screen.getByLabelText('Mật khẩu hiện tại'), {
      target: { value: 'CurrentPass123!' },
    });
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), {
      target: { value: 'NewSecurePass456@' },
    });
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu mới'), {
      target: { value: 'NewSecurePass456@' },
    });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(mocks.execute).toHaveBeenCalledWith({
        currentPassword: 'CurrentPass123!',
        newPassword: 'NewSecurePass456@',
        confirmPassword: 'NewSecurePass456@',
      });
    });
  });

  it('navigates back to the admin dashboard when cancel is clicked', () => {
    render(<AdminChangePasswordView />);

    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(mocks.push).toHaveBeenCalledWith('/admin');
  });
});
