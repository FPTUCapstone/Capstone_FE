export type ReviewableRecordKind = 'commerceBooking' | 'serviceBooking';

export interface ReviewableRecordRef {
  kind: ReviewableRecordKind;
  /** Decimal int64 encoded as text so browser number coercion cannot corrupt the identity. */
  id: string;
}

export interface ReviewSubject { kind: 'tour' | 'poi' | 'itinerary'; id: string }
export interface ReviewSummary { name: string; departureAtUtc: string; bookingReference: string }
export interface ReviewCapability { available: boolean; reason: string | null }
export interface ReviewMedia { mediaId: string; deliveryUrl: string }

export interface CanonicalReview {
  kind: 'new';
  reviewId: string;
  reviewableRecord: ReviewableRecordRef;
  subject: ReviewSubject;
  overallRating: number;
  title: string;
  content: string;
  publishDisplayName: boolean;
  publicDisplayName: string;
  publicationStatus: string;
  createdAtUtc: string;
  editDeadlineUtc: string;
  updatedAtUtc: string;
  version: string;
  media: ReviewMedia[];
}

export interface TripReviewContext {
  reviewableRecord: ReviewableRecordRef;
  bookingStatus: string;
  subject: ReviewSubject | null;
  summary: ReviewSummary | null;
  canSubmit: boolean;
  submitUnavailableReason: string | null;
  existingReviewKind: 'none' | 'new' | 'legacy';
  review: CanonicalReview | { kind: 'legacy' } | null;
  editableFields: string[];
  routePacing: ReviewCapability;
  cspRating: ReviewCapability;
  poiRatings: ReviewCapability;
}

export interface ReviewWriteInput {
  overallRating: number;
  title: string;
  content: string;
  publishDisplayName: boolean;
  files?: File[];
  version?: string;
}

export class CanonicalReviewApiError extends Error {
  constructor(public readonly status: number, public readonly errorCode: string) {
    super(errorCode);
    this.name = 'CanonicalReviewApiError';
  }
}
