import type { BookingDto } from '../types/booking';
import type { TicketDto } from '../types/ticket';

/**
 * EXPLICIT DEMO FIXTURES (DEMO_ONLY)
 *
 * Notice:
 * These fixtures are strictly for development, design preview, and automated testing
 * of UC-27 (Book Tour), UC-28 (Make Electronic Payment), and UC-29 (View QR E-ticket)
 * while Backend integration remains in PENDING_BE_INTEGRATION status.
 *
 * In production mode, the application NEVER silently falls back to these fixtures.
 * They are only accessible via explicit opt-in (?demo=1 in non-production).
 */

export const DEMO_COUPON_CODES: Record<string, { percent: number; label: string }> = {
  BANA15: { percent: 15, label: 'Giảm 15% tổng giá trị tour' },
  HOIAN15: { percent: 15, label: 'Ưu đãi 15% mùa lễ hội di sản' },
  TRIPMATE10: { percent: 10, label: 'Chào mừng thành viên mới giảm 10%' },
};

export function createDemoBooking(overrides?: Partial<BookingDto>): BookingDto {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 mins countdown

  const adultCount = overrides?.adultCount ?? 2;
  const childCount = overrides?.childCount ?? 1;
  const adultUnitPrice = 800000;
  const childUnitPrice = 400000;
  const subtotal = adultCount * adultUnitPrice + childCount * childUnitPrice;
  const discountAmount = overrides?.discountAmount ?? Math.round(subtotal * 0.15); // 15% default discount demo
  const totalAmount = overrides?.totalAmount ?? subtotal - discountAmount;

  return {
    bookingId: 'bk-demo-0148',
    bookingCode: 'BK-20261015-0148',
    tourId: '9007199254740995',
    tourTitle: 'Hành Trình Di Sản Phố Cổ Hội An & Rừng Dừa Bảy Mẫu 2N1Đ',
    operatorName: 'Endpoint Travel Miền Trung',
    scheduleId: '9007199254740997',
    departureDatetime: '2026-10-15T07:30:00Z',
    meetingPoint: '01 Đường 2 Tháng 9, Quận Hải Châu, TP. Đà Nẵng (Bảo tàng Điêu khắc Chăm)',
    adultCount,
    childCount,
    adultUnitPrice,
    childUnitPrice,
    couponCode: overrides?.couponCode ?? 'HOIAN15',
    discountAmount,
    totalAmount,
    currency: 'VND',
    status: overrides?.status ?? 'PendingPayment',
    paymentStatus: overrides?.paymentStatus ?? 'Pending',
    paymentMethod: overrides?.paymentMethod ?? 'VNPay',
    paymentExpiresAtUtc: expiresAt.toISOString(),
    createdAtUtc: now.toISOString(),
    leadTravelerName: overrides?.leadTravelerName ?? 'Nguyễn Minh Phúc',
    leadTravelerEmail: overrides?.leadTravelerEmail ?? 'traveler@tripmate.vn',
    leadTravelerPhone: overrides?.leadTravelerPhone ?? '0905 123 456',
    participants: overrides?.participants ?? [
      { fullName: 'Nguyễn Minh Phúc', participantType: 'Adult' },
      { fullName: 'Trần Thị Thu Thảo', participantType: 'Adult' },
      { fullName: 'Nguyễn Minh An', participantType: 'Child', notes: 'Trẻ 6 tuổi' },
    ],
    specialRequests: overrides?.specialRequests ?? 'Gia đình có bé nhỏ xin ưu tiên ghế đầu xe nếu thuận tiện.',
    isDemo: true,
  };
}

export const DEMO_BOOKING_HOI_AN: BookingDto = createDemoBooking();

export const DEMO_TICKET_HOI_AN: TicketDto = {
  ticketId: 'tkt-demo-03',
  ticketCode: 'TKT-8F4K29QX-03',
  bookingId: 'bk-demo-0148',
  bookingCode: 'BK-20261015-0148',
  tourId: '9007199254740995',
  tourTitle: 'Hành Trình Di Sản Phố Cổ Hội An & Rừng Dừa Bảy Mẫu 2N1Đ',
  operatorName: 'Endpoint Travel Miền Trung',
  departureDatetime: '2026-10-15T07:30:00Z',
  meetingPoint: '01 Đường 2 Tháng 9, Quận Hải Châu, TP. Đà Nẵng (Bảo tàng Điêu khắc Chăm)',
  travelerSummary: '2 người lớn, 1 trẻ em',
  leadTravelerName: 'Nguyễn Minh Phúc',
  leadTravelerPhone: '0905 123 456',
  paidAmount: 1700000,
  currency: 'VND',
  paymentMethod: 'VNPay',
  status: 'Valid',
  issuedAtUtc: '2026-10-02T10:45:00Z',
  qrPayload: 'TRIPMATE-TKT-8F4K29QX-03-VERIFIED',
  isDemo: true,
};
