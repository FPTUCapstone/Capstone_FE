import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as schedulingApi from '../services/schedulingApi';
import { ItineraryDetailDto } from '../types/schedulingTypes';
import { ViewSuggestedItineraryPage } from '../components/ViewSuggestedItineraryPage';

const mockUseWebSession = vi.fn();
vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => mockUseWebSession(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock('@/lib/mapboxToken', () => ({
  getMapboxPublicToken: () => process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || null,
}));

vi.mock('../components/maps/LazyMaps', () => ({
  LazyItineraryMap: ({
    model,
    highlightedItemId,
    onSelectItem,
  }: {
    model: {
      markers: Array<{ label: string; itemId: number | null; title: string; color: string; kind: string }>;
      route: { coordinates: Array<[number, number]> };
    };
    highlightedItemId: number | null;
    onSelectItem: (itemId: number) => void;
  }) => (
    <div data-testid="itinerary-map" data-highlighted-id={highlightedItemId ?? 'none'}>
      <div data-testid="map-marker-count">{model.markers.length}</div>
      <div data-testid="map-route-points">{model.route.coordinates.length}</div>
      {model.markers.map((marker) => (
        <button
          key={`${marker.label}-${marker.itemId ?? 'loc'}`}
          type="button"
          data-kind={marker.kind}
          data-active={marker.itemId !== null && marker.itemId === highlightedItemId ? 'true' : 'false'}
          onClick={() => marker.itemId !== null && onSelectItem(marker.itemId)}
        >
          {`marker ${marker.label}`}
        </button>
      ))}
    </div>
  ),
  LazyRadiusMap: () => null,
}));

const mockItineraryWithCoords: ItineraryDetailDto = {
  itineraryId: 789,
  schedulingRequestId: 42,
  title: 'Hành trình di sản Đà Nẵng',
  version: 1,
  status: 'Draft',
  validFrom: '2026-10-25T08:00:00+07:00',
  validTo: '2026-10-26T18:00:00+07:00',
  canManage: true,
  totalEstimatedCost: 450000,
  totalDurationMinutes: 600,
  transportMode: 'Car',
  isNavigationInProgress: false,
  startLocation: { latitude: 16.05, longitude: 108.2, address: 'Khách sạn Novotel' },
  endLocation: { latitude: 16.08, longitude: 108.25, address: 'Bán đảo Sơn Trà' },
  items: [
    {
      itemId: 101,
      sequenceNo: 1,
      poiId: 101,
      poiName: 'Bảo tàng Điêu khắc Chăm',
      address: 'Số 2 đường 2 Tháng 9, Hải Châu',
      category: 'Văn hóa & Lịch sử',
      kind: 'Visit',
      plannedArrival: '2026-10-25T08:30:00+07:00',
      plannedDeparture: '2026-10-25T10:00:00+07:00',
      stayDurationMinutes: 90,
      travelDurationFromPreviousMinutes: 15,
      estimatedCost: 60000,
      costKind: 'AdmissionTicket',
      isMandatory: true,
      recommendationReason: 'Di sản cấp quốc gia',
      isUnavailable: false,
      latitude: 16.0601,
      longitude: 108.2223,
    },
    {
      itemId: 102,
      sequenceNo: 2,
      poiId: 501,
      poiName: 'Bếp Hến Quán',
      address: 'Đường Bạch Đằng',
      category: 'Ẩm thực địa phương',
      kind: 'Visit',
      plannedArrival: '2026-10-25T12:00:00+07:00',
      plannedDeparture: '2026-10-25T13:00:00+07:00',
      stayDurationMinutes: 60,
      travelDurationFromPreviousMinutes: 10,
      estimatedCost: 80000,
      costKind: 'AverageSpend',
      isMandatory: false,
      recommendationReason: 'Món ngon nổi bật',
      isUnavailable: false,
      latitude: 16.0655,
      longitude: 108.2255,
    },
    {
      itemId: 103,
      sequenceNo: 3,
      poiId: 103,
      poiName: 'Ngũ Hành Sơn',
      address: 'Hòa Hải, Ngũ Hành Sơn',
      category: 'Danh lam thắng cảnh',
      kind: 'Visit',
      plannedArrival: '2026-10-26T09:00:00+07:00',
      plannedDeparture: '2026-10-26T11:30:00+07:00',
      stayDurationMinutes: 150,
      travelDurationFromPreviousMinutes: 25,
      estimatedCost: 50000,
      costKind: 'AdmissionTicket',
      isMandatory: true,
      recommendationReason: 'Quần thể hang động',
      isUnavailable: false,
      latitude: 16.0035,
      longitude: 108.2635,
    },
  ],
};

const mockItineraryNoCoords: ItineraryDetailDto = {
  ...mockItineraryWithCoords,
  startLocation: null,
  endLocation: null,
  items: mockItineraryWithCoords.items.map((item) => ({
    ...item,
    latitude: undefined as unknown as number,
    longitude: undefined as unknown as number,
  })),
};

describe('TripMate Itinerary Map Restoration Verification', () => {
  const travelerSession = {
    status: 'authenticated',
    context: {
      userId: 1,
      email: 'traveler@tripmate.vn',
      fullName: 'Trần Du Khách',
      role: 'Traveler',
      status: 'Active',
      accessToken: 'sample-token',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    mockUseWebSession.mockReturnValue(travelerSession);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it('1. Renders interactive Mapbox map with real coordinates when token is valid', async () => {
    vi.stubEnv('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN', 'pk.test_real_token');
    vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValueOnce(mockItineraryWithCoords);

    render(<ViewSuggestedItineraryPage itineraryId="789" />);

    await waitFor(() => {
      expect(screen.getByText('Bản đồ lộ trình')).toBeDefined();
    });

    // Arrow diagram must NEVER appear
    expect(screen.queryByText('Sơ đồ thứ tự điểm dừng')).toBeNull();

    // Map container must be rendered
    const map = screen.getByTestId('itinerary-map');
    expect(map).toBeDefined();

    // Markers: Start (B), Item 1, Item 2, Item 3, End (K) => 5 markers
    const markerButtons = within(map).getAllByRole('button');
    expect(markerButtons.map((btn) => btn.textContent)).toEqual([
      'marker B',
      'marker 1',
      'marker 2',
      'marker 3',
      'marker K',
    ]);
  });

  it('2. Clicking a marker highlights stop in timeline and shows Selected Stop Preview Card', async () => {
    vi.stubEnv('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN', 'pk.test_real_token');
    vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValueOnce(mockItineraryWithCoords);

    render(<ViewSuggestedItineraryPage itineraryId="789" />);

    await waitFor(() => {
      expect(screen.getByText('Bảo tàng Điêu khắc Chăm')).toBeDefined();
    });

    const map = screen.getByTestId('itinerary-map');
    const marker1Btn = within(map).getByRole('button', { name: 'marker 1' });

    // Click marker 1 (itemId 101)
    fireEvent.click(marker1Btn);

    // Selected stop card should display details
    const selectedStopCard = screen.getByTestId('selected-map-stop-card');
    expect(selectedStopCard).toBeDefined();
    expect(within(selectedStopCard).getByText('Bảo tàng Điêu khắc Chăm')).toBeDefined();
    expect(within(selectedStopCard).getByText('Điểm tham quan')).toBeDefined();
    expect(within(selectedStopCard).getByText(/Số 2 đường 2 Tháng 9/)).toBeDefined();

    // Timeline item should have data-highlighted="true"
    const timelineItem = document.querySelector('[data-item-id="101"]');
    expect(timelineItem?.getAttribute('data-highlighted')).toBe('true');

    // Close preview card
    const closeBtn = within(selectedStopCard).getByRole('button', { name: 'Đóng chi tiết điểm dừng' });
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('selected-map-stop-card')).toBeNull();
  });

  it('3. Filtering by Day Navigation updates map markers and route line dynamically', async () => {
    vi.stubEnv('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN', 'pk.test_real_token');
    vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValueOnce(mockItineraryWithCoords);

    render(<ViewSuggestedItineraryPage itineraryId="789" />);

    await waitFor(() => {
      expect(screen.getByText('Bản đồ lộ trình')).toBeDefined();
    });

    const map = screen.getByTestId('itinerary-map');

    // Initially "Tất cả" is active: 5 markers (B + 2 stops Day 1 + 1 stop Day 2 + K)
    expect(within(map).getByTestId('map-marker-count').textContent).toBe('5');

    // Click "Ngày 1" tab (2026-10-25)
    const day1Btn = screen.getByRole('button', { name: /Ngày 1/i });
    fireEvent.click(day1Btn);

    // Now only Day 1 stops + start/end locations: markers for Day 1
    await waitFor(() => {
      // Day 1 has 2 stops + start/end = 4 markers
      expect(within(map).getByTestId('map-marker-count').textContent).toBe('4');
    });
    expect(within(map).queryByRole('button', { name: 'marker 3' })).toBeNull();
    expect(within(map).getByRole('button', { name: 'marker 1' })).toBeDefined();
    expect(within(map).getByRole('button', { name: 'marker 2' })).toBeDefined();

    // Click "Ngày 2" tab (2026-10-26)
    const day2Btn = screen.getByRole('button', { name: /Ngày 2/i });
    fireEvent.click(day2Btn);

    await waitFor(() => {
      // Day 2 has 1 stop (item 3) + start/end = 3 markers
      expect(within(map).getByTestId('map-marker-count').textContent).toBe('3');
    });
    expect(within(map).getByRole('button', { name: 'marker 3' })).toBeDefined();
    expect(within(map).queryByRole('button', { name: 'marker 1' })).toBeNull();

    // Click "Tất cả" tab to reset filter
    const allDaysBtn = screen.getByRole('button', { name: /Tất cả/i });
    fireEvent.click(allDaysBtn);

    await waitFor(() => {
      expect(within(map).getByTestId('map-marker-count').textContent).toBe('5');
    });
  });

  it('4. Displays informative fallback card when Mapbox token is missing (no arrow diagram)', async () => {
    vi.stubEnv('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN', '');
    vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValueOnce(mockItineraryWithCoords);

    render(<ViewSuggestedItineraryPage itineraryId="789" />);

    await waitFor(() => {
      expect(screen.getByText('Bản đồ lộ trình')).toBeDefined();
    });

    // Arrow diagram must NEVER appear
    expect(screen.queryByText('Sơ đồ thứ tự điểm dừng')).toBeNull();

    // Informative token fallback card is displayed
    const fallback = screen.getByTestId('itinerary-map-fallback-no-token');
    expect(fallback).toBeDefined();
    expect(within(fallback).getByText('Chưa cấu hình Mapbox Access Token')).toBeDefined();
    expect(within(fallback).getByText(/NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN/)).toBeDefined();
    expect(screen.queryByTestId('itinerary-map')).toBeNull();
  });

  it('5. Displays informative fallback card when stops have no GPS coordinates', async () => {
    vi.stubEnv('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN', 'pk.test_real_token');
    vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValueOnce(mockItineraryNoCoords);

    render(<ViewSuggestedItineraryPage itineraryId="789" />);

    await waitFor(() => {
      expect(screen.getByText('Bản đồ lộ trình')).toBeDefined();
    });

    // Arrow diagram must NEVER appear
    expect(screen.queryByText('Sơ đồ thứ tự điểm dừng')).toBeNull();

    // Empty coordinates fallback card is displayed
    const fallback = screen.getByTestId('itinerary-map-fallback-no-coords');
    expect(fallback).toBeDefined();
    expect(within(fallback).getByText('Chưa có tọa độ hiển thị')).toBeDefined();
    expect(screen.queryByTestId('itinerary-map')).toBeNull();
  });
});
