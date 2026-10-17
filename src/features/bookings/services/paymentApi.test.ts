import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  completeMockPayment,
  createOrReusePayment,
  getBookingPaymentStatus,
  PAYMENT_ERROR_MESSAGES,
} from './paymentApi';

describe('paymentApi (UC-28 Client Service)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('createOrReusePayment', () => {
    it('returns payment checkout response when successful', async () => {
      const mockResponse = {
        paymentId: 101,
        bookingId: 42,
        orderCode: 1729221234567,
        amount: 2500000,
        currency: 'VND',
        checkoutUrl: 'https://checkout.example.com/pay',
        expiresAt: '2026-10-18T10:30:00Z',
        status: 'Pending',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const result = await createOrReusePayment(42);
      expect(result.paymentId).toBe(101);
      expect(result.checkoutUrl).toBe('https://checkout.example.com/pay');
      expect(result.orderCode).toBe(1729221234567);
    });

    it('maps PAYMENT_BOOKING_NOT_ELIGIBLE to friendly message', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({ errorCode: 'PAYMENT_BOOKING_NOT_ELIGIBLE' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

      await expect(createOrReusePayment(42)).rejects.toMatchObject({
        name: 'PaymentApiError',
        status: 400,
        errorCode: 'PAYMENT_BOOKING_NOT_ELIGIBLE',
        message: PAYMENT_ERROR_MESSAGES.PAYMENT_BOOKING_NOT_ELIGIBLE,
      });
    });

    it('maps PAYMENT_BOOKING_EXPIRED to friendly message', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({ errorCode: 'PAYMENT_BOOKING_EXPIRED' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

      await expect(createOrReusePayment(42)).rejects.toMatchObject({
        name: 'PaymentApiError',
        status: 400,
        errorCode: 'PAYMENT_BOOKING_EXPIRED',
        message: PAYMENT_ERROR_MESSAGES.PAYMENT_BOOKING_EXPIRED,
      });
    });
  });

  describe('getBookingPaymentStatus', () => {
    it('returns canonical payment status', async () => {
      const mockStatus = {
        bookingId: 42,
        bookingCode: 'BK-20261018-0042',
        bookingStatus: 'Confirmed',
        paymentStatus: 'Paid',
        paymentExpiresAt: '2026-10-18T10:30:00Z',
        activePayment: {
          paymentId: 101,
          gateway: 'PayOS',
          orderCode: 1729221234567,
          amount: 2500000,
          currency: 'VND',
          checkoutUrl: 'https://checkout.example.com/pay',
          expiresAt: '2026-10-18T10:30:00Z',
          status: 'Success',
        },
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockStatus), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const result = await getBookingPaymentStatus(42);
      expect(result.bookingStatus).toBe('Confirmed');
      expect(result.paymentStatus).toBe('Paid');
      expect(result.activePayment?.status).toBe('Success');
    });

    it('maps PAYMENT_NOT_FOUND when booking does not exist', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({ errorCode: 'PAYMENT_NOT_FOUND' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

      await expect(getBookingPaymentStatus(999)).rejects.toMatchObject({
        name: 'PaymentApiError',
        status: 404,
        errorCode: 'PAYMENT_NOT_FOUND',
      });
    });
  });

  describe('completeMockPayment', () => {
    it('submits outcome and returns updated status', async () => {
      const mockResult = {
        paymentId: 101,
        bookingId: 42,
        status: 'Success',
        bookingStatus: 'Confirmed',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const result = await completeMockPayment(101, 'Success');
      expect(result.status).toBe('Success');
      expect(result.bookingStatus).toBe('Confirmed');
    });

    it('handles PAYMENT_MOCK_DISABLED gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({ errorCode: 'PAYMENT_MOCK_DISABLED' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

      await expect(completeMockPayment(101, 'Success')).rejects.toMatchObject({
        name: 'PaymentApiError',
        status: 400,
        errorCode: 'PAYMENT_MOCK_DISABLED',
        message: PAYMENT_ERROR_MESSAGES.PAYMENT_MOCK_DISABLED,
      });
    });
  });
});
