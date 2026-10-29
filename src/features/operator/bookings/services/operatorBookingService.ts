import {
  DEMO_OPERATOR_TOURS,
  INITIAL_DEMO_BOOKINGS,
  isBookingDemoAllowedInCurrentEnv,
  toDemoDetailView,
  toDemoListItem,
  type DemoBookingRecord,
} from '../data/operatorBookingDemoFixtures';
import {
  calculateDemoBookingRefundPreview,
  evaluateDemoCancelEligibility,
} from '../data/operatorBookingDemoPolicy';
import {
  BOOKING_ERROR_CODES,
  isCancellationReasonValue,
  OPERATOR_BOOKING_DEFAULT_PAGE_SIZE,
  OPERATOR_BOOKING_MESSAGES,
  type BookingDetailView,
  type BookingFilterParams,
  type BookingListErrorCode,
  type BookingListResult,
  type BookingTourOptionsResult,
  type BookingRefundDto,
  type BookingRefundStatusDto,
  type BookingSummaryMetrics,
  type CancelBookingPayload,
  type CancelBookingResult,
  type GetBookingRefundStatusResult,
  type InitiateRefundPayload,
  type InitiateRefundResult,
  REFUND_STATUS_VALUES,
} from '../types/bookingLifecycle';
import { toVietnamIsoDate } from '../utils/dateFormat';
import {
  fetchLiveBookingDetail,
  fetchLiveBookingList,
  fetchLiveTourOptions,
  isLiveBookingId,
} from './operatorBookingLiveClient';

// In-memory state for Demo mode UI review
let inMemoryDemoBookings: DemoBookingRecord[] = JSON.parse(JSON.stringify(INITIAL_DEMO_BOOKINGS));

export function resetDemoBookingsState(): void {
  inMemoryDemoBookings = JSON.parse(JSON.stringify(INITIAL_DEMO_BOOKINGS));
}

function isValidDemoActorUserId(userId: number | undefined): userId is number {
  return typeof userId === 'number' && Number.isFinite(userId) && userId > 0;
}

function emptyListResult(pageSize: number, errorCode?: BookingListErrorCode): BookingListResult {
  const summary: BookingSummaryMetrics = {
    totalBookings: 0,
    totalParticipants: 0,
    totalConfirmedAmount: 0,
  };
  return {
    items: [],
    summary,
    totalCount: 0,
    page: 1,
    pageSize,
    totalPages: 0,
    ...(errorCode ? { errorCode, errorMessage: OPERATOR_BOOKING_MESSAGES[errorCode] } : {}),
  };
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
 * Live mode calls the BFF (BR-105 is enforced by the BE); demo mode serves fixtures only when the
 * environment allows it and fails closed (MSG126) without a valid actor identity.
 */
export async function getOperatorBookings(
  params: BookingFilterParams = {},
  options: OperatorBookingServiceOptions = {}
): Promise<BookingListResult> {
  const isDemoActive = Boolean(options.isDemo && isBookingDemoAllowedInCurrentEnv());
  const defaultPageSize = Math.max(1, params.pageSize || OPERATOR_BOOKING_DEFAULT_PAGE_SIZE);

  if (!isDemoActive) {
    return getLiveBookings(params, defaultPageSize);
  }

  // BR-105 fail-closed when actor identity is missing in Demo mode
  if (!isValidDemoActorUserId(options.demoActorUserId)) {
    return emptyListResult(defaultPageSize, 'MSG126');
  }

  // Date range validation (MSG31)
  if (params.startDate && params.endDate && params.startDate.slice(0, 10) > params.endDate.slice(0, 10)) {
    return emptyListResult(defaultPageSize, 'MSG31');
  }

  const actorUserId = options.demoActorUserId;

  // Filter by BR-105: Owned tours only
  let filtered = inMemoryDemoBookings.filter((b) => b.operatorUserId === actorUserId);

  // Filter by Tour Package
  if (params.tourId && params.tourId !== 'ALL') {
    filtered = filtered.filter((b) => b.tour.tourId === params.tourId);
  }

  // Filter by Booking Status
  if (params.status && params.status !== 'ALL') {
    filtered = filtered.filter((b) => b.status === params.status);
  }

  // Filter by Departure Date Range (Vietnam-time calendar days, both bounds inclusive)
  if (params.startDate) {
    const filterStartDay = params.startDate.slice(0, 10);
    filtered = filtered.filter((b) => (toVietnamIsoDate(b.schedule.startAtUtc) ?? '') >= filterStartDay);
  }
  if (params.endDate) {
    const filterEndDay = params.endDate.slice(0, 10);
    filtered = filtered.filter((b) => (toVietnamIsoDate(b.schedule.startAtUtc) ?? '') <= filterEndDay);
  }

  // Search by Booking Code, booker name or booker e-mail (same fields as the BE keyword)
  if (params.searchKeyword && params.searchKeyword.trim()) {
    const kw = params.searchKeyword.trim().toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.bookingCode.toLowerCase().includes(kw) ||
        b.booker.fullName.toLowerCase().includes(kw) ||
        (b.booker.email ?? '').toLowerCase().includes(kw)
    );
  }

  // Summary Metrics over the applied filters. Same basis as the BE: participants and amount count
  // only Confirmed + Completed bookings; the booking count covers every status.
  const travelling = filtered.filter((b) => b.status === 'Confirmed' || b.status === 'Completed');
  const summary: BookingSummaryMetrics = {
    totalBookings: filtered.length,
    totalParticipants: travelling.reduce((acc, curr) => acc + curr.quantity, 0),
    totalConfirmedAmount: travelling.reduce((acc, curr) => acc + curr.totalAmount, 0),
  };

  if (filtered.length === 0) {
    return { ...emptyListResult(defaultPageSize, 'MSG128'), summary };
  }

  // Pagination (BR-52, CR-01: default 20 items per page)
  const page = Math.max(1, params.page || 1);
  const pageSize = defaultPageSize;
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIdx = (page - 1) * pageSize;
  const paginatedItems = filtered.slice(startIdx, startIdx + pageSize);

  return {
    items: paginatedItems.map(toDemoListItem),
    summary,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

async function getLiveBookings(
  params: BookingFilterParams,
  defaultPageSize: number
): Promise<BookingListResult> {
  // MSG31: block an inverted departure range before calling the BFF.
  if (params.startDate && params.endDate && params.startDate.slice(0, 10) > params.endDate.slice(0, 10)) {
    return emptyListResult(defaultPageSize, 'MSG31');
  }

  const response = await fetchLiveBookingList(params);
  if (!response.ok) {
    return emptyListResult(defaultPageSize, response.code);
  }

  // The BE summary, paging and items are shown as returned; an empty page is MSG128.
  if (response.result.items.length === 0) {
    return { ...response.result, errorCode: 'MSG128', errorMessage: OPERATOR_BOOKING_MESSAGES.MSG128 };
  }
  return response.result;
}

/**
 * Owned tours for the tour filter. Live mode reads the existing revenue BFF route; a failure never
 * blocks the list, it only disables the filter (`failed: true`).
 */
export async function getOperatorBookingTourOptions(
  options: OperatorBookingServiceOptions = {}
): Promise<BookingTourOptionsResult> {
  const isDemoActive = Boolean(options.isDemo && isBookingDemoAllowedInCurrentEnv());
  if (!isDemoActive) {
    return fetchLiveTourOptions();
  }
  return { options: DEMO_OPERATOR_TOURS.map((tour) => ({ id: tour.id, title: tour.title })), failed: false };
}

/**
 * Gets a single booking by ID (detail surface / drawer).
 * Enforces BR-105: Returns MSG126 if actor identity is missing or if the booking
 * does not belong to the signed-in operator.
 */
export async function getOperatorBookingById(
  bookingId: string,
  options: OperatorBookingServiceOptions = {}
): Promise<{ booking?: BookingDetailView; error?: string; messageCode?: string }> {
  const isDemoActive = Boolean(options.isDemo && isBookingDemoAllowedInCurrentEnv());

  if (!isDemoActive) {
    // A live booking id is always a digit string; anything else is not reachable by this operator.
    if (!isLiveBookingId(bookingId)) {
      return { error: OPERATOR_BOOKING_MESSAGES.MSG126, messageCode: 'MSG126' };
    }
    const response = await fetchLiveBookingDetail(bookingId);
    if (!response.ok) {
      return { error: OPERATOR_BOOKING_MESSAGES[response.code], messageCode: response.code };
    }
    return { booking: response.booking };
  }

  // BR-105 fail-closed when actor identity is missing
  if (!isValidDemoActorUserId(options.demoActorUserId)) {
    return {
      error: OPERATOR_BOOKING_MESSAGES.MSG126,
      messageCode: BOOKING_ERROR_CODES.BOOKING_OWNERSHIP_DENIED,
    };
  }

  const booking = inMemoryDemoBookings.find((b) => b.bookingId === bookingId);

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

  return { booking: toDemoDetailView(booking) };
}

/**
 * Cancels a customer booking (UC-41).
 * Validations:
 * - BR-105: Operator may cancel only owned-tour bookings; fails closed if actor identity is missing (MSG126)
 * - BR-106: Cancellation reason must be provided (MSG123)
 * - Cannot cancel a booking that is already Cancelled, Completed or Expired (MSG133)
 * - Cannot cancel if already Checked In (MSG95)
 * UC-41 as built applies no time window to a Tour Operator, so there is no deadline check.
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

  const booking = inMemoryDemoBookings.find((b) => b.bookingId === bookingId);
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

  // State checks mirror the BE rule: a terminal status blocks first (MSG133), then a check-in (MSG95).
  const eligibility = evaluateDemoCancelEligibility(booking.status, booking.checkInStatus);
  if (!eligibility.canCancel) {
    return eligibility.cancelBlockedReason === 'CheckedIn'
      ? { success: false, messageCode: 'MSG95', message: OPERATOR_BOOKING_MESSAGES.MSG95 }
      : { success: false, messageCode: 'MSG133', message: OPERATOR_BOOKING_MESSAGES.MSG133 };
  }

  // Apply state transitions
  booking.status = 'Cancelled';
  if (booking.ticket) {
    booking.ticket.status = 'Cancelled'; // BR-86
  }
  booking.cancellationReasonType = payload.reasonType;
  booking.cancelReason = payload.reasonDetail.trim();
  booking.cancelledAtUtc = new Date().toISOString();

  // Preferred safe implementation under SRS_INTERNAL_CONFLICT_UC41_REFUND_TRIGGER:
  // Cancellation marks the booking as Cancelled, releases held slots (BR-66), and invalidates QR ticket (BR-86).
  // For verified paid bookings, cancellation does NOT automatically create a definitive refund record.
  // Instead, it exposes semantic state refundFollowUpRequired so the operator can explicitly review and
  // initiate the refund via UC-42, avoiding unadjudicated automated financial mutation in NO_BACKEND mode.
  const view = toDemoDetailView(booking);
  const refundFollowUpRequired = view.paidAmount > 0;

  return {
    success: true,
    messageCode: 'MSG81',
    message: OPERATOR_BOOKING_MESSAGES.MSG81,
    booking: view,
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

  const booking = inMemoryDemoBookings.find((b) => b.bookingId === bookingId);
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
  const paidAmount = booking.payment?.status === 'Success' ? booking.payment.amount : 0;
  if (paidAmount <= 0 || !booking.payment) {
    return {
      success: false,
      messageCode: 'MSG84',
      message: OPERATOR_BOOKING_MESSAGES.MSG84,
    };
  }
  const paymentGateway = booking.payment.gateway;

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

  const preview = calculateDemoBookingRefundPreview({ paidAmount });

  if (failureMode === 'retry') {
    const failedRefund: BookingRefundDto = {
      id: `rf-${Date.now()}`,
      bookingId: booking.bookingId,
      refundableAmount: preview.refundableAmount,
      deductionAmount: preview.deductionAmount,
      policyApplied: preview.policyApplied,
      paymentChannel: paymentGateway,
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
    bookingId: booking.bookingId,
    refundableAmount: preview.refundableAmount,
    deductionAmount: preview.deductionAmount,
    policyApplied: preview.policyApplied,
    paymentChannel: paymentGateway,
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

function isIsoDateString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));
}

function isNullableIsoDateString(value: unknown): value is string | null {
  return value === null || value === undefined || isIsoDateString(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || value === undefined || typeof value === 'string';
}

/**
 * Validates a 200 OK body before trusting it as a real refund status. A malformed
 * or unexpected payload (wrong status enum, non-numeric amount, missing field) is
 * never cast through — it is reported as an error instead of rendered as data.
 */
function parseBookingRefundStatusDto(raw: unknown): BookingRefundStatusDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  if (r.bookingId === undefined || r.bookingId === null) return null;
  if (typeof r.bookingCode !== 'string' || r.bookingCode.length === 0) return null;
  if (typeof r.refundAmount !== 'number' || !Number.isFinite(r.refundAmount)) return null;
  if (typeof r.status !== 'string' || !(REFUND_STATUS_VALUES as readonly string[]).includes(r.status)) return null;
  if (typeof r.attemptCount !== 'number' || !Number.isFinite(r.attemptCount)) return null;
  if (!isIsoDateString(r.requestedAtUtc)) return null;
  if (!isNullableIsoDateString(r.processedAtUtc)) return null;
  if (!isNullableIsoDateString(r.nextAttemptAtUtc)) return null;
  if (!isNullableString(r.gatewayReference)) return null;
  if (!isNullableString(r.lastErrorCode)) return null;

  return {
    bookingId: String(r.bookingId),
    bookingCode: r.bookingCode,
    refundAmount: r.refundAmount,
    status: r.status as BookingRefundStatusDto['status'],
    gatewayReference: (r.gatewayReference as string | null) ?? null,
    attemptCount: r.attemptCount,
    requestedAtUtc: r.requestedAtUtc,
    processedAtUtc: (r.processedAtUtc as string | null) ?? null,
    nextAttemptAtUtc: (r.nextAttemptAtUtc as string | null) ?? null,
    lastErrorCode: (r.lastErrorCode as string | null) ?? null,
  };
}

/**
 * Fetches the real, automatically-processed refund status for a booking (UC-42 /
 * UC-71 "Process Automatic Refund"). Always calls the real Backend via the
 * authenticated BFF route — never demo-gated, unlike the rest of this module,
 * because this call has nothing to do with the UC-40 list/demo problem.
 *
 * A 404 means no refund record exists for this booking (e.g. a PendingPayment
 * cancellation with 0% refund) and is reported as 'not_applicable', not an error.
 */
export async function getBookingRefundStatus(bookingId: string): Promise<GetBookingRefundStatusResult> {
  let response: Response;
  try {
    response = await fetch(`/api/v1/bookings/${bookingId}/refund`, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    return { outcome: 'error', messageCode: 'MSG127' };
  }

  if (response.status === 404) {
    return { outcome: 'not_applicable' };
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const code =
      body && typeof body === 'object' && 'errorCode' in body && typeof (body as Record<string, unknown>).errorCode === 'string'
        ? ((body as Record<string, unknown>).errorCode as string)
        : 'MSG127';
    return { outcome: 'error', messageCode: code };
  }

  const data = parseBookingRefundStatusDto(body);
  if (!data) {
    return { outcome: 'error', messageCode: 'MSG127' };
  }

  return { outcome: 'found', data };
}
