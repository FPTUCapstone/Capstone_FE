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
  orderCode: number;
  amount: number;
  currency: string;
  checkoutUrl: string;
  expiresAt: string;
  status: PaymentTransactionStatus;
}

export interface ActivePaymentDto {
  paymentId: number;
  gateway: string;
  orderCode: number;
  amount: number;
  currency: string;
  checkoutUrl: string;
  expiresAt: string;
  status: PaymentTransactionStatus;
}

export interface BookingPaymentStatusDto {
  bookingId: number | string;
  bookingCode: string;
  bookingStatus: 'PendingPayment' | 'Confirmed' | 'Cancelled' | 'Completed' | 'Expired';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  paymentExpiresAt: string;
  activePayment?: ActivePaymentDto | null;
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
