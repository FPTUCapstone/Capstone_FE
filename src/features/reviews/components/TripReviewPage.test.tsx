import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as useWebSessionModule from '@/features/auth/session/useWebSession';
import { tripReviewEn } from '@/features/trips/resources/en';
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

describe('TripReviewPage Eligibility (REVIEW-1, CR-09)', () => {
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

  it('REVIEW-1: Shows English error when trip does not exist without raw MSG codes', async () => {
    vi.spyOn(tripHistoryApi, 'getTripById').mockResolvedValue(null);

    const { container } = render(<TripReviewPage tripId="non-existent" />);

    await waitFor(() => {
      expect(screen.getByText(tripReviewEn.reviewPage.notFoundTitle)).toBeDefined();
      expect(
        screen.getByText(tripReviewEn.errors.tripByIdNotFound('non-existent'))
      ).toBeDefined();
    });
    expect(container.textContent).not.toMatch(/MSG\d+|BR-\d+/);
  });

  it('REVIEW-1: Rejects review if trip is not completed using English resource without raw MSG121/BR-91', async () => {
    const upcomingTrip: TripCardDto = {
      tripId: 'trip-upcoming-01',
      tripType: 'TourBooking',
      title: 'Hue Imperial Citadel 1-Day Discovery',
      departureDatetime: '2026-11-20T07:00:00Z',
      status: 'Upcoming',
      statusLabel: 'Upcoming',
      isReviewed: false,
    };
    vi.spyOn(tripHistoryApi, 'getTripById').mockResolvedValue(upcomingTrip);

    const { container } = render(<TripReviewPage tripId="trip-upcoming-01" />);

    await waitFor(() => {
      expect(
        screen.getByText(tripReviewEn.tripReview.notCompletedTitle)
      ).toBeDefined();
      expect(
        screen.getByText(tripReviewEn.tripReview.notCompletedDetail)
      ).toBeDefined();
    });
    expect(container.textContent).not.toMatch(/MSG\d+|BR-\d+/);
  });

  it('REVIEW-1: Rejects review if trip was already reviewed using English resource without raw MSG122/BR-92', async () => {
    const reviewedTrip: TripCardDto = {
      tripId: 'trip-reviewed-01',
      tripType: 'TourBooking',
      title: 'Hoi An Heritage Tour',
      departureDatetime: '2026-04-15T07:30:00Z',
      status: 'Completed',
      statusLabel: 'Completed',
      isReviewed: true,
      rating: 5,
      reviewComment: 'Wonderful trip!',
    };
    vi.spyOn(tripHistoryApi, 'getTripById').mockResolvedValue(reviewedTrip);

    const { container } = render(<TripReviewPage tripId="trip-reviewed-01" />);

    await waitFor(() => {
      expect(
        screen.getByText(tripReviewEn.tripReview.alreadyReviewedTitle)
      ).toBeDefined();
      expect(
        screen.getByText(tripReviewEn.tripReview.alreadyReviewedDetail(5))
      ).toBeDefined();
    });
    expect(container.textContent).not.toMatch(/MSG\d+|BR-\d+/);
  });

  it('Renders review form when trip is completed and unreviewed', async () => {
    const eligibleTrip: TripCardDto = {
      tripId: 'trip-eligible-01',
      tripType: 'SelfPlannedItinerary',
      title: 'Da Nang - Hoi An Itinerary',
      departureDatetime: '2026-05-24T08:00:00Z',
      status: 'Completed',
      statusLabel: 'Completed',
      isReviewed: false,
    };
    vi.spyOn(tripHistoryApi, 'getTripById').mockResolvedValue(eligibleTrip);

    render(<TripReviewPage tripId="trip-eligible-01" />);

    await waitFor(() => {
      expect(
        screen.getByText(
          new RegExp(tripReviewEn.tripReview.ratingSectionTitle, 'i')
        )
      ).toBeDefined();
      expect(
        screen.getByRole('button', {
          name: new RegExp(tripReviewEn.actions.submitReview, 'i'),
        })
      ).toBeDefined();
    });
  });

  it('Renders PENDING_BE_INTEGRATION status when BFF returns verified 501 instead of NOT_FOUND or NETWORK error', async () => {
    vi.spyOn(tripHistoryApi, 'getTripById').mockRejectedValue(
      new tripHistoryApi.TripApiError(
        tripReviewEn.bff.tripHistoryPendingDetail,
        501,
        { errorCode: 'PENDING_BE_INTEGRATION' }
      )
    );

    render(<TripReviewPage tripId="trip-prod-01" />);

    await waitFor(() => {
      expect(
        screen.getByText(tripReviewEn.reviewPage.pendingTitle)
      ).toBeDefined();
      expect(
        screen.getByText(/Trip history service is pending backend integration/i)
      ).toBeDefined();
    });
  });

  it('Renders NETWORK error when a generic 501 without PENDING_BE_INTEGRATION errorCode is returned', async () => {
    vi.spyOn(tripHistoryApi, 'getTripById').mockRejectedValue(
      new tripHistoryApi.TripApiError(
        tripReviewEn.errors.systemError,
        501,
        { errorCode: 'MSG127' }
      )
    );

    render(<TripReviewPage tripId="trip-prod-02" />);

    await waitFor(() => {
      expect(
        screen.getByText(tripReviewEn.reviewPage.networkErrorTitle)
      ).toBeDefined();
      expect(
        screen.getByText(/TripMate is temporarily unable to process your request/i)
      ).toBeDefined();
    });
  });
});
