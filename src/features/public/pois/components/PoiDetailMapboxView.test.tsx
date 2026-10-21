import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PoiDetailMapboxView } from './PoiDetailMapboxView';

const mockScrollZoomDisable = vi.fn();
const mockScrollZoomEnable = vi.fn();
const mockAddControl = vi.fn();
const mockMapRemove = vi.fn();
const mockMarkerRemove = vi.fn();
const mockMarkerSetLngLat = vi.fn().mockReturnThis();
const mockMarkerAddTo = vi.fn().mockReturnThis();

vi.mock('mapbox-gl', () => {
  class MockMarker {
    setLngLat = mockMarkerSetLngLat;
    addTo = mockMarkerAddTo;
    remove = mockMarkerRemove;
  }

  class MockMap {
    scrollZoom = { disable: mockScrollZoomDisable, enable: mockScrollZoomEnable };
    addControl = mockAddControl;
    remove = mockMapRemove;
    resize = vi.fn();
    on = vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      if (event === 'load') cb();
    });
  }

  return {
    default: {
      Map: MockMap,
      Marker: MockMarker,
      NavigationControl: vi.fn(),
      supported: vi.fn().mockReturnValue(true),
      accessToken: '',
    },
    Map: MockMap,
    Marker: MockMarker,
    NavigationControl: vi.fn(),
    supported: vi.fn().mockReturnValue(true),
  };
});

describe('PoiDetailMapboxView', () => {
  const originalToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = 'pk.test_valid_token_sample';
  });

  afterEach(() => {
    cleanup();
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = originalToken;
  });

  it('initializes Mapbox map at POI coordinates and enables wheel zoom', () => {
    render(
      <PoiDetailMapboxView
        latitude={16.0597}
        longitude={108.2435}
        name="Bãi biển Mỹ Khê"
        address="Võ Nguyên Giáp, Đà Nẵng"
      />
    );

    expect(screen.getByTestId('poi-detail-mapbox-container')).toBeTruthy();
    expect(screen.getByText('Bản đồ vị trí (Mapbox)')).toBeTruthy();
    expect(mockScrollZoomEnable).toHaveBeenCalled();
    expect(mockMarkerSetLngLat).toHaveBeenCalledWith([108.2435, 16.0597]);
  });

  it('displays fallback when coordinates are invalid', () => {
    render(
      <PoiDetailMapboxView
        latitude={0}
        longitude={0}
        name="Địa điểm lỗi tọa độ"
      />
    );

    expect(screen.getByText('Bản đồ vị trí chưa khả dụng')).toBeTruthy();
    expect(screen.getByText(/Tọa độ địa lý của địa điểm này chưa hợp lệ/i)).toBeTruthy();
  });

  it('displays fallback when Mapbox token is missing', () => {
    delete process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    render(
      <PoiDetailMapboxView
        latitude={16.0597}
        longitude={108.2435}
        name="Bãi biển Mỹ Khê"
      />
    );

    expect(screen.getByText('Bản đồ vị trí chưa khả dụng')).toBeTruthy();
    expect(screen.getByText(/Chưa cấu hình Mapbox Access Token/i)).toBeTruthy();
  });

  it('cleans up map and marker on unmount', () => {
    const { unmount } = render(
      <PoiDetailMapboxView
        latitude={16.0597}
        longitude={108.2435}
        name="Bãi biển Mỹ Khê"
      />
    );

    unmount();
    expect(mockMarkerRemove).toHaveBeenCalled();
    expect(mockMapRemove).toHaveBeenCalled();
  });
});
