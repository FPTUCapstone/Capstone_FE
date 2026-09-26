import { describe, expect, it } from 'vitest';

import {
  formatVietnamDateTime,
  parseActiveTripsResponse,
  parseActiveTripsSearch,
  serializeActiveTripsSearch,
  validateDateRange,
} from './activeTrips';

const valid = {
  summary: { activeTrips: 1, tripsWithOpenAlerts: 1, travelersOnTrip: 3 },
  pageNumber: 1,
  pageSize: 20,
  totalCount: 1,
  totalPages: 1,
  items: [{
    tripId: '9007199254740993', tripCode: 'TRIP-9007199254740993', tripType: 'Tour',
    currentState: 'Navigating', groupOrTraveler: 'Da Nang Group', destination: 'Da Nang',
    startedAtUtc: '2026-09-26T01:30:00Z', currentDay: 1, members: 3, openAlerts: 1,
  }],
};

describe('active trips contract', () => {
  it('accepts the approved payload and preserves bigint identifiers as strings', () => {
    expect(parseActiveTripsResponse(valid).items[0].tripId).toBe('9007199254740993');
  });

  it('accepts both UTC ISO 8601 representations emitted at the contract boundary', () => {
    expect(() => parseActiveTripsResponse({
      ...valid,
      items: [{ ...valid.items[0], startedAtUtc: '2026-09-26T01:30:00+00:00' }],
    })).not.toThrow();
    expect(() => parseActiveTripsResponse({
      ...valid,
      items: [{ ...valid.items[0], startedAtUtc: '2026-09-26T08:30:00+07:00' }],
    })).toThrow();
  });

  it('rejects unsafe IDs and negative counts', () => {
    expect(() => parseActiveTripsResponse({ ...valid, items: [{ ...valid.items[0], tripId: 42 }] })).toThrow();
    expect(() => parseActiveTripsResponse({ ...valid, summary: { ...valid.summary, activeTrips: -1 } })).toThrow();
  });

  it('formats UTC in Vietnam time without seconds', () => {
    expect(formatVietnamDateTime('2026-09-26T17:30:00Z')).toBe('27/09/2026 00:30');
  });

  it('normalizes only approved URL fields', () => {
    const parsed = parseActiveTripsSearch(new URLSearchParams('keyword=trip&tripType=Tour&pageNumber=2&unknown=x'));
    expect(serializeActiveTripsSearch(parsed).toString()).toBe('keyword=trip&tripType=Tour&pageNumber=2');
  });

  it('reports an inverted date range', () => {
    expect(validateDateRange('2026-09-27', '2026-09-26')).toBe(false);
    expect(validateDateRange('2026-09-26', '2026-09-26')).toBe(true);
  });
});
