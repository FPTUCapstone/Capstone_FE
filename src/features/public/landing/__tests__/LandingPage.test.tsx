import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LandingPage } from '../LandingPage';
import { ROUTES } from '@/lib/routes';

// Mock navigation to avoid triggering auth session refresh in public tests
vi.mock('@/components/navigation/PublicNavigation', () => ({
  PublicNavigation: () => <header data-testid="public-navigation" />,
}));

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

describe('LandingPage integration & synchronization', () => {
  it('renders landing page with public navigation, hero, and main sections', () => {
    render(<LandingPage />);

    expect(screen.getByTestId('public-navigation')).toBeDefined();
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
    expect(screen.getByText(/Central Vietnam Travel Atlas/i)).toBeDefined();
    expect(screen.getByRole('contentinfo')).toBeDefined();
  });

  describe('City state synchronization', () => {
    it('synchronizes active destination across LandingHero, CentralVietnamShowcase, and CspSimulatorSection', () => {
      render(<LandingPage />);

      // Initial active city is 'danang'
      const heroSection = screen.getByRole('heading', { level: 1 }).closest<HTMLElement>('section')!;
      const danangHeroBtn = within(heroSection).getByRole('button', { name: 'Đà Nẵng' });
      expect(danangHeroBtn.className).toContain('bg-[#007d6e]');

      // Switch to Hoi An from Hero
      const hoianHeroBtn = within(heroSection).getByRole('button', { name: 'Hội An' });
      fireEvent.click(hoianHeroBtn);

      // Hero button state updates
      expect(hoianHeroBtn.className).toContain('bg-[#d97706]');
      expect(danangHeroBtn.className).not.toContain('bg-[#007d6e]');

      // CspSimulatorSection reflects Hoi An preset
      const cspSection = document.getElementById('csp-simulator') as HTMLElement;
      expect(within(cspSection).getAllByText(/Hội An/i).length).toBeGreaterThan(0);

      // Switch to Hue from Hero
      const hueHeroBtn = within(heroSection).getByRole('button', { name: 'Cố Đô Huế' });
      fireEvent.click(hueHeroBtn);

      expect(hueHeroBtn.className).toContain('bg-[#7c3aed]');
      expect(within(cspSection).getAllByText(/Huế/i).length).toBeGreaterThan(0);
    });

    it('synchronizes active destination when clicked from CentralVietnamShowcase destination cards', () => {
      render(<LandingPage />);

      const destinationsSection = document.getElementById('destinations') as HTMLElement;
      const hoianHeading = within(destinationsSection).getByRole('heading', { level: 3, name: 'Hội An' });
      const hoianCard = hoianHeading.closest('.group')!;
      fireEvent.click(hoianCard);

      // Hero button reflects Hội An
      const heroSection = screen.getByRole('heading', { level: 1 }).closest<HTMLElement>('section')!;
      const hoianHeroBtn = within(heroSection).getByRole('button', { name: 'Hội An' });
      expect(hoianHeroBtn.className).toContain('bg-[#d97706]');
    });
  });

  describe('Landing CTA routing & links', () => {
    it('routes primary trip planning CTAs to ROUTES.plan (/plan)', () => {
      render(<LandingPage />);

      // Hero CTA "Lập hành trình của bạn"
      const heroPlanLink = screen.getByRole('link', { name: /Lập hành trình của bạn/i });
      expect(heroPlanLink.getAttribute('href')).toBe(ROUTES.plan);

      // Final CTA "Lập hành trình ngay"
      const finalPlanLink = screen.getByRole('link', { name: /Lập hành trình ngay/i });
      expect(finalPlanLink.getAttribute('href')).toBe(ROUTES.plan);
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
  });
});
