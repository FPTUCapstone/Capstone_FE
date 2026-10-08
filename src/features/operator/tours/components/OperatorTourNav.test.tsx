import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OperatorTourNav } from './OperatorTourNav';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('OperatorTourNav', () => {
  it('appends demo=1 to tours link when isDemo is true', () => {
    render(<OperatorTourNav activeTab="tours" isDemo={true} />);

    const tourLink = screen.getByRole('link', { name: /Tours/i });
    expect(tourLink.getAttribute('href')).toBe('/partner/tours?demo=1');
  });

  it('keeps tours link clean when isDemo is false', () => {
    render(<OperatorTourNav activeTab="tours" isDemo={false} />);

    const tourLink = screen.getByRole('link', { name: /Tours/i });
    expect(tourLink.getAttribute('href')).toBe('/partner/tours');
  });

  it('enables coupons link and preserves demo mode', () => {
    render(<OperatorTourNav activeTab="coupons" isDemo={true} />);

    const couponLink = screen.getByRole('link', { name: /Coupons/i });
    expect(couponLink.getAttribute('href')).toBe('/partner/coupons?demo=1');
  });

  it('keeps coupons link clean when isDemo is false', () => {
    render(<OperatorTourNav activeTab="coupons" isDemo={false} />);

    const couponLink = screen.getByRole('link', { name: /Coupons/i });
    expect(couponLink.getAttribute('href')).toBe('/partner/coupons');
  });

  it('appends demo=1 to bookings link when isDemo is true', () => {
    render(<OperatorTourNav activeTab="bookings" isDemo={true} />);

    const bookingLink = screen.getByRole('link', { name: /Bookings/i });
    expect(bookingLink.getAttribute('href')).toBe('/partner/bookings?demo=1');
  });

  it('keeps bookings link clean when isDemo is false', () => {
    render(<OperatorTourNav activeTab="bookings" isDemo={false} />);

    const bookingLink = screen.getByRole('link', { name: /Bookings/i });
    expect(bookingLink.getAttribute('href')).toBe('/partner/bookings');
  });
});
