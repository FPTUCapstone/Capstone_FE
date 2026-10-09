import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActiveTripDetailsError, fetchActiveTripDetails } from './activeTripDetailsService';
import { ActiveTripDetailsScreen } from './ActiveTripDetailsScreen';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('./activeTripDetailsService', () => ({
  fetchActiveTripDetails: vi.fn(),
  ActiveTripDetailsError: class extends Error { constructor(public status: number) { super(); } },
}));

const detail = {
  tripId: '42', tripCode: 'TRIP-42', tripType: 'Tour', currentState: 'Interrupted',
  groupOrTraveler: 'Da Nang Weekend Group', destination: 'Hoi An',
  startedAtUtc: '2026-09-25T17:00:00Z', lastSyncedAtUtc: '2026-09-26T03:12:44Z',
  currentDay: 2, members: 2, openAlerts: 1,
  groupPanel: [{
    groupId: '9', groupName: 'Da Nang Weekend Group', hostName: 'Ngo Quoc Dat',
    members: [
      { userId: '101', fullName: 'Ngo Quoc Dat', joinedAtUtc: '2026-09-20T12:00:00Z', isLocationSharingEnabled: true },
      { userId: '102', fullName: 'Tran Thi B', joinedAtUtc: '2026-09-21T08:30:00Z', isLocationSharingEnabled: false },
    ],
  }],
  currentLocation: { latitude: 16.0612, longitude: 108.2277, asOfUtc: '2026-09-26T03:12:44Z' },
  itineraryProgress: [
    { itemId: '901', sequenceNo: 1, poiId: '17', poiName: 'My Khe Beach', itemKind: 'Visit', status: 'Visited', plannedArrivalUtc: '2026-09-26T02:00:00Z', plannedDepartureUtc: '2026-09-26T04:00:00Z', stayDurationMinutes: 120 },
  ],
  stateHistory: [
    { fromState: null, toState: 'Navigating', reason: 'Trip started', triggeredBy: 'Traveler', changedAtUtc: '2026-09-25T17:00:00Z' },
  ],
  incidents: [
    { incidentId: '77', incidentType: 'SevereWeather', description: 'Heavy rain', detectedAtUtc: '2026-09-26T02:55:10Z', resolvedAtUtc: null, weatherEvent: { eventType: 'HeavyRain', severity: 'Severe', regionName: 'Da Nang', validFromUtc: '2026-09-26T02:00:00Z', validToUtc: null } },
  ],
  reroutingEvents: [
    { reroutingId: '31', incidentId: '77', status: 'Proposed', proposedAtUtc: '2026-09-26T02:56:00Z', decidedAtUtc: null, hasProposedItinerarySnapshot: true },
  ],
  locationTrail: [
    { latitude: 16.0601, longitude: 108.2266, recordedAtUtc: '2026-09-26T03:10:00Z', isOfflineCaptured: false },
  ],
};

describe('ActiveTripDetailsScreen', () => {
  beforeEach(() => {
    replace.mockClear();
    vi.mocked(fetchActiveTripDetails).mockReset().mockResolvedValue(detail);
  });

  it('renders every section with formatted data on success', async () => {
    render(<ActiveTripDetailsScreen tripId="42" />);

    expect(await screen.findByRole('heading', { name: 'TRIP-42' })).toBeTruthy();
    expect(screen.getByText('Tour')).toBeTruthy();
    expect(screen.getByText('Interrupted')).toBeTruthy();
    expect(screen.getByText('Da Nang Weekend Group')).toBeTruthy();
    expect(screen.getByText('· Host Ngo Quoc Dat')).toBeTruthy();
    expect(screen.getByText('Ngo Quoc Dat')).toBeTruthy();
    expect(screen.getByText('Enabled')).toBeTruthy();
    expect(screen.getByText('Disabled')).toBeTruthy();
    expect(screen.getByText('Itinerary Progress')).toBeTruthy();
    expect(screen.getByText('FSM State History')).toBeTruthy();
    expect(screen.getByText('Incidents')).toBeTruthy();
    expect(screen.getByText('Weather Severe')).toBeTruthy();
    expect(screen.getByText('Proposed itinerary snapshot available')).toBeTruthy();
    expect(screen.getByText('Location Trail')).toBeTruthy();
    // Trip-level fix is shown; member coordinates are never rendered (BR-51).
    expect(screen.getByText(/16\.061200/)).toBeTruthy();
  });

  it('shows the proposed MSG133 wording on 404', async () => {
    vi.mocked(fetchActiveTripDetails).mockRejectedValue(new ActiveTripDetailsError(404));
    render(<ActiveTripDetailsScreen tripId="42" />);
    expect(await screen.findByText('Active trip not found or no longer available for monitoring.')).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });

  it('redirects to admin login on 401 with a return URL', async () => {
    vi.mocked(fetchActiveTripDetails).mockRejectedValue(new ActiveTripDetailsError(401));
    render(<ActiveTripDetailsScreen tripId="42" />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Ftrips%2Factive%2F42'));
  });

  it('shows the forbidden message on 403', async () => {
    vi.mocked(fetchActiveTripDetails).mockRejectedValue(new ActiveTripDetailsError(403));
    render(<ActiveTripDetailsScreen tripId="42" />);
    expect(await screen.findByText('You do not have permission to access this function.')).toBeTruthy();
  });

  it('recovers through the Retry control after an unavailable response', async () => {
    vi.mocked(fetchActiveTripDetails)
      .mockRejectedValueOnce(new ActiveTripDetailsError(503))
      .mockResolvedValueOnce(detail);
    render(<ActiveTripDetailsScreen tripId="42" />);

    expect(await screen.findByText(/temporarily unable to process/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('heading', { name: 'TRIP-42' })).toBeTruthy();
    expect(fetchActiveTripDetails).toHaveBeenCalledTimes(2);
  });

  it('shows MSG128 for empty sections', async () => {
    vi.mocked(fetchActiveTripDetails).mockResolvedValue({
      ...detail, groupPanel: null, currentLocation: null,
      itineraryProgress: [], locationTrail: [], stateHistory: [],
      incidents: [], reroutingEvents: [],
    });
    render(<ActiveTripDetailsScreen tripId="42" />);
    expect((await screen.findAllByText('No data is available for the selected criteria.')).length)
      .toBeGreaterThanOrEqual(7);
  });
});
