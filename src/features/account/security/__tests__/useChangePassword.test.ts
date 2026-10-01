import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  pendingChangePasswordCapability,
  type AvailableChangePasswordCapability,
} from '../changePasswordCapability';
import { useChangePassword } from '../useChangePassword';

function availableCapability(
  execute = vi.fn<AvailableChangePasswordCapability['execute']>().mockResolvedValue(undefined),
): AvailableChangePasswordCapability {
  return { status: 'available', execute };
}

describe('useChangePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function fillValidFields(result: { current: ReturnType<typeof useChangePassword> }) {
    act(() => {
      result.current.setField('currentPassword', 'OldPass123!');
      result.current.setField('newPassword', 'NewSecurePass456@');
      result.current.setField('confirmPassword', 'NewSecurePass456@');
    });
  }

  it('initializes safely with the production capability pending', () => {
    const { result } = renderHook(() => useChangePassword());

    expect(result.current.fields).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    expect(result.current.errors).toEqual({});
    expect(result.current.submitting).toBe(false);
    expect(result.current.success).toBe(false);
    expect(result.current.capabilityStatus).toBe('pending');
  });

  it('prevents submission while backend integration is pending', async () => {
    const { result } = renderHook(() =>
      useChangePassword({ capability: pendingChangePasswordCapability }),
    );
    fillValidFields(result);

    await act(async () => {
      expect(await result.current.handleSubmit()).toBe(false);
    });

    expect(result.current.submitting).toBe(false);
    expect(result.current.success).toBe(false);
    expect(result.current.errors).toEqual({});
  });

  it('validates required fields in Vietnamese without executing the capability', async () => {
    const capability = availableCapability();
    const { result } = renderHook(() => useChangePassword({ capability }));

    await act(async () => {
      expect(await result.current.handleSubmit()).toBe(false);
    });

    expect(result.current.errors).toEqual({
      currentPassword: 'Vui lòng nhập mật khẩu hiện tại.',
      newPassword: 'Vui lòng nhập mật khẩu mới.',
      confirmPassword: 'Vui lòng xác nhận mật khẩu mới.',
    });
    expect(capability.execute).not.toHaveBeenCalled();
  });

  it.each([
    ['weak', 'Mật khẩu phải có ít nhất 8 ký tự.'],
    ['New Password1!', 'Mật khẩu không được chứa khoảng trắng.'],
    [`${'Aa1!'.repeat(18)}A`, 'Mật khẩu không được vượt quá 72 ký tự.'],
    ['password1!', 'Mật khẩu phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.'],
  ])('presents the canonical password-policy violation in Vietnamese for %s', async (password, message) => {
    const capability = availableCapability();
    const { result } = renderHook(() => useChangePassword({ capability }));

    act(() => {
      result.current.setField('currentPassword', 'OldPass123!');
      result.current.setField('newPassword', password);
      result.current.setField('confirmPassword', password);
    });

    await act(async () => {
      expect(await result.current.handleSubmit()).toBe(false);
    });

    expect(result.current.errors.newPassword).toBe(message);
    expect(capability.execute).not.toHaveBeenCalled();
  });

  it('requires the new password to differ from the current password', async () => {
    const capability = availableCapability();
    const { result } = renderHook(() => useChangePassword({ capability }));

    act(() => {
      result.current.setField('currentPassword', 'SamePassword123!');
      result.current.setField('newPassword', 'SamePassword123!');
      result.current.setField('confirmPassword', 'SamePassword123!');
    });

    await act(async () => {
      expect(await result.current.handleSubmit()).toBe(false);
    });

    expect(result.current.errors.newPassword).toBe('Mật khẩu mới phải khác mật khẩu hiện tại.');
    expect(capability.execute).not.toHaveBeenCalled();
  });

  it('requires confirmation to match the new password', async () => {
    const capability = availableCapability();
    const { result } = renderHook(() => useChangePassword({ capability }));

    act(() => {
      result.current.setField('currentPassword', 'OldPass123!');
      result.current.setField('newPassword', 'ValidNewPass123!');
      result.current.setField('confirmPassword', 'DifferentPass456!');
    });

    await act(async () => {
      expect(await result.current.handleSubmit()).toBe(false);
    });

    expect(result.current.errors.confirmPassword).toBe(
      'Mật khẩu xác nhận không khớp. Vui lòng nhập lại.',
    );
    expect(capability.execute).not.toHaveBeenCalled();
  });

  it('executes an injected available capability and never assumes a token response', async () => {
    const execute = vi.fn<AvailableChangePasswordCapability['execute']>().mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const capability = availableCapability(execute);
    const { result } = renderHook(() => useChangePassword({ capability, onSuccess }));
    fillValidFields(result);

    await act(async () => {
      expect(await result.current.handleSubmit()).toBe(true);
    });

    expect(execute).toHaveBeenCalledWith({
      currentPassword: 'OldPass123!',
      newPassword: 'NewSecurePass456@',
      confirmPassword: 'NewSecurePass456@',
    });
    expect(onSuccess).toHaveBeenCalledWith();
    expect(result.current.success).toBe(true);
    expect(result.current.fields).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  });

  it('shows a safe generic error when an injected capability fails', async () => {
    const execute = vi.fn<AvailableChangePasswordCapability['execute']>().mockRejectedValue(
      new Error('adapter-specific detail'),
    );
    const { result } = renderHook(() =>
      useChangePassword({ capability: availableCapability(execute) }),
    );
    fillValidFields(result);

    await act(async () => {
      expect(await result.current.handleSubmit()).toBe(false);
    });

    expect(result.current.errors.form).toBe('Không thể đổi mật khẩu. Vui lòng thử lại.');
    expect(result.current.success).toBe(false);
  });
});
