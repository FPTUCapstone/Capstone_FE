import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as bookingApi from '@/features/bookings/services/bookingApi';
import { DEMO_TOUR_DETAIL_HOI_AN } from '@/features/public/tours/data/tourDemoFixtures';
import { realTourDetailViewModel } from '@/features/public/tours/__fixtures__/tourDetailWire';
import { TourBookingView } from './TourBookingView';

const mockPush = vi.fn();
const TRAVELER_CONTEXT = {
  userId: 1,
  email: 'traveler@tripmate.vn',
  fullName: 'Nguyễn Minh Phúc',
  role: 'Traveler' as const,
  status: 'Active' as const,
  applicationStatus: null,
  applicationUnresolved: false,
  accessToken: 'mock-token',
  accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
};
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

function setNodeEnv(val?: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = val;
}

describe('TourBookingView (UC-27 & UC-28 Step 1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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

    // Initial state: 2 adults, 1 child. Subtotal = 2 * 800k + 1 * 400k = 2,000,000. With 15% coupon = 1,700,000.
    // The total comes from the server quote (BR-63), fetched asynchronously after a debounce.
    await waitFor(() => expect(screen.getByText(/1\.700\.000/)).toBeTruthy());

    // Click decrease child count: 2 adults, 0 child. Subtotal = 1,600,000. With 15% coupon = 1,360,000
    const decreaseChildBtn = screen.getByLabelText('Giảm 1 trẻ em');
    fireEvent.click(decreaseChildBtn);

    await waitFor(() => expect(screen.getByText(/1\.360\.000/)).toBeTruthy());
  });

  it('allows applying a valid coupon code and the server quote reflects the discount', async () => {
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

    // Enter BANA15 and apply — this only stages the code; the next quote decides eligibility.
    const input = screen.getByPlaceholderText(/Ví dụ: HOIAN15/);
    fireEvent.change(input, { target: { value: 'BANA15' } });
    fireEvent.click(screen.getByText('Áp dụng'));

    await waitFor(() => {
      expect(screen.getByText('BANA15')).toBeTruthy();
      expect(screen.getByText('Đã áp dụng')).toBeTruthy();
      expect(screen.getByText(/Giảm giá \(BANA15\)/)).toBeTruthy();
    });
  });

  it('TERMS-1 & TERMS-6: terms consent checkbox defaults unchecked in both real and demo modes', () => {
    render(
      <TourBookingView
        tour={DEMO_TOUR_DETAIL_HOI_AN}
        initialScheduleId="9007199254740997"
        isDemo={true}
        userContext={null}
      />,
    );

    const checkbox = screen.getByRole('checkbox', {
      name: /Điều khoản đặt tour & Chính sách hoàn hủy/i,
    }) as HTMLInputElement;

    expect(checkbox.checked).toBe(false);
  });

  it('DEMO-LOCK: submit stays disabled in demo mode regardless of consent, and never calls createBooking', async () => {
    const createBookingSpy = vi.spyOn(bookingApi, 'createBooking');

    render(
      <TourBookingView
        tour={DEMO_TOUR_DETAIL_HOI_AN}
        initialScheduleId="9007199254740997"
        isDemo={true}
        userContext={null}
      />,
    );

    await waitFor(() => expect(screen.getByText(/1\.700\.000/)).toBeTruthy());
    const checkbox = screen.getByRole('checkbox', {
      name: /Điều khoản đặt tour & Chính sách hoàn hủy/i,
    });
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole('button', { name: /Đặt tour thật không khả dụng ở chế độ Demo/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
    fireEvent.click(submitBtn);

    expect(createBookingSpy).not.toHaveBeenCalled();
  });

  describe('real mode (isDemo=false)', () => {
    beforeEach(() => {
      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) => {
          if (url.toString().endsWith('/quote')) {
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  tourId: '9007199254740995', tourScheduleId: '9007199254740997', currency: 'VND',
                  participantCounts: { adult: 2, child: 1, infant: 0 },
                  priceBreakdown: [
                    { participantType: 'Adult', quantity: 2, unitPrice: 800000, lineAmount: 1600000 },
                    { participantType: 'Child', quantity: 1, unitPrice: 400000, lineAmount: 400000 },
                    { participantType: 'Infant', quantity: 0, unitPrice: 800000, lineAmount: 0 },
                  ],
                  subtotalAmount: 2000000, discountAmount: 0, totalAmount: 2000000,
                  remainingSlots: 5, appliedVoucher: null,
                }),
                { status: 200, headers: { 'content-type': 'application/json' } },
              ),
            );
          }
          return Promise.resolve(
            new Response(
              JSON.stringify({
                bookingId: '456', bookingCode: 'BK-20261017-00001', status: 'PendingPayment',
                tourScheduleId: '9007199254740997', currency: 'VND', subtotalAmount: 2000000,
                discountAmount: 0, totalAmount: 2000000,
                paymentExpiresAt: '2026-10-17T10:30:00Z', createdAt: '2026-10-17T10:15:00Z',
              }),
              { status: 201, headers: { 'content-type': 'application/json' } },
            ),
          );
        }),
      );
    });

    it('marks the required consent checkbox inline when the traveler attempts to submit without accepting', async () => {
      render(
        <TourBookingView
          tour={DEMO_TOUR_DETAIL_HOI_AN}
          initialScheduleId="9007199254740997"
          isDemo={false}
          userContext={TRAVELER_CONTEXT}
          profilePhone="0905123456"
        />,
      );

      const submitBtn = screen.getByRole('button', { name: /Tiếp tục thanh toán/i }) as HTMLButtonElement;
      const checkbox = screen.getByRole('checkbox', {
        name: /Điều khoản đặt tour & Chính sách hoàn hủy/i,
      }) as HTMLInputElement;

      await waitFor(() => expect(screen.getByText(/2\.000\.000/)).toBeTruthy());
      expect(submitBtn.disabled).toBe(false);
      fireEvent.click(submitBtn);

      await waitFor(() => expect(document.activeElement).toBe(checkbox));
      expect(checkbox.getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByText('Vui lòng đồng ý với điều khoản đặt tour và chính sách hoàn hủy.')).toBeTruthy();

      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
      expect(checkbox.getAttribute('aria-invalid')).toBe('false');
    });

    it('creates the booking and shows a confirmation panel whose "Pay now" navigates to the UC-28 entry point', async () => {
      render(
        <TourBookingView
          tour={DEMO_TOUR_DETAIL_HOI_AN}
          initialScheduleId="9007199254740997"
          isDemo={false}
          userContext={TRAVELER_CONTEXT}
          profilePhone="0905123456"
        />,
      );

      await waitFor(() => expect(screen.getByText(/2\.000\.000/)).toBeTruthy());
      fireEvent.click(
        screen.getByRole('checkbox', { name: /Điều khoản đặt tour & Chính sách hoàn hủy/i }),
      );
      const submitBtn = screen.getByRole('button', { name: /Tiếp tục thanh toán/i });
      await waitFor(() => expect((submitBtn as HTMLButtonElement).disabled).toBe(false));
      fireEvent.click(submitBtn);

      await waitFor(() => expect(screen.getByText('BK-20261017-00001')).toBeTruthy());
      // UC-27 stops here: no payment-method selector or gateway call is rendered on this screen.
      expect(screen.queryByText('VNPay Gateway')).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: /Thanh toán ngay/i }));
      expect(mockPush).toHaveBeenCalledWith('/bookings/456/pay');
    });

    it('prefills the lead phone from the traveler profile', () => {
      render(
        <TourBookingView
          tour={DEMO_TOUR_DETAIL_HOI_AN}
          initialScheduleId="9007199254740997"
          isDemo={false}
          userContext={TRAVELER_CONTEXT}
          profilePhone="0905123456"
        />,
      );

      expect((screen.getByLabelText('Số điện thoại liên hệ *') as HTMLInputElement).value).toBe('0905123456');
    });

    it('lets a traveler clear the profile phone, then focuses and highlights it instead of showing a global alert', async () => {
      const alertSpy = vi.fn();
      vi.stubGlobal('alert', alertSpy);
      render(
        <TourBookingView
          tour={DEMO_TOUR_DETAIL_HOI_AN}
          initialScheduleId="9007199254740997"
          isDemo={false}
          userContext={TRAVELER_CONTEXT}
          profilePhone="0905123456"
        />,
      );

      await waitFor(() => expect(screen.getByText(/2\.000\.000/)).toBeTruthy());
      const phoneInput = screen.getByLabelText('Số điện thoại liên hệ *') as HTMLInputElement;
      fireEvent.change(phoneInput, { target: { value: '' } });
      expect(phoneInput.value).toBe('');
      fireEvent.click(screen.getByRole('checkbox', { name: /Điều khoản đặt tour & Chính sách hoàn hủy/i }));
      const submitButton = screen.getByRole('button', { name: /Tiếp tục thanh toán/i });
      await waitFor(() => expect((submitButton as HTMLButtonElement).disabled).toBe(false));
      fireEvent.click(submitButton);

      await waitFor(() => expect(document.activeElement).toBe(phoneInput));
      expect(phoneInput.getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByRole('alert').textContent).toContain('Vui lòng nhập số điện thoại liên hệ để tiếp tục đặt tour.');
      expect(screen.queryByText('Không thể tạo đơn đặt tour')).toBeNull();
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it('shows every missing required field inline and focuses the first one', async () => {
      render(
        <TourBookingView
          tour={DEMO_TOUR_DETAIL_HOI_AN}
          initialScheduleId="9007199254740997"
          isDemo={false}
          userContext={null}
        />,
      );

      await waitFor(() => expect(screen.getByText(/2\.000\.000/)).toBeTruthy());
      fireEvent.click(screen.getByRole('button', { name: /Tiếp tục thanh toán/i }));

      const nameInput = screen.getByLabelText('Họ và tên trưởng đoàn *');
      await waitFor(() => expect(document.activeElement).toBe(nameInput));
      expect(nameInput.getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByLabelText('Số điện thoại liên hệ *').getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByLabelText('Email nhận vé điện tử *').getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByRole('checkbox', { name: /Điều khoản đặt tour & Chính sách hoàn hủy/i }).getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByText('Vui lòng nhập họ và tên trưởng đoàn.')).toBeTruthy();
      expect(screen.getByText('Vui lòng nhập số điện thoại liên hệ để tiếp tục đặt tour.')).toBeTruthy();
      expect(screen.getByText('Vui lòng nhập email nhận vé điện tử.')).toBeTruthy();
      expect(screen.getByText('Vui lòng đồng ý với điều khoản đặt tour và chính sách hoàn hủy.')).toBeTruthy();
    });
  });
});

describe('TourBookingView with real tour detail data (UC-26 handoff)', () => {
  type WireRecord = Record<string, unknown>;

  const clone = (value: WireRecord): WireRecord => ({ ...value });

  function renderReal(
    mutate: (wire: WireRecord) => void,
    initialScheduleId?: string,
  ) {
    const tour = realTourDetailViewModel(mutate);
    render(<TourBookingView tour={tour} initialScheduleId={initialScheduleId} isDemo={false} userContext={null} />);
    return tour;
  }

  it('does not preselect a departure the server says is not bookable, even when requested by link', () => {
    renderReal((wire) => {
      const [first] = wire.schedules as WireRecord[];
      wire.schedules = [
        { ...clone(first), scheduleId: '11', bookable: false, remainingSlots: 7 },
        { ...clone(first), scheduleId: '13', startAtUtc: '2026-12-01T01:00:00Z', endAtUtc: '2026-12-03T10:00:00Z' },
      ];
    }, '11');

    const departures = screen.getAllByRole('button', { name: /\d{2}\/\d{2}\/\d{4}/ });
    expect(departures[0].hasAttribute('disabled')).toBe(true);
    expect(departures[1].hasAttribute('disabled')).toBe(false);
    expect(screen.getByText(/Khởi hành: .*01\/12\/2026/)).toBeTruthy();
  });

  it('cannot continue to payment when no departure is bookable', () => {
    renderReal((wire) => {
      const [first] = wire.schedules as WireRecord[];
      wire.schedules = [{ ...clone(first), bookable: false, remainingSlots: 7 }];
      wire.hasBookableSchedule = false;
    }, '11');

    fireEvent.click(
      screen.getByRole('checkbox', { name: /Điều khoản đặt tour & Chính sách hoàn hủy/i }),
    );
    fireEvent.change(screen.getByPlaceholderText(/Ví dụ: 0905 123 456/), { target: { value: '0905123456' } });

    const submit = screen.getByRole('button', { name: /Tiếp tục thanh toán/i }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });

  it('shows the meeting point of the chosen departure and never invents one', () => {
    renderReal(() => undefined, '11');
    expect(screen.getByText(/Điểm đón: Sảnh khách sạn/)).toBeTruthy();
  });

  it('says the meeting point is being updated instead of showing a made-up city', () => {
    renderReal((wire) => {
      const [first] = wire.schedules as WireRecord[];
      wire.schedules = [{ ...clone(first), meetingPoint: null }];
    }, '11');

    expect(screen.getByText(/Điểm đón: Đang cập nhật/)).toBeTruthy();
    expect(screen.queryByText(/Đà Nẵng/)).toBeNull();
  });
});
