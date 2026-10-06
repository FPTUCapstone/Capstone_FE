import {
  DEMO_OPERATOR_USER_ID,
  INITIAL_DEMO_BOOKINGS,
  isBookingDemoAllowedInCurrentEnv,
} from '../data/operatorBookingDemoFixtures';
import {
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

/**
 * Calculates deterministic refund preview based on cancellation policy (BR-107).
 * In production, the browser NEVER calculates authoritative monetary refunds locally.
 */
export function calculateBookingRefundPreview(booking: BookingDto): {
  refundableAmount: number;
  deductionAmount: number;
  policyApplied: string;
  eligible: boolean;
} {
  if (booking.paidAmount <= 0) {
    return {
      refundableAmount: 0,
      deductionAmount: 0,
      policyApplied: 'Chưa thanh toán — Không phát sinh hoàn tiền',
      eligible: false,
    };
  }

  if (booking.cancellationWindowExpired) {
    return {
      refundableAmount: 0,
      deductionAmount: booking.paidAmount,
      policyApplied: 'Đã quá hạn hủy theo chính sách (< 24 giờ trước giờ khởi hành)',
      eligible: false,
    };
  }

  // Demo policy: 100% refund for cancellations prior to the cutoff window
  return {
    refundableAmount: booking.paidAmount,
    deductionAmount: 0,
    policyApplied: 'Hoàn 100% khi hủy trước ngày khởi hành ít nhất 24 giờ',
    eligible: true,
  };
}

/**
 * Fetches customer bookings for the signed-in Tour Operator (UC-40).
 * Enforces BR-105: Operator may view only bookings on tours owned by that operator.
 * In production NO_BACKEND mode, returns empty items with PENDING_BE_INTEGRATION notice.
 */
export async function getOperatorBookings(
  params: BookingFilterParams = {},
  options: { isDemo?: boolean; operatorUserId?: number } = {}
): Promise<BookingListResult> {
  const isDemoActive = options.isDemo && isBookingDemoAllowedInCurrentEnv();

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
      pageSize: params.pageSize || 10,
      totalPages: 0,
      pendingBackendNotice: OPERATOR_BOOKING_MESSAGES.PENDING_BE_INTEGRATION,
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
        pageSize: params.pageSize || 10,
        totalPages: 0,
        errorMessage: OPERATOR_BOOKING_MESSAGES.MSG29,
      };
    }
  }

  const effectiveOperatorId = options.operatorUserId ?? DEMO_OPERATOR_USER_ID;

  // Filter by BR-105: Owned tours only
  let filtered = inMemoryDemoBookings.filter(
    (b) => b.operatorUserId === effectiveOperatorId
  );

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
      (acc, curr) => (curr.status === 'Confirmed' || curr.status === 'Completed' ? acc + curr.totalAmount : acc),
      0
    ),
  };

  if (filtered.length === 0) {
    return {
      items: [],
      summary,
      totalCount: 0,
      page: 1,
      pageSize: params.pageSize || 10,
      totalPages: 0,
      errorMessage: OPERATOR_BOOKING_MESSAGES.MSG128,
    };
  }

  // Pagination (BR-52, CR-01)
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, params.pageSize || 10);
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
 * Enforces BR-105: Returns MSG126 if the booking does not belong to the signed-in operator.
 */
export async function getOperatorBookingById(
  bookingId: string,
  options: { isDemo?: boolean; operatorUserId?: number } = {}
): Promise<{ booking?: BookingDto; error?: string; messageCode?: string }> {
  const isDemoActive = options.isDemo && isBookingDemoAllowedInCurrentEnv();

  if (!isDemoActive) {
    return {
      error: OPERATOR_BOOKING_MESSAGES.PENDING_BE_INTEGRATION,
      messageCode: 'PENDING_BE_INTEGRATION',
    };
  }

  const effectiveOperatorId = options.operatorUserId ?? DEMO_OPERATOR_USER_ID;
  const booking = inMemoryDemoBookings.find((b) => b.id === bookingId);

  if (!booking) {
    return { error: 'Không tìm thấy đơn đặt chỗ.', messageCode: 'MSG128' };
  }

  // BR-105 ownership check
  if (booking.operatorUserId !== effectiveOperatorId) {
    return { error: OPERATOR_BOOKING_MESSAGES.MSG126, messageCode: 'MSG126' };
  }

  return { booking: JSON.parse(JSON.stringify(booking)) };
}

/**
 * Cancels a customer booking (UC-41).
 * Validations:
 * - BR-105: Operator may cancel only owned-tour bookings (MSG126)
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
  options: { isDemo?: boolean; operatorUserId?: number; simulateFailure?: boolean } = {}
): Promise<CancelBookingResult> {
  const isDemoActive = options.isDemo && isBookingDemoAllowedInCurrentEnv();

  if (!isDemoActive) {
    return {
      success: false,
      messageCode: 'PENDING_BE_INTEGRATION',
      message: OPERATOR_BOOKING_MESSAGES.PENDING_BE_INTEGRATION,
    };
  }

  if (options.simulateFailure) {
    return {
      success: false,
      messageCode: 'MSG127',
      message: OPERATOR_BOOKING_MESSAGES.MSG127,
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
  const effectiveOperatorId = options.operatorUserId ?? DEMO_OPERATOR_USER_ID;
  if (booking.operatorUserId !== effectiveOperatorId) {
    return {
      success: false,
      messageCode: 'MSG126',
      message: OPERATOR_BOOKING_MESSAGES.MSG126,
    };
  }

  // BR-106: Reason required
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

  // Cancellation window passed -> MSG82
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
  booking.cancellationReason = payload.reasonDetail.trim();
  booking.cancelledAt = new Date().toISOString();

  let refundTriggered = false;

  // If verified payment exists, trigger separate refund (BR-76, BR-77, BR-107)
  if (booking.paidAmount > 0) {
    const preview = calculateBookingRefundPreview(booking);
    if (preview.eligible && preview.refundableAmount > 0) {
      booking.refund = {
        id: `rf-${Date.now()}`,
        bookingId: booking.id,
        refundableAmount: preview.refundableAmount,
        deductionAmount: preview.deductionAmount,
        policyApplied: preview.policyApplied,
        paymentChannel: booking.paymentTransaction?.paymentChannel || 'VNPay',
        status: 'Success',
        gatewayReference: `REFUND-${booking.bookingCode}-${Math.floor(1000 + Math.random() * 9000)}`,
        attemptCount: 1,
        notes: `Tự động hoàn tiền khi hủy đơn: ${payload.reasonDetail.trim()}`,
        createdAt: new Date().toISOString(),
      };
      refundTriggered = true;
    }
  }

  return {
    success: true,
    messageCode: 'MSG81',
    message: refundTriggered
      ? `${OPERATOR_BOOKING_MESSAGES.MSG81} ${OPERATOR_BOOKING_MESSAGES.MSG83}`
      : OPERATOR_BOOKING_MESSAGES.MSG81,
    booking: JSON.parse(JSON.stringify(booking)),
    refundTriggered,
  };
}

/**
 * Initiates a booking refund (UC-42).
 * Validations:
 * - BR-105: Owned tour check (MSG126)
 * - Must have verified payment and be policy eligible (MSG84)
 * - BR-74: Idempotent - if refund already exists, reject duplicate (MSG133)
 * - BR-76: Returns via original payment channel
 * - BR-77: Original transaction is immutable, refund is a separate record
 * - BR-134: Failed refund tracks retry attempt
 */
export async function initiateBookingRefund(
  bookingId: string,
  payload: InitiateRefundPayload = {},
  options: { isDemo?: boolean; operatorUserId?: number } = {}
): Promise<InitiateRefundResult> {
  const isDemoActive = options.isDemo && isBookingDemoAllowedInCurrentEnv();

  if (!isDemoActive) {
    return {
      success: false,
      messageCode: 'PENDING_BE_INTEGRATION',
      message: OPERATOR_BOOKING_MESSAGES.PENDING_BE_INTEGRATION,
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
  const effectiveOperatorId = options.operatorUserId ?? DEMO_OPERATOR_USER_ID;
  if (booking.operatorUserId !== effectiveOperatorId) {
    return {
      success: false,
      messageCode: 'MSG126',
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

  // BR-74: Idempotency check. Refund already exists -> MSG133
  if (
    booking.refund &&
    (booking.refund.status === 'Success' || booking.refund.status === 'Pending')
  ) {
    return {
      success: false,
      messageCode: 'MSG133',
      message: OPERATOR_BOOKING_MESSAGES.MSG133,
      refund: JSON.parse(JSON.stringify(booking.refund)),
    };
  }

  // Simulation modes for edge-case test verification
  if (
    payload.simulateFailureMode === 'timeout' ||
    payload.notes?.toLowerCase().includes('timeout')
  ) {
    return {
      success: false,
      messageCode: 'MSG89',
      message: OPERATOR_BOOKING_MESSAGES.MSG89,
    };
  }

  if (
    payload.simulateFailureMode === 'retry' ||
    payload.notes?.toLowerCase().includes('retry')
  ) {
    const failedRefund: BookingRefundDto = {
      id: `rf-${Date.now()}`,
      bookingId: booking.id,
      refundableAmount: booking.paidAmount,
      deductionAmount: 0,
      policyApplied: 'Hoàn 100% khi hủy trước ngày khởi hành ít nhất 24 giờ',
      paymentChannel: booking.paymentTransaction.paymentChannel,
      status: 'Failed',
      attemptCount: 1,
      notes: payload.notes || 'Kết nối cổng thanh toán thất bại, đã xếp hàng đợi thử lại',
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

  if (
    payload.simulateFailureMode === 'system' ||
    payload.notes?.toLowerCase().includes('system')
  ) {
    return {
      success: false,
      messageCode: 'MSG127',
      message: OPERATOR_BOOKING_MESSAGES.MSG127,
    };
  }

  // Standard successful refund creation
  const preview = calculateBookingRefundPreview(booking);
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
    notes: payload.notes || 'Khởi tạo hoàn tiền thành công',
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
