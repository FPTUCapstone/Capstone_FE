import type { TripCardDto, TripSummaryStatsDto } from '../types/tripHistory';

/**
 * EXPLICIT DEMO FIXTURES (DEMO_ONLY)
 *
 * Notice:
 * These fixtures are strictly for development, design preview, and automated testing
 * of UC-32 (View Trip History) and UC-33 (Submit Trip Review) while Backend integration
 * remains in PENDING_BE_INTEGRATION status.
 *
 * In production mode, the application NEVER silently falls back to these fixtures.
 * They are only accessible via explicit opt-in (?demo=1 in non-production).
 */

export const DEMO_TRIP_CARDS: TripCardDto[] = [
  // 1. Completed Self-Planned Itinerary (Target Stitch Card 1 - Unreviewed)
  {
    tripId: 'trip-demo-itinerary-01',
    tripType: 'SelfPlannedItinerary',
    title: 'Hành trình Đà Nẵng - Hội An',
    departureDatetime: '2026-05-24T08:00:00+07:00',
    status: 'Completed',
    statusLabel: 'Đã hoàn thành',
    itineraryId: 101,
    stopCount: 4,
    distanceKm: 28,
    durationLabel: '1 ngày',
    stopsSummary: ['Ngũ Hành Sơn', 'Hội An', 'Cầu Rồng', 'Bếp Cuốn'],
    memberCount: 3,
    isReviewed: false,
    isDemo: true,
  },

  // 2. Completed Booked Tour (Target Stitch Card 2 - Reviewed, with real ticketId matching PR #43)
  {
    tripId: 'trip-demo-tour-02',
    tripType: 'TourBooking',
    title: 'Hành Trình Di Sản Phố Cổ Hội An & Rừng Dừa Bảy Mẫu 2N1Đ',
    departureDatetime: '2026-04-15T07:30:00+07:00',
    status: 'Completed',
    statusLabel: 'Đã hoàn thành',
    bookingId: 'bk-demo-0148',
    bookingCode: 'BK-20261015-0148',
    tourId: '9007199254740995',
    scheduleId: '9007199254740997',
    operatorName: 'Endpoint Travel Miền Trung',
    totalAmount: 1700000,
    currency: 'VND',
    paymentMethod: 'VNPay',
    participantsSummary: '2 người lớn, 1 trẻ em',
    /**
     * Real ticket identifier aligned with PR #43's DEMO_TICKET_HOI_AN
     */
    ticketId: 'tkt-demo-03',
    isReviewed: true,
    reviewId: 'rev-demo-02',
    rating: 5,
    reviewComment: 'Lộ trình do TripMate gợi ý rất hợp lý, tránh được giờ nắng nóng tại Ngũ Hành Sơn.',
    reviewedAtUtc: '2026-04-16T10:00:00Z',
    isDemo: true,
  },

  // 3. Completed Booked Tour (Stitch Card 3 - Unreviewed, with ticketId)
  {
    tripId: 'trip-demo-tour-03',
    tripType: 'TourBooking',
    title: 'Ba Na Hills tour - Khám phá Cầu Vàng',
    departureDatetime: '2026-08-28T08:00:00+07:00',
    status: 'Completed',
    statusLabel: 'Đã hoàn thành',
    bookingId: 'bk-demo-0921',
    bookingCode: 'BK-20260828-0921',
    tourId: '9007199254740991',
    operatorName: 'Han River Travel',
    totalAmount: 2528750,
    currency: 'VND',
    paymentMethod: 'VNPay',
    participantsSummary: '2 người lớn',
    ticketId: 'tkt-demo-bana-01',
    isReviewed: false,
    isDemo: true,
  },

  // 4. Completed Tour with NO ticketId (Validates TRIP-10: missing ticketId does NOT render ticket button)
  {
    tripId: 'trip-demo-tour-04-noticket',
    tripType: 'TourBooking',
    title: 'Đà Nẵng City Tour Nửa Ngày',
    departureDatetime: '2026-07-15T08:00:00+07:00',
    status: 'Completed',
    statusLabel: 'Đã hoàn thành',
    bookingId: 'bk-demo-0442',
    bookingCode: 'BK-20260715-0442',
    tourId: '9007199254740990',
    operatorName: 'Da Nang Explorer',
    totalAmount: 850000,
    currency: 'VND',
    paymentMethod: 'MoMo',
    participantsSummary: '1 người lớn',
    ticketId: undefined, // Truthfully absent
    isReviewed: false,
    isDemo: true,
  },

  // 5. Cancelled / Ended early Self-Planned Itinerary
  {
    tripId: 'trip-demo-itinerary-05',
    tripType: 'SelfPlannedItinerary',
    title: 'Hoi An evening walk',
    departureDatetime: '2026-08-15T17:30:00+07:00',
    status: 'Cancelled',
    statusLabel: 'Kết thúc sớm',
    itineraryId: 105,
    stopCount: 3,
    distanceKm: 8,
    stopsSummary: ['Chùa Cầu', 'Nhà cổ Tấn Ký', 'Bờ sông Hoài'],
    isRerouted: true,
    isReviewed: false,
    isDemo: true,
  },

  // 6. Cancelled Booked Tour with Refund info
  {
    tripId: 'trip-demo-cancelled-06',
    tripType: 'TourBooking',
    title: 'Tour Lặn Ngắm San Hô Cù Lao Chàm',
    departureDatetime: '2026-07-10T08:00:00+07:00',
    status: 'Cancelled',
    statusLabel: 'Đã hủy',
    bookingId: 'bk-demo-0331',
    bookingCode: 'BK-20260710-0331',
    tourId: '9007199254740989',
    operatorName: 'Cham Island Adventures',
    totalAmount: 1200000,
    currency: 'VND',
    paymentMethod: 'VNPay',
    cancelledAt: '2026-07-08T14:20:00+07:00',
    refundStatus: 'Đã hoàn tiền 100%',
    refundAmount: 1200000,
    refundChannel: 'Tài khoản VNPay',
    isReviewed: false,
    isDemo: true,
  },

  // 7. Upcoming Booked Tour
  {
    tripId: 'trip-demo-upcoming-07',
    tripType: 'TourBooking',
    title: 'Khám Phá Cố Đô Huế 1 Ngày',
    departureDatetime: '2026-11-20T07:00:00+07:00',
    status: 'Upcoming',
    statusLabel: 'Sắp khởi hành',
    bookingId: 'bk-demo-0881',
    bookingCode: 'BK-20261120-0881',
    tourId: '9007199254740988',
    operatorName: 'Huế Heritage Tours',
    totalAmount: 1450000,
    currency: 'VND',
    paymentMethod: 'VNPay',
    ticketId: 'tkt-demo-hue-01',
    participantsSummary: '2 người lớn',
    isReviewed: false,
    isDemo: true,
  },
];

export const DEMO_TRIP_SUMMARY: TripSummaryStatsDto = {
  totalCompletedTrips: 3,
  totalDistanceKm: 84,
  totalVisitedPois: 12,
  cspMatchRate: 98,
  averageRating: 5.0,
  isDemo: true,
};
