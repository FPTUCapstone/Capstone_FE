import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { StaffDashboardView } from '../StaffDashboardView';
import { StaffAnalyticsTabView } from '../StaffAnalyticsTabView';
import { STAFF_FULL_ANALYTICS } from '@/features/admin/shared/mock/analyticsFixtures';

describe('Staff Dashboard Dedicated Tabs & Analytics', () => {
  beforeEach(() => {
    // Reset search params before each test
    window.history.replaceState(null, '', '/admin/staff');
  });

  it('renders Overview tab by default with active and pending operational modules', () => {
    render(<StaffDashboardView />);

    const overviewTab = screen.getByRole('tab', { name: /Overview/i });
    const analyticsTab = screen.getByRole('tab', { name: /Analytics/i });

    expect(overviewTab.getAttribute('aria-selected')).toBe('true');
    expect(analyticsTab.getAttribute('aria-selected')).toBe('false');

    // Modules in Overview
    expect(screen.getByRole('heading', { level: 2, name: 'Active Operational Modules' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Scheduled & Pending Operational Modules' })).toBeTruthy();
  });

  it('switches to Analytics tab on click, displaying Operational Analytics and honest empty state', () => {
    render(<StaffDashboardView />);

    const analyticsTab = screen.getByRole('tab', { name: /Analytics/i });
    fireEvent.click(analyticsTab);

    expect(analyticsTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('heading', { level: 2, name: 'Operational Analytics' })).toBeTruthy();
    expect(screen.getByText('No analytics data available')).toBeTruthy();
    expect(screen.getByText('DATA_SOURCE_NOT_CONNECTED')).toBeTruthy();
    expect(
      screen.getByText('Analytics will appear here when a supported data source is connected.'),
    ).toBeTruthy();
  });

  it('switches between internal analytics categories while displaying honest empty status', () => {
    window.history.replaceState(null, '', '/admin/staff?tab=analytics');
    render(<StaffDashboardView />);

    // Default category is Workload
    expect(screen.getByText(/Workload metrics require backend reporting endpoints/i)).toBeTruthy();

    // Switch to Queues
    const queuesTab = screen.getByRole('tab', { name: 'Queues' });
    fireEvent.click(queuesTab);
    expect(screen.getByText(/Queues metrics require backend reporting endpoints/i)).toBeTruthy();

    // Switch to Performance
    const perfTab = screen.getByRole('tab', { name: 'Performance' });
    fireEvent.click(perfTab);
    expect(screen.getByText(/Performance metrics require backend reporting endpoints/i)).toBeTruthy();
  });

  it('disables date range filters appropriately when data source is not connected', () => {
    window.history.replaceState(null, '', '/admin/staff?tab=analytics');
    render(<StaffDashboardView />);

    const radio7D = screen.getByRole('radio', { name: '7D' });
    expect(radio7D.hasAttribute('disabled')).toBe(true);
    expect(radio7D.getAttribute('title')).toContain('Time filter disabled');
  });

  it('renders charts and KPI cards when provided with an authorized staff analytics dataset', () => {
    render(
      <StaffAnalyticsTabView
        status="NO_DATA"
        dataset={STAFF_FULL_ANALYTICS}
      />,
    );

    expect(screen.getByRole('heading', { level: 3, name: 'Operational Workload Trend' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Workload by Task Type' })).toBeTruthy();

    const queuesTab = screen.getByRole('tab', { name: 'Queues' });
    fireEvent.click(queuesTab);
    expect(screen.getByRole('heading', { level: 3, name: 'Queue Backlog Composition' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Queue Intake vs Clearance' })).toBeTruthy();
  });
});
