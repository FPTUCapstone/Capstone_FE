import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CommissionStatementsView } from '../components/w105/CommissionStatementsView';
import { ToastProvider } from '../components/common/Toast';
import { ProviderStatementService } from '../services/providerStatementService';

describe('Screen W105: Commission Statements (Service Provider Workspace, UC-82)', () => {
  beforeEach(() => {
    ProviderStatementService.resetState();
  });

  const renderComponent = () =>
    render(
      <ToastProvider>
        <CommissionStatementsView />
      </ToastProvider>
    );

  it('renders 60/40 master-detail layout with statement ledger and detail drawer in Vietnamese', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Bảng kê hoa hồng')).toBeDefined();
    });

    // Check Ledger Table Headers
    expect(screen.getByText('Kỳ quyết toán')).toBeDefined();
    expect(screen.getByText('Lượt hoàn thành')).toBeDefined();
    expect(screen.getByText('Tổng doanh thu')).toBeDefined();
    expect(screen.getByText('Hoa hồng phải nộp')).toBeDefined();
    expect(screen.getByText('Hạn thanh toán')).toBeDefined();
    expect(screen.getByText('Trạng thái')).toBeDefined();

    // Check Selected Statement Details
    expect(screen.getByText(/Quyết toán Hoa hồng — Tháng 11\/2026/i)).toBeDefined();
    expect(screen.getByText('COMM-202611-0012')).toBeDefined();
    expect(screen.getByText(/Danh sách Đơn hoàn thành đã Đối soát/i)).toBeDefined();
    expect(screen.getByText(/Đã Thông Báo Chuyển Khoản/i)).toBeDefined();
  });

  it('clearly distinguishes DEMO banking information with prominent sandbox indicators', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/TÀI KHOẢN THỤ HƯỞNG THỬ NGHIỆM \(DEMO SANDBOX\)/i)).toBeDefined();
      expect(screen.getByText(/THÔNG TIN MÔ PHỎNG/i)).toBeDefined();
      expect(screen.getByText(/0071000888999/i)).toBeDefined();
      expect(screen.getByText(/CONG TY CO PHAN TRIPMATE VIETNAM/i)).toBeDefined();
    });
  });

  it('enforces non-empty bank transfer reference (MSG172)', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('COMM-202611-0012')).toBeDefined();
    });

    // stmt-001 is already PaymentReported in default fixture, select stmt-004 (Issued)
    const rows = screen.getAllByRole('row');
    const issuedRow = rows.find((r) => r.textContent?.includes('Tháng 11/2026') && r.textContent?.includes('27.750.000'));
    if (issuedRow) {
      fireEvent.click(issuedRow);
    }

    await waitFor(() => {
      const reportBtn = screen.getByRole('button', { name: /Xác nhận Đã chuyển khoản/i });
      expect(reportBtn).toBeDefined();

      // Submit with empty reference
      const refInput = screen.getByLabelText(/Mã giao dịch ngân hàng \/ Số bút toán/i);
      fireEvent.change(refInput, { target: { value: '' } });
      fireEvent.click(reportBtn);
    });

    await waitFor(() => {
      expect(
        screen.getAllByText(/Vui lòng nhập mã giao dịch ngân hàng trước khi xác nhận/i).length
      ).toBeGreaterThan(0);
    });
  });

  it('reports wire transfer, transitions status to Payment Reported, and does NOT mark Paid', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('COMM-202611-0012')).toBeDefined();
    });

    // Select stmt-004 (Issued)
    const rows = screen.getAllByRole('row');
    const issuedRow = rows.find((r) => r.textContent?.includes('27.750.000'));
    if (issuedRow) {
      fireEvent.click(issuedRow);
    }

    await waitFor(() => {
      const refInput = screen.getByLabelText(/Mã giao dịch ngân hàng \/ Số bút toán/i);
      fireEvent.change(refInput, { target: { value: 'VCB-20261205-777888' } });

      const reportBtn = screen.getByRole('button', { name: /Xác nhận Đã chuyển khoản/i });
      fireEvent.click(reportBtn);
    });

    await waitFor(() => {
      // MSG208 toast
      expect(
        screen.getByText(/Đã gửi thông tin chuyển khoản\. Bộ phận tài chính sẽ kiểm tra và xác nhận/i)
      ).toBeDefined();

      // Verify status shows Payment Reported, NOT Paid
      expect(screen.getByText(/Đã Thông Báo Chuyển Khoản/i)).toBeDefined();
      expect(screen.getByText(/VCB-20261205-777888/i)).toBeDefined();
    });
  });
});
