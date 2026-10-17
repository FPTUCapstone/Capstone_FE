import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createBooking,
  getBooking,
  getTicket,
  initiatePayment,
  isBookingDemoAllowedInCurrentEnv,
  quoteBooking,
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

  describe('quoteBooking (UC-27)', () => {
    it('returns a demo quote with coupon discount when demo is allowed', async () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

      const quote = await quoteBooking(
        {
          tourScheduleId: '9007199254740997',
          participantCounts: { adult: 2, child: 1, infant: 0 },
          voucherCode: 'HOIAN15',
        },
        '9007199254740995',
        { allowDemo: true },
      );

      // 2 * 800k + 1 * 400k = 2,000,000. 15% off = 300,000. Total = 1,700,000
      expect(quote.subtotalAmount).toBe(2000000);
      expect(quote.discountAmount).toBe(300000);
      expect(quote.totalAmount).toBe(1700000);
      expect(quote.appliedVoucher?.code).toBe('HOIAN15');
    });

    it('calls POST /api/v1/traveler/tour-bookings/quote in real mode', async () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'false';

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            tourId: '45', tourScheduleId: '123', currency: 'VND',
            participantCounts: { adult: 1, child: 0, infant: 0 },
            priceBreakdown: [], subtotalAmount: 1000000, discountAmount: 0, totalAmount: 1000000,
            remainingSlots: 5, appliedVoucher: null,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );
      vi.stubGlobal('fetch', mockFetch);

      const quote = await quoteBooking(
        { tourScheduleId: '123', participantCounts: { adult: 1, child: 0, infant: 0 } },
        '45',
      );

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/traveler/tour-bookings/quote',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(quote.totalAmount).toBe(1000000);
    });
  });

  describe('createBooking (UC-27)', () => {
    it('always calls the real Backend contract, even when the environment allows demo quotes', async () => {
      // The demo fixture policy only ever permits a read-only quote preview (BE spec §5);
      // createBooking has no demo branch at all, so this must hit the real endpoint regardless.
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            bookingId: '456', bookingCode: 'BK-20261017-00001', status: 'PendingPayment',
            tourScheduleId: '9007199254740997', currency: 'VND', subtotalAmount: 2000000,
            discountAmount: 300000, totalAmount: 1700000,
            paymentExpiresAt: '2026-10-17T10:30:00Z', createdAt: '2026-10-17T10:15:00Z',
          }),
          { status: 201, headers: { 'content-type': 'application/json' } },
        ),
      );
      vi.stubGlobal('fetch', mockFetch);

      const booking = await createBooking({
        tourScheduleId: '9007199254740997',
        voucherCode: 'HOIAN15',
        participants: [
          { fullName: 'Nguyễn Minh Phúc', participantType: 'Adult' },
          { fullName: 'Trần Thị Thu Thảo', participantType: 'Adult' },
          { fullName: 'Nguyễn Minh An', participantType: 'Child' },
        ],
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/traveler/tour-bookings', expect.objectContaining({ method: 'POST' }));
      expect(booking.status).toBe('PendingPayment');
      expect(booking.discountAmount).toBe(300000);
      expect(booking.totalAmount).toBe(1700000);
    });

    it('sends Idempotency-Key and the approved request shape, and returns the created booking', async () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'false';

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            bookingId: '456', bookingCode: 'BK-20261017-00001', status: 'PendingPayment',
            tourScheduleId: '123', currency: 'VND', subtotalAmount: 1000000, discountAmount: 0,
            totalAmount: 1000000, paymentExpiresAt: '2026-10-17T10:30:00Z', createdAt: '2026-10-17T10:15:00Z',
          }),
          { status: 201, headers: { 'content-type': 'application/json' } },
        ),
      );
      vi.stubGlobal('fetch', mockFetch);

      const booking = await createBooking(
        {
          tourScheduleId: '123',
          participants: [{ fullName: 'Test Traveler', participantType: 'Adult' }],
        },
        { idempotencyKey: '550e8400-e29b-41d4-a716-446655440000' },
      );

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/traveler/tour-bookings',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Idempotency-Key': '550e8400-e29b-41d4-a716-446655440000' }),
        }),
      );
      expect(booking.bookingId).toBe('456');
      expect(booking.status).toBe('PendingPayment');
    });

    it('throws a BookingApiError with a mapped message when the server rejects the request', async () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'false';

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({ errorCode: 'tour_booking.insufficient_capacity' }),
            { status: 409, headers: { 'content-type': 'application/json' } },
          ),
        ),
      );

      await expect(
        createBooking({
          tourScheduleId: '123',
          participants: [{ fullName: 'Test Traveler', participantType: 'Adult' }],
        }),
      ).rejects.toMatchObject({
        status: 409,
        message: expect.stringContaining('Không còn đủ chỗ trống'),
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

    it('calls /api/tickets/{ticketId} with ticketId in real mode', async () => {
      setNodeEnv('production');
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ticketId: 'ticket-456',
            ticketCode: 'TKT-TEST-456',
            bookingId: 'booking-123',
            status: 'Valid',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );
      vi.stubGlobal('fetch', mockFetch);

      const ticket = await getTicket('ticket-456');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tickets/ticket-456',
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: 'application/json',
          }),
        }),
      );
      expect(ticket.ticketId).toBe('ticket-456');
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
