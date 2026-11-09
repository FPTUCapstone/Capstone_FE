import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PartnerSidebar } from '../PartnerSidebar';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('PartnerSidebar', () => {
  it('renders all primary workspace navigation items in Vietnamese', () => {
    render(<PartnerSidebar activeTab="dashboard" />);

    expect(screen.getByRole('link', { name: /Bảng điều khiển/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Gói tour/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Mã giảm giá/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Đơn đặt chỗ/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Doanh thu/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Thanh toán/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Hồ sơ doanh nghiệp/i })).toBeDefined();
  });

  it('links to the safety alerts from every workspace page, without the demo flag', () => {
    const { rerender } = render(<PartnerSidebar activeTab="tours" />);
    const link = () => screen.getByRole('link', { name: /Cảnh báo an toàn/i });
    expect(link().getAttribute('href')).toBe('/partner/weather-safety-reviews');
    expect(link().getAttribute('aria-current')).toBeNull();

    rerender(<PartnerSidebar activeTab="weatherSafety" isDemo={true} />);
    expect(link().getAttribute('href')).toBe('/partner/weather-safety-reviews');
    expect(link().getAttribute('aria-current')).toBe('page');
  });

  it('shows how many safety alerts need attention only when there are some', () => {
    const { rerender } = render(<PartnerSidebar activeTab="tours" weatherAlertBadgeCount={0} />);
    expect(screen.getByRole('link', { name: /Cảnh báo an toàn/i }).textContent).not.toMatch(/\d/);

    rerender(<PartnerSidebar activeTab="tours" weatherAlertBadgeCount={3} />);
    expect(screen.getByRole('link', { name: /Cảnh báo an toàn/i }).textContent).toMatch(/3/);
  });

  it('marks the active tab with aria-current="page"', () => {
    render(<PartnerSidebar activeTab="tours" />);

    const toursLink = screen.getByRole('link', { name: /Gói tour/i });
    expect(toursLink.getAttribute('aria-current')).toBe('page');

    const dashboardLink = screen.getByRole('link', { name: /Bảng điều khiển/i });
    expect(dashboardLink.getAttribute('aria-current')).toBeNull();
  });

  it('appends demo=1 to operational links when isDemo is true', () => {
    render(<PartnerSidebar activeTab="dashboard" isDemo={true} />);

    expect(screen.getByRole('link', { name: /Gói tour/i }).getAttribute('href')).toBe('/partner/tours?demo=1');
    expect(screen.getByRole('link', { name: /Mã giảm giá/i }).getAttribute('href')).toBe('/partner/coupons?demo=1');
    expect(screen.getByRole('link', { name: /Đơn đặt chỗ/i }).getAttribute('href')).toBe('/partner/bookings?demo=1');
    expect(screen.getByRole('link', { name: /Doanh thu/i }).getAttribute('href')).toBe('/partner/revenue?demo=1');
    expect(screen.getByRole('link', { name: /Thanh toán/i }).getAttribute('href')).toBe('/partner/payouts?demo=1');
  });

  it('keeps operational links clean without query param when isDemo is false', () => {
    render(<PartnerSidebar activeTab="dashboard" isDemo={false} />);

    expect(screen.getByRole('link', { name: /Gói tour/i }).getAttribute('href')).toBe('/partner/tours');
    expect(screen.getByRole('link', { name: /Mã giảm giá/i }).getAttribute('href')).toBe('/partner/coupons');
    expect(screen.getByRole('link', { name: /Đơn đặt chỗ/i }).getAttribute('href')).toBe('/partner/bookings');
    expect(screen.getByRole('link', { name: /Doanh thu/i }).getAttribute('href')).toBe('/partner/revenue');
    expect(screen.getByRole('link', { name: /Thanh toán/i }).getAttribute('href')).toBe('/partner/payouts');
  });

  it('displays the provided operator name and initials', () => {
    render(<PartnerSidebar activeTab="dashboard" operatorName="Han River Travel Co." />);

    expect(screen.getByText('Han River Travel Co.')).toBeDefined();
    expect(screen.getByText('HA')).toBeDefined();
  });

  it('invokes onCloseMobile when a navigation item is clicked', () => {
    const handleClose = vi.fn();
    render(<PartnerSidebar activeTab="dashboard" onCloseMobile={handleClose} />);

    const toursLink = screen.getByRole('link', { name: /Gói tour/i });
    fireEvent.click(toursLink);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
