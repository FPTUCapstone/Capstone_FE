import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelCustomerBooking,
  getBookingRefundStatus,
  getOperatorBookingById,
  getOperatorBookingTourOptions,
  getOperatorBookings,
  resetDemoBookingsState,
} from './operatorBookingService';
import { detailExample, listExample } from '../utils/bookingApiFixtures';
import { calculateDemoBookingRefundPreview } from '../data/operatorBookingDemoPolicy';
import { INITIAL_DEMO_BOOKINGS, toDemoDetailView } from '../data/operatorBookingDemoFixtures';
import {
  BOOKING_ERROR_CODES,
  CancellationReasonValue,
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
    describe('Cancel and refund outside demo mode (UC-41/UC-42 are not integrated yet)', () => {
      it('disallows cancellation in production mode without backend', async () => {
        const result = await cancelCustomerBooking(
          'booking-0141',
          { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Customer requested' },
          { isDemo: false }
        );
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
        // BE semantics: participants and amount count Confirmed + Completed only.
        // Confirmed 0141 (5) + Confirmed 0148 (3) + Completed 0095 (3) = 11 participants
        expect(result.summary.totalParticipants).toBe(11);
        // 5600000 + 3500000 + 2100000 = 11200000
        expect(result.summary.totalConfirmedAmount).toBe(11200000);
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
        expect(result.items.map((b) => b.bookingId)).not.toContain('booking-9999');
        expect(result.items.some((b) => 'operatorUserId' in b)).toBe(false);
      });

      it('enforces BR-105: actor 999 cannot see operator 101 bookings', async () => {
        const result = await getOperatorBookings({}, { isDemo: true, demoActorUserId: 999 });
        expect(result.items.length).toBe(1);
        expect(result.items[0].bookingId).toBe('booking-9999');
        expect(result.items.map((b) => b.bookingId)).not.toContain('booking-0141');
      });

      it('filters bookings by tourId', async () => {
        const result = await getOperatorBookings(
          { tourId: 'tour-142' },
          { isDemo: true, demoActorUserId: 101 }
        );
        expect(result.items.length).toBe(3); // BK-0141, BK-0148, BK-0110
        expect(result.items.every((b) => b.tour.tourId === 'tour-142')).toBe(true);
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

      it('returns MSG31 when startDate is after endDate', async () => {
        const result = await getOperatorBookings(
          { startDate: '2026-09-20', endDate: '2026-09-10' },
          { isDemo: true, demoActorUserId: 101 }
        );
        expect(result.errorMessage).toBe(OPERATOR_BOOKING_MESSAGES.MSG31);
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

      it('searches by booker e-mail case-insensitively (BE also matches e-mail)', async () => {
        const result = await getOperatorBookings(
          { searchKeyword: 'NAM.LE@' },
          { isDemo: true, demoActorUserId: 101 }
        );
        expect(result.items.length).toBe(1);
        expect(result.items[0].bookingCode).toBe('BK-20260912-0148');
      });

      it('searches by contact name case-insensitively', async () => {
        const result = await getOperatorBookings(
          { searchKeyword: 'văn an' },
          { isDemo: true, demoActorUserId: 101 }
        );
        expect(result.items.length).toBe(1);
        expect(result.items[0].booker.fullName).toBe('Nguyễn Văn An');
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
        expect(resultPage2.items[0].bookingId).not.toBe(resultPage1.items[0].bookingId);
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
        expect(res.booking?.payment?.status).toBe('Success');
        expect(res.booking?.payment?.amount).toBe(5600000);
        expect(res.booking?.paidAmount).toBe(5600000);
        expect(res.booking?.payment?.gateway).toBe('VNPAY');
      });

      it('returns the BE-shaped list item and detail (no age/notes, no operator id, Expired status)', async () => {
        const list = await getOperatorBookings({ status: 'Expired' }, { isDemo: true, demoActorUserId: 101 });
        expect(list.items.length).toBe(1);
        const item = list.items[0];
        expect(item.status).toBe('Expired');
        expect(item.paymentStatus).toBe('Unpaid');
        expect(item.quantity).toBe(2);
        expect(item.schedule.startAtUtc).toBeDefined();
        expect(item.booker.email).toBe('bao.dang@example.com');
        expect(item.checkedInAtUtc).toBeNull();

        const detail = await getOperatorBookingById('booking-0141', { isDemo: true, demoActorUserId: 101 });
        const pax = detail.booking?.participants[0];
        expect(pax).toEqual({ fullName: 'Nguyễn Văn An', participantType: 'Adult' });
        expect(detail.booking?.booker.phoneNumber).toBe('0901234567');
        expect(detail.booking?.coupon?.code).toBe('HE2026');
        expect(detail.booking?.subtotalAmount).toBe(
          (detail.booking?.totalAmount ?? 0) + (detail.booking?.discountAmount ?? 0)
        );
        expect(detail.booking && 'operatorUserId' in detail.booking).toBe(false);
      });

      it('derives canCancel and cancelBlockedReason like the BE (UC-41 operator rule)', async () => {
        const ids = ['booking-0141', 'booking-0146', 'booking-0148', 'booking-0110', 'booking-0095', 'booking-0144'];
        const views = await Promise.all(
          ids.map((id) => getOperatorBookingById(id, { isDemo: true, demoActorUserId: 101 }))
        );
        const decisions = views.map((v) => [v.booking?.canCancel, v.booking?.cancelBlockedReason]);
        expect(decisions).toEqual([
          [true, null], // 0141 Confirmed, not checked in
          [true, null], // 0146 PendingPayment
          [false, 'CheckedIn'], // 0148 Confirmed but checked in
          [false, 'InvalidStatus'], // 0110 Cancelled
          [false, 'InvalidStatus'], // 0095 Completed (terminal wins over checked in)
          [false, 'InvalidStatus'], // 0144 Expired
        ]);
      });

      it('fails closed with MSG126 when demoActorUserId is missing', async () => {
        const res = await getOperatorBookingById('booking-0141', { isDemo: true });
        expect(res.booking).toBeUndefined();
        expect(res.messageCode).toBe(BOOKING_ERROR_CODES.BOOKING_OWNERSHIP_DENIED);
        expect(res.error).toBe(OPERATOR_BOOKING_MESSAGES.MSG126);
      });

      it('enforces BR-105: returns MSG126 when operator 101 requests booking-9999', async () => {
        const res = await getOperatorBookingById('booking-9999', {
          isDemo: true,
          demoActorUserId: 101,
        });
        expect(res.booking).toBeUndefined();
        expect(res.messageCode).toBe(BOOKING_ERROR_CODES.BOOKING_OWNERSHIP_DENIED);
        expect(res.error).toBe(OPERATOR_BOOKING_MESSAGES.MSG126);
      });

      it('enforces BR-105: returns MSG126 when operator 999 requests operator 101 booking', async () => {
        const res = await getOperatorBookingById('booking-0141', {
          isDemo: true,
          demoActorUserId: 999,
        });
        expect(res.booking).toBeUndefined();
        expect(res.messageCode).toBe(BOOKING_ERROR_CODES.BOOKING_OWNERSHIP_DENIED);
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
      expect(res.messageCode).toBe(BOOKING_ERROR_CODES.BOOKING_OWNERSHIP_DENIED);
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
      expect(res.messageCode).toBe(BOOKING_ERROR_CODES.BOOKING_OWNERSHIP_DENIED);
      expect(res.message).toBe(OPERATOR_BOOKING_MESSAGES.MSG126);

      const foreignActorAttempt = await cancelCustomerBooking(
        'booking-0141',
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Valid cancellation reason' },
        { isDemo: true, demoActorUserId: 999 }
      );
      expect(foreignActorAttempt.success).toBe(false);
      expect(foreignActorAttempt.messageCode).toBe(BOOKING_ERROR_CODES.BOOKING_OWNERSHIP_DENIED);
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

    it('rejects cancellation of an Expired booking -> MSG133 and leaves it unchanged (no operator time window exists in UC-41)', async () => {
      const res = await cancelCustomerBooking(
        'booking-0144', // Expired
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Valid cancellation reason' },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(res.success).toBe(false);
      expect(res.messageCode).toBe('MSG133');

      const afterCheck = await getOperatorBookingById('booking-0144', {
        isDemo: true,
        demoActorUserId: 101,
      });
      expect(afterCheck.booking?.status).toBe('Expired');
      expect(afterCheck.booking?.quantity).toBe(2);
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
      expect(res.booking?.ticket).toBeNull(); // never issued while unpaid
      expect(res.booking?.canCancel).toBe(false);
      expect(res.booking?.cancelBlockedReason).toBe('InvalidStatus');
    });

    it('cancels paid booking successfully and marks refund follow-up required (BR-86, BR-106, BR-77, SRS_INTERNAL_CONFLICT_UC41_REFUND_TRIGGER)', async () => {
      const res = await cancelCustomerBooking(
        'booking-0141', // Confirmed, paid 5600000
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'Customer requested early cancellation' },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(res.success).toBe(true);
      expect(res.messageCode).toBe('MSG81');
      expect(res.refundTriggered).toBe(false);
      expect(res.refundFollowUpRequired).toBe(true);
      expect(res.booking?.status).toBe('Cancelled');
      expect(res.booking?.ticket?.status).toBe('Cancelled'); // BR-86 invalidated
      expect(res.booking?.cancelReason).toBe('Customer requested early cancellation');
      expect(res.booking?.cancellationReasonType).toBe('CUSTOMER_REQUEST');
      // Under safe implementation for SRS_INTERNAL_CONFLICT_UC41_REFUND_TRIGGER,
      // cancellation does NOT auto-create a refund record
      expect(res.booking?.refund).toBeUndefined();
      // Original transaction remains immutable (BR-77)
      expect(res.booking?.payment?.status).toBe('Success');
      expect(res.booking?.payment?.amount).toBe(5600000);
    });

    it('cancels booking with FORCE_MAJEURE reason type and preserves both category and detail', async () => {
      const res = await cancelCustomerBooking(
        'booking-0141',
        { reasonType: 'FORCE_MAJEURE', reasonDetail: 'Severe weather alert in Mekong delta' },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(res.success).toBe(true);
      expect(res.messageCode).toBe('MSG81');
      expect(res.booking?.status).toBe('Cancelled');
      expect(res.booking?.cancellationReasonType).toBe('FORCE_MAJEURE');
      expect(res.booking?.cancelReason).toBe('Severe weather alert in Mekong delta');
    });

    it('persists cancellationReasonType in demo store across subsequent getOperatorBookingById retrieval', async () => {
      const cancelRes = await cancelCustomerBooking(
        'booking-0141',
        { reasonType: 'TOUR_ITINERARY_CHANGE', reasonDetail: 'Schedule conflict due to maintenance' },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(cancelRes.success).toBe(true);
      expect(cancelRes.booking?.cancellationReasonType).toBe('TOUR_ITINERARY_CHANGE');

      const detailRes = await getOperatorBookingById('booking-0141', {
        isDemo: true,
        demoActorUserId: 101,
      });
      expect(detailRes.booking?.status).toBe('Cancelled');
      expect(detailRes.booking?.cancellationReasonType).toBe('TOUR_ITINERARY_CHANGE');
      expect(detailRes.booking?.cancelReason).toBe('Schedule conflict due to maintenance');
      expect(detailRes.booking?.cancelledAtUtc).toBeTruthy();
    });

    it('rejects cancellation when reason type is missing or unsupported', async () => {
      const resInvalidType = await cancelCustomerBooking(
        'booking-0141',
        { reasonType: 'INVALID_TYPE' as unknown as CancellationReasonValue, reasonDetail: 'Some reason' },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(resInvalidType.success).toBe(false);
      expect(resInvalidType.messageCode).toBe('VALIDATION_ERROR');

      const resMissingType = await cancelCustomerBooking(
        'booking-0141',
        { reasonType: undefined as unknown as CancellationReasonValue, reasonDetail: 'Some reason' },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(resMissingType.success).toBe(false);
      expect(resMissingType.messageCode).toBe('VALIDATION_ERROR');
    });
  });

  describe('operatorBookingDemoPolicy (Demo-only refund preview)', () => {
    it('calculates Demo-only refund preview without claiming production authority', () => {
      const paidEligible = toDemoDetailView(INITIAL_DEMO_BOOKINGS[0]);
      const previewEligible = calculateDemoBookingRefundPreview(paidEligible);
      expect(previewEligible.eligible).toBe(true);
      expect(previewEligible.refundableAmount).toBe(5600000);
      expect(previewEligible.policyApplied).toContain('Demo');

      const unpaid = toDemoDetailView(INITIAL_DEMO_BOOKINGS[2]);
      const previewUnpaid = calculateDemoBookingRefundPreview(unpaid);
      expect(previewUnpaid.eligible).toBe(false);
      expect(previewUnpaid.refundableAmount).toBe(0);

      const expired = toDemoDetailView(INITIAL_DEMO_BOOKINGS[3]); // Expired, never paid
      const previewExpired = calculateDemoBookingRefundPreview(expired);
      expect(previewExpired.eligible).toBe(false);
      expect(previewExpired.refundableAmount).toBe(0);
    });
  });
});

describe('operatorBookingService live mode (UC-40 BFF)', () => {
  const originalEnv = process.env;
  const fetchMock = vi.fn();

  const json = (body: unknown, status = 200) =>
    Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'test', NEXT_PUBLIC_ENABLE_DEMO_FIXTURES: 'true' };
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    resetDemoBookingsState();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = originalEnv;
  });

  describe('getOperatorBookings', () => {
    it('calls the BFF list route with the exact mapped query and never uses a fixture', async () => {
      fetchMock.mockReturnValueOnce(json(listExample()));

      const result = await getOperatorBookings(
        {
          tourId: '7',
          status: 'Confirmed',
          startDate: '2026-11-01',
          endDate: '2026-11-30',
          searchKeyword: '  alice  ',
          page: 2,
          pageSize: 20,
        },
        { isDemo: false }
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(
        '/api/operator/bookings?tourId=7&status=Confirmed&departureFrom=2026-11-01&departureTo=2026-11-30&keyword=alice&pageNumber=2&pageSize=20'
      );
      expect(init).toEqual(expect.objectContaining({ cache: 'no-store' }));
      expect(init.method ?? 'GET').toBe('GET');
      expect(result.items.map((i) => i.bookingCode)).toEqual(['BK-20261020-0007']);
      expect('pendingBackendNotice' in result).toBe(false);
      expect(result.errorMessage).toBeUndefined();
    });

    it('omits ALL and empty filters and defaults to page 1 with the CR-01 page size', async () => {
      fetchMock.mockReturnValueOnce(json(listExample()));

      await getOperatorBookings(
        { tourId: 'ALL', status: 'ALL', startDate: '', endDate: '', searchKeyword: '   ' },
        { isDemo: false }
      );

      expect(fetchMock.mock.calls[0][0]).toBe('/api/operator/bookings?pageNumber=1&pageSize=20');
    });

    it('returns the BE items, summary and paging unchanged (the browser never recomputes them)', async () => {
      fetchMock.mockReturnValueOnce(json(listExample()));

      const result = await getOperatorBookings({}, { isDemo: false });

      expect(result.summary).toEqual({ totalBookings: 37, totalParticipants: 112, totalConfirmedAmount: 98400000 });
      expect(result.totalCount).toBe(37);
      expect(result.totalPages).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('uses the live path when demo is requested but the environment forbids demo (production)', async () => {
      process.env = { ...originalEnv, NODE_ENV: 'production', NEXT_PUBLIC_ENABLE_DEMO_FIXTURES: 'true' };
      fetchMock.mockReturnValueOnce(json(listExample()));

      const result = await getOperatorBookings({}, { isDemo: true, demoActorUserId: 101 });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.items.map((i) => i.bookingId)).toEqual(['1201']);
    });

    it('reports MSG128 for a successful empty page and keeps the zero summary', async () => {
      fetchMock.mockReturnValueOnce(
        json({
          pageNumber: 1,
          pageSize: 20,
          totalCount: 0,
          totalPages: 0,
          summary: { totalBookings: 0, totalParticipants: 0, totalConfirmedAmount: 0 },
          items: [],
        })
      );

      const result = await getOperatorBookings({ searchKeyword: 'nobody' }, { isDemo: false });

      expect(result.items).toEqual([]);
      expect(result.errorMessage).toBe(OPERATOR_BOOKING_MESSAGES.MSG128);
      expect(result.errorCode).toBe('MSG128');
      expect(result.summary.totalBookings).toBe(0);
    });

    it('blocks an inverted date range before calling the BFF (MSG31)', async () => {
      const result = await getOperatorBookings(
        { startDate: '2026-11-30', endDate: '2026-11-01' },
        { isDemo: false }
      );

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.errorMessage).toBe(OPERATOR_BOOKING_MESSAGES.MSG31);
      expect(result.errorCode).toBe('MSG31');
      expect(result.items).toEqual([]);
    });

    it.each([
      ['BFF 401 UNAUTHENTICATED', 401, { errorCode: 'UNAUTHENTICATED' }, 'MSG126'],
      ['BE 403 operator_tour.access_required', 403, { errorCode: 'operator_tour.access_required' }, 'MSG126'],
      ['BE 403 operator_booking.forbidden', 403, { errorCode: 'operator_booking.forbidden' }, 'MSG126'],
      ['BE 400 operator_booking.invalid_date_range', 400, { errorCode: 'operator_booking.invalid_date_range' }, 'MSG31'],
      ['BE 400 operator_booking.invalid_filter', 400, { errorCode: 'operator_booking.invalid_filter' }, 'MSG127'],
      ['BFF 503 MSG127', 503, { errorCode: 'MSG127' }, 'MSG127'],
      ['BFF 502 MSG127', 502, { errorCode: 'MSG127' }, 'MSG127'],
      ['BE 500 without a known code', 500, { title: 'boom' }, 'MSG127'],
    ])('maps %s to %s', async (_label, status, body, expectedCode) => {
      fetchMock.mockReturnValueOnce(json(body, status));

      const result = await getOperatorBookings({}, { isDemo: false });

      expect(result.items).toEqual([]);
      expect(result.errorCode).toBe(expectedCode);
      expect(result.errorMessage).toBe(
        OPERATOR_BOOKING_MESSAGES[expectedCode as 'MSG126' | 'MSG31' | 'MSG127']
      );
    });

    it('reports MSG127 on a network error', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const result = await getOperatorBookings({}, { isDemo: false });

      expect(result.errorCode).toBe('MSG127');
    });

    it('reports MSG127 when the 200 body is not JSON', async () => {
      fetchMock.mockReturnValueOnce(Promise.resolve(new Response('<html>', { status: 200 })));

      expect((await getOperatorBookings({}, { isDemo: false })).errorCode).toBe('MSG127');
    });

    it('reports MSG127 when the body does not match the contract', async () => {
      const broken = listExample();
      (broken.items[0] as Record<string, unknown>).status = 'Teleporting';
      fetchMock.mockReturnValueOnce(json(broken));

      const result = await getOperatorBookings({}, { isDemo: false });

      expect(result.errorCode).toBe('MSG127');
      expect(result.items).toEqual([]);
    });
  });

  describe('getOperatorBookingById', () => {
    it('calls the BFF detail route and returns the parsed booking', async () => {
      fetchMock.mockReturnValueOnce(json(detailExample()));

      const result = await getOperatorBookingById('1201', { isDemo: false });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toBe('/api/operator/bookings/1201');
      expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({ cache: 'no-store' }));
      expect(result.booking?.bookingCode).toBe('BK-20261020-0007');
      expect(result.booking?.canCancel).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('does not call the BFF for an id that is not numeric and reports MSG126', async () => {
      const result = await getOperatorBookingById('booking-0141', { isDemo: false });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.booking).toBeUndefined();
      expect(result.messageCode).toBe('MSG126');
    });

    it.each([
      [401, { errorCode: 'UNAUTHENTICATED' }, 'MSG126'],
      [403, { errorCode: 'operator_booking.forbidden' }, 'MSG126'],
      [404, { errorCode: 'operator_booking.not_found' }, 'MSG126'],
      [503, { errorCode: 'MSG127' }, 'MSG127'],
      [500, { title: 'boom' }, 'MSG127'],
    ])('maps BFF %i %j to %s', async (status, body, expectedCode) => {
      fetchMock.mockReturnValueOnce(json(body, status));

      const result = await getOperatorBookingById('1201', { isDemo: false });

      expect(result.booking).toBeUndefined();
      expect(result.messageCode).toBe(expectedCode);
      expect(result.error).toBe(OPERATOR_BOOKING_MESSAGES[expectedCode as 'MSG126' | 'MSG127']);
    });

    it('reports MSG127 on a network error or a body that breaks the contract', async () => {
      fetchMock.mockRejectedValueOnce(new Error('offline'));
      expect((await getOperatorBookingById('1201', { isDemo: false })).messageCode).toBe('MSG127');

      const broken = detailExample();
      (broken as Record<string, unknown>).participants = 'none';
      fetchMock.mockReturnValueOnce(json(broken));
      expect((await getOperatorBookingById('1201', { isDemo: false })).messageCode).toBe('MSG127');
    });
  });

  describe('getOperatorBookingTourOptions', () => {
    it('reads the owned tours from the existing revenue BFF route', async () => {
      fetchMock.mockReturnValueOnce(
        json([
          { id: 101, code: 'TOUR-00101', title: 'Ba Na Hills full-day tour', isActive: true },
          { id: 55, code: 'TOUR-00055', title: 'Food trail', isActive: false },
        ])
      );

      const result = await getOperatorBookingTourOptions({ isDemo: false });

      expect(fetchMock.mock.calls[0][0]).toBe('/api/operator/revenue/tours');
      expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({ cache: 'no-store' }));
      expect(result).toEqual({
        failed: false,
        options: [
          { id: '101', title: 'Ba Na Hills full-day tour' },
          { id: '55', title: 'Food trail' },
        ],
      });
    });

    it.each([
      ['an error status', () => json({ errorCode: 'UNAUTHENTICATED' }, 401)],
      ['a server error', () => json({ errorCode: 'MSG127' }, 503)],
      ['a body that is not a tour list', () => json({ tours: [] })],
      ['a malformed entry', () => json([{ id: 'x', title: 't' }])],
      ['a non-JSON body', () => Promise.resolve(new Response('<html>', { status: 200 }))],
      ['a network failure', () => Promise.reject(new Error('offline'))],
    ])('degrades to no options (never throws) on %s', async (_label, respond) => {
      fetchMock.mockReturnValueOnce(respond());

      const result = await getOperatorBookingTourOptions({ isDemo: false });

      expect(result).toEqual({ options: [], failed: true });
    });

    it('serves the demo tours only in demo mode and does not call the BFF', async () => {
      const result = await getOperatorBookingTourOptions({ isDemo: true, demoActorUserId: 101 });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.failed).toBe(false);
      expect(result.options.map((o) => o.id)).toEqual(['tour-142', 'tour-148', 'tour-55']);
    });
  });

  describe('cancel stays locked outside demo mode (UC-41 is not integrated by UC-40)', () => {
    it('never calls the BFF and keeps the pending-integration answer', async () => {
      const cancel = await cancelCustomerBooking(
        '1201',
        { reasonType: 'CUSTOMER_REQUEST', reasonDetail: 'x' },
        { isDemo: false }
      );

      expect(fetchMock).not.toHaveBeenCalled();
      expect(cancel.messageCode).toBe('PENDING_BE_INTEGRATION');
    });
  });

  describe('getBookingRefundStatus (UC-42: real Backend refund status, never demo-gated)', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('returns outcome "found" with the parsed refund status on 200', async () => {
      const backendBody = {
        bookingId: 60110,
        bookingCode: 'BK-20261026-00001',
        refundAmount: 10000,
        status: 'Processed',
        gatewayReference: 'MOCK-REFUND-9-1792977260581',
        attemptCount: 1,
        requestedAtUtc: '2026-10-26T01:14:16.9635174+00:00',
        processedAtUtc: '2026-10-26T01:14:20.6237355+00:00',
        nextAttemptAtUtc: null,
        lastErrorCode: null,
      };
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify(backendBody), { status: 200 }));

      const result = await getBookingRefundStatus('60110');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/v1/bookings/60110/refund',
        expect.objectContaining({ headers: { Accept: 'application/json' } })
      );
      expect(result).toEqual({
        outcome: 'found',
        data: {
          bookingId: '60110',
          bookingCode: 'BK-20261026-00001',
          refundAmount: 10000,
          status: 'Processed',
          gatewayReference: 'MOCK-REFUND-9-1792977260581',
          attemptCount: 1,
          requestedAtUtc: '2026-10-26T01:14:16.9635174+00:00',
          processedAtUtc: '2026-10-26T01:14:20.6237355+00:00',
          nextAttemptAtUtc: null,
          lastErrorCode: null,
        },
      });
    });

    it('returns outcome "not_applicable" on 404 (no refund record exists)', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ errorCode: 'booking.cancellation.not_found' }), { status: 404 }));

      const result = await getBookingRefundStatus('60999');

      expect(result).toEqual({ outcome: 'not_applicable' });
    });

    it('returns outcome "error" with FORBIDDEN on 403', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ errorCode: 'FORBIDDEN' }), { status: 403 }));

      const result = await getBookingRefundStatus('60110');

      expect(result).toEqual({ outcome: 'error', messageCode: 'FORBIDDEN' });
    });

    it('returns outcome "error" with UNAUTHENTICATED on 401', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ errorCode: 'UNAUTHENTICATED' }), { status: 401 }));

      const result = await getBookingRefundStatus('60110');

      expect(result).toEqual({ outcome: 'error', messageCode: 'UNAUTHENTICATED' });
    });

    it('returns outcome "error" with MSG127 on network failure', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await getBookingRefundStatus('60110');

      expect(result).toEqual({ outcome: 'error', messageCode: 'MSG127' });
    });
  });
});

describe('getBookingRefundStatus payload validation (plan UC-42 Task 4)', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const validBody = {
    bookingId: 60110,
    bookingCode: 'BK-20261026-00001',
    refundAmount: 10000,
    status: 'Processed',
    gatewayReference: 'MOCK-REFUND-9-1',
    attemptCount: 1,
    requestedAtUtc: '2026-10-26T01:14:16Z',
    processedAtUtc: '2026-10-26T01:14:20Z',
    nextAttemptAtUtc: null,
    lastErrorCode: null,
  };

  const respondWith = (body: unknown) => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
  };

  it('rejects a 200 payload with an unknown status instead of rendering it', async () => {
    respondWith({ ...validBody, status: 'Hacked' });
    expect(await getBookingRefundStatus('60110')).toEqual({ outcome: 'error', messageCode: 'MSG127' });
  });

  it('rejects a 200 payload whose refundAmount is not a finite number', async () => {
    respondWith({ ...validBody, refundAmount: 'abc' });
    expect(await getBookingRefundStatus('60110')).toEqual({ outcome: 'error', messageCode: 'MSG127' });
  });

  it('rejects a 200 payload missing bookingCode', async () => {
    const withoutCode: Record<string, unknown> = { ...validBody };
    delete withoutCode.bookingCode;
    respondWith(withoutCode);
    expect(await getBookingRefundStatus('60110')).toEqual({ outcome: 'error', messageCode: 'MSG127' });
  });

  it('rejects a 200 payload with a non-ISO requestedAtUtc', async () => {
    respondWith({ ...validBody, requestedAtUtc: 'yesterday' });
    expect(await getBookingRefundStatus('60110')).toEqual({ outcome: 'error', messageCode: 'MSG127' });
  });
});
