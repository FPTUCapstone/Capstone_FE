import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as paymentApi from '../services/paymentApi';
import { PaymentHandoffView } from './PaymentHandoffView';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

function setNodeEnv(val?: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = val;
}

describe('PaymentHandoffView (UC-28 entry point)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockClear();
    setNodeEnv('development');
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
    vi.spyOn(paymentApi, 'getBookingPaymentStatus').mockResolvedValue({
      bookingId: '148',
      bookingCode: 'BK-20261015-0148',
      bookingStatus: 'PendingPayment',
      paymentStatus: 'Unpaid',
      amount: 1700000,
      currency: 'VND',
      bookingPaymentExpiresAtUtc: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
  });

  it('loads the demo booking by id and displays payment gateway details', async () => {
    render(<PaymentHandoffView bookingId="bk-demo-0148" isDemo={true} />);

    await waitFor(() => {
      expect(screen.getByText('#148')).toBeTruthy();
      expect(screen.getByText(/PayOS — Cổng Thanh Toán Trực Tuyến/i)).toBeTruthy();
      expect(screen.getByText(/Chờ thanh toán/i)).toBeTruthy();
    });
  });

  it('calls createOrReusePayment and navigates to returned checkoutUrl on Pay click', async () => {
    const createSpy = vi.spyOn(paymentApi, 'createOrReusePayment').mockResolvedValueOnce({
      paymentId: 101,
      bookingId: '148',
      orderCode: 1729221234567,
      amount: 1700000,
      currency: 'VND',
      checkoutUrl: '/checkout/mock?paymentId=101&bookingId=148',
      expiresAt: '2026-10-18T10:30:00Z',
      status: 'Pending',
    });

    render(<PaymentHandoffView bookingId="bk-demo-0148" isDemo={true} />);

    const payButton = await waitFor(() => {
      const button = screen.getByRole('button', { name: /Thanh toán.*ngay/i }) as HTMLButtonElement;
      expect(button.disabled).toBe(false);
      return button;
    });

    fireEvent.click(payButton);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith('148');
      expect(mockPush).toHaveBeenCalledWith('/checkout/mock?paymentId=101&bookingId=148');
    });
  });

  it('displays friendly error message when createOrReusePayment fails', async () => {
    vi.spyOn(paymentApi, 'createOrReusePayment').mockRejectedValueOnce(
      new paymentApi.PaymentApiError(
        'Đơn đặt tour không ở trạng thái hợp lệ để thanh toán.',
        400,
        'PAYMENT_BOOKING_NOT_ELIGIBLE',
      ),
    );

    render(<PaymentHandoffView bookingId="bk-demo-0148" isDemo={true} />);

    const payButton = await waitFor(() => {
      const button = screen.getByRole('button', { name: /Thanh toán.*ngay/i }) as HTMLButtonElement;
      expect(button.disabled).toBe(false);
      return button;
    });

    fireEvent.click(payButton);

    await waitFor(() => {
      expect(
        screen.getByText('Đơn đặt tour không ở trạng thái hợp lệ để thanh toán.'),
      ).toBeTruthy();
    });
  });
});
