/**
 * Centralized English user-facing copy for Traveler Trip History (UC-32)
 * and Trip Review (UC-33) across BFF, services, pages, components, and dialogs (CR-09).
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
    tripNotFoundOrForbidden: (tripId: string) =>
      `Trip #${tripId} does not exist or you do not have permission to view this trip.`,
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

  metadata: {
    tripHistoryTitle: 'My Trips | TripMate',
    tripHistoryDescription:
      'View and manage your booked tours and self-planned itineraries on TripMate.',
    tripReviewTitle: 'Trip Review | TripMate',
    tripReviewDescription:
      'Share your trip rating and feedback on TripMate.',
  },

  demo: {
    badgeLabel: 'DEMO ONLY',
    shortBadge: 'DEMO',
    tripHistoryBannerPrefix: 'DEMO Preview:',
    tripHistoryBannerText:
      'Sample trip data is displayed for design and workflow preview.',
    tripReviewBannerPrefix: 'DEMO Preview:',
    tripReviewBannerText: (tripId: string) =>
      `Sample trip review (${tripId}).`,
    photoLocalPreviewNotice:
      'Photos are previewed locally in demo mode only and are not uploaded to the server.',
  },

  tripHistory: {
    navTabLabel: 'My Trips',
    loadingAccount: 'Loading account information…',
    breadcrumbHome: 'Home',
    breadcrumbAccount: 'My Account',
    breadcrumbTrips: 'My Trips',
    badgeCode: 'UC-32',
    badgeLabel: 'Trip Management',
    pageTitle: 'My Trips',
    pageSubtitle:
      'Review your booked tours and self-planned itineraries with TripMate.',
    tabs: {
      upcoming: 'Upcoming',
      completed: 'Completed',
      cancelled: 'Cancelled / Refunded',
    },
    summary: {
      headingBadge: 'Trip Summary',
      completedTripsCount: (count: number) => `${count} Completed Trips`,
      distanceUnit: 'km',
      distanceLabel: 'Total Distance',
      visitedPoisLabel: 'Visited Stops',
      cspMatchRateLabel: 'Route Match (Demo)',
      averageRatingLabel: 'Average Rating',
    },
    filters: {
      searchPlaceholder:
        'Search by tour name, destination, booking code...',
      allTypes: 'All Trip Types',
      tourBooking: 'Booked Tours',
      selfPlannedItinerary: 'Self-Planned Itineraries',
    },
    pending: {
      title: 'Trip History Service',
    },
    error: {
      title: 'Unable to Load Data',
    },
    empty: {
      title: 'No trips found',
      description: 'No trips match your current filter criteria.',
    },
    showingPrefix: 'Showing',
    showingSeparator: '/',
    showingSuffix: 'trips',
    timezoneNotice: 'Times shown in GMT+7 (Asia/Ho_Chi_Minh)',
    card: {
      departureDate: (formattedDate: string) =>
        `Departure: ${formattedDate}`,
      stopsCount: (count: number) => `${count} Stops`,
      distanceTravelled: (km: number) => ` • ${km} km traveled`,
      visitedLabel: 'Visited: ',
      travelledWithMembers: (count: number) =>
        `Traveled with ${count} members`,
      weatherReroutedBadge: 'Weather reroute accepted',
      defaultOperatorName: 'Tour Operator',
      bookingCode: (code: string) => `Code: ${code}`,
      paidVia: (method: string) => `Paid via ${method}`,
      participants: (summary: string) => `Participants: ${summary}`,
      refundStatus: (status: string) => `Refund: ${status}`,
      refundAmountLine: (amount: string, channel: string) =>
        `Refund amount: ${amount} (${channel})`,
      defaultRefundChannel: 'Original payment method',
    },
  },

  tripReview: {
    loadingTrip: 'Loading trip information…',
    breadcrumbHome: 'Home',
    breadcrumbTrips: 'My Trips',
    breadcrumbReview: 'Trip Review',
    badgeCode: 'UC-33',
    badgeLabel: 'Reviews & Feedback',
    pageTitle: 'Trip Review',
    pageSubtitle:
      'Your feedback helps the TripMate traveler community enjoy better journeys.',
    notCompletedTitle: 'Trip not yet completed',
    notCompletedDetail:
      'You can only submit reviews for completed trips.',
    alreadyReviewedTitle: 'This trip has already been reviewed',
    alreadyReviewedDetail: (rating?: number) =>
      rating
        ? `You have already submitted a review for this trip (${rating} stars).`
        : 'You have already submitted a review for this trip.',
    completedOn: (formattedDate: string) => `Completed on ${formattedDate}`,
    stopsCount: (count: number) => `${count} Stops`,
    distanceTravelled: (km: number) => `${km} km traveled`,
    selfPlannedFallback: 'Self-Planned Itinerary',
    defaultTourTypeLabel: 'Local Tour',
    bookedTourSummary: (operatorName: string, bookingRef: string) =>
      `${operatorName} • Booking code: ${bookingRef}`,
    submittedTitle: 'Review submitted!',
    demoSubmitSuccess:
      'Thank you for your feedback! Your review has been published (DEMO Preview).',
    submitSuccess:
      'Thank you for your feedback! Your review has been published.',
    pendingSaveTitle: 'Review saving service pending activation',
    pendingSaveHint:
      'The review interface and validation rules (length, star rating, photos) are active and ready.',
    ratingSectionTitle: 'Overall Trip Experience',
    ratingSectionSubtitle:
      'Click or use arrow keys to rate your satisfaction (1 to 5 stars)',
    ratingLabels: {
      1: 'Dissatisfied! 1/5 stars',
      2: 'Needs improvement! 2/5 stars',
      3: 'Satisfied! 3/5 stars',
      4: 'Very good! 4/5 stars',
      5: 'Excellent! 5/5 stars',
    } as Record<number, string>,
    noStarSelected: 'No rating selected',
    titleLabel: 'Review Title',
    characterCount: (current: number, max: number) =>
      `${current} / ${max} characters`,
    titlePlaceholder:
      'Briefly summarize your experience (e.g., Wonderful trip)',
    pacingSectionTitle: 'Schedule Pacing & Stop Allocation',
    pacingSectionSubtitle:
      'Rate the travel pace and adaptability of the itinerary (Optional)',
    pacingOptions: {
      tight: 'Too Packed',
      well_paced: 'Well-Paced',
      loose: 'Too Relaxed',
    },
    poiFeedbackTitle: 'Quick Feedback on Visited Stops',
    poiFeedbackSubtitle:
      'Would you recommend these stops to future travelers? (Optional)',
    optionalBadge: 'Optional',
    poiStopSubtitle: 'Itinerary stop',
    commentLabel: 'Detailed Review',
    commentPlaceholder:
      'Share your detailed thoughts about the trip, tour guide, food, transportation... (Maximum 500 characters)',
    commentExceeded: (extra: number) =>
      `Exceeded by ${extra} allowed characters.`,
    commentMaxHint: 'Maximum 500 characters.',
    photosSectionTitle: 'Trip Photos',
    photosPendingNotice:
      'Review photo attachment is pending server storage activation and is temporarily unavailable in production mode.',
    photosOptionalTitle: 'Trip Photos (Optional)',
    photosCountBadge: (count: number, max: number) =>
      `${count}/${max} photos`,
    photosHelperText:
      'Attach memorable moments from your trip (Up to 5 photos, under 5MB each).',
    photoUnder5Mb: '(Under 5MB)',
    privacyTitle: 'Display with my full name',
    privacyPublicHint:
      'Your review will be displayed publicly with your account name.',
    privacyInitialsHint:
      'Your review will be displayed publicly with initials (e.g., N.V.A.) to protect your privacy.',
  },

  validation: {
    invalidDateRange:
      'Invalid date range. The start date must be on or before the end date.',
    ratingRequired:
      'Please select a star rating (1 to 5 stars) before submitting.',
    titleRequired: 'Review title is required.',
    titleMaxLength: 'Review title must not exceed 150 characters.',
    commentRequired: 'Review content is required.',
    commentMaxLength: 'Review content must not exceed 500 characters.',
    photosMaxCount: (max: number) => `You can attach up to ${max} photos.`,
    photosInvalidType: 'Photos must be in JPG, PNG, or WEBP format.',
    photosMaxSize: (fileName: string) =>
      `Photo "${fileName}" exceeds the 5MB maximum size limit.`,
  },

  actions: {
    search: 'Search',
    retryConnection: 'Retry Connection',
    planNewItinerary: 'Plan New Itinerary',
    retry: 'Try Again',
    planSmartItinerary: 'Plan Smart Itinerary',
    exploreLocalTours: 'Explore Local Tours',
    close: 'Close',
    viewItinerary: 'View Itinerary',
    viewETicket: 'View E-Ticket',
    writeReview: 'Write Review',
    viewReview: 'View Review',
    bookAgain: 'Book Again',
    refundDetails: 'Refund Details',
    backToTrips: 'Back to My Trips',
    cancelLater: 'Cancel / Later',
    submittingReview: 'Submitting review…',
    submitReview: 'Submit Review',
    addPhoto: '+ Add Photo',
    like: 'Like',
  },

  accessibility: {
    breadcrumbAria: 'Breadcrumb',
    tripSummaryAria: 'Trip summary statistics',
    searchTripsLabel: 'Search trips',
    searchButtonAria: 'Search',
    tripTypeFilterLabel: 'Trip type',
    fromDateAria: 'From date',
    toDateAria: 'To date',
    loadingTripsAria: 'Loading trip list',
    paginationNavAria: 'Trip list pagination',
    previousPageAria: 'Previous page',
    nextPageAria: 'Next page',
    closeDialogAria: 'Close',
    starRatingGroupAria: 'Experience star rating',
    starRadioAria: (star: number) => `${star} ${star === 1 ? 'star' : 'stars'}`,
    uploadPhotosAria: 'Upload trip photos',
    tripPhotoAlt: (index: number) => `Trip photo ${index}`,
    removePhotoAria: (fileName: string) => `Remove photo ${fileName}`,
    addPhotoAria: 'Add trip photo',
    likeStopAria: (stop: string) => `Like ${stop}`,
    dislikeStopAria: (stop: string) => `Dislike ${stop}`,
  },

  dialogs: {
    submittedReview: {
      badge: 'Reviewed',
      ratingCaption: '(Experience rating)',
      commentHeading: 'Review comment:',
      submittedAt: (formattedDate: string) =>
        `Submitted at: ${formattedDate}`,
    },
    refundDetails: {
      title: 'Trip Refund Information',
      bookingCodeLabel: 'Booking Code:',
      statusLabel: 'Status:',
      refundAmountLabel: 'Refund Amount:',
      refundChannelLabel: 'Refund Channel:',
      cancelledAtLabel: 'Cancelled At:',
    },
  },

  pagination: {
    pagePrefix: 'Page',
    pageSeparator: '/',
    totalTripsSuffix: (totalCount: number) => `(${totalCount} total trips)`,
    previous: 'Previous',
    next: 'Next',
  },
} as const;
