import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TourCard } from './TourCard';
import type { TourSearchItemDto } from '../types/tour';

describe('TourCard component', () => {
  const mockTour: TourSearchItemDto = {
    tourId: '9007199254740995',
    title: 'Hành Trình Di Sản Phố Cổ Hội An',
    destinations: ['Đà Nẵng', 'Hội An'],
    operatorName: 'Endpoint Travel',
    durationDays: 2,
    basePrice: 800000,
    currency: 'VND',
    representativeScheduleId: '9007199254740997',
    departureAtUtc: '2026-10-15T07:30:00Z',
    availabilityStatus: 'Available',
    remainingSlots: 11,
    thumbnailUrl: 'https://example.com/tour.jpg',
  };

  it('renders tour information according to SRS result fields', () => {
    render(<TourCard tour={mockTour} />);

    expect(screen.getByText('Hành Trình Di Sản Phố Cổ Hội An')).toBeTruthy();
    expect(screen.getByText('Đà Nẵng')).toBeTruthy();
    expect(screen.getByText('Hội An')).toBeTruthy();
    expect(screen.getByText('Endpoint Travel')).toBeTruthy();
    expect(screen.getByText('2 ngày')).toBeTruthy();
    expect(screen.getByText(/800\.000/)).toBeTruthy();
    expect(screen.getByText('Còn 11 chỗ')).toBeTruthy();
  });

  it('preserves search context query parameters in the detail link', () => {
    render(
      <TourCard
        tour={mockTour}
        searchContextQuery="destination=H%E1%BB%99i+An&departureDate=2026-10-15"
      />,
    );

    const links = screen.getAllByRole('link');
    const detailLink = links.find((l) =>
      l.getAttribute('href')?.includes('/tours/9007199254740995'),
    );
    expect(detailLink).toBeDefined();
    expect(detailLink?.getAttribute('href')).toBe(
      '/tours/9007199254740995?destination=H%E1%BB%99i+An&departureDate=2026-10-15',
    );
  });

  describe('availability presentation truthfulness (Blocker 1)', () => {
    it('AVAIL-1: renders "Còn 8 chỗ" when availabilityStatus is available and remainingSlots is 8', () => {
      const tour: TourSearchItemDto = {
        ...mockTour,
        availabilityStatus: 'available',
        remainingSlots: 8,
      };
      render(<TourCard tour={tour} />);
      expect(screen.getByText('Còn 8 chỗ')).toBeTruthy();
    });

    it('AVAIL-2: renders "Còn chỗ" when availabilityStatus is available and remainingSlots is null', () => {
      const tour: TourSearchItemDto = {
        ...mockTour,
        availabilityStatus: 'available',
        remainingSlots: null,
      };
      render(<TourCard tour={tour} />);
      expect(screen.getByText('Còn chỗ')).toBeTruthy();
    });

    it('AVAIL-3: renders "Hết chỗ" and NOT "Còn chỗ" when availabilityStatus is soldOut', () => {
      const tour: TourSearchItemDto = {
        ...mockTour,
        availabilityStatus: 'soldOut',
        remainingSlots: 0,
      };
      render(<TourCard tour={tour} />);
      expect(screen.getByText('Hết chỗ')).toBeTruthy();
      expect(screen.queryByText(/Còn.*chỗ/)).toBeNull();
    });

    it('AVAIL-4: renders "Chưa có lịch khởi hành" and NOT "Còn chỗ" or "Hết chỗ" when availabilityStatus is noUpcomingSchedule', () => {
      const tour: TourSearchItemDto = {
        ...mockTour,
        availabilityStatus: 'noUpcomingSchedule',
        remainingSlots: null,
      };
      render(<TourCard tour={tour} />);
      expect(screen.getByText('Chưa có lịch khởi hành')).toBeTruthy();
      expect(screen.queryByText(/Còn.*chỗ/)).toBeNull();
      expect(screen.queryByText('Hết chỗ')).toBeNull();
    });

    it('AVAIL-5: renders "Chưa xác định" and NOT "Còn chỗ" when availabilityStatus is unknown', () => {
      const tour: TourSearchItemDto = {
        ...mockTour,
        availabilityStatus: 'unknown',
        remainingSlots: null,
      };
      render(<TourCard tour={tour} />);
      expect(screen.getByText('Chưa xác định')).toBeTruthy();
      expect(screen.queryByText(/Còn.*chỗ/)).toBeNull();
    });

    it('AVAIL-6: renders safe neutral label "Chưa xác định" for unexpected status', () => {
      const tour: TourSearchItemDto = {
        ...mockTour,
        availabilityStatus: 'future_cancelled_status_99',
        remainingSlots: 10,
      };
      render(<TourCard tour={tour} />);
      expect(screen.getByText('Chưa xác định')).toBeTruthy();
      expect(screen.queryByText(/Còn.*chỗ/)).toBeNull();
    });

    it('defensively renders "Hết chỗ" if status is available but remainingSlots is 0', () => {
      const tour: TourSearchItemDto = {
        ...mockTour,
        availabilityStatus: 'available',
        remainingSlots: 0,
      };
      render(<TourCard tour={tour} />);
      expect(screen.getByText('Hết chỗ')).toBeTruthy();
      expect(screen.queryByText(/Còn.*chỗ/)).toBeNull();
    });
  });
});
