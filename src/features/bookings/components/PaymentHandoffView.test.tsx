import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  });

  it('loads the demo booking by id and shows the payment method selector', async () => {
    render(<PaymentHandoffView bookingId="bk-demo-0148" isDemo={true} />);

    await waitFor(() => {
      expect(screen.getByText('BK-20261015-0148')).toBeTruthy();
      expect(screen.getByText('VNPay Gateway')).toBeTruthy();
      expect(screen.getByText('VNPay QR Code')).toBeTruthy();
    });
  });

  it('navigates to the simulated payment URL when the traveler confirms payment', async () => {
    render(<PaymentHandoffView bookingId="bk-demo-0148" isDemo={true} />);

    // Wait for the countdown's first tick, not just the booking load, so the button isn't still
    // disabled from the one-render gap between "booking loaded" and "secondsRemaining computed".
    const payButton = await waitFor(() => {
      const button = screen.getByRole('button', { name: /Thanh toán.*với VNPay/i }) as HTMLButtonElement;
      expect(button.disabled).toBe(false);
      return button;
    });
    fireEvent.click(payButton);

    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    expect(mockPush.mock.calls[0][0]).toContain('/checkout/result');
  });

  it('shows a truthful pending notice in real mode without demo opt-in', async () => {
    setNodeEnv('production');
    render(<PaymentHandoffView bookingId="booking-real-1" isDemo={false} />);

    await waitFor(() => {
      expect(screen.getByText(/PENDING_BE_INTEGRATION/)).toBeTruthy();
    });
  });
});
