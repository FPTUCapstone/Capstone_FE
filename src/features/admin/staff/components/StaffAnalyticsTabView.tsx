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
      {/* Analytics Workspace Header */}
      <header className="rounded-2xl border border-[#2A3B33] bg-[#1C2923] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#758B74]">
                Staff Operations Intelligence
              </span>
            </div>
            <h2 id="staff-analytics-title" className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Operational Analytics
            </h2>
            <p className="mt-1 text-sm text-[#A3B3AB]">
              Task throughput, queue metrics, and operational performance
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
                    primaryColor="#245747"
                    secondaryColor="#758B74"
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
                    barColor="#245747"
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
                    primaryColor="#245747"
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
                    barColor="#758B74"
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
