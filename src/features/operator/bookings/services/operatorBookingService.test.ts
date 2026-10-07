import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelCustomerBooking,
  getOperatorBookingById,
  getOperatorBookings,
  initiateBookingRefund,
  resetDemoBookingsState,
} from './operatorBookingService';
import { calculateDemoBookingRefundPreview } from '../data/operatorBookingDemoPolicy';
import { INITIAL_DEMO_BOOKINGS } from '../data/operatorBookingDemoFixtures';
import {
  OPERATOR_BOOKING_DEFAULT_PAGE_SIZE,
  OPERATOR_BOOKING_MESSAGES,
} from '../types/bookingLifecycle';

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
      it('returns empty list, default pageSize=20, and PENDING_BE_INTEGRATION notice when isDemo is false', async () => {
        const result = await getOperatorBookings({}, { isDemo: false });
        expect(result.items).toEqual([]);
        expect(result.totalCount).toBe(0);
        expect(result.pageSize).toBe(OPERATOR_BOOKING_DEFAULT_PAGE_SIZE);
        expect(result.pageSize).toBe(20);
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
          { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Customer requested' },
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

    describe('Demo mode retrieval, metrics, default pageSize=20, and filters', () => {
      it('defaults pageSize to 20 (CR-01 / BR-52) and returns operator-owned bookings with summary metrics', async () => {
        const result = await getOperatorBookings({}, { isDemo: true, demoActorUserId: 101 });
        expect(result.pageSize).toBe(20);
        expect(result.pageSize).toBe(OPERATOR_BOOKING_DEFAULT_PAGE_SIZE);
        expect(result.items.length).toBe(6);
        expect(result.totalCount).toBe(6); // 6 owned out of 7 total in fixtures
        expect(result.summary.totalBookings).toBe(6);
        expect(result.summary.totalParticipants).toBe(19);
        // Confirmed (3) + Completed (1) = 5600000 + 3500000 + 1100000 + 2100000 = 12300000
        expect(result.summary.totalConfirmedAmount).toBe(12300000);
      });

      it('fails closed with MSG126 when demoActorUserId is missing in Demo mode (BR-105)', async () => {
        const result = await getOperatorBookings({}, { isDemo: true });
        expect(result.items).toEqual([]);
        expect(result.totalCount).toBe(0);
        expect(result.summary.totalBookings).toBe(0);
        expect(result.errorMessage).toBe(OPERATOR_BOOKING_MESSAGES.MSG126);
      });

      it('enforces BR-105: excludes bookings owned by other operators for actor 101', async () => {
        const result = await getOperatorBookings({}, { isDemo: true, demoActorUserId: 101 });
        const hasOtherOperator = result.items.some((b) => b.operatorUserId !== 101);
        expect(hasOtherOperator).toBe(false);
      });

      it('enforces BR-105: actor 999 cannot see operator 101 bookings', async () => {
        const result = await getOperatorBookings({}, { isDemo: true, demoActorUserId: 999 });
        expect(result.items.length).toBe(1);
        expect(result.items[0].id).toBe('booking-9999');
        expect(result.items.some((b) => b.operatorUserId === 101)).toBe(false);
      });

      it('filters bookings by tourId', async () => {
        const result = await getOperatorBookings(
          { tourId: 'tour-142' },
          { isDemo: true, demoActorUserId: 101 }
        );
        expect(result.items.length).toBe(3); // BK-0141, BK-0148, BK-0110
        expect(result.items.every((b) => b.tourId === 'tour-142')).toBe(true);
      });

      it('filters bookings by status', async () => {
        const result = await getOperatorBookings(
          { status: 'PendingPayment' },
          { isDemo: true, demoActorUserId: 101 }
        );
        expect(result.items.length).toBe(1);
        expect(result.items[0].bookingCode).toBe('BK-20260913-0146');
      });

      it('filters bookings by departure date range', async () => {
        const result = await getOperatorBookings(
          { startDate: '2026-09-12', endDate: '2026-09-14' },
          { isDemo: true, demoActorUserId: 101 }
        );
        expect(result.items.length).toBe(3); // 12th, 13th, 14th
      });

      it('returns MSG29 when startDate is after endDate', async () => {
        const result = await getOperatorBookings(
          { startDate: '2026-09-20', endDate: '2026-09-10' },
          { isDemo: true, demoActorUserId: 101 }
        );
        expect(result.errorMessage).toBe(OPERATOR_BOOKING_MESSAGES.MSG29);
        expect(result.items).toEqual([]);
      });

      it('searches by booking code case-insensitively', async () => {
        const result = await getOperatorBookings(
          { searchKeyword: '0141' },
          { isDemo: true, demoActorUserId: 101 }
        );
        expect(result.items.length).toBe(1);
        expect(result.items[0].bookingCode).toBe('BK-20260919-0141');
      });

      it('searches by contact name case-insensitively', async () => {
        const result = await getOperatorBookings(
          { searchKeyword: 'văn an' },
          { isDemo: true, demoActorUserId: 101 }
        );
        expect(result.items.length).toBe(1);
        expect(result.items[0].contactName).toBe('Nguyễn Văn An');
      });

      it('returns MSG128 when no bookings match filters', async () => {
        const result = await getOperatorBookings(
          { searchKeyword: 'non-existent-booking-12345' },
          { isDemo: true, demoActorUserId: 101 }
        );
        expect(result.errorMessage).toBe(OPERATOR_BOOKING_MESSAGES.MSG128);
        expect(result.items).toEqual([]);
      });

      it('paginates results according to CR-01 / BR-52', async () => {
        const resultPage1 = await getOperatorBookings(
          { page: 1, pageSize: 2 },
          { isDemo: true, demoActorUserId: 101 }
        );
        expect(resultPage1.items.length).toBe(2);
        expect(resultPage1.page).toBe(1);
        expect(resultPage1.totalPages).toBe(3);

        const resultPage2 = await getOperatorBookings(
          { page: 2, pageSize: 2 },
          { isDemo: true, demoActorUserId: 101 }
        );
        expect(resultPage2.items.length).toBe(2);
        expect(resultPage2.items[0].id).not.toBe(resultPage1.items[0].id);
      });
    });

    describe('Booking Detail retrieval (BR-105 & BR-77)', () => {
      it('returns booking detail with immutable payment information', async () => {
        const res = await getOperatorBookingById('booking-0141', {
          isDemo: true,
          demoActorUserId: 101,
        });
        expect(res.booking).toBeDefined();
        expect(res.booking?.bookingCode).toBe('BK-20260919-0141');
        expect(res.booking?.paymentTransaction?.status).toBe('Success');
        expect(res.booking?.paymentTransaction?.amount).toBe(5600000);
      });

      it('fails closed with MSG126 when demoActorUserId is missing', async () => {
        const res = await getOperatorBookingById('booking-0141', { isDemo: true });
        expect(res.booking).toBeUndefined();
        expect(res.messageCode).toBe('MSG126');
        expect(res.error).toBe(OPERATOR_BOOKING_MESSAGES.MSG126);
      });

      it('enforces BR-105: returns MSG126 when operator 101 requests booking-9999', async () => {
        const res = await getOperatorBookingById('booking-9999', {
          isDemo: true,
          demoActorUserId: 101,
        });
        expect(res.booking).toBeUndefined();
        expect(res.messageCode).toBe('MSG126');
        expect(res.error).toBe(OPERATOR_BOOKING_MESSAGES.MSG126);
      });

      it('enforces BR-105: returns MSG126 when operator 999 requests operator 101 booking', async () => {
        const res = await getOperatorBookingById('booking-0141', {
          isDemo: true,
          demoActorUserId: 999,
        });
        expect(res.booking).toBeUndefined();
        expect(res.messageCode).toBe('MSG126');
        expect(res.error).toBe(OPERATOR_BOOKING_MESSAGES.MSG126);
      });

      it('returns MSG128 for non-existent booking ID', async () => {
        const res = await getOperatorBookingById('invalid-id', {
          isDemo: true,
          demoActorUserId: 101,
        });
        expect(res.messageCode).toBe('MSG128');
      });
    });
  });

  describe('UC-41 Cancel Customer Booking', () => {
    it('fails closed with MSG126 when demoActorUserId is missing (BR-105)', async () => {
      const res = await cancelCustomerBooking(
        'booking-0141',
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Valid cancellation reason' },
        { isDemo: true }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG126');
      expect(res.message).toBe(OPERATOR_BOOKING_MESSAGES.MSG126);
    });

    it('requires cancellation reason detail -> MSG123 (BR-106)', async () => {
      const res = await cancelCustomerBooking(
        'booking-0141',
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: '   ' },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG123');
      expect(res.message).toBe(OPERATOR_BOOKING_MESSAGES.MSG123);
    });

    it('rejects cancellation of booking owned by another operator -> MSG126 (BR-105)', async () => {
      const res = await cancelCustomerBooking(
        'booking-9999',
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Valid cancellation reason' },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG126');
      expect(res.message).toBe(OPERATOR_BOOKING_MESSAGES.MSG126);

      const foreignActorAttempt = await cancelCustomerBooking(
        'booking-0141',
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Valid cancellation reason' },
        { isDemo: true, demoActorUserId: 999 }
      );
      expect(foreignActorAttempt.success).toBe(false);
      expect(foreignActorAttempt.messageCode).toBe('MSG126');
    });

    it('rejects cancellation of already cancelled booking -> MSG133', async () => {
      const res = await cancelCustomerBooking(
        'booking-0110', // already Cancelled in fixture
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Valid cancellation reason' },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG133');
      expect(res.message).toBe(OPERATOR_BOOKING_MESSAGES.MSG133);
    });

    it('rejects cancellation of already completed booking -> MSG133', async () => {
      const res = await cancelCustomerBooking(
        'booking-0095', // Completed
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Valid cancellation reason' },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG133');
    });

    it('rejects cancellation of already checked-in booking -> MSG95', async () => {
      const res = await cancelCustomerBooking(
        'booking-0148', // CheckedIn
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Valid cancellation reason' },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG95');
      expect(res.message).toBe(OPERATOR_BOOKING_MESSAGES.MSG95);
    });

    it('blocks normal cancellation when cancellation window has passed -> MSG82 and leaves booking/slots/refund unchanged', async () => {
      const res = await cancelCustomerBooking(
        'booking-0144', // cancellationWindowExpired: true (<24h)
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Valid cancellation reason' },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG82');
      expect(res.message).toBe(OPERATOR_BOOKING_MESSAGES.MSG82);

      // Verify booking state is untouched, slots remain held, QR remains valid, and no refund is created
      const afterCheck = await getOperatorBookingById('booking-0144', {
        isDemo: true,
        demoActorUserId: 101,
      });
      expect(afterCheck.booking?.status).toBe('Confirmed');
      expect(afterCheck.booking?.participantsCount).toBe(2);
      expect(afterCheck.booking?.qrTicketValid).toBe(true);
      expect(afterCheck.booking?.refund).toBeUndefined();
    });

    it('cancels pending payment booking successfully without refund trigger', async () => {
      const res = await cancelCustomerBooking(
        'booking-0146', // PendingPayment, paidAmount = 0
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Customer changed travel plans' },
        { isDemo: true, demoActorUserId: 101 }
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
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Customer requested early cancellation' },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(res.success).toBe(true);
      expect(res.messageCode).toBe('MSG81');
      expect(res.refundTriggered).toBe(true);
      expect(res.booking?.status).toBe('Cancelled');
      expect(res.booking?.qrTicketValid).toBe(false); // BR-86 invalidated
      expect(res.booking?.cancellationReason).toBe('Customer requested early cancellation');
      // Refund is a separate record
      expect(res.booking?.refund).toBeDefined();
      expect(res.booking?.refund?.refundableAmount).toBe(5600000);
      expect(res.booking?.refund?.status).toBe('Success');
      // Original transaction remains immutable (BR-77)
      expect(res.booking?.paymentTransaction?.status).toBe('Success');
      expect(res.booking?.paymentTransaction?.amount).toBe(5600000);
    });
  });

  describe('UC-42 Initiate Booking Refund', () => {
    it('fails closed with MSG126 when demoActorUserId is missing (BR-105)', async () => {
      const res = await initiateBookingRefund('booking-0141', {}, { isDemo: true });
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG126');
      expect(res.message).toBe(OPERATOR_BOOKING_MESSAGES.MSG126);
    });

    it('rejects refund for booking owned by another operator -> MSG126 (BR-105)', async () => {
      const res = await initiateBookingRefund(
        'booking-9999',
        {},
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG126');

      const foreignActorAttempt = await initiateBookingRefund(
        'booking-0141',
        {},
        { isDemo: true, demoActorUserId: 999 }
      );
      expect(foreignActorAttempt.success).toBe(false);
      expect(foreignActorAttempt.messageCode).toBe('MSG126');
    });

    it('rejects refund if booking has no verified paid transaction -> MSG84', async () => {
      const res = await initiateBookingRefund(
        'booking-0146',
        {},
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG84');
      expect(res.message).toBe(OPERATOR_BOOKING_MESSAGES.MSG84);
    });

    it('rejects refund if policy ineligible / cancellation window expired -> MSG84', async () => {
      const res = await initiateBookingRefund(
        'booking-0144',
        {},
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG84');
    });

    it('rejects duplicate refund when Success refund already exists -> MSG133 (BR-74 Idempotency)', async () => {
      const res = await initiateBookingRefund(
        'booking-0110',
        {},
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG133');
      expect(res.message).toBe(OPERATOR_BOOKING_MESSAGES.MSG133);
      expect(res.refund?.id).toBe('rf-0110');
    });

    it('initiates refund successfully for eligible booking and blocks duplicate initiation (BR-83, BR-74, BR-77, BR-107)', async () => {
      const res = await initiateBookingRefund(
        'booking-0141',
        { notes: 'Refund to customer according to policy' },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(res.success).toBe(true);
      expect(res.messageCode).toBe('MSG83');
      expect(res.refund?.refundableAmount).toBe(5600000);
      expect(res.refund?.paymentChannel).toBe('VNPay'); // BR-76 original payment channel
      expect(res.refund?.status).toBe('Success');

      // Subsequent call must be idempotent -> MSG133 without creating another record
      const duplicateRes = await initiateBookingRefund(
        'booking-0141',
        { notes: 'Second attempt' },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(duplicateRes.success).toBe(false);
      expect(duplicateRes.messageCode).toBe('MSG133');
      expect(duplicateRes.refund?.id).toBe(res.refund?.id);
    });

    it('does NOT trigger hidden failure branches when user notes contain "timeout", "retry", or "system"', async () => {
      const timeoutNoteRes = await initiateBookingRefund(
        'booking-0141',
        { notes: 'Customer reported timeout during rebooking so refund requested' },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(timeoutNoteRes.success).toBe(true);
      expect(timeoutNoteRes.messageCode).toBe('MSG83');
      expect(timeoutNoteRes.refund?.notes).toBe('Customer reported timeout during rebooking so refund requested');

      resetDemoBookingsState();
      const retryNoteRes = await initiateBookingRefund(
        'booking-0141',
        { notes: 'Customer asked to retry booking on another date' },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(retryNoteRes.success).toBe(true);
      expect(retryNoteRes.messageCode).toBe('MSG83');
      expect(retryNoteRes.refund?.notes).toBe('Customer asked to retry booking on another date');

      resetDemoBookingsState();
      const systemNoteRes = await initiateBookingRefund(
        'booking-0141',
        { notes: 'Verified in internal system ledger' },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(systemNoteRes.success).toBe(true);
      expect(systemNoteRes.messageCode).toBe('MSG83');
      expect(systemNoteRes.refund?.notes).toBe('Verified in internal system ledger');
    });

    it('handles simulated gateway timeout only via explicit service option -> MSG89', async () => {
      const res = await initiateBookingRefund(
        'booking-0141',
        { notes: 'Ghi chú bình thường' },
        { isDemo: true, demoActorUserId: 101, simulateFailureMode: 'timeout' }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG89');
      expect(res.message).toBe(OPERATOR_BOOKING_MESSAGES.MSG89);
    });

    it('handles simulated system failure only via explicit service option -> MSG127', async () => {
      const res = await initiateBookingRefund(
        'booking-0141',
        { notes: 'Ghi chú bình thường' },
        { isDemo: true, demoActorUserId: 101, simulateFailureMode: 'system' }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG127');
    });

    it('enforces BR-74 & BR-134 on Failed refund: blocks duplicate creation with MSG133 and retries on the SAME refund record', async () => {
      // 1. Initial attempt fails and is queued for retry (MSG153)
      const initialFailed = await initiateBookingRefund(
        'booking-0141',
        { notes: 'Lần thử đầu tiên' },
        { isDemo: true, demoActorUserId: 101, simulateFailureMode: 'retry' }
      );
      expect(initialFailed.success).toBe(false);
      expect(initialFailed.messageCode).toBe('MSG153');
      expect(initialFailed.refund?.status).toBe('Failed');
      expect(initialFailed.refund?.attemptCount).toBe(1);
      const originalRefundId = initialFailed.refund?.id;
      expect(originalRefundId).toBeDefined();

      // 2. Normal manual initiation when Failed refund already exists MUST be blocked with MSG133
      // and MUST NOT create a second refund record
      const manualDuplicateAttempt = await initiateBookingRefund(
        'booking-0141',
        { notes: 'Attempt to create new refund record' },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(manualDuplicateAttempt.success).toBe(false);
      expect(manualDuplicateAttempt.messageCode).toBe('MSG133');
      expect(manualDuplicateAttempt.refund?.id).toBe(originalRefundId);
      expect(manualDuplicateAttempt.refund?.attemptCount).toBe(1);

      // 3. Explicit retry on the Failed refund updates the SAME refund record and increments attemptCount
      const retryAttemptStillFailed = await initiateBookingRefund(
        'booking-0141',
        { notes: 'Retry 2 still network error' },
        {
          isDemo: true,
          demoActorUserId: 101,
          retryFailedRefund: true,
          simulateFailureMode: 'retry',
        }
      );
      expect(retryAttemptStillFailed.success).toBe(false);
      expect(retryAttemptStillFailed.messageCode).toBe('MSG153');
      expect(retryAttemptStillFailed.refund?.id).toBe(originalRefundId);
      expect(retryAttemptStillFailed.refund?.attemptCount).toBe(2);
      expect(retryAttemptStillFailed.refund?.status).toBe('Failed');

      // 4. Subsequent retry succeeds on the SAME refund record (attemptCount = 3)
      const retrySuccess = await initiateBookingRefund(
        'booking-0141',
        { notes: 'Retry 3 success' },
        {
          isDemo: true,
          demoActorUserId: 101,
          retryFailedRefund: true,
        }
      );
      expect(retrySuccess.success).toBe(true);
      expect(retrySuccess.messageCode).toBe('MSG83');
      expect(retrySuccess.refund?.id).toBe(originalRefundId);
      expect(retrySuccess.refund?.attemptCount).toBe(3);
      expect(retrySuccess.refund?.status).toBe('Success');

      // Original payment transaction remains immutable (BR-77)
      const detail = await getOperatorBookingById('booking-0141', {
        isDemo: true,
        demoActorUserId: 101,
      });
      expect(detail.booking?.paymentTransaction?.id).toBe('tx-0141');
      expect(detail.booking?.paymentTransaction?.amount).toBe(5600000);
      expect(detail.booking?.paymentTransaction?.status).toBe('Success');
    });
  });

  describe('operatorBookingDemoPolicy (Demo-only refund preview)', () => {
    it('calculates Demo-only refund preview without claiming production authority', () => {
      const paidEligible = INITIAL_DEMO_BOOKINGS[0];
      const previewEligible = calculateDemoBookingRefundPreview(paidEligible);
      expect(previewEligible.eligible).toBe(true);
      expect(previewEligible.refundableAmount).toBe(5600000);
      expect(previewEligible.policyApplied).toContain('Demo');

      const unpaid = INITIAL_DEMO_BOOKINGS[2];
      const previewUnpaid = calculateDemoBookingRefundPreview(unpaid);
      expect(previewUnpaid.eligible).toBe(false);
      expect(previewUnpaid.refundableAmount).toBe(0);

      const expired = INITIAL_DEMO_BOOKINGS[3];
      const previewExpired = calculateDemoBookingRefundPreview(expired);
      expect(previewExpired.eligible).toBe(false);
      expect(previewExpired.refundableAmount).toBe(0);
      expect(previewExpired.deductionAmount).toBe(1100000);
    });
  });
});
