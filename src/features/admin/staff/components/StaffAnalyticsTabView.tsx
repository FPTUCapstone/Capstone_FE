'use client';

import { useState } from 'react';
import {
  AreaTrendChart,
  ChartCard,
  DonutChart,
  GroupedBarChart,
  HorizontalBarChart,
  StackedBarChart,
} from '@/features/admin/shared/components/charts';
import { AnalyticsCategoryTabs } from '@/features/admin/shared/components/tabs/AnalyticsCategoryTabs';
import { AnalyticsDateRangeFilter } from '@/features/admin/shared/components/controls/AnalyticsDateRangeFilter';
import { AnalyticsKPICardGroup } from '@/features/admin/shared/components/controls/AnalyticsKPICardGroup';
import { AnalyticsEmptyState } from '@/features/admin/shared/components/analytics/AnalyticsEmptyState';
import type {
  AnalyticsStatus,
  AnalyticsTimeRange,
  FullStaffAnalyticsDataset,
} from '@/features/admin/shared/types/analytics';

interface StaffAnalyticsTabViewProps {
  status?: AnalyticsStatus;
  dataset?: FullStaffAnalyticsDataset;
}

export function StaffAnalyticsTabView({
  status = 'DATA_SOURCE_NOT_CONNECTED',
  dataset,
}: StaffAnalyticsTabViewProps) {
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('7D');
  const [activeCategory, setActiveCategory] = useState<'workload' | 'queues' | 'performance'>('workload');

  const categories = [
    { id: 'workload', label: 'Workload', icon: 'assignment' },
    { id: 'queues', label: 'Queues', icon: 'pending_actions' },
    { id: 'performance', label: 'Performance', icon: 'speed' },
  ];

  const hasConnectedData = status !== 'DATA_SOURCE_NOT_CONNECTED' && Boolean(dataset);
  const activeCategoryLabel = categories.find((c) => c.id === activeCategory)?.label ?? 'Staff';

  const currentWorkload = dataset?.workload[timeRange];
  const currentQueues = dataset?.queues[timeRange];
  const currentPerformance = dataset?.performance[timeRange];

  return (
    <section aria-labelledby="staff-analytics-title" className="space-y-6">
      {/* Analytics Section Toolbar */}
      <header className="flex flex-col justify-between gap-3 rounded-2xl border border-[#DCE2DD] bg-white px-5 py-4 shadow-xs lg:flex-row lg:items-center">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#174B4A]">
            Staff Operations Intelligence
          </p>
          <h2 id="staff-analytics-title" className="mt-0.5 text-lg font-extrabold tracking-tight text-[#1C2928] sm:text-xl">
            Operational Analytics
          </h2>
          <p className="mt-0.5 text-xs text-[#5B6E69] sm:text-sm">
            Task throughput, queue metrics, and operational performance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold text-[#5B6E69]">Time Range:</span>
          <AnalyticsDateRangeFilter
            value={timeRange}
            onChange={setTimeRange}
            disabled={!hasConnectedData}
          />
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
          {activeCategory === 'workload' && currentWorkload && (
            <div className="space-y-6">
              <AnalyticsKPICardGroup cards={currentWorkload.kpis} />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard
                  title="Operational Workload Trend"
                  subtitle="Tasks received vs tasks completed by Staff"
                  badgeLabel="Throughput"
                >
                  <GroupedBarChart
                    data={currentWorkload.workloadTrend}
                    primaryLabel="Tasks Received"
                    secondaryLabel="Tasks Completed"
                    primaryColor="#174B4A"
                    secondaryColor="#5B6E69"
                    valueFormatter={(v) => `${v} tasks`}
                  />
                </ChartCard>

                <ChartCard
                  title="Workload by Task Type"
                  subtitle="Distribution across approved Staff operational queues"
                  badgeLabel="Queue Mix"
                >
                  <HorizontalBarChart
                    categories={currentWorkload.byTaskType}
                    barColor="#174B4A"
                  />
                </ChartCard>
              </div>
            </div>
          )}

          {activeCategory === 'queues' && currentQueues && (
            <div className="space-y-6">
              <AnalyticsKPICardGroup cards={currentQueues.kpis} />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard
                  title="Queue Backlog Composition"
                  subtitle="Status distribution of pending queue tasks"
                  badgeLabel="Backlog"
                >
                  <DonutChart
                    segments={currentQueues.queueStatus}
                    centerLabel="Total Queue"
                    centerValue={currentQueues.queueStatus.reduce((acc, s) => acc + s.value, 0).toLocaleString()}
                  />
                </ChartCard>

                <ChartCard
                  title="Queue Intake vs Clearance"
                  subtitle="Daily flow of items entering and leaving queues"
                  badgeLabel="Intake Flow"
                >
                  <StackedBarChart
                    data={currentQueues.queueVolumeTrend}
                    valueFormatter={(v) => `${v} items`}
                  />
                </ChartCard>
              </div>
            </div>
          )}

          {activeCategory === 'performance' && currentPerformance && (
            <div className="space-y-6">
              <AnalyticsKPICardGroup cards={currentPerformance.kpis} />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard
                  title="Daily Completion Rate"
                  subtitle={`Resolution velocity over ${timeRange}`}
                  badgeLabel="Velocity"
                >
                  <AreaTrendChart
                    data={currentPerformance.completionTrend}
                    primaryColor="#174B4A"
                    gradientId="staff-perf-trend-grad"
                    valueFormatter={(v) => `${v}%`}
                  />
                </ChartCard>

                <ChartCard
                  title="Average Processing Duration"
                  subtitle="Time spent per task type across queues"
                  badgeLabel="Efficiency"
                >
                  <HorizontalBarChart
                    categories={currentPerformance.processingDuration}
                    barColor="#5B6E69"
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
