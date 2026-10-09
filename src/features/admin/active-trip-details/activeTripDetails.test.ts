import { describe, expect, it } from 'vitest';

import {
  formatVietnamDateTime,
  isValidTripId,
  parseActiveTripDetail,
  MAX_TRIP_ID,
} from './activeTripDetails';

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
    { itemId: '902', sequenceNo: 2, poiId: null, poiName: null, itemKind: 'Rest', status: 'Skipped', plannedArrivalUtc: null, plannedDepartureUtc: null, stayDurationMinutes: 60 },
  ],
  stateHistory: [
    { fromState: null, toState: 'Navigating', reason: 'Trip started', triggeredBy: 'Traveler', changedAtUtc: '2026-09-25T17:00:00Z' },
  ],
  incidents: [
    { incidentId: '77', incidentType: 'SevereWeather', description: 'Heavy rain', detectedAtUtc: '2026-09-26T02:55:10Z', resolvedAtUtc: null, weatherEvent: { eventType: 'HeavyRain', severity: 'Severe', regionName: 'Da Nang', validFromUtc: '2026-09-26T02:00:00Z', validToUtc: null } },
    { incidentId: '76', incidentType: 'RouteDeviation', description: null, detectedAtUtc: '2026-09-26T01:10:00Z', resolvedAtUtc: '2026-09-26T01:40:00Z', weatherEvent: null },
  ],
  reroutingEvents: [
    { reroutingId: '31', incidentId: '77', status: 'Proposed', proposedAtUtc: '2026-09-26T02:56:00Z', decidedAtUtc: null, hasProposedItinerarySnapshot: true },
  ],
  locationTrail: [
    { latitude: 16.0601, longitude: 108.2266, recordedAtUtc: '2026-09-26T03:10:00Z', isOfflineCaptured: false },
  ],
};

describe('trip ID validation', () => {
  it.each(['1', '9', MAX_TRIP_ID])('accepts canonical decimal %s', value => expect(isValidTripId(value)).toBe(true));
  it.each(['1abc', '1.5', '1e3', '+1', ' 1', '1 ', '0', '-1', '01', '', '007', '9223372036854775808', '99999999999999999999'])(
    'rejects %s', value => expect(isValidTripId(value)).toBe(false));
});

describe('active trip detail contract', () => {
  it('parses a full payload keeping IDs as strings', () => {
    const parsed = parseActiveTripDetail(detail);
    expect(parsed.tripId).toBe('42');
    expect(parsed.groupPanel).toHaveLength(1);
    expect(parsed.groupPanel![0].members[1].isLocationSharingEnabled).toBe(false);
    expect(parsed.itineraryProgress[1].plannedArrivalUtc).toBeNull();
    expect(parsed.incidents[0].weatherEvent!.severity).toBe('Severe');
    expect(parsed.reroutingEvents[0].hasProposedItinerarySnapshot).toBe(true);
  });

  it('accepts null groupPanel and null currentLocation', () => {
    const parsed = parseActiveTripDetail({ ...detail, groupPanel: null, currentLocation: null, destination: null });
    expect(parsed.groupPanel).toBeNull();
    expect(parsed.currentLocation).toBeNull();
  });

  it.each([
    { tripId: 42 }, { tripId: '042' }, { tripCode: 42 },
    { startedAtUtc: '2026-09-25 17:00:00' }, { members: -1 },
    { itineraryProgress: [{ ...detail.itineraryProgress[0], status: 'Unknown' }] },
    { incidents: [{ ...detail.incidents[0], weatherEvent: { ...detail.incidents[0].weatherEvent, severity: 'Catastrophic' } }] },
    { reroutingEvents: [{ ...detail.reroutingEvents[0], status: 'Pending' }] },
    { currentLocation: { ...detail.currentLocation, latitude: '16.06' } },
    { groupPanel: [{ ...detail.groupPanel![0], members: [{ ...detail.groupPanel![0].members[0], joinedAtUtc: 'not-a-date' }] }] },
  ])('rejects a payload mutated with %j', mutation => {
    expect(() => parseActiveTripDetail({ ...detail, ...mutation })).toThrow();
  });

  it('formats Vietnam display times', () => {
    expect(formatVietnamDateTime('2026-09-26T03:12:44Z')).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    expect(formatVietnamDateTime(null)).toBe('Not available');
  });
});
