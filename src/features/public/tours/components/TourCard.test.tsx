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

  it('displays "Hết chỗ" when remainingSlots is 0 or status is SoldOut', () => {
    const soldOutTour: TourSearchItemDto = {
      ...mockTour,
      availabilityStatus: 'SoldOut',
      remainingSlots: 0,
    };
    render(<TourCard tour={soldOutTour} />);

    expect(screen.getByText('Hết chỗ')).toBeTruthy();
  });
});
