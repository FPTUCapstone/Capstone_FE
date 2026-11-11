import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ItineraryReviewsDialog } from '../components/ItineraryReviewsDialog';

vi.mock('@/features/public/pois/externalReviews', () => ({
  TripadvisorReviews: () => <div>Reviews</div>,
}));

describe('ItineraryReviewsDialog', () => {
  it('closes when the user clicks the backdrop', () => {
    const onClose = vi.fn();
    render(<ItineraryReviewsDialog poiId={101} name="Bảo tàng Chăm" onClose={onClose} />);

    fireEvent.mouseDown(screen.getByRole('dialog').parentElement!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
