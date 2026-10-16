import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MapboxItineraryMap } from '../components/maps/MapboxItineraryMap';
import { MapboxRadiusMap } from '../components/maps/MapboxRadiusMap';
import { buildItineraryMapModel } from '../utils/mapGeometry';

const mapbox = vi.hoisted(() => {
  const state = {
    accessToken: '' as string,
    maps: [] as Array<Record<string, ReturnType<typeof vi.fn>> & { options: Record<string, unknown> }>,
    markers: [] as Array<{ element: HTMLElement; lngLat: unknown }>,
    sources: new Map<string, { setData: ReturnType<typeof vi.fn> }>(),
    failNextMap: false,
    deferLoad: false,
    handlers: [] as Array<Map<string, (event?: unknown) => void>>,
  };
  class FakeMap {
    options: Record<string, unknown>;
    addSource = vi.fn((id: string) => state.sources.set(id, { setData: vi.fn() }));
    addLayer = vi.fn();
    fitBounds = vi.fn();
    remove = vi.fn();
    addControl = vi.fn();
    getSource = vi.fn((id: string) => state.sources.get(id));
    handlers = new Map<string, (event?: unknown) => void>();
    on = vi.fn((event: string, handler: (event?: unknown) => void) => {
      this.handlers.set(event, handler);
      if (event === 'load' && !state.deferLoad) handler();
    });
    constructor(options: Record<string, unknown>) {
      if (state.failNextMap) {
        state.failNextMap = false;
        throw new Error('WebGL not supported');
      }
      this.options = options;
      state.maps.push(this as never);
      state.handlers.push(this.handlers);
    }
  }
  class FakeMarker {
    element: HTMLElement;
    lngLat: unknown;
    constructor(options: { element: HTMLElement }) {
      this.element = options.element;
      state.markers.push(this);
    }
    setLngLat(lngLat: unknown) {
      this.lngLat = lngLat;
      return this;
    }
    addTo() {
      return this;
    }
    remove() {}
  }
  class FakeNavigationControl {}
  return { state, FakeMap, FakeMarker, FakeNavigationControl };
});

vi.mock('mapbox-gl', () => ({
  default: {
    get accessToken() {
      return mapbox.state.accessToken;
    },
    set accessToken(value: string) {
      mapbox.state.accessToken = value;
    },
    Map: mapbox.FakeMap,
    Marker: mapbox.FakeMarker,
    NavigationControl: mapbox.FakeNavigationControl,
  },
}));

vi.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}));

const model = buildItineraryMapModel({
  startLocation: { latitude: 16.05, longitude: 108.2, address: 'Khách sạn' },
  endLocation: null,
  items: [
    {
      itemId: 11, sequenceNo: 1, poiId: 12, poiName: 'Bảo tàng Chăm', category: null, kind: 'Visit',
      plannedArrival: '', plannedDeparture: '', travelDurationFromPreviousMinutes: null, stayDurationMinutes: 60,
      estimatedCost: null, isMandatory: false, recommendationReason: null, isUnavailable: false,
      latitude: 16.06, longitude: 108.22,
    },
    {
      itemId: 12, sequenceNo: 2, poiId: 501, poiName: 'Bếp Hến', category: null, kind: 'Visit',
      plannedArrival: '', plannedDeparture: '', travelDurationFromPreviousMinutes: null, stayDurationMinutes: 60,
      estimatedCost: null, costKind: 'AverageSpend', isMandatory: false, recommendationReason: null, isUnavailable: false,
      latitude: 16.065, longitude: 108.23,
    },
  ],
});

describe('Web maps (Review 2, D9)', () => {
  beforeEach(() => {
    mapbox.state.deferLoad = false;
    mapbox.state.handlers = [];
    mapbox.state.maps = [];
    mapbox.state.markers = [];
    mapbox.state.sources.clear();
    mapbox.state.accessToken = '';
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('draws numbered, coloured markers and the route of the itinerary', async () => {
    render(<MapboxItineraryMap token="pk.test" model={model} highlightedItemId={null} onSelectItem={vi.fn()} />);

    await waitFor(() => expect(mapbox.state.markers).toHaveLength(3));
    expect(mapbox.state.accessToken).toBe('pk.test');
    expect(mapbox.state.markers.map((marker) => marker.element.textContent)).toEqual(['B', '1', '2']);
    expect(mapbox.state.markers[2].element.style.backgroundColor).toBe('rgb(217, 119, 6)');
    expect(mapbox.state.sources.get('itinerary-route')!.setData).toHaveBeenCalledWith(
      expect.objectContaining({ geometry: model.route }),
    );
    expect(mapbox.state.maps[0].fitBounds).toHaveBeenCalled();
  });

  it('selects the timeline stop when its marker is clicked and highlights the selected marker', async () => {
    const onSelectItem = vi.fn();
    const { rerender } = render(
      <MapboxItineraryMap token="pk.test" model={model} highlightedItemId={null} onSelectItem={onSelectItem} />,
    );
    await waitFor(() => expect(mapbox.state.markers).toHaveLength(3));

    fireEvent.click(mapbox.state.markers[1].element);
    expect(onSelectItem).toHaveBeenCalledWith(11);

    rerender(<MapboxItineraryMap token="pk.test" model={model} highlightedItemId={12} onSelectItem={onSelectItem} />);
    expect(mapbox.state.markers[2].element.getAttribute('aria-current')).toBe('true');
    expect(mapbox.state.markers[1].element.getAttribute('aria-current')).toBeNull();
  });

  it('reports when the browser cannot show the map so the page can fall back', async () => {
    mapbox.state.failNextMap = true;
    const onUnavailable = vi.fn();
    render(
      <MapboxItineraryMap token="pk.test" model={model} highlightedItemId={null} onSelectItem={vi.fn()} onUnavailable={onUnavailable} />,
    );

    await waitFor(() => expect(onUnavailable).toHaveBeenCalled());
  });

  it('redraws the radius circle when the slider moves', async () => {
    const center = { latitude: 16.06, longitude: 108.22 };
    const { rerender } = render(<MapboxRadiusMap token="pk.test" center={center} radiusKm={10} />);
    await waitFor(() => expect(mapbox.state.maps).toHaveLength(1));

    rerender(<MapboxRadiusMap token="pk.test" center={center} radiusKm={25} />);

    const setData = mapbox.state.sources.get('search-radius')!.setData;
    await waitFor(() => expect(setData).toHaveBeenCalled());
    const ring = setData.mock.calls[setData.mock.calls.length - 1][0].geometry.coordinates[0];
    expect(ring[0][1]).toBeCloseTo(16.06 + 25 / 111.32, 2);
  });

  it('falls back when Mapbox reports an error before the map loads (e.g. a restricted token)', async () => {
    mapbox.state.deferLoad = true;
    const onUnavailable = vi.fn();
    render(
      <MapboxItineraryMap token="pk.bad" model={model} highlightedItemId={null} onSelectItem={vi.fn()} onUnavailable={onUnavailable} />,
    );
    await waitFor(() => expect(mapbox.state.handlers).toHaveLength(1));

    mapbox.state.handlers[0].get('error')?.({ error: { status: 401, message: 'Unauthorized' } });

    expect(onUnavailable).toHaveBeenCalledTimes(1);
  });

  it('draws nothing on a map that was removed before the drawing finished', async () => {
    const { unmount } = render(
      <MapboxItineraryMap token="pk.test" model={model} highlightedItemId={null} onSelectItem={vi.fn()} />,
    );
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mapbox.state.markers).toHaveLength(0);
  });

  it('keeps the highlight when the markers are rebuilt after an edit', async () => {
    const { rerender } = render(
      <MapboxItineraryMap token="pk.test" model={model} highlightedItemId={12} onSelectItem={vi.fn()} />,
    );
    await waitFor(() => expect(mapbox.state.markers).toHaveLength(3));

    rerender(
      <MapboxItineraryMap token="pk.test" model={{ ...model, markers: [...model.markers] }} highlightedItemId={12} onSelectItem={vi.fn()} />,
    );
    await waitFor(() => expect(mapbox.state.markers).toHaveLength(6));

    expect(mapbox.state.markers[5].element.getAttribute('aria-current')).toBe('true');
  });
});
