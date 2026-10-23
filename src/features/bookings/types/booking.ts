export type BookingStatus = 'PendingPayment' | 'Confirmed' | 'Cancelled' | 'Completed' | 'Expired';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export type PaymentMethod = 'VNPay' | 'VNPayQR';

export type ParticipantType = 'Adult' | 'Child' | 'Infant';

/**
 * UC-27 participant shape approved in Capstone_BE/specs/UC-27-book-tour-be-spec.md §3.2.
 * The server is the sole authority for pricing; this DTO carries identity information only.
 */
export interface BookingParticipantRequestDto {
  fullName: string;
  participantType: ParticipantType;
  phoneNumber?: string;
  email?: string;
  idDocumentType?: 'CCCD' | 'Passport' | 'Other';
  idDocumentNumber?: string;
  nationality?: string;
}

export interface ParticipantCounts {
  adult: number;
  child: number;
  infant: number;
}

/** POST /api/v1/traveler/tour-bookings/quote request (BE spec §3.1). */
export interface BookingQuoteRequestDto {
  tourScheduleId: string;
  participantCounts: ParticipantCounts;
  voucherCode?: string;
}

export interface QuotePriceBreakdownLine {
  participantType: ParticipantType;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
}

export interface QuoteAppliedVoucherDto {
  code: string;
}

/** POST /api/v1/traveler/tour-bookings/quote response. Read-only; creates nothing. */
export interface BookingQuoteDto {
  tourId: string;
  tourScheduleId: string;
  currency: string;
  participantCounts: ParticipantCounts;
  priceBreakdown: QuotePriceBreakdownLine[];
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  remainingSlots: number;
  appliedVoucher?: QuoteAppliedVoucherDto | null;
}

/** POST /api/v1/traveler/tour-bookings request (BE spec §3.2). */
export interface CreateBookingRequestDto {
  tourScheduleId: string;
  participants: BookingParticipantRequestDto[];
  voucherCode?: string;
}

/** Create-booking response. UC-27 ends here; payment is a separate, user-initiated UC-28 step. */
export interface BookingDto {
  bookingId: string;
  bookingCode: string;
  status: BookingStatus;
  tourScheduleId: string;
  currency: string;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  /** Matches the Backend wire field exactly (BE spec §3.2); no "Utc" suffix on the wire. */
  paymentExpiresAt: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface PaymentInitResponseDto {
  paymentUrl: string;
  transactionRef: string;
  expiresAtUtc: string;
}

export interface PaymentVerifyResultDto {
  isSuccess: boolean;
  bookingId: string;
  bookingCode: string;
  transactionRef: string;
  amount: number;
  paymentMethod: string;
  paidAtUtc?: string;
  errorMessage?: string;
  errorCode?: string;
  ticketId?: string;
  isDemo?: boolean;
}

export interface BookingApiProblem {
  status?: number;
  title?: string;
  detail?: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
}

export class BookingApiError extends Error {
  constructor(
    message: string,
    public readonly status: number = 0,
    public readonly problem?: BookingApiProblem,
  ) {
    super(message);
    this.name = 'BookingApiError';
  }
}
