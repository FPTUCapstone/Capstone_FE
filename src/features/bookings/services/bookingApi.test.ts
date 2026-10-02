import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createBooking,
  getBooking,
  getTicket,
  initiatePayment,
  isBookingDemoAllowedInCurrentEnv,
  verifyPayment,
} from './bookingApi';

function setNodeEnv(val?: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = val;
}

describe('bookingApi service (UC-27, UC-28, UC-29)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('isBookingDemoAllowedInCurrentEnv gate', () => {
    it('returns false in production environment even if NEXT_PUBLIC_ENABLE_DEMO_FIXTURES is true', () => {
      setNodeEnv('production');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
      expect(isBookingDemoAllowedInCurrentEnv()).toBe(false);
    });

    it('returns false in non-production if NEXT_PUBLIC_ENABLE_DEMO_FIXTURES is not true', () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'false';
      expect(isBookingDemoAllowedInCurrentEnv()).toBe(false);
    });

    it('returns true in non-production when NEXT_PUBLIC_ENABLE_DEMO_FIXTURES is true', () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
      expect(isBookingDemoAllowedInCurrentEnv()).toBe(true);
    });
  });

  describe('createBooking (UC-27)', () => {
    it('creates demo booking with price calculations and coupon discount when demo is allowed', async () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

      const booking = await createBooking(
        {
          tourId: '9007199254740995',
          scheduleId: '9007199254740997',
          adultCount: 2,
          childCount: 1,
          leadTravelerName: 'Nguyễn Minh Phúc',
          leadTravelerPhone: '0905 123 456',
          leadTravelerEmail: 'traveler@tripmate.vn',
          couponCode: 'HOIAN15',
          participants: [
            { fullName: 'Nguyễn Minh Phúc', participantType: 'Adult' },
            { fullName: 'Trần Thị Thu Thảo', participantType: 'Adult' },
            { fullName: 'Nguyễn Minh An', participantType: 'Child' },
          ],
        },
        { allowDemo: true },
      );

      expect(booking.isDemo).toBe(true);
      expect(booking.adultCount).toBe(2);
      expect(booking.childCount).toBe(1);
      expect(booking.status).toBe('PendingPayment');
      expect(booking.paymentStatus).toBe('Pending');
      // 2 * 800k + 1 * 400k = 2,000,000. 15% off = 300,000. Total = 1,700,000
      expect(booking.discountAmount).toBe(300000);
      expect(booking.totalAmount).toBe(1700000);
      expect(booking.leadTravelerName).toBe('Nguyễn Minh Phúc');
    });

    it('throws 501 PENDING_BE_INTEGRATION in real mode without demo opt-in', async () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'false';

      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));

      await expect(
        createBooking({
          tourId: '9007199254740995',
          scheduleId: '9007199254740997',
          adultCount: 1,
          childCount: 0,
          leadTravelerName: 'Test Traveler',
          leadTravelerPhone: '0901234567',
          leadTravelerEmail: 'test@tripmate.vn',
          participants: [{ fullName: 'Test Traveler', participantType: 'Adult' }],
        }),
      ).rejects.toMatchObject({
        status: 501,
        message: expect.stringContaining('PENDING_BE_INTEGRATION'),
      });
    });
  });

  describe('getBooking (UC-27 / UC-28)', () => {
    it('returns demo booking when demo is enabled', async () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

      const booking = await getBooking('bk-demo-0148', { allowDemo: true });
      expect(booking.bookingId).toBe('bk-demo-0148');
      expect(booking.isDemo).toBe(true);
      expect(booking.status).toBe('PendingPayment');
    });

    it('throws 501 in real mode', async () => {
      setNodeEnv('production');
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));

      await expect(getBooking('bk-real-123')).rejects.toMatchObject({
        status: 501,
        message: expect.stringContaining('PENDING_BE_INTEGRATION'),
      });
    });
  });

  describe('initiatePayment (UC-28)', () => {
    it('returns simulated paymentUrl in demo mode', async () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

      const res = await initiatePayment('bk-demo-0148', 'VNPay', { allowDemo: true });
      expect(res.paymentUrl).toContain('/checkout/result');
      expect(res.paymentUrl).toContain('vnp_ResponseCode=00');
      expect(res.transactionRef).toBe('VNPTXN-884920');
    });

    it('throws 501 PENDING_BE_INTEGRATION in real mode', async () => {
      setNodeEnv('production');
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));

      await expect(initiatePayment('bk-real-123', 'VNPay')).rejects.toMatchObject({
        status: 501,
        message: expect.stringContaining('PENDING_BE_INTEGRATION'),
      });
    });
  });

  describe('verifyPayment (UC-28)', () => {
    it('verifies success with ticketId in demo mode when code is 00', async () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

      const params = new URLSearchParams('vnp_ResponseCode=00&vnp_TxnRef=VNPTXN-884920&bookingId=bk-demo-0148');
      const res = await verifyPayment(params, { allowDemo: true });

      expect(res.isSuccess).toBe(true);
      expect(res.ticketId).toBe('tkt-demo-03');
      expect(res.transactionRef).toBe('VNPTXN-884920');
      expect(res.amount).toBe(1700000);
    });

    it('returns failure in demo mode when code is not 00', async () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

      const params = new URLSearchParams('vnp_ResponseCode=24&vnp_TxnRef=VNPTXN-884920&bookingId=bk-demo-0148');
      const res = await verifyPayment(params, { allowDemo: true });

      expect(res.isSuccess).toBe(false);
      expect(res.errorCode).toBe('24');
      expect(res.errorMessage).toBeDefined();
    });

    it('throws 501 PENDING_BE_INTEGRATION in real mode for cryptographic safety', async () => {
      setNodeEnv('production');
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));

      const params = new URLSearchParams('vnp_ResponseCode=00');
      await expect(verifyPayment(params)).rejects.toMatchObject({
        status: 501,
        message: expect.stringContaining('PENDING_BE_INTEGRATION'),
      });
    });
  });

  describe('getTicket (UC-29)', () => {
    it('returns demo ticket in demo mode', async () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

      const ticket = await getTicket('tkt-demo-03', { allowDemo: true });
      expect(ticket.ticketCode).toBe('TKT-8F4K29QX-03');
      expect(ticket.status).toBe('Valid');
      expect(ticket.qrPayload).toBe('TRIPMATE-TKT-8F4K29QX-03-VERIFIED');
    });

    it('throws 501 PENDING_BE_INTEGRATION in real mode', async () => {
      setNodeEnv('production');
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));

      await expect(getTicket('tkt-real-03')).rejects.toMatchObject({
        status: 501,
        message: expect.stringContaining('PENDING_BE_INTEGRATION'),
      });
    });
  });
});
