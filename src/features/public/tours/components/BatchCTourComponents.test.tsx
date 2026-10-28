import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TourEditorialHero } from './TourEditorialHero';
import { TourSearchBar } from './TourSearchBar';
import { TourFilterSidebar } from './TourFilterSidebar';

describe('Batch C1 New Components', () => {
  describe('TourEditorialHero', () => {
    it('renders the approved editorial headline, description and CTA', () => {
      const onExploreClick = vi.fn();
      render(<TourEditorialHero onExploreClick={onExploreClick} />);

      expect(screen.getByText(/Khám phá những/i)).toBeTruthy();
      expect(screen.getByText(/hành trình đáng nhớ/i)).toBeTruthy();
      expect(
        screen.getByText(/Tìm kiếm tour du lịch theo điểm đến, lịch khởi hành và ngân sách phù hợp/i),
      ).toBeTruthy();

      const ctaBtn = screen.getByRole('button', { name: /Khám phá tour/i });
      fireEvent.click(ctaBtn);
      expect(onExploreClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('TourSearchBar', () => {
    it('renders search input fields including keyword reservation and quick destinations', () => {
      const onKeywordChange = vi.fn();
      const onDestinationChange = vi.fn();
      const onDepartureDateChange = vi.fn();
      const onSearchSubmit = vi.fn();
      const onSelectQuickDestination = vi.fn();

      render(
        <TourSearchBar
          keyword=""
          onKeywordChange={onKeywordChange}
          destination=""
          onDestinationChange={onDestinationChange}
          departureDate=""
          onDepartureDateChange={onDepartureDateChange}
          onSearchSubmit={onSearchSubmit}
          onSelectQuickDestination={onSelectQuickDestination}
        />,
      );

      expect(screen.getByLabelText(/Từ khóa tìm kiếm/i)).toBeTruthy();
      expect(screen.getByText('D1: Dự lưu')).toBeTruthy();
      expect(screen.getByLabelText('Điểm đến / Khu vực')).toBeTruthy();
      expect(screen.getByLabelText('Ngày khởi hành')).toBeTruthy();
      expect(screen.getByRole('button', { name: /Tìm kiếm tour/i })).toBeTruthy();

      // Quick destinations
      const hoiAnChip = screen.getByRole('button', { name: 'Hội An' });
      fireEvent.click(hoiAnChip);
      expect(onSelectQuickDestination).toHaveBeenCalledWith('Hội An');
    });
  });

  describe('TourFilterSidebar', () => {
    it('renders all 6 required filter groups and dependency tags', () => {
      render(
        <TourFilterSidebar
          destination=""
          onDestinationChange={vi.fn()}
          departureDate=""
          onDepartureDateChange={vi.fn()}
          minPrice=""
          onMinPriceChange={vi.fn()}
          maxPrice=""
          onMaxPriceChange={vi.fn()}
          onApplyFilters={vi.fn()}
          onResetFilters={vi.fn()}
        />,
      );

      // Groups
      expect(screen.getByText('1. Điểm đến')).toBeTruthy();
      expect(screen.getByText('2. Ngày khởi hành')).toBeTruthy();
      expect(screen.getByText(/3\. Khoảng giá/i)).toBeTruthy();
      expect(screen.getByText('4. Thời lượng tour')).toBeTruthy();
      expect(screen.getByText('5. Danh mục tour')).toBeTruthy();
      expect(screen.getByText('6. Đánh giá tối thiểu')).toBeTruthy();

      // D1 tags
      const d1Tags = screen.getAllByText('D1: Chờ BE');
      expect(d1Tags.length).toBe(3);

      // Actions
      expect(screen.getByRole('button', { name: /Áp dụng bộ lọc/i })).toBeTruthy();
    });
  });
});
