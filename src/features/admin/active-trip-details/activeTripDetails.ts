import { formatVietnamDateTime } from '../active-trips/activeTrips';

export const DETAIL_MESSAGES = {
  notFound: 'Active trip not found or no longer available for monitoring.',
  forbidden: 'You do not have permission to access this function.',
  unavailable: 'TripMate is temporarily unable to process your request. Please check your connection and try again.',
  empty: 'No data is available for the selected criteria.',
  snapshotAvailable: 'Proposed itinerary snapshot available',
} as const;

export const INCIDENT_TYPES = ['SevereWeather', 'ScheduleDelay', 'RouteDeviation', 'POIClosure'] as const;
export const WEATHER_SEVERITIES = ['Low', 'Moderate', 'Severe', 'Extreme'] as const;
export const REROUTING_STATUSES = ['Proposed', 'Accepted', 'Rejected', 'Expired'] as const;
export const ITINERARY_ITEM_STATUSES = ['Planned', 'Visited', 'Skipped'] as const;
export const STATE_HISTORY_ACTORS = ['System', 'Traveler', 'Administrator'] as const;

// Signed 64-bit maximum; trip IDs are compared as digit strings, never as Numbers.
export const MAX_TRIP_ID = '9223372036854775807';

export function isValidTripId(value: string): boolean {
  if (!/^[1-9]\d*$/.test(value)) return false;
  if (value.length > MAX_TRIP_ID.length) return false;
  return value.length < MAX_TRIP_ID.length || value <= MAX_TRIP_ID;
}

export type CurrentLocation = { latitude: number; longitude: number; asOfUtc: string | null };
export type GroupMemberEntry = { userId: string; fullName: string; joinedAtUtc: string; isLocationSharingEnabled: boolean };
export type GroupPanel = { groupId: string; groupName: string; hostName: string; members: GroupMemberEntry[] };
export type ItineraryProgressItem = {
  itemId: string; sequenceNo: number; poiId: string | null; poiName: string | null;
  itemKind: string; status: string; plannedArrivalUtc: string | null;
  plannedDepartureUtc: string | null; stayDurationMinutes: number;
};
export type TripStateChange = {
  fromState: string | null; toState: string; reason: string | null;
  triggeredBy: string | null; changedAtUtc: string;
};
export type WeatherEvent = {
  eventType: string; severity: string; regionName: string | null;
  validFromUtc: string; validToUtc: string | null;
};
export type TripIncident = {
  incidentId: string; incidentType: string; description: string | null;
  detectedAtUtc: string; resolvedAtUtc: string | null; weatherEvent: WeatherEvent | null;
};
export type TripReroutingEvent = {
  reroutingId: string; incidentId: string; status: string;
  proposedAtUtc: string; decidedAtUtc: string | null; hasProposedItinerarySnapshot: boolean;
};
export type TripLocationPoint = {
  latitude: number; longitude: number; recordedAtUtc: string; isOfflineCaptured: boolean;
};
export type ActiveTripDetail = {
  tripId: string; tripCode: string; tripType: string; currentState: string;
  groupOrTraveler: string; destination: string | null;
  startedAtUtc: string | null; lastSyncedAtUtc: string | null;
  currentDay: number | null; members: number; openAlerts: number;
  groupPanel: GroupPanel[] | null;
  currentLocation: CurrentLocation | null;
  itineraryProgress: ItineraryProgressItem[];
  stateHistory: TripStateChange[];
  incidents: TripIncident[];
  reroutingEvents: TripReroutingEvent[];
  locationTrail: TripLocationPoint[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string';
const isNullableString = (value: unknown): value is string | null => value === null || isString(value);
const isDecimalStringId = (value: unknown): value is string => isString(value) && /^\d+$/.test(value);
const isUtcTimestamp = (value: unknown): value is string =>
  isString(value) && /(?:Z|\+00:00)$/.test(value) && Number.isFinite(Date.parse(value));
const isNullableUtcTimestamp = (value: unknown): value is string | null =>
  value === null || isUtcTimestamp(value);
const isNonNegativeInteger = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;
const isFiniteCoordinate = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

function parseGroupPanel(value: unknown): GroupPanel {
  if (!isRecord(value) || !isDecimalStringId(value.groupId) || !isString(value.groupName) ||
      !isString(value.hostName) || !Array.isArray(value.members)) {
    throw new Error('The active-trip detail response is invalid.');
  }
  const members = value.members.map((entry): GroupMemberEntry => {
    if (!isRecord(entry) || !isDecimalStringId(entry.userId) || !isString(entry.fullName) ||
        !isUtcTimestamp(entry.joinedAtUtc) || !isBoolean(entry.isLocationSharingEnabled)) {
      throw new Error('The active-trip detail response is invalid.');
    }
    return entry as GroupMemberEntry;
  });
  return { ...(value as Omit<GroupPanel, 'members'>), members };
}

function parseIncident(value: unknown): TripIncident {
  if (!isRecord(value) || !isDecimalStringId(value.incidentId) || !isString(value.incidentType) ||
      !isNullableString(value.description) || !isUtcTimestamp(value.detectedAtUtc) ||
      !isNullableUtcTimestamp(value.resolvedAtUtc)) {
    throw new Error('The active-trip detail response is invalid.');
  }
  let weatherEvent: WeatherEvent | null = null;
  if (value.weatherEvent !== null) {
    const weather = value.weatherEvent;
    if (!isRecord(weather) || !isString(weather.eventType) ||
        !(WEATHER_SEVERITIES as readonly string[]).includes(weather.severity as string) ||
        !isNullableString(weather.regionName) || !isUtcTimestamp(weather.validFromUtc) ||
        !isNullableUtcTimestamp(weather.validToUtc)) {
      throw new Error('The active-trip detail response is invalid.');
    }
    weatherEvent = weather as WeatherEvent;
  }
  return { ...(value as Omit<TripIncident, 'weatherEvent'>), weatherEvent };
}

export function parseActiveTripDetail(value: unknown): ActiveTripDetail {
  if (!isRecord(value) || !isDecimalStringId(value.tripId) || !isValidTripId(value.tripId) ||
      !isString(value.tripCode) || !isString(value.tripType) || !isString(value.currentState) ||
      !isString(value.groupOrTraveler) || !isNullableString(value.destination) ||
      !isNullableUtcTimestamp(value.startedAtUtc) || !isNullableUtcTimestamp(value.lastSyncedAtUtc) ||
      !(value.currentDay === null || isNonNegativeInteger(value.currentDay)) ||
      !isNonNegativeInteger(value.members) || !isNonNegativeInteger(value.openAlerts)) {
    throw new Error('The active-trip detail response is invalid.');
  }
  let groupPanel: GroupPanel[] | null = null;
  if (value.groupPanel !== null) {
    if (!Array.isArray(value.groupPanel)) throw new Error('The active-trip detail response is invalid.');
    groupPanel = value.groupPanel.map(parseGroupPanel);
  }
  let currentLocation: CurrentLocation | null = null;
  if (value.currentLocation !== null) {
    const location = value.currentLocation;
    if (!isRecord(location) || !isFiniteCoordinate(location.latitude) ||
        !isFiniteCoordinate(location.longitude) || !isNullableUtcTimestamp(location.asOfUtc)) {
      throw new Error('The active-trip detail response is invalid.');
    }
    currentLocation = location as CurrentLocation;
  }
  const readArray = <T>(section: unknown, parse: (entry: unknown) => T): T[] => {
    if (!Array.isArray(section)) throw new Error('The active-trip detail response is invalid.');
    return section.map(parse);
  };
  return {
    ...value as Omit<ActiveTripDetail,
      'groupPanel' | 'currentLocation' | 'itineraryProgress' | 'stateHistory' |
      'incidents' | 'reroutingEvents' | 'locationTrail'>,
    groupPanel,
    currentLocation,
    itineraryProgress: readArray(value.itineraryProgress, (entry): ItineraryProgressItem => {
      if (!isRecord(entry) || !isDecimalStringId(entry.itemId) ||
          !isNonNegativeInteger(entry.sequenceNo) ||
          !(entry.poiId === null || isDecimalStringId(entry.poiId)) ||
          !isNullableString(entry.poiName) || !isString(entry.itemKind) ||
          !(ITINERARY_ITEM_STATUSES as readonly string[]).includes(entry.status as string) ||
          !isNullableUtcTimestamp(entry.plannedArrivalUtc) ||
          !isNullableUtcTimestamp(entry.plannedDepartureUtc) ||
          !isNonNegativeInteger(entry.stayDurationMinutes)) {
        throw new Error('The active-trip detail response is invalid.');
      }
      return entry as ItineraryProgressItem;
    }),
    stateHistory: readArray(value.stateHistory, (entry): TripStateChange => {
      if (!isRecord(entry) || !isNullableString(entry.fromState) || !isString(entry.toState) ||
          !isNullableString(entry.reason) ||
          !(entry.triggeredBy === null ||
            (STATE_HISTORY_ACTORS as readonly string[]).includes(entry.triggeredBy as string)) ||
          !isUtcTimestamp(entry.changedAtUtc)) {
        throw new Error('The active-trip detail response is invalid.');
      }
      return entry as TripStateChange;
    }),
    incidents: readArray(value.incidents, parseIncident),
    reroutingEvents: readArray(value.reroutingEvents, (entry): TripReroutingEvent => {
      if (!isRecord(entry) || !isDecimalStringId(entry.reroutingId) ||
          !isDecimalStringId(entry.incidentId) ||
          !(REROUTING_STATUSES as readonly string[]).includes(entry.status as string) ||
          !isUtcTimestamp(entry.proposedAtUtc) || !isNullableUtcTimestamp(entry.decidedAtUtc) ||
          !isBoolean(entry.hasProposedItinerarySnapshot)) {
        throw new Error('The active-trip detail response is invalid.');
      }
      return entry as TripReroutingEvent;
    }),
    locationTrail: readArray(value.locationTrail, (entry): TripLocationPoint => {
      if (!isRecord(entry) || !isFiniteCoordinate(entry.latitude) ||
          !isFiniteCoordinate(entry.longitude) || !isUtcTimestamp(entry.recordedAtUtc) ||
          !isBoolean(entry.isOfflineCaptured)) {
        throw new Error('The active-trip detail response is invalid.');
      }
      return entry as TripLocationPoint;
    }),
  };
}

export function formatCoordinate(value: number): string {
  return value.toFixed(6);
}

export { formatVietnamDateTime };
