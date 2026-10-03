import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AvailableChangePasswordCapability } from '../changePasswordCapability';
import { ChangePasswordForm } from '../ChangePasswordForm';

function availableCapability(
  execute = vi.fn<AvailableChangePasswordCapability['execute']>().mockResolvedValue(undefined),
): AvailableChangePasswordCapability {
  return { status: 'available', execute };
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Mật khẩu hiện tại'), {
    target: { value: 'CurrentPass123!' },
  });
  fireEvent.change(screen.getByLabelText('Mật khẩu mới'), {
    target: { value: 'NewSecurePass456@' },
  });
  fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu mới'), {
    target: { value: 'NewSecurePass456@' },
  });
}

describe('ChangePasswordForm', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the completed form and user identity', () => {
    render(
      <ChangePasswordForm
        userDisplay={{
          name: 'Nguyen Van A',
          email: 'vana@example.com',
          role: 'Traveler',
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Đổi mật khẩu' })).toBeDefined();
    expect(screen.getByText('Nguyen Van A')).toBeDefined();
    expect(screen.getByText('vana@example.com')).toBeDefined();
    expect(screen.getByText('Traveler')).toBeDefined();
    expect(screen.getByLabelText('Mật khẩu hiện tại')).toBeDefined();
    expect(screen.getByLabelText('Mật khẩu mới')).toBeDefined();
    expect(screen.getByLabelText('Xác nhận mật khẩu mới')).toBeDefined();
  });

  it('shows the pending-backend notice, disables submission accessibly, and never calls fetch', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(<ChangePasswordForm />);

    expect(screen.getByText('Tính năng đổi mật khẩu đang chờ tích hợp máy chủ.')).toBeDefined();
    expect(screen.getByText('Bạn chưa thể cập nhật mật khẩu ở thời điểm hiện tại.')).toBeDefined();
    expect(container.querySelector('[data-integration-status="PENDING_BE_INTEGRATION"]')).not.toBeNull();

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
    expect(submitButton.getAttribute('aria-describedby')).toBe(
      'change-password-pending-description',
    );

    fireEvent.submit(container.querySelector('form')!);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText(/Mật khẩu đã được cập nhật thành công/)).toBeNull();
  });

  it('keeps the action available only for an injected available capability', () => {
    render(<ChangePasswordForm capability={availableCapability()} />);

    expect(screen.queryByText(/đang chờ tích hợp máy chủ/)).toBeNull();

    const currentPasswordInput = screen.getByLabelText('Mật khẩu hiện tại') as HTMLInputElement;
    const newPasswordInput = screen.getByLabelText('Mật khẩu mới') as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText('Xác nhận mật khẩu mới') as HTMLInputElement;

    expect(currentPasswordInput.disabled).toBe(false);
    expect(newPasswordInput.disabled).toBe(false);
    expect(confirmPasswordInput.disabled).toBe(false);

    expect(
      (screen.getByRole('button', { name: 'Đổi mật khẩu' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it('presents Vietnamese validation without executing the capability', async () => {
    const capability = availableCapability();
    render(<ChangePasswordForm capability={capability} />);

    fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    expect(await screen.findByText('Vui lòng nhập mật khẩu hiện tại.')).toBeDefined();
    expect(screen.getByText('Vui lòng nhập mật khẩu mới.')).toBeDefined();
    expect(screen.getByText('Vui lòng xác nhận mật khẩu mới.')).toBeDefined();
    expect(capability.execute).not.toHaveBeenCalled();
  });

  it('shows real success only after an injected capability resolves', async () => {
    const capability = availableCapability();
    render(<ChangePasswordForm capability={capability} />);
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    await waitFor(() => {
      expect(capability.execute).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Mật khẩu đã được cập nhật thành công/)).toBeDefined();
    });
  });

  it('shows a safe error when an injected capability rejects', async () => {
    const capability = availableCapability(
      vi.fn<AvailableChangePasswordCapability['execute']>().mockRejectedValue(new Error('failed')),
    );
    render(<ChangePasswordForm capability={capability} />);
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    expect(await screen.findByText('Không thể đổi mật khẩu. Vui lòng thử lại.')).toBeDefined();
    expect(screen.queryByText(/Mật khẩu đã được cập nhật thành công/)).toBeNull();
  });

  it('preserves cancel navigation and password visibility controls', () => {
    const onCancel = vi.fn();
    render(<ChangePasswordForm capability={availableCapability()} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    const currentPasswordInput = screen.getByLabelText('Mật khẩu hiện tại') as HTMLInputElement;
    expect(currentPasswordInput.type).toBe('password');
    fireEvent.click(screen.getByRole('button', { name: 'Show Mật khẩu hiện tại' }));
    expect(currentPasswordInput.type).toBe('text');
  });
});
