export const adminStaffEn = {
  login: {
    backLabel: 'Return to TripMate',
    eyebrow: 'TripMate Administration',
    title: 'Administration Sign In',
    description:
      'Authenticate with an authorized Administrator or Staff account to access the administration workspace.',
    emailLabel: 'Email Address',
    emailPlaceholder: 'staff@tripmate.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    forgotPassword: 'Forgot Password',
    submitButton: 'Sign In',
    footerNote:
      'Sign in with an active Administrator or Staff account. You will be asked to sign in again when your session expires.',
    invalidEmailError: 'Enter a valid email address.',
    requiredFieldError: 'This field is required.',
    unavailableError: 'Sign in is temporarily unavailable. Please try again.',
    connectionError: 'Unable to connect. Please check your connection and try again.',
    logoutError: 'Unable to sign out of the administration workspace. Please try again.',
  },
  navigation: {
    brandAriaLabel: 'TripMate Administration Workspace',
    navAriaLabel: 'Administration navigation',
    adminDashboard: 'System Overview',
    staffDashboard: 'Staff Workspace',
    tourReviews: 'Tour Reviews',
    createPoi: 'POI Catalog',
    algorithmSettings: 'Algorithm Settings',
    auditLogs: 'Audit Logs',
    securityLabel: 'Security',
    securityTitle: 'Change administration account password',
    roleBadgeAdmin: 'Administrator',
    roleBadgeStaff: 'Staff',
  },
  accessDenied: {
    eyebrow: 'Restricted Administration Module',
    title: 'Administrator Access Required',
    description:
      'Your Staff account does not have permission to view this system governance module. Please return to the Staff Operations Dashboard to continue your work.',
    returnToStaffButton: 'Return to Staff Workspace',
    returnToAdminSignInButton: 'Switch Administration Account',
  },
  staffDashboard: {
    eyebrow: 'Operational Administration Workspace',
    title: 'Staff Operations Dashboard',
    subtitle:
      'Coordinate partner verification, tour moderation, catalog maintenance, and traveler operational support across the TripMate platform.',
    roleBadge: 'Staff Actor',
    securityActionLabel: 'Account Security',
    readinessBannerTitle: 'Operational Workspace Readiness',
    readinessBannerBody:
      'Modules below reflect canonical TripMate operational workflows. Live queues are linked directly where available; modules awaiting backend contracts or specification alignment remain safely disabled without synthetic metrics.',
    availableSectionTitle: 'Active Operational Modules',
    availableSectionSubtitle:
      'Modules currently connected in the web administration console.',
    pendingSectionTitle: 'Scheduled & Pending Operational Modules',
    pendingSectionSubtitle:
      'Modules awaiting backend API endpoints or specification alignment before interactive rollout.',
    analyticsNoticeTitle: 'Operational Analytics Overview',
    analyticsNoticeStatus: 'Pending Specification Alignment',
    analyticsNoticeBody:
      'Operational throughput charts and moderation turnaround summaries will be enabled once reporting aggregation endpoints are finalized. No synthetic chart figures are displayed.',
    openModuleLabel: 'Open Workspace',
    unavailableModuleLabel: 'Module Unavailable',
    statusBadges: {
      available: 'Available in Console',
      pendingBackend: 'Pending Backend Contract',
      scheduledBatch: 'Scheduled in Upcoming Batch',
    },
    modules: [
      {
        id: 'account-security',
        title: 'Administration Account Security',
        category: 'Account Governance',
        description:
          'Manage your Staff administration credentials and review password security requirements.',
        status: 'available' as const,
        href: '/admin/account/security',
        actionLabel: 'Open Security Settings',
      },
      {
        id: 'tour-package-moderation',
        title: 'Tour Package Moderation',
        category: 'Content & Partner Quality',
        description:
          'Review submitted operator tour packages, inspect itinerary schedules, and record approval or rejection decisions.',
        status: 'pendingBackend' as const,
        availabilityNote:
          'Assigned to Staff in Report 3 V2 (UC-50 / UC-51); awaiting Backend tour moderation endpoints (/api/v1/admin/tours/pending and review decision actions).',
      },
      {
        id: 'operator-application-review',
        title: 'Operator Application Review',
        category: 'Partner Onboarding',
        description:
          'Verify Tour Operator registration documents, business credentials, and onboarding eligibility.',
        status: 'pendingBackend' as const,
        availabilityNote:
          'Assigned to Staff in Report 3 V2 (UC-48 / UC-49); awaiting Backend Tour Operator application queue endpoint and Staff role authorization policy alignment.',
      },
      {
        id: 'poi-catalog-operations',
        title: 'POI Catalog Operations',
        category: 'Catalog & Spatial Data',
        description:
          'Create and configure Points of Interest with coordinates, operating hours, and visit attributes.',
        status: 'pendingBackend' as const,
        availabilityNote:
          'Assigned to Staff in Report 3 V2 (UC-52 / UC-53); current Backend /api/v1/admin/pois endpoints remain restricted to Administrator until Staff role policy is enabled.',
      },
      {
        id: 'user-account-management',
        title: 'User Account Management',
        category: 'Account Governance',
        description:
          'Search traveler and operator accounts, inspect profile details, and manage account lock or unlock states.',
        status: 'pendingBackend' as const,
        availabilityNote: 'Awaiting user account directory and status management endpoints.',
      },
      {
        id: 'route-segment-maintenance',
        title: 'Route & Segment Maintenance',
        category: 'Catalog & Spatial Data',
        description:
          'Maintain road segments, transport durations, and spatial connectivity between Points of Interest.',
        status: 'pendingBackend' as const,
        availabilityNote: 'Awaiting route catalog management endpoints and actor scope alignment.',
      },
      {
        id: 'active-trip-monitoring',
        title: 'Active Trip Monitoring',
        category: 'Live Operations',
        description:
          'Monitor active traveler itineraries and review operational alerts across regions.',
        status: 'pendingBackend' as const,
        availabilityNote: 'Awaiting real-time active trip monitoring endpoints.',
      },
      {
        id: 'platform-booking-oversight',
        title: 'Platform Booking & Refund Operations',
        category: 'Commercial Operations',
        description:
          'Inspect platform-wide tour bookings, verify payment states, and process eligible traveler refunds.',
        status: 'pendingBackend' as const,
        availabilityNote: 'Awaiting administration booking list and refund processing endpoints.',
      },
      {
        id: 'payout-settlement-review',
        title: 'Payout Settlement Review',
        category: 'Commercial Operations',
        description:
          'Verify Tour Operator payout settlement requests and coordinate disbursement processing.',
        status: 'pendingBackend' as const,
        availabilityNote: 'Awaiting administration payout queue and settlement decision endpoints.',
      },
      {
        id: 'landing-content-management',
        title: 'Landing Content Management',
        category: 'Platform Merchandising',
        description:
          'Curate featured destinations, promotional banners, and editorial highlights for the public landing page.',
        status: 'scheduledBatch' as const,
        availabilityNote: 'Scheduled for upcoming content management workspace rollout.',
      },
    ],
  },
} as const;
