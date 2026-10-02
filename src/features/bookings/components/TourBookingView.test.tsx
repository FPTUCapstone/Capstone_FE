import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEMO_TOUR_DETAIL_HOI_AN } from '@/features/public/tours/data/tourDemoFixtures';
import { TourBookingView } from './TourBookingView';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

function setNodeEnv(val?: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = val;
}

describe('TourBookingView (UC-27 & UC-28 Step 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setNodeEnv('development');
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
  });

  it('renders tour title, schedule and traveler selection controls', () => {
    render(
      <TourBookingView
        tour={DEMO_TOUR_DETAIL_HOI_AN}
        initialScheduleId="9007199254740997"
        isDemo={true}
        userContext={{
          userId: 1,
          email: 'traveler@tripmate.vn',
          fullName: 'Nguyễn Minh Phúc',
          role: 'Traveler',
          status: 'Active',
          applicationStatus: null,
          applicationUnresolved: false,
          accessToken: 'mock-token',
          accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
        }}
      />,
    );

    expect(screen.getByText('Xác nhận đặt tour (UC-27)')).toBeTruthy();
    expect(screen.getAllByText(DEMO_TOUR_DETAIL_HOI_AN.title).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Endpoint Travel Miền Trung')).toBeTruthy();
    expect(screen.getByText('Số lượng khách tham gia')).toBeTruthy();
    expect(screen.getByText('Người lớn')).toBeTruthy();
    expect(screen.getByText(/Trẻ em/)).toBeTruthy();
  });

  it('adjusts traveler count and updates price calculation', async () => {
    render(
      <TourBookingView
        tour={DEMO_TOUR_DETAIL_HOI_AN}
        initialScheduleId="9007199254740997"
        isDemo={true}
        userContext={null}
      />,
    );

    // Initial state: 2 adults, 1 child. Subtotal = 2 * 800k + 1 * 400k = 2,000,000. With 15% coupon = 1,700,000
    expect(screen.getByText(/1\.700\.000/)).toBeTruthy();

    // Click decrease child count: 2 adults, 0 child. Subtotal = 1,600,000. With 15% coupon = 1,360,000
    const decreaseChildBtn = screen.getByLabelText('Giảm 1 trẻ em');
    fireEvent.click(decreaseChildBtn);

    expect(screen.getByText(/1\.360\.000/)).toBeTruthy();
  });

  it('allows applying a valid coupon code and shows percentage badge', async () => {
    render(
      <TourBookingView
        tour={DEMO_TOUR_DETAIL_HOI_AN}
        initialScheduleId="9007199254740997"
        isDemo={true}
        userContext={null}
      />,
    );

    // Initially HOIAN15 is applied in demo. Remove it first
    const removeBtn = screen.getByText('Gỡ bỏ');
    fireEvent.click(removeBtn);

    // Enter BANA15 and apply
    const input = screen.getByPlaceholderText(/Ví dụ: HOIAN15/);
    fireEvent.change(input, { target: { value: 'BANA15' } });
    fireEvent.click(screen.getByText('Áp dụng'));

    expect(screen.getByText('BANA15')).toBeTruthy();
    expect(screen.getByText('-15%')).toBeTruthy();
  });

  it('transitions to Step 2 (Payment Handoff) after successful booking creation in demo mode', async () => {
    render(
      <TourBookingView
        tour={DEMO_TOUR_DETAIL_HOI_AN}
        initialScheduleId="9007199254740997"
        isDemo={true}
        userContext={null}
      />,
    );

    const submitBtn = screen.getByRole('button', { name: /Tiếp tục thanh toán/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Thanh toán điện tử (UC-28)')).toBeTruthy();
      expect(screen.getByText('VNPay Gateway')).toBeTruthy();
      expect(screen.getByText('VNPay QR Code')).toBeTruthy();
      expect(screen.getByText(/Giữ chỗ trong/)).toBeTruthy();
    });
  });
});
