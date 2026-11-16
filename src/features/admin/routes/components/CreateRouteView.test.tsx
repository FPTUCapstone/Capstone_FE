import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ options: vi.fn(), create: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
vi.mock('../services/route-api', async original => ({ ...await original<typeof import('../services/route-api')>(), loadRouteOptions: mocks.options, createRoute: mocks.create }));
vi.mock('./RouteMapPreview', () => ({ RouteMapPreview: () => <div aria-label="Route Map Preview">Map integration</div> }));
import { CreateRouteView } from './CreateRouteView';
import { RouteApiError, routeMessages } from '../services/route-api';
import { takeRouteCreation } from '../services/route-creation-feedback';
beforeEach(() => {
  vi.clearAllMocks();
  takeRouteCreation();
  mocks.options.mockResolvedValue({ pois: [{ id: 1, name: 'Museum', latitude: 16, longitude: 108 }, { id: 2, name: 'Beach', latitude: 16.1, longitude: 108.1 }], transportModes: ['Walking', 'Motorbike', 'Car', 'PublicTransit'] });
});
async function fill() {
  await screen.findAllByRole('option', { name: 'Museum' });
  fireEvent.change(screen.getByLabelText('Origin Point of Interest'), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText('Destination Point of Interest'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('Distance (km)'), { target: { value: '2.5' } });
  fireEvent.change(screen.getByLabelText('Estimated Travel Time (minutes)'), { target: { value: '15' } });
  fireEvent.change(screen.getByLabelText('Transport Mode'), { target: { value: 'Walking' } });
}
describe('UC-54 creation form', () => {
  it('reports required fields inline without submitting', async () => {
    render(<CreateRouteView />);
    await screen.findAllByRole('option', { name: 'Museum' });
    fireEvent.click(screen.getByRole('button', { name: 'Create Route' }));
    expect(screen.getAllByText(routeMessages.MSG01).length).toBe(5);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Origin Point of Interest').getAttribute('aria-invalid')).toBe('true');
  });
  it('disables in-flight creation and navigates only after server confirmation', async () => {
    let resolve!: (value: unknown) => void;
    mocks.create.mockReturnValue(new Promise(r => { resolve = r; }));
    render(<CreateRouteView />);
    await fill();
    fireEvent.click(screen.getByRole('button', { name: 'Create Route' }));
    expect(screen.getByRole('button', { name: 'Creating…' }).hasAttribute('disabled')).toBe(true);
    expect(mocks.push).not.toHaveBeenCalled();
    fireEvent.submit(screen.getByRole('form', { name: 'Create Route' }));
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ fromPoiId: 1, toPoiId: 2, transportMode: 'Walking', routeNote: null });
    await act(async () => resolve({ id: 7 }));
    expect(mocks.push).toHaveBeenCalledWith(expect.stringMatching(/^\/admin\/routes\?confirmation=/));
    const url = new URL(mocks.push.mock.calls[0][0], 'http://localhost');
    expect(takeRouteCreation(url.searchParams.get('confirmation'))).toBe(true);
    expect(mocks.refresh).toHaveBeenCalled();
  });
  it('keeps draft and displays domain validation on a server rejection', async () => {
    mocks.create.mockRejectedValue(new RouteApiError(400, routeMessages.MSG141, { ToPoiId: [routeMessages.MSG141] }, 'MSG141'));
    render(<CreateRouteView />);
    await fill();
    fireEvent.click(screen.getByRole('button', { name: 'Create Route' }));
    await waitFor(() => expect(screen.getAllByText(routeMessages.MSG141).length).toBeGreaterThan(0));
    expect((screen.getByLabelText('Distance (km)') as HTMLInputElement).value).toBe('2.5');
    expect(takeRouteCreation()).toBe(false);
    expect(mocks.push).not.toHaveBeenCalled();
  });
  it('does not redirect or show success after leaving the form during a save', async () => {
    let resolve!: (value: unknown) => void;
    mocks.create.mockReturnValue(new Promise(r => { resolve = r; }));
    const view = render(<CreateRouteView />);
    await fill();
    fireEvent.click(screen.getByRole('button', { name: 'Create Route' }));
    view.unmount();
    await act(async () => resolve({ id: 7 }));
    expect(mocks.push).not.toHaveBeenCalled();
  });
  it('shows empty Active POIs and blocks creation', async () => {
    mocks.options.mockResolvedValue({ pois: [], transportModes: ['Walking'] });
    render(<CreateRouteView />);
    await screen.findByText('At least two Active points of interest are needed to create a route.');
    expect(screen.getByRole('button', { name: 'Create Route' }).hasAttribute('disabled')).toBe(true);
  });
});
