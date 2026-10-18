export type PaymentProvider = 'PayOS' | 'Mock';

export type PaymentTransactionStatus =
  | 'Pending'
  | 'Success'
  | 'Cancelled'
  | 'Expired'
  | 'Failed';

export interface CreatePaymentResponseDto {
  paymentId: number;
  bookingId: number | string;
  gateway?: PaymentProvider;
  /** Present for PayOS and retained for compatibility with existing checkout views. */
  orderCode?: number;
  /** The Backend owns payment-link lifetime. */
  paymentLinkExpiresAtUtc?: string | null;
  /** The existing UC-27 booking hold deadline. */
  bookingPaymentExpiresAtUtc?: string | null;
  /** @deprecated use paymentLinkExpiresAtUtc. */
  expiresAt?: string;
  amount: number;
  currency: string;
  checkoutUrl: string;
  status: PaymentTransactionStatus;
}

export interface BookingPaymentStatusDto {
  bookingId: number | string;
  /** Display fallback until a booking-detail read is introduced. */
  bookingCode?: string;
  bookingStatus: 'PendingPayment' | 'Confirmed' | 'Cancelled' | 'Completed' | 'Expired';
  paymentStatus: 'Unpaid' | 'Pending' | 'Paid' | 'Failed' | 'Refunded' | 'PartiallyRefunded';
  paymentId?: number | null;
  gateway?: PaymentProvider | null;
  transactionStatus?: PaymentTransactionStatus | null;
  amount?: number;
  currency?: string;
  checkoutUrl?: string | null;
  paymentLinkExpiresAtUtc?: string | null;
  bookingPaymentExpiresAtUtc?: string | null;
  /** @deprecated use bookingPaymentExpiresAtUtc. Retained for existing result UI. */
  paymentExpiresAt?: string | null;
  /** Compatibility view derived by the browser client from the canonical response. */
  activePayment?: ActivePaymentDto | null;
}

export interface ActivePaymentDto {
  paymentId: number;
  gateway: string;
  amount: number;
  currency: string;
  checkoutUrl: string;
  expiresAt: string;
  status: PaymentTransactionStatus;
  orderCode?: number;
}

export type MockOutcomeType = 'Success' | 'Cancelled' | 'Expired';

export interface MockPaymentOutcomeRequestDto {
  outcome: MockOutcomeType;
}

export interface MockPaymentOutcomeResponseDto {
  paymentId: number;
  bookingId: number | string;
  status: PaymentTransactionStatus;
  bookingStatus: string;
}

export class PaymentApiError extends Error {
  constructor(
    message: string,
    public readonly status: number = 0,
    public readonly errorCode?: string,
  ) {
    super(message);
    this.name = 'PaymentApiError';
  }
}
