import type { BookingDto, BookingQuoteDto, ParticipantCounts } from '../types/booking';
import type { TicketView } from '../types/ticket';

/**
 * EXPLICIT DEMO FIXTURES (DEMO_ONLY)
 *
 * Notice:
 * These fixtures are strictly for development, design preview, and automated testing
 * of UC-27 (Book Tour), UC-28 (Make Electronic Payment), and UC-29 (View QR E-ticket)
 * while a real departure/voucher cannot be selected end-to-end in this environment.
 *
 * In production mode, the application NEVER silently falls back to these fixtures.
 * They are only accessible via explicit opt-in (?demo=1 in non-production).
 */

export const DEMO_COUPON_CODES: Record<string, { percent: number; label: string }> = {
  BANA15: { percent: 15, label: 'Giảm 15% tổng giá trị tour' },
  HOIAN15: { percent: 15, label: 'Ưu đãi 15% mùa lễ hội di sản' },
  TRIPMATE10: { percent: 10, label: 'Chào mừng thành viên mới giảm 10%' },
};

const DEMO_ADULT_PRICE = 800000;
const DEMO_CHILD_PRICE = 400000;

/** Read-only demo quote. Mirrors the shape the real quote endpoint returns; computes nothing the real server wouldn't. */
export function createDemoQuote(
  tourId: string,
  tourScheduleId: string,
  counts: ParticipantCounts,
  voucherCode?: string,
): BookingQuoteDto {
  const subtotalAmount =
    counts.adult * DEMO_ADULT_PRICE + counts.child * DEMO_CHILD_PRICE + counts.infant * DEMO_ADULT_PRICE;
  const normalizedCode = voucherCode?.trim().toUpperCase();
  const coupon = normalizedCode ? DEMO_COUPON_CODES[normalizedCode] : undefined;
  const discountAmount = coupon ? Math.round((subtotalAmount * coupon.percent) / 100) : 0;

  return {
    tourId,
    tourScheduleId,
    currency: 'VND',
    participantCounts: counts,
    priceBreakdown: [
      { participantType: 'Adult', quantity: counts.adult, unitPrice: DEMO_ADULT_PRICE, lineAmount: counts.adult * DEMO_ADULT_PRICE },
      { participantType: 'Child', quantity: counts.child, unitPrice: DEMO_CHILD_PRICE, lineAmount: counts.child * DEMO_CHILD_PRICE },
      { participantType: 'Infant', quantity: counts.infant, unitPrice: DEMO_ADULT_PRICE, lineAmount: counts.infant * DEMO_ADULT_PRICE },
    ],
    subtotalAmount,
    discountAmount,
    totalAmount: Math.max(0, subtotalAmount - discountAmount),
    remainingSlots: 8,
    appliedVoucher: coupon && normalizedCode ? { code: normalizedCode } : null,
  };
}

export function createDemoBooking(overrides?: Partial<BookingDto>): BookingDto {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 min hold, matches BE TourBookingOptions default

  return {
    bookingId: overrides?.bookingId ?? 'bk-demo-0148',
    bookingCode: overrides?.bookingCode ?? 'BK-20261015-0148',
    status: overrides?.status ?? 'PendingPayment',
    tourScheduleId: overrides?.tourScheduleId ?? '9007199254740997',
    currency: 'VND',
    subtotalAmount: overrides?.subtotalAmount ?? 2000000,
    discountAmount: overrides?.discountAmount ?? 300000,
    totalAmount: overrides?.totalAmount ?? 1700000,
    paymentExpiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
    isDemo: true,
  };
}

export const DEMO_BOOKING_HOI_AN: BookingDto = createDemoBooking();

/** UC-29 demo ticket in the Backend contract shape; served only behind the demo gate. */
export const DEMO_TICKET_VIEW: TicketView = {
  ticketId: '9007199254740993',
  ticketCode: 'TK-0000000148',
  bookingId: '148',
  bookingCode: 'BK-20261015-00148',
  ticketStatus: 'Valid',
  tour: { tourId: '9007199254740995', title: 'Hành Trình Di Sản Phố Cổ Hội An & Rừng Dừa Bảy Mẫu 2N1Đ' },
  operatorName: 'Endpoint Travel Miền Trung',
  schedule: {
    startAtUtc: '2026-10-15T00:30:00+00:00',
    endAtUtc: '2026-10-16T10:00:00+00:00',
    meetingPoint: '01 Đường 2 Tháng 9, Quận Hải Châu, TP. Đà Nẵng (Bảo tàng Điêu khắc Chăm)',
  },
  participantCount: 3,
  participants: { adult: 2, child: 1, infant: 0 },
  validity: {
    departureDate: '2026-10-15',
    timeZone: 'Asia/Ho_Chi_Minh',
    validFromUtc: '2026-10-14T17:00:00+00:00',
    validUntilUtc: '2026-10-15T16:59:59.9999999+00:00',
  },
  checkedInAtUtc: null,
  qr: { content: 'TM1.DEMO-NOT-A-REAL-TICKET.DEMO', issuedAtUtc: '2026-10-02T10:45:00+00:00' },
  isDemo: true,
};
