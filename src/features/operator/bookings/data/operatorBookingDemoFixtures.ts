import type { BookingDto } from '../types/bookingLifecycle';

/**
 * Validates the strict environment gate for Tour Operator demo fixtures.
 * Demo fixtures are NEVER exposed in production environments.
 */
export function isBookingDemoAllowedInCurrentEnv(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES === 'true';
}

export const DEMO_OPERATOR_USER_ID = 101;

export const DEMO_OPERATOR_TOURS = [
  { id: 'tour-142', title: 'Ba Na Hills full-day tour' },
  { id: 'tour-148', title: 'Phố cổ Hội An & Rừng dừa Bảy Mẫu' },
  { id: 'tour-55', title: 'Khám phá ẩm thực Đà Nẵng về đêm' },
] as const;

export const INITIAL_DEMO_BOOKINGS: BookingDto[] = [
  // 1. Confirmed + paid via VNPay, 5 pax, Ba Na Hills, cancellable, full refund under policy
  {
    id: 'booking-0141',
    bookingCode: 'BK-20260919-0141',
    tourId: 'tour-142',
    tourName: 'Ba Na Hills full-day tour',
    operatorUserId: DEMO_OPERATOR_USER_ID,
    departureDate: '2026-09-19T08:00:00+07:00',
    contactName: 'Nguyễn Văn An',
    contactEmail: 'an.nguyen@example.com',
    contactPhone: '0901234567',
    participantsCount: 5,
    participants: [
      { id: 'pax-1', fullName: 'Nguyễn Văn An', paxType: 'Adult', age: 34 },
      { id: 'pax-2', fullName: 'Trần Thị Mai', paxType: 'Adult', age: 32 },
      { id: 'pax-3', fullName: 'Nguyễn Minh Quân', paxType: 'Child', age: 7, specialNotes: 'Dị ứng hải sản' },
      { id: 'pax-4', fullName: 'Nguyễn Gia Hân', paxType: 'Child', age: 4 },
      { id: 'pax-5', fullName: 'Lê Văn Phúc', paxType: 'Adult', age: 60 },
    ],
    totalAmount: 5600000,
    paidAmount: 5600000,
    status: 'Confirmed',
    checkInStatus: 'NotCheckedIn',
    qrTicketValid: true,
    cancellationWindowExpired: false,
    coupon: {
      code: 'HE2026',
      discountAmount: 200000,
    },
    paymentTransaction: {
      id: 'tx-0141',
      amount: 5600000,
      paymentChannel: 'VNPay',
      transactionReference: 'VNPAY-20260910-884920',
      status: 'Success',
      paidAt: '2026-09-10T14:22:15+07:00',
    },
    createdAt: '2026-09-10T14:15:00+07:00',
  },

  // 2. Confirmed + paid, 3 pax, Ba Na Hills, checked-in (cannot be cancelled -> MSG95)
  {
    id: 'booking-0148',
    bookingCode: 'BK-20260912-0148',
    tourId: 'tour-142',
    tourName: 'Ba Na Hills full-day tour',
    operatorUserId: DEMO_OPERATOR_USER_ID,
    departureDate: '2026-09-12T08:00:00+07:00',
    contactName: 'Lê Hoàng Nam',
    contactEmail: 'nam.le@example.com',
    contactPhone: '0912345678',
    participantsCount: 3,
    participants: [
      { id: 'pax-11', fullName: 'Lê Hoàng Nam', paxType: 'Adult', age: 29 },
      { id: 'pax-12', fullName: 'Vũ Thùy Linh', paxType: 'Adult', age: 28 },
      { id: 'pax-13', fullName: 'Lê Tuấn Khang', paxType: 'Child', age: 5 },
    ],
    totalAmount: 3500000,
    paidAmount: 3500000,
    status: 'Confirmed',
    checkInStatus: 'CheckedIn',
    qrTicketValid: true,
    cancellationWindowExpired: false,
    paymentTransaction: {
      id: 'tx-0148',
      amount: 3500000,
      paymentChannel: 'VNPay',
      transactionReference: 'VNPAY-20260905-112233',
      status: 'Success',
      paidAt: '2026-09-05T09:10:00+07:00',
    },
    createdAt: '2026-09-05T09:05:00+07:00',
  },

  // 3. Pending payment, 4 pax, Hoi An (owned tour-148), cancellable (no refund needed)
  {
    id: 'booking-0146',
    bookingCode: 'BK-20260913-0146',
    tourId: 'tour-148',
    tourName: 'Phố cổ Hội An & Rừng dừa Bảy Mẫu',
    operatorUserId: DEMO_OPERATOR_USER_ID,
    departureDate: '2026-09-13T13:30:00+07:00',
    contactName: 'Phạm Minh Tuấn',
    contactEmail: 'tuan.pm@example.com',
    contactPhone: '0933445566',
    participantsCount: 4,
    participants: [
      { id: 'pax-21', fullName: 'Phạm Minh Tuấn', paxType: 'Adult', age: 40 },
      { id: 'pax-22', fullName: 'Hoàng Kim Oanh', paxType: 'Adult', age: 38 },
      { id: 'pax-23', fullName: 'Phạm Ngọc Ánh', paxType: 'Child', age: 10 },
      { id: 'pax-24', fullName: 'Phạm Đăng Khôi', paxType: 'Child', age: 8 },
    ],
    totalAmount: 2800000,
    paidAmount: 0,
    status: 'PendingPayment',
    checkInStatus: 'NotCheckedIn',
    qrTicketValid: false,
    cancellationWindowExpired: false,
    createdAt: '2026-09-11T16:20:00+07:00',
  },

  // 4. Confirmed + paid, 2 pax, food trail (owned tour-55), cancellation window passed (<24h -> MSG82)
  {
    id: 'booking-0144',
    bookingCode: 'BK-20260914-0144',
    tourId: 'tour-55',
    tourName: 'Khám phá ẩm thực Đà Nẵng về đêm',
    operatorUserId: DEMO_OPERATOR_USER_ID,
    departureDate: '2026-09-14T18:00:00+07:00',
    contactName: 'Đặng Quốc Bảo',
    contactEmail: 'bao.dang@example.com',
    contactPhone: '0977889900',
    participantsCount: 2,
    participants: [
      { id: 'pax-31', fullName: 'Đặng Quốc Bảo', paxType: 'Adult', age: 26 },
      { id: 'pax-32', fullName: 'Nguyễn Thị Hồng', paxType: 'Adult', age: 25 },
    ],
    totalAmount: 1100000,
    paidAmount: 1100000,
    status: 'Confirmed',
    checkInStatus: 'NotCheckedIn',
    qrTicketValid: true,
    cancellationWindowExpired: true, // MSG82
    paymentTransaction: {
      id: 'tx-0144',
      amount: 1100000,
      paymentChannel: 'VNPay',
      transactionReference: 'VNPAY-20260913-998877',
      status: 'Success',
      paidAt: '2026-09-13T20:00:00+07:00',
    },
    createdAt: '2026-09-13T19:45:00+07:00',
  },

  // 5. Cancelled, paid, refund already initiated (cannot cancel/refund again -> MSG133)
  {
    id: 'booking-0110',
    bookingCode: 'BK-20260820-0110',
    tourId: 'tour-142',
    tourName: 'Ba Na Hills full-day tour',
    operatorUserId: DEMO_OPERATOR_USER_ID,
    departureDate: '2026-08-20T08:00:00+07:00',
    contactName: 'Bùi Thanh Hương',
    contactEmail: 'huong.bui@example.com',
    contactPhone: '0988112233',
    participantsCount: 2,
    participants: [
      { id: 'pax-41', fullName: 'Bùi Thanh Hương', paxType: 'Adult', age: 31 },
      { id: 'pax-42', fullName: 'Trần Văn Đức', paxType: 'Adult', age: 33 },
    ],
    totalAmount: 2800000,
    paidAmount: 2800000,
    status: 'Cancelled',
    checkInStatus: 'NotCheckedIn',
    qrTicketValid: false,
    cancellationReason: 'Khách hàng có việc gia đình đột xuất',
    cancelledAt: '2026-08-15T10:00:00+07:00',
    paymentTransaction: {
      id: 'tx-0110',
      amount: 2800000,
      paymentChannel: 'VNPay',
      transactionReference: 'VNPAY-20260810-445566',
      status: 'Success',
      paidAt: '2026-08-10T11:00:00+07:00',
    },
    refund: {
      id: 'rf-0110',
      bookingId: 'booking-0110',
      refundableAmount: 2800000,
      deductionAmount: 0,
      policyApplied: '100% refund before policy cutoff (Demo fixture policy)',
      paymentChannel: 'VNPay',
      status: 'Success',
      gatewayReference: 'REFUND-VNPAY-20260815-1100',
      attemptCount: 1,
      notes: 'Demo refund record via VNPay',
      createdAt: '2026-08-15T10:05:00+07:00',
    },
    createdAt: '2026-08-10T10:50:00+07:00',
  },

  // 6. Completed departure
  {
    id: 'booking-0095',
    bookingCode: 'BK-20260815-0095',
    tourId: 'tour-148',
    tourName: 'Phố cổ Hội An & Rừng dừa Bảy Mẫu',
    operatorUserId: DEMO_OPERATOR_USER_ID,
    departureDate: '2026-08-15T13:30:00+07:00',
    contactName: 'Hoàng Văn Vinh',
    contactEmail: 'vinh.hoang@example.com',
    contactPhone: '0909556677',
    participantsCount: 3,
    participants: [
      { id: 'pax-51', fullName: 'Hoàng Văn Vinh', paxType: 'Adult', age: 45 },
      { id: 'pax-52', fullName: 'Trịnh Thu Hà', paxType: 'Adult', age: 42 },
      { id: 'pax-53', fullName: 'Hoàng Nhật Minh', paxType: 'Child', age: 12 },
    ],
    totalAmount: 2100000,
    paidAmount: 2100000,
    status: 'Completed',
    checkInStatus: 'CheckedIn',
    qrTicketValid: false,
    paymentTransaction: {
      id: 'tx-0095',
      amount: 2100000,
      paymentChannel: 'VNPay',
      transactionReference: 'VNPAY-20260805-334455',
      status: 'Success',
      paidAt: '2026-08-05T15:30:00+07:00',
    },
    createdAt: '2026-08-05T15:20:00+07:00',
  },

  // 7. Booking belonging to another operator (operatorUserId: 999) - BR-105 / MSG126 test
  {
    id: 'booking-9999',
    bookingCode: 'BK-20260925-9999',
    tourId: 'tour-999',
    tourName: 'Tour của đối tác khác',
    operatorUserId: 999, // Another operator
    departureDate: '2026-09-25T08:00:00+07:00',
    contactName: 'Người lạ',
    contactEmail: 'stranger@example.com',
    contactPhone: '0999999999',
    participantsCount: 1,
    participants: [{ id: 'pax-99', fullName: 'Người lạ', paxType: 'Adult', age: 30 }],
    totalAmount: 1000000,
    paidAmount: 1000000,
    status: 'Confirmed',
    checkInStatus: 'NotCheckedIn',
    qrTicketValid: true,
    createdAt: '2026-09-20T08:00:00+07:00',
  },
];
