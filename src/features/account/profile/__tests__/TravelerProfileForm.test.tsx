import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../travelerProfileApi';
import { TravelerProfileForm } from '../TravelerProfileForm';

vi.mock('../travelerProfileApi', () => ({
  getTravelerProfile: vi.fn(),
  updateTravelerProfile: vi.fn(),
}));

describe('TravelerProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getTravelerProfile).mockResolvedValue({
      fullName: 'Nguyễn Văn A',
      email: 'traveler@tripmate.com',
      phoneNumber: '0901234567',
      dateOfBirth: '1995-10-20',
      gender: 'Male',
      address: '123 Đường Lê Lợi, Q.1',
      avatarUrl: '',
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading state initially', () => {
    vi.mocked(api.getTravelerProfile).mockReturnValue(new Promise(() => {}));
    render(<TravelerProfileForm />);
    expect(screen.getByText('Đang tải thông tin hồ sơ…')).toBeDefined();
  });

  it('renders profile fields and enforces read-only email (BR-17)', async () => {
    render(<TravelerProfileForm />);

    await waitFor(() => {
      expect(screen.queryByText('Đang tải thông tin hồ sơ…')).toBeNull();
    });

    expect(screen.getByRole('heading', { name: 'Thông tin cá nhân' })).toBeDefined();

    const fullNameInput = screen.getByLabelText(/Họ và tên/) as HTMLInputElement;
    expect(fullNameInput.value).toBe('Nguyễn Văn A');

    const emailInput = screen.getByRole('textbox', { name: /Địa chỉ Email/ }) as HTMLInputElement;
    expect(emailInput.value).toBe('traveler@tripmate.com');
    expect(emailInput.disabled).toBe(true);
    expect(screen.getByText(/Chỉ đọc \(BR-17\)/)).toBeDefined();

    const phoneInput = screen.getByLabelText(/Số điện thoại/) as HTMLInputElement;
    expect(phoneInput.value).toBe('0901234567');
  });

  it('displays validation errors on invalid submit (MSG01 & MSG04)', async () => {
    render(<TravelerProfileForm />);

    await waitFor(() => {
      expect(screen.queryByText('Đang tải thông tin hồ sơ…')).toBeNull();
    });

    const fullNameInput = screen.getByLabelText(/Họ và tên/);
    fireEvent.change(fullNameInput, { target: { value: '' } });

    const phoneInput = screen.getByLabelText(/Số điện thoại/);
    fireEvent.change(phoneInput, { target: { value: '12345' } });

    const submitBtn = screen.getByRole('button', { name: 'Lưu thay đổi' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập họ và tên.')).toBeDefined();
      expect(
        screen.getByText(
          'Số điện thoại không hợp lệ. Số điện thoại phải gồm 10 chữ số bắt đầu bằng số 0.',
        ),
      ).toBeDefined();
    });
    expect(api.updateTravelerProfile).not.toHaveBeenCalled();
  });

  it('shows local draft feedback upon profile save (LOCAL_DRAFT & PENDING_BE_INTEGRATION)', async () => {
    vi.mocked(api.updateTravelerProfile).mockResolvedValue({
      success: true,
      messageCode: 'LOCAL_DRAFT',
      message: 'Thông tin tạm thời đã được lưu trên thiết bị này.',
      notice: 'Đồng bộ hồ sơ với máy chủ đang chờ tích hợp.',
      profile: {
        fullName: 'Nguyễn Văn Đã Cập Nhật',
        email: 'traveler@tripmate.com',
        phoneNumber: '0901234567',
      },
      storageMode: 'LOCAL_DRAFT',
      integrationStatus: 'PENDING_BE_INTEGRATION',
      isSimulatedFallback: true,
    });

    render(<TravelerProfileForm />);

    await waitFor(() => {
      expect(screen.queryByText('Đang tải thông tin hồ sơ…')).toBeNull();
    });

    const fullNameInput = screen.getByLabelText(/Họ và tên/);
    fireEvent.change(fullNameInput, { target: { value: 'Nguyễn Văn Đã Cập Nhật' } });

    const submitBtn = screen.getByRole('button', { name: 'Lưu thay đổi' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Thông tin tạm thời đã được lưu trên thiết bị này.')).toBeDefined();
      expect(screen.getByText(/Chờ tích hợp máy chủ/)).toBeDefined();
    });
  });

  it('calls onCancel when Hủy thay đổi button is clicked', async () => {
    const onCancel = vi.fn();
    render(<TravelerProfileForm onCancel={onCancel} />);

    await waitFor(() => {
      expect(screen.queryByText('Đang tải thông tin hồ sơ…')).toBeNull();
    });

    const cancelBtn = screen.getByRole('button', { name: 'Hủy thay đổi' });
    fireEvent.click(cancelBtn);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
