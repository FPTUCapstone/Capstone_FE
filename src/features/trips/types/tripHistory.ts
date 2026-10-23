export type TripState = 'Upcoming' | 'Completed' | 'Cancelled';

export type TripType = 'TourBooking' | 'SelfPlannedItinerary';

export interface TripParticipant {
  fullName: string;
  participantType?: 'Adult' | 'Child';
  notes?: string;
}

/**
 * @deprecated Legacy shape used only by the old review page (`features/reviews`). Trip History uses the
 * TM-78 contract in `tripHistoryContract.ts`; do not add new uses.
 */
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
