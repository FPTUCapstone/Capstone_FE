'use client';

import { useState } from 'react';
import {
  AreaTrendChart,
  ChartCard,
  DonutChart,
  DualLineChart,
  HorizontalBarChart,
  StackedBarChart,
  VerticalBarChart,
} from '@/features/admin/shared/components/charts';
import { AnalyticsCategoryTabs } from '@/features/admin/shared/components/tabs/AnalyticsCategoryTabs';
import { AnalyticsDateRangeFilter } from '@/features/admin/shared/components/controls/AnalyticsDateRangeFilter';
import { AnalyticsKPICardGroup } from '@/features/admin/shared/components/controls/AnalyticsKPICardGroup';
import { AnalyticsEmptyState } from '@/features/admin/shared/components/analytics/AnalyticsEmptyState';
import type {
  AnalyticsStatus,
  AnalyticsTimeRange,
  FullAdminAnalyticsDataset,
} from '@/features/admin/shared/types/analytics';

interface AdminAnalyticsTabViewProps {
  status?: AnalyticsStatus;
  dataset?: FullAdminAnalyticsDataset;
}

export function AdminAnalyticsTabView({
  status = 'DATA_SOURCE_NOT_CONNECTED',
  dataset,
}: AdminAnalyticsTabViewProps) {
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('30D');
  const [activeCategory, setActiveCategory] = useState<'revenue' | 'bookings' | 'services' | 'system'>('revenue');

  const categories = [
    { id: 'revenue', label: 'Revenue', icon: 'payments' },
    { id: 'bookings', label: 'Bookings', icon: 'book_online' },
    { id: 'services', label: 'Services', icon: 'inventory_2' },
    { id: 'system', label: 'System Activity', icon: 'query_stats' },
  ];

  const hasConnectedData = status !== 'DATA_SOURCE_NOT_CONNECTED' && Boolean(dataset);
  const activeCategoryLabel = categories.find((c) => c.id === activeCategory)?.label ?? 'Platform';

  const currentRevenue = dataset?.revenue[timeRange];
  const currentBookings = dataset?.bookings[timeRange];
  const currentServices = dataset?.services[timeRange];
  const currentSystem = dataset?.systemActivity[timeRange];

  const vndFormatter = (val: number) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}M ₫`;
    }
    return `${val.toLocaleString('vi-VN')} ₫`;
  };

  return (
    <section aria-labelledby="platform-analytics-title" className="space-y-6">
      {/* Analytics Workspace Header */}
      <header className="rounded-2xl border border-[#2A3B33] bg-[#1C2923] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#758B74]">
                Enterprise Business Intelligence
              </span>
            </div>
            <h2 id="platform-analytics-title" className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Platform Analytics
            </h2>
            <p className="mt-1 text-sm text-[#A3B3AB]">
              Business performance, booking activity and platform insights
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-[#A3B3AB]">Time Range:</span>
            <AnalyticsDateRangeFilter
              value={timeRange}
              onChange={setTimeRange}
              disabled={!hasConnectedData}
            />
          </div>
        </div>
      </header>

      {/* Internal Category Tabs */}
      <AnalyticsCategoryTabs
        categories={categories}
        activeCategoryId={activeCategory}
        onSelectCategory={(id) => setActiveCategory(id as typeof activeCategory)}
      />

      {/* When data source is not connected or no data available, render honest status state */}
      {!hasConnectedData ? (
        <AnalyticsEmptyState status={status} categoryName={activeCategoryLabel} />
      ) : (
        <>
          {activeCategory === 'revenue' && currentRevenue && (
            <div className="space-y-6">
              <AnalyticsKPICardGroup cards={currentRevenue.kpis} />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard
                  title="Revenue Trend"
                  subtitle={`Gross platform revenue over ${timeRange}`}
                  badgeLabel="Area Trend"
                >
                  <AreaTrendChart
                    data={currentRevenue.trend}
                    primaryColor="#245747"
                    gradientId="admin-rev-trend-grad"
                    valueFormatter={vndFormatter}
                  />
                </ChartCard>

                <ChartCard
                  title="Revenue Composition"
                  subtitle="Commission, operator payouts and refunds"
                  badgeLabel="Stacked Breakdown"
                >
                  <StackedBarChart
                    data={currentRevenue.composition}
                    valueFormatter={vndFormatter}
                  />
                </ChartCard>
              </div>
            </div>
          )}

          {activeCategory === 'bookings' && currentBookings && (
            <div className="space-y-6">
              <AnalyticsKPICardGroup cards={currentBookings.kpis} />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard
                  title="Booking Volume Trend"
                  subtitle={`Confirmed booking count across ${timeRange}`}
                  badgeLabel="Volume"
                >
                  <VerticalBarChart
                    data={currentBookings.volumeTrend}
                    color="#245747"
                    valueFormatter={(val) => `${val} orders`}
                  />
                </ChartCard>

                <ChartCard
                  title="Booking Status Distribution"
                  subtitle="Fulfillment pipeline breakdown"
                  badgeLabel="Status Ratio"
                >
                  <DonutChart
                    segments={currentBookings.statusDistribution}
                    centerLabel="Total Orders"
                    centerValue={currentBookings.statusDistribution.reduce((acc, s) => acc + s.value, 0).toLocaleString()}
                  />
                </ChartCard>
              </div>
            </div>
          )}

          {activeCategory === 'services' && currentServices && (
            <div className="space-y-6">
              <AnalyticsKPICardGroup cards={currentServices.kpis} />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard
                  title="Service Activity by Category"
                  subtitle="Demand volume across approved platform categories"
                  badgeLabel="Catalogue Mix"
                >
                  <HorizontalBarChart
                    categories={currentServices.byCategory}
                    barColor="#245747"
                  />
                </ChartCard>

                <ChartCard
                  title="Service Activity Trend"
                  subtitle="Comparing Tours (Primary) vs Attractions (Secondary)"
                  badgeLabel="Comparative"
                >
                  <DualLineChart
                    data={currentServices.trendComparison}
                    primaryLabel="Tours & Experiences"
                    secondaryLabel="Attractions & Admissions"
                    primaryColor="#245747"
                    secondaryColor="#758B74"
                  />
                </ChartCard>
              </div>
            </div>
          )}

          {activeCategory === 'system' && currentSystem && (
            <div className="space-y-6">
              <AnalyticsKPICardGroup cards={currentSystem.kpis} />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard
                  title="Platform Activity Trend"
                  subtitle={`Active planning and browsing sessions (${timeRange})`}
                  badgeLabel="Traffic"
                >
                  <AreaTrendChart
                    data={currentSystem.activityTrend}
                    primaryColor="#758B74"
                    gradientId="admin-sys-trend-grad"
                    valueFormatter={(val: number) => `${val.toLocaleString()} sessions`}
                  />
                </ChartCard>

                <ChartCard
                  title="Activity Composition"
                  subtitle="Platform user actions across modules"
                  badgeLabel="Distribution"
                >
                  <DonutChart
                    segments={currentSystem.activityComposition}
                    centerLabel="Actions"
                    centerValue={currentSystem.activityComposition.reduce((acc, s) => acc + s.value, 0).toLocaleString()}
                  />
                </ChartCard>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
