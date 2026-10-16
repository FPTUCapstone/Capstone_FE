import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ItinerarySuggestionsDialog } from '../components/ItinerarySuggestionsDialog';
import * as schedulingApi from '../services/schedulingApi';
import { ItinerarySuggestionDto, ItinerarySuggestionsDto, TripadvisorRatingDto } from '../types/schedulingTypes';

vi.mock('@/features/public/pois/components/TripadvisorReviews', () => ({
  TripadvisorReviews: ({ poiId }: { poiId: number }) => <div data-testid="reviews">{poiId}</div>,
}));

const tripadvisor: TripadvisorRatingDto = {
  locationId: 1,
  rating: 4.5,
  reviewCount: 210,
  ratingImageUrl: 'https://static.tacdn.com/img2/ratings/traveler/4.5.svg',
  url: 'https://www.tripadvisor.com/Restaurant_Review-1',
};

function suggestion(overrides: Partial<ItinerarySuggestionDto>): ItinerarySuggestionDto {
  return {
    poiId: 501,
    name: 'Bếp Hến',
    category: 'Food & Drink',
    thumbnailUrl: null,
    address: '47 Ngô Thì Sĩ',
    costKind: 'AverageSpend',
    estimatedCost: 120000,
    distanceFromPreviousMeters: 1800,
    detourMinutes: 12,
    distanceSource: 'Road',
    estimatedArrival: '2026-10-20T11:50:00+07:00',
    openAtArrival: true,
    closesAt: '21:00',
    fitsItinerary: true,
    unfitReason: null,
    unfitPoiId: null,
    overflowMinutes: null,
    overflowVnd: null,
    tripadvisor,
    ...overrides,
  };
}

const response: ItinerarySuggestionsDto = {
  itineraryId: 789,
  kind: 'Food',
  searchRadiusKm: 15,
  items: [
    suggestion({}),
    suggestion({
      poiId: 502,
      name: 'Quán Mì Quảng 1A',
      fitsItinerary: false,
      unfitReason: 'ExceedsEndTime',
      unfitPoiId: 502,
      overflowMinutes: 80,
      tripadvisor: null,
    }),
    suggestion({ poiId: 503, name: 'Hải sản Bé Mặn', openAtArrival: false, fitsItinerary: false, unfitReason: 'ClosedAtArrival', unfitPoiId: 503, closesAt: '10:00', tripadvisor: null }),
  ],
};

describe('ItinerarySuggestionsDialog (D6, D11-2/8)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists suggestions with price, distance, detour and Tripadvisor attribution', async () => {
    vi.spyOn(schedulingApi, 'getItinerarySuggestions').mockResolvedValueOnce(response);
    render(
      <ItinerarySuggestionsDialog
        itineraryId={789}
        query={{ kind: 'Food', afterItemId: 11 }}
        title="Thêm quán ăn sau Bảo tàng Chăm"
        nameOf={() => null}
        onChoose={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const first = await screen.findByTestId('suggestion-501');
    expect(first.textContent).toContain('Mức chi tiêu dự kiến: 120.000 VNĐ/người');
    expect(first.textContent).toContain('1,8 km từ điểm trước');
    expect(first.textContent).toContain('dài thêm 12 phút');
    expect(first.textContent).toContain('Đến lúc 11:50');
    // Attribution is plain text only: no Tripadvisor image, nothing links out to Tripadvisor.
    expect(within(first).getByText('4,5/5 · 210 đánh giá')).toBeDefined();
    expect(within(first).queryByRole('img', { name: /Tripadvisor/ })).toBeNull();
    expect(first.querySelector('img[src*="tacdn"]')).toBeNull();
    expect(within(first).queryByRole('link', { name: /Tripadvisor/ })).toBeNull();
    expect(first.querySelector('a[href*="tripadvisor"]')).toBeNull();
  });

  it('hides "Xem đánh giá" when Tripadvisor has no recent reviews, keeping the rating and count', async () => {
    vi.spyOn(schedulingApi, 'getItinerarySuggestions').mockResolvedValueOnce({
      ...response,
      items: [
        suggestion({ tripadvisor: { ...tripadvisor, reviewCount: 19, hasRecentReviews: false } }),
        suggestion({ poiId: 504, name: 'Quán Trang', tripadvisor: { ...tripadvisor, hasRecentReviews: true } }),
        suggestion({ poiId: 505, name: 'Bánh xèo Bà Dưỡng', tripadvisor: { ...tripadvisor, hasRecentReviews: null } }),
      ],
    });
    render(
      <ItinerarySuggestionsDialog itineraryId={789} query={{ kind: 'Food', afterItemId: 11 }} title="t" nameOf={() => null} onChoose={vi.fn()} onClose={vi.fn()} />,
    );

    const none = await screen.findByTestId('suggestion-501');
    expect(within(none).queryByRole('button', { name: /Xem đánh giá/ })).toBeNull();
    expect(within(none).getByText('4,5/5 · 19 đánh giá')).toBeDefined();

    expect(screen.getByRole('button', { name: 'Xem đánh giá Quán Trang' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Xem đánh giá Bánh xèo Bà Dưỡng' })).toBeDefined();
  });

  it('allows selecting places that exceed end time with a warning, but keeps closed places unselectable', async () => {
    vi.spyOn(schedulingApi, 'getItinerarySuggestions').mockResolvedValueOnce(response);
    const onChoose = vi.fn();
    render(
      <ItinerarySuggestionsDialog itineraryId={789} query={{ kind: 'Food', afterItemId: 11 }} title="t" nameOf={() => null} onChoose={onChoose} onClose={vi.fn()} />,
    );

    const late = await screen.findByTestId('suggestion-502');
    expect(late.textContent).toContain('Vượt giờ kết thúc 1 giờ 20 phút');
    expect((within(late).getByRole('button', { name: 'Chọn Quán Mì Quảng 1A' }) as HTMLButtonElement).disabled).toBe(false);

    const closed = screen.getByTestId('suggestion-503');
    expect(closed.textContent).toContain('Đã đóng cửa khi đến (đóng lúc 10:00)');
    expect((within(closed).getByRole('button', { name: 'Chọn Hải sản Bé Mặn' }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(within(late).getByRole('button', { name: 'Chọn Quán Mì Quảng 1A' }));
    expect(onChoose).toHaveBeenCalledWith(expect.objectContaining({ poiId: 502 }));
  });

  it('shows the reviews of a suggestion on demand', async () => {
    vi.spyOn(schedulingApi, 'getItinerarySuggestions').mockResolvedValueOnce(response);
    render(
      <ItinerarySuggestionsDialog itineraryId={789} query={{ kind: 'Food', afterItemId: 11 }} title="t" nameOf={() => null} onChoose={vi.fn()} onClose={vi.fn()} />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Xem đánh giá Bếp Hến' }));
    expect(screen.getByTestId('reviews').textContent).toBe('501');
  });

  it('explains an empty result and offers a wider radius', async () => {
    vi.spyOn(schedulingApi, 'getItinerarySuggestions').mockResolvedValueOnce({ ...response, items: [] });
    render(
      <ItinerarySuggestionsDialog itineraryId={789} query={{ kind: 'Replace', replaceItemId: 12 }} title="t" nameOf={() => null} onChoose={vi.fn()} onClose={vi.fn()} />,
    );

    expect(await screen.findByText(/Không có điểm phù hợp trong 15 km/)).toBeDefined();
    expect(screen.getByRole('link', { name: 'Mở rộng bán kính' }).getAttribute('href')).toBe('/plan');
  });

  it('shows a load failure with retry', async () => {
    vi.spyOn(schedulingApi, 'getItinerarySuggestions')
      .mockRejectedValueOnce(new schedulingApi.ItineraryHttpError(500, 'Không tải được gợi ý địa điểm lúc này. Vui lòng thử lại sau.'))
      .mockResolvedValueOnce(response);
    render(
      <ItinerarySuggestionsDialog itineraryId={789} query={{ kind: 'Food', afterItemId: 11 }} title="t" nameOf={() => null} onChoose={vi.fn()} onClose={vi.fn()} />,
    );

    expect(await screen.findByText(/Không tải được gợi ý địa điểm/)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByTestId('suggestion-501')).toBeDefined();
  });
});
