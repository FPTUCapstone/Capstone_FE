import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LandingHero } from '../components/LandingHero';
import { JourneyCanvas } from '../components/JourneyCanvas';
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

describe('Batch A: LandingHero Editorial Design', () => {
  it('renders solid dignified headline and human-curated editorial copy without generic AI radial glows', () => {
    const handleSelectCity = vi.fn();
    const { container } = render(
      <LandingHero activeCity="danang" onSelectCity={handleSelectCity} />
    );

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent).toContain('Hành trình miền Trung được may đo riêng cho từng khoảnh khắc.');

    // Lead copy is human-centered
    expect(
      screen.getByText(/Từ bình minh trên bán đảo Sơn Trà đến ánh đèn hoa đăng sông Hoài/i)
    ).toBeDefined();

    // No radial gradient AI blob in section classes
    const heroSection = container.querySelector('section')!;
    expect(heroSection.className).not.toContain('radial-gradient');
    expect(heroSection.className).toContain('bg-[#F8F6F1]');

    // Location tag
    expect(screen.getByText(/Cẩm nang lữ hành Đà Nẵng — Hội An — Cố Đô Huế/i)).toBeDefined();
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

  it('exposes dominant CTAs with clear routing', () => {
    render(<LandingHero activeCity="danang" onSelectCity={vi.fn()} />);

    const planLink = screen.getByRole('link', { name: /Lập hành trình của bạn/i });
    expect(planLink.getAttribute('href')).toBe(ROUTES.plan);

    const poisLink = screen.getByRole('link', { name: /Khám phá kho danh thắng/i });
    expect(poisLink.getAttribute('href')).toBe(ROUTES.pois);
  });

  it('renders verified operational guarantees and cross-platform note', () => {
    render(<LandingHero activeCity="danang" onSelectCity={vi.fn()} />);

    expect(screen.getByText('Dữ liệu tọa độ GIS đã thẩm định')).toBeDefined();
    expect(screen.getByText('Cơ chế ký quỹ Escrow bảo vệ quyền lợi')).toBeDefined();
    expect(screen.getByText(/Đồng bộ trải nghiệm:/i)).toBeDefined();
  });

  it('renders interactive Geo-Atlas mini map card with coordinates and terrain data that dynamically adapts per city', () => {
    const { rerender } = render(<LandingHero activeCity="danang" onSelectCity={vi.fn()} />);

    // Da Nang atlas details
    expect(screen.getByText(/16°04′N • 108°13′E/i)).toBeDefined();
    expect(screen.getByText(/Duyên hải & Bán đảo Sơn Trà/i)).toBeDefined();

    // Rerender for Hoi An
    rerender(<LandingHero activeCity="hoian" onSelectCity={vi.fn()} />);
    expect(screen.getByText(/15°52′N • 108°19′E/i)).toBeDefined();
    expect(screen.getByText(/Hạ lưu Sông Thu Bồn & Phố cổ/i)).toBeDefined();

    // Rerender for Hue
    rerender(<LandingHero activeCity="hue" onSelectCity={vi.fn()} />);
    expect(screen.getByText(/16°28′N • 107°35′E/i)).toBeDefined();
    expect(screen.getByText(/Thung lũng Sông Hương/i)).toBeDefined();
  });

  it('renders detailed secondary scenic routes and satellite waypoint markers on the atlas map', () => {
    const { container } = render(<LandingHero activeCity="danang" onSelectCity={vi.fn()} />);
    const mapSvg = container.querySelector('svg[viewBox="0 0 1440 680"]');
    expect(mapSvg).not.toBeNull();

    // Check presence of secondary scenic waypoints within the map SVG
    expect(mapSvg?.textContent).toContain('VỊNH LĂNG CÔ');
    expect(mapSvg?.textContent).toContain('BÀ NÀ HILLS & CẦU VÀNG');
    expect(mapSvg?.textContent).toContain('NGŨ HÀNH SƠN');
    expect(mapSvg?.textContent).toContain('THÁNH ĐỊA MỸ SƠN');
  });
});

describe('Batch A: Curated Journey Stage (JourneyCanvas)', () => {
  it('renders authentic photography stage and curated stops for Da Nang', () => {
    render(<JourneyCanvas activeCity="danang" onSelectCity={vi.fn()} />);

    // Photo tag & caption
    expect(screen.getByText('Bán đảo Sơn Trà & Biển Mỹ Khê')).toBeDefined();
    const img = screen.getByRole('img');
    expect(img.getAttribute('alt')).toContain('Bãi biển Mỹ Khê');

    // Label is honestly marked as "Mẫu tham khảo"
    expect(screen.getByText('Mẫu tham khảo')).toBeDefined();

    // 3 Curated sequential stops
    expect(screen.getByText('Danh thắng Ngũ Hành Sơn')).toBeDefined();
    expect(screen.getByText('Bảo tàng Điêu khắc Chăm & Ăn trưa')).toBeDefined();
    expect(screen.getByText('Hoàng hôn Bán đảo Sơn Trà & Cầu Rồng')).toBeDefined();

    // Link to planner
    const plannerLink = screen.getByRole('link', { name: /Mở trong Trình lập lịch/i });
    expect(plannerLink.getAttribute('href')).toBe(ROUTES.plan);
  });

  it('updates photography and curated stops when city is switched to Hoi An', () => {
    render(<JourneyCanvas activeCity="hoian" onSelectCity={vi.fn()} />);

    expect(screen.getByText('Phố Cổ Hội An & Sông Hoài')).toBeDefined();
    expect(screen.getByText('Rừng dừa Bảy Mẫu Cẩm Thanh')).toBeDefined();
    expect(screen.getByText('Bánh Mì Phượng & Cao lầu Phố Hội')).toBeDefined();
    expect(screen.getByText('Phố cổ Hội An & Thả đèn Hoa Đăng Sông Hoài')).toBeDefined();
  });

  it('updates photography and curated stops when city is switched to Hue', () => {
    render(<JourneyCanvas activeCity="hue" onSelectCity={vi.fn()} />);

    expect(screen.getByText('Đại Nội Hoàng Thành Huế')).toBeDefined();
    expect(screen.getByText('Quần thể Di tích Đại Nội Hoàng Thành')).toBeDefined();
    expect(screen.getByText('Bún Bò Huế Mụ Rơi & Bánh Nậm Lọc')).toBeDefined();
    expect(screen.getByText('Chùa Thiên Mụ & Thuyền Rồng Sông Hương')).toBeDefined();
  });
});

describe('Batch A: CentralVietnamShowcase Refinement', () => {
  it('does not display fake weather pills and highlights GIS verification', () => {
    render(<CentralVietnamShowcase onSelectCity={vi.fn()} />);

    // Verified GIS badge is present
    expect(screen.getAllByText('Hệ thống GIS chuẩn hóa').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tọa độ thực').length).toBe(3);

    // No fake temperature strings like 28°C
    expect(screen.queryByText(/28°C/)).toBeNull();
    expect(screen.queryByText(/29°C/)).toBeNull();
    expect(screen.queryByText(/27°C/)).toBeNull();
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
