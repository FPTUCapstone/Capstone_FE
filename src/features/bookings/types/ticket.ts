/** UC-29 ticket statuses, in the order of `Capstone_BE/docs/UC-29-api-contract.md`. */
export const TICKET_STATUSES = ['NotYetActive', 'Valid', 'Used', 'Cancelled', 'Expired'] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export interface TicketQr {
  /** Opaque `TM1.{token}.{signature}`; rendered as received, never parsed or built by the client. */
  content: string;
  issuedAtUtc: string;
}

/** The UC-29 e-ticket as returned by the Backend; ids are decimal strings (int64-safe). */
export interface TicketView {
  ticketId: string;
  ticketCode: string;
  bookingId: string;
  bookingCode: string;
  ticketStatus: TicketStatus;
  tour: { tourId: string; title: string };
  operatorName: string;
  schedule: { startAtUtc: string; endAtUtc: string; meetingPoint: string | null };
  participantCount: number;
  participants: { adult: number; child: number; infant: number };
  validity: { departureDate: string; timeZone: string; validFromUtc: string; validUntilUtc: string };
  checkedInAtUtc: string | null;
  /** Present only for `NotYetActive` and `Valid`. */
  qr: TicketQr | null;
  /** Set only on the demo fixture. */
  isDemo?: boolean;
}
