import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LandingPage } from '../LandingPage';
import { ROUTES } from '@/lib/routes';

beforeEach(() => {
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();

  // Mock IntersectionObserver
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

  // Mock matchMedia default
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

describe('LandingPage integration & simplified architecture', () => {
  it('renders simplified calm editorial landing page with hero, destinations, how it works, tours, and CTA', () => {
    render(<LandingPage />);

    // 1. Hero remains visible with Da Nang headline
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeDefined();
    expect(h1.textContent).toContain('Đà Nẵng, nơi');
    expect(screen.getByText(/TripMate · Khám phá miền Trung/i)).toBeDefined();

    // 2. Destination Showcase remains visible
    expect(screen.getByText('Ba Điểm Đến Biểu Tượng Miền Trung')).toBeDefined();

    // 3. How It Works section remains visible
    expect(screen.getByRole('heading', { level: 2, name: /Ba Bước Khởi Hành Trọn Vẹn/i })).toBeDefined();

    // 4. Featured Tours and footer remain intact
    expect(screen.getByText(/Tour Trải Nghiệm Bản Địa/i)).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: /Bắt đầu hành trình Miền Trung/i })).toBeDefined();
    expect(screen.getByRole('contentinfo')).toBeDefined();

    // Verify relocated sections are no longer present on Homepage (moved to /about)
    expect(document.getElementById('csp-simulator')).toBeNull();
    expect(document.getElementById('weather-rerouting')).toBeNull();
    expect(document.getElementById('mobile-app')).toBeNull();
  });

  describe('City state synchronization', () => {
    it('supports destination selection in CentralVietnamShowcase while keeping Hero as Da Nang', () => {
      const { container } = render(<LandingPage />);

      const destinationsSection = document.getElementById('destinations') as HTMLElement;
      expect(destinationsSection).not.toBeNull();

      // Find Hoi An card and click it
      const hoianCard = within(destinationsSection).getByRole('button', { name: 'Chọn điểm đến Hội An' });
      fireEvent.click(hoianCard);

      // Verify that Hero image remains Da Nang
      const heroImg = container.querySelector('img')!;
      expect(heroImg.getAttribute('src')).toBe('/images/landing/hero-danang-sontra.jpg');
      expect(heroImg.getAttribute('alt')).toContain('Đà Nẵng');

      // Click Hue card
      const hueCard = within(destinationsSection).getByRole('button', { name: 'Chọn điểm đến Cố Đô Huế' });
      fireEvent.click(hueCard);

      // Hero image still stays Da Nang
      expect(heroImg.getAttribute('src')).toBe('/images/landing/hero-danang-sontra.jpg');
    });
  });

  describe('Landing CTA routing & links', () => {
    it('routes primary trip planning CTAs to ROUTES.plan (/plan)', () => {
      render(<LandingPage />);

      // Hero CTA "Lập lịch trình"
      const heroSection = screen.getByRole('heading', { level: 1 }).closest<HTMLElement>('section')!;
      const heroPlanLink = within(heroSection).getByRole('link', { name: /lập lịch trình/i });
      expect(heroPlanLink.getAttribute('href')).toBe(ROUTES.plan);

      // Hero secondary CTA "Khám phá tour"
      const heroToursLink = within(heroSection).getByRole('link', { name: /khám phá tour/i });
      expect(heroToursLink.getAttribute('href')).toBe(ROUTES.tours);

      // Final CTA "Lập hành trình ngay"
      const finalPlanLink = screen.getByRole('link', { name: /Lập hành trình ngay/i });
      expect(finalPlanLink.getAttribute('href')).toBe(ROUTES.plan);
    });

    it('routes destination exploration in CentralVietnamShowcase to ROUTES.pois (/pois)', () => {
      render(<LandingPage />);

      const destinationsSection = document.getElementById('destinations') as HTMLElement;
      const explorePoiLinks = within(destinationsSection).getAllByRole('link', { name: /Khám phá địa điểm/i });
      expect(explorePoiLinks.length).toBeGreaterThan(0);
      expect(explorePoiLinks[0].getAttribute('href')).toBe(ROUTES.pois);
    });

    it('routes marketplace tour exploration CTAs to ROUTES.tours (/tours)', () => {
      render(<LandingPage />);

      // Section header "Xem tất cả tour"
      const viewAllToursLink = screen.getByRole('link', { name: /Xem tất cả tour/i });
      expect(viewAllToursLink.getAttribute('href')).toBe(ROUTES.tours);

      // Final CTA "Khám phá tour bản địa"
      const finalExploreToursLink = screen.getByRole('link', { name: /Khám phá tour bản địa/i });
      expect(finalExploreToursLink.getAttribute('href')).toBe(ROUTES.tours);

      // Footer link to tours
      const footer = screen.getByRole('contentinfo');
      const footerToursLink = within(footer).getByRole('link', { name: /Tour kiểm duyệt bản địa/i });
      expect(footerToursLink.getAttribute('href')).toBe(ROUTES.tours);
    });

    it('routes HowItWorks deep learning link to /about#planning', () => {
      render(<LandingPage />);

      const deepLearnLink = screen.getByRole('link', { name: /Tìm hiểu sâu về công nghệ TripMate/i });
      expect(deepLearnLink.getAttribute('href')).toBe(`${ROUTES.about}#planning`);
    });

    it('renders Partner registration and sign-in entries in the redesigned Footer (BR6 / v2.0)', () => {
      render(<LandingPage />);

      const footer = screen.getByRole('contentinfo');
      expect(within(footer).getByText(/Hợp tác cùng TripMate/i)).toBeDefined();

      const partnerRegisterLink = within(footer).getByRole('link', { name: /Trở thành đối tác/i });
      expect(partnerRegisterLink.getAttribute('href')).toBe(ROUTES.partner.register);

      const partnerSignInLink = within(footer).getByRole('link', { name: /Đăng nhập đối tác/i });
      expect(partnerSignInLink.getAttribute('href')).toBe(ROUTES.signIn);

      const partnerApplicationLink = within(footer).getByRole('link', { name: /Tra cứu hồ sơ đăng ký/i });
      expect(partnerApplicationLink.getAttribute('href')).toBe(ROUTES.partner.application);
    });
  });
});
