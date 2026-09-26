import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActiveTripsError, fetchActiveTrips } from './activeTripsService';
import { ActiveTripsScreen } from './ActiveTripsScreen';

const push = vi.fn();
const replace = vi.fn();
let query = '';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams(query),
}));
vi.mock('./activeTripsService', () => ({ fetchActiveTrips: vi.fn(), ActiveTripsError: class extends Error { constructor(public status: number) { super(); } } }));

const response = {
  summary: { activeTrips: 1, tripsWithOpenAlerts: 0, travelersOnTrip: 2 },
  pageNumber: 1, pageSize: 20, totalCount: 1, totalPages: 1,
  items: [{ tripId: '42', tripCode: 'TRIP-42', tripType: 'SelfPlanned' as const, currentState: 'Exploring' as const,
    groupOrTraveler: 'Linh Nguyen', destination: null, startedAtUtc: '2026-09-26T01:30:00Z', currentDay: 1, members: 2, openAlerts: 0 }],
};

describe('ActiveTripsScreen', () => {
  beforeEach(() => {
    query = ''; push.mockClear(); replace.mockClear(); vi.mocked(fetchActiveTrips).mockReset().mockResolvedValue(response);
  });

  it('renders summary and rows without a UC-59 details action', async () => {
    render(<ActiveTripsScreen />);
    expect(await screen.findByText('TRIP-42')).toBeTruthy();
    expect(screen.getByText('26/09/2026 08:30')).toBeTruthy();
    expect(screen.queryByText('View Details')).toBeNull();
  });

  it('does not fetch while the Administrator is typing', async () => {
    render(<ActiveTripsScreen />);
    await screen.findByText('TRIP-42');
    fireEvent.change(screen.getByLabelText('Keyword'), { target: { value: 'trip' } });
    expect(fetchActiveTrips).toHaveBeenCalledTimes(1);
    fireEvent.submit(screen.getByRole('search'));
    expect(push).toHaveBeenCalledWith('/admin/trips/active?keyword=trip');
  });

  it('blocks an inverted date range before navigation or request', async () => {
    render(<ActiveTripsScreen />);
    await screen.findByText('TRIP-42');
    fireEvent.change(screen.getByLabelText('Start Date From'), { target: { value: '2026-09-27' } });
    fireEvent.change(screen.getByLabelText('Start Date To'), { target: { value: '2026-09-26' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(screen.getByRole('alert').textContent).toContain('logically invalid');
    expect(push).not.toHaveBeenCalled();
  });

  it('redirects a missing or expired Administrator session to login', async () => {
    vi.mocked(fetchActiveTrips).mockRejectedValue(new ActiveTripsError(401));
    render(<ActiveTripsScreen />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Ftrips%2Factive'));
  });
});
