import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../changePasswordApi';
import { useChangePassword } from '../useChangePassword';

vi.mock('../changePasswordApi', () => ({
  changePassword: vi.fn(),
}));

describe('useChangePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty fields and no errors', () => {
    const { result } = renderHook(() => useChangePassword());

    expect(result.current.fields.currentPassword).toBe('');
    expect(result.current.fields.newPassword).toBe('');
    expect(result.current.fields.confirmPassword).toBe('');
    expect(result.current.errors).toEqual({});
    expect(result.current.submitting).toBe(false);
    expect(result.current.success).toBe(false);
  });

  it('updates field values with setField and clears corresponding errors', () => {
    const { result } = renderHook(() => useChangePassword());

    act(() => {
      result.current.setField('currentPassword', 'OldPass123!');
    });
    expect(result.current.fields.currentPassword).toBe('OldPass123!');

    // Trigger validation error
    act(() => {
      result.current.handleSubmit();
    });
    expect(result.current.errors.newPassword).toBeDefined();

    // Updating newPassword clears its error
    act(() => {
      result.current.setField('newPassword', 'NewPass456@');
    });
    expect(result.current.errors.newPassword).toBeUndefined();
  });

  it('validates required fields (MSG01)', async () => {
    const { result } = renderHook(() => useChangePassword());

    await act(async () => {
      const ok = await result.current.handleSubmit();
      expect(ok).toBe(false);
    });

    expect(result.current.errors.currentPassword).toBe('Vui lòng nhập mật khẩu hiện tại.');
    expect(result.current.errors.newPassword).toBe('Vui lòng nhập mật khẩu mới.');
    expect(result.current.errors.confirmPassword).toBe('Vui lòng xác nhận mật khẩu mới.');
    expect(api.changePassword).not.toHaveBeenCalled();
  });

  it('validates password complexity (MSG05)', async () => {
    const { result } = renderHook(() => useChangePassword());

    act(() => {
      result.current.setField('currentPassword', 'OldPass123!');
      result.current.setField('newPassword', 'weak');
      result.current.setField('confirmPassword', 'weak');
    });

    await act(async () => {
      const ok = await result.current.handleSubmit();
      expect(ok).toBe(false);
    });

    expect(result.current.errors.newPassword).toBe('Password must be at least 8 characters.');
    expect(api.changePassword).not.toHaveBeenCalled();
  });

  it('validates that new password differs from current password (SRS 6.a1)', async () => {
    const { result } = renderHook(() => useChangePassword());

    act(() => {
      result.current.setField('currentPassword', 'SamePassword123!');
      result.current.setField('newPassword', 'SamePassword123!');
      result.current.setField('confirmPassword', 'SamePassword123!');
    });

    await act(async () => {
      const ok = await result.current.handleSubmit();
      expect(ok).toBe(false);
    });

    expect(result.current.errors.newPassword).toBe('Mật khẩu mới phải khác mật khẩu hiện tại.');
    expect(api.changePassword).not.toHaveBeenCalled();
  });

  it('validates password confirmation mismatch (MSG06)', async () => {
    const { result } = renderHook(() => useChangePassword());

    act(() => {
      result.current.setField('currentPassword', 'OldPass123!');
      result.current.setField('newPassword', 'ValidNewPass123!');
      result.current.setField('confirmPassword', 'DifferentPass456!');
    });

    await act(async () => {
      const ok = await result.current.handleSubmit();
      expect(ok).toBe(false);
    });

    expect(result.current.errors.confirmPassword).toBe(
      'Mật khẩu xác nhận không khớp. Vui lòng nhập lại.',
    );
    expect(api.changePassword).not.toHaveBeenCalled();
  });

  it('submits valid payload and resets form on success (MSG18)', async () => {
    const onSuccess = vi.fn();
    vi.mocked(api.changePassword).mockResolvedValueOnce({
      accessToken: 'new-token',
      refreshToken: 'new-refresh',
      expiresAtUtc: '2026-10-01T00:00:00Z',
    });

    const { result } = renderHook(() =>
      useChangePassword({
        accessToken: 'mock-access-token',
        onSuccess,
      }),
    );

    act(() => {
      result.current.setField('currentPassword', 'OldPass123!');
      result.current.setField('newPassword', 'NewSecurePass456@');
      result.current.setField('confirmPassword', 'NewSecurePass456@');
    });

    await act(async () => {
      const ok = await result.current.handleSubmit();
      expect(ok).toBe(true);
    });

    expect(api.changePassword).toHaveBeenCalledWith(
      {
        currentPassword: 'OldPass123!',
        newPassword: 'NewSecurePass456@',
        confirmPassword: 'NewSecurePass456@',
      },
      'mock-access-token',
    );

    expect(result.current.success).toBe(true);
    expect(result.current.fields.currentPassword).toBe('');
    expect(result.current.fields.newPassword).toBe('');
    expect(result.current.fields.confirmPassword).toBe('');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('handles backend MSG17 incorrect current password', async () => {
    vi.mocked(api.changePassword).mockRejectedValueOnce({
      code: 'MSG17',
      message: 'Current password does not match our records.',
      status: 400,
    });

    const { result } = renderHook(() => useChangePassword());

    act(() => {
      result.current.setField('currentPassword', 'WrongPass123!');
      result.current.setField('newPassword', 'NewSecurePass456@');
      result.current.setField('confirmPassword', 'NewSecurePass456@');
    });

    await act(async () => {
      const ok = await result.current.handleSubmit();
      expect(ok).toBe(false);
    });

    expect(result.current.errors.currentPassword).toBe('Mật khẩu hiện tại không chính xác.');
    expect(result.current.success).toBe(false);
  });

  it('handles ENDPOINT_NOT_DEPLOYED gracefully without crashing', async () => {
    vi.mocked(api.changePassword).mockRejectedValueOnce({
      code: 'ENDPOINT_NOT_DEPLOYED',
      message: 'Chức năng đổi mật khẩu đang được đồng bộ máy chủ.',
      status: 404,
    });

    const { result } = renderHook(() => useChangePassword());

    act(() => {
      result.current.setField('currentPassword', 'OldPass123!');
      result.current.setField('newPassword', 'NewSecurePass456@');
      result.current.setField('confirmPassword', 'NewSecurePass456@');
    });

    await act(async () => {
      const ok = await result.current.handleSubmit();
      expect(ok).toBe(false);
    });

    expect(result.current.errors.form).toBe(
      'Chức năng đổi mật khẩu đang được đồng bộ máy chủ.',
    );
  });

  it('triggers onUnauthorized callback on 401 response', async () => {
    const onUnauthorized = vi.fn();
    vi.mocked(api.changePassword).mockRejectedValueOnce({
      code: 'UNAUTHORIZED',
      status: 401,
    });

    const { result } = renderHook(() => useChangePassword({ onUnauthorized }));

    act(() => {
      result.current.setField('currentPassword', 'OldPass123!');
      result.current.setField('newPassword', 'NewSecurePass456@');
      result.current.setField('confirmPassword', 'NewSecurePass456@');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onUnauthorized).toHaveBeenCalled();
  });

  it('handles network failure (MSG127 fallback)', async () => {
    vi.mocked(api.changePassword).mockRejectedValueOnce(new Error('Network offline'));

    const { result } = renderHook(() => useChangePassword());

    act(() => {
      result.current.setField('currentPassword', 'OldPass123!');
      result.current.setField('newPassword', 'NewSecurePass456@');
      result.current.setField('confirmPassword', 'NewSecurePass456@');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.errors.form).toBe(
      'TripMate tạm thời không thể xử lý yêu cầu. Vui lòng kiểm tra kết nối và thử lại.',
    );
  });
});
