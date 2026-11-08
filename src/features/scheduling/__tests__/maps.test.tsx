import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MapboxItineraryMap } from '../components/maps/MapboxItineraryMap';
import {
  CHEVRON_IMAGE,
  legColor,
  ROUTE_SELECTED_COLOR,
  ROUTE_LINE_COLOR,
  STRAIGHT_LINE_OPACITY,
} from '../components/maps/mapboxStyle';
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
    failAddImage: false,
    deferLoad: false,
    handlers: [] as Array<Map<string, (event?: unknown) => void>>,
  };
  class FakeMap {
    options: Record<string, unknown>;
    addSource = vi.fn((id: string) => state.sources.set(id, { setData: vi.fn() }));
    addLayer = vi.fn();
    addImage = vi.fn(() => {
      if (state.failAddImage) throw new Error('image rejected');
    });
    hasImage = vi.fn(() => false);
    setPaintProperty = vi.fn();
    getLayer = vi.fn(() => ({}));
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
      // Mapbox positions a marker with an inline transform on its element.
      this.element.style.setProperty('transform', `translate(${state.markers.indexOf(this) * 40}px, 12px)`);
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

/** The road legs last drawn: one GeoJSON feature per routed leg, each with its colour. */
function roadFeatures() {
  const calls = mapbox.state.sources.get('itinerary-road')!.setData.mock.calls;
  const data = calls[calls.length - 1][0] as {
    type: string;
    features: Array<{ properties: { color: string }; geometry: { type: string; coordinates: number[][] } }>;
  };
  expect(data.type).toBe('FeatureCollection');
  return data.features;
}
const roadLines = () => roadFeatures().map((feature) => feature.geometry.coordinates);

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
    mapbox.state.failAddImage = false;
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

  it('never touches the transform Mapbox positions a marker with, when highlighting or clearing it', async () => {
    const { rerender } = render(
      <MapboxItineraryMap token="pk.test" model={model} highlightedItemId={null} onSelectItem={vi.fn()} />,
    );
    await waitFor(() => expect(mapbox.state.markers).toHaveLength(3));
    const positions = mapbox.state.markers.map((marker) => marker.element.style.transform);
    expect(new Set(positions).size).toBe(3);

    rerender(<MapboxItineraryMap token="pk.test" model={model} highlightedItemId={12} onSelectItem={vi.fn()} />);
    expect(mapbox.state.markers.map((marker) => marker.element.style.transform)).toEqual(positions);
    const active = mapbox.state.markers[2].element;
    expect(active.style.getPropertyValue('scale')).toBe('1.35');
    expect(active.style.zIndex).toBe('10');
    expect(active.style.boxShadow).not.toBe('');

    rerender(<MapboxItineraryMap token="pk.test" model={model} highlightedItemId={11} onSelectItem={vi.fn()} />);
    expect(mapbox.state.markers.map((marker) => marker.element.style.transform)).toEqual(positions);
    expect(active.style.getPropertyValue('scale')).toBe('');
    expect(active.style.zIndex).toBe('');
    expect(active.style.boxShadow).toBe('');
    expect(mapbox.state.markers[1].element.style.getPropertyValue('scale')).toBe('1.35');
  });

  const [legA, legB] = model.legs;

  describe('route line style', () => {
    type Layer = {
      id: string;
      type: string;
      source: string;
      layout?: Record<string, unknown>;
      paint?: Record<string, unknown>;
    };
    async function drawnLayers(): Promise<Record<string, Layer>> {
      render(<MapboxItineraryMap token="pk.test" model={model} highlightedItemId={null} onSelectItem={vi.fn()} />);
      await waitFor(() => expect(mapbox.state.maps).toHaveLength(1));
      const calls = (mapbox.state.maps[0].addLayer as unknown as { mock: { calls: Layer[][] } }).mock.calls;
      return Object.fromEntries(calls.map((call) => [call[0].id, call[0]]));
    }
    const zoomStops = (value: unknown) => {
      const expression = value as unknown[];
      expect(expression.slice(0, 3)).toEqual(['interpolate', ['linear'], ['zoom']]);
      const stops: Array<[number, number]> = [];
      for (let index = 3; index < expression.length; index += 2) {
        stops.push([expression[index] as number, expression[index + 1] as number]);
      }
      return stops;
    };
    const widthAt = (value: unknown, zoom: number) => zoomStops(value).find(([stop]) => stop === zoom)![1];

    it('stacks glow, white casing, road line, the straight estimate and the direction chevrons in that order', async () => {
      const layers = await drawnLayers();

      expect(Object.keys(layers)).toEqual([
        'itinerary-road-glow',
        'itinerary-road-casing',
        'itinerary-road-line',
        'itinerary-route-line',
        'itinerary-road-chevrons',
        'itinerary-selected-casing',
        'itinerary-selected-line',
      ]);
      expect(Object.values(layers).map((layer) => layer.source)).toEqual([
        'itinerary-road',
        'itinerary-road',
        'itinerary-road',
        'itinerary-route',
        'itinerary-road',
        'itinerary-selected',
        'itinerary-selected',
      ]);
    });

    it('colours every road leg from its own colour property', async () => {
      const layers = await drawnLayers();

      expect(layers['itinerary-road-line'].paint!['line-color']).toEqual(['get', 'color']);
      expect(layers['itinerary-road-glow'].paint!['line-color']).toEqual(['get', 'color']);
      expect(layers['itinerary-road-casing'].paint!['line-color']).toBe('#FFFFFF');
    });

    it('draws a thick road with round ends, a wider casing and a soft blurred glow, all growing with zoom', async () => {
      const layers = await drawnLayers();
      const road = layers['itinerary-road-line'];
      const casing = layers['itinerary-road-casing'];
      const glow = layers['itinerary-road-glow'];

      expect(widthAt(road.paint!['line-width'], 14)).toBeGreaterThanOrEqual(6);
      for (const layer of [glow, casing, road]) {
        expect(layer.layout).toMatchObject({ 'line-cap': 'round', 'line-join': 'round' });
        expect(zoomStops(layer.paint!['line-width']).length).toBeGreaterThanOrEqual(3);
      }
      for (const [zoom] of zoomStops(road.paint!['line-width'])) {
        expect(widthAt(casing.paint!['line-width'], zoom)).toBeGreaterThan(widthAt(road.paint!['line-width'], zoom));
        expect(widthAt(glow.paint!['line-width'], zoom)).toBeGreaterThan(widthAt(casing.paint!['line-width'], zoom));
      }
      expect(glow.paint!['line-blur']).toBeGreaterThan(0);
      expect(glow.paint!['line-opacity']).toBeLessThan(0.5);
    });

    it('registers the chevron image and draws it along the road line', async () => {
      const layers = await drawnLayers();
      const addImage = mapbox.state.maps[0].addImage as unknown as {
        mock: { calls: Array<[string, { width: number }]> };
      };
      const chevrons = layers['itinerary-road-chevrons'];

      expect(addImage.mock.calls[0][0]).toBe(CHEVRON_IMAGE);
      expect(addImage.mock.calls[0][1].width).toBeGreaterThan(0);
      expect(chevrons.type).toBe('symbol');
      expect(chevrons.layout).toMatchObject({
        'symbol-placement': 'line',
        'icon-image': CHEVRON_IMAGE,
        'icon-allow-overlap': true,
      });
      expect(chevrons.layout!['symbol-spacing']).toBeGreaterThan(30);
    });

    it('still draws the line, without chevrons, when the image cannot be registered', async () => {
      mapbox.state.failAddImage = true;
      const layers = await drawnLayers();

      expect(Object.keys(layers)).toEqual([
        'itinerary-road-glow',
        'itinerary-road-casing',
        'itinerary-road-line',
        'itinerary-route-line',
        'itinerary-selected-casing',
        'itinerary-selected-line',
      ]);
    });

    it('keeps the straight estimate dashed and visibly lighter and thinner than the road', async () => {
      const layers = await drawnLayers();
      const straight = layers['itinerary-route-line'];
      const road = layers['itinerary-road-line'];

      expect(straight.paint!['line-dasharray']).toBeDefined();
      expect(road.paint!['line-dasharray']).toBeUndefined();
      expect(straight.paint!['line-color']).toBe(ROUTE_LINE_COLOR);
      expect(straight.paint!['line-opacity']).toBe(STRAIGHT_LINE_OPACITY);
      expect(STRAIGHT_LINE_OPACITY).toBeLessThan(0.7);
      expect(widthAt(straight.paint!['line-width'], 14)).toBeLessThan(widthAt(road.paint!['line-width'], 14));
    });

    it('shades the routed legs from the start colour to the end colour in order', async () => {
      render(<MapboxItineraryMap token="pk.test" model={model} highlightedItemId={null} onSelectItem={vi.fn()} />);

      await waitFor(() => expect(roadLines()).toHaveLength(2));

      expect(roadFeatures().map((feature) => feature.properties.color)).toEqual([legColor(0, 2), legColor(1, 2)]);
    });

    it('keeps the colour of a leg when another leg could not be routed', async () => {
      fetchMock.mockImplementation(async (url) =>
        url.includes(`${legA.from[0]},${legA.from[1]};`)
          ? { ok: false, status: 422, json: async () => ({}) }
          : roadFor(url),
      );
      render(<MapboxItineraryMap token="pk.test" model={model} highlightedItemId={null} onSelectItem={vi.fn()} />);

      await waitFor(() => expect(roadLines()).toHaveLength(1));

      expect(roadFeatures()[0].properties.color).toBe(legColor(1, 2));
    });
  });

  describe('viewing one selected leg', () => {
    const LEG = 'item-11>item-12';
    const props = { token: 'pk.test', model, highlightedItemId: null, onSelectItem: vi.fn() };
    const fitCalls = () =>
      (mapbox.state.maps[0].fitBounds as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    const paintCalls = () =>
      (mapbox.state.maps[0].setPaintProperty as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    const selectedData = () => {
      const calls = mapbox.state.sources.get('itinerary-selected')!.setData.mock.calls;
      return (calls[calls.length - 1][0] as { features: Array<{ geometry: { coordinates: number[][] } }> }).features;
    };
    const legPoints = [[108.22, 16.06], [108.23, 16.065]];

    async function drawnWithRoads(selectedLegId: string | null = null) {
      const view = render(<MapboxItineraryMap {...props} selectedLegId={selectedLegId} />);
      await waitFor(() => expect(roadLines()).toHaveLength(2));
      return view;
    }

    it('fits the map to exactly that leg, with padding and a zoom cap for very short legs', async () => {
      const { rerender } = await drawnWithRoads();

      rerender(<MapboxItineraryMap {...props} selectedLegId={LEG} />);

      const [bounds, options] = fitCalls()[fitCalls().length - 1];
      expect(bounds).toEqual([legPoints[0], legPoints[1]]);
      expect(options).toMatchObject({ padding: 64, maxZoom: 16 });
    });

    it('draws that leg on top in the accent colour, thicker than the road, along the road when it was routed', async () => {
      const { rerender } = await drawnWithRoads();

      rerender(<MapboxItineraryMap {...props} selectedLegId={LEG} />);

      const coordinates = selectedData()[0].geometry.coordinates;
      expect(coordinates).toHaveLength(3);
      expect(coordinates[0]).toEqual(legPoints[0]);
      expect(coordinates[2]).toEqual(legPoints[1]);
      const layers = (mapbox.state.maps[0].addLayer as unknown as { mock: { calls: Array<[{ id: string; paint: Record<string, unknown> }]> } }).mock.calls.map((call) => call[0]);
      const line = layers.find((layer) => layer.id === 'itinerary-selected-line')!;
      const road = layers.find((layer) => layer.id === 'itinerary-road-line')!;
      expect(line.paint['line-color']).toBe(ROUTE_SELECTED_COLOR);
      const width14 = (value: unknown) => (value as number[])[(value as number[]).indexOf(14) + 1];
      expect(width14(line.paint['line-width'])).toBeGreaterThan(width14(road.paint['line-width']));
    });

    it('draws a leg that could not be routed with its two ends', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
      const { rerender } = render(<MapboxItineraryMap {...props} />);
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(lastData('itinerary-route').geometry.coordinates).toHaveLength(2));

      rerender(<MapboxItineraryMap {...props} selectedLegId={LEG} />);

      expect(selectedData()[0].geometry.coordinates).toEqual(legPoints);
    });

    it('dims every other leg while one is selected and restores them afterwards', async () => {
      const { rerender } = await drawnWithRoads();
      paintCalls().length = 0;

      rerender(<MapboxItineraryMap {...props} selectedLegId={LEG} />);
      expect(paintCalls()).toEqual(
        expect.arrayContaining([
          ['itinerary-road-line', 'line-opacity', 0.25],
          ['itinerary-road-casing', 'line-opacity', 0.25],
          ['itinerary-road-chevrons', 'icon-opacity', 0.25],
          ['itinerary-route-line', 'line-opacity', expect.any(Number)],
        ]),
      );
      const dimmedStraight = paintCalls().find((call) => call[0] === 'itinerary-route-line')![2] as number;
      expect(dimmedStraight).toBeLessThan(STRAIGHT_LINE_OPACITY);

      paintCalls().length = 0;
      rerender(<MapboxItineraryMap {...props} selectedLegId={null} />);
      expect(paintCalls()).toEqual(
        expect.arrayContaining([
          ['itinerary-road-line', 'line-opacity', 1],
          ['itinerary-road-chevrons', 'icon-opacity', 1],
          ['itinerary-route-line', 'line-opacity', STRAIGHT_LINE_OPACITY],
        ]),
      );
    });

    it('fits the whole route again and clears the selected line when the selection is removed', async () => {
      const { rerender } = await drawnWithRoads(LEG);
      rerender(<MapboxItineraryMap {...props} selectedLegId={null} />);

      const [bounds, options] = fitCalls()[fitCalls().length - 1];
      expect(bounds).toEqual([[108.2, 16.05], [108.23, 16.065]]);
      expect(options).toMatchObject({ padding: 48, maxZoom: 15 });
      expect(selectedData()).toEqual([]);
    });

    it('fits the selected leg when the map starts with one already chosen', async () => {
      await drawnWithRoads(LEG);

      const [bounds] = fitCalls()[fitCalls().length - 1];
      expect(bounds).toEqual([legPoints[0], legPoints[1]]);
    });

    it('highlights the two end markers of the leg with the independent scale property, never the transform', async () => {
      const { rerender } = await drawnWithRoads();
      const positions = mapbox.state.markers.map((marker) => marker.element.style.transform);

      rerender(<MapboxItineraryMap {...props} selectedLegId={LEG} />);

      expect(mapbox.state.markers.map((marker) => marker.element.style.getPropertyValue('scale'))).toEqual(['', '1.25', '1.25']);
      expect(mapbox.state.markers.map((marker) => marker.element.style.transform)).toEqual(positions);

      rerender(<MapboxItineraryMap {...props} selectedLegId={null} />);
      expect(mapbox.state.markers.map((marker) => marker.element.style.getPropertyValue('scale'))).toEqual(['', '', '']);
    });

    it('ignores a selection that is not a leg of this route', async () => {
      const { rerender } = await drawnWithRoads();
      const fits = fitCalls().length;
      paintCalls().length = 0;

      rerender(<MapboxItineraryMap {...props} selectedLegId="item-99>item-100" />);

      expect(paintCalls().filter((call) => call[2] === 0.25)).toEqual([]);
      expect(fitCalls()).toHaveLength(fits);
      expect(selectedData()).toEqual([]);
    });
  });

  describe('road route per leg', () => {
    it('draws each leg along the road Mapbox returns and leaves no dashed straight segment', async () => {
      render(<MapboxItineraryMap token="pk.test" model={model} highlightedItemId={null} onSelectItem={vi.fn()} />);

      await waitFor(() => expect(roadLines()).toHaveLength(2));
      const lines = roadLines();
      expect(roadFeatures().every((feature) => feature.geometry.type === 'LineString')).toBe(true);
      expect(lines[0]).toHaveLength(3);
      expect(lines[0][0]).toEqual(legA.from);
      expect(lines[1][2]).toEqual(legB.to);
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

      await waitFor(() => expect(roadLines()).toHaveLength(1));
      expect(roadLines()[0][0]).toEqual(legA.from);
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
      expect(roadLines()).toEqual([]);
    });

    it('does not ask Mapbox again for legs it already routed when the map is redrawn', async () => {
      const { rerender } = render(
        <MapboxItineraryMap token="pk.test" model={model} highlightedItemId={null} onSelectItem={vi.fn()} />,
      );
      await waitFor(() => expect(roadLines()).toHaveLength(2));
      const drawn = mapbox.state.sources.get('itinerary-road')!.setData.mock.calls.length;

      rerender(
        <MapboxItineraryMap token="pk.test" model={{ ...model, markers: [...model.markers] }} highlightedItemId={null} onSelectItem={vi.fn()} />,
      );
      await waitFor(() =>
        expect(mapbox.state.sources.get('itinerary-road')!.setData.mock.calls.length).toBeGreaterThan(drawn),
      );

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(roadLines()).toHaveLength(2);
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
