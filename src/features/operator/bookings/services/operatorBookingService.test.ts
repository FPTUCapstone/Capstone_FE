import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelCustomerBooking,
  getOperatorBookingById,
  getOperatorBookings,
  initiateBookingRefund,
  resetDemoBookingsState,
} from './operatorBookingService';
import { OPERATOR_BOOKING_MESSAGES } from '../types/bookingLifecycle';

describe('operatorBookingService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      NEXT_PUBLIC_ENABLE_DEMO_FIXTURES: 'true',
    };
    resetDemoBookingsState();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('UC-40 View Customer Bookings', () => {
    describe('Production NO_BACKEND truthfulness', () => {
      it('returns empty list and PENDING_BE_INTEGRATION notice when isDemo is false', async () => {
        const result = await getOperatorBookings({}, { isDemo: false });
        expect(result.items).toEqual([]);
        expect(result.totalCount).toBe(0);
        expect(result.summary.totalBookings).toBe(0);
        expect(result.summary.totalConfirmedAmount).toBe(0);
        expect(result.pendingBackendNotice).toBe(OPERATOR_BOOKING_MESSAGES.PENDING_BE_INTEGRATION);
      });

      it('returns pending notice for detail view when isDemo is false', async () => {
        const result = await getOperatorBookingById('booking-0141', { isDemo: false });
        expect(result.booking).toBeUndefined();
        expect(result.error).toBe(OPERATOR_BOOKING_MESSAGES.PENDING_BE_INTEGRATION);
        expect(result.messageCode).toBe('PENDING_BE_INTEGRATION');
      });

      it('disallows cancellation in production mode without backend', async () => {
        const result = await cancelCustomerBooking(
          'booking-0141',
          { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Khách yêu cầu' },
          { isDemo: false }
        );
        expect(result.success).toBe(false);
        expect(result.messageCode).toBe('PENDING_BE_INTEGRATION');
      });

      it('disallows initiating refund in production mode without backend', async () => {
        const result = await initiateBookingRefund('booking-0141', {}, { isDemo: false });
        expect(result.success).toBe(false);
        expect(result.messageCode).toBe('PENDING_BE_INTEGRATION');
      });
    });

    describe('Demo mode retrieval, metrics, and filters', () => {
      it('returns operator-owned bookings with calculated summary metrics', async () => {
        const result = await getOperatorBookings({}, { isDemo: true, operatorUserId: 101 });
        expect(result.items.length).toBeGreaterThan(0);
        expect(result.totalCount).toBe(6); // 6 owned out of 7 total in fixtures
        expect(result.summary.totalBookings).toBe(6);
        expect(result.summary.totalParticipants).toBe(19);
        // Confirmed (4) + Completed (1) = 5600000 + 3500000 + 1100000 + 2100000 = 12300000
        expect(result.summary.totalConfirmedAmount).toBe(12300000);
      });

      it('enforces BR-105: excludes bookings owned by other operators', async () => {
        const result = await getOperatorBookings({}, { isDemo: true, operatorUserId: 101 });
        const hasOtherOperator = result.items.some((b) => b.operatorUserId !== 101);
        expect(hasOtherOperator).toBe(false);
      });

      it('filters bookings by tourId', async () => {
        const result = await getOperatorBookings(
          { tourId: 'tour-142' },
          { isDemo: true, operatorUserId: 101 }
        );
        expect(result.items.length).toBe(3); // BK-0141, BK-0148, BK-0110
        expect(result.items.every((b) => b.tourId === 'tour-142')).toBe(true);
      });

      it('filters bookings by status', async () => {
        const result = await getOperatorBookings(
          { status: 'PendingPayment' },
          { isDemo: true, operatorUserId: 101 }
        );
        expect(result.items.length).toBe(1);
        expect(result.items[0].bookingCode).toBe('BK-20260913-0146');
      });

      it('filters bookings by departure date range', async () => {
        const result = await getOperatorBookings(
          { startDate: '2026-09-12', endDate: '2026-09-14' },
          { isDemo: true, operatorUserId: 101 }
        );
        expect(result.items.length).toBe(3); // 12th, 13th, 14th
      });

      it('returns MSG29 when startDate is after endDate', async () => {
        const result = await getOperatorBookings(
          { startDate: '2026-09-20', endDate: '2026-09-10' },
          { isDemo: true, operatorUserId: 101 }
        );
        expect(result.errorMessage).toBe(OPERATOR_BOOKING_MESSAGES.MSG29);
        expect(result.items).toEqual([]);
      });

      it('searches by booking code case-insensitively', async () => {
        const result = await getOperatorBookings(
          { searchKeyword: '0141' },
          { isDemo: true, operatorUserId: 101 }
        );
        expect(result.items.length).toBe(1);
        expect(result.items[0].bookingCode).toBe('BK-20260919-0141');
      });

      it('searches by contact name case-insensitively', async () => {
        const result = await getOperatorBookings(
          { searchKeyword: 'văn an' },
          { isDemo: true, operatorUserId: 101 }
        );
        expect(result.items.length).toBe(1);
        expect(result.items[0].contactName).toBe('Nguyễn Văn An');
      });

      it('returns MSG128 when no bookings match filters', async () => {
        const result = await getOperatorBookings(
          { searchKeyword: 'non-existent-booking-12345' },
          { isDemo: true, operatorUserId: 101 }
        );
        expect(result.errorMessage).toBe(OPERATOR_BOOKING_MESSAGES.MSG128);
        expect(result.items).toEqual([]);
      });

      it('paginates results according to CR-01 / BR-52', async () => {
        const resultPage1 = await getOperatorBookings(
          { page: 1, pageSize: 2 },
          { isDemo: true, operatorUserId: 101 }
        );
        expect(resultPage1.items.length).toBe(2);
        expect(resultPage1.page).toBe(1);
        expect(resultPage1.totalPages).toBe(3);

        const resultPage2 = await getOperatorBookings(
          { page: 2, pageSize: 2 },
          { isDemo: true, operatorUserId: 101 }
        );
        expect(resultPage2.items.length).toBe(2);
        expect(resultPage2.items[0].id).not.toBe(resultPage1.items[0].id);
      });
    });

    describe('Booking Detail retrieval (BR-105 & BR-77)', () => {
      it('returns booking detail with immutable payment information', async () => {
        const res = await getOperatorBookingById('booking-0141', { isDemo: true, operatorUserId: 101 });
        expect(res.booking).toBeDefined();
        expect(res.booking?.bookingCode).toBe('BK-20260919-0141');
        expect(res.booking?.paymentTransaction?.status).toBe('Success');
        expect(res.booking?.paymentTransaction?.amount).toBe(5600000);
      });

      it('enforces BR-105: returns MSG126 when requesting booking belonging to another operator', async () => {
        const res = await getOperatorBookingById('booking-9999', { isDemo: true, operatorUserId: 101 });
        expect(res.booking).toBeUndefined();
        expect(res.messageCode).toBe('MSG126');
        expect(res.error).toBe(OPERATOR_BOOKING_MESSAGES.MSG126);
      });

      it('returns MSG128 for non-existent booking ID', async () => {
        const res = await getOperatorBookingById('invalid-id', { isDemo: true, operatorUserId: 101 });
        expect(res.messageCode).toBe('MSG128');
      });
    });
  });

  describe('UC-41 Cancel Customer Booking', () => {
    it('requires cancellation reason detail -> MSG123 (BR-106)', async () => {
      const res = await cancelCustomerBooking(
        'booking-0141',
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: '   ' },
        { isDemo: true, operatorUserId: 101 }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG123');
      expect(res.message).toBe(OPERATOR_BOOKING_MESSAGES.MSG123);
    });

    it('rejects cancellation of booking owned by another operator -> MSG126 (BR-105)', async () => {
      const res = await cancelCustomerBooking(
        'booking-9999',
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Lý do hợp lệ' },
        { isDemo: true, operatorUserId: 101 }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG126');
      expect(res.message).toBe(OPERATOR_BOOKING_MESSAGES.MSG126);
    });

    it('rejects cancellation of already cancelled booking -> MSG133', async () => {
      const res = await cancelCustomerBooking(
        'booking-0110', // already Cancelled in fixture
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Lý do hợp lệ' },
        { isDemo: true, operatorUserId: 101 }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG133');
      expect(res.message).toBe(OPERATOR_BOOKING_MESSAGES.MSG133);
    });

    it('rejects cancellation of already completed booking -> MSG133', async () => {
      const res = await cancelCustomerBooking(
        'booking-0095', // Completed
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Lý do hợp lệ' },
        { isDemo: true, operatorUserId: 101 }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG133');
    });

    it('rejects cancellation of already checked-in booking -> MSG95', async () => {
      const res = await cancelCustomerBooking(
        'booking-0148', // CheckedIn
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Lý do hợp lệ' },
        { isDemo: true, operatorUserId: 101 }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG95');
      expect(res.message).toBe(OPERATOR_BOOKING_MESSAGES.MSG95);
    });

    it('rejects cancellation when cancellation window has passed -> MSG82', async () => {
      const res = await cancelCustomerBooking(
        'booking-0144', // cancellationWindowExpired: true (<24h)
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Lý do hợp lệ' },
        { isDemo: true, operatorUserId: 101 }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG82');
      expect(res.message).toBe(OPERATOR_BOOKING_MESSAGES.MSG82);
    });

    it('cancels pending payment booking successfully without refund trigger', async () => {
      const res = await cancelCustomerBooking(
        'booking-0146', // PendingPayment, paidAmount = 0
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Khách hàng đổi kế hoạch' },
        { isDemo: true, operatorUserId: 101 }
      );
      expect(res.success).toBe(true);
      expect(res.messageCode).toBe('MSG81');
      expect(res.refundTriggered).toBe(false);
      expect(res.booking?.status).toBe('Cancelled');
      expect(res.booking?.qrTicketValid).toBe(false); // BR-86
    });

    it('cancels paid booking successfully and triggers separate refund record (BR-86, BR-106, BR-107, BR-77)', async () => {
      const res = await cancelCustomerBooking(
        'booking-0141', // Confirmed, paid 5600000
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Khách hàng yêu cầu hủy vé sớm' },
        { isDemo: true, operatorUserId: 101 }
      );
      expect(res.success).toBe(true);
      expect(res.messageCode).toBe('MSG81');
      expect(res.refundTriggered).toBe(true);
      expect(res.booking?.status).toBe('Cancelled');
      expect(res.booking?.qrTicketValid).toBe(false); // BR-86 invalidated
      expect(res.booking?.cancellationReason).toBe('Khách hàng yêu cầu hủy vé sớm');
      // Refund is a separate record
      expect(res.booking?.refund).toBeDefined();
      expect(res.booking?.refund?.refundableAmount).toBe(5600000);
      expect(res.booking?.refund?.status).toBe('Success');
      // Original transaction remains immutable (BR-77)
      expect(res.booking?.paymentTransaction?.status).toBe('Success');
      expect(res.booking?.paymentTransaction?.amount).toBe(5600000);
    });

    it('handles simulated system failure -> MSG127', async () => {
      const res = await cancelCustomerBooking(
        'booking-0141',
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Lý do' },
        { isDemo: true, operatorUserId: 101, simulateFailure: true }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG127');
      expect(res.message).toBe(OPERATOR_BOOKING_MESSAGES.MSG127);
    });
  });

  describe('UC-42 Initiate Booking Refund', () => {
    it('rejects refund for booking owned by another operator -> MSG126 (BR-105)', async () => {
      const res = await initiateBookingRefund('booking-9999', {}, { isDemo: true, operatorUserId: 101 });
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG126');
    });

    it('rejects refund if booking has no verified paid transaction -> MSG84', async () => {
      const res = await initiateBookingRefund('booking-0146', {}, { isDemo: true, operatorUserId: 101 });
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG84');
      expect(res.message).toBe(OPERATOR_BOOKING_MESSAGES.MSG84);
    });

    it('rejects refund if policy ineligible / cancellation window expired -> MSG84', async () => {
      const res = await initiateBookingRefund('booking-0144', {}, { isDemo: true, operatorUserId: 101 });
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG84');
    });

    it('rejects duplicate refund when refund already exists -> MSG133 (BR-74 Idempotency)', async () => {
      const res = await initiateBookingRefund('booking-0110', {}, { isDemo: true, operatorUserId: 101 });
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG133');
      expect(res.message).toBe(OPERATOR_BOOKING_MESSAGES.MSG133);
      expect(res.refund?.id).toBe('rf-0110');
    });

    it('initiates refund successfully for eligible booking (BR-83, BR-77, BR-107)', async () => {
      const res = await initiateBookingRefund(
        'booking-0141',
        { notes: 'Hoàn tiền cho khách theo chính sách' },
        { isDemo: true, operatorUserId: 101 }
      );
      expect(res.success).toBe(true);
      expect(res.messageCode).toBe('MSG83');
      expect(res.refund?.refundableAmount).toBe(5600000);
      expect(res.refund?.paymentChannel).toBe('VNPay'); // BR-76 original payment channel
      expect(res.refund?.status).toBe('Success');

      // Subsequent call must be idempotent -> MSG133 without creating another record
      const duplicateRes = await initiateBookingRefund(
        'booking-0141',
        { notes: 'Bấm lần hai' },
        { isDemo: true, operatorUserId: 101 }
      );
      expect(duplicateRes.success).toBe(false);
      expect(duplicateRes.messageCode).toBe('MSG133');
      expect(duplicateRes.refund?.id).toBe(res.refund?.id);
    });

    it('handles simulated gateway timeout -> MSG89', async () => {
      const res = await initiateBookingRefund(
        'booking-0141',
        { simulateFailureMode: 'timeout' },
        { isDemo: true, operatorUserId: 101 }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG89');
      expect(res.message).toBe(OPERATOR_BOOKING_MESSAGES.MSG89);
    });

    it('handles simulated failure queued for retry -> MSG153 (BR-134)', async () => {
      const res = await initiateBookingRefund(
        'booking-0141',
        { simulateFailureMode: 'retry', notes: 'Lỗi mạng khi gọi cổng thanh toán' },
        { isDemo: true, operatorUserId: 101 }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG153');
      expect(res.refund?.status).toBe('Failed');
      expect(res.refund?.attemptCount).toBe(1);
    });

    it('handles simulated system failure -> MSG127', async () => {
      const res = await initiateBookingRefund(
        'booking-0141',
        { simulateFailureMode: 'system' },
        { isDemo: true, operatorUserId: 101 }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG127');
    });
  });
});
