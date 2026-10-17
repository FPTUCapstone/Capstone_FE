import {
  createDemoBooking,
  createDemoQuote,
  DEMO_BOOKING_HOI_AN,
  DEMO_TICKET_HOI_AN,
} from '../data/bookingDemoFixtures';
import type {
  BookingDto,
  BookingQuoteDto,
  BookingQuoteRequestDto,
  CreateBookingRequestDto,
  PaymentInitResponseDto,
  PaymentMethod,
  PaymentVerifyResultDto,
} from '../types/booking';
import { BookingApiError } from '../types/booking';
import type { TicketDto } from '../types/ticket';

/**
 * Production gate for booking demo fixtures.
 * Strictly requires non-production environment AND explicit NEXT_PUBLIC_ENABLE_DEMO_FIXTURES === 'true'.
 * Production environment ALWAYS wins (returns false).
 */
export function isBookingDemoAllowedInCurrentEnv(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES === 'true'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readResponse(response: Response): Promise<unknown> {
  const type = response.headers.get('content-type') ?? '';
  return type.includes('application/json') || type.includes('problem+json')
    ? response.json()
    : null;
}

async function requestJson(path: string, options?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new BookingApiError('Không thể kết nối máy chủ dịch vụ đặt tour.', 0);
  }

  const body = await readResponse(response);
  if (!response.ok) {
    const problem = isRecord(body) ? body : undefined;
    const title = BOOKING_ERROR_MESSAGES[String(problem?.errorCode ?? '')] ?? 'Thao tác không thành công.';
    throw new BookingApiError(title, response.status, problem);
  }
  return body;
}

/** Safe, user-facing messages for every UC-27 errorCode the BFF proxy can forward (tourBookingProxy.ts SAFE_CODES). */
const BOOKING_ERROR_MESSAGES: Record<string, string> = {
  'tour_booking.schedule_not_found': 'Lịch khởi hành đã chọn không còn khả dụng.',
  'tour_booking.schedule_not_open': 'Lịch khởi hành này đã đóng nhận đặt tour.',
  'tour_booking.insufficient_capacity': 'Không còn đủ chỗ trống cho số lượng khách đã chọn.',
  'tour_booking.voucher_not_found': 'Mã giảm giá không tồn tại.',
  'tour_booking.voucher_not_eligible': 'Mã giảm giá không áp dụng cho tour này hoặc đã hết hiệu lực.',
  'tour_booking.voucher_minimum_not_met': 'Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã giảm giá.',
  'tour_booking.voucher_usage_limit_reached': 'Mã giảm giá đã hết lượt sử dụng.',
  'tour_booking.participants_required': 'Cần ít nhất 1 khách tham gia.',
  'tour_booking.idempotency_key_required': 'Yêu cầu không hợp lệ, vui lòng tải lại trang và thử lại.',
  'tour_booking.idempotency_key_payload_mismatch': 'Yêu cầu đặt tour trước đó chưa hoàn tất, vui lòng thử lại.',
  'tour_booking.too_many_unpaid_bookings':
    'Bạn có quá nhiều đơn đặt tour đang chờ thanh toán. Vui lòng hoàn tất hoặc hủy một đơn trước khi tiếp tục.',
  'tour_booking.invalid_request': 'Thông tin đặt tour không hợp lệ.',
  UNAUTHENTICATED: 'Vui lòng đăng nhập lại để tiếp tục.',
  FORBIDDEN: 'Tính năng này chỉ dành cho tài khoản Du khách (Traveler).',
  MSG127: 'Dịch vụ tạm thời không khả dụng, vui lòng thử lại sau.',
};

/**
 * UC-27: Get price quote for a departure/participant/voucher combination.
 * Read-only — creates no booking and reserves no capacity (BE spec §3.1). Client never computes amounts itself.
 */
export async function quoteBooking(
  request: BookingQuoteRequestDto,
  tourId: string,
  options?: { allowDemo?: boolean; signal?: AbortSignal },
): Promise<BookingQuoteDto> {
  if (options?.allowDemo === true && isBookingDemoAllowedInCurrentEnv()) {
    return createDemoQuote(tourId, request.tourScheduleId, request.participantCounts, request.voucherCode);
  }

  const raw = await requestJson('/api/v1/traveler/tour-bookings/quote', {
    method: 'POST',
    body: JSON.stringify(request),
    signal: options?.signal,
  });
  if (!isRecord(raw) || typeof raw.totalAmount !== 'number') {
    throw new BookingApiError('Không nhận được báo giá hợp lệ từ máy chủ.', 502);
  }
  return raw as unknown as BookingQuoteDto;
}

/**
 * UC-27: Book Tour.
 * Creates a tour booking with status 'PendingPayment'. Sends a fresh Idempotency-Key per
 * logical submit attempt; the caller must reuse the same key only when retrying the exact
 * same request (e.g. after a network timeout), never when the user edits the form.
 */
export async function createBooking(
  request: CreateBookingRequestDto,
  options?: {
    allowDemo?: boolean;
    idempotencyKey?: string;
    signal?: AbortSignal;
  },
): Promise<BookingDto> {
  if (options?.allowDemo === true && isBookingDemoAllowedInCurrentEnv()) {
    const counts = request.participants.reduce(
      (acc, participant) => {
        if (participant.participantType === 'Adult') acc.adult += 1;
        else if (participant.participantType === 'Child') acc.child += 1;
        else acc.infant += 1;
        return acc;
      },
      { adult: 0, child: 0, infant: 0 },
    );
    const quote = createDemoQuote('demo-tour', request.tourScheduleId, counts, request.voucherCode);
    return createDemoBooking({
      tourScheduleId: request.tourScheduleId,
      subtotalAmount: quote.subtotalAmount,
      discountAmount: quote.discountAmount,
      totalAmount: quote.totalAmount,
    });
  }

  const idempotencyKey = options?.idempotencyKey ?? crypto.randomUUID();
  const raw = await requestJson('/api/v1/traveler/tour-bookings', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(request),
    signal: options?.signal,
  });
  if (!isRecord(raw) || typeof raw.bookingId !== 'string') {
    throw new BookingApiError('Không nhận được xác nhận đặt tour hợp lệ từ máy chủ.', 502);
  }
  return raw as unknown as BookingDto;
}

/**
 * UC-27/UC-28: Get Booking Details.
 * Not yet wired to a Backend endpoint; UC-28 owns the booking-detail contract this will call.
 */
export async function getBooking(
  bookingId: string,
  options?: {
    allowDemo?: boolean;
    signal?: AbortSignal;
  },
): Promise<BookingDto> {
  const demoAllowed = options?.allowDemo === true && isBookingDemoAllowedInCurrentEnv();

  if (demoAllowed) {
    return {
      ...DEMO_BOOKING_HOI_AN,
      bookingId: bookingId || DEMO_BOOKING_HOI_AN.bookingId,
    };
  }

  try {
    const raw = await requestJson(`/api/bookings/${encodeURIComponent(bookingId)}`, {
      signal: options?.signal,
    });
    if (isRecord(raw) && typeof raw.bookingId === 'string') {
      return raw as unknown as BookingDto;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new BookingApiError(
      'Thông tin đơn đặt tour đang chờ hoàn tất kết nối API từ máy chủ (UC-28 — PENDING_BE_INTEGRATION).',
      501,
      { errorCode: 'PENDING_BE_INTEGRATION' },
    );
  }

  throw new BookingApiError(
    'Thông tin đơn đặt tour đang chờ hoàn tất kết nối API từ máy chủ (UC-28 — PENDING_BE_INTEGRATION).',
    501,
    { errorCode: 'PENDING_BE_INTEGRATION' },
  );
}

/**
 * UC-28: Initiate Electronic Payment. Out of scope for UC-27; kept pending its own integration task.
 */
export async function initiatePayment(
  bookingId: string,
  paymentMethod: PaymentMethod,
  options?: {
    allowDemo?: boolean;
    signal?: AbortSignal;
  },
): Promise<PaymentInitResponseDto> {
  const demoAllowed = options?.allowDemo === true && isBookingDemoAllowedInCurrentEnv();

  if (demoAllowed) {
    return {
      paymentUrl: `/checkout/result?vnp_ResponseCode=00&vnp_TxnRef=VNPTXN-884920&bookingId=${encodeURIComponent(bookingId)}&method=${paymentMethod}&demo=1`,
      transactionRef: 'VNPTXN-884920',
      expiresAtUtc: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  try {
    const raw = await requestJson(`/api/bookings/${encodeURIComponent(bookingId)}/payment`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod }),
      signal: options?.signal,
    });
    if (isRecord(raw) && typeof raw.paymentUrl === 'string') {
      return raw as unknown as PaymentInitResponseDto;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new BookingApiError(
      'Cổng thanh toán điện tử đang chờ hoàn tất kết nối API từ máy chủ (UC-28 — PENDING_BE_INTEGRATION).',
      501,
      { errorCode: 'PENDING_BE_INTEGRATION' },
    );
  }

  throw new BookingApiError(
    'Cổng thanh toán điện tử đang chờ hoàn tất kết nối API từ máy chủ (UC-28 — PENDING_BE_INTEGRATION).',
    501,
    { errorCode: 'PENDING_BE_INTEGRATION' },
  );
}

/**
 * UC-28: Verify Payment Result. Out of scope for UC-27; kept pending its own integration task.
 */
export async function verifyPayment(
  searchParams: URLSearchParams,
  options?: {
    allowDemo?: boolean;
    signal?: AbortSignal;
  },
): Promise<PaymentVerifyResultDto> {
  const demoAllowed = options?.allowDemo === true && isBookingDemoAllowedInCurrentEnv();

  if (demoAllowed) {
    const responseCode = searchParams.get('vnp_ResponseCode') ?? searchParams.get('code') ?? '00';
    const isSuccess = responseCode === '00';
    const bookingId = searchParams.get('bookingId') || 'bk-demo-0148';
    const transactionRef = searchParams.get('vnp_TxnRef') || 'VNPTXN-884920';

    if (isSuccess) {
      return {
        isSuccess: true,
        bookingId,
        bookingCode: 'BK-20261015-0148',
        transactionRef,
        amount: 1700000,
        paymentMethod: searchParams.get('method') === 'VNPayQR' ? 'VNPay QR' : 'VNPay',
        paidAtUtc: new Date().toISOString(),
        ticketId: 'tkt-demo-03',
        isDemo: true,
      };
    }

    return {
      isSuccess: false,
      bookingId,
      bookingCode: 'BK-20261015-0148',
      transactionRef,
      amount: 1700000,
      paymentMethod: 'VNPay',
      errorCode: responseCode,
      errorMessage: 'Giao dịch thanh toán không thành công hoặc đã bị hủy bởi người dùng.',
      isDemo: true,
    };
  }

  // Real mode: Calls backend payment verification
  try {
    const raw = await requestJson(`/api/payments/verify?${searchParams.toString()}`, {
      signal: options?.signal,
    });
    if (isRecord(raw) && typeof raw.isSuccess === 'boolean') {
      return raw as unknown as PaymentVerifyResultDto;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new BookingApiError(
      'Xác thực kết quả thanh toán điện tử đang chờ kết nối API từ máy chủ (UC-28 — PENDING_BE_INTEGRATION). Cần xác thực chữ ký số từ máy chủ để đảm bảo an toàn giao dịch.',
      501,
      { errorCode: 'PENDING_BE_INTEGRATION' },
    );
  }

  throw new BookingApiError(
    'Xác thực kết quả thanh toán điện tử đang chờ kết nối API từ máy chủ (UC-28 — PENDING_BE_INTEGRATION). Cần xác thực chữ ký số từ máy chủ để đảm bảo an toàn giao dịch.',
    501,
    { errorCode: 'PENDING_BE_INTEGRATION' },
  );
}

/**
 * UC-29: View QR E-ticket. Out of scope for UC-27; kept pending its own integration task.
 */
export async function getTicket(
  ticketId: string,
  options?: {
    allowDemo?: boolean;
    signal?: AbortSignal;
  },
): Promise<TicketDto> {
  const demoAllowed = options?.allowDemo === true && isBookingDemoAllowedInCurrentEnv();

  if (demoAllowed) {
    return {
      ...DEMO_TICKET_HOI_AN,
      ticketId: ticketId || DEMO_TICKET_HOI_AN.ticketId,
    };
  }

  try {
    const raw = await requestJson(`/api/tickets/${encodeURIComponent(ticketId)}`, {
      signal: options?.signal,
    });
    if (isRecord(raw) && typeof raw.ticketId === 'string') {
      return raw as unknown as TicketDto;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new BookingApiError(
      'Chi tiết vé điện tử QR đang chờ hoàn tất kết nối API từ máy chủ (UC-29 — PENDING_BE_INTEGRATION).',
      501,
      { errorCode: 'PENDING_BE_INTEGRATION' },
    );
  }

  throw new BookingApiError(
    'Chi tiết vé điện tử QR đang chờ hoàn tất kết nối API từ máy chủ (UC-29 — PENDING_BE_INTEGRATION).',
    501,
    { errorCode: 'PENDING_BE_INTEGRATION' },
  );
}
