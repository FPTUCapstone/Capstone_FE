import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DEMO_TOUR_DETAIL_HOI_AN } from '../data/tourDemoFixtures';
import { realTourDetailViewModel } from '../__fixtures__/tourDetailWire';
import type { TourDetailDto } from '../types/tour';
import { TourDetailView } from './TourDetailView';

type Wire = Record<string, unknown>;
type WireSchedule = Record<string, unknown>;

function schedulesOf(wire: Wire): WireSchedule[] {
  return wire.schedules as WireSchedule[];
}

function renderView(
  tour: TourDetailDto = realTourDetailViewModel(),
  props: { isAuthenticated?: boolean; onBackToResults?: () => void } = {},
) {
  return render(<TourDetailView tour={tour} {...props} />);
}

function ctaLink(name: RegExp): HTMLAnchorElement {
  return screen.getByRole('link', { name }) as HTMLAnchorElement;
}

describe('TourDetailView (real data)', () => {
  it('shows the header: operator, phone, destinations, duration and rating', () => {
    renderView();

    expect(screen.getByRole('heading', { level: 1, name: 'Hội An food tour' })).toBeTruthy();
    expect(screen.getByText('Hoi An Tours')).toBeTruthy();
    expect(screen.getByText(/0900000000/)).toBeTruthy();
    expect(screen.getAllByText('Hội An').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Đà Nẵng').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Thời lượng: 2 ngày/)).toBeTruthy();
    expect(screen.getByText(/4\.5 \(2 đánh giá\)/)).toBeTruthy();
    expect(screen.queryByText(/CHẾ ĐỘ MÔ PHỎNG/)).toBeNull();
  });

  it('renders the itinerary stops with time, place, address, stay duration and notes', () => {
    renderView();

    const itinerary = screen.getByRole('region', { name: /Lịch Trình Chi Tiết/i });
    expect(within(itinerary).getByText('Ngày 1')).toBeTruthy();
    expect(within(itinerary).getByText('08:30')).toBeTruthy();
    expect(within(itinerary).getByText('Phố cổ Hội An')).toBeTruthy();
    expect(within(itinerary).getByText('Trần Phú')).toBeTruthy();
    expect(within(itinerary).getByText(/Lưu lại 90 phút/)).toBeTruthy();
    expect(within(itinerary).getByText('Có hướng dẫn viên')).toBeTruthy();
    expect(within(itinerary).getByText('Chùa Cầu')).toBeTruthy();
    expect(within(itinerary).getByText(/Lưu lại 30 phút/)).toBeTruthy();
    expect(within(itinerary).queryByText(/Lịch trình chi tiết đang được cập nhật/)).toBeNull();
  });

  it('shows the updating message when the itinerary is empty', () => {
    renderView(realTourDetailViewModel((wire) => { wire.itinerary = []; }));

    expect(screen.getByText(/Lịch trình chi tiết đang được cập nhật/)).toBeTruthy();
  });

  it('lists the inclusions and tells the traveler when exclusions were not provided', () => {
    renderView();

    const section = screen.getByRole('region', { name: /Dịch Vụ Bao Gồm/i });
    expect(within(section).getByText('Bữa sáng')).toBeTruthy();
    expect(within(section).getByText('Hướng dẫn viên')).toBeTruthy();
    expect(within(section).getByText('Vé tham quan')).toBeTruthy();
    expect(within(section).getByText(/chưa cung cấp/i)).toBeTruthy();
  });

  it('renders the cancellation rules as a list of notice ranges', () => {
    renderView();

    const section = screen.getByRole('region', { name: /Chính Sách Hoàn Hủy Tour/i });
    const items = within(section).getAllByRole('listitem').map((item) => item.textContent);
    expect(items).toEqual([
      'Hủy từ 30 ngày trước ngày khởi hành: miễn phí',
      'Hủy từ 15 đến 29 ngày trước: phí 25%',
      'Hủy từ 7 đến 14 ngày trước: phí 50%',
      'Hủy dưới 7 ngày trước: phí 100%',
    ]);
  });

  it('shows a placeholder when the tour has no cancellation rules', () => {
    renderView(realTourDetailViewModel((wire) => { wire.cancellationPolicy = { rules: [] }; }));

    const section = screen.getByRole('region', { name: /Chính Sách Hoàn Hủy Tour/i });
    expect(within(section).queryAllByRole('listitem')).toHaveLength(0);
    expect(within(section).getByText(/chưa có thông tin/i)).toBeTruthy();
  });

  it('shows Vietnam local departure time, not the host time zone', () => {
    renderView(
      realTourDetailViewModel((wire) => {
        schedulesOf(wire)[0].startAtUtc = '2026-11-01T18:30:00Z';
        schedulesOf(wire)[0].endAtUtc = '2026-11-03T17:00:00Z';
      }),
    );

    const first = screen.getByRole('button', { name: /02\/11\/2026/ });
    expect(first.textContent).toContain('01:30');
    expect(first.textContent).toContain('04/11/2026');
  });

  describe('departures and booking', () => {
    it('preselects the first bookable departure and shows its slots, prices and meeting point', () => {
      renderView();

      const buttons = screen.getAllByRole('button', { name: /\d{2}\/\d{2}\/\d{4}/ });
      expect(buttons).toHaveLength(2);
      expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
      expect(buttons[0].textContent).toContain('Còn 7 chỗ');
      expect(buttons[1].hasAttribute('disabled')).toBe(true);
      expect(buttons[1].textContent).toContain('Hết chỗ');
      expect(screen.getByText(/1\.500\.000/)).toBeTruthy();
      expect(screen.getByText(/Trẻ em/)).toBeTruthy();
      expect(screen.getAllByText('Sảnh khách sạn').length).toBeGreaterThanOrEqual(1);
    });

    it('lets the traveler switch between bookable departures and updates price, meeting point and link', () => {
      const tour = realTourDetailViewModel((wire) => {
        schedulesOf(wire).push({
          ...schedulesOf(wire)[0],
          scheduleId: '13',
          startAtUtc: '2026-12-01T01:00:00Z',
          endAtUtc: '2026-12-03T10:00:00Z',
          meetingPoint: 'Cổng B',
          adultPrice: 1700000,
          childPrice: null,
          remainingSlots: 3,
        });
      });
      renderView(tour, { isAuthenticated: true });
      expect(ctaLink(/Đặt tour ngay/).getAttribute('href')).toBe(
        '/tours/9007199254740993/book?scheduleId=11',
      );

      fireEvent.click(screen.getByRole('button', { name: /01\/12\/2026/ }));

      expect(ctaLink(/Đặt tour ngay/).getAttribute('href')).toBe(
        '/tours/9007199254740993/book?scheduleId=13',
      );
      expect(screen.getByText(/1\.700\.000/)).toBeTruthy();
      expect(screen.getAllByText('Cổng B').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText(/Trẻ em/)).toBeNull();
    });

    it('sends a guest to sign-in and returns to the booking step', () => {
      renderView(realTourDetailViewModel(), { isAuthenticated: false });

      const link = ctaLink(/Đăng nhập để đặt tour/);
      expect(link.getAttribute('href')).toBe(
        `/sign-in?returnUrl=${encodeURIComponent('/tours/9007199254740993/book?scheduleId=11')}`,
      );
    });

    it('sends an authenticated traveler straight to the booking step', () => {
      renderView(realTourDetailViewModel(), { isAuthenticated: true });

      expect(ctaLink(/Đặt tour ngay/).getAttribute('href')).toBe('/tours/9007199254740993/book?scheduleId=11');
      expect(screen.queryByRole('link', { name: /Đăng nhập để đặt tour/ })).toBeNull();
    });

    it('disables Book Now and explains when every departure is sold out (BR-60)', () => {
      renderView(
        realTourDetailViewModel((wire) => {
          schedulesOf(wire)[0].availabilityStatus = 'soldOut';
          schedulesOf(wire)[0].remainingSlots = 0;
          schedulesOf(wire)[0].bookable = false;
          wire.hasBookableSchedule = false;
        }),
        { isAuthenticated: true },
      );

      const disabled = screen.getByRole('button', { name: /Tạm hết chỗ \(MSG65\)/ });
      expect(disabled.hasAttribute('disabled')).toBe(true);
      expect(screen.queryByRole('link', { name: /Đặt tour|Đăng nhập để đặt tour/ })).toBeNull();
    });

    it('does not offer a departure whose registration has closed even if slots remain', () => {
      renderView(
        realTourDetailViewModel((wire) => {
          wire.schedules = [{ ...schedulesOf(wire)[0], bookable: false }];
          wire.hasBookableSchedule = false;
        }),
        { isAuthenticated: true },
      );

      const departure = screen.getByRole('button', { name: /01\/11\/2026/ });
      expect(departure.hasAttribute('disabled')).toBe(true);
      expect(departure.textContent).toContain('Đã đóng đăng ký');
      expect(screen.queryByRole('link', { name: /Đặt tour ngay/ })).toBeNull();
    });

    it('never treats an unknown capacity snapshot as bookable', () => {
      renderView(
        realTourDetailViewModel((wire) => {
          wire.schedules = [
            { ...schedulesOf(wire)[0], availabilityStatus: 'unknown', remainingSlots: null, bookable: false },
          ];
          wire.hasBookableSchedule = false;
        }),
        { isAuthenticated: true },
      );

      const departure = screen.getByRole('button', { name: /01\/11\/2026/ });
      expect(departure.hasAttribute('disabled')).toBe(true);
      expect(departure.textContent).toContain('Chưa xác định số chỗ');
      expect(screen.queryByRole('link', { name: /Đặt tour ngay/ })).toBeNull();
    });

    it('tells the traveler when no departure has been published yet', () => {
      renderView(
        realTourDetailViewModel((wire) => {
          wire.schedules = [];
          wire.hasBookableSchedule = false;
        }),
      );

      expect(screen.getByText(/chưa có lịch khởi hành mới/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /Tạm hết chỗ \(MSG65\)/ }).hasAttribute('disabled')).toBe(true);
    });

    it('states that the slot counts are a snapshot, not a reservation (BR-59)', () => {
      renderView();

      expect(screen.getByText(/Số chỗ cập nhật lúc/)).toBeTruthy();
      expect(screen.getByText(/không phải là giữ chỗ/i)).toBeTruthy();
    });
  });

  describe('reviews', () => {
    it('shows MSG128 when the tour has no review yet', () => {
      renderView(realTourDetailViewModel((wire) => { wire.rating = { average: null, count: 0 }; }));

      const section = screen.getByRole('region', { name: /Đánh Giá Từ Du Khách/i });
      expect(within(section).getByText(/MSG128/)).toBeTruthy();
      expect(screen.queryByText(/đánh giá\)/)).toBeNull();
    });

    it('shows only the aggregate when reviews exist, without inventing review text', () => {
      renderView();

      const section = screen.getByRole('region', { name: /Đánh Giá Từ Du Khách/i });
      expect(within(section).getByText(/4\.5 \/ 5\.0/)).toBeTruthy();
      expect(within(section).getByText(/2 đánh giá/)).toBeTruthy();
      expect(within(section).queryByText(/MSG128/)).toBeNull();
      expect(within(section).getByText(/chưa hiển thị nội dung từng đánh giá/i)).toBeTruthy();
    });
  });

  it('calls the back handler', () => {
    const onBack = vi.fn();
    renderView(realTourDetailViewModel(), { onBackToResults: onBack });

    fireEvent.click(screen.getByRole('button', { name: /Quay lại kết quả tìm kiếm/ }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('TourDetailView (demo data)', () => {
  it('still renders the demo fixture with its banner and demo booking link', () => {
    renderView({ ...DEMO_TOUR_DETAIL_HOI_AN, isDemo: true });

    expect(screen.getByText(/CHẾ ĐỘ MÔ PHỎNG \(DEMO ONLY\)/)).toBeTruthy();
    expect(screen.getAllByText(DEMO_TOUR_DETAIL_HOI_AN.title).length).toBeGreaterThanOrEqual(1);
    const link = ctaLink(/Đăng nhập để đặt tour/);
    expect(link.getAttribute('href')).toContain('demo=1');
  });
});
