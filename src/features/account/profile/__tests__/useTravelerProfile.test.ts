import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../travelerProfileApi';
import {
  useTravelerProfile,
  validateAvatarFile,
  validateDateOfBirth,
  validateFullName,
  validatePhoneNumber,
} from '../useTravelerProfile';

vi.mock('../travelerProfileApi', () => ({
  getTravelerProfile: vi.fn(),
  updateTravelerProfile: vi.fn(),
}));

describe('useTravelerProfile validations', () => {
  it('validates full name (MSG01)', () => {
    expect(validateFullName('')).toBe('Vui lòng nhập họ và tên.');
    expect(validateFullName('   ')).toBe('Vui lòng nhập họ và tên.');
    expect(validateFullName('A'.repeat(101))).toBe('Họ và tên không được vượt quá 100 ký tự.');
    expect(validateFullName('Nguyễn Văn A')).toBeUndefined();
  });

  it('validates phone number (MSG01 & MSG04)', () => {
    expect(validatePhoneNumber('')).toBe('Vui lòng nhập số điện thoại.');
    expect(validatePhoneNumber('1234567890')).toBe(
      'Số điện thoại không hợp lệ. Số điện thoại phải gồm 10 chữ số bắt đầu bằng số 0.',
    );
    expect(validatePhoneNumber('091234567')).toBe(
      'Số điện thoại không hợp lệ. Số điện thoại phải gồm 10 chữ số bắt đầu bằng số 0.',
    );
    expect(validatePhoneNumber('09123456789')).toBe(
      'Số điện thoại không hợp lệ. Số điện thoại phải gồm 10 chữ số bắt đầu bằng số 0.',
    );
    expect(validatePhoneNumber('0912345678')).toBeUndefined();
    expect(validatePhoneNumber('0388123456')).toBeUndefined();
  });

  it('validates date of birth (BR-18)', () => {
    expect(validateDateOfBirth('')).toBeUndefined();

    // Future date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    expect(validateDateOfBirth(tomorrowStr)).toBe('Ngày sinh không thể ở trong tương lai.');

    // Under 16 years old
    const underAge = new Date();
    underAge.setFullYear(underAge.getFullYear() - 15);
    const underAgeStr = underAge.toISOString().split('T')[0];
    expect(validateDateOfBirth(underAgeStr)).toBe('Người dùng phải từ 16 tuổi trở lên (BR-18).');

    // Exactly or over 16 years old
    const validAge = new Date();
    validAge.setFullYear(validAge.getFullYear() - 20);
    const validAgeStr = validAge.toISOString().split('T')[0];
    expect(validateDateOfBirth(validAgeStr)).toBeUndefined();
  });

  it('validates avatar file format and size (BR-16)', () => {
    const invalidTypeFile = new File(['dummy'], 'doc.pdf', { type: 'application/pdf' });
    expect(validateAvatarFile(invalidTypeFile)).toBe(
      'Định dạng hình ảnh không hợp lệ. Vui lòng chọn tệp JPG, PNG hoặc WEBP.',
    );

    const oversizedFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.jpg', {
      type: 'image/jpeg',
    });
    expect(validateAvatarFile(oversizedFile)).toBe(
      'Kích thước tệp vượt quá 5MB. Vui lòng chọn hình ảnh nhỏ hơn (BR-16).',
    );

    const validFile = new File(['valid'], 'avatar.png', { type: 'image/png' });
    expect(validateAvatarFile(validFile)).toBeUndefined();
  });
});

describe('useTravelerProfile hook logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getTravelerProfile).mockResolvedValue({
      fullName: 'Trần Ban Đầu',
      email: 'traveler@example.com',
      phoneNumber: '0901234567',
      dateOfBirth: '1996-01-01',
      gender: 'Male',
      address: 'TP. Hồ Chí Minh',
      avatarUrl: '',
    });
  });

  it('initializes by fetching profile and populating fields', async () => {
    const { result } = renderHook(() => useTravelerProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.fields.fullName).toBe('Trần Ban Đầu');
    expect(result.current.fields.email).toBe('traveler@example.com');
    expect(result.current.fields.phoneNumber).toBe('0901234567');
  });

  it('updates fields and clears errors on edit', async () => {
    const { result } = renderHook(() => useTravelerProfile());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setField('fullName', '');
    });

    await act(async () => {
      const ok = await result.current.handleSubmit();
      expect(ok).toBe(false);
    });

    expect(result.current.errors.fullName).toBe('Vui lòng nhập họ và tên.');

    act(() => {
      result.current.setField('fullName', 'Nguyễn Mới');
    });

    expect(result.current.errors.fullName).toBeUndefined();
  });

  it('submits successfully and calls onSuccess callback', async () => {
    vi.mocked(api.updateTravelerProfile).mockResolvedValue({
      success: true,
      messageCode: 'LOCAL_DRAFT',
      message: 'Thông tin tạm thời đã được lưu trên thiết bị này.',
      notice: 'Đồng bộ hồ sơ với máy chủ đang chờ tích hợp.',
      profile: {
        fullName: 'Nguyễn Văn Đã Sửa',
        email: 'traveler@example.com',
        phoneNumber: '0909998877',
      },
      storageMode: 'LOCAL_DRAFT',
      integrationStatus: 'PENDING_BE_INTEGRATION',
      isSimulatedFallback: true,
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useTravelerProfile({ onSuccess }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setField('fullName', 'Nguyễn Văn Đã Sửa');
      result.current.setField('phoneNumber', '0909998877');
    });

    await act(async () => {
      const ok = await result.current.handleSubmit();
      expect(ok).toBe(true);
    });

    expect(result.current.success).toBe(true);
    expect(result.current.successMessage).toBe('Thông tin tạm thời đã được lưu trên thiết bị này.');
    expect(result.current.backendFallbackNotice).toBe(
      'Đồng bộ hồ sơ với máy chủ đang chờ tích hợp.',
    );
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Nguyễn Văn Đã Sửa',
      }),
    );
  });
});
