import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CommissionReconciliationView } from '../components/w106/CommissionReconciliationView';
import { ToastProvider } from '../components/common/Toast';
import { StaffReconciliationService } from '../services/staffReconciliationService';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('Screen W106: Commission Reconciliation (Staff Workspace, UC-83)', () => {
  beforeEach(() => {
    StaffReconciliationService.resetState();
  });

  const renderComponent = () =>
    render(
      <ToastProvider>
        <CommissionReconciliationView />
      </ToastProvider>
    );

  it('renders reconciliation table with mandatory columns and filters in Vietnamese', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Đối soát hoa hồng đối tác/i })).toBeDefined();
    });

    // Check Staff boundary badge (no technical metadata)
    expect(screen.getByText(/Nhân viên Đối soát Tài chính/i)).toBeDefined();

    // Check Filter Bar
    expect(screen.getByText('Đối tác dịch vụ')).toBeDefined();
    expect(screen.getByText('Kỳ quyết toán')).toBeDefined();
    expect(screen.getByText('Trạng thái thanh toán')).toBeDefined();
    expect(screen.getByLabelText(/Tìm mã giao dịch ngân hàng/i)).toBeDefined();

    // Check Table Headers
    expect(screen.getByText('Đối tác / Cơ sở dịch vụ')).toBeDefined();
    expect(screen.getByText('Kỳ')).toBeDefined();
    expect(screen.getByText('Hoa hồng phải nộp')).toBeDefined();
    expect(screen.getByText('Hạn thanh toán')).toBeDefined();
    expect(screen.getByText('Trạng thái')).toBeDefined();
    expect(screen.getByText('Mã giao dịch ngân hàng')).toBeDefined();
    expect(screen.getByText('Thời gian thông báo')).toBeDefined();
    expect(screen.getByText('Thao tác')).toBeDefined();

    // Default filter is PaymentReported -> stmt-001 should be present
    expect(screen.getByText('Hội An Riverside Heritage Resort')).toBeDefined();
    expect(screen.getByText('VCB-20261205-982341')).toBeDefined();
    expect(screen.getByRole('button', { name: /Xác nhận thu tiền/i })).toBeDefined();
  });

  it('executes receipt confirmation workflow via modal and updates to Paid with MSG209', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Xác nhận thu tiền/i })).toBeDefined();
    });

    // Click Record Receipt button
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận thu tiền/i }));

    // Verify Confirmation Modal
    expect(screen.getByText(/Xác nhận Đã thu tiền Hoa hồng/i)).toBeDefined();
    expect(
      screen.getByText(/Xác nhận số tiền hoa hồng 4\.440\.000 ₫/i)
    ).toBeDefined();
    expect(
      screen.getByText(/Thao tác này sẽ lưu vết giao dịch tài chính chính thức/i)
    ).toBeDefined();

    // Confirm receipt
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận & Cập nhật Đã thanh toán/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      // MSG209 toast
      expect(
        screen.getByText(/Đã xác nhận thu tiền\. Bảng kê hoa hồng được cập nhật sang trạng thái Đã thanh toán\./i)
      ).toBeDefined();

      // Action button replaced by Reconciled badge
      expect(screen.getByText(/Đã đối soát/i)).toBeDefined();
    });
  });
});
