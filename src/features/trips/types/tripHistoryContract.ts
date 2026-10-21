/**
 * UC-32 Trip History contract (Capstone_BE `docs/TM-78-api-contract.md`).
 *
 * Record identity is the pair `kind` + `id`; an id alone is never meaningful. Ids are decimal strings
 * so values above 2^53 stay exact. Everything here is what the backend returns: nothing is derived,
 * guessed or defaulted on the client.
 */

export const TRIP_KINDS = ['commerceBooking', 'itinerary'] as const;
export type TripKind = (typeof TRIP_KINDS)[number];

export const TRIP_TABS = ['Upcoming', 'Completed', 'Cancelled'] as const;
export type TripTab = (typeof TRIP_TABS)[number];

export type TripType = 'TourBooking' | 'SelfPlannedItinerary';

/** The trip-type filter sent to the list endpoint; `All` is sent by omitting the parameter. */
export type TripTypeFilter = 'All' | TripType;

/** The query the list endpoint accepts (page size is fixed by the screen). */
export interface TripHistoryFilter {
  tab: TripTab;
  tripType: TripTypeFilter;
  /** `yyyy-MM-dd`, a Vietnam calendar day, inclusive. */
  fromDate?: string;
  toDate?: string;
  page: number;
  pageSize?: number;
}

export const TRIP_HISTORY_PAGE_SIZE = 20;

export interface TripActions {
  /** Completed booking that has not been reviewed yet. Always false for itineraries. */
  canReview: boolean;
  canViewETicket: boolean;
  /** The id for the UC-29 e-ticket link; never substitute the booking id. */
  ticketId: string | null;
  canViewRefund: boolean;
}

export interface TripReviewState {
  exists: boolean;
  reviewId?: string;
  rating?: number;
}

export interface TripReviewableRecord {
  kind: 'commerceBooking';
  id: string;
}

interface TripItemBase {
  id: string;
  tab: TripTab;
  title: string;
  /** UTC instant; display as dd/MM/yyyy in Asia/Ho_Chi_Minh. */
  departureAtUtc: string;
  status: string;
  actions: TripActions;
}

export interface BookingTripItem extends TripItemBase {
  kind: 'commerceBooking';
  tripType: 'TourBooking';
  bookingCode: string;
  participantCount: number;
  totalAmount: number;
  reviewableRecord: TripReviewableRecord;
  review: TripReviewState;
}

export interface ItineraryTripItem extends TripItemBase {
  kind: 'itinerary';
  tripType: 'SelfPlannedItinerary';
  stopCount: number;
  /** Present only for a Completed itinerary. */
  visitedCount?: number;
  reviewableRecord: null;
  review: null;
}

export type TripListItem = BookingTripItem | ItineraryTripItem;

export interface TripSummary {
  totalCompletedTrips: number;
  totalVisitedPois: number;
}

export interface TripHistoryPage {
  items: TripListItem[];
  /** Only on the Completed tab. */
  summary?: TripSummary;
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface TripTourInfo {
  title: string;
  destinationSummary: string;
}

export interface TripScheduleInfo {
  startAtUtc: string;
  endAtUtc: string;
  meetingPoint: string | null;
}

export interface TripParticipantCounts {
  adult: number;
  child: number;
  infant: number;
}

export interface TripCancellationInfo {
  cancelledAtUtc: string | null;
  reason: string | null;
}

export interface TripRefundInfo {
  status: string;
  amount: number;
  /** Gateway of the original payment; null when it cannot be resolved. */
  channel: string | null;
}

export type TripVisitStatus = 'Reached' | 'Skipped' | 'Pending';

export interface TripStop {
  sequenceNo: number;
  poiId: string;
  poiName: string;
  plannedArrivalUtc: string | null;
  plannedDepartureUtc: string | null;
  /** Present only for a Completed itinerary. */
  visitStatus?: TripVisitStatus;
  reachedAtUtc?: string;
  skippedAtUtc?: string;
}

export interface TripSessionInfo {
  startedAtUtc: string;
  endedAtUtc: string | null;
  /** `RouteFinished`, `TravelerStopped` or `Expired`. */
  completionReason: string | null;
}

export interface BookingTripDetail extends BookingTripItem {
  tour: TripTourInfo;
  schedule: TripScheduleInfo;
  participants: TripParticipantCounts;
  /** Only for a Cancelled booking. */
  cancellation?: TripCancellationInfo;
  /** Only for a Cancelled booking that has a refund. */
  refund?: TripRefundInfo;
}

export interface ItineraryTripDetail extends ItineraryTripItem {
  validFromUtc?: string;
  validToUtc?: string;
  stops: TripStop[];
  /** Only for a Completed itinerary. */
  session?: TripSessionInfo;
}

export type TripDetail = BookingTripDetail | ItineraryTripDetail;
