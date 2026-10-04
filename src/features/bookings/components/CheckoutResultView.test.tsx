import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as bookingApi from '../services/bookingApi';
import { CheckoutResultView } from './CheckoutResultView';

const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function setNodeEnv(val?: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = val;
}

describe('CheckoutResultView (UC-28 Payment Return)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockSearchParams.delete('demo');
    mockSearchParams.delete('vnp_ResponseCode');
    mockSearchParams.delete('vnp_TxnRef');
    mockSearchParams.delete('bookingId');
  });

  it('renders payment success state and link to ticket in demo mode (TICKET-5)', async () => {
    setNodeEnv('development');
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
    mockSearchParams.set('demo', '1');
    mockSearchParams.set('vnp_ResponseCode', '00');
    mockSearchParams.set('vnp_TxnRef', 'VNPTXN-884920');
    mockSearchParams.set('bookingId', 'bk-demo-0148');

    render(<CheckoutResultView />);

    await waitFor(() => {
      expect(screen.getByText('Thanh toán thành công!')).toBeTruthy();
      expect(screen.getByText('BK-20261015-0148')).toBeTruthy();
      expect(screen.getByText('VNPTXN-884920')).toBeTruthy();
      const link = screen.getByRole('link', { name: /Xem vé điện tử QR ngay/ });
      expect(link.getAttribute('href')).toBe('/bookings/tkt-demo-03/ticket?demo=1');
      expect(link.getAttribute('href')).not.toContain('bk-demo-0148');
    });
  });

  it('TICKET-1: points ticket CTA to ticketId and NOT bookingId on payment success', async () => {
    setNodeEnv('production');
    mockSearchParams.set('vnp_ResponseCode', '00');

    vi.spyOn(bookingApi, 'verifyPayment').mockResolvedValueOnce({
      isSuccess: true,
      bookingId: 'booking-123',
      ticketId: 'ticket-456',
      bookingCode: 'BK-123',
      transactionRef: 'TXN-123',
      amount: 1500000,
      paymentMethod: 'VNPay',
      paidAtUtc: new Date().toISOString(),
    });

    render(<CheckoutResultView />);

    await waitFor(() => {
      expect(screen.getByText('Thanh toán thành công!')).toBeTruthy();
      const link = screen.getByRole('link', { name: /Xem vé điện tử QR ngay/ });
      expect(link.getAttribute('href')).toBe('/bookings/ticket-456/ticket');
      expect(link.getAttribute('href')).not.toContain('booking-123');
    });
  });

  it('TICKET-3: preserves payment success UI but hides ticket CTA when ticketId is undefined', async () => {
    setNodeEnv('production');
    mockSearchParams.set('vnp_ResponseCode', '00');

    vi.spyOn(bookingApi, 'verifyPayment').mockResolvedValueOnce({
      isSuccess: true,
      bookingId: 'booking-123',
      ticketId: undefined,
      bookingCode: 'BK-123',
      transactionRef: 'TXN-123',
      amount: 1500000,
      paymentMethod: 'VNPay',
      paidAtUtc: new Date().toISOString(),
    });

    render(<CheckoutResultView />);

    await waitFor(() => {
      expect(screen.getByText('Thanh toán thành công!')).toBeTruthy();
      expect(screen.queryByRole('link', { name: /Xem vé điện tử QR ngay/ })).toBeNull();
      expect(screen.getByText('Vé điện tử chưa sẵn sàng')).toBeTruthy();
      expect(
        screen.getByText(/Thanh toán đã được xác nhận, nhưng vé điện tử chưa sẵn sàng để mở/),
      ).toBeTruthy();
    });
  });

  it('TICKET-4: treats blank/whitespace ticketId safely without rendering ticket link', async () => {
    setNodeEnv('production');
    mockSearchParams.set('vnp_ResponseCode', '00');

    vi.spyOn(bookingApi, 'verifyPayment').mockResolvedValueOnce({
      isSuccess: true,
      bookingId: 'booking-123',
      ticketId: '   ',
      bookingCode: 'BK-123',
      transactionRef: 'TXN-123',
      amount: 1500000,
      paymentMethod: 'VNPay',
      paidAtUtc: new Date().toISOString(),
    });

    render(<CheckoutResultView />);

    await waitFor(() => {
      expect(screen.getByText('Thanh toán thành công!')).toBeTruthy();
      expect(screen.queryByRole('link', { name: /Xem vé điện tử QR ngay/ })).toBeNull();
      expect(screen.getByText('Vé điện tử chưa sẵn sàng')).toBeTruthy();
    });
  });

  it('renders payment failure state in demo mode when code is not 00', async () => {
    setNodeEnv('development');
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
    mockSearchParams.set('demo', '1');
    mockSearchParams.set('vnp_ResponseCode', '24');

    render(<CheckoutResultView />);

    await waitFor(() => {
      expect(screen.getByText('Giao dịch thanh toán chưa hoàn tất')).toBeTruthy();
    });
  });

  it('renders PENDING_BE_INTEGRATION truthful notice in real mode without demo opt-in', async () => {
    setNodeEnv('production');
    mockSearchParams.set('vnp_ResponseCode', '00');

    render(<CheckoutResultView />);

    await waitFor(() => {
      expect(screen.getByText('Xác thực thanh toán: PENDING_BE_INTEGRATION')).toBeTruthy();
      expect(
        screen.getByText(/Theo tiêu chuẩn bảo mật thanh toán tài chính/),
      ).toBeTruthy();
    });
  });
});
