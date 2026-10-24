import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  AreaTrendChart,
  ChartCard,
  DonutChart,
  DualLineChart,
  GroupedBarChart,
  HorizontalBarChart,
  StackedBarChart,
  VerticalBarChart,
} from '../index';
import { ADMIN_FULL_ANALYTICS, STAFF_FULL_ANALYTICS } from '../../../mock/analyticsFixtures';

describe('Administration Workspace Analytics Charts', () => {
  describe('ChartCard', () => {
    it('renders header, title, badge, and time range toggles', () => {
      const onTimeRangeChange = vi.fn();
      render(
        <ChartCard
          title="Revenue Flow"
          subtitle="Financial overview"
          badgeLabel="Financial Trend"
          timeRange="30D"
          onTimeRangeChange={onTimeRangeChange}
        >
          <div>Chart Content</div>
        </ChartCard>,
      );

      expect(screen.getByText('Revenue Flow')).toBeTruthy();
      expect(screen.getByText('Financial overview')).toBeTruthy();
      expect(screen.getByText('Financial Trend')).toBeTruthy();
      expect(screen.getByText('Chart Content')).toBeTruthy();

      const button7D = screen.getByRole('radio', { name: '7D' });
      fireEvent.click(button7D);
      expect(onTimeRangeChange).toHaveBeenCalledWith('7D');
    });
  });

  describe('AreaTrendChart', () => {
    it('renders SVG area paths, points, and table fallback', () => {
      render(
        <AreaTrendChart
          data={ADMIN_FULL_ANALYTICS.revenue['7D'].trend}
          primaryLabel="Gross Revenue"
          valueFormatter={(v) => `${v} ₫`}
        />,
      );

      expect(screen.getByRole('img', { name: /Gross Revenue trend chart/i })).toBeTruthy();
      expect(screen.getAllByText('Sun').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Sat').length).toBeGreaterThanOrEqual(1);
      // Accessible table check
      expect(screen.getByRole('table', { hidden: true })).toBeTruthy();
    });

    it('renders empty fallback when data is empty', () => {
      render(<AreaTrendChart data={[]} />);
      expect(screen.getByText('No data available.')).toBeTruthy();
    });
  });

  describe('DonutChart', () => {
    it('renders donut segments and legend breakdown', () => {
      render(
        <DonutChart
          segments={ADMIN_FULL_ANALYTICS.bookings['30D'].statusDistribution}
          centerValue="327"
          centerLabel="Total Bookings"
        />,
      );

      expect(screen.getByRole('img', { name: /Distribution donut chart/i })).toBeTruthy();
      expect(screen.getByText('Completed')).toBeTruthy();
      expect(screen.getByText('Confirmed')).toBeTruthy();
      expect(screen.getByText('73%')).toBeTruthy();
    });
  });

  describe('HorizontalBarChart', () => {
    it('renders category rows and percentage badges', () => {
      render(
        <HorizontalBarChart
          categories={ADMIN_FULL_ANALYTICS.services['30D'].byCategory}
        />,
      );

      expect(screen.getByText('Tours & Experiences')).toBeTruthy();
      expect(screen.getByText('358.000.000 ₫')).toBeTruthy();
      expect(screen.getByText('57%')).toBeTruthy();
    });
  });

  describe('DualLineChart', () => {
    it('renders dual metric comparison chart with accessible buttons', () => {
      render(
        <DualLineChart
          data={ADMIN_FULL_ANALYTICS.services['7D'].trendComparison}
          primaryLabel="Tours"
          secondaryLabel="Attractions"
        />,
      );

      expect(screen.getByRole('img', { name: /Tours and Attractions comparison chart/i })).toBeTruthy();
      expect(screen.getAllByText('Sun').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Sat').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GroupedBarChart', () => {
    it('renders paired bars, legend, and accessibility table', () => {
      render(
        <GroupedBarChart
          data={STAFF_FULL_ANALYTICS.workload['7D'].workloadTrend}
          primaryLabel="Tasks In"
          secondaryLabel="Tasks Out"
        />,
      );

      expect(screen.getByRole('img', { name: /Grouped bar chart comparison/i })).toBeTruthy();
      expect(screen.getAllByText('Tasks In').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Tasks Out').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Sun').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('StackedBarChart', () => {
    it('renders stacked segments and legend labels', () => {
      render(
        <StackedBarChart
          data={ADMIN_FULL_ANALYTICS.revenue['7D'].composition}
        />,
      );

      expect(screen.getByRole('img', { name: /Stacked bar chart composition/i })).toBeTruthy();
      expect(screen.getAllByText('Operator Payout').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Platform Comm.').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Sun').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('VerticalBarChart', () => {
    it('renders vertical bars and value points', () => {
      render(
        <VerticalBarChart
          data={ADMIN_FULL_ANALYTICS.bookings['7D'].volumeTrend}
        />,
      );

      expect(screen.getByRole('img', { name: /Vertical bar chart/i })).toBeTruthy();
      expect(screen.getAllByText('Sun').length).toBeGreaterThanOrEqual(1);
    });
  });
});
