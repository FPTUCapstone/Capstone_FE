import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BookingTicketView } from './BookingTicketView';

const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function setNodeEnv(val?: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = val;
}

describe('BookingTicketView (UC-29 QR E-ticket)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('demo');
  });

  it('renders complete QR e-ticket details in demo mode', async () => {
    setNodeEnv('development');
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
    mockSearchParams.set('demo', '1');

    render(<BookingTicketView bookingId="bk-demo-0148" />);

    await waitFor(() => {
      expect(screen.getByText('Vé điện tử QR (UC-29)')).toBeTruthy();
      expect(screen.getByText('ĐÃ XÁC NHẬN (CONFIRMED)')).toBeTruthy();
      expect(screen.getByText('TKT-8F4K29QX-03')).toBeTruthy();
      expect(screen.getByText('BK-20261015-0148')).toBeTruthy();
      expect(screen.getByText('2 người lớn, 1 trẻ em')).toBeTruthy();
      expect(screen.getByText(/Endpoint Travel Miền Trung/)).toBeTruthy();
      expect(screen.getByText(/01 Đường 2 Tháng 9/)).toBeTruthy();
    });
  });

  it('triggers window.print when print button is clicked', async () => {
    setNodeEnv('development');
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
    mockSearchParams.set('demo', '1');

    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(<BookingTicketView bookingId="bk-demo-0148" />);

    await waitFor(() => {
      expect(screen.getByText('In vé / Lưu file PDF')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('In vé / Lưu file PDF'));
    expect(printSpy).toHaveBeenCalled();
  });

  it('renders PENDING_BE_INTEGRATION notice in real mode without demo opt-in', async () => {
    setNodeEnv('production');

    render(<BookingTicketView bookingId="bk-real-0148" />);

    await waitFor(() => {
      expect(screen.getByText('Vé điện tử QR: PENDING_BE_INTEGRATION')).toBeTruthy();
      expect(
        screen.getByText(/Chi tiết vé điện tử QR đang chờ hoàn tất kết nối API/),
      ).toBeTruthy();
    });
  });
});
