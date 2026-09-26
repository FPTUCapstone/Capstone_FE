export const ACTIVE_TRIP_TYPES = ['SelfPlanned', 'Tour'] as const;
export const ACTIVE_TRIP_STATES = ['Navigating', 'Exploring', 'Interrupted'] as const;
export const ALERT_STATES = ['WithOpenAlerts', 'WithoutOpenAlerts'] as const;
export const ACTIVE_TRIPS_PAGE_SIZE = 20;

export const ACTIVE_TRIPS_MESSAGES = {
  invalidDates: 'The submitted Start Date range is logically invalid.',
  forbidden: 'You do not have permission to access this function.',
  unavailable: 'TripMate is temporarily unable to process your request. Please check your connection and try again.',
  empty: 'No data is available for the selected criteria.',
} as const;

export type ActiveTripType = (typeof ACTIVE_TRIP_TYPES)[number];
export type ActiveTripState = (typeof ACTIVE_TRIP_STATES)[number];
export type AlertState = (typeof ALERT_STATES)[number];

export type ActiveTripItem = {
  tripId: string;
  tripCode: string;
  tripType: ActiveTripType;
  currentState: ActiveTripState;
  groupOrTraveler: string;
  destination: string | null;
  startedAtUtc: string | null;
  currentDay: number | null;
  members: number;
  openAlerts: number;
};

export type ActiveTripsResponse = {
  summary: { activeTrips: number; tripsWithOpenAlerts: number; travelersOnTrip: number };
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: ActiveTripItem[];
};

export type ActiveTripsSearch = {
  keyword: string;
  tripType: ActiveTripType | '';
  destination: string;
  startDateFrom: string;
  startDateTo: string;
  alertState: AlertState | '';
  pageNumber: number;
};

const DEFAULT_SEARCH: ActiveTripsSearch = {
  keyword: '', tripType: '', destination: '', startDateFrom: '', startDateTo: '', alertState: '', pageNumber: 1,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isNonNegativeInteger = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;
const isPositiveInteger = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 1;
const isNullableString = (value: unknown): value is string | null => value === null || typeof value === 'string';
const isUtcTimestamp = (value: unknown): value is string | null =>
  value === null || (typeof value === 'string' && value.endsWith('Z') && Number.isFinite(Date.parse(value)));

function parseItem(value: unknown): ActiveTripItem {
  if (!isRecord(value) || typeof value.tripId !== 'string' || !/^\d+$/.test(value.tripId) ||
      typeof value.tripCode !== 'string' || !ACTIVE_TRIP_TYPES.includes(value.tripType as ActiveTripType) ||
      !ACTIVE_TRIP_STATES.includes(value.currentState as ActiveTripState) ||
      typeof value.groupOrTraveler !== 'string' || !isNullableString(value.destination) ||
      !isUtcTimestamp(value.startedAtUtc) ||
      !(value.currentDay === null || isPositiveInteger(value.currentDay)) ||
      !isNonNegativeInteger(value.members) || !isNonNegativeInteger(value.openAlerts)) {
    throw new Error('The active-trip response is invalid.');
  }
  return value as ActiveTripItem;
}

export function parseActiveTripsResponse(value: unknown): ActiveTripsResponse {
  if (!isRecord(value) || !isRecord(value.summary) ||
      !isNonNegativeInteger(value.summary.activeTrips) ||
      !isNonNegativeInteger(value.summary.tripsWithOpenAlerts) ||
      !isNonNegativeInteger(value.summary.travelersOnTrip) ||
      !isPositiveInteger(value.pageNumber) || !isPositiveInteger(value.pageSize) ||
      !isNonNegativeInteger(value.totalCount) || !isNonNegativeInteger(value.totalPages) ||
      !Array.isArray(value.items)) {
    throw new Error('The active-trip response is invalid.');
  }
  return { ...(value as Omit<ActiveTripsResponse, 'items'>), items: value.items.map(parseItem) };
}

export function formatVietnamDateTime(value: string | null): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Not available';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}

const isDateOnly = (value: string) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
export function validateDateRange(from: string, to: string): boolean {
  return isDateOnly(from) && isDateOnly(to) && (!from || !to || from <= to);
}

export function parseActiveTripsSearch(params: URLSearchParams): ActiveTripsSearch {
  const tripType = params.get('tripType');
  const alertState = params.get('alertState');
  const rawPage = Number(params.get('pageNumber'));
  const from = params.get('startDateFrom') ?? '';
  const to = params.get('startDateTo') ?? '';
  return {
    keyword: (params.get('keyword') ?? '').trim().slice(0, 200),
    tripType: ACTIVE_TRIP_TYPES.includes(tripType as ActiveTripType) ? tripType as ActiveTripType : '',
    destination: (params.get('destination') ?? '').trim().slice(0, 300),
    startDateFrom: isDateOnly(from) ? from : '',
    startDateTo: isDateOnly(to) ? to : '',
    alertState: ALERT_STATES.includes(alertState as AlertState) ? alertState as AlertState : '',
    pageNumber: Number.isSafeInteger(rawPage) && rawPage >= 1 ? rawPage : 1,
  };
}

export function serializeActiveTripsSearch(search: ActiveTripsSearch): URLSearchParams {
  const params = new URLSearchParams();
  if (search.keyword) params.set('keyword', search.keyword);
  if (search.tripType) params.set('tripType', search.tripType);
  if (search.destination) params.set('destination', search.destination);
  if (search.startDateFrom) params.set('startDateFrom', search.startDateFrom);
  if (search.startDateTo) params.set('startDateTo', search.startDateTo);
  if (search.alertState) params.set('alertState', search.alertState);
  if (search.pageNumber > 1) params.set('pageNumber', String(search.pageNumber));
  return params;
}

export function defaultActiveTripsSearch(): ActiveTripsSearch {
  return { ...DEFAULT_SEARCH };
}
