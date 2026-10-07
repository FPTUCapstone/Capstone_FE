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
  statusLabels: {
    available: 'Available',
    pendingIntegration: 'Pending integration',
    pendingSpecification: 'Pending specification',
  } satisfies Record<AdminModuleStatus, string>,
  modules: [
    {
      id: 'system-configuration',
      title: 'System Configuration',
      category: 'Algorithm parameters',
      description:
        'Review and update the exposed itinerary algorithm parameters within their allowed ranges.',
      icon: 'tune',
      status: 'available',
      href: ROUTES.admin.algorithmParameters,
      actionLabel: 'Open configuration',
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
      status: 'pendingIntegration',
      availabilityNote: 'This module is not available in this workspace build yet.',
    },
    {
      id: 'payout-settlement',
      title: 'Payout Settlement',
      category: 'Financial operations',
      description:
        'Confirm the final settlement of eligible Tour Operator payout records after their review.',
      icon: 'account_balance',
      status: 'pendingIntegration',
      availabilityNote: 'Awaiting the payout settlement service.',
    },
    {
      id: 'platform-revenue',
      title: 'Platform Revenue',
      category: 'Financial reporting',
      description:
        'View and export platform-wide revenue information. This module is separate from Statistical Reports.',
      icon: 'payments',
      status: 'pendingSpecification',
      availabilityNote: 'Awaiting a confirmed functional specification.',
    },
    {
      id: 'create-staff-account',
      title: 'Create Staff Account',
      category: 'Internal accounts',
      description: 'Create internal Staff accounts for the administration workspace.',
      icon: 'person_add',
      status: 'pendingSpecification',
      availabilityNote: 'Awaiting a confirmed functional specification.',
    },
  ] satisfies readonly AdminDashboardModule[],
} as const;
