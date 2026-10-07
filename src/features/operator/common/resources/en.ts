/**
 * Common English resource strings for Tour Operator workspace.
 * Follows Report 3 SRS V2 CR-09 (English UI & resource file requirement).
 */
export const operatorCommonEn = {
  navigation: {
    dashboard: 'Dashboard',
    tours: 'Tours',
    coupons: 'Coupons',
    bookings: 'Bookings',
    revenue: 'Revenue',
    payouts: 'Payouts',
    profile: 'Business Profile',
    settings: 'Account Settings',
    comingSoon: 'Coming Soon',
    operationsSection: 'Operations Management',
    accountSection: 'Partner Account',
    servicesSection: 'Services & Operations',
    defaultOperatorTitle: 'Tour Operator',
    verifiedPartnerBadge: 'Verified Partner',
    featureInDevelopment: 'This feature is currently in development',
    workspaceNavAria: 'Partner workspace navigation',
    openMenuAria: 'Open navigation menu',
    closeMenuAria: 'Close navigation menu',
    demoBadge: 'Demo',
  },
  accessibility: {
    closeDialog: 'Close dialog',
  },
} as const;

export type OperatorCommonResources = typeof operatorCommonEn;
