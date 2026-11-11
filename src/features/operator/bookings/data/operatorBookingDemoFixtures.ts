import type {
  BookingBookerDetailDto,
  BookingCouponDto,
  BookingDetailView,
  BookingListItemDto,
  BookingParticipantDto,
  BookingPaymentDto,
  BookingRefundDto,
  BookingScheduleDetailDto,
  BookingStatus,
  BookingTicketDto,
  BookingTourDto,
  CancellationReasonValue,
  CheckInStatus,
  PaymentStatus,
} from '../types/bookingLifecycle';
import { evaluateDemoCancelEligibility } from './operatorBookingDemoPolicy';

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

/**
 * Demo store record: the BE detail fields plus what only the demo needs (operator ownership for
 * BR-105 isolation and the UC-41/UC-42 preview state). `canCancel`, `paidAmount` and
 * `subtotalAmount` are derived when a record is read, so they stay consistent after a demo cancel.
 */
export interface DemoBookingRecord {
  bookingId: string;
  bookingCode: string;
  operatorUserId: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  bookedAtUtc: string;
  cancelledAtUtc: string | null;
  cancelReason: string | null;
  cancellationReasonType?: CancellationReasonValue;
  tour: BookingTourDto;
  schedule: BookingScheduleDetailDto;
  booker: BookingBookerDetailDto;
  quantity: number;
  participants: BookingParticipantDto[];
  ticket: BookingTicketDto | null;
  checkInStatus: CheckInStatus;
  checkedInAtUtc: string | null;
  payment: BookingPaymentDto | null;
  discountAmount: number;
  totalAmount: number;
  coupon: BookingCouponDto | null;
  refund?: BookingRefundDto;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Detail view of a demo record; never exposes the demo-only operator id. */
export function toDemoDetailView(record: DemoBookingRecord): BookingDetailView {
  const rest: Omit<DemoBookingRecord, 'operatorUserId'> & { operatorUserId?: number } = clone(record);
  delete rest.operatorUserId;
  const eligibility = evaluateDemoCancelEligibility(record.status, record.checkInStatus);
  return {
    ...rest,
    paidAmount: record.payment?.status === 'Success' ? record.payment.amount : 0,
    subtotalAmount: record.totalAmount + record.discountAmount,
    canCancel: eligibility.canCancel,
    cancelBlockedReason: eligibility.cancelBlockedReason,
  };
}

/** List row of a demo record (the light shape of `GET /api/v1/operator/bookings`). */
export function toDemoListItem(record: DemoBookingRecord): BookingListItemDto {
  return clone({
    bookingId: record.bookingId,
    bookingCode: record.bookingCode,
    tour: record.tour,
    schedule: {
      scheduleId: record.schedule.scheduleId,
      startAtUtc: record.schedule.startAtUtc,
      endAtUtc: record.schedule.endAtUtc,
    },
    booker: {
      userId: record.booker.userId,
      fullName: record.booker.fullName,
      email: record.booker.email,
    },
    quantity: record.quantity,
    totalAmount: record.totalAmount,
    discountAmount: record.discountAmount,
    status: record.status,
    paymentStatus: record.paymentStatus,
    checkInStatus: record.checkInStatus,
    checkedInAtUtc: record.checkedInAtUtc,
    bookedAtUtc: record.bookedAtUtc,
  });
}

const adult = (fullName: string): BookingParticipantDto => ({ fullName, participantType: 'Adult' });
const child = (fullName: string): BookingParticipantDto => ({ fullName, participantType: 'Child' });

const vnpay = (
  reference: string,
  amount: number,
  succeededAtUtc: string
): BookingPaymentDto => ({
  gateway: 'VNPAY',
  gatewayTransactionRef: reference,
  status: 'Success',
  amount,
  succeededAtUtc,
});

export const INITIAL_DEMO_BOOKINGS: DemoBookingRecord[] = [
  // 1. Confirmed + paid via VNPAY, 5 pax, Ba Na Hills, cancellable, full refund under the demo policy
  {
    bookingId: 'booking-0141',
    bookingCode: 'BK-20260919-0141',
    operatorUserId: DEMO_OPERATOR_USER_ID,
    status: 'Confirmed',
    paymentStatus: 'Paid',
    bookedAtUtc: '2026-09-10T07:15:00Z',
    cancelledAtUtc: null,
    cancelReason: null,
    tour: { tourId: 'tour-142', title: 'Ba Na Hills full-day tour' },
    schedule: {
      scheduleId: 'sch-142-0919',
      startAtUtc: '2026-09-19T01:00:00Z',
      endAtUtc: '2026-09-19T11:00:00Z',
      meetingPoint: 'Da Nang Cruise Port',
    },
    booker: {
      userId: 'user-5001',
      fullName: 'Nguyễn Văn An',
      email: 'an.nguyen@example.com',
      phoneNumber: '0901234567',
    },
    quantity: 5,
    participants: [
      adult('Nguyễn Văn An'),
      adult('Trần Thị Mai'),
      child('Nguyễn Minh Quân'),
      child('Nguyễn Gia Hân'),
      adult('Lê Văn Phúc'),
    ],
    ticket: {
      ticketCode: 'TK-0000000141',
      status: 'Valid',
      issuedAtUtc: '2026-09-10T07:23:00Z',
      expiresAtUtc: null,
    },
    checkInStatus: 'NotCheckedIn',
    checkedInAtUtc: null,
    payment: vnpay('VNPAY-20260910-884920', 5600000, '2026-09-10T07:22:15Z'),
    discountAmount: 200000,
    totalAmount: 5600000,
    coupon: { code: 'HE2026', name: 'Summer 2026', discountAmount: 200000 },
  },

  // 2. Confirmed + paid, 3 pax, Ba Na Hills, checked-in (cannot be cancelled -> MSG95)
  {
    bookingId: 'booking-0148',
    bookingCode: 'BK-20260912-0148',
    operatorUserId: DEMO_OPERATOR_USER_ID,
    status: 'Confirmed',
    paymentStatus: 'Paid',
    bookedAtUtc: '2026-09-05T02:05:00Z',
    cancelledAtUtc: null,
    cancelReason: null,
    tour: { tourId: 'tour-142', title: 'Ba Na Hills full-day tour' },
    schedule: {
      scheduleId: 'sch-142-0912',
      startAtUtc: '2026-09-12T01:00:00Z',
      endAtUtc: '2026-09-12T11:00:00Z',
      meetingPoint: 'Da Nang Cruise Port',
    },
    booker: {
      userId: 'user-5002',
      fullName: 'Lê Hoàng Nam',
      email: 'nam.le@example.com',
      phoneNumber: '0912345678',
    },
    quantity: 3,
    participants: [adult('Lê Hoàng Nam'), adult('Vũ Thùy Linh'), child('Lê Tuấn Khang')],
    ticket: {
      ticketCode: 'TK-0000000148',
      status: 'Used',
      issuedAtUtc: '2026-09-05T02:11:00Z',
      expiresAtUtc: null,
    },
    checkInStatus: 'CheckedIn',
    checkedInAtUtc: '2026-09-12T00:45:00Z',
    payment: vnpay('VNPAY-20260905-112233', 3500000, '2026-09-05T02:10:00Z'),
    discountAmount: 0,
    totalAmount: 3500000,
    coupon: null,
  },

  // 3. Pending payment, 4 pax, Hoi An (owned tour-148), cancellable (no refund needed)
  {
    bookingId: 'booking-0146',
    bookingCode: 'BK-20260913-0146',
    operatorUserId: DEMO_OPERATOR_USER_ID,
    status: 'PendingPayment',
    paymentStatus: 'Unpaid',
    bookedAtUtc: '2026-09-11T09:20:00Z',
    cancelledAtUtc: null,
    cancelReason: null,
    tour: { tourId: 'tour-148', title: 'Phố cổ Hội An & Rừng dừa Bảy Mẫu' },
    schedule: {
      scheduleId: 'sch-148-0913',
      startAtUtc: '2026-09-13T06:30:00Z',
      endAtUtc: '2026-09-13T14:30:00Z',
      meetingPoint: 'Hoi An Ancient Town Gate',
    },
    booker: {
      userId: 'user-5003',
      fullName: 'Phạm Minh Tuấn',
      email: 'tuan.pm@example.com',
      phoneNumber: '0933445566',
    },
    quantity: 4,
    participants: [
      adult('Phạm Minh Tuấn'),
      adult('Hoàng Kim Oanh'),
      child('Phạm Ngọc Ánh'),
      child('Phạm Đăng Khôi'),
    ],
    ticket: null,
    checkInStatus: 'NotCheckedIn',
    checkedInAtUtc: null,
    payment: null,
    discountAmount: 0,
    totalAmount: 2800000,
    coupon: null,
  },

  // 4. Expired (payment window lapsed, never paid), 2 pax, food trail (owned tour-55)
  {
    bookingId: 'booking-0144',
    bookingCode: 'BK-20260914-0144',
    operatorUserId: DEMO_OPERATOR_USER_ID,
    status: 'Expired',
    paymentStatus: 'Unpaid',
    bookedAtUtc: '2026-09-13T12:45:00Z',
    cancelledAtUtc: null,
    cancelReason: null,
    tour: { tourId: 'tour-55', title: 'Khám phá ẩm thực Đà Nẵng về đêm' },
    schedule: {
      scheduleId: 'sch-55-0914',
      startAtUtc: '2026-09-14T11:00:00Z',
      endAtUtc: '2026-09-14T15:00:00Z',
      meetingPoint: 'Dragon Bridge',
    },
    booker: {
      userId: 'user-5004',
      fullName: 'Đặng Quốc Bảo',
      email: 'bao.dang@example.com',
      phoneNumber: '0977889900',
    },
    quantity: 2,
    participants: [adult('Đặng Quốc Bảo'), adult('Nguyễn Thị Hồng')],
    ticket: null,
    checkInStatus: 'NotCheckedIn',
    checkedInAtUtc: null,
    payment: null,
    discountAmount: 0,
    totalAmount: 1100000,
    coupon: null,
  },

  // 5. Cancelled, paid, refund already initiated (cannot cancel/refund again -> MSG133)
  {
    bookingId: 'booking-0110',
    bookingCode: 'BK-20260820-0110',
    operatorUserId: DEMO_OPERATOR_USER_ID,
    status: 'Cancelled',
    paymentStatus: 'Refunded',
    bookedAtUtc: '2026-08-10T03:50:00Z',
    cancelledAtUtc: '2026-08-15T03:00:00Z',
    cancelReason: 'Khách hàng có việc gia đình đột xuất',
    cancellationReasonType: 'CUSTOMER_REQUEST',
    tour: { tourId: 'tour-142', title: 'Ba Na Hills full-day tour' },
    schedule: {
      scheduleId: 'sch-142-0820',
      startAtUtc: '2026-08-20T01:00:00Z',
      endAtUtc: '2026-08-20T11:00:00Z',
      meetingPoint: 'Da Nang Cruise Port',
    },
    booker: {
      userId: 'user-5005',
      fullName: 'Bùi Thanh Hương',
      email: 'huong.bui@example.com',
      phoneNumber: '0988112233',
    },
    quantity: 2,
    participants: [adult('Bùi Thanh Hương'), adult('Trần Văn Đức')],
    ticket: {
      ticketCode: 'TK-0000000110',
      status: 'Cancelled',
      issuedAtUtc: '2026-08-10T04:01:00Z',
      expiresAtUtc: null,
    },
    checkInStatus: 'NotCheckedIn',
    checkedInAtUtc: null,
    payment: vnpay('VNPAY-20260810-445566', 2800000, '2026-08-10T04:00:00Z'),
    discountAmount: 0,
    totalAmount: 2800000,
    coupon: null,
    refund: {
      id: 'rf-0110',
      bookingId: 'booking-0110',
      refundableAmount: 2800000,
      deductionAmount: 0,
      policyApplied: '100% refund before policy cutoff (Demo fixture policy)',
      paymentChannel: 'VNPAY',
      status: 'Success',
      gatewayReference: 'REFUND-VNPAY-20260815-1100',
      attemptCount: 1,
      notes: 'Demo refund record via VNPAY',
      createdAt: '2026-08-15T03:05:00Z',
    },
  },

  // 6. Completed departure
  {
    bookingId: 'booking-0095',
    bookingCode: 'BK-20260815-0095',
    operatorUserId: DEMO_OPERATOR_USER_ID,
    status: 'Completed',
    paymentStatus: 'Paid',
    bookedAtUtc: '2026-08-05T08:20:00Z',
    cancelledAtUtc: null,
    cancelReason: null,
    tour: { tourId: 'tour-148', title: 'Phố cổ Hội An & Rừng dừa Bảy Mẫu' },
    schedule: {
      scheduleId: 'sch-148-0815',
      startAtUtc: '2026-08-15T06:30:00Z',
      endAtUtc: '2026-08-15T14:30:00Z',
      meetingPoint: 'Hoi An Ancient Town Gate',
    },
    booker: {
      userId: 'user-5006',
      fullName: 'Hoàng Văn Vinh',
      email: 'vinh.hoang@example.com',
      phoneNumber: '0909556677',
    },
    quantity: 3,
    participants: [adult('Hoàng Văn Vinh'), adult('Trịnh Thu Hà'), child('Hoàng Nhật Minh')],
    ticket: {
      ticketCode: 'TK-0000000095',
      status: 'Used',
      issuedAtUtc: '2026-08-05T08:31:00Z',
      expiresAtUtc: null,
    },
    checkInStatus: 'CheckedIn',
    checkedInAtUtc: '2026-08-15T06:10:00Z',
    payment: vnpay('VNPAY-20260805-334455', 2100000, '2026-08-05T08:30:00Z'),
    discountAmount: 0,
    totalAmount: 2100000,
    coupon: null,
  },

  // 7. Booking belonging to another operator (operatorUserId: 999) - BR-105 / MSG126 test
  {
    bookingId: 'booking-9999',
    bookingCode: 'BK-20260925-9999',
    operatorUserId: 999, // Another operator
    status: 'Confirmed',
    paymentStatus: 'Paid',
    bookedAtUtc: '2026-09-20T01:00:00Z',
    cancelledAtUtc: null,
    cancelReason: null,
    tour: { tourId: 'tour-999', title: 'Tour của đối tác khác' },
    schedule: {
      scheduleId: 'sch-999-0925',
      startAtUtc: '2026-09-25T01:00:00Z',
      endAtUtc: '2026-09-25T09:00:00Z',
      meetingPoint: null,
    },
    booker: {
      userId: 'user-5999',
      fullName: 'Người lạ',
      email: 'stranger@example.com',
      phoneNumber: '0999999999',
    },
    quantity: 1,
    participants: [adult('Người lạ')],
    ticket: {
      ticketCode: 'TK-0000009999',
      status: 'Valid',
      issuedAtUtc: '2026-09-20T01:05:00Z',
      expiresAtUtc: null,
    },
    checkInStatus: 'NotCheckedIn',
    checkedInAtUtc: null,
    payment: vnpay('VNPAY-20260920-000001', 1000000, '2026-09-20T01:04:00Z'),
    discountAmount: 0,
    totalAmount: 1000000,
    coupon: null,
  },
];
