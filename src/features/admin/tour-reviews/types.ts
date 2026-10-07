export interface TourModerationItineraryStop {
  readonly id: string;
  readonly startsAtUtc: string;
  readonly title: string;
  readonly description: string;
}

export interface PendingTourPost {
  readonly id: string;
  readonly tourName: string;
  readonly operatorName: string;
  readonly location: string;
  readonly category: string;
  readonly languages: string;
  readonly submittedAtUtc: string;
  readonly departureAtUtc: string;
  readonly priceVnd: number;
  readonly durationHours: number;
  readonly capacity: number;
  readonly imageCount: number;
  readonly overview: string;
  readonly includedServices: readonly string[];
  readonly excludedServices: readonly string[];
  readonly cancellationPolicy: string;
  readonly itinerary: readonly TourModerationItineraryStop[];
}

export interface TourQueueQuery {
  readonly page: number;
  readonly keyword: string;
}

export type PendingTourQueueResult =
  | { readonly status: 'NO_BACKEND' }
  | {
      readonly status: 'DEMO';
      readonly items: readonly PendingTourPost[];
      readonly totalCount: number;
      readonly page: number;
      readonly pageSize: number;
      readonly totalPages: number;
    };

export type TourPostDetailResult =
  | { readonly status: 'NO_BACKEND' }
  | { readonly status: 'NOT_FOUND' }
  | { readonly status: 'DEMO'; readonly tour: PendingTourPost };

export type ReviewCriterionKey =
  | 'contentCompleteness'
  | 'imageAppropriateness'
  | 'pricePlausibility'
  | 'policyCompliance'
  | 'itineraryFeasibility';
