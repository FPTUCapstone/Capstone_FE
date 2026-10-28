import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AboutTripMatePage } from '../AboutTripMatePage';
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

describe('AboutTripMatePage integration & deep content architecture', () => {
  it('renders hero with mission statement, value pillars and in-page anchor links', () => {
    render(<AboutTripMatePage />);

    // Hero title
    expect(
      screen.getByRole('heading', { level: 1, name: /Hành Trình Thông Minh Từ Trái Tim Miền Trung/i })
    ).toBeDefined();

    // Value pillars
    expect(screen.getByText('Dữ liệu Chuẩn xác')).toBeDefined();
    expect(screen.getByText('Thuật toán Tối ưu')).toBeDefined();
    expect(screen.getByText('Bảo đảm Minh bạch')).toBeDefined();

    // In-page anchor navigation bar
    const nav = screen.getByRole('navigation', { name: /Mục lục trang Về TripMate/i });
    expect(nav).toBeDefined();
    expect(within(nav).getByRole('link', { name: /Công nghệ Lập lịch CSP/i })).toBeDefined();
    expect(within(nav).getByRole('link', { name: /Ứng phó Thời tiết/i })).toBeDefined();
    expect(within(nav).getByRole('link', { name: /Ứng dụng Di động/i })).toBeDefined();
    expect(within(nav).getByRole('link', { name: /Hệ sinh thái Đối tác/i })).toBeDefined();
    expect(within(nav).getByRole('link', { name: /Hỏi đáp Thường gặp/i })).toBeDefined();
  });

  it('renders all dedicated deep sections with required anchor IDs for direct URL navigation', () => {
    render(<AboutTripMatePage />);

    // 1. Planning / CSP Simulator anchor
    const planningAnchor = document.getElementById('planning');
    expect(planningAnchor).not.toBeNull();
    expect(document.getElementById('csp-simulator')).not.toBeNull();

    // 2. Weather Safety anchor
    const weatherAnchor = document.getElementById('weather');
    expect(weatherAnchor).not.toBeNull();
    expect(document.getElementById('weather-rerouting')).not.toBeNull();

    // 3. Mobile App anchor
    const mobileAnchor = document.getElementById('mobile');
    expect(mobileAnchor).not.toBeNull();
    expect(document.getElementById('mobile-app')).not.toBeNull();

    // 4. Partner Ecosystem anchor
    const partnerAnchor = document.getElementById('partner-ecosystem');
    expect(partnerAnchor).not.toBeNull();
    expect(document.getElementById('partner')).not.toBeNull();

    // 5. FAQ anchor
    const faqAnchor = document.getElementById('faq');
    expect(faqAnchor).not.toBeNull();
  });

  it('provides closing CTA routing to /plan and /pois', () => {
    render(<AboutTripMatePage />);

    const planLink = screen.getByRole('link', { name: /Lập lịch trình ngay/i });
    expect(planLink.getAttribute('href')).toBe(ROUTES.plan);

    const poisLinks = screen.getAllByRole('link', { name: /Khám phá điểm đến/i });
    expect(poisLinks.length).toBeGreaterThan(0);
    expect(poisLinks[0].getAttribute('href')).toBe(ROUTES.pois);
  });

  it('includes the shared PublicFooter with partner and support links', () => {
    render(<AboutTripMatePage />);

    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByText(/Hợp tác cùng TripMate/i)).toBeDefined();
    expect(within(footer).getByRole('link', { name: /Trở thành đối tác/i }).getAttribute('href')).toBe(
      ROUTES.partner.register
    );
  });
});
