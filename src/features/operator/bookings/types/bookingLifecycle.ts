/**
 * Types and message contracts for Tour Operator Customer Bookings (UC-40, UC-41, UC-42).
 * Follows Report 3 SRS §3.8.4.1, §3.8.4.2, §3.8.4.3.
 */

export const OPERATOR_BOOKING_MESSAGES = {
  MSG126: 'Access denied. You can only view and manage bookings for your own tours.',
  MSG29: 'Invalid date range. Departure start date must be before or equal to end date.',
  MSG128: 'No customer bookings found matching the current filter criteria.',
  MSG127: 'System encountered an error. Please try again later.',
  MSG123: 'Cancellation reason details cannot be empty.',
  MSG133: 'Booking is already cancelled/completed or a refund request already exists.',
  MSG95: 'Customer has already checked in for the tour. This booking cannot be cancelled.',
  MSG82: 'The cancellation deadline for this tour package has passed.',
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

export type BookingPaymentChannel = 'VNPay' | 'PayOS';

export type BookingStatus = 'Confirmed' | 'PendingPayment' | 'Cancelled' | 'Completed';

export type CheckInStatus = 'NotCheckedIn' | 'CheckedIn';

export type PaxType = 'Adult' | 'Child';

export interface ParticipantDto {
  id: string;
  fullName: string;
  paxType: PaxType;
  age?: number;
  specialNotes?: string;
}

/**
 * BR-77: Verified transaction information is READ ONLY and immutable.
 */
export interface PaymentTransactionDto {
  id: string;
  amount: number;
  paymentChannel: BookingPaymentChannel;
  transactionReference: string;
  status: 'Success' | 'Pending' | 'Failed';
  paidAt?: string;
}

/**
 * BR-77 & BR-107: Refund is a separate record from the original transaction.
 * BR-74: Idempotent - repeated notifications/clicks must not duplicate records.
 * BR-134: Retry tracking.
 */
export interface BookingRefundDto {
  id: string;
  bookingId: string;
  refundableAmount: number;
  deductionAmount: number;
  policyApplied: string;
  paymentChannel: BookingPaymentChannel;
  status: 'Pending' | 'Success' | 'Failed';
  gatewayReference?: string;
  attemptCount: number;
  notes?: string;
  createdAt: string;
}

export const CANCELLATION_REASONS = [
  { value: 'CUSTOMER_REQUEST', label: 'Customer requested cancellation' },
  { value: 'TOUR_ITINERARY_CHANGE', label: 'Tour itinerary change' },
  { value: 'FORCE_MAJEURE', label: 'Weather condition / force majeure' },
  { value: 'OTHER', label: 'Other reason' },
] as const;

export type CancellationReasonValue = (typeof CANCELLATION_REASONS)[number]['value'];

export interface BookingDto {
  id: string;
  bookingCode: string;
  tourId: string;
  tourName: string;
  operatorUserId: number; // For BR-105 ownership check
  departureDate: string; // ISO format
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  participantsCount: number;
  participants: ParticipantDto[];
  totalAmount: number;
  paidAmount: number;
  status: BookingStatus;
  checkInStatus: CheckInStatus;
  qrTicketValid: boolean; // BR-86
  cancellationWindowExpired?: boolean; // For MSG82 test cases
  coupon?: {
    code: string;
    discountAmount: number;
  };
  paymentTransaction?: PaymentTransactionDto;
  refund?: BookingRefundDto;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
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
  items: BookingDto[];
  summary: BookingSummaryMetrics;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  pendingBackendNotice?: string;
  errorMessage?: string;
}

export interface CancelBookingPayload {
  reasonType: CancellationReasonValue;
  reasonDetail: string; // Required BR-106, MSG123 if empty
}

export interface CancelBookingResult {
  success: boolean;
  messageCode: string;
  message: string;
  booking?: BookingDto;
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
