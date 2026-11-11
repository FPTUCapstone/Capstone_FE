import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AdminDashboard } from '../AdminDashboard';
import { AdminAnalyticsTabView } from '@/features/admin/shared/components/analytics/AdminAnalyticsTabView';
import { ADMIN_FULL_ANALYTICS } from '@/features/admin/shared/mock/analyticsFixtures';

describe('Administrator Dashboard Dedicated Tabs & Analytics', () => {
  beforeEach(() => {
    // Reset search params before each test
    window.history.replaceState(null, '', '/admin');
  });

  it('renders Overview tab by default with governance modules and readiness notice', () => {
    render(<AdminDashboard />);

    const overviewTab = screen.getByRole('tab', { name: /Overview/i });
    const analyticsTab = screen.getByRole('tab', { name: /Analytics/i });

    expect(overviewTab.getAttribute('aria-selected')).toBe('true');
    expect(analyticsTab.getAttribute('aria-selected')).toBe('false');

    // Modules heading in Overview
    expect(screen.getByRole('heading', { level: 2, name: 'Administration modules' })).toBeTruthy();
    expect(screen.getByText('System Configuration')).toBeTruthy();
  });

  it('switches to Analytics tab on click, displaying Platform Analytics and honest empty state', () => {
    render(<AdminDashboard />);

    const analyticsTab = screen.getByRole('tab', { name: /Analytics/i });
    fireEvent.click(analyticsTab);

    expect(analyticsTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('heading', { level: 2, name: 'Platform Analytics' })).toBeTruthy();
    expect(screen.getByText('No analytics data available')).toBeTruthy();
    expect(screen.getByText('DATA_SOURCE_NOT_CONNECTED')).toBeTruthy();
    expect(
      screen.getByText('Analytics will appear here when a supported data source is connected.'),
    ).toBeTruthy();
  });

  it('switches between internal analytics categories while displaying honest empty status', () => {
    window.history.replaceState(null, '', '/admin?tab=analytics');
    render(<AdminDashboard />);

    // Default category is Revenue
    expect(screen.getByText(/Revenue metrics require backend reporting endpoints/i)).toBeTruthy();

    // Switch to Bookings
    const bookingsTab = screen.getByRole('tab', { name: 'Bookings' });
    fireEvent.click(bookingsTab);
    expect(screen.getByText(/Bookings metrics require backend reporting endpoints/i)).toBeTruthy();

    // Switch to Services
    const servicesTab = screen.getByRole('tab', { name: 'Services' });
    fireEvent.click(servicesTab);
    expect(screen.getByText(/Services metrics require backend reporting endpoints/i)).toBeTruthy();

    // Switch to System Activity
    const systemTab = screen.getByRole('tab', { name: 'System Activity' });
    fireEvent.click(systemTab);
    expect(screen.getByText(/System Activity metrics require backend reporting endpoints/i)).toBeTruthy();
  });

  it('disables date range filters appropriately when data source is not connected', () => {
    window.history.replaceState(null, '', '/admin?tab=analytics');
    render(<AdminDashboard />);

    const radio7D = screen.getByRole('radio', { name: '7D' });
    expect(radio7D.hasAttribute('disabled')).toBe(true);
    expect(radio7D.getAttribute('title')).toContain('Time filter disabled');
  });

  it('renders charts and KPI cards when provided with an authorized analytics dataset', () => {
    render(
      <AdminAnalyticsTabView
        status="NO_DATA"
        dataset={ADMIN_FULL_ANALYTICS}
      />,
    );

    expect(screen.getByRole('heading', { level: 3, name: 'Revenue Trend' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Revenue Composition' })).toBeTruthy();

    const bookingsTab = screen.getByRole('tab', { name: 'Bookings' });
    fireEvent.click(bookingsTab);
    expect(screen.getByRole('heading', { level: 3, name: 'Booking Volume Trend' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Booking Status Distribution' })).toBeTruthy();
  });
});
