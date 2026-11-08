import { render, screen, fireEvent, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditorialSectionNav } from '../components/EditorialSectionNav';
import { EditorialJournalRail } from '../components/EditorialJournalRail';
import { CentralVietnamShowcase } from '../components/CentralVietnamShowcase';
import { LandingPage } from '../LandingPage';
import { ROUTES } from '@/lib/routes';

describe('EditorialSectionNav component', () => {
  it('renders all 4 numbered sections with navigation buttons', () => {
    const handleNavigate = vi.fn();
    render(<EditorialSectionNav activeSection="destinations" onNavigate={handleNavigate} />);

    expect(screen.getByRole('complementary', { name: /Mục lục bài viết/i })).toBeDefined();
    expect(screen.getByText('01')).toBeDefined();
    expect(screen.getByText('Điểm Đến Biểu Tượng')).toBeDefined();
    expect(screen.getByText('02')).toBeDefined();
    expect(screen.getByText('Cách Thức Hoạt Động')).toBeDefined();
    expect(screen.getByText('03')).toBeDefined();
    expect(screen.getByText('Tour Bản Địa Chọn Lọc')).toBeDefined();
    expect(screen.getByText('04')).toBeDefined();
    expect(screen.getByText('Khởi Hành Ngay')).toBeDefined();
  });

  it('sets aria-current on the currently active section', () => {
    const handleNavigate = vi.fn();
    render(<EditorialSectionNav activeSection="how-it-works" onNavigate={handleNavigate} />);

    const howItWorksButton = screen.getByRole('button', { name: /02 Cách Thức Hoạt Động/i });
    expect(howItWorksButton.getAttribute('aria-current')).toBe('true');

    const destinationsButton = screen.getByRole('button', { name: /01 Điểm Đến Biểu Tượng/i });
    expect(destinationsButton.getAttribute('aria-current')).toBeNull();
  });

  it('applies visible focus indicator classes for keyboard navigation', () => {
    const handleNavigate = vi.fn();
    render(<EditorialSectionNav activeSection="destinations" onNavigate={handleNavigate} />);

    const destButton = screen.getByRole('button', { name: /01 Điểm Đến Biểu Tượng/i });
    expect(destButton.className).toContain('focus-visible:outline-2');
    expect(destButton.className).toContain('focus-visible:outline-[#103B39]');
    expect(destButton.className).toContain('focus-visible:ring-2');
    expect(destButton.className).toContain('focus-visible:ring-[#103B39]');
  });

  it('invokes onNavigate with the section id on click', () => {
    const handleNavigate = vi.fn();
    render(<EditorialSectionNav activeSection="destinations" onNavigate={handleNavigate} />);

    const toursButton = screen.getByRole('button', { name: /03 Tour Bản Địa Chọn Lọc/i });
    fireEvent.click(toursButton);

    expect(handleNavigate).toHaveBeenCalledWith('tours');
  });
});

describe('EditorialJournalRail component', () => {
  it('renders destination travel vignettes for Hoi An and Hue', () => {
    const handleSelectCity = vi.fn();
    render(<EditorialJournalRail activeCity="danang" onSelectCity={handleSelectCity} />);

    expect(screen.getByRole('complementary', { name: /Sổ tay điểm đến Miền Trung/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Xem sổ tay Hội An Hoài Cổ/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Xem sổ tay Cố Đô Huế/i })).toBeDefined();
  });

  it('calls onSelectCity when a journal card is clicked', () => {
    Element.prototype.scrollIntoView = vi.fn();
    const handleSelectCity = vi.fn();
    render(<EditorialJournalRail activeCity="danang" onSelectCity={handleSelectCity} />);

    const hoianBtn = screen.getByRole('button', { name: /Xem sổ tay Hội An Hoài Cổ/i });
    fireEvent.click(hoianBtn);
    expect(handleSelectCity).toHaveBeenCalledWith('hoian');

    const hueBtn = screen.getByRole('button', { name: /Xem sổ tay Cố Đô Huế/i });
    fireEvent.click(hueBtn);
    expect(handleSelectCity).toHaveBeenCalledWith('hue');
  });

  it('highlights the card corresponding to the activeCity', () => {
    const handleSelectCity = vi.fn();
    render(<EditorialJournalRail activeCity="hoian" onSelectCity={handleSelectCity} />);

    const hoianBtn = screen.getByRole('button', { name: /Xem sổ tay Hội An Hoài Cổ/i });
    expect(hoianBtn.className).toContain('border-[#174B4A]');
  });

  it('applies visible focus indicator classes for keyboard navigation on cards', () => {
    const handleSelectCity = vi.fn();
    render(<EditorialJournalRail activeCity="danang" onSelectCity={handleSelectCity} />);

    const hoianBtn = screen.getByRole('button', { name: /Xem sổ tay Hội An Hoài Cổ/i });
    expect(hoianBtn.className).toContain('focus-visible:outline-2');
    expect(hoianBtn.className).toContain('focus-visible:outline-[#103B39]');
    expect(hoianBtn.className).toContain('focus-visible:ring-2');
    expect(hoianBtn.className).toContain('focus-visible:ring-[#103B39]');

    const hueBtn = screen.getByRole('button', { name: /Xem sổ tay Cố Đô Huế/i });
    expect(hueBtn.className).toContain('focus-visible:outline-2');
    expect(hueBtn.className).toContain('focus-visible:outline-[#103B39]');
    expect(hueBtn.className).toContain('focus-visible:ring-2');
    expect(hueBtn.className).toContain('focus-visible:ring-[#103B39]');
  });
});

describe('FIX-02: CentralVietnamShowcase keyboard interaction and nested link', () => {
  it('selects the city when pressing Enter on the parent card', () => {
    const handleSelectCity = vi.fn();
    render(<CentralVietnamShowcase activeCity="danang" onSelectCity={handleSelectCity} />);

    const danangCard = screen.getByRole('button', { name: /Chọn điểm đến Đà Nẵng/i });
    fireEvent.keyDown(danangCard, { key: 'Enter', code: 'Enter' });

    expect(handleSelectCity).toHaveBeenCalledWith('danang');
  });

  it('selects the city when pressing Space on the parent card', () => {
    const handleSelectCity = vi.fn();
    render(<CentralVietnamShowcase activeCity="danang" onSelectCity={handleSelectCity} />);

    const hoianCard = screen.getByRole('button', { name: /Chọn điểm đến Hội An/i });
    fireEvent.keyDown(hoianCard, { key: ' ', code: 'Space' });

    expect(handleSelectCity).toHaveBeenCalledWith('hoian');
  });

  it('does not prevent default or trigger parent card selection when Enter is pressed on the nested Link', () => {
    const handleSelectCity = vi.fn();
    render(<CentralVietnamShowcase activeCity="danang" onSelectCity={handleSelectCity} />);

    const link = screen.getByRole('link', { name: /Khám phá địa điểm tại Đà Nẵng/i });
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      bubbles: true,
      cancelable: true,
    });

    link.dispatchEvent(enterEvent);

    expect(enterEvent.defaultPrevented).toBe(false);
    expect(handleSelectCity).not.toHaveBeenCalled();
  });

  it('does not trigger parent card selection when clicking the nested Link', () => {
    const handleSelectCity = vi.fn();
    render(<CentralVietnamShowcase activeCity="danang" onSelectCity={handleSelectCity} />);

    const link = screen.getByRole('link', { name: /Khám phá địa điểm tại Đà Nẵng/i });
    link.addEventListener('click', (e) => e.preventDefault(), { once: true });
    fireEvent.click(link);

    expect(handleSelectCity).not.toHaveBeenCalled();
  });

  it('preserves the expected /pois destination on all cards', () => {
    render(<CentralVietnamShowcase activeCity="danang" />);

    const links = screen.getAllByRole('link', { name: /Khám phá địa điểm/i });
    expect(links.length).toBe(3);
    for (const l of links) {
      expect(l.getAttribute('href')).toBe(ROUTES.pois);
    }
  });
});

describe('FIX-01: LandingPage Scroll Spy with viewport coordinates', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();

    // Mock matchMedia
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

  it('activates destinations when destinations section is near viewport top even if offsetTop is 0 in positioned container', () => {
    render(<LandingPage />);

    const destEl = document.getElementById('destinations');
    const howItWorksEl = document.getElementById('how-it-works');
    const toursEl = document.getElementById('tours');
    const finalCtaEl = document.getElementById('final-cta');

    if (destEl && howItWorksEl && toursEl && finalCtaEl) {
      // destinations is in view (rect.top <= 200), subsequent sections are lower down
      vi.spyOn(destEl, 'getBoundingClientRect').mockReturnValue({ top: 80 } as DOMRect);
      vi.spyOn(howItWorksEl, 'getBoundingClientRect').mockReturnValue({ top: 900 } as DOMRect);
      vi.spyOn(toursEl, 'getBoundingClientRect').mockReturnValue({ top: 1700 } as DOMRect);
      vi.spyOn(finalCtaEl, 'getBoundingClientRect').mockReturnValue({ top: 2500 } as DOMRect);
    }

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    const destBtn = screen.getByRole('button', { name: /01 Điểm Đến Biểu Tượng/i });
    expect(destBtn.getAttribute('aria-current')).toBe('true');

    const hiwBtn = screen.getByRole('button', { name: /02 Cách Thức Hoạt Động/i });
    expect(hiwBtn.getAttribute('aria-current')).toBeNull();
  });

  it('activates how-it-works when how-it-works reaches the activation threshold', () => {
    render(<LandingPage />);

    const destEl = document.getElementById('destinations');
    const howItWorksEl = document.getElementById('how-it-works');
    const toursEl = document.getElementById('tours');
    const finalCtaEl = document.getElementById('final-cta');

    if (destEl && howItWorksEl && toursEl && finalCtaEl) {
      vi.spyOn(destEl, 'getBoundingClientRect').mockReturnValue({ top: -600 } as DOMRect);
      vi.spyOn(howItWorksEl, 'getBoundingClientRect').mockReturnValue({ top: 80 } as DOMRect);
      vi.spyOn(toursEl, 'getBoundingClientRect').mockReturnValue({ top: 800 } as DOMRect);
      vi.spyOn(finalCtaEl, 'getBoundingClientRect').mockReturnValue({ top: 1600 } as DOMRect);
    }

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    const hiwBtn = screen.getByRole('button', { name: /02 Cách Thức Hoạt Động/i });
    expect(hiwBtn.getAttribute('aria-current')).toBe('true');

    const destBtn = screen.getByRole('button', { name: /01 Điểm Đến Biểu Tượng/i });
    expect(destBtn.getAttribute('aria-current')).toBeNull();
  });

  it('activates tours when tours section reaches the activation threshold', () => {
    render(<LandingPage />);

    const destEl = document.getElementById('destinations');
    const howItWorksEl = document.getElementById('how-it-works');
    const toursEl = document.getElementById('tours');
    const finalCtaEl = document.getElementById('final-cta');

    if (destEl && howItWorksEl && toursEl && finalCtaEl) {
      vi.spyOn(destEl, 'getBoundingClientRect').mockReturnValue({ top: -1400 } as DOMRect);
      vi.spyOn(howItWorksEl, 'getBoundingClientRect').mockReturnValue({ top: -700 } as DOMRect);
      vi.spyOn(toursEl, 'getBoundingClientRect').mockReturnValue({ top: 80 } as DOMRect);
      vi.spyOn(finalCtaEl, 'getBoundingClientRect').mockReturnValue({ top: 800 } as DOMRect);
    }

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    const toursBtn = screen.getByRole('button', { name: /03 Tour Bản Địa Chọn Lọc/i });
    expect(toursBtn.getAttribute('aria-current')).toBe('true');
  });

  it('activates final-cta when final-cta section reaches the activation threshold', () => {
    render(<LandingPage />);

    const destEl = document.getElementById('destinations');
    const howItWorksEl = document.getElementById('how-it-works');
    const toursEl = document.getElementById('tours');
    const finalCtaEl = document.getElementById('final-cta');

    if (destEl && howItWorksEl && toursEl && finalCtaEl) {
      vi.spyOn(destEl, 'getBoundingClientRect').mockReturnValue({ top: -2200 } as DOMRect);
      vi.spyOn(howItWorksEl, 'getBoundingClientRect').mockReturnValue({ top: -1500 } as DOMRect);
      vi.spyOn(toursEl, 'getBoundingClientRect').mockReturnValue({ top: -800 } as DOMRect);
      vi.spyOn(finalCtaEl, 'getBoundingClientRect').mockReturnValue({ top: 50 } as DOMRect);
    }

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    const ctaBtn = screen.getByRole('button', { name: /04 Khởi Hành Ngay/i });
    expect(ctaBtn.getAttribute('aria-current')).toBe('true');
  });
});
