import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as useWebSessionModule from '@/features/auth/session/useWebSession';
import * as tripHistoryApi from '@/features/trips/services/tripHistoryApi';
import type { TripCardDto } from '@/features/trips/types/tripHistory';
import { TripReviewPage } from './TripReviewPage';

const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue('1'),
  }),
}));

describe('TripReviewPage Eligibility (REVIEW-1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useWebSessionModule, 'useWebSession').mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 10,
        email: 'traveler@tripmate.vn',
        fullName: 'Phuc Nguyen',
        role: 'Traveler',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'token',
        accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
      },
    });
  });

  it('REVIEW-1: Shows error when trip does not exist', async () => {
    vi.spyOn(tripHistoryApi, 'getTripById').mockResolvedValue(null);

    render(<TripReviewPage tripId="non-existent" />);

    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy chuyến đi')).toBeDefined();
    });
  });

  it('REVIEW-1: Rejects review if trip is not completed (MSG121)', async () => {
    const upcomingTrip: TripCardDto = {
      tripId: 'trip-upcoming-01',
      tripType: 'TourBooking',
      title: 'Khám Phá Cố Đô Huế 1 Ngày',
      departureDatetime: '2026-11-20T07:00:00Z',
      status: 'Upcoming',
      statusLabel: 'Sắp khởi hành',
      isReviewed: false,
    };
    vi.spyOn(tripHistoryApi, 'getTripById').mockResolvedValue(upcomingTrip);

    render(<TripReviewPage tripId="trip-upcoming-01" />);

    await waitFor(() => {
      expect(screen.getByText('Chuyến đi chưa hoàn thành')).toBeDefined();
      expect(screen.getByText(/MSG121/i)).toBeDefined();
    });
  });

  it('REVIEW-1: Rejects review if trip was already reviewed (MSG122)', async () => {
    const reviewedTrip: TripCardDto = {
      tripId: 'trip-reviewed-01',
      tripType: 'TourBooking',
      title: 'Hành Trình Di Sản Phố Cổ Hội An',
      departureDatetime: '2026-04-15T07:30:00Z',
      status: 'Completed',
      statusLabel: 'Đã hoàn thành',
      isReviewed: true,
      rating: 5,
      reviewComment: 'Chuyến đi rất tuyệt vời!',
    };
    vi.spyOn(tripHistoryApi, 'getTripById').mockResolvedValue(reviewedTrip);

    render(<TripReviewPage tripId="trip-reviewed-01" />);

    await waitFor(() => {
      expect(screen.getByText('Chuyến đi này đã được đánh giá')).toBeDefined();
      expect(screen.getByText(/MSG122/i)).toBeDefined();
    });
  });

  it('Renders review form when trip is completed and unreviewed', async () => {
    const eligibleTrip: TripCardDto = {
      tripId: 'trip-eligible-01',
      tripType: 'SelfPlannedItinerary',
      title: 'Hành trình Đà Nẵng - Hội An',
      departureDatetime: '2026-05-24T08:00:00Z',
      status: 'Completed',
      statusLabel: 'Đã hoàn thành',
      isReviewed: false,
    };
    vi.spyOn(tripHistoryApi, 'getTripById').mockResolvedValue(eligibleTrip);

    render(<TripReviewPage tripId="trip-eligible-01" />);

    await waitFor(() => {
      expect(screen.getByText(/Trải nghiệm chung về chuyến đi/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Gửi đánh giá/i })).toBeDefined();
    });
  });

  it('Renders PENDING_BE_INTEGRATION status when BFF returns verified 501 instead of NOT_FOUND or NETWORK error', async () => {
    vi.spyOn(tripHistoryApi, 'getTripById').mockRejectedValue(
      new tripHistoryApi.TripApiError(
        'Trip history service is pending backend integration.',
        501,
        { errorCode: 'PENDING_BE_INTEGRATION' }
      )
    );

    render(<TripReviewPage tripId="trip-prod-01" />);

    await waitFor(() => {
      expect(
        screen.getByText('Trip review service is pending backend integration')
      ).toBeDefined();
      expect(
        screen.getByText(/Trip history service is pending backend integration/i)
      ).toBeDefined();
    });
  });

  it('Renders NETWORK error when a generic 501 without PENDING_BE_INTEGRATION errorCode is returned', async () => {
    vi.spyOn(tripHistoryApi, 'getTripById').mockRejectedValue(
      new tripHistoryApi.TripApiError(
        'TripMate is temporarily unable to process your request. Please check your connection and try again.',
        501,
        { errorCode: 'MSG127' }
      )
    );

    render(<TripReviewPage tripId="trip-prod-02" />);

    await waitFor(() => {
      expect(screen.getByText('Lỗi kết nối máy chủ')).toBeDefined();
      expect(
        screen.getByText(/TripMate is temporarily unable to process your request/i)
      ).toBeDefined();
    });
  });
});
