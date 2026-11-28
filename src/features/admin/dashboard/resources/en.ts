import { ROUTES } from '@/lib/routes';

export type AdminModuleStatus = 'available' | 'pendingIntegration' | 'pendingSpecification';

export interface AdminDashboardModule {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly description: string;
  readonly icon: string;
  readonly status: AdminModuleStatus;
  readonly href?: string;
  readonly actionLabel?: string;
  readonly availabilityNote?: string;
}

/**
 * Administrator overview copy (CR-09: English, resource-backed).
 *
 * Only modules whose route exists on this branch carry an href. Modules delivered in
 * other open branches or still lacking a detailed specification render a truthful
 * pending state instead of a link or a synthetic metric.
 */
export const adminDashboardEn = {
  metadataTitle: 'Administration Overview',
  eyebrow: 'Administrator workspace',
  title: 'Administration Overview',
  subtitle:
    'Open the governance modules available to Administrators. Modules that are not connected yet are listed with their current status.',
  readinessTitle: 'No sample metrics are displayed',
  readinessBody:
    'This overview shows live links only where a module is available. Platform indicators will appear after the reporting services are connected.',
  modulesHeading: 'Administration modules',
  openModuleLabel: 'Open module',
  tabs: {
    overview: 'Overview',
    analytics: 'Analytics',
  },
  analyticsBadge: 'New',
  previewAnalyticsShow: 'Show platform analytics preview',
  previewAnalyticsHide: 'Hide platform analytics preview',
  statusLabels: {
    available: 'Available',
    pendingIntegration: 'Pending integration',
    pendingSpecification: 'Pending specification',
  } satisfies Record<AdminModuleStatus, string>,
  modules: [
    {
      id: 'user-governance',
      title: 'User Governance',
      category: 'Internal accounts',
      description:
        'Review user accounts and manage access to the platform.',
      icon: 'manage_accounts',
      status: 'available',
      href: ROUTES.admin.users,
      actionLabel: 'Open user governance',
    },
    {
      id: 'audit-logs',
      title: 'Audit Logs',
      category: 'Security and compliance',
      description:
        'Search recorded administrative and system events and inspect the details of a selected entry.',
      icon: 'manage_search',
      status: 'available',
      href: ROUTES.admin.auditLogs,
      actionLabel: 'Open audit logs',
    },
    {
      id: 'statistical-reports',
      title: 'Statistical Reports',
      category: 'Reporting',
      description: 'Generate and export platform-level statistical reports.',
      icon: 'insights',
      status: 'available',
      href: ROUTES.admin.reports,
      actionLabel: 'Open statistical reports',
    },
    {
      id: 'refund-reconciliation',
      title: 'Refund Reconciliation',
      category: 'Financial operations',
      description:
        'Review refund obligations and reconcile confirmed return transfers.',
      icon: 'payments',
      status: 'available',
      href: ROUTES.admin.refundReconciliation,
      actionLabel: 'Open refund reconciliation',
    },
    {
      id: 'poi-master-data',
      title: 'POI Master Data',
      category: 'Catalog and moderation',
      description: 'Manage the points of interest used across the platform.',
      icon: 'location_on',
      status: 'available',
      href: ROUTES.admin.pois,
      actionLabel: 'Open POI master data',
    },
  ] satisfies readonly AdminDashboardModule[],
} as const;
