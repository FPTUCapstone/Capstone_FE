import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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

  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

  if (typeof window.PointerEvent === 'undefined') {
    class MockPointerEvent extends MouseEvent {
      readonly pointerId: number;
      readonly pointerType: string;
      constructor(type: string, params: PointerEventInit = {}) {
        super(type, params);
        this.pointerId = params.pointerId ?? 0;
        this.pointerType = params.pointerType ?? 'mouse';
      }
    }
    window.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;
  }

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
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

  describe('Horizontal Carousel Enhancements & Accessibility', () => {
    it('renders accessible carousel container and slide elements with ARIA roles', () => {
      render(<FeaturedToursSection />);

      const carousel = screen.getByRole('region', { name: /Tour Trải Nghiệm Bản Địa Đã Kiểm Duyệt/i });
      expect(carousel).toBeDefined();
      expect(carousel.getAttribute('aria-roledescription')).toBe('carousel');

      const slides = screen.getAllByRole('group');
      const tourSlides = slides.filter((s) => s.getAttribute('aria-roledescription') === 'slide');
      expect(tourSlides.length).toBe(VERIFIED_TOURS.length);
    });

    it('automatically hides arrow controls at boundaries and loops back to the start when reaching the end', () => {
      render(<FeaturedToursSection />);

      // At start (slide 0): no cards to the left, so left arrow automatically disappears
      expect(screen.queryByRole('button', { name: 'Tour trước đó' })).toBeNull();
      const nextButton = screen.getByRole('button', { name: 'Tour tiếp theo' });
      expect(nextButton).toBeDefined();

      // Advance with Next button to slide 1
      fireEvent.click(nextButton);

      // Now on slide 1: cards exist on both sides, so both buttons are visible
      const tabIndicators = screen.getAllByRole('tab');
      expect(tabIndicators[1].getAttribute('aria-selected')).toBe('true');
      expect(screen.getByRole('button', { name: 'Tour trước đó' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Tour tiếp theo' })).toBeDefined();

      // Advance to slide 2
      fireEvent.click(screen.getByRole('button', { name: 'Tour tiếp theo' }));
      expect(tabIndicators[2].getAttribute('aria-selected')).toBe('true');

      // Advance to slide 3 (maxIndex / end)
      fireEvent.click(screen.getByRole('button', { name: 'Tour tiếp theo' }));
      expect(tabIndicators[3].getAttribute('aria-selected')).toBe('true');

      // At end (slide 3): no cards to the right, so right arrow automatically disappears
      expect(screen.queryByRole('button', { name: 'Tour tiếp theo' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Tour trước đó' })).toBeDefined();

      // Can navigate back towards the start with Previous button
      fireEvent.click(screen.getByRole('button', { name: 'Tour trước đó' }));
      expect(tabIndicators[2].getAttribute('aria-selected')).toBe('true');
      fireEvent.click(screen.getByRole('button', { name: 'Tour trước đó' }));
      expect(tabIndicators[1].getAttribute('aria-selected')).toBe('true');
      fireEvent.click(screen.getByRole('button', { name: 'Tour trước đó' }));
      expect(tabIndicators[0].getAttribute('aria-selected')).toBe('true');

      // Back at start (slide 0): left arrow disappears again
      expect(screen.queryByRole('button', { name: 'Tour trước đó' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Tour tiếp theo' })).toBeDefined();
    });

    it('supports keyboard navigation via ArrowLeft and ArrowRight', () => {
      render(<FeaturedToursSection />);

      const carousel = screen.getByRole('region', { name: /Tour Trải Nghiệm Bản Địa Đã Kiểm Duyệt/i });

      // Navigate right
      fireEvent.keyDown(carousel, { key: 'ArrowRight' });
      const tabIndicators = screen.getAllByRole('tab');
      expect(tabIndicators[1].getAttribute('aria-selected')).toBe('true');

      // Navigate left
      fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
      expect(tabIndicators[0].getAttribute('aria-selected')).toBe('true');
    });

    it('resets active slide when filtering and disables controls when dataset is not scrollable', () => {
      render(<FeaturedToursSection />);

      // Advance to slide 1
      const nextButton = screen.getAllByRole('button', { name: 'Tour tiếp theo' })[0];
      fireEvent.click(nextButton);

      // Switch to Hoi An (only 1 tour)
      const hoianPill = screen.getByRole('button', { name: 'Hội An' });
      fireEvent.click(hoianPill);

      // Verify only 1 card is rendered and NEVER duplicated
      const viewDetailButtons = screen.getAllByRole('button', { name: 'Xem chi tiết' });
      expect(viewDetailButtons.length).toBe(1);

      // Navigation controls and pagination should be hidden/disabled
      expect(screen.queryByRole('button', { name: 'Tour tiếp theo' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Tour trước đó' })).toBeNull();
      expect(screen.queryByRole('tablist')).toBeNull();

      // Return to 'Tất cả'
      const allPill = screen.getByRole('button', { name: /Tất cả/i });
      fireEvent.click(allPill);

      // Active slide is reset to 0
      const tabIndicators = screen.getAllByRole('tab');
      expect(tabIndicators[0].getAttribute('aria-selected')).toBe('true');
    });

    it('pauses autoplay when hovered or focused, and cleans up timers on unmount', () => {
      vi.useFakeTimers();

      const { unmount } = render(<FeaturedToursSection />);
      const carousel = screen.getByRole('region', { name: /Tour Trải Nghiệm Bản Địa Đã Kiểm Duyệt/i });

      // Initially at slide 0
      let tabIndicators = screen.getAllByRole('tab');
      expect(tabIndicators[0].getAttribute('aria-selected')).toBe('true');

      // Fast-forward 4000ms -> slides to index 1
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      tabIndicators = screen.getAllByRole('tab');
      expect(tabIndicators[1].getAttribute('aria-selected')).toBe('true');

      // Hover over carousel to pause autoplay
      fireEvent.mouseEnter(carousel);

      act(() => {
        vi.advanceTimersByTime(8000);
      });
      // Should remain paused on slide 1
      expect(tabIndicators[1].getAttribute('aria-selected')).toBe('true');

      // Leave hover to resume autoplay
      fireEvent.mouseLeave(carousel);

      act(() => {
        vi.advanceTimersByTime(4000);
      });
      // Advances to slide 2
      expect(tabIndicators[2].getAttribute('aria-selected')).toBe('true');

      // Focus also pauses autoplay
      fireEvent.focus(carousel);
      act(() => {
        vi.advanceTimersByTime(8000);
      });
      expect(tabIndicators[2].getAttribute('aria-selected')).toBe('true');

      // Blur resumes autoplay
      fireEvent.blur(carousel);
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      // Advances to slide 3 (the end)
      expect(tabIndicators[3].getAttribute('aria-selected')).toBe('true');

      // Next autoplay tick: reaching the end automatically returns to slide 0
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(tabIndicators[0].getAttribute('aria-selected')).toBe('true');

      // Continues transitioning forward to slide 1
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(tabIndicators[1].getAttribute('aria-selected')).toBe('true');

      // Unmount cleanly without errors
      unmount();
      vi.useRealTimers();
    });

    it('respects prefers-reduced-motion by disabling autoplay', () => {
      vi.useFakeTimers();

      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(<FeaturedToursSection />);
      const tabIndicators = screen.getAllByRole('tab');
      expect(tabIndicators[0].getAttribute('aria-selected')).toBe('true');

      act(() => {
        vi.advanceTimersByTime(9000);
      });

      // Does not advance because motion is reduced
      expect(tabIndicators[0].getAttribute('aria-selected')).toBe('true');

      vi.useRealTimers();
    });

    it('handles pointer drag and suppresses accidental modal trigger during drag', () => {
      render(<FeaturedToursSection />);
      const carousel = screen.getByRole('region', { name: /Tour Trải Nghiệm Bản Địa Đã Kiểm Duyệt/i });

      // Start drag gesture
      fireEvent(carousel, new PointerEvent('pointerdown', { clientX: 200, pointerId: 1, pointerType: 'touch', bubbles: true }));
      fireEvent(carousel, new PointerEvent('pointermove', { clientX: 120, pointerId: 1, pointerType: 'touch', bubbles: true })); // -80px drag left
      fireEvent(carousel, new PointerEvent('pointerup', { clientX: 120, pointerId: 1, pointerType: 'touch', bubbles: true }));

      // Slide advanced
      const tabIndicators = screen.getAllByRole('tab');
      expect(tabIndicators[1].getAttribute('aria-selected')).toBe('true');
    });
  });
});
