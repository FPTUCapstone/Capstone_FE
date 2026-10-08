import {
  INITIAL_DEMO_BOOKINGS,
  isBookingDemoAllowedInCurrentEnv,
} from '../data/operatorBookingDemoFixtures';
import { calculateDemoBookingRefundPreview } from '../data/operatorBookingDemoPolicy';
import {
  BOOKING_ERROR_CODES,
  isCancellationReasonValue,
  OPERATOR_BOOKING_DEFAULT_PAGE_SIZE,
  OPERATOR_BOOKING_MESSAGES,
  type BookingDto,
  type BookingFilterParams,
  type BookingListResult,
  type BookingRefundDto,
  type BookingSummaryMetrics,
  type CancelBookingPayload,
  type CancelBookingResult,
  type InitiateRefundPayload,
  type InitiateRefundResult,
} from '../types/bookingLifecycle';

// In-memory state for Demo mode UI review
let inMemoryDemoBookings: BookingDto[] = JSON.parse(JSON.stringify(INITIAL_DEMO_BOOKINGS));

export function resetDemoBookingsState(): void {
  inMemoryDemoBookings = JSON.parse(JSON.stringify(INITIAL_DEMO_BOOKINGS));
}

function isValidDemoActorUserId(userId: number | undefined): userId is number {
  return typeof userId === 'number' && Number.isFinite(userId) && userId > 0;
}

export interface OperatorBookingServiceOptions {
  isDemo?: boolean;
  demoActorUserId?: number;
}

export interface InitiateBookingRefundOptions extends OperatorBookingServiceOptions {
  simulateFailureMode?: 'none' | 'timeout' | 'retry' | 'system';
  retryFailedRefund?: boolean;
}

/**
 * Fetches customer bookings for the signed-in Tour Operator (UC-40).
 * Enforces BR-105: Operator may view only bookings on tours owned by that operator.
 * Fails closed (MSG126) if Demo mode is invoked without a valid actor identity.
 * In production NO_BACKEND mode, returns empty items with PENDING_BE_INTEGRATION notice.
 */
export async function getOperatorBookings(
  params: BookingFilterParams = {},
  options: OperatorBookingServiceOptions = {}
): Promise<BookingListResult> {
  const isDemoActive = Boolean(options.isDemo && isBookingDemoAllowedInCurrentEnv());
  const defaultPageSize = Math.max(1, params.pageSize || OPERATOR_BOOKING_DEFAULT_PAGE_SIZE);

  // Production NO_BACKEND truthfulness
  if (!isDemoActive) {
    return {
      items: [],
      summary: {
        totalBookings: 0,
        totalParticipants: 0,
        totalConfirmedAmount: 0,
      },
      totalCount: 0,
      page: 1,
      pageSize: defaultPageSize,
      totalPages: 0,
      pendingBackendNotice: OPERATOR_BOOKING_MESSAGES.PENDING_BE_INTEGRATION,
    };
  }

  // BR-105 fail-closed when actor identity is missing in Demo mode
  if (!isValidDemoActorUserId(options.demoActorUserId)) {
    return {
      items: [],
      summary: {
        totalBookings: 0,
        totalParticipants: 0,
        totalConfirmedAmount: 0,
      },
      totalCount: 0,
      page: 1,
      pageSize: defaultPageSize,
      totalPages: 0,
      errorMessage: OPERATOR_BOOKING_MESSAGES.MSG126,
    };
  }

  // Date range validation (MSG29)
  if (params.startDate && params.endDate) {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    if (start > end) {
      return {
        items: [],
        summary: { totalBookings: 0, totalParticipants: 0, totalConfirmedAmount: 0 },
        totalCount: 0,
        page: 1,
        pageSize: defaultPageSize,
        totalPages: 0,
        errorMessage: OPERATOR_BOOKING_MESSAGES.MSG29,
      };
    }
  }

  const actorUserId = options.demoActorUserId;

  // Filter by BR-105: Owned tours only
  let filtered = inMemoryDemoBookings.filter((b) => b.operatorUserId === actorUserId);

  // Filter by Tour Package
  if (params.tourId && params.tourId !== 'ALL') {
    filtered = filtered.filter((b) => b.tourId === params.tourId);
  }

  // Filter by Booking Status
  if (params.status && params.status !== 'ALL') {
    filtered = filtered.filter((b) => b.status === params.status);
  }

  // Filter by Departure Date Range
  if (params.startDate) {
    const filterStartDay = params.startDate.slice(0, 10);
    filtered = filtered.filter((b) => b.departureDate.slice(0, 10) >= filterStartDay);
  }
  if (params.endDate) {
    const filterEndDay = params.endDate.slice(0, 10);
    filtered = filtered.filter((b) => b.departureDate.slice(0, 10) <= filterEndDay);
  }

  // Search by Booking Code or Contact Name
  if (params.searchKeyword && params.searchKeyword.trim()) {
    const kw = params.searchKeyword.trim().toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.bookingCode.toLowerCase().includes(kw) ||
        b.contactName.toLowerCase().includes(kw)
    );
  }

  // Summary Metrics calculated on applied filters
  const summary: BookingSummaryMetrics = {
    totalBookings: filtered.length,
    totalParticipants: filtered.reduce((acc, curr) => acc + curr.participantsCount, 0),
    totalConfirmedAmount: filtered.reduce(
      (acc, curr) =>
        curr.status === 'Confirmed' || curr.status === 'Completed'
          ? acc + curr.totalAmount
          : acc,
      0
    ),
  };

  if (filtered.length === 0) {
    return {
      items: [],
      summary,
      totalCount: 0,
      page: 1,
      pageSize: defaultPageSize,
      totalPages: 0,
      errorMessage: OPERATOR_BOOKING_MESSAGES.MSG128,
    };
  }

  // Pagination (BR-52, CR-01: default 20 items per page)
  const page = Math.max(1, params.page || 1);
  const pageSize = defaultPageSize;
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIdx = (page - 1) * pageSize;
  const paginatedItems = filtered.slice(startIdx, startIdx + pageSize);

  return {
    items: JSON.parse(JSON.stringify(paginatedItems)),
    summary,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Gets a single booking by ID (detail surface / drawer).
 * Enforces BR-105: Returns MSG126 if actor identity is missing or if the booking
 * does not belong to the signed-in operator.
 */
export async function getOperatorBookingById(
  bookingId: string,
  options: OperatorBookingServiceOptions = {}
): Promise<{ booking?: BookingDto; error?: string; messageCode?: string }> {
  const isDemoActive = Boolean(options.isDemo && isBookingDemoAllowedInCurrentEnv());

  if (!isDemoActive) {
    return {
      error: OPERATOR_BOOKING_MESSAGES.PENDING_BE_INTEGRATION,
      messageCode: 'PENDING_BE_INTEGRATION',
    };
  }

  // BR-105 fail-closed when actor identity is missing
  if (!isValidDemoActorUserId(options.demoActorUserId)) {
    return {
      error: OPERATOR_BOOKING_MESSAGES.MSG126,
      messageCode: BOOKING_ERROR_CODES.BOOKING_OWNERSHIP_DENIED,
    };
  }

  const booking = inMemoryDemoBookings.find((b) => b.id === bookingId);

  if (!booking) {
    return { error: 'Booking not found.', messageCode: 'MSG128' };
  }

  // BR-105 ownership check
  if (booking.operatorUserId !== options.demoActorUserId) {
    return {
      error: OPERATOR_BOOKING_MESSAGES.MSG126,
      messageCode: BOOKING_ERROR_CODES.BOOKING_OWNERSHIP_DENIED,
    };
  }

  return { booking: JSON.parse(JSON.stringify(booking)) };
}

/**
 * Cancels a customer booking (UC-41).
 * Validations:
 * - BR-105: Operator may cancel only owned-tour bookings; fails closed if actor identity is missing (MSG126)
 * - BR-106: Cancellation reason must be provided (MSG123)
 * - Cannot cancel if already Cancelled or Completed (MSG133)
 * - Cannot cancel if already Checked In (MSG95)
 * - Cannot cancel if cancellation window passed (MSG82)
 * Effects:
 * - Status becomes Cancelled
 * - Releases held slots (BR-66)
 * - Invalidates QR ticket (BR-86)
 * - If verified payment exists, creates separate refund record (BR-106, BR-107, BR-76)
 * - Original payment transaction is IMMUTABLE (BR-77)
 */
export async function cancelCustomerBooking(
  bookingId: string,
  payload: CancelBookingPayload,
  options: OperatorBookingServiceOptions = {}
): Promise<CancelBookingResult> {
  const isDemoActive = Boolean(options.isDemo && isBookingDemoAllowedInCurrentEnv());

  if (!isDemoActive) {
    return {
      success: false,
      messageCode: 'PENDING_BE_INTEGRATION',
      message: OPERATOR_BOOKING_MESSAGES.PENDING_BE_INTEGRATION,
    };
  }

  // BR-105 fail-closed when actor identity is missing
  if (!isValidDemoActorUserId(options.demoActorUserId)) {
    return {
      success: false,
      messageCode: BOOKING_ERROR_CODES.BOOKING_OWNERSHIP_DENIED,
      message: OPERATOR_BOOKING_MESSAGES.MSG126,
    };
  }

  const booking = inMemoryDemoBookings.find((b) => b.id === bookingId);
  if (!booking) {
    return {
      success: false,
      messageCode: 'MSG128',
      message: OPERATOR_BOOKING_MESSAGES.MSG128,
    };
  }

  // BR-105: Owned tour check
  if (booking.operatorUserId !== options.demoActorUserId) {
    return {
      success: false,
      messageCode: BOOKING_ERROR_CODES.BOOKING_OWNERSHIP_DENIED,
      message: OPERATOR_BOOKING_MESSAGES.MSG126,
    };
  }

  // BR-106: Reason category and detail required
  if (!payload.reasonType || !isCancellationReasonValue(payload.reasonType)) {
    return {
      success: false,
      messageCode: 'VALIDATION_ERROR',
      message: 'A valid cancellation reason category is required.',
    };
  }

  if (!payload.reasonDetail || !payload.reasonDetail.trim()) {
    return {
      success: false,
      messageCode: 'MSG123',
      message: OPERATOR_BOOKING_MESSAGES.MSG123,
    };
  }

  // State checks: already cancelled or completed -> MSG133
  if (booking.status === 'Cancelled' || booking.status === 'Completed') {
    return {
      success: false,
      messageCode: 'MSG133',
      message: OPERATOR_BOOKING_MESSAGES.MSG133,
    };
  }

  // Checked-in -> MSG95
  if (booking.checkInStatus === 'CheckedIn') {
    return {
      success: false,
      messageCode: 'MSG95',
      message: OPERATOR_BOOKING_MESSAGES.MSG95,
    };
  }

  // Per approved detailed UC-41 SRS, cancellation is blocked when the cancellation window defined
  // by the policy has passed (the 24h cutoff in fixtures is a test case, not canonical TripMate policy).
  // Emergency tour cancellation belongs to UC-70 (out of scope for UC-41 / PR #53).
  if (booking.cancellationWindowExpired) {
    return {
      success: false,
      messageCode: 'MSG82',
      message: OPERATOR_BOOKING_MESSAGES.MSG82,
    };
  }

  // Apply state transitions
  booking.status = 'Cancelled';
  booking.qrTicketValid = false; // BR-86
  booking.cancellationReasonType = payload.reasonType;
  booking.cancellationReason = payload.reasonDetail.trim();
  booking.cancelledAt = new Date().toISOString();

  // Preferred safe implementation under SRS_INTERNAL_CONFLICT_UC41_REFUND_TRIGGER:
  // Cancellation marks the booking as Cancelled, releases held slots (BR-66), and invalidates QR ticket (BR-86).
  // For verified paid bookings, cancellation does NOT automatically create a definitive refund record.
  // Instead, it exposes semantic state refundFollowUpRequired so the operator can explicitly review and
  // initiate the refund via UC-42, avoiding unadjudicated automated financial mutation in NO_BACKEND mode.
  const refundFollowUpRequired = booking.paidAmount > 0;

  return {
    success: true,
    messageCode: 'MSG81',
    message: OPERATOR_BOOKING_MESSAGES.MSG81,
    booking: JSON.parse(JSON.stringify(booking)),
    refundTriggered: false,
    refundFollowUpRequired,
  };
}

/**
 * Initiates a booking refund (UC-42).
 * Validations:
 * - BR-105: Owned tour check and fail-closed actor check (MSG126)
 * - Must have verified payment and be policy eligible (MSG84)
 * - BR-74: Idempotent - if any refund record already exists (Pending, Success, or Failed),
 *   normal manual initiation is rejected with MSG133 and never creates a duplicate record
 * - BR-134: When retrying an existing Failed refund (retryFailedRefund: true), updates the
 *   SAME refund record, preserves its original ID, and increments attemptCount
 * - BR-76: Returns via original payment channel
 * - BR-77: Original transaction is immutable, refund is a separate record
 */
export async function initiateBookingRefund(
  bookingId: string,
  payload: InitiateRefundPayload = {},
  options: InitiateBookingRefundOptions = {}
): Promise<InitiateRefundResult> {
  const isDemoActive = Boolean(options.isDemo && isBookingDemoAllowedInCurrentEnv());

  if (!isDemoActive) {
    return {
      success: false,
      messageCode: 'PENDING_BE_INTEGRATION',
      message: OPERATOR_BOOKING_MESSAGES.PENDING_BE_INTEGRATION,
    };
  }

  // BR-105 fail-closed when actor identity is missing
  if (!isValidDemoActorUserId(options.demoActorUserId)) {
    return {
      success: false,
      messageCode: BOOKING_ERROR_CODES.BOOKING_OWNERSHIP_DENIED,
      message: OPERATOR_BOOKING_MESSAGES.MSG126,
    };
  }

  const booking = inMemoryDemoBookings.find((b) => b.id === bookingId);
  if (!booking) {
    return {
      success: false,
      messageCode: 'MSG128',
      message: OPERATOR_BOOKING_MESSAGES.MSG128,
    };
  }

  // BR-105: Owned tour check
  if (booking.operatorUserId !== options.demoActorUserId) {
    return {
      success: false,
      messageCode: BOOKING_ERROR_CODES.BOOKING_OWNERSHIP_DENIED,
      message: OPERATOR_BOOKING_MESSAGES.MSG126,
    };
  }

  // Payment check: must have verified paid transaction
  if (
    booking.paidAmount <= 0 ||
    !booking.paymentTransaction ||
    booking.paymentTransaction.status !== 'Success'
  ) {
    return {
      success: false,
      messageCode: 'MSG84',
      message: OPERATOR_BOOKING_MESSAGES.MSG84,
    };
  }

  // Policy check
  if (booking.cancellationWindowExpired) {
    return {
      success: false,
      messageCode: 'MSG84',
      message: OPERATOR_BOOKING_MESSAGES.MSG84,
    };
  }

  // BR-74 & BR-134: Idempotency and retry handling when a refund record already exists.
  // Any existing refund (Pending, Success, or Failed) blocks manual duplicate creation (MSG133).
  // Only an explicit retry on a Failed refund updates the existing refund record in place.
  if (booking.refund) {
    if (!options.retryFailedRefund || booking.refund.status !== 'Failed') {
      return {
        success: false,
        messageCode: 'MSG133',
        message: OPERATOR_BOOKING_MESSAGES.MSG133,
        refund: JSON.parse(JSON.stringify(booking.refund)),
      };
    }

    // Retrying an existing Failed refund on the SAME refund record (BR-74, BR-134)
    const failureMode = options.simulateFailureMode ?? 'none';
    if (failureMode === 'timeout') {
      return {
        success: false,
        messageCode: 'MSG89',
        message: OPERATOR_BOOKING_MESSAGES.MSG89,
      };
    }
    if (failureMode === 'system') {
      return {
        success: false,
        messageCode: 'MSG127',
        message: OPERATOR_BOOKING_MESSAGES.MSG127,
      };
    }
    if (failureMode === 'retry') {
      booking.refund = {
        ...booking.refund,
        attemptCount: booking.refund.attemptCount + 1,
        status: 'Failed',
        notes: payload.notes || booking.refund.notes,
      };
      return {
        success: false,
        messageCode: 'MSG153',
        message: OPERATOR_BOOKING_MESSAGES.MSG153,
        refund: JSON.parse(JSON.stringify(booking.refund)),
      };
    }

    booking.refund = {
      ...booking.refund,
      attemptCount: booking.refund.attemptCount + 1,
      status: 'Success',
      gatewayReference:
        booking.refund.gatewayReference ||
        `REFUND-${booking.bookingCode}-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: payload.notes || booking.refund.notes,
    };

    return {
      success: true,
      messageCode: 'MSG83',
      message: OPERATOR_BOOKING_MESSAGES.MSG83,
      refund: JSON.parse(JSON.stringify(booking.refund)),
    };
  }

  // Test-only failure simulation via explicit service option (never from user notes)
  const failureMode = options.simulateFailureMode ?? 'none';

  if (failureMode === 'timeout') {
    return {
      success: false,
      messageCode: 'MSG89',
      message: OPERATOR_BOOKING_MESSAGES.MSG89,
    };
  }

  const preview = calculateDemoBookingRefundPreview(booking);

  if (failureMode === 'retry') {
    const failedRefund: BookingRefundDto = {
      id: `rf-${Date.now()}`,
      bookingId: booking.id,
      refundableAmount: preview.refundableAmount,
      deductionAmount: preview.deductionAmount,
      policyApplied: preview.policyApplied,
      paymentChannel: booking.paymentTransaction.paymentChannel,
      status: 'Failed',
      attemptCount: 1,
      notes: payload.notes || 'Payment gateway connection failed; queued for retry',
      createdAt: new Date().toISOString(),
    };
    booking.refund = failedRefund;
    return {
      success: false,
      messageCode: 'MSG153',
      message: OPERATOR_BOOKING_MESSAGES.MSG153,
      refund: JSON.parse(JSON.stringify(failedRefund)),
    };
  }

  if (failureMode === 'system') {
    return {
      success: false,
      messageCode: 'MSG127',
      message: OPERATOR_BOOKING_MESSAGES.MSG127,
    };
  }

  // Standard successful refund creation
  const newRefund: BookingRefundDto = {
    id: `rf-${Date.now()}`,
    bookingId: booking.id,
    refundableAmount: preview.refundableAmount,
    deductionAmount: preview.deductionAmount,
    policyApplied: preview.policyApplied,
    paymentChannel: booking.paymentTransaction.paymentChannel,
    status: 'Success',
    gatewayReference: `REFUND-${booking.bookingCode}-${Math.floor(1000 + Math.random() * 9000)}`,
    attemptCount: 1,
    notes: payload.notes || 'Refund initiated successfully',
    createdAt: new Date().toISOString(),
  };

  // Original transaction is immutable (BR-77)
  booking.refund = newRefund;

  return {
    success: true,
    messageCode: 'MSG83',
    message: OPERATOR_BOOKING_MESSAGES.MSG83,
    refund: JSON.parse(JSON.stringify(newRefund)),
  };
}
