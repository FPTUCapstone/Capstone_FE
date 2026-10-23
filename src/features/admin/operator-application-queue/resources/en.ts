/**
 * Pending Tour Operator applications copy (CR-09: English, resource-backed).
 *
 * The reviewing actor is Staff per the latest team decision, while the SRS detailed sections
 * still say Administrator, so labels refer to the neutral "reviewer".
 */
export const operatorApplicationQueueEn = {
  metadata: {
    title: 'Pending Operator Applications',
  },
  demoBanner: {
    label: 'Demo mode',
    body: 'Sample applications are shown for interface review only. Detail links open the real service, so a sample application will not be found there.',
  },
  pendingIntegration: {
    title: 'The application list is not connected yet',
    body: 'The service that lists pending Tour Operator applications is not available in this environment, so no applications can be loaded here.',
  },
  queue: {
    eyebrow: 'Tour Operator approval',
    title: 'Pending Operator Applications',
    subtitle: 'Tour Operator applications awaiting verification and a review decision.',
    searchLabel: 'Search pending applications',
    searchPlaceholder: 'Company, tax code or licence number',
    searchButton: 'Search',
    resetButton: 'Reset',
    listLabel: 'Pending operator applications',
    columns: {
      company: 'Company',
      taxCode: 'Tax code',
      licence: 'Licence number',
      submitted: 'Submitted',
      action: 'Status and action',
    },
    pendingStatus: 'Pending review',
    reviewApplication: 'Review application',
    reviewApplicationFor: (companyName: string) => `Review the application of ${companyName}`,
    /** MSG128: the SRS empty-result message for every list without a domain-specific one (CR-02). */
    emptyTitle: 'No records found matching your criteria.',
    emptyBody: 'Adjust the search and submit again, or reset the search.',
    totalCount: (count: number) => (count === 1 ? '1 pending application' : `${count} pending applications`),
  },
  pagination: {
    label: 'Pending operator applications pages',
    previous: 'Previous page',
    next: 'Next page',
    pageOf: (page: number, totalPages: number) => `Page ${page} of ${totalPages}`,
  },
  format: {
    unavailable: 'Not available',
  },
} as const;
