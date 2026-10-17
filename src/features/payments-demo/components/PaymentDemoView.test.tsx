import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PaymentDemoView } from './PaymentDemoView';

describe('PaymentDemoView', () => {
  it('runs the local mock payment UI without making a backend request', () => {
    render(<PaymentDemoView bookingId="demo-booking-28" />);

    expect(screen.getByText('Demo cục bộ — không tạo giao dịch thật')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu thanh toán Mock' }));
    fireEvent.click(screen.getByRole('button', { name: 'Thanh toán thành công' }));

    expect(screen.getByText('Thanh toán mô phỏng thành công')).toBeTruthy();
    expect(screen.getByText('Không có yêu cầu nào được gửi đến Backend hoặc PayOS.')).toBeTruthy();
  });

  it('shows cancellation and expiry as non-success outcomes', () => {
    render(<PaymentDemoView bookingId="demo-booking-28" />);

    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu thanh toán Mock' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hủy thanh toán' }));
    expect(screen.getByText('Thanh toán mô phỏng đã hủy')).toBeTruthy();
  });
});
