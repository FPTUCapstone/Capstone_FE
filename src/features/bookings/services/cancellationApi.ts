export interface BookingCancellationPreview {
  bookingId: number;
  canCancel: boolean;
  blockingReasonCode: string | null;
  blockingReason: string | null;
  estimatedRefundAmount: number;
  refundStatus: string;
  bookingStatus: string;
  paymentStatus: string;
  tourTitle: string;
  totalAmount: number;
}

export interface BookingCancellationInput {
  reasonCategory?: string;
  reasonDetail?: string;
  confirmed: boolean;
}

export type CancellationResult<T> = { ok: true; data: T } | { ok: false; errorCode: string };

async function readResult<T>(response: Response): Promise<CancellationResult<T>> {
  const body: unknown = await response.json().catch(() => null);
  if (response.ok) return { ok: true, data: body as T };
  const errorCode =
    body && typeof body === 'object' && 'errorCode' in body && typeof body.errorCode === 'string'
      ? body.errorCode
      : 'CANCELLATION_UNAVAILABLE';
  return { ok: false, errorCode };
}

export async function fetchBookingCancellationPreview(
  bookingId: string,
): Promise<CancellationResult<BookingCancellationPreview>> {
  try {
    const response = await fetch(`/api/v1/bookings/${encodeURIComponent(bookingId)}/cancellation-preview`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    return readResult<BookingCancellationPreview>(response);
  } catch {
    return { ok: false, errorCode: 'CANCELLATION_UNAVAILABLE' };
  }
}

export async function submitBookingCancellation(
  bookingId: string,
  input: BookingCancellationInput,
  idempotencyKey: string,
): Promise<CancellationResult<{ bookingId: number }>> {
  try {
    const response = await fetch(`/api/v1/bookings/${encodeURIComponent(bookingId)}/cancellation`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(input),
    });
    return readResult<{ bookingId: number }>(response);
  } catch {
    return { ok: false, errorCode: 'CANCELLATION_UNAVAILABLE' };
  }
}
