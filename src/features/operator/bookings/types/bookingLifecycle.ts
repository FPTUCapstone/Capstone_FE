/**
 * Types and message contracts for Tour Operator Customer Bookings (UC-40, UC-41, UC-42).
 * Follows Report 3 SRS §3.8.4.1, §3.8.4.2, §3.8.4.3.
 *
 * The UC-40 shapes mirror the Backend contract `Capstone_BE/docs/UC-40-api-contract.md`; the BE enums are
 * the source of truth. Anything that exists only for the demo fixtures (UC-41/UC-42 previews) is marked.
 */

export const OPERATOR_BOOKING_MESSAGES = {
  MSG126: 'Access denied. You can only view and manage bookings for your own tours.',
  MSG31: 'End date must be on or after the start date.',
  MSG128: 'No customer bookings found matching the current filter criteria.',
  MSG127: 'System encountered an error. Please try again later.',
  MSG123: 'Cancellation reason details cannot be empty.',
  MSG133: 'Booking is already cancelled/completed or a refund request already exists.',
  MSG95: 'Customer has already checked in for the tour. This booking cannot be cancelled.',
  MSG81: 'Customer booking cancelled successfully.',
  MSG83: 'Booking refund request has been initiated successfully.',
  MSG84: 'Booking does not have a valid payment transaction or is not eligible for refund.',
  MSG89: 'Payment gateway timed out. Please try again or check refund queue status.',
  MSG153: 'Refund initiation could not be completed immediately; queued for retry.',
  PENDING_BE_INTEGRATION:
    'Customer booking management is awaiting Backend API integration. No live server data available.',
} as const;

export type OperatorBookingMessageKey = keyof typeof OPERATOR_BOOKING_MESSAGES;

/**
 * Semantic internal status codes for booking operations (decoupled from contradictory numeric IDs).
 */
export const BOOKING_ERROR_CODES = {
  BOOKING_OWNERSHIP_DENIED: 'BOOKING_OWNERSHIP_DENIED',
} as const;

/**
 * CR-01 / BR-52: Canonical default pagination size for customer booking list.
 */
export const OPERATOR_BOOKING_DEFAULT_PAGE_SIZE = 20;

/** BE `BookingStatus`. */
export type BookingStatus = 'PendingPayment' | 'Confirmed' | 'Cancelled' | 'Completed' | 'Expired';

/** BE `PaymentStatus`. */
export type PaymentStatus = 'Unpaid' | 'Paid' | 'Refunded' | 'PartiallyRefunded';

/** Derived by the BE from the booking's tickets (UC-43 records the check-in). */
export type CheckInStatus = 'NotCheckedIn' | 'CheckedIn';

/** BE `ParticipantType`. */
export type ParticipantType = 'Adult' | 'Child' | 'Infant';

/** BE `PaymentGateway`. */
export type PaymentGateway = 'Mock' | 'PayOS' | 'VNPAY' | 'MoMo' | 'Stripe';

/** BE `TicketStatus`. */
export type TicketStatus = 'Valid' | 'Used' | 'Cancelled' | 'Expired';

/** BE `PaymentTransactionStatus`. */
export type PaymentTransactionStatus = 'Pending' | 'Success' | 'Cancelled' | 'Expired' | 'Failed';

/** Why the BE says a booking cannot be cancelled by the operator (mirrors the UC-41 rule). */
export type CancelBlockedReason = 'InvalidStatus' | 'CheckedIn';

export interface BookingTourDto {
  tourId: string;
  title: string;
}

export interface BookingScheduleDto {
  scheduleId: string;
  startAtUtc: string;
  endAtUtc: string;
}

export interface BookingScheduleDetailDto extends BookingScheduleDto {
  meetingPoint: string | null;
}

export interface BookingBookerDto {
  userId: string;
  fullName: string;
  email: string | null;
}

export interface BookingBookerDetailDto extends BookingBookerDto {
  phoneNumber: string | null;
}

/** Light row returned by `GET /api/v1/operator/bookings`. */
export interface BookingListItemDto {
  bookingId: string;
  bookingCode: string;
  tour: BookingTourDto;
  schedule: BookingScheduleDto;
  booker: BookingBookerDto;
  quantity: number;
  totalAmount: number;
  discountAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  checkInStatus: CheckInStatus;
  checkedInAtUtc: string | null;
  bookedAtUtc: string;
}

/** Participant whitelist: the BE never returns ID documents, phone, e-mail or nationality. */
export interface BookingParticipantDto {
  fullName: string;
  participantType: ParticipantType;
}

export interface BookingTicketDto {
  ticketCode: string;
  status: TicketStatus;
  issuedAtUtc: string;
  expiresAtUtc: string | null;
}

/**
 * BR-77: Verified transaction information is READ ONLY and immutable. Gateway payloads,
 * checkout links and order codes are never returned.
 */
export interface BookingPaymentDto {
  gateway: PaymentGateway;
  gatewayTransactionRef: string | null;
  status: PaymentTransactionStatus;
  amount: number;
  succeededAtUtc: string | null;
}

export interface BookingCouponDto {
  code: string;
  name: string;
  discountAmount: number;
}

/** Full booking returned by `GET /api/v1/operator/bookings/{bookingId}`. */
export interface BookingDetailDto {
  bookingId: string;
  bookingCode: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  bookedAtUtc: string;
  cancelledAtUtc: string | null;
  cancelReason: string | null;
  tour: BookingTourDto;
  schedule: BookingScheduleDetailDto;
  booker: BookingBookerDetailDto;
  quantity: number;
  participants: BookingParticipantDto[];
  ticket: BookingTicketDto | null;
  checkInStatus: CheckInStatus;
  checkedInAtUtc: string | null;
  payment: BookingPaymentDto | null;
  paidAmount: number;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  coupon: BookingCouponDto | null;
  canCancel: boolean;
  cancelBlockedReason: CancelBlockedReason | null;
}

/**
 * BR-77 & BR-107: Refund is a separate record from the original transaction.
 * BR-74: Idempotent - repeated notifications/clicks must not duplicate records.
 * BR-134: Retry tracking.
 * DEMO ONLY until the UC-42 FE integration: the UC-40 detail endpoint does not return refunds.
 */
export interface BookingRefundDto {
  id: string;
  bookingId: string;
  refundableAmount: number;
  deductionAmount: number;
  policyApplied: string;
  paymentChannel: PaymentGateway;
  status: 'Pending' | 'Success' | 'Failed';
  gatewayReference?: string;
  attemptCount: number;
  notes?: string;
  createdAt: string;
}

export const CANCELLATION_REASON_VALUES = [
  'CUSTOMER_REQUEST',
  'TOUR_ITINERARY_CHANGE',
  'FORCE_MAJEURE',
  'OTHER',
] as const;

export type CancellationReasonValue = (typeof CANCELLATION_REASON_VALUES)[number];

export function isCancellationReasonValue(val: unknown): val is CancellationReasonValue {
  return typeof val === 'string' && (CANCELLATION_REASON_VALUES as readonly string[]).includes(val);
}

export const CANCELLATION_REASONS = [
  { value: 'CUSTOMER_REQUEST', label: 'Customer requested cancellation' },
  { value: 'TOUR_ITINERARY_CHANGE', label: 'Tour itinerary change' },
  { value: 'FORCE_MAJEURE', label: 'Weather condition / force majeure' },
  { value: 'OTHER', label: 'Other reason' },
] as const;

/**
 * What the drawer and the UC-41/UC-42 dialogs consume: the BE detail plus the demo-only
 * UC-41/UC-42 additions. Live responses never carry the extras.
 */
export interface BookingDetailView extends BookingDetailDto {
  refund?: BookingRefundDto;
  cancellationReasonType?: CancellationReasonValue;
}

export interface BookingFilterParams {
  tourId?: string;
  startDate?: string;
  endDate?: string;
  status?: BookingStatus | 'ALL';
  searchKeyword?: string;
  page?: number;
  pageSize?: number;
}

export interface BookingSummaryMetrics {
  totalBookings: number;
  totalParticipants: number;
  totalConfirmedAmount: number;
}

export interface BookingListResult {
  items: BookingListItemDto[];
  summary: BookingSummaryMetrics;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** Set when the list could not be shown as data: access (MSG126), date range (MSG31), system (MSG127) or empty (MSG128). */
  errorCode?: BookingListErrorCode;
  errorMessage?: string;
}

export type BookingListErrorCode = 'MSG126' | 'MSG127' | 'MSG31' | 'MSG128';

/** Result of loading the owned-tour filter options; a failure only disables the filter. */
export interface BookingTourOptionsResult {
  options: { id: string; title: string }[];
  failed: boolean;
}

export interface CancelBookingPayload {
  reasonType: CancellationReasonValue;
  reasonDetail: string; // Required BR-106, MSG123 if empty
}

export interface CancelBookingResult {
  success: boolean;
  messageCode: string;
  message: string;
  booking?: BookingDetailView;
  refundTriggered?: boolean;
  refundFollowUpRequired?: boolean;
}

export interface InitiateRefundPayload {
  notes?: string;
}

export interface InitiateRefundResult {
  success: boolean;
  messageCode: string;
  message: string;
  refund?: BookingRefundDto;
}

/**
 * Real Backend refund statuses (commerce.Refunds.status), mirrored from
 * TripMate.Domain.Enums.RefundStatus. Distinct from BookingRefundDto.status,
 * which is demo-fixture-only and uses a simplified 3-value union.
 */
export const REFUND_STATUS_VALUES = [
  'Pending',
  'Processing',
  'Processed',
  'RetryPending',
  'Failed',
  'ManualReview',
  'Rejected',
] as const;

export type RefundStatusValue = (typeof REFUND_STATUS_VALUES)[number];

/**
 * Mirrors Capstone_BE's BookingRefundProgressResponse field-for-field
 * (GET /api/v1/bookings/{bookingId}/refund).
 */
export interface BookingRefundStatusDto {
  bookingId: string;
  bookingCode: string;
  refundAmount: number;
  status: RefundStatusValue;
  gatewayReference: string | null;
  attemptCount: number;
  requestedAtUtc: string;
  processedAtUtc: string | null;
  nextAttemptAtUtc: string | null;
  lastErrorCode: string | null;
}

export type GetBookingRefundStatusResult =
  | { outcome: 'found'; data: BookingRefundStatusDto }
  | { outcome: 'not_applicable' }
  | { outcome: 'error'; messageCode: string };
