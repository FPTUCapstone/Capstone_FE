/**
 * DEMO ONLY. Trip History fixtures in the TM-78 contract shape, used when `?demo=1` is requested outside
 * production with `NEXT_PUBLIC_ENABLE_DEMO_FIXTURES=true`. They never back a production code path and are
 * never used as a fallback when the real request fails.
 */
import {
  TRIP_HISTORY_PAGE_SIZE,
  type BookingTripDetail,
  type BookingTripItem,
  type ItineraryTripDetail,
  type ItineraryTripItem,
  type TripDetail,
  type TripHistoryFilter,
  type TripHistoryPage,
  type TripKind,
  type TripListItem,
  type TripStop,
} from '../types/tripHistoryContract';

const noActions = { canReview: false, canViewETicket: false, ticketId: null, canViewRefund: false } as const;

function booking(
  fields: Pick<BookingTripDetail, 'id' | 'tab' | 'title' | 'departureAtUtc' | 'status' | 'bookingCode' | 'participantCount' | 'totalAmount'> &
    Pick<BookingTripDetail, 'actions' | 'review' | 'tour' | 'schedule' | 'participants'> &
    Partial<Pick<BookingTripDetail, 'cancellation' | 'refund'>>,
): BookingTripDetail {
  return {
    kind: 'commerceBooking',
    tripType: 'TourBooking',
    reviewableRecord: { kind: 'commerceBooking', id: fields.id },
    ...fields,
  };
}

function itinerary(
  fields: Pick<ItineraryTripDetail, 'id' | 'tab' | 'title' | 'departureAtUtc' | 'status' | 'stops'> &
    Partial<Pick<ItineraryTripDetail, 'validFromUtc' | 'validToUtc' | 'session'>>,
): ItineraryTripDetail {
  const visited = fields.stops.filter((stop) => stop.visitStatus === 'Reached').length;
  return {
    kind: 'itinerary',
    tripType: 'SelfPlannedItinerary',
    stopCount: fields.stops.length,
    ...(fields.tab === 'Completed' ? { visitedCount: visited } : {}),
    reviewableRecord: null,
    actions: { ...noActions },
    review: null,
    ...fields,
  };
}

function stop(
  sequenceNo: number,
  poiId: string,
  poiName: string,
  arrival: string,
  departure: string,
  visit?: { status: 'Reached' | 'Skipped' | 'Pending'; at?: string },
): TripStop {
  return {
    sequenceNo,
    poiId,
    poiName,
    plannedArrivalUtc: arrival,
    plannedDepartureUtc: departure,
    ...(visit
      ? {
          visitStatus: visit.status,
          ...(visit.status === 'Reached' && visit.at ? { reachedAtUtc: visit.at } : {}),
          ...(visit.status === 'Skipped' && visit.at ? { skippedAtUtc: visit.at } : {}),
        }
      : {}),
  };
}

export const DEMO_TRIP_DETAILS: readonly TripDetail[] = [
  booking({
    id: '9001',
    tab: 'Completed',
    title: 'Hoi An Lantern Tour',
    departureAtUtc: '2026-10-01T02:00:00+00:00',
    status: 'Completed',
    bookingCode: 'TM-009001',
    participantCount: 3,
    totalAmount: 4_500_000,
    actions: { canReview: true, canViewETicket: true, ticketId: '7001', canViewRefund: false },
    review: { exists: false },
    tour: { title: 'Hoi An Lantern Tour', destinationSummary: 'Hoi An' },
    schedule: { startAtUtc: '2026-10-01T02:00:00+00:00', endAtUtc: '2026-10-01T10:00:00+00:00', meetingPoint: 'Old Town gate' },
    participants: { adult: 2, child: 1, infant: 0 },
  }),
  booking({
    id: '9002',
    tab: 'Completed',
    title: 'Ba Na Hills Day Tour',
    departureAtUtc: '2026-09-20T01:00:00+00:00',
    status: 'Completed',
    bookingCode: 'TM-009002',
    participantCount: 2,
    totalAmount: 3_200_000,
    actions: { canReview: false, canViewETicket: true, ticketId: '7002', canViewRefund: false },
    review: { exists: true, reviewId: '8001', rating: 5 },
    tour: { title: 'Ba Na Hills Day Tour', destinationSummary: 'Da Nang' },
    schedule: { startAtUtc: '2026-09-20T01:00:00+00:00', endAtUtc: '2026-09-20T09:00:00+00:00', meetingPoint: null },
    participants: { adult: 2, child: 0, infant: 0 },
  }),
  booking({
    id: '9003',
    tab: 'Upcoming',
    title: 'Son Tra Peninsula Tour',
    departureAtUtc: '2027-01-15T01:00:00+00:00',
    status: 'Confirmed',
    bookingCode: 'TM-009003',
    participantCount: 2,
    totalAmount: 2_400_000,
    actions: { canReview: false, canViewETicket: true, ticketId: '7003', canViewRefund: false },
    review: { exists: false },
    tour: { title: 'Son Tra Peninsula Tour', destinationSummary: 'Da Nang' },
    schedule: { startAtUtc: '2027-01-15T01:00:00+00:00', endAtUtc: '2027-01-15T08:00:00+00:00', meetingPoint: 'Han River Bridge' },
    participants: { adult: 2, child: 0, infant: 0 },
  }),
  booking({
    id: '9004',
    tab: 'Cancelled',
    title: 'My Son Sanctuary Tour',
    departureAtUtc: '2026-08-20T01:00:00+00:00',
    status: 'Cancelled',
    bookingCode: 'TM-009004',
    participantCount: 2,
    totalAmount: 1_600_000,
    actions: { canReview: false, canViewETicket: false, ticketId: null, canViewRefund: true },
    review: { exists: false },
    tour: { title: 'My Son Sanctuary Tour', destinationSummary: 'Quang Nam' },
    schedule: { startAtUtc: '2026-08-20T01:00:00+00:00', endAtUtc: '2026-08-20T09:00:00+00:00', meetingPoint: 'Hotel lobby' },
    participants: { adult: 2, child: 0, infant: 0 },
    cancellation: { cancelledAtUtc: '2026-08-10T03:00:00+00:00', reason: 'Change of plans' },
    refund: { status: 'Processed', amount: 800_000, channel: 'PayOS' },
  }),
  booking({
    id: '9005',
    tab: 'Cancelled',
    title: 'Marble Mountains Tour',
    departureAtUtc: '2026-07-05T01:00:00+00:00',
    status: 'Expired',
    bookingCode: 'TM-009005',
    participantCount: 1,
    totalAmount: 700_000,
    actions: { ...noActions },
    review: { exists: false },
    tour: { title: 'Marble Mountains Tour', destinationSummary: 'Da Nang' },
    schedule: { startAtUtc: '2026-07-05T01:00:00+00:00', endAtUtc: '2026-07-05T05:00:00+00:00', meetingPoint: null },
    participants: { adult: 1, child: 0, infant: 0 },
  }),
  itinerary({
    id: '5001',
    tab: 'Completed',
    title: 'Da Nang 2 days',
    departureAtUtc: '2026-09-20T01:00:00+00:00',
    status: 'Completed',
    validFromUtc: '2026-09-19T00:00:00+00:00',
    validToUtc: '2026-09-22T00:00:00+00:00',
    stops: [
      stop(1, '101', 'Dragon Bridge', '2026-09-20T01:00:00+00:00', '2026-09-20T02:00:00+00:00', { status: 'Reached', at: '2026-09-20T01:05:00+00:00' }),
      stop(2, '102', 'My Khe Beach', '2026-09-20T02:30:00+00:00', '2026-09-20T04:00:00+00:00', { status: 'Reached', at: '2026-09-20T02:40:00+00:00' }),
      stop(3, '103', 'Han Market', '2026-09-20T04:30:00+00:00', '2026-09-20T05:30:00+00:00', { status: 'Skipped', at: '2026-09-20T04:35:00+00:00' }),
      stop(4, '104', 'Marble Mountains', '2026-09-20T06:00:00+00:00', '2026-09-20T08:00:00+00:00', { status: 'Reached', at: '2026-09-20T06:10:00+00:00' }),
    ],
    session: { startedAtUtc: '2026-09-20T01:00:00+00:00', endedAtUtc: '2026-09-20T09:30:00+00:00', completionReason: 'RouteFinished' },
  }),
  itinerary({
    id: '5002',
    tab: 'Completed',
    title: 'Hue day trip',
    departureAtUtc: '2026-08-02T02:00:00+00:00',
    status: 'Completed',
    stops: [
      stop(1, '201', 'Imperial City', '2026-08-02T02:00:00+00:00', '2026-08-02T04:00:00+00:00', { status: 'Reached', at: '2026-08-02T02:10:00+00:00' }),
      stop(2, '202', 'Thien Mu Pagoda', '2026-08-02T04:30:00+00:00', '2026-08-02T05:30:00+00:00', { status: 'Pending' }),
      stop(3, '203', 'Khai Dinh Tomb', '2026-08-02T06:00:00+00:00', '2026-08-02T07:30:00+00:00', { status: 'Pending' }),
    ],
    session: { startedAtUtc: '2026-08-02T02:00:00+00:00', endedAtUtc: '2026-08-02T14:00:00+00:00', completionReason: 'Expired' },
  }),
  itinerary({
    id: '5003',
    tab: 'Upcoming',
    title: 'Hoi An weekend plan',
    departureAtUtc: '2026-12-01T01:00:00+00:00',
    status: 'Active',
    validFromUtc: '2026-12-01T00:00:00+00:00',
    validToUtc: '2026-12-03T00:00:00+00:00',
    stops: [
      stop(1, '301', 'Japanese Covered Bridge', '2026-12-01T01:00:00+00:00', '2026-12-01T02:00:00+00:00'),
      stop(2, '302', 'An Bang Beach', '2026-12-01T03:00:00+00:00', '2026-12-01T05:00:00+00:00'),
      stop(3, '303', 'Tra Que Vegetable Village', '2026-12-02T01:00:00+00:00', '2026-12-02T03:00:00+00:00'),
    ],
  }),
  itinerary({
    id: '5004',
    tab: 'Cancelled',
    title: 'Ngu Hanh Son plan',
    departureAtUtc: '2026-06-10T01:00:00+00:00',
    status: 'Cancelled',
    stops: [
      stop(1, '401', 'Marble Mountains', '2026-06-10T01:00:00+00:00', '2026-06-10T03:00:00+00:00'),
      stop(2, '402', 'Non Nuoc Beach', '2026-06-10T04:00:00+00:00', '2026-06-10T06:00:00+00:00'),
    ],
  }),
];

function toListItem(detail: TripDetail): TripListItem {
  if (detail.kind === 'commerceBooking') {
    const item: BookingTripItem = {
      kind: detail.kind,
      id: detail.id,
      tripType: detail.tripType,
      tab: detail.tab,
      title: detail.title,
      departureAtUtc: detail.departureAtUtc,
      status: detail.status,
      bookingCode: detail.bookingCode,
      participantCount: detail.participantCount,
      totalAmount: detail.totalAmount,
      reviewableRecord: detail.reviewableRecord,
      actions: detail.actions,
      review: detail.review,
    };
    return item;
  }
  const item: ItineraryTripItem = {
    kind: detail.kind,
    id: detail.id,
    tripType: detail.tripType,
    tab: detail.tab,
    title: detail.title,
    departureAtUtc: detail.departureAtUtc,
    status: detail.status,
    stopCount: detail.stopCount,
    reviewableRecord: null,
    actions: detail.actions,
    review: null,
  };
  if (detail.visitedCount !== undefined) item.visitedCount = detail.visitedCount;
  return item;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** First instant of a Vietnam calendar day (`yyyy-MM-dd`), or NaN for an unreadable value. */
function vietnamDayStart(date: string | undefined): number {
  return date ? Date.parse(`${date}T00:00:00+07:00`) : Number.NaN;
}

/** Same total order as the backend: departure descending, kind ascending, id descending. */
function byBackendOrder(left: TripDetail, right: TripDetail): number {
  const byDeparture = Date.parse(right.departureAtUtc) - Date.parse(left.departureAtUtc);
  if (byDeparture !== 0) return byDeparture;
  if (left.kind !== right.kind) return left.kind < right.kind ? -1 : 1;
  const leftId = BigInt(left.id);
  const rightId = BigInt(right.id);
  return leftId === rightId ? 0 : leftId < rightId ? 1 : -1;
}

/** A list page computed from the fixtures with the same filtering, order, paging and summary rules as TM-78. */
export function demoTripHistoryPage(filter: TripHistoryFilter): TripHistoryPage {
  const pageSize = filter.pageSize ?? TRIP_HISTORY_PAGE_SIZE;
  const from = vietnamDayStart(filter.fromDate);
  const until = vietnamDayStart(filter.toDate) + DAY_MS;

  const matching = DEMO_TRIP_DETAILS.filter((detail) => {
    if (detail.tab !== filter.tab) return false;
    if (filter.tripType !== 'All' && detail.tripType !== filter.tripType) return false;
    const departure = Date.parse(detail.departureAtUtc);
    if (Number.isFinite(from) && departure < from) return false;
    if (Number.isFinite(until) && departure >= until) return false;
    return true;
  }).sort(byBackendOrder);

  const start = (filter.page - 1) * pageSize;
  const page: TripHistoryPage = {
    items: matching.slice(start, start + pageSize).map(toListItem),
    page: filter.page,
    pageSize,
    totalCount: matching.length,
  };
  if (filter.tab === 'Completed') {
    page.summary = {
      totalCompletedTrips: matching.length,
      totalVisitedPois: matching.reduce(
        (sum, detail) => sum + (detail.kind === 'itinerary' ? (detail.visitedCount ?? 0) : 0),
        0,
      ),
    };
  }
  return page;
}

/** The detail for a (kind, id) pair; an id alone never identifies a record. */
export function demoTripDetail(kind: TripKind, id: string): TripDetail | null {
  return DEMO_TRIP_DETAILS.find((detail) => detail.kind === kind && detail.id === id) ?? null;
}
