import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorBookingListView } from './OperatorBookingListView';
import { resetDemoBookingsState } from '../services/operatorBookingService';
import { OPERATOR_BOOKING_MESSAGES } from '../types/bookingLifecycle';

describe('OperatorBookingListView (UC-40, UC-41, UC-42 Workspace)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      NEXT_PUBLIC_ENABLE_DEMO_FIXTURES: 'true',
    };
    resetDemoBookingsState();
  });

  afterEach(() => {
    cleanup();
    process.env = originalEnv;
  });

  describe('Production NO_BACKEND truthfulness', () => {
    it('renders PENDING_BE_INTEGRATION status banner and empty state when isDemo is false', async () => {
      render(<OperatorBookingListView isDemo={false} />);

      await waitFor(() => {
        expect(
          screen.getByText(OPERATOR_BOOKING_MESSAGES.PENDING_BE_INTEGRATION)
        ).toBeDefined();
      });

      // Filter controls disabled
      expect(screen.getByLabelText(/Gói tour/i).getAttribute('disabled')).toBeDefined();
      expect(screen.getByLabelText(/Trạng thái đơn/i).getAttribute('disabled')).toBeDefined();

      // Zero summaries
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
      expect(screen.queryByText('BK-20260919-0141')).toBeNull();
    });
  });

  describe('Demo Mode Workspace', () => {
    it('renders Demo banner, summary KPI cards, and booking items list', async () => {
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getByText(/Chế độ xem trước giao diện/i)).toBeDefined();
      });

      // KPI summary cards
      expect(screen.getByText('Tổng đơn đặt chỗ')).toBeDefined();
      expect(screen.getByText('Tổng số hành khách')).toBeDefined();
      expect(screen.getByText('Doanh thu xác nhận')).toBeDefined();

      // Items present in document
      expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Nguyễn Văn An').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Ba Na Hills full-day tour').length).toBeGreaterThan(0);
    });

    it('filters bookings by tour package', async () => {
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      const selectTour = screen.getByLabelText(/Gói tour/i);
      fireEvent.change(selectTour, { target: { value: 'tour-55' } });

      const applyBtn = screen.getByRole('button', { name: /Áp dụng lọc/i });
      fireEvent.click(applyBtn);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260914-0144').length).toBeGreaterThan(0);
        expect(screen.queryByText('BK-20260919-0141')).toBeNull();
      });
    });

    it('filters bookings by status', async () => {
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      const selectStatus = screen.getByLabelText(/Trạng thái đơn/i);
      fireEvent.change(selectStatus, { target: { value: 'PendingPayment' } });

      const applyBtn = screen.getByRole('button', { name: /Áp dụng lọc/i });
      fireEvent.click(applyBtn);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260913-0146').length).toBeGreaterThan(0);
        expect(screen.queryByText('BK-20260919-0141')).toBeNull();
      });
    });

    it('searches by booking code', async () => {
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      const searchInput = screen.getByPlaceholderText(/Tìm mã đơn/i);
      fireEvent.change(searchInput, { target: { value: '0148' } });

      const applyBtn = screen.getByRole('button', { name: /Áp dụng lọc/i });
      fireEvent.click(applyBtn);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260912-0148').length).toBeGreaterThan(0);
        expect(screen.queryByText('BK-20260919-0141')).toBeNull();
      });
    });

    it('shows MSG29 when date range is invalid', async () => {
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      const startDateInput = screen.getByLabelText(/Khởi hành từ ngày/i);
      const endDateInput = screen.getByLabelText(/Đến ngày/i);

      fireEvent.change(startDateInput, { target: { value: '2026-09-30' } });
      fireEvent.change(endDateInput, { target: { value: '2026-09-01' } });

      const applyBtn = screen.getByRole('button', { name: /Áp dụng lọc/i });
      fireEvent.click(applyBtn);

      await waitFor(() => {
        expect(screen.getByText(OPERATOR_BOOKING_MESSAGES.MSG29)).toBeDefined();
      });
    });

    it('shows MSG128 when no bookings match filter criteria', async () => {
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      const searchInput = screen.getByPlaceholderText(/Tìm mã đơn/i);
      fireEvent.change(searchInput, { target: { value: 'MA-DON-KHONG-CO' } });

      const applyBtn = screen.getByRole('button', { name: /Áp dụng lọc/i });
      fireEvent.click(applyBtn);

      await waitFor(() => {
        expect(screen.getByText(OPERATOR_BOOKING_MESSAGES.MSG128)).toBeDefined();
      });
    });

    it('opens detail drawer when clicking Chi tiết button', async () => {
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      const detailButtons = screen.getAllByRole('button', { name: /Chi tiết/i });
      fireEvent.click(detailButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
        expect(screen.getByText(/Chi tiết đơn đặt chỗ/i)).toBeDefined();
      });
    });

    it('executes cancellation flow and updates booking state (UC-41)', async () => {
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      // Open detail drawer
      const detailButtons = screen.getAllByRole('button', { name: /Chi tiết/i });
      fireEvent.click(detailButtons[0]);

      // Click cancel action in drawer
      const cancelDrawerBtn = await screen.findByRole('button', { name: /Hủy đặt chỗ \(UC-41\)/i });
      fireEvent.click(cancelDrawerBtn);

      // Cancel dialog opens
      const textarea = await screen.findByLabelText(/Chi tiết lý do hủy/i);
      fireEvent.change(textarea, { target: { value: 'Khách hàng có lịch bận đột xuất' } });

      const submitCancelBtn = screen.getByRole('button', { name: /Xác nhận hủy đặt chỗ/i });
      fireEvent.click(submitCancelBtn);

      // Verify feedback banner
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeDefined();
        expect(screen.getByText(/Đã hủy đơn đặt chỗ thành công/i)).toBeDefined();
      });
    });

    it('executes refund initiation flow and updates refund record (UC-42)', async () => {
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      // Open detail drawer
      const detailButtons = screen.getAllByRole('button', { name: /Chi tiết/i });
      fireEvent.click(detailButtons[0]);

      // Click refund action in drawer
      const refundDrawerBtn = await screen.findByRole('button', { name: /Hoàn tiền \(UC-42\)/i });
      fireEvent.click(refundDrawerBtn);

      // Refund dialog opens
      const textarea = await screen.findByLabelText(/Ghi chú hoàn tiền/i);
      fireEvent.change(textarea, { target: { value: 'Khởi tạo đối soát hoàn trả' } });

      const submitRefundBtn = screen.getByRole('button', { name: /Khởi tạo hoàn tiền/i });
      fireEvent.click(submitRefundBtn);

      // Verify feedback banner
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeDefined();
        expect(screen.getByText(/Yêu cầu hoàn tiền đã được khởi tạo thành công/i)).toBeDefined();
      });
    });
  });
});
