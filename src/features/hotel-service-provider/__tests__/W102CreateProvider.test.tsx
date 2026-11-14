import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CreateServiceProviderView } from '../components/w102/CreateServiceProviderView';
import { ToastProvider } from '../components/common/Toast';
import { StaffProviderService } from '../services/staffProviderService';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('Screen W102: Create Service Provider Account (Staff Workspace, UC-77)', () => {
  beforeEach(() => {
    StaffProviderService.resetState();
  });

  const renderComponent = () =>
    render(
      <ToastProvider>
        <CreateServiceProviderView />
      </ToastProvider>
    );

  it('renders 65/35 split layout with all official fields and operational guidance in Vietnamese', async () => {
    renderComponent();

    // Verify Title & Staff Role Badge (no prototype metadata)
    expect(screen.getByRole('heading', { name: /Tạo tài khoản đối tác dịch vụ/i })).toBeDefined();
    expect(screen.getByText(/Khu vực Nhân viên Vận hành/i)).toBeDefined();

    // Verify Form Fields
    expect(screen.getByLabelText(/Tên cơ sở kinh doanh \/ Khách sạn/i)).toBeDefined();
    expect(screen.getByText(/Phân loại dịch vụ/i)).toBeDefined();
    expect(screen.getByLabelText(/Họ và tên người đại diện/i)).toBeDefined();
    expect(screen.getByLabelText(/Địa chỉ Email tài khoản/i)).toBeDefined();
    expect(screen.getByLabelText(/Số điện thoại liên hệ/i)).toBeDefined();

    // Verify POI Selector after loading
    await waitFor(() => {
      expect(screen.getByText(/Chọn Điểm dịch vụ thương mại khả dụng/i)).toBeDefined();
    });

    // Verify Operational Guidance on Right Panel
    expect(screen.getByText(/Hướng dẫn Cấp tài khoản Đối tác/i)).toBeDefined();
    expect(screen.getByText(/Quyền hạn Nhân viên Vận hành/i)).toBeDefined();
    expect(screen.getByText(/Bảo mật Mật khẩu Tuyệt đối/i)).toBeDefined();

    // Crucial Security Requirement: No password input must be rendered
    expect(screen.queryByLabelText(/mật khẩu/i)).toBeNull();
    expect(screen.queryByLabelText(/password/i)).toBeNull();
  });

  it('validates mandatory fields and shows MSG01 when submitting blank form', async () => {
    renderComponent();

    const submitBtn = screen.getByRole('button', {
      name: /Tạo tài khoản & Gửi thông tin/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Inline errors
      const errorMsgs = screen.getAllByText(/Vui lòng điền đầy đủ các thông tin bắt buộc/i);
      expect(errorMsgs.length).toBeGreaterThan(0);
    });
  });

  it('validates email format with MSG143 on invalid email', async () => {
    renderComponent();

    const emailInput = screen.getByLabelText(/Địa chỉ Email tài khoản/i);
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });

    const submitBtn = screen.getByRole('button', {
      name: /Tạo tài khoản & Gửi thông tin/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Giá trị đã nhập không hợp lệ hoặc nằm ngoài phạm vi cho phép/i)
      ).toBeDefined();
    });
  });

  it('successfully provisions provider account and displays MSG201', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Đang tải danh sách điểm dịch vụ/i)).toBeNull();
    });

    // Fill valid details
    fireEvent.change(screen.getByLabelText(/Tên cơ sở kinh doanh \/ Khách sạn/i), {
      target: { value: 'Hội An Riverside Heritage Resort' },
    });
    fireEvent.change(screen.getByLabelText(/Họ và tên người đại diện/i), {
      target: { value: 'Trần Thị Lan' },
    });
    fireEvent.change(screen.getByLabelText(/Địa chỉ Email tài khoản/i), {
      target: { value: 'lan.tran@hoianriverside.vn' },
    });
    fireEvent.change(screen.getByLabelText(/Số điện thoại liên hệ/i), {
      target: { value: '0905 123 456' },
    });

    const submitBtn = screen.getByRole('button', {
      name: /Tạo tài khoản & Gửi thông tin/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Khởi tạo tài khoản đối tác thành công/i)).toBeDefined();
      expect(
        screen.getAllByText(/Tài khoản đối tác đã được tạo thành công\. Mật khẩu tạm thời đã được gửi/i).length
      ).toBeGreaterThan(0);
    });
  });
});
