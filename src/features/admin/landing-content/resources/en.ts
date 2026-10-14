export const landingContentEn = {
  errors: {
    required: 'This field is required.',
    // SRS_MESSAGE_GAP: the SRS has no message for these three cases yet.
    imageTooLarge: 'The image must not exceed 5 MB.',
    imageUnsupportedType: 'The image must be a JPEG, PNG or WebP file.',
    invalidPeriod: 'The display end date must not be before the display start date.',
    tourUnavailable: 'This tour package is currently unavailable for booking.',
    forbidden: 'You do not have permission to access this function.',
    unavailable:
      'TripMate is temporarily unable to process your request. Please check your connection and try again.',
    conflict: 'The landing page content changed since you opened it. Reload to continue.',
  },
  success: {
    draftSaved: 'Operation completed successfully.',
    // SRS_MESSAGE_GAP: MSG148 has no row in the SRS message table.
    published: 'The landing page content was published.',
  },
} as const;

export type ContentErrorKey = keyof typeof landingContentEn.errors;
