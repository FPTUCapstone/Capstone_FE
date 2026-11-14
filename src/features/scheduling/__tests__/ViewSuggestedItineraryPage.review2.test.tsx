import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ROUTE_LINE_COLOR, ROUTE_START_COLOR, STRAIGHT_LINE_OPACITY } from '../components/maps/mapboxStyle';
import { ViewSuggestedItineraryPage } from '../components/ViewSuggestedItineraryPage';
import * as schedulingApi from '../services/schedulingApi';
import { ItineraryDetailDto, ItineraryDetailItemDto } from '../types/schedulingTypes';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => ({
    status: 'authenticated',
    context: { userId: 1, role: 'Traveler', accessToken: 'token' },
  }),
}));

vi.mock('@/components/navigation/PublicNavigation', () => ({
  PublicNavigation: () => <nav />,
}));

function item(overrides: Partial<ItineraryDetailItemDto>): ItineraryDetailItemDto {
  return {
    itemId: 1,
    sequenceNo: 1,
    poiId: 1,
    poiName: 'A',
    category: 'Bảo tàng',
    kind: 'Visit',
    plannedArrival: '2026-10-20T08:00:00+07:00',
    plannedDeparture: '2026-10-20T09:00:00+07:00',
    travelDurationFromPreviousMinutes: null,
    stayDurationMinutes: 60,
    estimatedCost: 60000,
    costKind: 'AdmissionTicket',
    isMandatory: false,
    recommendationReason: null,
    isUnavailable: false,
    ...overrides,
  };
}

const itinerary: ItineraryDetailDto = {
  itineraryId: 789,
  schedulingRequestId: 55,
  title: 'Đà Nẵng một ngày',
  version: 1,
  status: 'Draft',
  validFrom: '2026-10-20T08:00:00+07:00',
  validTo: '2026-10-20T17:00:00+07:00',
  canManage: true,
  totalEstimatedCost: 120000,
  totalDurationMinutes: 480,
  transportMode: 'Motorbike',
  items: [
    item({ itemId: 11, sequenceNo: 1, poiId: 12, poiName: 'Bảo tàng Chăm', isMandatory: true }),
    item({
      itemId: 12,
      sequenceNo: 2,
      poiId: 88,
      poiName: 'Ngũ Hành Sơn',
      plannedArrival: '2026-10-20T09:22:00+07:00',
      plannedDeparture: '2026-10-20T11:00:00+07:00',
      travelDurationFromPreviousMinutes: 22,
      travelDistanceFromPreviousMeters: 9400,
      transportModeFromPrevious: 'Motorbike',
    }),
    item({
      itemId: 13,
      sequenceNo: 3,
      poiId: 35,
      poiName: 'Bãi biển Non Nước',
      plannedArrival: '2026-10-20T14:10:00+07:00',
      plannedDeparture: '2026-10-20T15:00:00+07:00',
      travelDurationFromPreviousMinutes: 10,
      travelDistanceFromPreviousMeters: 3000,
      transportModeFromPrevious: 'Motorbike',
    }),
  ],
};

const walkedVersion: ItineraryDetailDto = {
  ...itinerary,
  version: 2,
  items: [
    itinerary.items[0],
    { ...itinerary.items[1], transportModeFromPrevious: 'Walking', travelDurationFromPreviousMinutes: 47, plannedArrival: '2026-10-20T09:47:00+07:00' },
    itinerary.items[2],
  ],
};

async function renderLoaded(detail: ItineraryDetailDto = itinerary) {
  vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValueOnce(detail);
  render(<ViewSuggestedItineraryPage itineraryId="789" />);
  await screen.findByText(detail.title!);
}

describe('ViewSuggestedItineraryPage — Review 2 leg edits (D5, D11-3/4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('switches a leg to walking through PUT /items with the full stops list', async () => {
    const update = vi.spyOn(schedulingApi, 'updateItineraryStops').mockResolvedValueOnce(walkedVersion);
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: 'Đổi phương tiện đến Ngũ Hành Sơn' }));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitemradio', { name: '🚶 Đi bộ' }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(789, [
        { poiId: 12, transportModeToNext: 'Walking' },
        { poiId: 88, transportModeToNext: 'Motorbike' },
        { poiId: 35 },
      ]),
    );
    expect(await screen.findByText('v2')).toBeDefined();
    expect(screen.getByText('⟲ lùi 25 phút')).toBeDefined();
  });

  it('offers undo for a few seconds and re-sends the previous stops', async () => {
    const update = vi
      .spyOn(schedulingApi, 'updateItineraryStops')
      .mockResolvedValueOnce(walkedVersion)
      .mockResolvedValueOnce({ ...itinerary, version: 3 });
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: 'Đổi phương tiện đến Ngũ Hành Sơn' }));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitemradio', { name: '🚶 Đi bộ' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Hoàn tác' }));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
    expect(update.mock.calls[1][1]).toEqual([
      { poiId: 12, transportModeToNext: 'Motorbike' },
      { poiId: 88, transportModeToNext: 'Motorbike' },
      { poiId: 35 },
    ]);
    expect(await screen.findByText('v3')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Hoàn tác' })).toBeNull();
  });

  it('hides the undo toast after a few seconds', async () => {
    vi.spyOn(schedulingApi, 'updateItineraryStops').mockResolvedValueOnce(walkedVersion);
    await renderLoaded();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    fireEvent.click(screen.getByRole('button', { name: 'Đổi phương tiện đến Ngũ Hành Sơn' }));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitemradio', { name: '🚶 Đi bộ' }));
    await screen.findByRole('button', { name: 'Hoàn tác' });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(screen.queryByRole('button', { name: 'Hoàn tác' })).toBeNull();
  });

  it('names the failing stop when the change is not feasible', async () => {
    vi.spyOn(schedulingApi, 'updateItineraryStops').mockRejectedValueOnce(
      new schedulingApi.StopInfeasibleError(422, {
        poiId: 35,
        reason: 'ClosedAtArrival',
        plannedArrival: '2026-10-20T17:40:00+07:00',
        closesAt: '17:00',
        overflowMinutes: null,
        overflowVnd: null,
      }),
    );
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: 'Đổi phương tiện đến Ngũ Hành Sơn' }));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitemradio', { name: '🚶 Đi bộ' }));

    expect(
      await screen.findByText(
        'Không thể lưu thay đổi: "Bãi biển Non Nước" đóng cửa lúc 17:00, dự kiến đến lúc 17:40.',
      ),
    ).toBeDefined();
    expect(screen.getByText('v1')).toBeDefined();
  });

  it('hides transport changes while the trip is navigated or for read-only members', async () => {
    await renderLoaded({ ...itinerary, isNavigationInProgress: true });
    expect(screen.queryByRole('button', { name: /Đổi phương tiện/ })).toBeNull();
  });

  it('hides transport changes for read-only members', async () => {
    await renderLoaded({ ...itinerary, canManage: false });
    expect(screen.queryByRole('button', { name: /Đổi phương tiện/ })).toBeNull();
  });
});

vi.mock('@/features/public/pois/components/TripadvisorReviews', () => ({
  TripadvisorReviews: ({ poiId }: { poiId: number }) => <div data-testid="tripadvisor-reviews">{poiId}</div>,
}));

const restaurant = {
  poiId: 501,
  name: 'Bếp Hến',
  category: 'Food & Drink',
  thumbnailUrl: null,
  address: null,
  costKind: 'AverageSpend' as const,
  estimatedCost: 120000,
  distanceFromPreviousMeters: 1800,
  detourMinutes: 12,
  distanceSource: 'Road' as const,
  estimatedArrival: '2026-10-20T11:10:00+07:00',
  openAtArrival: true,
  closesAt: '21:00',
  fitsItinerary: true,
  unfitReason: null,
  unfitPoiId: null,
  overflowMinutes: null,
  overflowVnd: null,
  tripadvisor: null,
};

describe('ViewSuggestedItineraryPage — Review 2 stop actions (D4, D6, D11)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('adds a restaurant from the lunch card after the stop closest to noon', async () => {
    const suggestions = vi
      .spyOn(schedulingApi, 'getItinerarySuggestions')
      .mockResolvedValueOnce({ itineraryId: 789, kind: 'Food', searchRadiusKm: 15, items: [restaurant] });
    const update = vi.spyOn(schedulingApi, 'updateItineraryStops').mockResolvedValueOnce({ ...itinerary, version: 2 });
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: 'Chọn quán' }));
    expect(suggestions).toHaveBeenCalledWith(789, { kind: 'Food', afterItemId: 12 }, expect.anything());
    fireEvent.click(await screen.findByRole('button', { name: 'Chọn Bếp Hến' }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(789, [
        { poiId: 12, transportModeToNext: 'Motorbike' },
        { poiId: 88, transportModeToNext: 'Motorbike' },
        { poiId: 501 },
        { poiId: 35 },
      ]),
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('replaces a stop in place from the "⋯" menu', async () => {
    const suggestions = vi
      .spyOn(schedulingApi, 'getItinerarySuggestions')
      .mockResolvedValueOnce({
        itineraryId: 789,
        kind: 'Replace',
        searchRadiusKm: 15,
        items: [{ ...restaurant, poiId: 600, name: 'Chùa Linh Ứng', costKind: 'AdmissionTicket' as const }],
      });
    const update = vi.spyOn(schedulingApi, 'updateItineraryStops').mockResolvedValueOnce({ ...itinerary, version: 2 });
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: 'Thao tác với Ngũ Hành Sơn' }));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Thay địa điểm' }));
    expect(suggestions).toHaveBeenCalledWith(789, { kind: 'Replace', replaceItemId: 12 }, expect.anything());
    fireEvent.click(await screen.findByRole('button', { name: 'Chọn Chùa Linh Ứng' }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(789, [
        { poiId: 12, transportModeToNext: 'Motorbike' },
        { poiId: 600, transportModeToNext: 'Motorbike' },
        { poiId: 35 },
      ]),
    );
  });

  it('asks before removing a stop the traveler chose', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    const update = vi.spyOn(schedulingApi, 'updateItineraryStops').mockResolvedValue({ ...itinerary, version: 2 });
    await renderLoaded();

    const removeMandatory = () => {
      fireEvent.click(screen.getByRole('button', { name: 'Thao tác với Bảo tàng Chăm' }));
      fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Bỏ khỏi lịch' }));
    };
    removeMandatory();
    expect(confirm).toHaveBeenCalledWith('Đây là điểm bạn đã chọn, chắc chắn bỏ?');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(update).not.toHaveBeenCalled();

    // Confirmed: the reason picker follows (UC-10 feedback, D10), and the stop goes once a reason is picked.
    removeMandatory();
    expect(update).not.toHaveBeenCalled();
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Vì sao bạn bỏ điểm này?' })).getByRole('button', {
        name: 'Không thích',
      }),
    );
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        789,
        [{ poiId: 88, transportModeToNext: 'Motorbike' }, { poiId: 35 }],
        { removedStops: [{ poiId: 12, reason: 'NotInterested' }] },
      ),
    );
  });

  it('removes an ordinary stop without the "stop you chose" confirmation', async () => {
    const confirm = vi.spyOn(window, 'confirm');
    const update = vi.spyOn(schedulingApi, 'updateItineraryStops').mockResolvedValue({ ...itinerary, version: 2 });
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: 'Thao tác với Bãi biển Non Nước' }));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Bỏ khỏi lịch' }));
    // One more click since UC-10 feedback (D10): the reason picker.
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Vì sao bạn bỏ điểm này?' })).getByRole('button', {
        name: 'Đã đi rồi',
      }),
    );

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        789,
        [{ poiId: 12, transportModeToNext: 'Motorbike' }, { poiId: 88 }],
        { removedStops: [{ poiId: 35, reason: 'AlreadyVisited' }] },
      ),
    );
    expect(confirm).not.toHaveBeenCalled();
  });

  it('opens the Tripadvisor reviews of a stop', async () => {
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: 'Thao tác với Ngũ Hành Sơn' }));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Xem đánh giá' }));

    const dialog = screen.getByRole('dialog', { name: 'Đánh giá: Ngũ Hành Sơn' });
    expect(within(dialog).getByTestId('tripadvisor-reviews').textContent).toBe('88');
  });

  it('warns before regenerating when a restaurant would be dropped', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
    await renderLoaded({
      ...itinerary,
      items: [...itinerary.items, item({ itemId: 14, sequenceNo: 4, poiId: 501, poiName: 'Bếp Hến', costKind: 'AverageSpend' })],
    });

    fireEvent.click(screen.getByRole('button', { name: /Tạo lại lịch trình/ }));

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('quán ăn bạn đã thêm sẽ không được giữ lại'));
  });

  it('offers no stop edits while the trip is navigated', async () => {
    await renderLoaded({ ...itinerary, isNavigationInProgress: true });

    expect(screen.queryByRole('button', { name: 'Chọn quán' })).toBeNull();
    expect(screen.queryByRole('button', { name: '＋ Thêm quán ăn' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Thao tác với Ngũ Hành Sơn' }));
    expect(within(screen.getByRole('menu')).getAllByRole('menuitem').map((entry) => entry.textContent)).toEqual([
      'Xem đánh giá',
    ]);
  });
});

vi.mock('../components/maps/LazyMaps', () => ({
  LazyItineraryMap: ({
    selectedLegId,
    model,
    onSelectItem,
  }: {
    model: { markers: Array<{ label: string; itemId: number | null }> };
    onSelectItem: (itemId: number) => void;
    selectedLegId?: string | null;
  }) => (
    <div data-testid="itinerary-map" data-selected-leg={selectedLegId ?? ''}>
      {model.markers.map((marker) => (
        <button
          key={marker.label}
          type="button"
          onClick={() => marker.itemId !== null && onSelectItem(marker.itemId)}
        >
          {`marker ${marker.label}`}
        </button>
      ))}
    </div>
  ),
  LazyRadiusMap: () => null,
}));

describe('ViewSuggestedItineraryPage — Review 2 itinerary map (D9)', () => {
  const mapped: ItineraryDetailDto = {
    ...itinerary,
    startLocation: { latitude: 16.05, longitude: 108.2, address: 'Khách sạn' },
    items: itinerary.items.map((entry, index) => ({ ...entry, latitude: 16.06 + index / 100, longitude: 108.22 })),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('displays informative fallback card without a Mapbox token and never renders arrow diagram', async () => {
    vi.stubEnv('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN', '');
    await renderLoaded(mapped);

    expect(screen.getByText('Bản đồ lộ trình')).toBeDefined();
    expect(screen.getByText('Chưa cấu hình Mapbox Access Token')).toBeDefined();
    expect(screen.queryByText('Sơ đồ thứ tự điểm dừng')).toBeNull();
    expect(screen.queryByTestId('itinerary-map')).toBeNull();
  });

  it('shows the map with numbered markers and highlights the stop chosen on the map', async () => {
    vi.stubEnv('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN', 'pk.test');
    Element.prototype.scrollIntoView = vi.fn();
    await renderLoaded(mapped);

    expect(screen.queryByText('Sơ đồ thứ tự điểm dừng')).toBeNull();
    const map = screen.getByTestId('itinerary-map');
    expect(within(map).getAllByRole('button').map((marker) => marker.textContent)).toEqual([
      'marker B',
      'marker 1',
      'marker 2',
      'marker 3',
    ]);

    fireEvent.click(within(map).getByRole('button', { name: 'marker 2' }));
    expect(document.querySelector('[data-item-id="12"]')?.getAttribute('data-highlighted')).toBe('true');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('explains that the solid line follows roads and the dashed line is only a straight estimate', async () => {
    vi.stubEnv('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN', 'pk.test');
    await renderLoaded(mapped);

    expect(screen.getByText(/Nét liền: theo đường đi thực tế/)).toBeDefined();
    expect(screen.getByText(/Nét đứt: chỉ nối thẳng theo thứ tự ghé/)).toBeDefined();
    expect(screen.queryByText(/không phải đường đi thực tế/)).toBeNull();
    // The swatches use the same colours as the lines on the map.
    const legend = document.querySelector('ul[aria-label="Chú thích đường nối"]')!;
    const roadSwatch = legend.querySelector('[data-testid="road-swatch"]') as HTMLElement;
    expect(roadSwatch.style.background).toContain('linear-gradient');
    expect(roadSwatch.getAttribute('style')?.toLowerCase()).toContain(ROUTE_START_COLOR.toLowerCase().slice(1));
    expect(screen.getByText(/mũi tên chỉ hướng đi/)).toBeDefined();
    const dashed = legend.querySelector('line')!;
    expect(dashed.getAttribute('stroke')).toBe(ROUTE_LINE_COLOR);
    expect(dashed.getAttribute('stroke-opacity')).toBe(String(STRAIGHT_LINE_OPACITY));
    expect(dashed.getAttribute('stroke-dasharray')).not.toBeNull();
  });

  describe('viewing one leg on the map', () => {
    const FIRST_LEG = 'item-11>item-12';
    const SECOND_LEG = 'item-12>item-13';
    const selectedLeg = () => screen.getByTestId('itinerary-map').getAttribute('data-selected-leg');
    const legButton = (to: string) =>
      screen.getByRole('button', { name: new RegExp(`Xem trên bản đồ đoạn từ .* đến ${to}`) });

    beforeEach(() => {
      vi.stubEnv('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN', 'pk.test');
      Element.prototype.scrollIntoView = vi.fn();
    });

    it('shows the pressed leg on the map, marks its button pressed and brings the map into view', async () => {
      await renderLoaded(mapped);
      expect(selectedLeg()).toBe('');

      fireEvent.click(legButton('Ngũ Hành Sơn'));

      expect(selectedLeg()).toBe(FIRST_LEG);
      expect(legButton('Ngũ Hành Sơn').getAttribute('aria-pressed')).toBe('true');
      expect(legButton('Bãi biển Non Nước').getAttribute('aria-pressed')).toBe('false');
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: 'nearest' }));

      fireEvent.click(legButton('Bãi biển Non Nước'));
      expect(selectedLeg()).toBe(SECOND_LEG);
    });

    it('goes back to the whole route when the same leg is pressed again', async () => {
      await renderLoaded(mapped);

      fireEvent.click(legButton('Ngũ Hành Sơn'));
      fireEvent.click(legButton('Ngũ Hành Sơn'));

      expect(selectedLeg()).toBe('');
    });

    it('goes back to the whole route on Escape', async () => {
      await renderLoaded(mapped);
      fireEvent.click(legButton('Ngũ Hành Sơn'));

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(selectedLeg()).toBe('');
    });

    it('offers a "Xem toàn bộ lộ trình" button on the map only while a leg is selected', async () => {
      await renderLoaded(mapped);
      expect(screen.queryByRole('button', { name: 'Xem toàn bộ lộ trình' })).toBeNull();

      fireEvent.click(legButton('Ngũ Hành Sơn'));
      expect(screen.getByText(/Đoạn đang xem được tô màu cam đất/)).toBeDefined();
      fireEvent.click(screen.getByRole('button', { name: 'Xem toàn bộ lộ trình' }));

      expect(selectedLeg()).toBe('');
      expect(screen.queryByRole('button', { name: 'Xem toàn bộ lộ trình' })).toBeNull();
    });

    it('does not turn legs into buttons when the map is not shown', async () => {
      vi.stubEnv('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN', '');
      await renderLoaded(mapped);

      expect(screen.queryByRole('button', { name: /Xem trên bản đồ đoạn/ })).toBeNull();
    });
  });

  it('displays informative empty coordinates card when the stops have no coordinates and never renders arrow diagram', async () => {
    vi.stubEnv('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN', 'pk.test');
    await renderLoaded(itinerary);

    expect(screen.getByText('Bản đồ lộ trình')).toBeDefined();
    expect(screen.getByText('Chưa có tọa độ hiển thị')).toBeDefined();
    expect(screen.queryByText('Sơ đồ thứ tự điểm dừng')).toBeNull();
    expect(screen.queryByTestId('itinerary-map')).toBeNull();
  });
});

describe('ViewSuggestedItineraryPage — review fixes (findings 1, 4, 5)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps change badges and Undo when the edit moves the page to the new itinerary id', async () => {
    const getById = vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValueOnce(itinerary);
    vi.spyOn(schedulingApi, 'updateItineraryStops').mockResolvedValueOnce({ ...walkedVersion, itineraryId: 790 });
    const first = render(<ViewSuggestedItineraryPage itineraryId="789" />);
    await screen.findByText(itinerary.title!);

    fireEvent.click(screen.getByRole('button', { name: 'Đổi phương tiện đến Ngũ Hành Sơn' }));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitemradio', { name: '🚶 Đi bộ' }));
    await screen.findByRole('button', { name: 'Hoàn tác' });

    // The App Router remounts the [id] page for the new id: simulate it.
    first.unmount();
    render(<ViewSuggestedItineraryPage itineraryId="790" />);

    expect(await screen.findByText('⟲ lùi 25 phút')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Hoàn tác' })).toBeDefined();
    expect(screen.getByText('v2')).toBeDefined();
    // The new version came with the edit: no second load.
    expect(getById).toHaveBeenCalledTimes(1);
  });

  it('reorders through PUT /items (not the legacy body), with badges and Undo', async () => {
    const update = vi.spyOn(schedulingApi, 'updateItineraryStops').mockResolvedValueOnce({ ...itinerary, version: 2 });
    const legacy = vi.spyOn(schedulingApi, 'adjustItineraryItems');
    await renderLoaded({
      ...itinerary,
      items: [
        itinerary.items[0],
        itinerary.items[1],
        { ...itinerary.items[2], transportModeFromPrevious: 'Car' },
      ],
    });

    fireEvent.click(screen.getByRole('button', { name: /Chỉnh sửa thứ tự/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Di chuyển Bãi biển Non Nước lên' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thứ tự mới' }));

    await waitFor(() =>
      // Every neighbour changed, so every leg falls back to the trip default (§3.4 reorder rule).
      expect(update).toHaveBeenCalledWith(789, [{ poiId: 12 }, { poiId: 35 }, { poiId: 88 }]),
    );
    expect(legacy).not.toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Hoàn tác' })).toBeDefined();
  });

  it('asks before replacing a stop the traveler chose', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
    const suggestions = vi.spyOn(schedulingApi, 'getItinerarySuggestions');
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: 'Thao tác với Bảo tàng Chăm' }));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Thay địa điểm' }));

    expect(confirm).toHaveBeenCalledWith('Đây là điểm bạn đã chọn, chắc chắn bỏ?');
    expect(suggestions).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('ViewSuggestedItineraryPage — removal reason (UC-10 feedback, D10, D14)', () => {
  const REASON_TITLE = 'Vì sao bạn bỏ điểm này?';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function openReasonDialog(stopName: string) {
    fireEvent.click(screen.getByRole('button', { name: `Thao tác với ${stopName}` }));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Bỏ khỏi lịch' }));
    return screen.getByRole('dialog', { name: REASON_TITLE });
  }

  it('asks why with three reasons before anything is removed', async () => {
    const update = vi.spyOn(schedulingApi, 'updateItineraryStops');
    await renderLoaded();

    const dialog = openReasonDialog('Ngũ Hành Sơn');

    expect(within(dialog).getByRole('heading', { name: REASON_TITLE })).toBeDefined();
    expect(within(dialog).getByText('Ngũ Hành Sơn')).toBeDefined();
    expect(
      within(dialog)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Đóng', 'Không thích', 'Không đủ thời gian', 'Đã đi rồi']);
    expect(update).not.toHaveBeenCalled();
  });

  it.each([
    ['Không thích', 'NotInterested'],
    ['Không đủ thời gian', 'NoTime'],
    ['Đã đi rồi', 'AlreadyVisited'],
  ])('removes the stop and sends the reason of "%s" as %s', async (label, reason) => {
    const update = vi.spyOn(schedulingApi, 'updateItineraryStops').mockResolvedValue({ ...itinerary, version: 2 });
    await renderLoaded();

    fireEvent.click(within(openReasonDialog('Ngũ Hành Sơn')).getByRole('button', { name: label }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        789,
        [{ poiId: 12, transportModeToNext: 'Motorbike' }, { poiId: 35 }],
        { removedStops: [{ poiId: 88, reason }] },
      ),
    );
    expect(update).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(await screen.findByRole('button', { name: 'Hoàn tác' })).toBeDefined();
  });

  it.each([
    ['the close button', () => fireEvent.click(screen.getByRole('button', { name: 'Đóng' }))],
    ['Escape', () => fireEvent.keyDown(document, { key: 'Escape' })],
    ['a click on the backdrop', () => fireEvent.mouseDown(screen.getByRole('dialog').parentElement!)],
  ])('removes nothing and sends nothing when the dialog is closed with %s', async (_name, close) => {
    const update = vi.spyOn(schedulingApi, 'updateItineraryStops');
    await renderLoaded();
    openReasonDialog('Ngũ Hành Sơn');

    close();

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(update).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Thao tác với Ngũ Hành Sơn' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Hoàn tác' })).toBeNull();
  });

  it('stays open when the traveler clicks inside the dialog', async () => {
    await renderLoaded();
    const dialog = openReasonDialog('Ngũ Hành Sơn');

    fireEvent.mouseDown(within(dialog).getByRole('heading', { name: REASON_TITLE }));

    expect(screen.getByRole('dialog', { name: REASON_TITLE })).toBeDefined();
  });

  it('undoes a removal by re-sending the previous stops, without removedStops', async () => {
    const update = vi
      .spyOn(schedulingApi, 'updateItineraryStops')
      .mockResolvedValueOnce({ ...itinerary, version: 2, items: [itinerary.items[0], itinerary.items[2]] })
      .mockResolvedValueOnce({ ...itinerary, version: 3 });
    await renderLoaded();

    fireEvent.click(within(openReasonDialog('Ngũ Hành Sơn')).getByRole('button', { name: 'Không đủ thời gian' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Hoàn tác' }));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
    expect(update.mock.calls[1]).toEqual([
      789,
      [
        { poiId: 12, transportModeToNext: 'Motorbike' },
        { poiId: 88, transportModeToNext: 'Motorbike' },
        { poiId: 35 },
      ],
    ]);
  });

  it('keeps the stop and reports the error when the removal is refused', async () => {
    vi.spyOn(schedulingApi, 'updateItineraryStops').mockRejectedValueOnce(
      new schedulingApi.ItineraryHttpError(400, 'Không thể cập nhật lịch trình. Vui lòng thử lại sau.', 'itinerary.mutation_failed'),
    );
    await renderLoaded();

    fireEvent.click(within(openReasonDialog('Ngũ Hành Sơn')).getByRole('button', { name: 'Không thích' }));

    expect(await screen.findByText('Không thể cập nhật lịch trình. Vui lòng thử lại sau.')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Thao tác với Ngũ Hành Sơn' })).toBeDefined();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
