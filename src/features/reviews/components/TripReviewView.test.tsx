import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tripReviewEn } from '@/features/trips/resources/en';
import type { TripCardDto } from '@/features/trips/types/tripHistory';
import * as reviewApi from '../services/reviewApi';
import { TripReviewView } from './TripReviewView';

const mockTrip: TripCardDto = {
  tripId: 'trip-demo-01',
  tripType: 'SelfPlannedItinerary',
  title: 'Da Nang - Hoi An Itinerary',
  departureDatetime: '2026-05-24T08:00:00Z',
  status: 'Completed',
  statusLabel: 'Completed',
  stopsSummary: ['Marble Mountains', 'Hoi An'],
  isReviewed: false,
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: vi.fn(),
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue('1'),
  }),
}));

describe('TripReviewView Component (REVIEW-7, REVIEW-10, CR-09)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('REVIEW-7: Live comment counter updates correctly with input in English', () => {
    render(<TripReviewView trip={mockTrip} />);

    const textarea = screen.getByPlaceholderText(
      tripReviewEn.tripReview.commentPlaceholder
    );
    expect(
      screen.getByText(tripReviewEn.tripReview.characterCount(0, 500))
    ).toBeDefined();

    // Type 33 characters
    fireEvent.change(textarea, {
      target: { value: 'This trip was truly wonderful!!! ' },
    });

    expect(
      screen.getByText(tripReviewEn.tripReview.characterCount(32, 500))
    ).toBeDefined();
  });

  it('Displays English error when submitted with missing rating (MSG66)', async () => {
    render(<TripReviewView trip={mockTrip} />);

    const titleInput = screen.getByRole('textbox', {
      name: new RegExp(tripReviewEn.tripReview.titleLabel, 'i'),
    });
    fireEvent.change(titleInput, { target: { value: 'Enjoyable trip' } });

    const textarea = screen.getByPlaceholderText(
      tripReviewEn.tripReview.commentPlaceholder
    );
    fireEvent.change(textarea, {
      target: { value: 'Valid review content.' },
    });

    const submitBtn = screen.getByRole('button', {
      name: new RegExp(tripReviewEn.actions.submitReview, 'i'),
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(tripReviewEn.validation.ratingRequired)
      ).toBeDefined();
    });
  });

  it('Displays English error when submitted with empty title (MSG01)', async () => {
    render(<TripReviewView trip={mockTrip} />);

    // Select 5 stars
    const star5 = screen.getByRole('radio', {
      name: tripReviewEn.accessibility.starRadioAria(5),
    });
    fireEvent.click(star5);

    const textarea = screen.getByPlaceholderText(
      tripReviewEn.tripReview.commentPlaceholder
    );
    fireEvent.change(textarea, { target: { value: 'Very good trip.' } });

    const submitBtn = screen.getByRole('button', {
      name: new RegExp(tripReviewEn.actions.submitReview, 'i'),
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(tripReviewEn.validation.titleRequired)
      ).toBeDefined();
    });
  });

  it('Displays English error when submitted with empty comment (MSG01)', async () => {
    render(<TripReviewView trip={mockTrip} />);

    // Select 5 stars
    const star5 = screen.getByRole('radio', {
      name: tripReviewEn.accessibility.starRadioAria(5),
    });
    fireEvent.click(star5);

    const titleInput = screen.getByRole('textbox', {
      name: new RegExp(tripReviewEn.tripReview.titleLabel, 'i'),
    });
    fireEvent.change(titleInput, { target: { value: 'Review title' } });

    const submitBtn = screen.getByRole('button', {
      name: new RegExp(tripReviewEn.actions.submitReview, 'i'),
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(tripReviewEn.validation.commentRequired)
      ).toBeDefined();
    });
  });

  it('REVIEW-10: Rejects non-image files and files larger than 5MB with English resource copy', async () => {
    render(<TripReviewView trip={mockTrip} />);

    const fileInput = screen.getByLabelText(
      tripReviewEn.accessibility.uploadPhotosAria
    );

    // 1. Invalid mime type (e.g., pdf)
    const invalidFile = new File(['content'], 'document.pdf', {
      type: 'application/pdf',
    });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(tripReviewEn.validation.photosInvalidType)
      ).toBeDefined();
    });

    // 2. File exceeding 5MB (5 * 1024 * 1024 + 1 bytes)
    const bigFile = new File(['x'.repeat(100)], 'huge.jpg', {
      type: 'image/jpeg',
    });
    Object.defineProperty(bigFile, 'size', { value: 6 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [bigFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(tripReviewEn.validation.photosMaxSize('huge.jpg'))
      ).toBeDefined();
    });
  });

  it('Shows PENDING_BE_INTEGRATION banner in real mode with English resource copy without fake success', async () => {
    vi.spyOn(reviewApi, 'submitTripReview').mockResolvedValue({
      status: 'PENDING_BE_INTEGRATION',
      message: tripReviewEn.bff.tripReviewPendingDetail,
    });

    render(<TripReviewView trip={mockTrip} />);

    // Select 5 stars
    const star5 = screen.getByRole('radio', {
      name: tripReviewEn.accessibility.starRadioAria(5),
    });
    fireEvent.click(star5);

    // Enter valid title
    const titleInput = screen.getByRole('textbox', {
      name: new RegExp(tripReviewEn.tripReview.titleLabel, 'i'),
    });
    fireEvent.change(titleInput, {
      target: { value: 'Wonderful trip' },
    });

    // Enter valid comment
    const textarea = screen.getByPlaceholderText(
      tripReviewEn.tripReview.commentPlaceholder
    );
    fireEvent.change(textarea, {
      target: {
        value: 'The itinerary was well-paced and stop durations were ideal.',
      },
    });

    const submitBtn = screen.getByRole('button', {
      name: new RegExp(tripReviewEn.actions.submitReview, 'i'),
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(tripReviewEn.tripReview.pendingSaveTitle)
      ).toBeDefined();
      expect(
        screen.getByText(tripReviewEn.bff.tripReviewPendingDetail)
      ).toBeDefined();
    });
  });
});
