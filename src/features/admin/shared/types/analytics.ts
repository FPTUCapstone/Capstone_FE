export type AnalyticsTimeRange = '7D' | '30D' | '90D';

export type AnalyticsStatus =
  | 'DATA_SOURCE_NOT_CONNECTED'
  | 'NO_DATA'
  | 'LOADING'
  | 'ERROR'
  | 'AUTHORIZATION_BLOCKED';

export interface TimeSeriesPoint {
  date: string;
  label: string;
  primaryValue: number;
  secondaryValue?: number;
}

export interface DonutSegment {
  id: string;
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface CategoryMetric {
  id: string;
  name: string;
  value: number;
  formattedValue: string;
  percentage: number;
  secondaryLabel?: string;
}

export interface GroupedBarPoint {
  label: string;
  primary: number;
  secondary: number;
  date?: string;
}

export interface StackedSegment {
  id: string;
  label: string;
  value: number;
  color: string;
}

export interface StackedBarPoint {
  label: string;
  date?: string;
  segments: StackedSegment[];
}

export interface AnalyticsKPICard {
  id: string;
  label: string;
  value: string;
  helperText: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: string;
}

export interface AdminRevenueCategoryData {
  kpis: AnalyticsKPICard[];
  trend: TimeSeriesPoint[];
  composition: StackedBarPoint[];
}

export interface AdminBookingsCategoryData {
  kpis: AnalyticsKPICard[];
  volumeTrend: TimeSeriesPoint[];
  statusDistribution: DonutSegment[];
}

export interface AdminServicesCategoryData {
  kpis: AnalyticsKPICard[];
  byCategory: CategoryMetric[];
  trendComparison: TimeSeriesPoint[];
}

export interface AdminSystemActivityCategoryData {
  kpis: AnalyticsKPICard[];
  activityTrend: TimeSeriesPoint[];
  activityComposition: DonutSegment[];
}

export interface FullAdminAnalyticsDataset {
  revenue: Record<AnalyticsTimeRange, AdminRevenueCategoryData>;
  bookings: Record<AnalyticsTimeRange, AdminBookingsCategoryData>;
  services: Record<AnalyticsTimeRange, AdminServicesCategoryData>;
  systemActivity: Record<AnalyticsTimeRange, AdminSystemActivityCategoryData>;
}

export interface StaffWorkloadCategoryData {
  kpis: AnalyticsKPICard[];
  workloadTrend: GroupedBarPoint[];
  byTaskType: CategoryMetric[];
}

export interface StaffQueuesCategoryData {
  kpis: AnalyticsKPICard[];
  queueStatus: DonutSegment[];
  queueVolumeTrend: StackedBarPoint[];
}

export interface StaffPerformanceCategoryData {
  kpis: AnalyticsKPICard[];
  completionTrend: TimeSeriesPoint[];
  processingDuration: CategoryMetric[];
}

export interface FullStaffAnalyticsDataset {
  workload: Record<AnalyticsTimeRange, StaffWorkloadCategoryData>;
  queues: Record<AnalyticsTimeRange, StaffQueuesCategoryData>;
  performance: Record<AnalyticsTimeRange, StaffPerformanceCategoryData>;
}
