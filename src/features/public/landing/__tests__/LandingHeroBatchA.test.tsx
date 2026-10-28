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

describe('Homepage v2.0: LandingHero Editorial Travel & Destination Discovery', () => {
  it('renders solid calm headline and editorial travel copy with Central Vietnam scenic photography', () => {
    const handleSelectCity = vi.fn();
    const { container } = render(
      <LandingHero activeCity="danang" onSelectCity={handleSelectCity} />
    );

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent).toContain('Khám phá miền Trung theo cách của bạn');

    // Supporting copy is clear and inviting
    expect(
      screen.getByText(
        /Tìm những điểm đến đáng nhớ, khám phá tour bản địa và lên lịch trình phù hợp với chuyến đi của bạn/i
      )
    ).toBeDefined();

    // Section uses dark navy photographic container
    const heroSection = container.querySelector('section')!;
    expect(heroSection.className).toContain('bg-[#00152a]');

    // Location eyebrow tag
    expect(screen.getByText(/Central Vietnam Travel Atlas • Da Nang - Hoi An - Hue/i)).toBeDefined();

    // Background image is present with meaningful alt text
    const bgImg = container.querySelector('img')!;
    expect(bgImg).not.toBeNull();
    expect(bgImg.getAttribute('alt')).toContain('Đà Nẵng');
  });

  it('provides unified 3-pill city switcher that triggers onSelectCity', () => {
    const handleSelectCity = vi.fn();
    render(<LandingHero activeCity="danang" onSelectCity={handleSelectCity} />);

    const danangBtn = screen.getByRole('button', { name: 'Đà Nẵng' });
    const hoianBtn = screen.getByRole('button', { name: 'Hội An' });
    const hueBtn = screen.getByRole('button', { name: 'Cố Đô Huế' });

    expect(danangBtn.className).toContain('bg-[#007d6e]');

    fireEvent.click(hoianBtn);
    expect(handleSelectCity).toHaveBeenCalledWith('hoian');

    fireEvent.click(hueBtn);
    expect(handleSelectCity).toHaveBeenCalledWith('hue');
  });

  it('exposes dominant travel CTAs with verified routes', () => {
    render(<LandingHero activeCity="danang" onSelectCity={vi.fn()} />);

    const planLink = screen.getByRole('link', { name: /Lập lịch trình/i });
    expect(planLink.getAttribute('href')).toBe(ROUTES.plan);

    const poisLink = screen.getByRole('link', { name: /Khám phá điểm đến/i });
    expect(poisLink.getAttribute('href')).toBe(ROUTES.pois);

    const toursLink = screen.getByRole('link', { name: /Xem các tour bản địa/i });
    expect(toursLink.getAttribute('href')).toBe(ROUTES.tours);
  });

  it('automatically rotates destination hero image every 8 seconds', () => {
    vi.useFakeTimers();
    try {
      const handleSelectCity = vi.fn();
      render(<LandingHero activeCity="danang" onSelectCity={handleSelectCity} />);

      const danangBtn = screen.getByRole('button', { name: 'Đà Nẵng' });
      const hoianBtn = screen.getByRole('button', { name: 'Hội An' });
      const hueBtn = screen.getByRole('button', { name: 'Cố Đô Huế' });

      expect(danangBtn.getAttribute('aria-pressed')).toBe('true');
      expect(hoianBtn.getAttribute('aria-pressed')).toBe('false');

      // Advance by 8000ms
      act(() => {
        vi.advanceTimersByTime(8000);
      });

      // Should advance to Hoi An
      expect(hoianBtn.getAttribute('aria-pressed')).toBe('true');
      expect(danangBtn.getAttribute('aria-pressed')).toBe('false');

      // Advance by another 8000ms
      act(() => {
        vi.advanceTimersByTime(8000);
      });

      // Should advance to Hue
      expect(hueBtn.getAttribute('aria-pressed')).toBe('true');
      expect(hoianBtn.getAttribute('aria-pressed')).toBe('false');

      // In Option 1, auto-rotation is scoped to hero and does not mutate parent onSelectCity
      expect(handleSelectCity).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('pauses auto-rotation on mouse enter and resumes on mouse leave', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<LandingHero activeCity="danang" onSelectCity={vi.fn()} />);
      const section = container.querySelector('section')!;
      const danangBtn = screen.getByRole('button', { name: 'Đà Nẵng' });
      const hoianBtn = screen.getByRole('button', { name: 'Hội An' });

      expect(danangBtn.getAttribute('aria-pressed')).toBe('true');

      // Hover over hero section
      fireEvent.mouseEnter(section);
      act(() => {
        vi.advanceTimersByTime(16000);
      });

      // Still Danang because rotation is paused
      expect(danangBtn.getAttribute('aria-pressed')).toBe('true');
      expect(hoianBtn.getAttribute('aria-pressed')).toBe('false');

      // Leave hover
      fireEvent.mouseLeave(section);
      act(() => {
        vi.advanceTimersByTime(8000);
      });

      // Now advances to Hoi An
      expect(hoianBtn.getAttribute('aria-pressed')).toBe('true');
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not auto-rotate when prefers-reduced-motion is active', () => {
    vi.useFakeTimers();
    try {
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

      render(<LandingHero activeCity="danang" onSelectCity={vi.fn()} />);
      const danangBtn = screen.getByRole('button', { name: 'Đà Nẵng' });
      const hoianBtn = screen.getByRole('button', { name: 'Hội An' });

      vi.advanceTimersByTime(24000);

      // Stays Danang
      expect(danangBtn.getAttribute('aria-pressed')).toBe('true');
      expect(hoianBtn.getAttribute('aria-pressed')).toBe('false');
    } finally {
      vi.useRealTimers();
    }
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
