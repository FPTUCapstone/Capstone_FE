import { fireEvent, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('../services/route-api', async original => ({ ...await original<typeof import('../services/route-api')>(), loadRoutes: mocks.list }));

import { RouteDirectoryView } from './RouteDirectoryView';
import { rememberRouteCreation, takeRouteCreation } from '../services/route-creation-feedback';

const message = 'Route created successfully.';

beforeEach(() => {
  vi.clearAllMocks();
  takeRouteCreation();
  window.history.replaceState(null, '', '/admin/routes');
  mocks.list.mockResolvedValue({ items: [{ id: 9, fromPoiName: 'Museum', toPoiName: 'Beach', distanceKm: 4.5, estimatedDurationMinutes: 20, transportMode: 'Car', status: 'Active' }], page: 1, pageSize: 20, totalCount: 1 });
});

describe('Routes List', () => {
  it('shows one success after confirmed creation and independently refreshes server rows', async () => {
    window.history.replaceState(null, '', `/admin/routes?confirmation=${rememberRouteCreation()}`);
    render(<StrictMode><RouteDirectoryView /></StrictMode>);
    expect(await screen.findByText('Museum')).toBeTruthy();
    expect(screen.getAllByText(message)).toHaveLength(1);
    expect(screen.getByText('Active')).toBeTruthy();
    expect(mocks.list).toHaveBeenCalled();
  });

  it('does not repeat success when the list is loaded again', async () => {
    window.history.replaceState(null, '', `/admin/routes?confirmation=${rememberRouteCreation()}`);
    const first = render(<RouteDirectoryView />);
    expect(await screen.findByText(message)).toBeTruthy();
    first.unmount();
    render(<RouteDirectoryView />);
    expect(await screen.findByText('Museum')).toBeTruthy();
    expect(screen.queryByText(message)).toBeNull();
  });

  it('does not treat a bookmarked route identifier as confirmation', async () => {
    window.history.replaceState(null, '', '/admin/routes?created=9&confirmation=old-bookmark');
    render(<RouteDirectoryView />);
    expect(await screen.findByText('Museum')).toBeTruthy();
    expect(screen.queryByText(message)).toBeNull();
  });

  it('dismisses success on history traversal or restoration', async () => {
    window.history.replaceState(null, '', `/admin/routes?confirmation=${rememberRouteCreation()}`);
    render(<RouteDirectoryView />);
    expect(await screen.findByText(message)).toBeTruthy();
    fireEvent(window, new PopStateEvent('popstate'));
    fireEvent(window, new PageTransitionEvent('pageshow', { persisted: true }));
    expect(screen.queryByText(message)).toBeNull();
  });
});
