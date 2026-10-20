import type {
  ActivePaymentDto,
  BookingPaymentStatusDto,
  CreatePaymentResponseDto,
  MockOutcomeType,
  MockPaymentOutcomeResponseDto,
} from '../types/payment';
import { PaymentApiError } from '../types/payment';

export { PaymentApiError };

export const PAYMENT_ERROR_MESSAGES: Record<string, string> = {
  PAYMENT_BOOKING_NOT_ELIGIBLE:
    'Đơn đặt tour không ở trạng thái hợp lệ để thanh toán.',
  PAYMENT_BOOKING_EXPIRED:
    'Đơn đặt tour đã hết hạn giữ chỗ. Vui lòng đặt lại tour mới.',
  PAYMENT_NOT_FOUND: 'Không tìm thấy thông tin giao dịch thanh toán.',
  PAYMENT_MOCK_DISABLED:
    'Cổng thanh toán giả lập không khả dụng trong môi trường hiện tại.',
  PAYMENT_GATEWAY_UNAVAILABLE:
    'Cổng thanh toán tạm thời không thể kết nối. Vui lòng thử lại sau.',
  PAYMENT_CALLBACK_INVALID: 'Dữ liệu phản hồi thanh toán không hợp lệ.',
  UNAUTHENTICATED: 'Vui lòng đăng nhập lại để tiếp tục.',
  FORBIDDEN: 'Bạn không có quyền thực hiện giao dịch này.',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
    throw new PaymentApiError('Không thể kết nối máy chủ dịch vụ thanh toán.', 0);
  }

  const type = response.headers.get('content-type') ?? '';
  const body: unknown =
    type.includes('application/json') || type.includes('problem+json')
      ? await response.json().catch(() => null)
      : null;

  if (!response.ok) {
    const errCode =
      isRecord(body) && typeof body.errorCode === 'string' ? body.errorCode : '';
    const message =
      PAYMENT_ERROR_MESSAGES[errCode] ?? 'Giao dịch thanh toán không thành công.';
    throw new PaymentApiError(message, response.status, errCode);
  }

  return body;
}

/**
 * UC-28: Create or reuse active payment link for an eligible booking.
 * Invokes POST /api/v1/traveler/bookings/{bookingId}/payments.
 */
export async function createOrReusePayment(
  bookingId: string | number,
  options?: { signal?: AbortSignal },
): Promise<CreatePaymentResponseDto> {
  const raw = await requestJson(
    `/api/v1/traveler/bookings/${encodeURIComponent(bookingId)}/payments`,
    {
      method: 'POST',
      signal: options?.signal,
    },
  );

  if (!isRecord(raw) || typeof raw.checkoutUrl !== 'string') {
    throw new PaymentApiError('Phản hồi liên kết thanh toán không hợp lệ.', 502);
  }

  return raw as unknown as CreatePaymentResponseDto;
}

/**
 * UC-28: Query canonical payment and booking status from backend.
 * Invokes GET /api/v1/traveler/bookings/{bookingId}/payment.
 */
export async function getBookingPaymentStatus(
  bookingId: string | number,
  options?: { signal?: AbortSignal },
): Promise<BookingPaymentStatusDto> {
  const raw = await requestJson(
    `/api/v1/traveler/bookings/${encodeURIComponent(bookingId)}/payment`,
    {
      method: 'GET',
      signal: options?.signal,
    },
  );

  if (!isRecord(raw) || typeof raw.bookingStatus !== 'string') {
    throw new PaymentApiError('Phản hồi trạng thái thanh toán không hợp lệ.', 502);
  }

  const status = raw as unknown as BookingPaymentStatusDto;
  // The Backend deliberately returns the latest transaction as top-level,
  // canonical fields.  Build the small display-only compatibility object used
  // by the checkout result views; no browser-supplied state is trusted here.
  const paymentId = typeof status.paymentId === 'number' ? status.paymentId : null;
  const transactionStatus = status.transactionStatus;
  const checkoutUrl = status.checkoutUrl;
  const activePayment: ActivePaymentDto | null =
    status.activePayment ?? (paymentId !== null && transactionStatus && checkoutUrl
      ? {
          paymentId,
          gateway: status.gateway ?? 'PayOS',
          amount: status.amount ?? 0,
          currency: status.currency ?? 'VND',
          checkoutUrl,
          expiresAt: status.paymentLinkExpiresAtUtc ?? '',
          status: transactionStatus,
        }
      : null);
  return {
    ...status,
    bookingCode: status.bookingCode ?? `#${status.bookingId}`,
    paymentExpiresAt: status.bookingPaymentExpiresAtUtc,
    activePayment,
  };
}

/**
 * Records a traveler cancellation after PayOS returns through the configured
 * cancel URL. This releases only the previous payment link, not the booking
 * hold, so a new link can be issued before the booking expires.
 */
export async function cancelPendingPayment(
  bookingId: string | number,
  options?: { signal?: AbortSignal },
): Promise<void> {
  await requestJson(
    `/api/v1/traveler/bookings/${encodeURIComponent(bookingId)}/payment/cancel`,
    {
      method: 'POST',
      signal: options?.signal,
    },
  );
}

/**
 * UC-28: Complete a mock payment with specified outcome.
 * Available only in local/development environments when provider is Mock.
 * Invokes POST /api/v1/traveler/payments/{paymentId}/mock-outcome.
 */
export async function completeMockPayment(
  paymentId: number | string,
  outcome: MockOutcomeType,
  options?: { signal?: AbortSignal },
): Promise<MockPaymentOutcomeResponseDto> {
  const raw = await requestJson(
    `/api/v1/traveler/payments/${encodeURIComponent(paymentId)}/mock-outcome`,
    {
      method: 'POST',
      body: JSON.stringify({ outcome }),
      signal: options?.signal,
    },
  );

  if (!isRecord(raw) || typeof raw.status !== 'string') {
    throw new PaymentApiError('Phản hồi kết quả thanh toán thử nghiệm không hợp lệ.', 502);
  }

  return raw as unknown as MockPaymentOutcomeResponseDto;
}
