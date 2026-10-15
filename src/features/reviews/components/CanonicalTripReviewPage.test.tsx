import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(), getReviewContext: vi.fn(), createReview: vi.fn(), updateReview: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/components/navigation/PublicNavigation', () => ({ PublicNavigation: () => null }));
vi.mock('../services/canonicalReviewApi', () => ({
  getReviewContext: mocks.getReviewContext,
  createReview: mocks.createReview,
  updateReview: mocks.updateReview,
}));

import { CanonicalTripReviewPage } from './CanonicalTripReviewPage';
import { CanonicalReviewApiError } from '../types/canonicalReview';

const reference = { kind: 'commerceBooking' as const, id: '9223372036854775807' };
const emptyContext = {
  reviewableRecord: reference, bookingStatus: 'Completed',
  subject: { kind: 'tour' as const, id: '4' },
  summary: { name: 'Hoi An', departureAtUtc: '2026-10-01T02:00:00Z', bookingReference: 'BK-1' },
  canSubmit: true, submitUnavailableReason: null, existingReviewKind: 'none' as const,
  review: null, editableFields: [],
  routePacing: { available: false, reason: null }, cspRating: { available: false, reason: null },
  poiRatings: { available: false, reason: null },
};
const existingReview = {
  kind: 'new' as const, reviewId: '8', reviewableRecord: reference,
  subject: { kind: 'tour' as const, id: '4' }, overallRating: 5, title: 'Great', content: 'Excellent',
  publishDisplayName: true, publicDisplayName: 'Traveler', publicationStatus: 'Published',
  createdAtUtc: '2026-10-01T02:00:00Z', editDeadlineUtc: '2026-10-08T02:00:00Z',
  updatedAtUtc: '2026-10-01T02:00:00Z', version: 'v1', media: [],
};

describe('CanonicalTripReviewPage', () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getReviewContext.mockResolvedValue(emptyContext);
    mocks.createReview.mockResolvedValue(existingReview);
  });

  it('offers star rating and Cancel, then returns to Trip History after create', async () => {
    render(<CanonicalTripReviewPage reference={reference} />);
    await screen.findByText('Hoi An');
    expect(screen.getByRole('link', { name: 'Cancel' }).getAttribute('href')).toBe('/account/trips');
    fireEvent.click(screen.getByRole('radio', { name: '5 stars' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Great' } });
    fireEvent.change(screen.getByLabelText('Review'), { target: { value: 'Excellent' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish review' }));
    expect(await screen.findByText('Review published. Returning to Trip History…')).toBeTruthy();
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/account/trips'));
  });

  it('loads and opens the existing review when create reports a duplicate', async () => {
    mocks.createReview.mockRejectedValue(new CanonicalReviewApiError(409, 'trip_review.duplicate'));
    mocks.getReviewContext.mockResolvedValueOnce(emptyContext).mockResolvedValueOnce({
      ...emptyContext, existingReviewKind: 'new', review: existingReview,
      canSubmit: false, editableFields: ['overallRating', 'title', 'content', 'publishDisplayName'],
    });
    render(<CanonicalTripReviewPage reference={reference} />);
    await screen.findByText('Hoi An');
    fireEvent.click(screen.getByRole('radio', { name: '5 stars' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Great' } });
    fireEvent.change(screen.getByLabelText('Review'), { target: { value: 'Excellent' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish review' }));
    expect(await screen.findByText('A review already exists. The existing review is shown below.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Update review' })).toBeTruthy();
    expect(mocks.createReview).toHaveBeenCalledTimes(1);
    expect(mocks.getReviewContext).toHaveBeenCalledTimes(2);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('shows a safe recovery error when duplicate recovery GET fails', async () => {
    mocks.createReview.mockRejectedValue(new CanonicalReviewApiError(409, 'trip_review.duplicate'));
    mocks.getReviewContext.mockResolvedValueOnce(emptyContext).mockRejectedValueOnce(
      new CanonicalReviewApiError(503, 'MSG127'),
    );
    render(<CanonicalTripReviewPage reference={reference} />);
    await screen.findByText('Hoi An');
    fireEvent.click(screen.getByRole('radio', { name: '5 stars' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Great' } });
    fireEvent.change(screen.getByLabelText('Review'), { target: { value: 'Excellent' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish review' }));
    expect(await screen.findByText('The existing review could not be loaded. Please try again.')).toBeTruthy();
    expect(screen.queryByText('A review already exists. The existing review is shown below.')).toBeNull();
    expect(screen.queryByText('Hoi An')).toBeNull();
    expect(mocks.createReview).toHaveBeenCalledTimes(1);
    expect(mocks.getReviewContext).toHaveBeenCalledTimes(2);
  });

  it('rejects duplicate recovery when GET returns a malformed existing review', async () => {
    mocks.createReview.mockRejectedValue(new CanonicalReviewApiError(409, 'trip_review.duplicate'));
    mocks.getReviewContext.mockResolvedValueOnce(emptyContext).mockResolvedValueOnce({
      ...emptyContext,
      existingReviewKind: 'new',
      review: { kind: 'new' },
    });
    render(<CanonicalTripReviewPage reference={reference} />);
    await screen.findByText('Hoi An');
    fireEvent.click(screen.getByRole('radio', { name: '5 stars' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Great' } });
    fireEvent.change(screen.getByLabelText('Review'), { target: { value: 'Excellent' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish review' }));
    expect(await screen.findByText('The existing review could not be loaded. Please try again.')).toBeTruthy();
    expect(screen.queryByText('A review already exists. The existing review is shown below.')).toBeNull();
    expect(screen.queryByText('Hoi An')).toBeNull();
    expect(mocks.createReview).toHaveBeenCalledTimes(1);
    expect(mocks.getReviewContext).toHaveBeenCalledTimes(2);
  });

  it('updates in place without returning to Trip History', async () => {
    mocks.getReviewContext.mockResolvedValue({
      ...emptyContext, existingReviewKind: 'new', review: existingReview,
      canSubmit: false, editableFields: ['overallRating', 'title', 'content', 'publishDisplayName'],
    });
    mocks.updateReview.mockResolvedValue(existingReview);
    render(<CanonicalTripReviewPage reference={reference} />);
    await screen.findByRole('button', { name: 'Update review' });
    fireEvent.click(screen.getByRole('button', { name: 'Update review' }));
    expect(await screen.findByText('Review updated.')).toBeTruthy();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it.each([
    ['trip_review.stale_version', 'This review changed elsewhere. Reload it before saving again.'],
    ['trip_review.policy_rejected', 'The review was rejected by the content policy.'],
    ['trip_review.policy_unavailable', 'Content screening is temporarily unavailable. Please try again.'],
  ])('renders safe copy for %s without navigation', async (code, copy) => {
    mocks.createReview.mockRejectedValue(new CanonicalReviewApiError(409, code));
    render(<CanonicalTripReviewPage reference={reference} />);
    await screen.findByText('Hoi An');
    fireEvent.click(screen.getByRole('radio', { name: '5 stars' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Great' } });
    fireEvent.change(screen.getByLabelText('Review'), { target: { value: 'Excellent' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish review' }));
    expect(await screen.findByText(copy)).toBeTruthy();
    expect(screen.queryByText(code)).toBeNull();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('keeps an expired review read-only and Cancel does not submit', async () => {
    mocks.getReviewContext.mockResolvedValue({
      ...emptyContext, existingReviewKind: 'new', review: existingReview, canSubmit: false, editableFields: [],
    });
    render(<CanonicalTripReviewPage reference={reference} />);
    expect(await screen.findByText('The seven-day edit window has expired. This review is read-only.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Update review' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Cancel' }).getAttribute('href')).toBe('/account/trips');
    expect(mocks.createReview).not.toHaveBeenCalled();
    expect(mocks.updateReview).not.toHaveBeenCalled();
  });
});
