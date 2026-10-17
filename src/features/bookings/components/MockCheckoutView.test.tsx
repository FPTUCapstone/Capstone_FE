import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as paymentApi from '../services/paymentApi';
import { MockCheckoutView } from './MockCheckoutView';

const mockSearchParams = new URLSearchParams();
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

describe('MockCheckoutView (UC-28 Mock Payment Gateway UI)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
    mockSearchParams.delete('paymentId');
    mockSearchParams.delete('bookingId');
  });

  it('renders mock gateway UI with booking details', async () => {
    mockSearchParams.set('paymentId', '101');
    mockSearchParams.set('bookingId', '42');

    vi.spyOn(paymentApi, 'getBookingPaymentStatus').mockResolvedValueOnce({
      bookingId: '42',
      bookingCode: 'BK-20261018-0042',
      bookingStatus: 'PendingPayment',
      paymentStatus: 'Pending',
      paymentExpiresAt: '2026-10-18T10:30:00Z',
      activePayment: {
        paymentId: 101,
        gateway: 'Mock',
        orderCode: 1729221234567,
        amount: 2500000,
        currency: 'VND',
        checkoutUrl: '/checkout/mock?paymentId=101&bookingId=42',
        expiresAt: '2026-10-18T10:30:00Z',
        status: 'Pending',
      },
    });

    render(<MockCheckoutView />);

    await waitFor(() => {
      expect(screen.getByText('Cổng Thanh Toán Thử Nghiệm')).toBeTruthy();
      expect(screen.getByText('TripMate Mock Gateway')).toBeTruthy();
      expect(screen.getByText('BK-20261018-0042')).toBeTruthy();
      expect(screen.getByText('1729221234567')).toBeTruthy();
      expect(screen.getByRole('button', { name: /Thanh toán thành công/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /Hủy thanh toán/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /Mô phỏng hết hạn/i })).toBeTruthy();
    });
  });

  it('invokes completeMockPayment with Success and navigates to result on Success click', async () => {
    mockSearchParams.set('paymentId', '101');
    mockSearchParams.set('bookingId', '42');

    vi.spyOn(paymentApi, 'getBookingPaymentStatus').mockResolvedValueOnce({
      bookingId: '42',
      bookingCode: 'BK-20261018-0042',
      bookingStatus: 'PendingPayment',
      paymentStatus: 'Pending',
      paymentExpiresAt: '2026-10-18T10:30:00Z',
      activePayment: {
        paymentId: 101,
        gateway: 'Mock',
        orderCode: 1729221234567,
        amount: 2500000,
        currency: 'VND',
        checkoutUrl: '/checkout/mock?paymentId=101&bookingId=42',
        expiresAt: '2026-10-18T10:30:00Z',
        status: 'Pending',
      },
    });

    const mockComplete = vi
      .spyOn(paymentApi, 'completeMockPayment')
      .mockResolvedValueOnce({
        paymentId: 101,
        bookingId: '42',
        status: 'Success',
        bookingStatus: 'Confirmed',
      });

    render(<MockCheckoutView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Thanh toán thành công/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /Thanh toán thành công/i }));

    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith(101, 'Success');
      expect(mockPush).toHaveBeenCalledWith('/checkout/result?bookingId=42');
    });
  });

  it('invokes completeMockPayment with Cancelled on Cancel click', async () => {
    mockSearchParams.set('paymentId', '101');
    mockSearchParams.set('bookingId', '42');

    vi.spyOn(paymentApi, 'getBookingPaymentStatus').mockResolvedValueOnce({
      bookingId: '42',
      bookingCode: 'BK-20261018-0042',
      bookingStatus: 'PendingPayment',
      paymentStatus: 'Pending',
      paymentExpiresAt: '2026-10-18T10:30:00Z',
      activePayment: {
        paymentId: 101,
        gateway: 'Mock',
        orderCode: 1729221234567,
        amount: 2500000,
        currency: 'VND',
        checkoutUrl: '/checkout/mock?paymentId=101&bookingId=42',
        expiresAt: '2026-10-18T10:30:00Z',
        status: 'Pending',
      },
    });

    const mockComplete = vi
      .spyOn(paymentApi, 'completeMockPayment')
      .mockResolvedValueOnce({
        paymentId: 101,
        bookingId: '42',
        status: 'Cancelled',
        bookingStatus: 'PendingPayment',
      });

    render(<MockCheckoutView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Hủy thanh toán/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /Hủy thanh toán/i }));

    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith(101, 'Cancelled');
      expect(mockPush).toHaveBeenCalledWith('/checkout/result?bookingId=42');
    });
  });
});
