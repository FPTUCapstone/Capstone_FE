import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as operatorProfileService from '../services/operatorProfileService';
import { OPERATOR_PROFILE_MESSAGES, type OperatorProfileDto } from '../types/operatorProfile';
import { OperatorProfileView } from './OperatorProfileView';

const mockRealProfile: OperatorProfileDto = {
  userId: 12,
  businessName: 'Sun Tours',
  businessDescription: 'Licensed inbound tour operator since 2015.',
  businessAddress: '02 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
  contactPhone: '0905388123',
  contactEmail: 'contact@suntours.vn',
  website: 'https://suntours.vn',
  logoUrl: 'https://res.cloudinary.com/demo/logo.png',
  businessLicenceNumber: '48-0123/2020/TCDL-GP LHQT',
  taxCode: '0401998877',
  approvalStatus: 'Approved',
  accountEmail: 'owner@suntours.vn',
  isDemo: false,
};

const mockDemoProfile: OperatorProfileDto = {
  ...mockRealProfile,
  businessName: 'Han River Travel Co., Ltd',
  isDemo: true,
};

describe('OperatorProfileView Component (UC-34 Real Integration)', () => {
  const originalEnv = process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:new-logo');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = originalEnv;
    vi.restoreAllMocks();
  });

  it('renders editable fields and read-only legal identity in real mode', () => {
    render(<OperatorProfileView initialProfile={mockRealProfile} isDemo={false} />);

    expect(screen.queryByText(/đang chờ kết nối máy chủ/i)).toBeNull();

    const nameInput = screen.getByLabelText(/Tên doanh nghiệp lữ hành/i) as HTMLInputElement;
    expect(nameInput.value).toBe('Sun Tours');
    expect(nameInput.disabled).toBe(false);

    expect(screen.getByText('48-0123/2020/TCDL-GP LHQT')).toBeDefined();
    expect(screen.getByText('0401998877')).toBeDefined();
    expect(screen.getByText('owner@suntours.vn')).toBeDefined();
    expect(screen.getByRole('button', { name: /^Lưu thông tin$/i }).hasAttribute('disabled')).toBe(
      false
    );
  });

  it('shows inline validation errors for businessName (MSG01), contactPhone (MSG04), contactEmail (MSG02), and website', async () => {
    render(<OperatorProfileView initialProfile={mockRealProfile} isDemo={false} />);

    fireEvent.change(screen.getByLabelText(/Tên doanh nghiệp lữ hành/i), {
      target: { value: '   ' },
    });
    fireEvent.change(screen.getByLabelText(/Số điện thoại liên hệ/i), {
      target: { value: '0236 388 1234' },
    });
    fireEvent.change(screen.getByLabelText(/Email liên hệ công việc/i), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByLabelText(/Website chính thức/i), {
      target: { value: 'suntours.vn' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^Lưu thông tin$/i }));

    await waitFor(() => {
      expect(screen.getByText(/MSG01/)).toBeDefined();
      expect(screen.getByText(/MSG04/)).toBeDefined();
      expect(screen.getByText(/MSG02/)).toBeDefined();
      expect(screen.getByText(/http:\/\/.*https:\/\//i)).toBeDefined();
    });
  });

  it('submits updated profile in real mode, updates parent, and does not show MSG121', async () => {
    const updatedProfile: OperatorProfileDto = {
      ...mockRealProfile,
      businessName: 'Sun Tours New',
    };
    const updateSpy = vi
      .spyOn(operatorProfileService, 'updateOperatorProfile')
      .mockResolvedValue({
        status: 'SUCCESS',
        profile: updatedProfile,
        message: OPERATOR_PROFILE_MESSAGES.UPDATE_SUCCESS,
        isDemo: false,
      });
    const onProfileUpdated = vi.fn();

    render(
      <OperatorProfileView
        initialProfile={mockRealProfile}
        isDemo={false}
        onProfileUpdated={onProfileUpdated}
      />
    );

    fireEvent.change(screen.getByLabelText(/Tên doanh nghiệp lữ hành/i), {
      target: { value: 'Sun Tours New' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Lưu thông tin$/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(onProfileUpdated).toHaveBeenCalledWith(updatedProfile);
    });

    const statusAlert = screen.getByRole('status');
    expect(statusAlert.textContent).toContain('Cập nhật');
    expect(statusAlert.textContent).not.toContain('MSG121');
  });

  it('keeps logoFile and removeLogo mutually exclusive and resets both on cancel', async () => {
    const updateSpy = vi
      .spyOn(operatorProfileService, 'updateOperatorProfile')
      .mockResolvedValue({
        status: 'SUCCESS',
        profile: mockRealProfile,
        message: OPERATOR_PROFILE_MESSAGES.UPDATE_SUCCESS,
        isDemo: false,
      });

    render(<OperatorProfileView initialProfile={mockRealProfile} isDemo={false} />);

    // Remove existing logo -> removeLogo = true
    fireEvent.click(screen.getByRole('button', { name: /Xóa/i }));
    // Then pick a new file -> removeLogo must reset to false
    const file = new File(['abc'], 'new.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/Tải lên ảnh logo doanh nghiệp/i), {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole('button', { name: /^Lưu thông tin$/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          logoFile: file,
          removeLogo: false,
        }),
        expect.anything()
      );
    });
  });

  it('maps server removeLogo error into the logo error area', async () => {
    vi.spyOn(operatorProfileService, 'updateOperatorProfile').mockRejectedValue(
      new operatorProfileService.OperatorProfileValidationError({
        removeLogo: 'Yêu cầu xóa logo không hợp lệ.',
      })
    );

    render(<OperatorProfileView initialProfile={mockRealProfile} isDemo={false} />);
    fireEvent.click(screen.getByRole('button', { name: /^Lưu thông tin$/i }));

    await waitFor(() => {
      expect(screen.getByText('Yêu cầu xóa logo không hợp lệ.')).toBeDefined();
    });
  });

  it('displays DEMO ONLY badge in demo mode', () => {
    render(<OperatorProfileView initialProfile={mockDemoProfile} isDemo={true} />);
    expect(screen.getByText(/DEMO ONLY/i)).toBeDefined();
  });
});
