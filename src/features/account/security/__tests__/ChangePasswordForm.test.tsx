import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../changePasswordApi';
import { ChangePasswordForm } from '../ChangePasswordForm';

vi.mock('../changePasswordApi', () => ({
  changePassword: vi.fn(),
}));

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with title, subtitle, and input fields', () => {
    render(<ChangePasswordForm />);

    expect(screen.getByRole('heading', { name: 'Đổi mật khẩu' })).toBeDefined();
    expect(screen.getByText(/Nhập mật khẩu hiện tại và mật khẩu mới/)).toBeDefined();
    expect(screen.getByLabelText('Mật khẩu hiện tại')).toBeDefined();
    expect(screen.getByLabelText('Mật khẩu mới')).toBeDefined();
    expect(screen.getByLabelText('Xác nhận mật khẩu mới')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Đổi mật khẩu' })).toBeDefined();
  });

  it('renders user display information and role badge when provided', () => {
    render(
      <ChangePasswordForm
        userDisplay={{
          name: 'Nguyen Van A',
          email: 'vana@example.com',
          role: 'Traveler',
        }}
      />,
    );

    expect(screen.getByText('Nguyen Van A')).toBeDefined();
    expect(screen.getByText('vana@example.com')).toBeDefined();
    expect(screen.getByText('Traveler')).toBeDefined();
    expect(screen.getByText('NA')).toBeDefined(); // Initials
  });

  it('displays inline validation errors when submitted empty', async () => {
    render(<ChangePasswordForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập mật khẩu hiện tại.')).toBeDefined();
      expect(screen.getByText('Vui lòng nhập mật khẩu mới.')).toBeDefined();
      expect(screen.getByText('Vui lòng xác nhận mật khẩu mới.')).toBeDefined();
    });
  });

  it('displays success feedback alert after successful submission (MSG18)', async () => {
    vi.mocked(api.changePassword).mockResolvedValueOnce({
      accessToken: 'mock-new-token',
    });

    render(<ChangePasswordForm />);

    fireEvent.change(screen.getByLabelText('Mật khẩu hiện tại'), {
      target: { value: 'CurrentPass123!' },
    });
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), {
      target: { value: 'NewSecurePass456@' },
    });
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu mới'), {
      target: { value: 'NewSecurePass456@' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    await waitFor(() => {
      expect(
        screen.getByText(/Mật khẩu đã được cập nhật thành công/),
      ).toBeDefined();
    });
  });

  it('displays form-level feedback alert when an API error occurs', async () => {
    vi.mocked(api.changePassword).mockRejectedValueOnce({
      code: 'MSG127',
      status: 500,
    });

    render(<ChangePasswordForm />);

    fireEvent.change(screen.getByLabelText('Mật khẩu hiện tại'), {
      target: { value: 'CurrentPass123!' },
    });
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), {
      target: { value: 'NewSecurePass456@' },
    });
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu mới'), {
      target: { value: 'NewSecurePass456@' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          /TripMate tạm thời không thể xử lý yêu cầu. Vui lòng kiểm tra kết nối và thử lại./,
        ),
      ).toBeDefined();
    });
  });

  it('triggers onCancel callback when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<ChangePasswordForm onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: 'Hủy' });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('toggles password visibility when the visibility button is clicked', () => {
    render(<ChangePasswordForm />);

    const currentPasswordInput = screen.getByLabelText(
      'Mật khẩu hiện tại',
    ) as HTMLInputElement;
    expect(currentPasswordInput.type).toBe('password');

    const toggleButton = screen.getByRole('button', {
      name: 'Show Mật khẩu hiện tại',
    });
    fireEvent.click(toggleButton);

    expect(currentPasswordInput.type).toBe('text');
  });
});
