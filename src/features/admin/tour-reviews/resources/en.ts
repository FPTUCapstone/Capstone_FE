/**
 * Tour moderation copy (CR-09: English, resource-backed).
 *
 * The moderation actor is unresolved in the specification, so every label refers to the
 * neutral "reviewer". Message identifiers conflict between the detailed tour moderation
 * sections and the message appendix, so the UI renders semantic copy instead of codes.
 */
export const tourModerationEn = {
  metadata: {
    queueTitle: 'Pending Tour Posts',
    detailTitle: 'Tour Content & Pricing Details',
  },
  demoBanner: {
    label: 'Demo mode',
    body: 'Sample tour posts are shown for interface review. Decisions are simulated in this browser only and are never sent to the server.',
  },
  pendingIntegration: {
    title: 'Tour moderation is not connected yet',
    queueBody:
      'The tour moderation service is not available in this environment, so no pending tour posts can be loaded and no decisions can be recorded.',
    detailBody:
      'The tour moderation service is not available in this environment, so this tour post cannot be loaded and no decision can be recorded.',
  },
  queue: {
    eyebrow: 'Tour moderation',
    title: 'Pending Tour Posts',
    subtitle: 'Tour packages submitted by Tour Operators and awaiting a review decision.',
    searchLabel: 'Search pending tour posts',
    searchPlaceholder: 'Tour name or operator',
    searchButton: 'Search',
    resetButton: 'Reset',
    listLabel: 'Pending tour posts',
    columns: {
      tour: 'Tour',
      operator: 'Operator',
      submitted: 'Submitted',
      departure: 'Departure',
      price: 'Price',
      action: 'Status and action',
    },
    pendingStatus: 'Pending review',
    viewDetails: 'View details',
    viewDetailsFor: (tourName: string) => `View details for ${tourName}`,
    emptyTitle: 'No pending tours match the applied criteria.',
    emptyBody: 'Adjust the search and submit again, or reset the search.',
    totalCount: (count: number) => (count === 1 ? '1 pending tour post' : `${count} pending tour posts`),
  },
  pagination: {
    label: 'Pending tour posts pages',
    previous: 'Previous page',
    next: 'Next page',
    pageOf: (page: number, totalPages: number) => `Page ${page} of ${totalPages}`,
  },
  detail: {
    backToQueue: 'Back to pending tour posts',
    eyebrow: 'Tour content and pricing review',
    submittedOn: (date: string) => `Submitted ${date}`,
    operatorLabel: 'Operator',
    locationLabel: 'Location',
    notFoundTitle: 'Tour post not found',
    notFoundBody: 'This tour post is not in the pending review queue.',
    facts: {
      price: 'Price from',
      duration: 'Duration',
      capacity: 'Capacity',
      departure: 'Departure',
    },
    durationHours: (hours: number) => (hours === 1 ? '1 hour' : `${hours} hours`),
    capacityTravelers: (count: number) => `Up to ${count} travelers`,
    overviewTitle: 'Overview',
    languagesLabel: 'Languages',
    categoryLabel: 'Category',
    imagesLabel: 'Submitted images',
    includedTitle: 'Included services',
    excludedTitle: 'Excluded services',
    cancellationTitle: 'Cancellation policy',
    itineraryTitle: 'Itinerary',
    operatorCardTitle: 'Operator information',
  },
  decision: {
    title: 'Review decision',
    checklistLegend: 'Review criteria',
    checklistHint: 'Mark each criterion as passed after verifying the submitted content.',
    criteria: {
      contentCompleteness: 'Content completeness',
      imageAppropriateness: 'Image appropriateness',
      pricePlausibility: 'Price plausibility',
      policyCompliance: 'Policy compliance',
      itineraryFeasibility: 'Itinerary feasibility',
    },
    noteLabel: 'Internal reviewer note',
    noteHint: 'Optional. Visible to reviewers only.',
    approveButton: 'Approve tour post',
    rejectButton: 'Reject tour post',
    checklistIncomplete: 'Mark every review criterion as passed before approving this tour post.',
    approvedResult:
      'Tour approved in Demo mode. No changes were sent to the server and no notification was delivered.',
    rejectedResult:
      'Tour rejected in Demo mode. No changes were sent to the server and no notification was delivered.',
    recordedReasonLabel: 'Recorded reason',
  },
  approveDialog: {
    title: 'Approve this tour post?',
    description:
      'In Demo mode the approval is simulated in this browser only. Nothing is published and the operator is not notified.',
    confirm: 'Confirm approval',
    cancel: 'Cancel',
  },
  rejectDialog: {
    title: 'Reject tour post',
    description: 'Provide the reason the operator should act on before resubmitting this tour post.',
    categoryLabel: 'Reason category',
    categoryPlaceholder: 'Select a category',
    reasonLabel: 'Detailed reason / revision notes',
    reasonHint: 'Required. The operator will see this reason.',
    reasonRequired: 'This field is required.',
    confirmRejection: 'Confirm Rejection',
    cancel: 'Cancel',
    confirmTitle: 'Reject this tour post?',
    confirmDescription:
      'In Demo mode the rejection is simulated in this browser only. Nothing is stored and the operator is not notified.',
    confirmReject: 'Reject tour post',
    back: 'Go back',
  },
  format: {
    currency: (amount: string) => `${amount} VND`,
    unavailable: 'Not available',
  },
} as const;
