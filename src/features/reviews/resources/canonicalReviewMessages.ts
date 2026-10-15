const messages: Record<string, string> = {
  'trip_review.invalid_input': 'Check the review details and try again.',
  'trip_review.not_found': 'This booking could not be found.',
  'trip_review.booking_not_found': 'This booking could not be found.',
  'trip_review.invalid_response': 'The review service returned an invalid response. Please try again.',
  'trip_review.forbidden': 'You can only review your own booking.',
  'trip_review.booking_not_completed': 'A review can only be submitted after the trip is completed.',
  'trip_review.duplicate': 'A review already exists. The existing review is shown below.',
  'trip_review.edit_expired': 'The seven-day edit window has expired. This review is read-only.',
  'trip_review.stale_version': 'This review changed elsewhere. Reload it before saving again.',
  'trip_review.policy_rejected': 'The review was rejected by the content policy.',
  'trip_review.policy_unavailable': 'Content screening is temporarily unavailable. Please try again.',
  'trip_review.unsupported_subject': 'This booking does not have a supported review subject.',
  'trip_review.unsupported_media_type': 'Use JPEG, PNG, or WebP photos only.',
  'trip_review.body_too_large': 'The selected photos are too large.',
  UNAUTHENTICATED: 'Sign in as the traveler who owns this booking to continue.',
  FORBIDDEN: 'You can only review your own booking.',
  MSG127: 'The review could not be saved. Please try again.',
};

export function canonicalReviewMessage(code: string): string {
  return messages[code] ?? messages.MSG127;
}
