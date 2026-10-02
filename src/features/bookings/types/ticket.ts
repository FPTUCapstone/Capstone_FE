export type TicketStatus = 'Valid' | 'Used' | 'Cancelled' | 'Expired';

export interface TicketDto {
  ticketId: string;
  ticketCode: string;
  bookingId: string;
  bookingCode: string;
  tourId: string;
  tourTitle: string;
  operatorName: string;
  departureDatetime: string;
  meetingPoint: string;
  travelerSummary: string;
  leadTravelerName: string;
  leadTravelerPhone: string;
  paidAmount: number;
  currency: string;
  paymentMethod: string;
  status: TicketStatus;
  issuedAtUtc: string;
  qrPayload: string;
  isDemo?: boolean;
}
