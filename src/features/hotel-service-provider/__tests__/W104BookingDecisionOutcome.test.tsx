import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BookingDecisionOutcomeView } from '../components/w104/BookingDecisionOutcomeView';
import { ToastProvider } from '../components/common/Toast';
import { ProviderBookingService } from '../services/providerBookingService';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('Screen W104: Booking Decision & Service Outcome (Service Provider Workspace, UC-79, UC-80)', () => {
  beforeEach(() => {
    ProviderBookingService.resetState();
  });

  const renderComponent = (id: string = 'req-001') =>
    render(
      <ToastProvider>
        <BookingDecisionOutcomeView id={id} />
      </ToastProvider>
    );

  it('renders 62/38 split layout, traveler identity and direct payment notice without technical metadata', async () => {
    renderComponent('req-001');

    await waitFor(() => {
      expect(screen.getAllByText('HBR-20261113-082').length).toBeGreaterThan(0);
    });

    // Check 62/38 sections in Vietnamese
    expect(screen.getByText('Thông tin Đặt phòng & Lưu trú')).toBeDefined();
    expect(screen.getByText('Thông tin Du khách & Yêu cầu riêng')).toBeDefined();

    // Check Traveler Info
    expect(screen.getByText('Nguyễn Văn An')).toBeDefined();
    expect(screen.getByText('0912 345 678')).toBeDefined();
    expect(screen.getByText('an.nguyen@example.com')).toBeDefined();

    // Check Direct Payment Policy Notice (no visible BR-196 tag)
    expect(screen.getByText(/Chính sách thanh toán trực tiếp tại khách sạn/i)).toBeDefined();
    expect(
      screen.getByText(/Khách hàng sẽ thanh toán trực tiếp cho khách sạn khi nhận phòng/i)
    ).toBeDefined();
  });

  it('executes Confirm decision flow via dialog and shows MSG203', async () => {
    renderComponent('req-001');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Xác nhận tiếp nhận/i })).toBeDefined();
    });

    // Click Confirm button
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận tiếp nhận/i }));

    // Confirmation dialog opens
    expect(screen.getByText(/Xác nhận tiếp nhận yêu cầu đặt phòng/i)).toBeDefined();
    const confirmSubmitBtn = screen.getByRole('button', { name: /Xác nhận đồng ý/i });

    fireEvent.click(confirmSubmitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Đã xác nhận yêu cầu đặt phòng\. Du khách đã được thông báo\./i)
      ).toBeDefined();
    });
  });

  it('enforces mandatory rejection reason and MSG123 validation', async () => {
    renderComponent('req-002');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Từ chối yêu cầu/i })).toBeDefined();
    });

    // Open rejection dialog
    fireEvent.click(screen.getByRole('button', { name: /Từ chối yêu cầu/i }));

    expect(screen.getByText(/Từ chối yêu cầu đặt phòng/i)).toBeDefined();
    const declineSubmitBtn = screen.getByRole('button', { name: /Xác nhận từ chối/i });

    // Submit empty reason -> triggers MSG123
    fireEvent.click(declineSubmitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Vui lòng cung cấp lý do từ chối yêu cầu/i)).toBeDefined();
    });

    // Fill valid reason
    const reasonTextarea = screen.getByPlaceholderText(/Nhập lý do từ chối rõ ràng/i);
    fireEvent.change(reasonTextarea, {
      target: { value: 'Khách sạn đã hết phòng trong thời gian này.' },
    });

    fireEvent.click(declineSubmitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Đã từ chối yêu cầu đặt phòng\. Du khách đã được thông báo lý do\./i)
      ).toBeDefined();
    });
  });

  it('allows recording service outcome on confirmed stay where check-in date has passed (req-004)', async () => {
    // req-004 has requestedDate '2026-11-11' which is in the past
    renderComponent('req-004');

    await waitFor(() => {
      expect(screen.getByText('Ghi nhận Kết quả Lưu trú')).toBeDefined();
      expect(screen.getByRole('button', { name: /Đánh dấu Hoàn thành Lưu trú/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Đánh dấu Khách Vắng mặt/i })).toBeDefined();
    });

    // Verify 10% commission preview
    expect(screen.getByText(/Ước tính hoa hồng nền tảng \(10%\)/i)).toBeDefined();

    // Click Mark Completed
    fireEvent.click(screen.getByRole('button', { name: /Đánh dấu Hoàn thành Lưu trú/i }));

    // Confirm dialog opens
    expect(screen.getByText(/Xác nhận Khách đã Hoàn thành Lưu trú/i)).toBeDefined();
    const confirmCompletionBtn = screen.getByRole('button', { name: /Xác nhận hoàn thành/i });
    fireEvent.click(confirmCompletionBtn);

    await waitFor(() => {
      expect(screen.getByText(/Đã ghi nhận kết quả lưu trú\./i)).toBeDefined();
      expect(screen.getByText(/Kết quả Vận hành đã Ghi nhận/i)).toBeDefined();
    });
  });

  it('shows locked notice when stay date is in the future (req-003)', async () => {
    // req-003 has requestedDate '2026-12-20' (future)
    renderComponent('req-003');

    await waitFor(() => {
      expect(screen.getByText(/Chưa đến thời điểm ghi nhận kết quả/i)).toBeDefined();
      expect(
        screen.getByText(/Chức năng ghi nhận kết quả lưu trú sẽ mở sau ngày khách làm thủ tục nhận phòng/i)
      ).toBeDefined();
    });
  });
});
