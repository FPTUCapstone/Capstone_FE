import React, { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ItineraryReviewsDialog } from '../components/ItineraryReviewsDialog';
import { ItinerarySuggestionsDialog } from '../components/ItinerarySuggestionsDialog';
import * as schedulingApi from '../services/schedulingApi';

vi.mock('@/features/public/pois/components/TripadvisorReviews', () => ({
  TripadvisorReviews: () => <div>reviews</div>,
}));

const response = {
  itineraryId: 789,
  kind: 'Food' as const,
  searchRadiusKm: 15,
  items: [
    {
      poiId: 501,
      name: 'Bếp Hến',
      category: null,
      thumbnailUrl: null,
      address: null,
      costKind: 'AverageSpend' as const,
      estimatedCost: 120000,
      distanceFromPreviousMeters: 1800,
      detourMinutes: 12,
      distanceSource: 'Road' as const,
      estimatedArrival: null,
      openAtArrival: true,
      closesAt: null,
      fitsItinerary: true,
      unfitReason: null,
      unfitPoiId: null,
      overflowMinutes: null,
      overflowVnd: null,
      tripadvisor: null,
    },
  ],
};

/** A parent that re-renders (like the 8 s undo timer) and passes a new inline onClose each time. */
function Host({ kind, onClose }: { kind: 'suggestions' | 'reviews'; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const [ticks, setTicks] = useState(0);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Mở hộp thoại
      </button>
      <button type="button" onClick={() => setTicks((value) => value + 1)}>
        {`tick ${ticks}`}
      </button>
      {open &&
        (kind === 'suggestions' ? (
          <ItinerarySuggestionsDialog
            itineraryId={789}
            query={{ kind: 'Food', afterItemId: 11 }}
            title="Thêm quán ăn"
            nameOf={() => null}
            onChoose={vi.fn()}
            onClose={() => {
              onClose();
              setOpen(false);
            }}
          />
        ) : (
          <ItineraryReviewsDialog
            poiId={88}
            name="Ngũ Hành Sơn"
            onClose={() => {
              onClose();
              setOpen(false);
            }}
          />
        ))}
    </div>
  );
}

describe('dialog focus management (review finding 3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(schedulingApi, 'getItinerarySuggestions').mockResolvedValue(response);
  });

  it('focuses the dialog once and keeps focus where the user moved it across parent re-renders', async () => {
    render(<Host kind="suggestions" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mở hộp thoại' }));
    expect(document.activeElement?.textContent).toBe('Đóng');

    const choose = await screen.findByRole('button', { name: 'Chọn Bếp Hến' });
    choose.focus();
    // The tick button sits outside the dialog; click it without moving focus, as a timer would.
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'tick 0' }));
    });
    expect(screen.getByRole('button', { name: 'tick 1' })).toBeDefined();
    expect(document.activeElement).toBe(choose);
  });

  it('keeps Tab inside the dialog', async () => {
    render(<Host kind="suggestions" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mở hộp thoại' }));
    const choose = await screen.findByRole('button', { name: 'Chọn Bếp Hến' });
    const close = screen.getByRole('button', { name: 'Đóng' });

    choose.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(close);

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(choose);
  });

  it('closes on Escape and returns focus to the opener', async () => {
    const onClose = vi.fn();
    render(<Host kind="reviews" onClose={onClose} />);
    const opener = screen.getByRole('button', { name: 'Mở hộp thoại' });
    opener.focus();
    fireEvent.click(opener);
    expect(screen.getByRole('dialog')).toBeDefined();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'tick 0' }));
    });
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(opener);
  });
});
