import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PoiSummary } from '../types/poi';
import { PoiMapboxView } from './PoiMapboxView';

// Mock mapbox-gl
const mockScrollZoomDisable = vi.fn();
const mockScrollZoomEnable = vi.fn();
const mockAddControl = vi.fn();
const mockFlyTo = vi.fn();
const mockFitBounds = vi.fn();
const mockMapRemove = vi.fn();
const mockMapOn = vi.fn((event: string, cb: (...args: unknown[]) => void) => {
  if (event === 'load') cb();
});
const mockMarkerRemove = vi.fn();
const mockMarkerSetLngLat = vi.fn().mockReturnThis();
const mockMarkerAddTo = vi.fn().mockReturnThis();

let markerElements: HTMLElement[] = [];

vi.mock('mapbox-gl', () => {
  class MockMarker {
    element: HTMLElement;
    constructor(options?: { element?: HTMLElement }) {
      this.element = options?.element ?? document.createElement('div');
      markerElements.push(this.element);
    }
    setLngLat = mockMarkerSetLngLat;
    addTo = mockMarkerAddTo;
    remove = mockMarkerRemove;
    getElement() {
      return this.element;
    }
  }

  class MockMap {
    scrollZoom = { disable: mockScrollZoomDisable, enable: mockScrollZoomEnable };
    addControl = mockAddControl;
    on = mockMapOn;
    off = vi.fn();
    remove = mockMapRemove;
    flyTo = mockFlyTo;
    fitBounds = mockFitBounds;
    getZoom = vi.fn().mockReturnValue(11);
    resize = vi.fn();
  }

  class MockLngLatBounds {
    extend = vi.fn().mockReturnThis();
  }

  return {
    default: {
      Map: MockMap,
      Marker: MockMarker,
      NavigationControl: vi.fn(),
      LngLatBounds: MockLngLatBounds,
      supported: vi.fn().mockReturnValue(true),
      accessToken: '',
    },
    Map: MockMap,
    Marker: MockMarker,
    NavigationControl: vi.fn(),
    LngLatBounds: MockLngLatBounds,
    supported: vi.fn().mockReturnValue(true),
  };
});

const mockItems: PoiSummary[] = [
  {
    id: 101,
    name: 'Bãi biển Mỹ Khê',
    categoryId: 1,
    categoryName: 'Biển & Đảo',
    latitude: 16.0597,
    longitude: 108.2435,
    address: 'Võ Nguyên Giáp, Đà Nẵng',
    indoorOutdoor: 'Outdoor',
    averageVisitDurationMinutes: 120,
    hasShelter: false,
    averageRating: 4.8,
    reviewCount: 350,
    thumbnailUrl: 'https://example.com/mykhe.jpg',
    distanceKm: 2.5,
    isOpenNow: true,
  },
  {
    id: 102,
    name: 'Bán đảo Sơn Trà',
    categoryId: 2,
    categoryName: 'Thiên nhiên',
    latitude: 16.1005,
    longitude: 108.2778,
    address: 'Sơn Trà, Đà Nẵng',
    indoorOutdoor: 'Mixed',
    averageVisitDurationMinutes: 180,
    hasShelter: true,
    averageRating: 4.9,
    reviewCount: 520,
    thumbnailUrl: null,
    distanceKm: 7.8,
    isOpenNow: false,
  },
];

describe('PoiMapboxView', () => {
  const originalToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  beforeEach(() => {
    vi.clearAllMocks();
    markerElements = [];
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = 'pk.test_valid_token_sample';
  });

  afterEach(() => {
    cleanup();
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = originalToken;
  });

  it('renders Mapbox container and enables wheel zoom with Lenis protection', () => {
    render(<PoiMapboxView items={mockItems} selectedId={101} onSelectPoi={vi.fn()} />);

    expect(screen.getByTestId('mapbox-gl-container')).toBeTruthy();
    expect(screen.getByText('Bản đồ địa lý tương tác (Mapbox)')).toBeTruthy();
    expect(mockScrollZoomEnable).toHaveBeenCalled();
  });

  it('displays graceful fallback when Mapbox token is missing', () => {
    delete process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    render(<PoiMapboxView items={mockItems} selectedId={101} onSelectPoi={vi.fn()} />);

    expect(screen.getByText('Bản đồ địa lý chưa khả dụng')).toBeTruthy();
    expect(screen.getByText(/Chưa cấu hình Mapbox Access Token/i)).toBeTruthy();
  });

  it('renders selected POI floating preview card with correct information and detail link', () => {
    render(<PoiMapboxView items={mockItems} selectedId={101} onSelectPoi={vi.fn()} />);

    expect(screen.getByText('Đang chọn trên bản đồ')).toBeTruthy();
    expect(screen.getByText('Bãi biển Mỹ Khê')).toBeTruthy();
    expect(screen.getByText('Võ Nguyên Giáp, Đà Nẵng')).toBeTruthy();
    expect(screen.getByText('★ 4.8')).toBeTruthy();
    expect(screen.getByText('● Đang mở cửa')).toBeTruthy();
    expect(screen.getByText('⌖ Cách 2.50 km')).toBeTruthy();

    const detailLinks = screen.getAllByRole('link', { name: /Xem chi tiết/i });
    expect(detailLinks.length).toBeGreaterThan(0);
    expect(detailLinks[0].getAttribute('href')).toBe('/pois/101');
  });

  it('triggers onSelectPoi when a map marker is clicked', () => {
    const handleSelect = vi.fn();
    render(<PoiMapboxView items={mockItems} selectedId={101} onSelectPoi={handleSelect} />);

    expect(markerElements.length).toBe(2);

    // Click marker for second POI (id 102)
    fireEvent.click(markerElements[1]);
    expect(handleSelect).toHaveBeenCalledWith(102);
  });

  it('handles empty items without error and displays empty coordinates message', () => {
    render(<PoiMapboxView items={[]} selectedId={null} onSelectPoi={vi.fn()} />);

    expect(screen.getByText('Chưa có tọa độ hiển thị')).toBeTruthy();
  });

  it('cleans up map and markers when unmounted', () => {
    const { unmount } = render(
      <PoiMapboxView items={mockItems} selectedId={101} onSelectPoi={vi.fn()} />
    );

    unmount();
    expect(mockMapRemove).toHaveBeenCalled();
  });
});
