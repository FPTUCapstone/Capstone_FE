import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as operatorProfileService from '../services/operatorProfileService';
import type { OperatorProfileDto } from '../types/operatorProfile';
import { OperatorProfileView } from './OperatorProfileView';

const mockDemoProfile: OperatorProfileDto = {
  userId: 1048,
  businessName: 'Han River Travel Co., Ltd',
  businessDescription: 'Licensed inbound tour operator since 2015.',
  businessAddress: '02 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
  contactPhone: '0236 388 1234',
  contactEmail: 'contact@hanrivertravel.vn',
  website: 'https://hanrivertravel.vn',
  businessLicenceNumber: '48-0123/2020/TCDL-GP LHQT',
  taxCode: '0401998877',
  approvalStatus: 'Approved',
  accountEmail: 'operator.hanriver@tripmate.vn',
  isDemo: true,
};

const mockRealPendingProfile: OperatorProfileDto = {
  userId: '',
  businessName: '',
  businessDescription: '',
  businessAddress: '',
  contactPhone: '',
  contactEmail: '',
  website: '',
  businessLicenceNumber: '',
  taxCode: '',
  approvalStatus: 'Approved',
  accountEmail: 'real.operator@tripmate.vn',
  isDemo: false,
};

describe('OperatorProfileView Component (UC-34 Field Contract & Truthfulness)', () => {
  const originalEnv = process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = originalEnv;
  });

  describe('Field contract (UC34-FIELD-1 through 10)', () => {
    it('UC34-FIELD-1 to 6: Editable input fields render with editable values', () => {
      render(<OperatorProfileView initialProfile={mockDemoProfile} isDemo={true} />);

      // 1. Business Name (editable)
      const nameInput = screen.getByLabelText(/Tên doanh nghiệp lữ hành/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Han River Travel Co., Ltd');
      expect(nameInput.disabled).toBe(false);

      // 2. Business Description (editable)
      const descInput = screen.getByLabelText(/Mô tả giới thiệu doanh nghiệp/i) as HTMLTextAreaElement;
      expect(descInput.value).toBe('Licensed inbound tour operator since 2015.');
      expect(descInput.disabled).toBe(false);

      // 3. Business Address (editable)
      const addrInput = screen.getByLabelText(/Địa chỉ trụ sở chính/i) as HTMLInputElement;
      expect(addrInput.value).toBe('02 Nguyễn Văn Linh, Hải Châu, Đà Nẵng');
      expect(addrInput.disabled).toBe(false);

      // 4. Contact Phone (editable)
      const phoneInput = screen.getByLabelText(/Số điện thoại liên hệ/i) as HTMLInputElement;
      expect(phoneInput.value).toBe('0236 388 1234');
      expect(phoneInput.disabled).toBe(false);

      // 5. Contact Email (editable)
      const emailInput = screen.getByLabelText(/Email liên hệ công việc/i) as HTMLInputElement;
      expect(emailInput.value).toBe('contact@hanrivertravel.vn');
      expect(emailInput.disabled).toBe(false);

      // 6. Website (editable)
      const websiteInput = screen.getByLabelText(/Website chính thức/i) as HTMLInputElement;
      expect(websiteInput.value).toBe('https://hanrivertravel.vn');
      expect(websiteInput.disabled).toBe(false);
    });

    it('UC34-FIELD-7 to 10: Legal and system identity data is read-only (BR-08, BR-17)', () => {
      render(<OperatorProfileView initialProfile={mockDemoProfile} isDemo={true} />);

      // 7. Business Licence Number (read-only per BR-08)
      expect(screen.getByText('48-0123/2020/TCDL-GP LHQT')).toBeDefined();
      expect(screen.queryByLabelText(/Số GPKD/i)).toBeNull(); // No editable input for licence number

      // 8. Tax Code (read-only per BR-08)
      expect(screen.getByText('0401998877')).toBeDefined();
      expect(screen.queryByLabelText(/Mã số thuế/i)).toBeNull(); // No editable input for tax code

      // 9. Approval Status (read-only)
      expect(screen.getByText(/Đã duyệt \(Hoạt động\)/i)).toBeDefined();

      // 10. Authentication account email (read-only per BR-17)
      expect(screen.getByText('operator.hanriver@tripmate.vn')).toBeDefined();
    });
  });

  describe('Truthfulness & Real Mode (UC34-TRUTH-1, UC34-TRUTH-2, UC34-TRUTH-5)', () => {
    it('UC34-TRUTH-1: Real mode does not render fabricated values and shows truthful pending banner', () => {
      render(<OperatorProfileView initialProfile={mockRealPendingProfile} isDemo={false} />);

      expect(
        screen.getByText(/Tính năng hồ sơ đối tác đang chờ kết nối máy chủ/i)
      ).toBeDefined();

      // Inputs are empty, not populated with fake company names
      const nameInput = screen.getByLabelText(/Tên doanh nghiệp lữ hành/i) as HTMLInputElement;
      expect(nameInput.value).toBe('');

      // Legal data shows neutral unavailable state
      expect(screen.getAllByText(/Chờ tích hợp máy chủ/i).length).toBeGreaterThan(0);
    });

    it('UC34-TRUTH-2: Real mode disables save button to prevent fake success', () => {
      render(<OperatorProfileView initialProfile={mockRealPendingProfile} isDemo={false} />);

      const saveBtn = screen.getByRole('button', { name: /Lưu thông tin \(Chờ máy chủ\)/i });
      expect(saveBtn.hasAttribute('disabled')).toBe(true);
    });

    it('UC34-TRUTH-5: Demo mode visibly displays DEMO ONLY badge', () => {
      render(<OperatorProfileView initialProfile={mockDemoProfile} isDemo={true} />);

      expect(screen.getByText(/DEMO ONLY/i)).toBeDefined();
      expect(screen.getByText(/Bản xem trước DEMO/i)).toBeDefined();
    });
  });

  describe('Production Read-Only Hardening (P2 Remediation)', () => {
    it('Strictly disables all 6 profile mutation fields in real mode (isDemo = false)', () => {
      render(<OperatorProfileView initialProfile={mockRealPendingProfile} isDemo={false} />);

      const nameInput = screen.getByLabelText(/Tên doanh nghiệp lữ hành/i) as HTMLInputElement;
      const descInput = screen.getByLabelText(/Mô tả giới thiệu doanh nghiệp/i) as HTMLTextAreaElement;
      const addrInput = screen.getByLabelText(/Địa chỉ trụ sở chính/i) as HTMLInputElement;
      const phoneInput = screen.getByLabelText(/Số điện thoại liên hệ/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/Email liên hệ công việc/i) as HTMLInputElement;
      const websiteInput = screen.getByLabelText(/Website chính thức/i) as HTMLInputElement;

      expect(nameInput.disabled).toBe(true);
      expect(descInput.disabled).toBe(true);
      expect(addrInput.disabled).toBe(true);
      expect(phoneInput.disabled).toBe(true);
      expect(emailInput.disabled).toBe(true);
      expect(websiteInput.disabled).toBe(true);
    });

    it('Ignores input change events in real mode (inputs remain unchanged)', () => {
      render(<OperatorProfileView initialProfile={mockRealPendingProfile} isDemo={false} />);

      const nameInput = screen.getByLabelText(/Tên doanh nghiệp lữ hành/i) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Attempted Name Change' } });
      expect(nameInput.value).toBe('');

      const phoneInput = screen.getByLabelText(/Số điện thoại liên hệ/i) as HTMLInputElement;
      fireEvent.change(phoneInput, { target: { value: '0909000111' } });
      expect(phoneInput.value).toBe('');
    });

    it('Disables both Save and Cancel buttons in real mode', () => {
      render(<OperatorProfileView initialProfile={mockRealPendingProfile} isDemo={false} />);

      const saveBtn = screen.getByRole('button', { name: /Lưu thông tin \(Chờ máy chủ\)/i });
      const cancelBtn = screen.getByRole('button', { name: /Hủy/i });

      expect(saveBtn.hasAttribute('disabled')).toBe(true);
      expect(cancelBtn.hasAttribute('disabled')).toBe(true);
    });

    it('Omits interactive logo upload/remove buttons in real mode', () => {
      render(<OperatorProfileView initialProfile={mockRealPendingProfile} isDemo={false} />);

      expect(screen.queryByRole('button', { name: /Tải lên logo/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Thay đổi logo/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Xóa/i })).toBeNull();
      expect(screen.getByText(/Tính năng tải logo đang chờ kết nối máy chủ/i)).toBeDefined();
    });

    it('Fails closed on programmatic form submit in real mode without calling mutation service', () => {
      const updateSpy = vi.spyOn(operatorProfileService, 'updateOperatorProfile');
      render(<OperatorProfileView initialProfile={mockRealPendingProfile} isDemo={false} />);

      const saveBtn = screen.getByRole('button', { name: /Lưu thông tin \(Chờ máy chủ\)/i });
      const form = saveBtn.closest('form')!;

      fireEvent.submit(form);

      expect(updateSpy).not.toHaveBeenCalled();
      expect(screen.queryByText(/Cập nhật thông tin hồ sơ đối tác thành công/i)).toBeNull();
    });

    it('Enables all fields and interactive actions in demo mode (isDemo = true)', () => {
      render(<OperatorProfileView initialProfile={mockDemoProfile} isDemo={true} />);

      const nameInput = screen.getByLabelText(/Tên doanh nghiệp lữ hành/i) as HTMLInputElement;
      const saveBtn = screen.getByRole('button', { name: /Lưu thông tin/i });
      const cancelBtn = screen.getByRole('button', { name: /Hủy/i });

      expect(nameInput.disabled).toBe(false);
      expect(saveBtn.hasAttribute('disabled')).toBe(false);
      expect(cancelBtn.hasAttribute('disabled')).toBe(false);
      expect(screen.getByRole('button', { name: /Tải lên logo/i })).toBeDefined();

      fireEvent.change(nameInput, { target: { value: 'New Test Name' } });
      expect(nameInput.value).toBe('New Test Name');

      fireEvent.click(cancelBtn);
      expect(nameInput.value).toBe('Han River Travel Co., Ltd');
    });
  });

  describe('Form Validation & Actions (UC34-VALID-2, UC34-VALID-5)', () => {
    it('UC34-VALID-2: Displays MSG02 inline error when invalid contact email format is submitted', async () => {
      render(<OperatorProfileView initialProfile={mockDemoProfile} isDemo={true} />);

      const emailInput = screen.getByLabelText(/Email liên hệ công việc/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email-format' } });

      const saveBtn = screen.getByRole('button', { name: /Lưu thông tin/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/Định dạng email không hợp lệ.*\(MSG02\)/i)).toBeDefined();
      });
    });

    it('UC34-VALID-5: Cancel button resets form state back to initial values', () => {
      render(<OperatorProfileView initialProfile={mockDemoProfile} isDemo={true} />);

      const nameInput = screen.getByLabelText(/Tên doanh nghiệp lữ hành/i) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Tên thay đổi tạm thời' } });
      expect(nameInput.value).toBe('Tên thay đổi tạm thời');

      const cancelBtn = screen.getByRole('button', { name: /Hủy/i });
      fireEvent.click(cancelBtn);

      expect(nameInput.value).toBe('Han River Travel Co., Ltd');
    });

    it('In demo mode: simulates successful save with DEMO message and callback', async () => {
      const onProfileUpdated = vi.fn();
      render(
        <OperatorProfileView
          initialProfile={mockDemoProfile}
          isDemo={true}
          onProfileUpdated={onProfileUpdated}
        />
      );

      const saveBtn = screen.getByRole('button', { name: /Lưu thông tin/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/Bản xem trước DEMO: Cập nhật thông tin hồ sơ đối tác thành công/i)).toBeDefined();
      });
      expect(onProfileUpdated).toHaveBeenCalled();
    });
  });
});
