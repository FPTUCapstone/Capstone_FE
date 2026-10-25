import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/reviews/components/TripReviewPage', () => ({
  TripReviewPage: ({ tripId }: { tripId: string }) => (
    <div data-testid="trip-review-page">
      <span>{tripId}</span>
    </div>
  ),
}));

import AccountTripReviewPageRoute, { metadata } from './page';

describe('/account/trips/[id]/review Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes valid page metadata', () => {
    expect(metadata.title).toBeTruthy();
    expect(metadata.description).toBeTruthy();
  });

  it('renders TripReviewPage with params id', async () => {
    const component = await AccountTripReviewPageRoute({
      params: Promise.resolve({ id: 'trip-999' }),
    });

    render(component);

    expect(screen.getByTestId('trip-review-page')).toBeTruthy();
    expect(screen.getByText('trip-999')).toBeTruthy();
  });
});
