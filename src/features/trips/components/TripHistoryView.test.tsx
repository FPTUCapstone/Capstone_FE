import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as tripHistoryApi from '../services/tripHistoryApi';
import { TripApiError, type TripCardDto } from '../types/tripHistory';
import { TripHistoryView } from './TripHistoryView';

// Mock useSearchParams
const mockGet = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

describe('TripHistoryView Component (TRIP-1, TRIP-4, TRIP-6)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue('1'); // demo=1
    process.env = { ...originalEnv, NEXT_PUBLIC_ENABLE_DEMO_FIXTURES: 'true' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('TRIP-1: Renders trip history view with completed trips in demo mode', async () => {
    render(<TripHistoryView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Đã hoàn thành/i })).toBeDefined();
    });

    // Check that cards are rendered
    await waitFor(() => {
      expect(screen.getByText('Hành trình Đà Nẵng - Hội An')).toBeDefined();
    });
  });

  it('TRIP-4: Switches tabs correctly between Upcoming, Completed, and Cancelled', async () => {
    const getTripHistorySpy = vi.spyOn(tripHistoryApi, 'getTripHistory');

    render(<TripHistoryView />);

    await waitFor(() => {
      expect(screen.getByText('Hành trình Đà Nẵng - Hội An')).toBeDefined();
    });

    // Switch to Cancelled tab
    const cancelledTabBtn = screen.getByRole('button', { name: /Đã hủy \/ Hoàn tiền/i });
    fireEvent.click(cancelledTabBtn);

    await waitFor(() => {
      expect(getTripHistorySpy).toHaveBeenCalledWith(
        expect.objectContaining({ tab: 'Cancelled' }),
        expect.anything()
      );
    });

    // Switch to Upcoming tab
    const upcomingTabBtn = screen.getByRole('button', { name: /Sắp tới/i });
    fireEvent.click(upcomingTabBtn);

    await waitFor(() => {
      expect(getTripHistorySpy).toHaveBeenCalledWith(
        expect.objectContaining({ tab: 'Upcoming' }),
        expect.anything()
      );
    });
  });

  it('TRIP-6: Empty state displays truthful message MSG128 and action links', async () => {
    vi.spyOn(tripHistoryApi, 'getTripHistory').mockResolvedValue({
      status: 'SUCCESS',
      trips: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
    });

    render(<TripHistoryView />);

    await waitFor(() => {
      expect(screen.getByText('Chưa có chuyến đi nào')).toBeDefined();
      expect(screen.getByText(/MSG128/i)).toBeDefined();
    });

    expect(screen.getByRole('link', { name: /Lên lịch trình thông minh/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Khám phá tour bản địa/i })).toBeDefined();
  });

  it('CR-02: Search triggers upon explicit submission (button click / form submit)', async () => {
    const getTripHistorySpy = vi.spyOn(tripHistoryApi, 'getTripHistory');
    render(<TripHistoryView />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Tìm kiếm chuyến đi/i)).toBeDefined();
    });

    const searchInput = screen.getByLabelText(/Tìm kiếm chuyến đi/i);
    fireEvent.change(searchInput, { target: { value: 'Đà Nẵng' } });

    // typing should not yet invoke search with new query
    const submitBtn = screen.getByRole('button', { name: /Tìm/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(getTripHistorySpy).toHaveBeenCalledWith(
        expect.objectContaining({ searchQuery: 'Đà Nẵng' }),
        expect.anything()
      );
    });
  });

  it('State transition: clears stale pendingNotice when a retry fails with 5xx/network error', async () => {
    const getTripHistorySpy = vi.spyOn(tripHistoryApi, 'getTripHistory');

    // First call: returns 501 PENDING_BE_INTEGRATION
    getTripHistorySpy.mockResolvedValueOnce({
      status: 'PENDING_BE_INTEGRATION',
      message: 'Trip history service is pending backend integration.',
      trips: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
    });

    render(<TripHistoryView />);

    // First state: Pending integration notice is visible
    await waitFor(() => {
      expect(screen.getByText('Dịch vụ lịch sử chuyến đi')).toBeDefined();
      expect(
        screen.getByText(/Trip history service is pending backend integration/i)
      ).toBeDefined();
    });

    // Retry fails with 500 / network error
    getTripHistorySpy.mockRejectedValueOnce(
      new TripApiError(
        'TripMate is temporarily unable to process your request. Please check your connection and try again.',
        500,
        { errorCode: 'MSG127' }
      )
    );

    // Click retry
    const retryBtn = screen.getByRole('button', { name: /Thử lại kết nối/i });
    fireEvent.click(retryBtn);

    // Second state: Pending notice MUST disappear, and system error state MUST appear
    await waitFor(() => {
      expect(screen.getByText('Không thể tải dữ liệu')).toBeDefined();
      expect(
        screen.getByText(/TripMate is temporarily unable to process your request/i)
      ).toBeDefined();
    });

    // Assert stale pending banner is strictly NOT rendered
    expect(screen.queryByText('Dịch vụ lịch sử chuyến đi')).toBeNull();
    expect(
      screen.queryByText(/Trip history service is pending backend integration/i)
    ).toBeNull();
  });

  describe('Submitted Review modal accessibility & focus trap', () => {
    const mockReviewedTrip: TripCardDto = {
      tripId: 'trip-reviewed-01',
      tripType: 'TourBooking',
      title: 'Tour Đã Đánh Giá Xong',
      departureDatetime: '2026-05-24T08:00:00Z',
      status: 'Completed',
      statusLabel: 'Đã hoàn thành',
      isReviewed: true,
      rating: 5,
      reviewComment: 'Trải nghiệm du lịch tuyệt vời cùng gia đình!',
      reviewedAtUtc: '2026-05-25T10:00:00Z',
    };

    beforeEach(() => {
      vi.spyOn(tripHistoryApi, 'getTripHistory').mockResolvedValue({
        status: 'SUCCESS',
        trips: [mockReviewedTrip],
        totalCount: 1,
        page: 1,
        pageSize: 20,
      });
    });

    it('opens review modal, establishes initial focus, traps focus with Tab/Shift+Tab, and restores focus on Escape', async () => {
      render(<TripHistoryView />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Xem đánh giá/i })).toBeDefined();
      });

      const triggerBtn = screen.getByRole('button', { name: /Xem đánh giá/i });
      triggerBtn.focus();
      expect(document.activeElement).toBe(triggerBtn);

      fireEvent.click(triggerBtn);

      // Verify dialog is open and accessible
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeDefined();
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-labelledby')).toBe('review-dialog-title');
      expect(dialog.querySelector('#review-dialog-title')?.textContent).toBe('Tour Đã Đánh Giá Xong');

      // The dialog has two close buttons: top close button and bottom close button
      const closeButtons = screen.getAllByRole('button', { name: /đóng/i });
      expect(closeButtons.length).toBe(2);
      const topCloseBtn = closeButtons[0];
      const bottomCloseBtn = closeButtons[1];

      // Initial focus placed on top close button
      expect(document.activeElement).toBe(topCloseBtn);

      // Focus trap: Tab moves from top close button to bottom close button
      bottomCloseBtn.focus();
      expect(document.activeElement).toBe(bottomCloseBtn);

      // Tab on last element wraps to first element
      fireEvent.keyDown(window, { key: 'Tab' });
      expect(document.activeElement).toBe(topCloseBtn);

      // Shift+Tab on first element wraps to last element
      fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(bottomCloseBtn);

      // Escape key closes modal and restores focus to original trigger
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(triggerBtn);
    });

    it('closing modal via Close button restores focus to trigger button', async () => {
      render(<TripHistoryView />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Xem đánh giá/i })).toBeDefined();
      });

      const triggerBtn = screen.getByRole('button', { name: /Xem đánh giá/i });
      triggerBtn.focus();
      fireEvent.click(triggerBtn);

      expect(screen.getByRole('dialog')).toBeDefined();

      const closeButtons = screen.getAllByRole('button', { name: /đóng/i });
      fireEvent.click(closeButtons[1]); // Click bottom close button

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(triggerBtn);
    });
  });
});
