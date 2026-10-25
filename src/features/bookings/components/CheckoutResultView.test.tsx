import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as paymentApi from '../services/paymentApi';
import { getCheckoutResultRedirectUrl } from './CheckoutResultPage';
import { CheckoutResultView } from './CheckoutResultView';

const mockSearchParams = new URLSearchParams();
const { replaceMock } = vi.hoisted(() => ({ replaceMock: vi.fn() }));

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: vi.fn(), replace: replaceMock }),
}));

describe('CheckoutResultView (UC-28 Canonical Payment Status)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    replaceMock.mockReset();
    mockSearchParams.delete('bookingId');
    mockSearchParams.delete('status');
    mockSearchParams.delete('code');
    mockSearchParams.delete('cancel');
  });

  it('renders payment success state with the e-ticket and return-home actions when backend reports Confirmed', async () => {
    mockSearchParams.set('bookingId', '42');

    vi.spyOn(paymentApi, 'getBookingPaymentStatus').mockResolvedValueOnce({
      bookingId: '42',
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
        checkoutUrl: 'https://pay.payos.vn/web/test',
        expiresAt: '2026-10-18T10:30:00Z',
        status: 'Success',
      },
    });

    render(<CheckoutResultView />);

    await waitFor(() => {
      expect(screen.getByText('Thanh Toán Hoàn Tất!')).toBeTruthy();
      expect(screen.getByText('BK-20261018-0042')).toBeTruthy();
      expect(screen.getByText('1729221234567')).toBeTruthy();
      const homeLink = screen.getByRole('link', { name: /Về trang chủ/i });
      expect(homeLink.getAttribute('href')).toBe('/');
      const ticketLink = screen.getByRole('link', { name: /Xem vé điện tử/i });
      expect(ticketLink.getAttribute('href')).toBe('/bookings/42/ticket');
    });
  });

  it('does NOT render paid receipt on forged ?status=PAID if backend reports PendingPayment', async () => {
    mockSearchParams.set('bookingId', '42');
    mockSearchParams.set('status', 'PAID'); // Forged parameter

    vi.spyOn(paymentApi, 'getBookingPaymentStatus').mockResolvedValueOnce({
      bookingId: '42',
      bookingCode: 'BK-20261018-0042',
      bookingStatus: 'PendingPayment',
      paymentStatus: 'Pending',
      paymentExpiresAt: '2026-10-18T10:30:00Z',
      activePayment: {
        paymentId: 101,
        gateway: 'PayOS',
        orderCode: 1729221234567,
        amount: 2500000,
        currency: 'VND',
        checkoutUrl: 'https://pay.payos.vn/web/test',
        expiresAt: '2026-10-18T10:30:00Z',
        status: 'Pending',
      },
    });

    render(<CheckoutResultView />);

    await waitFor(() => {
      expect(screen.queryByText('Thanh Toán Hoàn Tất!')).toBeNull();
      expect(screen.getByText('Đang Chờ Thanh Toán')).toBeTruthy();
      expect(screen.getByRole('button', { name: /Tiến hành thanh toán ngay/i })).toBeTruthy();
    });
  });

  it('renders cancelled transaction state with retry button when transaction was cancelled', async () => {
    mockSearchParams.set('bookingId', '42');

    vi.spyOn(paymentApi, 'getBookingPaymentStatus').mockResolvedValueOnce({
      bookingId: '42',
      bookingCode: 'BK-20261018-0042',
      bookingStatus: 'PendingPayment',
      paymentStatus: 'Pending',
      paymentExpiresAt: '2026-10-18T10:30:00Z',
      activePayment: {
        paymentId: 101,
        gateway: 'PayOS',
        orderCode: 1729221234567,
        amount: 2500000,
        currency: 'VND',
        checkoutUrl: 'https://pay.payos.vn/web/test',
        expiresAt: '2026-10-18T10:30:00Z',
        status: 'Cancelled',
      },
    });

    render(<CheckoutResultView />);

    await waitFor(() => {
      expect(screen.getByText('Thanh Toán Chưa Hoàn Tất')).toBeTruthy();
      expect(screen.getByText('Giao dịch đã hủy')).toBeTruthy();
      expect(screen.getByRole('button', { name: /Tiến hành thanh toán ngay/i })).toBeTruthy();
    });
  });

  it('records a CANCELLED gateway callback before loading canonical status', async () => {
    mockSearchParams.set('bookingId', '42');
    mockSearchParams.set('status', 'CANCELLED');
    const cancel = vi.spyOn(paymentApi, 'cancelPendingPayment').mockResolvedValue();
    vi.spyOn(paymentApi, 'getBookingPaymentStatus').mockResolvedValueOnce({
      bookingId: '42', bookingCode: 'BK-20261018-0042', bookingStatus: 'PendingPayment', paymentStatus: 'Pending',
      paymentExpiresAt: '2026-10-18T10:30:00Z', activePayment: null,
    });

    render(<CheckoutResultView />);

    await waitFor(() => expect(cancel).toHaveBeenCalledWith('42'));
  });

  it('waits for the canonical webhook update after a PAID callback instead of trusting the URL', async () => {
    vi.useFakeTimers();
    try {
      mockSearchParams.set('bookingId', '42');
      mockSearchParams.set('status', 'PAID');
      mockSearchParams.set('code', '00');
      vi.spyOn(paymentApi, 'getBookingPaymentStatus')
        .mockResolvedValueOnce({
          bookingId: '42', bookingCode: 'BK-20261018-0042', bookingStatus: 'PendingPayment', paymentStatus: 'Pending',
          paymentExpiresAt: '2026-10-18T10:30:00Z', activePayment: null,
        })
        .mockResolvedValueOnce({
          bookingId: '42', bookingCode: 'BK-20261018-0042', bookingStatus: 'Confirmed', paymentStatus: 'Paid',
          paymentExpiresAt: '2026-10-18T10:30:00Z', activePayment: null,
        });

      render(<CheckoutResultView />);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      expect(screen.getByText('Thanh Toán Hoàn Tất!')).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('stays on the paid result instead of returning home by itself (UC-29 W2)', async () => {
    vi.useFakeTimers();
    try {
      mockSearchParams.set('bookingId', '42');
      vi.spyOn(paymentApi, 'getBookingPaymentStatus').mockResolvedValue({
        bookingId: '42', bookingCode: 'BK-20261018-0042', bookingStatus: 'Confirmed', paymentStatus: 'Paid',
        paymentExpiresAt: '2026-10-18T10:30:00Z', activePayment: null,
      });

      render(<CheckoutResultView />);
      // First let the status request settle and the paid view mount, then let a full minute pass.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });

      expect(screen.getByText('Thanh Toán Hoàn Tất!')).toBeTruthy();
      expect(replaceMock).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('moves a tunnel callback back to localhost while preserving payment parameters', () => {
    expect(getCheckoutResultRedirectUrl(
      'http://localhost:3001',
      'https://demo.trycloudflare.com',
      'bookingId=42&status=CANCELLED&cancel=true',
    )).toBe('http://localhost:3001/checkout/result?bookingId=42&status=CANCELLED&cancel=true');
  });

  it('renders expired booking state when booking has expired', async () => {
    mockSearchParams.set('bookingId', '42');

    vi.spyOn(paymentApi, 'getBookingPaymentStatus').mockResolvedValueOnce({
      bookingId: '42',
      bookingCode: 'BK-20261018-0042',
      bookingStatus: 'Expired',
      paymentStatus: 'Failed',
      paymentExpiresAt: '2026-10-18T10:00:00Z',
      activePayment: null,
    });

    render(<CheckoutResultView />);

    await waitFor(() => {
      expect(screen.getByText('Đơn Tour Đã Hết Hạn')).toBeTruthy();
      expect(screen.getByText('Hết hạn giữ chỗ')).toBeTruthy();
      expect(screen.getByRole('link', { name: /Khám phá các tour khác/i })).toBeTruthy();
    });
  });

  it('renders error notice and retry button when bookingId is missing', async () => {
    render(<CheckoutResultView />);

    await waitFor(() => {
      expect(screen.getByText('Thông tin thanh toán')).toBeTruthy();
      expect(
        screen.getByText('Không tìm thấy thông tin mã đặt tour (bookingId).'),
      ).toBeTruthy();
    });
  });
});
