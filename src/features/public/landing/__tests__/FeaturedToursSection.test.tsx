import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FeaturedToursSection } from '../components/FeaturedToursSection';
import { ROUTES } from '@/lib/routes';
import { VERIFIED_TOURS } from '@/data/landingData';

beforeEach(() => {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this);
    }
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  window.IntersectionObserver = MockIntersectionObserver;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('FeaturedToursSection safety regression & behavior', () => {
  it('renders verified tour cards and filter pills', () => {
    render(<FeaturedToursSection />);

    expect(screen.getByRole('heading', { level: 2, name: /Tour Trải Nghiệm Bản Địa/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Xem tất cả tour/i }).getAttribute('href')).toBe(ROUTES.tours);

    // Initial filter shows all tours
    const viewDetailButtons = screen.getAllByRole('button', { name: 'Xem chi tiết' });
    expect(viewDetailButtons.length).toBe(VERIFIED_TOURS.length);
  });

  it('filters tours by destination city pill', () => {
    render(<FeaturedToursSection />);

    const danangPill = screen.getByRole('button', { name: 'Đà Nẵng' });
    fireEvent.click(danangPill);

    const danangCount = VERIFIED_TOURS.filter((t) => t.city === 'Đà Nẵng').length;
    const viewDetailButtons = screen.getAllByRole('button', { name: 'Xem chi tiết' });
    expect(viewDetailButtons.length).toBe(danangCount);
  });

  describe('Modal safety regression (no fake booking / fake tickets / fake QR)', () => {
    it('opens informational preview modal linking to ROUTES.tours without fake transaction simulation', () => {
      render(<FeaturedToursSection />);

      const firstTour = VERIFIED_TOURS[0];
      const viewDetailButtons = screen.getAllByRole('button', { name: 'Xem chi tiết' });
      fireEvent.click(viewDetailButtons[0]);

      // Informational modal elements exist
      const closeBtn = screen.getByRole('button', { name: 'Đóng' });
      const modal = closeBtn.closest<HTMLElement>('.fixed')!;
      expect(modal).toBeDefined();

      expect(within(modal).getByRole('heading', { level: 3, name: firstTour.title })).toBeDefined();
      expect(within(modal).getByText(firstTour.operator)).toBeDefined();
      expect(within(modal).getByText(firstTour.duration)).toBeDefined();
      expect(within(modal).getByText('Bảo chứng TripMate Escrow')).toBeDefined();
      expect(within(modal).getByText('Đã kiểm duyệt')).toBeDefined();
      expect(within(modal).getByText('Giá từ:')).toBeDefined();
      expect(within(modal).getByText(firstTour.price)).toBeDefined();

      // Truthful navigation link to ROUTES.tours
      const exploreLink = within(modal).getByRole('link', { name: /Khám phá tour & Lịch khởi hành/i });
      expect(exploreLink).toBeDefined();
      expect(exploreLink.getAttribute('href')).toBe(ROUTES.tours);

      // CRITICAL SAFETY REGRESSION ASSERTIONS:
      // Must NOT simulate booking completion or generate fake tickets
      expect(within(modal).queryByText('Đặt Tour Thành Công!')).toBeNull();
      expect(within(modal).queryByText(/#TM-PASS/i)).toBeNull();
      expect(within(modal).queryByText(/Làm mới mã sau:/i)).toBeNull();
      expect(within(modal).queryByText(/An toàn 100%/i)).toBeNull();
      expect(within(modal).queryByText(/Hoàn 100%/i)).toBeNull();
      expect(within(modal).queryByRole('button', { name: /Xác nhận Đặt tour & Cấp vé QR/i })).toBeNull();

      // Dismiss modal
      fireEvent.click(closeBtn);

      expect(screen.queryByRole('button', { name: 'Đóng' })).toBeNull();
    });
  });
});
