/**
 * Centralized English user-facing copy for Traveler Trip History (UC-32)
 * and Trip Review (UC-33) BFF capability notices and API error states (CR-09).
 */
export const tripReviewEn = {
  bff: {
    badRequestTitle: 'Bad Request',
    notImplementedTitle: 'Not Implemented',
    invalidTripIdDetail: 'Invalid trip identifier.',
    tripHistoryPendingDetail:
      'Trip history service is pending backend integration.',
    tripReviewPendingDetail:
      'Trip review submission is pending backend API integration. Reviews cannot be saved to production yet.',
  },
  errors: {
    systemError:
      'TripMate is temporarily unable to process your request. Please check your connection and try again.',
    tripNotFound: 'The requested trip could not be found.',
    tripByIdNotFound: (tripId: string) =>
      `Trip #${tripId} could not be found.`,
    reviewTripNotFound: 'The trip to review could not be found.',
    tripHistoryAccessDenied:
      'You do not have permission to access this trip history.',
    tripDetailAccessDenied:
      'You do not have permission to view this trip.',
    reviewAccessDenied:
      'You do not have permission to review this trip.',
  },
  reviewPage: {
    pendingTitle: 'Trip review service is pending backend integration',
    pendingDetail:
      'Trip history and review services are pending backend integration.',
    notFoundTitle: 'Trip not found',
    forbiddenTitle: 'Access denied',
    networkErrorTitle: 'Server connection error',
  },
} as const;
