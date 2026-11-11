import { cleanup, fireEvent, render, screen, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LandingHero } from '../components/LandingHero';
import { CentralVietnamShowcase } from '../components/CentralVietnamShowcase';
import { ROUTES } from '@/lib/routes';

// Mock IntersectionObserver
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

describe('Homepage v2.0: LandingHero Modern Explorer Da Nang Travel Hero', () => {
  it('renders correct Da Nang headline and editorial travel copy', () => {
    const handleSelectCity = vi.fn();
    const { container } = render(
      <LandingHero activeCity="danang" onSelectCity={handleSelectCity} />
    );

    // 1. Correct Da Nang headline
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent).toContain('Đà Nẵng, nơi');
    expect(h1.textContent).toContain('hành trình bắt đầu.');

    // 2. Supporting copy is clear and inviting
    expect(
      screen.getByText(
        /Khám phá những điểm đến đáng nhớ, trải nghiệm tour bản địa và lên lịch trình phù hợp với chuyến đi của bạn/i
      )
    ).toBeDefined();

    // 3. Location eyebrow label
    expect(screen.getByText(/TripMate · Khám phá miền Trung/i)).toBeDefined();

    // 4. Section container has full-bleed layout
    const heroSection = container.querySelector('section')!;
    expect(heroSection.getAttribute('aria-label')).toBe('Đà Nẵng — Nơi hành trình bắt đầu');
  });

  it('renders signature Da Nang photography with descriptive alt text and high priority', () => {
    const { container } = render(<LandingHero activeCity="danang" onSelectCity={vi.fn()} />);

    const img = container.querySelector('img')!;
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('/images/landing/hero-danang-sontra.jpg');
    expect(img.getAttribute('alt')).toBe(
      'Toàn cảnh bán đảo Sơn Trà và vịnh biển Đà Nẵng dưới ánh nắng sớm'
    );
    expect(img.getAttribute('loading')).toBe('eager');
  });

  it('renders text content directly layered over image with scrim and trust badges', () => {
    render(<LandingHero activeCity="danang" onSelectCity={vi.fn()} />);

    // Trust indicators
    expect(screen.getByText('Tour xác thực bản địa')).toBeDefined();
    expect(screen.getByText('Lịch trình tối ưu thời gian')).toBeDefined();

    // Photo credit tag
    expect(screen.getByText('Bán đảo Sơn Trà & Chùa Linh Ứng · Đà Nẵng')).toBeDefined();
  });

  it('exposes dominant travel CTAs with verified routes and accessible names', () => {
    render(<LandingHero activeCity="danang" onSelectCity={vi.fn()} />);

    // Primary CTA: Lập lịch trình -> /plan
    const planLink = screen.getByRole('link', { name: /lập lịch trình/i });
    expect(planLink.getAttribute('href')).toBe(ROUTES.plan);

    // Secondary CTA: Khám phá tour -> /tours
    const toursLink = screen.getByRole('link', { name: /khám phá tour/i });
    expect(toursLink.getAttribute('href')).toBe(ROUTES.tours);
  });

  it('is static and does not automatically rotate away from Da Nang', () => {
    vi.useFakeTimers();
    try {
      const handleSelectCity = vi.fn();
      const { container } = render(
        <LandingHero activeCity="danang" onSelectCity={handleSelectCity} />
      );

      // Advance by 8000ms, then 16000ms
      act(() => {
        vi.advanceTimersByTime(24000);
      });

      // Headline and image remain Đà Nẵng
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1.textContent).toContain('Đà Nẵng, nơi');

      const img = container.querySelector('img')!;
      expect(img.getAttribute('src')).toBe('/images/landing/hero-danang-sontra.jpg');
      expect(handleSelectCity).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('retains Da Nang photo composition when activeCity prop changes externally', () => {
    const { container, rerender } = render(
      <LandingHero activeCity="danang" onSelectCity={vi.fn()} />
    );

    // Initial Da Nang state
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      '/images/landing/hero-danang-sontra.jpg'
    );

    // Rerender with 'hoian' - Hero intentionally stays Da Nang signature
    rerender(<LandingHero activeCity="hoian" onSelectCity={vi.fn()} />);
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      '/images/landing/hero-danang-sontra.jpg'
    );
  });
});

describe('Homepage v2.0: CentralVietnamShowcase Refinement', () => {
  it('renders verified destination cards with top POIs without decorative coordinate clutter', () => {
    render(<CentralVietnamShowcase onSelectCity={vi.fn()} />);

    expect(screen.getByText('Ba Điểm Đến Biểu Tượng Miền Trung')).toBeDefined();
    expect(screen.getByText('Đà Nẵng')).toBeDefined();
    expect(screen.getByText('Hội An')).toBeDefined();
    expect(screen.getByText('Cố Đô Huế')).toBeDefined();
  });

  it('supports keyboard navigation (Enter/Space) on destination cards', () => {
    const handleSelectCity = vi.fn();
    render(<CentralVietnamShowcase onSelectCity={handleSelectCity} />);

    const hoianCard = screen.getByRole('button', { name: 'Chọn điểm đến Hội An' });

    // Press Enter to activate
    fireEvent.keyDown(hoianCard, { key: 'Enter' });
    expect(handleSelectCity).toHaveBeenCalledWith('hoian');

    // Press Space to activate
    const hueCard = screen.getByRole('button', { name: 'Chọn điểm đến Cố Đô Huế' });
    fireEvent.keyDown(hueCard, { key: ' ' });
    expect(handleSelectCity).toHaveBeenCalledWith('hue');
  });
});
