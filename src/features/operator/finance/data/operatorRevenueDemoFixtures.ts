/**
 * Deterministic Demo fixtures for Revenue & Analytics (UC-44).
 * Explicitly models tour package ownership (operator 101 vs 202), booking lifecycle states,
 * verified payment transactions, and completed refunds.
 */

export function isFinanceDemoAllowedInCurrentEnv(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES === 'true';
}

export interface DemoTourPackage {
  id: string;
  tourCode: string;
  operatorUserId: number | string;
  title: string;
}

export interface DemoBookingRecord {
  id: string;
  bookingCode: string;
  tourId: string;
  operatorUserId: number | string;
  status: 'Confirmed' | 'Completed' | 'Cancelled' | 'PendingPayment';
  departureDate: string; // YYYY-MM-DD
  completionDate?: string; // YYYY-MM-DD
  participantsCount: number;
  totalAmount: number;
  paidAmount: number;
  hasVerifiedPayment: boolean;
  refundedAmount?: number;
  refundCompletedDate?: string; // YYYY-MM-DD
}

export const DEMO_OPERATOR_TOURS: DemoTourPackage[] = [
  // Tours owned by Operator 101
  {
    id: 'tour-142',
    tourCode: 'TP-0142',
    operatorUserId: 101,
    title: 'Ba Na Hills Full-Day Tour',
  },
  {
    id: 'tour-148',
    tourCode: 'TP-0148',
    operatorUserId: 101,
    title: 'Hoi An Ancient Town Walking Tour',
  },
  {
    id: 'tour-55',
    tourCode: 'TP-0055',
    operatorUserId: 101,
    title: 'Da Nang Street Food & Night Market Adventure',
  },
  // Tours owned by foreign Operator 202 (BR-105 isolation)
  {
    id: 'tour-89',
    tourCode: 'TP-0089',
    operatorUserId: 202,
    title: 'Ha Long Bay 2-Day Luxury Cruise',
  },
  {
    id: 'tour-202',
    tourCode: 'TP-0202',
    operatorUserId: 202,
    title: 'Sapa Trekking & Muong Hoa Valley Homestay',
  },
];

export const INITIAL_DEMO_REVENUE_BOOKINGS: DemoBookingRecord[] = [
  // Operator 101 - September 2026 bookings
  {
    id: 'bk-0141',
    bookingCode: 'BK-20260919-0141',
    tourId: 'tour-142',
    operatorUserId: 101,
    status: 'Confirmed',
    departureDate: '2026-09-19',
    participantsCount: 4,
    totalAmount: 5600000,
    paidAmount: 5600000,
    hasVerifiedPayment: true,
  },
  {
    id: 'bk-0148',
    bookingCode: 'BK-20260914-0148',
    tourId: 'tour-142',
    operatorUserId: 101,
    status: 'Confirmed',
    departureDate: '2026-09-14',
    participantsCount: 2,
    totalAmount: 2800000,
    paidAmount: 2800000,
    hasVerifiedPayment: true,
  },
  {
    id: 'bk-0142',
    bookingCode: 'BK-20260912-0142',
    tourId: 'tour-148',
    operatorUserId: 101,
    status: 'Completed',
    departureDate: '2026-09-12',
    completionDate: '2026-09-12',
    participantsCount: 5,
    totalAmount: 3500000,
    paidAmount: 3500000,
    hasVerifiedPayment: true,
  },
  {
    id: 'bk-0143',
    bookingCode: 'BK-20260910-0143',
    tourId: 'tour-55',
    operatorUserId: 101,
    status: 'Completed',
    departureDate: '2026-09-10',
    completionDate: '2026-09-10',
    participantsCount: 3,
    totalAmount: 2100000,
    paidAmount: 2100000,
    hasVerifiedPayment: true,
  },
  {
    // Cancelled booking with COMPLETED refund in September 2026
    id: 'bk-0110',
    bookingCode: 'BK-20260905-0110',
    tourId: 'tour-142',
    operatorUserId: 101,
    status: 'Cancelled',
    departureDate: '2026-09-08',
    participantsCount: 2,
    totalAmount: 2800000,
    paidAmount: 2800000,
    hasVerifiedPayment: true,
    refundedAmount: 1400000, // 50% refund completed
    refundCompletedDate: '2026-09-06',
  },
  {
    // Pending payment booking -> MUST NOT count in revenue (BR-109)
    id: 'bk-0146',
    bookingCode: 'BK-20260913-0146',
    tourId: 'tour-55',
    operatorUserId: 101,
    status: 'PendingPayment',
    departureDate: '2026-09-13',
    participantsCount: 2,
    totalAmount: 1400000,
    paidAmount: 0,
    hasVerifiedPayment: false,
  },
  {
    // Cancelled without payment -> MUST NOT count
    id: 'bk-0099',
    bookingCode: 'BK-20260902-0099',
    tourId: 'tour-148',
    operatorUserId: 101,
    status: 'Cancelled',
    departureDate: '2026-09-03',
    participantsCount: 1,
    totalAmount: 700000,
    paidAmount: 0,
    hasVerifiedPayment: false,
  },

  // Operator 101 - August 2026 bookings (for historical & settlement tests)
  {
    id: 'bk-0081',
    bookingCode: 'BK-20260815-0081',
    tourId: 'tour-142',
    operatorUserId: 101,
    status: 'Completed',
    departureDate: '2026-08-15',
    completionDate: '2026-08-15',
    participantsCount: 10,
    totalAmount: 14000000,
    paidAmount: 14000000,
    hasVerifiedPayment: true,
  },
  {
    id: 'bk-0082',
    bookingCode: 'BK-20260822-0082',
    tourId: 'tour-148',
    operatorUserId: 101,
    status: 'Completed',
    departureDate: '2026-08-22',
    completionDate: '2026-08-22',
    participantsCount: 8,
    totalAmount: 5600000,
    paidAmount: 5600000,
    hasVerifiedPayment: true,
  },

  // Foreign Operator 202 bookings (BR-105 isolation)
  {
    id: 'bk-0201',
    bookingCode: 'BK-20260918-0201',
    tourId: 'tour-89',
    operatorUserId: 202,
    status: 'Confirmed',
    departureDate: '2026-09-18',
    participantsCount: 6,
    totalAmount: 36000000,
    paidAmount: 36000000,
    hasVerifiedPayment: true,
  },
  {
    id: 'bk-0202',
    bookingCode: 'BK-20260920-0202',
    tourId: 'tour-202',
    operatorUserId: 202,
    status: 'Completed',
    departureDate: '2026-09-20',
    completionDate: '2026-09-20',
    participantsCount: 4,
    totalAmount: 12000000,
    paidAmount: 12000000,
    hasVerifiedPayment: true,
  },
];

export const DEMO_PLATFORM_COMMISSION_RATE = 10; // 10%
