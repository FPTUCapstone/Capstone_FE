import {
  createDemoBooking,
  DEMO_BOOKING_HOI_AN,
  DEMO_COUPON_CODES,
  DEMO_TICKET_HOI_AN,
} from '../data/bookingDemoFixtures';
import type {
  BookingDto,
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
    const title = typeof problem?.title === 'string' ? problem.title : 'Thao tác không thành công.';
    throw new BookingApiError(title, response.status, problem);
  }
  return body;
}

/**
 * UC-27: Book Tour
 * Creates a tour booking with status 'PendingPayment'.
 */
export async function createBooking(
  request: CreateBookingRequestDto,
  options?: {
    allowDemo?: boolean;
    signal?: AbortSignal;
  },
): Promise<BookingDto> {
  const demoAllowed = options?.allowDemo === true && isBookingDemoAllowedInCurrentEnv();

  if (demoAllowed) {
    const adultUnitPrice = 800000;
    const childUnitPrice = 400000;
    const subtotal = request.adultCount * adultUnitPrice + request.childCount * childUnitPrice;
    let discountAmount = 0;
    if (request.couponCode && DEMO_COUPON_CODES[request.couponCode.toUpperCase()]) {
      const coupon = DEMO_COUPON_CODES[request.couponCode.toUpperCase()];
      discountAmount = Math.round((subtotal * coupon.percent) / 100);
    }
    const totalAmount = Math.max(0, subtotal - discountAmount);

    return createDemoBooking({
      tourId: request.tourId,
      scheduleId: request.scheduleId,
      adultCount: request.adultCount,
      childCount: request.childCount,
      adultUnitPrice,
      childUnitPrice,
      couponCode: request.couponCode,
      discountAmount,
      totalAmount,
      leadTravelerName: request.leadTravelerName,
      leadTravelerPhone: request.leadTravelerPhone,
      leadTravelerEmail: request.leadTravelerEmail,
      participants: request.participants,
      specialRequests: request.specialRequests,
    });
  }

  // Real production path: Call BFF/Backend
  try {
    const raw = await requestJson('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(request),
      signal: options?.signal,
    });
    if (isRecord(raw) && typeof raw.bookingId === 'string') {
      return raw as unknown as BookingDto;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new BookingApiError(
      'Tính năng Đặt tour đang chờ hoàn tất kết nối API từ máy chủ (UC-27 — PENDING_BE_INTEGRATION).',
      501,
      { errorCode: 'PENDING_BE_INTEGRATION' },
    );
  }

  throw new BookingApiError(
    'Tính năng Đặt tour đang chờ hoàn tất kết nối API từ máy chủ (UC-27 — PENDING_BE_INTEGRATION).',
    501,
    { errorCode: 'PENDING_BE_INTEGRATION' },
  );
}

/**
 * UC-27/UC-28: Get Booking Details
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
      'Thông tin đơn đặt tour đang chờ hoàn tất kết nối API từ máy chủ (UC-27/UC-28 — PENDING_BE_INTEGRATION).',
      501,
      { errorCode: 'PENDING_BE_INTEGRATION' },
    );
  }

  throw new BookingApiError(
    'Thông tin đơn đặt tour đang chờ hoàn tất kết nối API từ máy chủ (UC-27/UC-28 — PENDING_BE_INTEGRATION).',
    501,
    { errorCode: 'PENDING_BE_INTEGRATION' },
  );
}

/**
 * UC-28: Initiate Electronic Payment
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
 * UC-28: Verify Payment Result
 * Reconciles the callback parameters from VNPay / Payment Gateway.
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
 * UC-29: View QR E-ticket
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
