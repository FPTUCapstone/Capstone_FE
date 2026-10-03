export type BookingStatus = 'PendingPayment' | 'Confirmed' | 'Cancelled' | 'Completed';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export type PaymentMethod = 'VNPay' | 'VNPayQR';

export interface BookingParticipantDto {
  fullName: string;
  participantType: 'Adult' | 'Child';
  notes?: string;
}

export interface CreateBookingRequestDto {
  tourId: string;
  scheduleId: string;
  adultCount: number;
  childCount: number;
  leadTravelerName: string;
  leadTravelerPhone: string;
  leadTravelerEmail: string;
  couponCode?: string;
  participants: BookingParticipantDto[];
  specialRequests?: string;
}

export interface BookingDto {
  bookingId: string;
  bookingCode: string;
  tourId: string;
  tourTitle: string;
  operatorName: string;
  scheduleId: string;
  departureDatetime: string;
  meetingPoint: string;
  adultCount: number;
  childCount: number;
  adultUnitPrice: number;
  childUnitPrice: number;
  couponCode?: string;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentExpiresAtUtc: string;
  createdAtUtc: string;
  leadTravelerName: string;
  leadTravelerEmail: string;
  leadTravelerPhone: string;
  participants: BookingParticipantDto[];
  specialRequests?: string;
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
