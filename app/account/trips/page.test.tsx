import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/trips/components/TripHistoryPage', () => ({
  TripHistoryPage: () => <div data-testid="trip-history-page">TripHistoryPage Content</div>,
}));

import AccountTripsPage, { metadata } from './page';

describe('/account/trips Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes valid metadata', () => {
    expect(metadata.title).toBeTruthy();
    expect(metadata.description).toBeTruthy();
  });

  it('renders TripHistoryPage inside Suspense boundary', () => {
    render(<AccountTripsPage />);
    expect(screen.getByTestId('trip-history-page')).toBeTruthy();
  });
});
