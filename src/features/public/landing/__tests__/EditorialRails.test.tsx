import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EditorialSectionNav } from '../components/EditorialSectionNav';
import { EditorialJournalRail } from '../components/EditorialJournalRail';

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
    expect(hoianBtn.className).toContain('border-[#007d6e]');
  });
});
