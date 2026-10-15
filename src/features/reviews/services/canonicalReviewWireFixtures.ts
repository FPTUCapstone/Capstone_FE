const rawId = '__INT64__';
export function backendContext(existing = false, parentId = '9223372036854775807') {
  const review = {
    kind: 'new', reviewId: rawId, bookingId: rawId,
    reviewableRecord: { kind: 'commerceBooking', id: rawId },
    subject: { kind: 'tour', id: rawId }, overallRating: 5,
    title: 'Existing review', content: 'Excellent', routePacing: null, cspRating: null,
    publishDisplayName: false, publicDisplayName: 'T.', publicationStatus: 'published',
    createdAtUtc: '2026-10-01T00:00:00Z', updatedAtUtc: '2026-10-01T00:00:00Z',
    editDeadlineUtc: '2026-10-08T00:00:00Z', version: 'AAAAAAAAAAA=', poiRatings: [], media: [],
  };
  return JSON.stringify({
    bookingId: rawId, reviewableRecord: { kind: 'commerceBooking', id: rawId },
    bookingStatus: 'Completed', subject: review.subject,
    summary: { name: 'Hoi An wire fixture', departureAtUtc: '2026-10-01T00:00:00Z', bookingReference: 'BK-WIRE' },
    canSubmit: !existing, submitUnavailableReason: existing ? 'alreadyReviewed' : null,
    existingReviewKind: existing ? 'new' : 'none', review: existing ? review : null,
    editableFields: existing ? ['overallRating', 'title', 'content', 'publishDisplayName'] : [],
    routePacing: { available: false, reason: null }, cspRating: { available: false, reason: null },
    poiRatings: { available: false, reason: null }, eligiblePois: [],
    displayNamePreview: { initials: 'T.', fullNameWithConsent: null },
  }).replaceAll(`"${rawId}"`, parentId);
}
