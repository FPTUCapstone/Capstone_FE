export type TripState = 'Upcoming' | 'Completed' | 'Cancelled';

export type TripType = 'TourBooking' | 'SelfPlannedItinerary';

export interface TripParticipant {
  fullName: string;
  participantType?: 'Adult' | 'Child';
  notes?: string;
}

export interface TripCardDto {
  tripId: string;
  tripType: TripType;
  title: string;
  departureDatetime: string;
  status: TripState;
  statusLabel: string;
  coverImageUrl?: string;

  // Fields specific to self-planned itinerary (UC-10 / UC-11)
  itineraryId?: string | number;
  stopCount?: number;
  distanceKm?: number;
  stopsSummary?: string[];
  memberCount?: number;
  durationLabel?: string;
  isRerouted?: boolean;

  // Fields specific to booked tour (UC-27 / UC-28 / UC-29)
  bookingId?: string;
  bookingCode?: string;
  tourId?: string | number;
  scheduleId?: string | number;
  operatorName?: string;
  totalAmount?: number;
  currency?: string;
  paymentMethod?: string;
  participantsSummary?: string;
  /**
   * CRITICAL (PR #43 alignment):
   * This is the real ticket identifier required by ROUTES.bookingTicket(ticketId).
   * MUST NEVER be substituted with bookingId.
   */
  ticketId?: string;

  // Cancelled / Refund information
  cancelledAt?: string;
  refundStatus?: string;
  refundAmount?: number;
  refundChannel?: string;

  // Review status (UC-33)
  isReviewed: boolean;
  reviewId?: string;
  rating?: number;
  reviewComment?: string;
  reviewedAtUtc?: string;

  isDemo?: boolean;
}

export interface TripSummaryStatsDto {
  totalCompletedTrips: number;
  totalDistanceKm?: number;
  totalVisitedPois?: number;
  cspMatchRate?: number;
  averageRating?: number;
  isDemo?: boolean;
}

export interface TripHistoryFilter {
  tab: TripState;
  tripType?: 'ALL' | 'TourBooking' | 'SelfPlannedItinerary';
  fromDate?: string;
  toDate?: string;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}

export interface TripHistoryResponseDto {
  status: 'SUCCESS' | 'PENDING_BE_INTEGRATION' | 'ERROR';
  message?: string;
  trips: TripCardDto[];
  summary?: TripSummaryStatsDto;
  totalCount: number;
  page: number;
  pageSize: number;
  isDemo?: boolean;
}

export class TripApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 0,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'TripApiError';
  }
}
