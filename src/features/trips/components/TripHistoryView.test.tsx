import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as tripHistoryApi from '../services/tripHistoryApi';
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
      pageSize: 10,
    });

    render(<TripHistoryView />);

    await waitFor(() => {
      expect(screen.getByText('Chưa có chuyến đi nào')).toBeDefined();
      expect(screen.getByText(/MSG128/i)).toBeDefined();
    });

    expect(screen.getByRole('link', { name: /Lên lịch trình thông minh/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Khám phá tour bản địa/i })).toBeDefined();
  });
});
