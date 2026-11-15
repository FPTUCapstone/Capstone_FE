import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ road: vi.fn(), addSource: vi.fn(), addLayer: vi.fn(), remove: vi.fn(), token: vi.fn(), fitBounds: vi.fn(), onResize: null as (() => void) | null }));
vi.mock('@/lib/mapboxToken', () => ({ getMapboxPublicToken: mocks.token }));
vi.mock('@/features/scheduling/utils/mapboxDirections', () => ({ fetchRoadLeg: mocks.road }));
vi.mock('mapbox-gl', () => ({ default: {
  Map: class { on(event: string, callback: () => void) { if (event === 'load') queueMicrotask(callback); if (event === 'resize') mocks.onResize = callback; return this; } addSource = mocks.addSource; addLayer = mocks.addLayer; remove = mocks.remove; addControl() {} fitBounds = mocks.fitBounds; },
  Marker: class { setLngLat() { return this; } setPopup() { return this; } addTo() { return this; } },
  Popup: class { setText() { return this; } },
  NavigationControl: class {},
} }));
import { RouteMapPreview } from './RouteMapPreview';
const from = { id: 1, name: 'Museum', latitude: 16, longitude: 108 };
const to = { id: 2, name: 'Beach', latitude: 16.1, longitude: 108.1 };
beforeEach(() => { vi.clearAllMocks(); mocks.onResize = null; mocks.token.mockReturnValue('pk.public'); mocks.road.mockResolvedValue([[108, 16], [108.1, 16.1]]); });
afterEach(() => vi.unstubAllEnvs());
describe('Mapbox route preview', () => {
  it('keeps both endpoints in view when the map becomes narrower', async () => {
    render(<RouteMapPreview from={from} to={to} mode="Walking" />);
    await waitFor(() => expect(mocks.fitBounds).toHaveBeenCalledTimes(1));
    expect(mocks.onResize).not.toBeNull();
    mocks.onResize!();
    expect(mocks.fitBounds).toHaveBeenCalledTimes(2);
    expect(mocks.fitBounds.mock.calls[1]).toEqual(mocks.fitBounds.mock.calls[0]);
  });
  it('renders real provider geometry and both endpoint locations', async () => {
    render(<RouteMapPreview from={from} to={to} mode="Walking" />);
    await waitFor(() => expect(mocks.addSource).toHaveBeenCalled());
    expect(mocks.road.mock.calls[0][0]).toMatchObject({ from: [108, 16], to: [108.1, 16.1], profile: 'walking' });
    expect(mocks.addSource.mock.calls[0][1].data.geometry.coordinates).toEqual([[108, 16], [108.1, 16.1]]);
    expect(screen.getByText('Museum → Beach')).toBeTruthy();
  });
  it('shows unavailability without creating a fake polyline', async () => {
    mocks.road.mockResolvedValue(null);
    render(<RouteMapPreview from={from} to={to} mode="Car" />);
    await screen.findByText('TripMate is temporarily unable to process your request. Please check your connection and try again.');
    expect(mocks.addSource).not.toHaveBeenCalled();
  });
  it('does not request directions without the existing public token', async () => {
    mocks.token.mockReturnValue(null);
    render(<RouteMapPreview from={from} to={to} mode="PublicTransit" />);
    expect(screen.getByText('Map preview is unavailable because the map service is not configured.')).toBeTruthy();
    expect(mocks.road).not.toHaveBeenCalled();
  });
});
