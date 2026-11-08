import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MapboxItineraryMap } from '../components/maps/MapboxItineraryMap';
import { MapboxRadiusMap } from '../components/maps/MapboxRadiusMap';
import { clearRoadLegCache } from '../utils/mapboxDirections';
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

type FetchFn = (url: string) => Promise<unknown>;
const fetchMock = vi.fn<FetchFn>();

/** A Directions answer whose road bends through a midpoint of the requested leg. */
function roadFor(url: string) {
  const [from, to] = new URL(url).pathname.split('/').pop()!.split(';').map((point) => point.split(',').map(Number));
  const coordinates = [from, [(from[0] + to[0]) / 2 + 0.001, (from[1] + to[1]) / 2], to];
  return { ok: true, status: 200, json: async () => ({ routes: [{ geometry: { coordinates } }] }) };
}

function lastData(sourceId: string) {
  const calls = mapbox.state.sources.get(sourceId)!.setData.mock.calls;
  return calls[calls.length - 1][0] as { geometry: { type: string; coordinates: number[][][] } };
}

describe('Web maps (Review 2, D9)', () => {
  beforeEach(() => {
    clearRoadLegCache();
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url) => roadFor(url));
    vi.stubGlobal('fetch', fetchMock);
    mapbox.state.deferLoad = false;
    mapbox.state.handlers = [];
    mapbox.state.maps = [];
    mapbox.state.markers = [];
    mapbox.state.sources.clear();
    mapbox.state.accessToken = '';
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
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

  describe('road route per leg', () => {
    const [legA, legB] = model.legs;

    it('draws each leg along the road Mapbox returns and leaves no dashed straight segment', async () => {
      render(<MapboxItineraryMap token="pk.test" model={model} highlightedItemId={null} onSelectItem={vi.fn()} />);

      await waitFor(() => expect(lastData('itinerary-road').geometry.coordinates).toHaveLength(2));
      const road = lastData('itinerary-road').geometry;
      expect(road.type).toBe('MultiLineString');
      expect(road.coordinates[0]).toHaveLength(3);
      expect(road.coordinates[0][0]).toEqual(legA.from);
      expect(road.coordinates[1][2]).toEqual(legB.to);
      expect(lastData('itinerary-route').geometry).toEqual({ type: 'MultiLineString', coordinates: [] });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[0][0]).toContain('/directions/v5/mapbox/driving/');
    });

    it('keeps the straight dashed segment only for a leg that failed, without giving up the map', async () => {
      fetchMock.mockImplementation(async (url) =>
        url.includes(`${legB.from[0]},${legB.from[1]};`) ? { ok: false, status: 422, json: async () => ({}) } : roadFor(url),
      );
      const onUnavailable = vi.fn();
      render(
        <MapboxItineraryMap token="pk.test" model={model} highlightedItemId={null} onSelectItem={vi.fn()} onUnavailable={onUnavailable} />,
      );

      await waitFor(() => expect(lastData('itinerary-road').geometry.coordinates).toHaveLength(1));
      expect(lastData('itinerary-road').geometry.coordinates[0][0]).toEqual(legA.from);
      expect(lastData('itinerary-route').geometry.coordinates).toEqual([[legB.from, legB.to]]);
      expect(onUnavailable).not.toHaveBeenCalled();
    });

    it('shows the straight route first and keeps it when Directions is unreachable', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
      render(<MapboxItineraryMap token="pk.test" model={model} highlightedItemId={null} onSelectItem={vi.fn()} />);

      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
      await waitFor(() =>
        expect(lastData('itinerary-route').geometry.coordinates).toEqual([[legA.from, legA.to], [legB.from, legB.to]]),
      );
      expect(mapbox.state.sources.get('itinerary-route')!.setData).toHaveBeenCalledWith(
        expect.objectContaining({ geometry: model.route }),
      );
      expect(lastData('itinerary-road').geometry.coordinates).toEqual([]);
    });

    it('does not ask Mapbox again for legs it already routed when the map is redrawn', async () => {
      const { rerender } = render(
        <MapboxItineraryMap token="pk.test" model={model} highlightedItemId={null} onSelectItem={vi.fn()} />,
      );
      await waitFor(() => expect(lastData('itinerary-road').geometry.coordinates).toHaveLength(2));
      const drawn = mapbox.state.sources.get('itinerary-road')!.setData.mock.calls.length;

      rerender(
        <MapboxItineraryMap token="pk.test" model={{ ...model, markers: [...model.markers] }} highlightedItemId={null} onSelectItem={vi.fn()} />,
      );
      await waitFor(() =>
        expect(mapbox.state.sources.get('itinerary-road')!.setData.mock.calls.length).toBeGreaterThan(drawn),
      );

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(lastData('itinerary-road').geometry.coordinates).toHaveLength(2);
    });

    it('draws nothing late when the map is removed before Mapbox answers', async () => {
      let answer: (value: unknown) => void = () => {};
      fetchMock.mockImplementation((url) => new Promise((resolve) => { answer = () => resolve(roadFor(url)); }));
      const { unmount } = render(
        <MapboxItineraryMap token="pk.test" model={model} highlightedItemId={null} onSelectItem={vi.fn()} />,
      );
      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      const setData = mapbox.state.sources.get('itinerary-road')!.setData;

      unmount();
      answer(undefined);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setData).not.toHaveBeenCalled();
    });
  });
});
