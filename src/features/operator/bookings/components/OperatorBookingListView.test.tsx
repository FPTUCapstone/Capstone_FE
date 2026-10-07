import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStorage, type WebAuthContext } from '@/features/auth/session/authSession';
import { OperatorBookingListView } from './OperatorBookingListView';
import * as bookingService from '../services/operatorBookingService';
import {
  OPERATOR_BOOKING_DEFAULT_PAGE_SIZE,
  OPERATOR_BOOKING_MESSAGES,
} from '../types/bookingLifecycle';

const mocks = vi.hoisted(() => ({
  webRefresh: vi.fn(),
}));

vi.mock('@/lib/authApi', () => ({
  webRefresh: mocks.webRefresh,
}));

function seedOperatorSession(userId = 101) {
  AuthStorage.accept(
    {
      userId,
      email: `operator${userId}@example.com`,
      fullName: `Operator ${userId}`,
      role: 'TourOperator',
      status: 'Active',
      applicationStatus: 'Approved',
      applicationUnresolved: false,
      accessToken: 'test-operator-token',
      accessTokenExpiresAtUtc: new Date(Date.now() + 3600_000).toISOString(),
    } as unknown as WebAuthContext,
    false
  );
}

describe('OperatorBookingListView (UC-40, UC-41, UC-42 Workspace)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      NEXT_PUBLIC_ENABLE_DEMO_FIXTURES: 'true',
    };
    mocks.webRefresh.mockRejectedValue({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    bookingService.resetDemoBookingsState();
    seedOperatorSession(101);
  });

  afterEach(() => {
    cleanup();
    AuthStorage.clear();
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
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

  describe('CR-01 Default Page Size & CR-02 Draft vs Applied Filter Behavior', () => {
    it('requests default pageSize = 20 (OPERATOR_BOOKING_DEFAULT_PAGE_SIZE)', async () => {
      const spy = vi.spyOn(bookingService, 'getOperatorBookings');
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          pageSize: 20,
        }),
        expect.objectContaining({
          isDemo: true,
          demoActorUserId: 101,
        })
      );
      expect(OPERATOR_BOOKING_DEFAULT_PAGE_SIZE).toBe(20);
    });

    it('does NOT call getOperatorBookings while typing search or changing tour/status/date inputs before submit', async () => {
      const spy = vi.spyOn(bookingService, 'getOperatorBookings');
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      });

      expect(spy).toHaveBeenCalledTimes(1);

      // Mutate all draft filter inputs without submitting
      fireEvent.change(screen.getByPlaceholderText(/Tìm mã đơn/i), {
        target: { value: '0148' },
      });
      fireEvent.change(screen.getByLabelText(/Gói tour/i), {
        target: { value: 'tour-142' },
      });
      fireEvent.change(screen.getByLabelText(/Trạng thái đơn/i), {
        target: { value: 'Confirmed' },
      });
      fireEvent.change(screen.getByLabelText(/Khởi hành từ ngày/i), {
        target: { value: '2026-09-01' },
      });
      fireEvent.change(screen.getByLabelText(/Đến ngày/i), {
        target: { value: '2026-09-30' },
      });

      // Still only the initial retrieval call
      expect(spy).toHaveBeenCalledTimes(1);

      // Submit via "Áp dụng lọc" button -> triggers exactly ONE new call with appliedFilters and page=1
      fireEvent.click(screen.getByRole('button', { name: /Áp dụng lọc/i }));

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(2);
      });

      expect(spy).toHaveBeenLastCalledWith(
        {
          tourId: 'tour-142',
          status: 'Confirmed',
          startDate: '2026-09-01',
          endDate: '2026-09-30',
          searchKeyword: '0148',
          page: 1,
          pageSize: 20,
        },
        {
          isDemo: true,
          demoActorUserId: 101,
        }
      );

      // Reset via "Đặt lại" button -> resets draft & applied filters and page=1 in a single retrieval
      fireEvent.click(screen.getByRole('button', { name: /Đặt lại/i }));

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(3);
      });

      expect(spy).toHaveBeenLastCalledWith(
        {
          tourId: undefined,
          status: undefined,
          startDate: undefined,
          endDate: undefined,
          searchKeyword: undefined,
          page: 1,
          pageSize: 20,
        },
        {
          isDemo: true,
          demoActorUserId: 101,
        }
      );
    });

    it('keeps appliedFilters when paginating and resets page to 1 when applying new filters', async () => {
      const spy = vi.spyOn(bookingService, 'getOperatorBookings');
      // Use initialParams.pageSize = 2 so 6 items span 3 pages
      render(<OperatorBookingListView isDemo={true} initialParams={{ pageSize: 2 }} />);

      await waitFor(() => {
        expect(screen.getByText(/Hiển thị trang/i)).toBeDefined();
      });
      expect(spy).toHaveBeenCalledTimes(1);

      // Edit draft search WITHOUT clicking Apply
      fireEvent.change(screen.getByPlaceholderText(/Tìm mã đơn/i), {
        target: { value: 'UNAPPLIED-DRAFT' },
      });
      expect(spy).toHaveBeenCalledTimes(1);

      // Click "Sau" pagination button -> changes page to 2 while keeping appliedFilters (searchKeyword still undefined)
      fireEvent.click(screen.getByRole('button', { name: 'Sau' }));

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(2);
      });
      expect(spy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          searchKeyword: undefined,
          page: 2,
          pageSize: 2,
        }),
        expect.objectContaining({ isDemo: true, demoActorUserId: 101 })
      );

      // Now change draft search to '0141' and submit form (e.g. pressing Enter / submit) -> resets page to 1
      const searchInput = screen.getByPlaceholderText(/Tìm mã đơn/i);
      fireEvent.change(searchInput, { target: { value: '0141' } });
      fireEvent.submit(searchInput.closest('form')!);

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(3);
      });
      expect(spy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          searchKeyword: '0141',
          page: 1,
          pageSize: 2,
        }),
        expect.objectContaining({ isDemo: true, demoActorUserId: 101 })
      );
    });
  });

  describe('BR-105 Session Identity & Fail-Closed Authorization', () => {
    it('fails closed with MSG126 when Demo mode is rendered without an authenticated operator session', async () => {
      AuthStorage.clear();
      render(<OperatorBookingListView isDemo={true} demoActorUserId={undefined} />);

      await waitFor(() => {
        expect(screen.getByText(OPERATOR_BOOKING_MESSAGES.MSG126)).toBeDefined();
      });

      expect(screen.queryByText('BK-20260919-0141')).toBeNull();
    });

    it('prevents operator 999 from viewing operator 101 fixtures', async () => {
      seedOperatorSession(999);
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getAllByText('BK-20260925-9999').length).toBeGreaterThan(0);
      });

      expect(screen.queryByText('BK-20260919-0141')).toBeNull();
    });
  });

  describe('Demo Mode Workspace & UC-40 / UC-41 / UC-42 Flows', () => {
    it('renders Demo banner, summary KPI cards, and booking items list for signed-in operator 101', async () => {
      render(<OperatorBookingListView isDemo={true} />);

      await waitFor(() => {
        expect(screen.getByText(/Chế độ xem trước giao diện/i)).toBeDefined();
      });

      // KPI summary cards
      expect(screen.getByText('Tổng đơn đặt chỗ')).toBeDefined();
      expect(screen.getByText('Tổng số hành khách')).toBeDefined();
      expect(screen.getByText('Doanh thu xác nhận')).toBeDefined();

      // Owned items present in document; foreign booking-9999 excluded
      expect(screen.getAllByText('BK-20260919-0141').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Nguyễn Văn An').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Ba Na Hills full-day tour').length).toBeGreaterThan(0);
      expect(screen.queryByText('BK-20260925-9999')).toBeNull();
    });

    it('filters bookings by tour package on Apply', async () => {
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

    it('filters bookings by status on Apply', async () => {
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

    it('searches by booking code on Apply', async () => {
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

    it('shows MSG29 when date range is invalid on Apply', async () => {
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

    it('shows MSG128 when no bookings match filter criteria on Apply', async () => {
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

    it('executes refund initiation flow even when notes contain "timeout", "retry", or "system" (UC-42)', async () => {
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

      // Refund dialog opens; enter notes containing words that previously triggered hidden failures
      const textarea = await screen.findByLabelText(/Ghi chú hoàn tiền/i);
      fireEvent.change(textarea, {
        target: { value: 'Khách báo timeout khi retry trên system cũ' },
      });

      const submitRefundBtn = screen.getByRole('button', { name: /Khởi tạo hoàn tiền/i });
      fireEvent.click(submitRefundBtn);

      // Verify feedback banner succeeds normally with MSG83
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeDefined();
        expect(
          screen.getByText(/Yêu cầu hoàn tiền đã được khởi tạo thành công/i)
        ).toBeDefined();
      });
    });
  });
});
