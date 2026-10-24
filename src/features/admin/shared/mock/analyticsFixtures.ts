export type AnalyticsTimeRange = '7D' | '30D' | '90D';

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

// -------------------------------------------------------------
// Administrator Analytics Datasets
// -------------------------------------------------------------

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
  isDemo: true;
  attribution: string;
  revenue: Record<AnalyticsTimeRange, AdminRevenueCategoryData>;
  bookings: Record<AnalyticsTimeRange, AdminBookingsCategoryData>;
  services: Record<AnalyticsTimeRange, AdminServicesCategoryData>;
  systemActivity: Record<AnalyticsTimeRange, AdminSystemActivityCategoryData>;
}

export const ADMIN_FULL_ANALYTICS: FullAdminAnalyticsDataset = {
  isDemo: true,
  attribution: 'Demo Data — Preview Only (Simulated Administrator Intelligence)',
  revenue: {
    '7D': {
      kpis: [
        { id: 'rev-gross', label: 'Gross Platform Volume', value: '142.500.000 ₫', helperText: 'Recognized 7D GMV', trend: { value: '+8.4%', isPositive: true }, icon: 'account_balance_wallet' },
        { id: 'rev-comm', label: 'Platform Revenue (Commission)', value: '21.375.000 ₫', helperText: 'Effective 15% rate', trend: { value: '+6.1%', isPositive: true }, icon: 'payments' },
        { id: 'rev-aov', label: 'Average Booking Value', value: '1.850.000 ₫', helperText: 'Per confirmed order', trend: { value: '+2.5%', isPositive: true }, icon: 'shopping_bag' },
        { id: 'rev-refund', label: 'Refund Adjustments', value: '2.100.000 ₫', helperText: '1.4% of total GMV', trend: { value: '-0.3%', isPositive: true }, icon: 'price_check' },
      ],
      trend: [
        { date: '2026-10-18', label: 'Sun', primaryValue: 14500000 },
        { date: '2026-10-19', label: 'Mon', primaryValue: 18200000 },
        { date: '2026-10-20', label: 'Tue', primaryValue: 21400000 },
        { date: '2026-10-21', label: 'Wed', primaryValue: 19800000 },
        { date: '2026-10-22', label: 'Thu', primaryValue: 24600000 },
        { date: '2026-10-23', label: 'Fri', primaryValue: 28500000 },
        { date: '2026-10-24', label: 'Sat', primaryValue: 25500000 },
      ],
      composition: [
        {
          label: 'Sun',
          segments: [
            { id: 'payout', label: 'Operator Payout', value: 12100000, color: '#245747' },
            { id: 'comm', label: 'Platform Comm.', value: 2175000, color: '#758B74' },
            { id: 'refund', label: 'Refunds', value: 225000, color: '#B87558' },
          ],
        },
        {
          label: 'Mon',
          segments: [
            { id: 'payout', label: 'Operator Payout', value: 15150000, color: '#245747' },
            { id: 'comm', label: 'Platform Comm.', value: 2730000, color: '#758B74' },
            { id: 'refund', label: 'Refunds', value: 320000, color: '#B87558' },
          ],
        },
        {
          label: 'Tue',
          segments: [
            { id: 'payout', label: 'Operator Payout', value: 17800000, color: '#245747' },
            { id: 'comm', label: 'Platform Comm.', value: 3210000, color: '#758B74' },
            { id: 'refund', label: 'Refunds', value: 390000, color: '#B87558' },
          ],
        },
        {
          label: 'Wed',
          segments: [
            { id: 'payout', label: 'Operator Payout', value: 16500000, color: '#245747' },
            { id: 'comm', label: 'Platform Comm.', value: 2970000, color: '#758B74' },
            { id: 'refund', label: 'Refunds', value: 330000, color: '#B87558' },
          ],
        },
        {
          label: 'Thu',
          segments: [
            { id: 'payout', label: 'Operator Payout', value: 20500000, color: '#245747' },
            { id: 'comm', label: 'Platform Comm.', value: 3690000, color: '#758B74' },
            { id: 'refund', label: 'Refunds', value: 410000, color: '#B87558' },
          ],
        },
        {
          label: 'Fri',
          segments: [
            { id: 'payout', label: 'Operator Payout', value: 23800000, color: '#245747' },
            { id: 'comm', label: 'Platform Comm.', value: 4275000, color: '#758B74' },
            { id: 'refund', label: 'Refunds', value: 425000, color: '#B87558' },
          ],
        },
        {
          label: 'Sat',
          segments: [
            { id: 'payout', label: 'Operator Payout', value: 21300000, color: '#245747' },
            { id: 'comm', label: 'Platform Comm.', value: 3825000, color: '#758B74' },
            { id: 'refund', label: 'Refunds', value: 375000, color: '#B87558' },
          ],
        },
      ],
    },
    '30D': {
      kpis: [
        { id: 'rev-gross', label: 'Gross Platform Volume', value: '628.000.000 ₫', helperText: 'Recognized 30D GMV', trend: { value: '+12.8%', isPositive: true }, icon: 'account_balance_wallet' },
        { id: 'rev-comm', label: 'Platform Revenue (Commission)', value: '94.200.000 ₫', helperText: 'Commission pool', trend: { value: '+11.2%', isPositive: true }, icon: 'payments' },
        { id: 'rev-aov', label: 'Average Booking Value', value: '1.920.000 ₫', helperText: 'Across 327 orders', trend: { value: '+4.1%', isPositive: true }, icon: 'shopping_bag' },
        { id: 'rev-refund', label: 'Refund Adjustments', value: '9.420.000 ₫', helperText: '1.5% adjustment rate', trend: { value: '-0.2%', isPositive: true }, icon: 'price_check' },
      ],
      trend: [
        { date: '2026-09-25', label: 'Week 1', primaryValue: 128000000 },
        { date: '2026-10-02', label: 'Week 2', primaryValue: 154000000 },
        { date: '2026-10-09', label: 'Week 3', primaryValue: 172000000 },
        { date: '2026-10-16', label: 'Week 4', primaryValue: 184000000 },
      ],
      composition: [
        {
          label: 'Week 1',
          segments: [
            { id: 'payout', label: 'Operator Payout', value: 106800000, color: '#245747' },
            { id: 'comm', label: 'Platform Comm.', value: 19200000, color: '#758B74' },
            { id: 'refund', label: 'Refunds', value: 2000000, color: '#B87558' },
          ],
        },
        {
          label: 'Week 2',
          segments: [
            { id: 'payout', label: 'Operator Payout', value: 128500000, color: '#245747' },
            { id: 'comm', label: 'Platform Comm.', value: 23100000, color: '#758B74' },
            { id: 'refund', label: 'Refunds', value: 2400000, color: '#B87558' },
          ],
        },
        {
          label: 'Week 3',
          segments: [
            { id: 'payout', label: 'Operator Payout', value: 143500000, color: '#245747' },
            { id: 'comm', label: 'Platform Comm.', value: 25800000, color: '#758B74' },
            { id: 'refund', label: 'Refunds', value: 2700000, color: '#B87558' },
          ],
        },
        {
          label: 'Week 4',
          segments: [
            { id: 'payout', label: 'Operator Payout', value: 153500000, color: '#245747' },
            { id: 'comm', label: 'Platform Comm.', value: 27600000, color: '#758B74' },
            { id: 'refund', label: 'Refunds', value: 2900000, color: '#B87558' },
          ],
        },
      ],
    },
    '90D': {
      kpis: [
        { id: 'rev-gross', label: 'Gross Platform Volume', value: '1.840.000.000 ₫', helperText: 'Quarterly GMV', trend: { value: '+19.5%', isPositive: true }, icon: 'account_balance_wallet' },
        { id: 'rev-comm', label: 'Platform Revenue (Commission)', value: '276.000.000 ₫', helperText: 'Cumulative commission', trend: { value: '+18.1%', isPositive: true }, icon: 'payments' },
        { id: 'rev-aov', label: 'Average Booking Value', value: '1.890.000 ₫', helperText: 'Across 973 orders', trend: { value: '+5.3%', isPositive: true }, icon: 'shopping_bag' },
        { id: 'rev-refund', label: 'Refund Adjustments', value: '27.600.000 ₫', helperText: '1.5% adjustment rate', trend: { value: '-0.4%', isPositive: true }, icon: 'price_check' },
      ],
      trend: [
        { date: '2026-08', label: 'August', primaryValue: 520000000 },
        { date: '2026-09', label: 'September', primaryValue: 640000000 },
        { date: '2026-10', label: 'October', primaryValue: 680000000 },
      ],
      composition: [
        {
          label: 'August',
          segments: [
            { id: 'payout', label: 'Operator Payout', value: 434200000, color: '#245747' },
            { id: 'comm', label: 'Platform Comm.', value: 78000000, color: '#758B74' },
            { id: 'refund', label: 'Refunds', value: 7800000, color: '#B87558' },
          ],
        },
        {
          label: 'September',
          segments: [
            { id: 'payout', label: 'Operator Payout', value: 534400000, color: '#245747' },
            { id: 'comm', label: 'Platform Comm.', value: 96000000, color: '#758B74' },
            { id: 'refund', label: 'Refunds', value: 9600000, color: '#B87558' },
          ],
        },
        {
          label: 'October',
          segments: [
            { id: 'payout', label: 'Operator Payout', value: 567800000, color: '#245747' },
            { id: 'comm', label: 'Platform Comm.', value: 102000000, color: '#758B74' },
            { id: 'refund', label: 'Refunds', value: 10200000, color: '#B87558' },
          ],
        },
      ],
    },
  },
  bookings: {
    '7D': {
      kpis: [
        { id: 'bk-total', label: 'Total Bookings', value: '77 orders', helperText: 'Recorded in 7D', trend: { value: '+6.2%', isPositive: true }, icon: 'book_online' },
        { id: 'bk-conf', label: 'Confirmation Rate', value: '88.3%', helperText: 'Immediate confirmation', trend: { value: '+1.5%', isPositive: true }, icon: 'verified' },
        { id: 'bk-comp', label: 'Completed Tours', value: '54 trips', helperText: 'Successfully concluded', trend: { value: '+4.0%', isPositive: true }, icon: 'task_alt' },
        { id: 'bk-canc', label: 'Cancellation Rate', value: '4.8%', helperText: 'Low operational friction', trend: { value: '-0.8%', isPositive: true }, icon: 'cancel' },
      ],
      volumeTrend: [
        { date: '2026-10-18', label: 'Sun', primaryValue: 8 },
        { date: '2026-10-19', label: 'Mon', primaryValue: 10 },
        { date: '2026-10-20', label: 'Tue', primaryValue: 12 },
        { date: '2026-10-21', label: 'Wed', primaryValue: 11 },
        { date: '2026-10-22', label: 'Thu', primaryValue: 13 },
        { date: '2026-10-23', label: 'Fri', primaryValue: 15 },
        { date: '2026-10-24', label: 'Sat', primaryValue: 14 },
      ],
      statusDistribution: [
        { id: 'completed', label: 'Completed', value: 54, percentage: 70, color: '#245747' },
        { id: 'confirmed', label: 'Confirmed', value: 14, percentage: 18, color: '#758B74' },
        { id: 'pending', label: 'Pending', value: 6, percentage: 8, color: '#C88A36' },
        { id: 'cancelled', label: 'Cancelled', value: 3, percentage: 4, color: '#B87558' },
      ],
    },
    '30D': {
      kpis: [
        { id: 'bk-total', label: 'Total Bookings', value: '327 orders', helperText: 'Monthly total', trend: { value: '+14.5%', isPositive: true }, icon: 'book_online' },
        { id: 'bk-conf', label: 'Confirmation Rate', value: '89.6%', helperText: 'High operator adherence', trend: { value: '+2.1%', isPositive: true }, icon: 'verified' },
        { id: 'bk-comp', label: 'Completed Tours', value: '238 trips', helperText: 'Full traveler fulfillment', trend: { value: '+11.8%', isPositive: true }, icon: 'task_alt' },
        { id: 'bk-canc', label: 'Cancellation Rate', value: '5.2%', helperText: 'Normal seasonal level', trend: { value: '-0.5%', isPositive: true }, icon: 'cancel' },
      ],
      volumeTrend: [
        { date: '2026-09-25', label: 'Week 1', primaryValue: 68 },
        { date: '2026-10-02', label: 'Week 2', primaryValue: 80 },
        { date: '2026-10-09', label: 'Week 3', primaryValue: 89 },
        { date: '2026-10-16', label: 'Week 4', primaryValue: 90 },
      ],
      statusDistribution: [
        { id: 'completed', label: 'Completed', value: 238, percentage: 73, color: '#245747' },
        { id: 'confirmed', label: 'Confirmed', value: 55, percentage: 17, color: '#758B74' },
        { id: 'pending', label: 'Pending', value: 17, percentage: 5, color: '#C88A36' },
        { id: 'cancelled', label: 'Cancelled', value: 17, percentage: 5, color: '#B87558' },
      ],
    },
    '90D': {
      kpis: [
        { id: 'bk-total', label: 'Total Bookings', value: '973 orders', helperText: 'Quarterly bookings', trend: { value: '+21.0%', isPositive: true }, icon: 'book_online' },
        { id: 'bk-conf', label: 'Confirmation Rate', value: '90.2%', helperText: 'Sustained standard', trend: { value: '+2.8%', isPositive: true }, icon: 'verified' },
        { id: 'bk-comp', label: 'Completed Tours', value: '710 trips', helperText: 'Finished itineraries', trend: { value: '+18.4%', isPositive: true }, icon: 'task_alt' },
        { id: 'bk-canc', label: 'Cancellation Rate', value: '5.0%', helperText: 'Stable platform baseline', trend: { value: '-0.3%', isPositive: true }, icon: 'cancel' },
      ],
      volumeTrend: [
        { date: '2026-08', label: 'August', primaryValue: 275 },
        { date: '2026-09', label: 'September', primaryValue: 338 },
        { date: '2026-10', label: 'October', primaryValue: 360 },
      ],
      statusDistribution: [
        { id: 'completed', label: 'Completed', value: 710, percentage: 73, color: '#245747' },
        { id: 'confirmed', label: 'Confirmed', value: 165, percentage: 17, color: '#758B74' },
        { id: 'pending', label: 'Pending', value: 49, percentage: 5, color: '#C88A36' },
        { id: 'cancelled', label: 'Cancelled', value: 49, percentage: 5, color: '#B87558' },
      ],
    },
  },
  services: {
    '7D': {
      kpis: [
        { id: 'srv-active', label: 'Active Services', value: '142 catalogued', helperText: 'Verified offerings', trend: { value: '+4 items', isPositive: true }, icon: 'inventory_2' },
        { id: 'srv-top', label: 'Top Category', value: 'Tours & Experiences', helperText: '58% demand share', trend: { value: 'Steady', isPositive: true }, icon: 'tour' },
        { id: 'srv-poi', label: 'Attraction Admissions', value: '48 tickets', helperText: 'POI partner integrations', trend: { value: '+9.1%', isPositive: true }, icon: 'local_activity' },
        { id: 'srv-iti', label: 'Custom Itineraries', value: '26 plans', helperText: 'Planner auto-generated', trend: { value: '+5.0%', isPositive: true }, icon: 'map' },
      ],
      byCategory: [
        { id: 'tours', name: 'Tours & Experiences', value: 82500000, formattedValue: '82.500.000 ₫', percentage: 58, secondaryLabel: '45 bookings' },
        { id: 'pois', name: 'POI Attractions & Admissions', value: 31350000, formattedValue: '31.350.000 ₫', percentage: 22, secondaryLabel: '17 bookings' },
        { id: 'itineraries', name: 'Custom Itinerary Packages', value: 19950000, formattedValue: '19.950.000 ₫', percentage: 14, secondaryLabel: '11 bookings' },
        { id: 'partner-addons', name: 'Partner Transportation & Addons', value: 8700000, formattedValue: '8.700.000 ₫', percentage: 6, secondaryLabel: '4 bookings' },
      ],
      trendComparison: [
        { date: '2026-10-18', label: 'Sun', primaryValue: 28, secondaryValue: 12 },
        { date: '2026-10-19', label: 'Mon', primaryValue: 34, secondaryValue: 15 },
        { date: '2026-10-20', label: 'Tue', primaryValue: 40, secondaryValue: 18 },
        { date: '2026-10-21', label: 'Wed', primaryValue: 38, secondaryValue: 16 },
        { date: '2026-10-22', label: 'Thu', primaryValue: 46, secondaryValue: 21 },
        { date: '2026-10-23', label: 'Fri', primaryValue: 52, secondaryValue: 25 },
        { date: '2026-10-24', label: 'Sat', primaryValue: 49, secondaryValue: 23 },
      ],
    },
    '30D': {
      kpis: [
        { id: 'srv-active', label: 'Active Services', value: '142 catalogued', helperText: '30D catalog size', trend: { value: '+12 items', isPositive: true }, icon: 'inventory_2' },
        { id: 'srv-top', label: 'Top Category', value: 'Tours & Experiences', helperText: '57% platform share', trend: { value: 'Leader', isPositive: true }, icon: 'tour' },
        { id: 'srv-poi', label: 'Attraction Admissions', value: '198 tickets', helperText: 'Month-to-date volume', trend: { value: '+14.2%', isPositive: true }, icon: 'local_activity' },
        { id: 'srv-iti', label: 'Custom Itineraries', value: '115 plans', helperText: 'Interactive bookings', trend: { value: '+8.3%', isPositive: true }, icon: 'map' },
      ],
      byCategory: [
        { id: 'tours', name: 'Tours & Experiences', value: 358000000, formattedValue: '358.000.000 ₫', percentage: 57, secondaryLabel: '186 bookings' },
        { id: 'pois', name: 'POI Attractions & Admissions', value: 138000000, formattedValue: '138.000.000 ₫', percentage: 22, secondaryLabel: '72 bookings' },
        { id: 'itineraries', name: 'Custom Itinerary Packages', value: 88000000, formattedValue: '88.000.000 ₫', percentage: 14, secondaryLabel: '46 bookings' },
        { id: 'partner-addons', name: 'Partner Transportation & Addons', value: 44000000, formattedValue: '44.000.000 ₫', percentage: 7, secondaryLabel: '23 bookings' },
      ],
      trendComparison: [
        { date: '2026-09-25', label: 'Week 1', primaryValue: 120, secondaryValue: 55 },
        { date: '2026-10-02', label: 'Week 2', primaryValue: 145, secondaryValue: 68 },
        { date: '2026-10-09', label: 'Week 3', primaryValue: 165, secondaryValue: 78 },
        { date: '2026-10-16', label: 'Week 4', primaryValue: 178, secondaryValue: 84 },
      ],
    },
    '90D': {
      kpis: [
        { id: 'srv-active', label: 'Active Services', value: '142 catalogued', helperText: 'Quarterly benchmark', trend: { value: '+24 items', isPositive: true }, icon: 'inventory_2' },
        { id: 'srv-top', label: 'Top Category', value: 'Tours & Experiences', helperText: '56% aggregate share', trend: { value: 'Steady', isPositive: true }, icon: 'tour' },
        { id: 'srv-poi', label: 'Attraction Admissions', value: '580 tickets', helperText: '90D ticket issuance', trend: { value: '+22.5%', isPositive: true }, icon: 'local_activity' },
        { id: 'srv-iti', label: 'Custom Itineraries', value: '340 plans', helperText: 'Algorithmic routes', trend: { value: '+19.1%', isPositive: true }, icon: 'map' },
      ],
      byCategory: [
        { id: 'tours', name: 'Tours & Experiences', value: 1030000000, formattedValue: '1.030.000.000 ₫', percentage: 56, secondaryLabel: '545 bookings' },
        { id: 'pois', name: 'POI Attractions & Admissions', value: 405000000, formattedValue: '405.000.000 ₫', percentage: 22, secondaryLabel: '214 bookings' },
        { id: 'itineraries', name: 'Custom Itinerary Packages', value: 276000000, formattedValue: '276.000.000 ₫', percentage: 15, secondaryLabel: '146 bookings' },
        { id: 'partner-addons', name: 'Partner Transportation & Addons', value: 129000000, formattedValue: '129.000.000 ₫', percentage: 7, secondaryLabel: '68 bookings' },
      ],
      trendComparison: [
        { date: '2026-08', label: 'August', primaryValue: 480, secondaryValue: 220 },
        { date: '2026-09', label: 'September', primaryValue: 590, secondaryValue: 280 },
        { date: '2026-10', label: 'October', primaryValue: 640, secondaryValue: 310 },
      ],
    },
  },
  systemActivity: {
    '7D': {
      kpis: [
        { id: 'sys-sessions', label: 'Platform Sessions', value: '4.820 sessions', helperText: 'Active visitor traffic', trend: { value: '+7.4%', isPositive: true }, icon: 'query_stats' },
        { id: 'sys-planners', label: 'Active Planners', value: '1.240 users', helperText: 'Generated routes', trend: { value: '+9.2%', isPositive: true }, icon: 'route' },
        { id: 'sys-peak', label: 'Peak Hour', value: '20:00 – 22:00', helperText: 'Evening travel planning', trend: { value: 'UTC+7', isPositive: true }, icon: 'schedule' },
        { id: 'sys-conv', label: 'Explore-to-Cart', value: '6.4%', helperText: 'Discovery conversion', trend: { value: '+0.5%', isPositive: true }, icon: 'trending_up' },
      ],
      activityTrend: [
        { date: '2026-10-18', label: 'Sun', primaryValue: 620 },
        { date: '2026-10-19', label: 'Mon', primaryValue: 710 },
        { date: '2026-10-20', label: 'Tue', primaryValue: 780 },
        { date: '2026-10-21', label: 'Wed', primaryValue: 740 },
        { date: '2026-10-22', label: 'Thu', primaryValue: 850 },
        { date: '2026-10-23', label: 'Fri', primaryValue: 940 },
        { date: '2026-10-24', label: 'Sat', primaryValue: 880 },
      ],
      activityComposition: [
        { id: 'search', label: 'Search & Explore', value: 2170, percentage: 45, color: '#245747' },
        { id: 'itinerary', label: 'Itinerary Generation', value: 1445, percentage: 30, color: '#758B74' },
        { id: 'checkout', label: 'Booking & Checkout', value: 725, percentage: 15, color: '#C88A36' },
        { id: 'account', label: 'Reviews & Account', value: 480, percentage: 10, color: '#B87558' },
      ],
    },
    '30D': {
      kpis: [
        { id: 'sys-sessions', label: 'Platform Sessions', value: '21.400 sessions', helperText: 'Monthly total traffic', trend: { value: '+16.8%', isPositive: true }, icon: 'query_stats' },
        { id: 'sys-planners', label: 'Active Planners', value: '5.620 users', helperText: 'Active itinerary makers', trend: { value: '+14.1%', isPositive: true }, icon: 'route' },
        { id: 'sys-peak', label: 'Peak Hour', value: '20:00 – 22:00', helperText: 'Highest concurrency', trend: { value: 'UTC+7', isPositive: true }, icon: 'schedule' },
        { id: 'sys-conv', label: 'Explore-to-Cart', value: '6.8%', helperText: 'Month-to-date conversion', trend: { value: '+0.8%', isPositive: true }, icon: 'trending_up' },
      ],
      activityTrend: [
        { date: '2026-09-25', label: 'Week 1', primaryValue: 4600 },
        { date: '2026-10-02', label: 'Week 2', primaryValue: 5200 },
        { date: '2026-10-09', label: 'Week 3', primaryValue: 5700 },
        { date: '2026-10-16', label: 'Week 4', primaryValue: 5900 },
      ],
      activityComposition: [
        { id: 'search', label: 'Search & Explore', value: 9630, percentage: 45, color: '#245747' },
        { id: 'itinerary', label: 'Itinerary Generation', value: 6420, percentage: 30, color: '#758B74' },
        { id: 'checkout', label: 'Booking & Checkout', value: 3210, percentage: 15, color: '#C88A36' },
        { id: 'account', label: 'Reviews & Account', value: 2140, percentage: 10, color: '#B87558' },
      ],
    },
    '90D': {
      kpis: [
        { id: 'sys-sessions', label: 'Platform Sessions', value: '64.800 sessions', helperText: 'Quarterly total', trend: { value: '+24.5%', isPositive: true }, icon: 'query_stats' },
        { id: 'sys-planners', label: 'Active Planners', value: '17.300 users', helperText: 'Quarterly user base', trend: { value: '+21.3%', isPositive: true }, icon: 'route' },
        { id: 'sys-peak', label: 'Peak Hour', value: '20:00 – 22:00', helperText: 'Prime user window', trend: { value: 'UTC+7', isPositive: true }, icon: 'schedule' },
        { id: 'sys-conv', label: 'Explore-to-Cart', value: '6.7%', helperText: 'Quarterly conversion', trend: { value: '+0.6%', isPositive: true }, icon: 'trending_up' },
      ],
      activityTrend: [
        { date: '2026-08', label: 'August', primaryValue: 18200 },
        { date: '2026-09', label: 'September', primaryValue: 22400 },
        { date: '2026-10', label: 'October', primaryValue: 24200 },
      ],
      activityComposition: [
        { id: 'search', label: 'Search & Explore', value: 29160, percentage: 45, color: '#245747' },
        { id: 'itinerary', label: 'Itinerary Generation', value: 19440, percentage: 30, color: '#758B74' },
        { id: 'checkout', label: 'Booking & Checkout', value: 9720, percentage: 15, color: '#C88A36' },
        { id: 'account', label: 'Reviews & Account', value: 6480, percentage: 10, color: '#B87558' },
      ],
    },
  },
};

// -------------------------------------------------------------
// Staff Analytics Datasets
// -------------------------------------------------------------

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
  isDemo: true;
  attribution: string;
  workload: Record<AnalyticsTimeRange, StaffWorkloadCategoryData>;
  queues: Record<AnalyticsTimeRange, StaffQueuesCategoryData>;
  performance: Record<AnalyticsTimeRange, StaffPerformanceCategoryData>;
}

export const STAFF_FULL_ANALYTICS: FullStaffAnalyticsDataset = {
  isDemo: true,
  attribution: 'Demo Data — Preview Only (Simulated Staff Operational Intelligence)',
  workload: {
    '7D': {
      kpis: [
        { id: 'wk-rcv', label: 'Tasks Received', value: '142 tasks', helperText: 'New items queued', trend: { value: '+8.2%', isPositive: true }, icon: 'inbox' },
        { id: 'wk-done', label: 'Tasks Completed', value: '136 tasks', helperText: 'Processed by team', trend: { value: '+9.5%', isPositive: true }, icon: 'task_alt' },
        { id: 'wk-clr', label: 'Clearance Ratio', value: '95.8%', helperText: 'Throughput vs intake', trend: { value: '+1.3%', isPositive: true }, icon: 'done_all' },
        { id: 'wk-active', label: 'Active Handlers', value: '6 operators', helperText: 'On active rotation', trend: { value: 'Full shift', isPositive: true }, icon: 'support_agent' },
      ],
      workloadTrend: [
        { label: 'Sun', primary: 16, secondary: 15 },
        { label: 'Mon', primary: 22, secondary: 21 },
        { label: 'Tue', primary: 26, secondary: 25 },
        { label: 'Wed', primary: 20, secondary: 21 },
        { label: 'Thu', primary: 28, secondary: 27 },
        { label: 'Fri', primary: 32, secondary: 30 },
        { label: 'Sat', primary: 24, secondary: 23 },
      ],
      byTaskType: [
        { id: 'tour-mod', name: 'Tour Moderation (UC-60/61)', value: 58, formattedValue: '58 tasks', percentage: 41, secondaryLabel: '41% of total' },
        { id: 'op-kyc', name: 'Tour Operator Applications', value: 38, formattedValue: '38 tasks', percentage: 27, secondaryLabel: '27% of total' },
        { id: 'poi-ops', name: 'POI Operations (UC-52)', value: 28, formattedValue: '28 tasks', percentage: 20, secondaryLabel: '20% of total' },
        { id: 'payout-rev', name: 'Payout Review (UC-64)', value: 18, formattedValue: '18 tasks', percentage: 12, secondaryLabel: '12% of total' },
      ],
    },
    '30D': {
      kpis: [
        { id: 'wk-rcv', label: 'Tasks Received', value: '620 tasks', helperText: 'Monthly intake', trend: { value: '+14.0%', isPositive: true }, icon: 'inbox' },
        { id: 'wk-done', label: 'Tasks Completed', value: '598 tasks', helperText: 'Resolved by Staff', trend: { value: '+15.2%', isPositive: true }, icon: 'task_alt' },
        { id: 'wk-clr', label: 'Clearance Ratio', value: '96.5%', helperText: 'High operational rhythm', trend: { value: '+1.0%', isPositive: true }, icon: 'done_all' },
        { id: 'wk-active', label: 'Active Handlers', value: '6 operators', helperText: 'Roster coverage', trend: { value: 'Stable', isPositive: true }, icon: 'support_agent' },
      ],
      workloadTrend: [
        { label: 'Week 1', primary: 140, secondary: 135 },
        { label: 'Week 2', primary: 155, secondary: 150 },
        { label: 'Week 3', primary: 165, secondary: 160 },
        { label: 'Week 4', primary: 160, secondary: 153 },
      ],
      byTaskType: [
        { id: 'tour-mod', name: 'Tour Moderation (UC-60/61)', value: 248, formattedValue: '248 tasks', percentage: 40, secondaryLabel: '40% of total' },
        { id: 'op-kyc', name: 'Tour Operator Applications', value: 165, formattedValue: '165 tasks', percentage: 27, secondaryLabel: '27% of total' },
        { id: 'poi-ops', name: 'POI Operations (UC-52)', value: 125, formattedValue: '125 tasks', percentage: 20, secondaryLabel: '20% of total' },
        { id: 'payout-rev', name: 'Payout Review (UC-64)', value: 82, formattedValue: '82 tasks', percentage: 13, secondaryLabel: '13% of total' },
      ],
    },
    '90D': {
      kpis: [
        { id: 'wk-rcv', label: 'Tasks Received', value: '1.820 tasks', helperText: 'Quarterly queue total', trend: { value: '+22.4%', isPositive: true }, icon: 'inbox' },
        { id: 'wk-done', label: 'Tasks Completed', value: '1.760 tasks', helperText: 'Finished workload', trend: { value: '+23.1%', isPositive: true }, icon: 'task_alt' },
        { id: 'wk-clr', label: 'Clearance Ratio', value: '96.7%', helperText: 'Quarterly efficiency', trend: { value: '+0.8%', isPositive: true }, icon: 'done_all' },
        { id: 'wk-active', label: 'Active Handlers', value: '6 operators', helperText: 'Standard shift', trend: { value: 'Steady', isPositive: true }, icon: 'support_agent' },
      ],
      workloadTrend: [
        { label: 'August', primary: 540, secondary: 520 },
        { label: 'September', primary: 620, secondary: 605 },
        { label: 'October', primary: 660, secondary: 635 },
      ],
      byTaskType: [
        { id: 'tour-mod', name: 'Tour Moderation (UC-60/61)', value: 728, formattedValue: '728 tasks', percentage: 40, secondaryLabel: '40% of total' },
        { id: 'op-kyc', name: 'Tour Operator Applications', value: 490, formattedValue: '490 tasks', percentage: 27, secondaryLabel: '27% of total' },
        { id: 'poi-ops', name: 'POI Operations (UC-52)', value: 364, formattedValue: '364 tasks', percentage: 20, secondaryLabel: '20% of total' },
        { id: 'payout-rev', name: 'Payout Review (UC-64)', value: 238, formattedValue: '238 tasks', percentage: 13, secondaryLabel: '13% of total' },
      ],
    },
  },
  queues: {
    '7D': {
      kpis: [
        { id: 'qu-pend', label: 'Current Backlog', value: '18 items', helperText: 'Awaiting triage', trend: { value: '-3 items', isPositive: true }, icon: 'pending_actions' },
        { id: 'qu-prog', label: 'In Progress', value: '12 items', helperText: 'Under staff inspection', trend: { value: 'Active', isPositive: true }, icon: 'hourglass_top' },
        { id: 'qu-res', label: 'Same-Day Resolution', value: '86.4%', helperText: 'Processed within 24h', trend: { value: '+2.1%', isPositive: true }, icon: 'speed' },
        { id: 'qu-age', label: 'Oldest Item Age', value: '14.2 hours', helperText: 'No critical bottlenecks', trend: { value: 'Under SLA', isPositive: true }, icon: 'timer' },
      ],
      queueStatus: [
        { id: 'pending', label: 'Pending', value: 18, percentage: 13, color: '#C88A36' },
        { id: 'in_progress', label: 'In Progress', value: 12, percentage: 9, color: '#758B74' },
        { id: 'completed', label: 'Completed', value: 100, percentage: 73, color: '#245747' },
        { id: 'rejected', label: 'Rejected', value: 6, percentage: 5, color: '#B87558' },
      ],
      queueVolumeTrend: [
        {
          label: 'Sun',
          segments: [
            { id: 'proc', label: 'Processed', value: 15, color: '#245747' },
            { id: 'pend', label: 'Pending', value: 3, color: '#C88A36' },
          ],
        },
        {
          label: 'Mon',
          segments: [
            { id: 'proc', label: 'Processed', value: 21, color: '#245747' },
            { id: 'pend', label: 'Pending', value: 4, color: '#C88A36' },
          ],
        },
        {
          label: 'Tue',
          segments: [
            { id: 'proc', label: 'Processed', value: 25, color: '#245747' },
            { id: 'pend', label: 'Pending', value: 5, color: '#C88A36' },
          ],
        },
        {
          label: 'Wed',
          segments: [
            { id: 'proc', label: 'Processed', value: 21, color: '#245747' },
            { id: 'pend', label: 'Pending', value: 4, color: '#C88A36' },
          ],
        },
        {
          label: 'Thu',
          segments: [
            { id: 'proc', label: 'Processed', value: 27, color: '#245747' },
            { id: 'pend', label: 'Pending', value: 5, color: '#C88A36' },
          ],
        },
        {
          label: 'Fri',
          segments: [
            { id: 'proc', label: 'Processed', value: 30, color: '#245747' },
            { id: 'pend', label: 'Pending', value: 6, color: '#C88A36' },
          ],
        },
        {
          label: 'Sat',
          segments: [
            { id: 'proc', label: 'Processed', value: 23, color: '#245747' },
            { id: 'pend', label: 'Pending', value: 4, color: '#C88A36' },
          ],
        },
      ],
    },
    '30D': {
      kpis: [
        { id: 'qu-pend', label: 'Current Backlog', value: '18 items', helperText: 'Current snapshot', trend: { value: '-5 items', isPositive: true }, icon: 'pending_actions' },
        { id: 'qu-prog', label: 'In Progress', value: '12 items', helperText: 'Being audited', trend: { value: 'Stable', isPositive: true }, icon: 'hourglass_top' },
        { id: 'qu-res', label: 'Same-Day Resolution', value: '87.8%', helperText: 'Monthly turnaround', trend: { value: '+3.4%', isPositive: true }, icon: 'speed' },
        { id: 'qu-age', label: 'Oldest Item Age', value: '14.2 hours', helperText: 'Within threshold', trend: { value: 'Clean queue', isPositive: true }, icon: 'timer' },
      ],
      queueStatus: [
        { id: 'pending', label: 'Pending', value: 75, percentage: 12, color: '#C88A36' },
        { id: 'in_progress', label: 'In Progress', value: 52, percentage: 8, color: '#758B74' },
        { id: 'completed', label: 'Completed', value: 465, percentage: 75, color: '#245747' },
        { id: 'rejected', label: 'Rejected', value: 28, percentage: 5, color: '#B87558' },
      ],
      queueVolumeTrend: [
        {
          label: 'Week 1',
          segments: [
            { id: 'proc', label: 'Processed', value: 135, color: '#245747' },
            { id: 'pend', label: 'Pending', value: 20, color: '#C88A36' },
          ],
        },
        {
          label: 'Week 2',
          segments: [
            { id: 'proc', label: 'Processed', value: 150, color: '#245747' },
            { id: 'pend', label: 'Pending', value: 22, color: '#C88A36' },
          ],
        },
        {
          label: 'Week 3',
          segments: [
            { id: 'proc', label: 'Processed', value: 160, color: '#245747' },
            { id: 'pend', label: 'Pending', value: 18, color: '#C88A36' },
          ],
        },
        {
          label: 'Week 4',
          segments: [
            { id: 'proc', label: 'Processed', value: 153, color: '#245747' },
            { id: 'pend', label: 'Pending', value: 15, color: '#C88A36' },
          ],
        },
      ],
    },
    '90D': {
      kpis: [
        { id: 'qu-pend', label: 'Current Backlog', value: '18 items', helperText: 'Stable backlog', trend: { value: 'Normal', isPositive: true }, icon: 'pending_actions' },
        { id: 'qu-prog', label: 'In Progress', value: '12 items', helperText: 'Under evaluation', trend: { value: 'Controlled', isPositive: true }, icon: 'hourglass_top' },
        { id: 'qu-res', label: 'Same-Day Resolution', value: '88.5%', helperText: '90D average rate', trend: { value: '+4.0%', isPositive: true }, icon: 'speed' },
        { id: 'qu-age', label: 'Oldest Item Age', value: '14.2 hours', helperText: 'Zero stale queues', trend: { value: 'Safe', isPositive: true }, icon: 'timer' },
      ],
      queueStatus: [
        { id: 'pending', label: 'Pending', value: 220, percentage: 12, color: '#C88A36' },
        { id: 'in_progress', label: 'In Progress', value: 145, percentage: 8, color: '#758B74' },
        { id: 'completed', label: 'Completed', value: 1365, percentage: 75, color: '#245747' },
        { id: 'rejected', label: 'Rejected', value: 90, percentage: 5, color: '#B87558' },
      ],
      queueVolumeTrend: [
        {
          label: 'August',
          segments: [
            { id: 'proc', label: 'Processed', value: 520, color: '#245747' },
            { id: 'pend', label: 'Pending', value: 65, color: '#C88A36' },
          ],
        },
        {
          label: 'September',
          segments: [
            { id: 'proc', label: 'Processed', value: 605, color: '#245747' },
            { id: 'pend', label: 'Pending', value: 58, color: '#C88A36' },
          ],
        },
        {
          label: 'October',
          segments: [
            { id: 'proc', label: 'Processed', value: 635, color: '#245747' },
            { id: 'pend', label: 'Pending', value: 52, color: '#C88A36' },
          ],
        },
      ],
    },
  },
  performance: {
    '7D': {
      kpis: [
        { id: 'pf-avg', label: 'Average Resolution Time', value: '2.8 hours', helperText: 'Across all task queues', trend: { value: '-12 min', isPositive: true }, icon: 'schedule' },
        { id: 'pf-fast', label: 'Fastest Review Category', value: 'POI Coordinate Review', helperText: '1.4 hours average', trend: { value: 'Optimal', isPositive: true }, icon: 'bolt' },
        { id: 'pf-eff', label: 'Resolution Rate', value: '95.8%', helperText: 'Completed / Intake', trend: { value: '+1.5%', isPositive: true }, icon: 'insights' },
        { id: 'pf-cons', label: 'Process Consistency', value: '98.2%', helperText: 'Checklist compliance', trend: { value: 'High', isPositive: true }, icon: 'verified' },
      ],
      completionTrend: [
        { date: '2026-10-18', label: 'Sun', primaryValue: 15 },
        { date: '2026-10-19', label: 'Mon', primaryValue: 21 },
        { date: '2026-10-20', label: 'Tue', primaryValue: 25 },
        { date: '2026-10-21', label: 'Wed', primaryValue: 21 },
        { date: '2026-10-22', label: 'Thu', primaryValue: 27 },
        { date: '2026-10-23', label: 'Fri', primaryValue: 30 },
        { date: '2026-10-24', label: 'Sat', primaryValue: 23 },
      ],
      processingDuration: [
        { id: 'poi', name: 'POI Operations & Spatial Validation', value: 1.4, formattedValue: '1.4h avg', percentage: 22, secondaryLabel: 'Fastest turnaround' },
        { id: 'payout', name: 'Tour Payout Record Audit', value: 2.1, formattedValue: '2.1h avg', percentage: 33, secondaryLabel: 'Ledger matching' },
        { id: 'tour', name: 'Tour Package Moderation (UC-60/61)', value: 3.2, formattedValue: '3.2h avg', percentage: 50, secondaryLabel: 'Full itinerary check' },
        { id: 'kyc', name: 'Operator Legal & KYC Verification', value: 5.4, formattedValue: '5.4h avg', percentage: 85, secondaryLabel: 'Document verification' },
      ],
    },
    '30D': {
      kpis: [
        { id: 'pf-avg', label: 'Average Resolution Time', value: '2.9 hours', helperText: 'Monthly queue average', trend: { value: '-18 min', isPositive: true }, icon: 'schedule' },
        { id: 'pf-fast', label: 'Fastest Review Category', value: 'POI Coordinate Review', helperText: '1.5 hours average', trend: { value: 'Stable', isPositive: true }, icon: 'bolt' },
        { id: 'pf-eff', label: 'Resolution Rate', value: '96.5%', helperText: 'Monthly task resolution', trend: { value: '+2.1%', isPositive: true }, icon: 'insights' },
        { id: 'pf-cons', label: 'Process Consistency', value: '98.5%', helperText: 'Standardized audits', trend: { value: 'High', isPositive: true }, icon: 'verified' },
      ],
      completionTrend: [
        { date: '2026-09-25', label: 'Week 1', primaryValue: 135 },
        { date: '2026-10-02', label: 'Week 2', primaryValue: 150 },
        { date: '2026-10-09', label: 'Week 3', primaryValue: 160 },
        { date: '2026-10-16', label: 'Week 4', primaryValue: 153 },
      ],
      processingDuration: [
        { id: 'poi', name: 'POI Operations & Spatial Validation', value: 1.5, formattedValue: '1.5h avg', percentage: 23, secondaryLabel: 'Prompt validation' },
        { id: 'payout', name: 'Tour Payout Record Audit', value: 2.2, formattedValue: '2.2h avg', percentage: 34, secondaryLabel: 'Payment matching' },
        { id: 'tour', name: 'Tour Package Moderation (UC-60/61)', value: 3.4, formattedValue: '3.4h avg', percentage: 53, secondaryLabel: 'Schedule & policy' },
        { id: 'kyc', name: 'Operator Legal & KYC Verification', value: 5.6, formattedValue: '5.6h avg', percentage: 88, secondaryLabel: 'Multi-doc audit' },
      ],
    },
    '90D': {
      kpis: [
        { id: 'pf-avg', label: 'Average Resolution Time', value: '3.0 hours', helperText: 'Quarterly queue average', trend: { value: '-25 min', isPositive: true }, icon: 'schedule' },
        { id: 'pf-fast', label: 'Fastest Review Category', value: 'POI Coordinate Review', helperText: '1.6 hours average', trend: { value: 'Reliable', isPositive: true }, icon: 'bolt' },
        { id: 'pf-eff', label: 'Resolution Rate', value: '96.7%', helperText: 'Quarterly resolution', trend: { value: '+2.4%', isPositive: true }, icon: 'insights' },
        { id: 'pf-cons', label: 'Process Consistency', value: '98.4%', helperText: 'Quality consistency', trend: { value: 'High', isPositive: true }, icon: 'verified' },
      ],
      completionTrend: [
        { date: '2026-08', label: 'August', primaryValue: 520 },
        { date: '2026-09', label: 'September', primaryValue: 605 },
        { date: '2026-10', label: 'October', primaryValue: 635 },
      ],
      processingDuration: [
        { id: 'poi', name: 'POI Operations & Spatial Validation', value: 1.6, formattedValue: '1.6h avg', percentage: 25, secondaryLabel: 'Map coordinates' },
        { id: 'payout', name: 'Tour Payout Record Audit', value: 2.3, formattedValue: '2.3h avg', percentage: 35, secondaryLabel: 'Ledger checks' },
        { id: 'tour', name: 'Tour Package Moderation (UC-60/61)', value: 3.5, formattedValue: '3.5h avg', percentage: 55, secondaryLabel: 'Detailed check' },
        { id: 'kyc', name: 'Operator Legal & KYC Verification', value: 5.8, formattedValue: '5.8h avg', percentage: 90, secondaryLabel: 'Business license' },
      ],
    },
  },
};

export const ADMIN_ANALYTICS_DATA = {
  ...ADMIN_FULL_ANALYTICS,
  revenueTrend: {
    '7D': ADMIN_FULL_ANALYTICS.revenue['7D'].trend,
    '30D': ADMIN_FULL_ANALYTICS.revenue['30D'].trend,
    '90D': ADMIN_FULL_ANALYTICS.revenue['90D'].trend,
  },
  bookingDistribution: ADMIN_FULL_ANALYTICS.bookings['30D'].statusDistribution,
  categoryBreakdown: ADMIN_FULL_ANALYTICS.services['30D'].byCategory,
  activityComparison: ADMIN_FULL_ANALYTICS.services['7D'].trendComparison,
};

export const STAFF_ANALYTICS_DATA = {
  ...STAFF_FULL_ANALYTICS,
  workloadTrend: {
    '7D': STAFF_FULL_ANALYTICS.performance['7D'].completionTrend,
    '30D': STAFF_FULL_ANALYTICS.performance['30D'].completionTrend,
    '90D': STAFF_FULL_ANALYTICS.performance['90D'].completionTrend,
  },
  queueDistribution: STAFF_FULL_ANALYTICS.queues['30D'].queueStatus,
  taskTypeBreakdown: STAFF_FULL_ANALYTICS.workload['30D'].byTaskType,
  slaPerformance: STAFF_FULL_ANALYTICS.performance['7D'].completionTrend,
};
