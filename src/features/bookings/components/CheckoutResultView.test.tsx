import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    vi.clearAllMocks();
    mockSearchParams.delete('demo');
    mockSearchParams.delete('vnp_ResponseCode');
    mockSearchParams.delete('vnp_TxnRef');
    mockSearchParams.delete('bookingId');
  });

  it('renders payment success state and link to ticket in demo mode when code is 00', async () => {
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
      expect(screen.getByText(/Xem vé điện tử QR ngay/)).toBeTruthy();
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
