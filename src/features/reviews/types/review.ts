export interface PoiReviewFeedback {
  poiId: string | number;
  poiName: string;
  liked: boolean;
}

export interface ReviewPhotoItem {
  id: string;
  name: string;
  size: number;
  url: string;
}

export interface CreateReviewPayload {
  tripId: string;
  bookingId?: string;
  rating: number; // 1 to 5 integer, mandatory per BR-93
  comment: string; // 20 to 500 characters
  publishWithDisplayName: boolean;

  // Optional preview ratings (Stitch / local feedback)
  routeSatisfaction?: 'tight' | 'well_paced' | 'loose' | number;
  poiFeedbacks?: PoiReviewFeedback[];
  photos?: ReviewPhotoItem[];
}

export interface ReviewDto {
  reviewId: string;
  tripId: string;
  bookingId?: string;
  rating: number;
  comment: string;
  authorDisplayName?: string;
  publishWithDisplayName: boolean;
  createdAtUtc: string;
  isDemo?: boolean;
}

export interface ReviewSubmissionResult {
  status: 'SUCCESS' | 'PENDING_BE_INTEGRATION' | 'ERROR';
  message: string;
  reviewId?: string;
  isDemo?: boolean;
}

export class ReviewApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 0,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ReviewApiError';
  }
}
