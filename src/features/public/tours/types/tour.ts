export interface TourSearchItemDto {
  tourId: string;
  title: string;
  destinations: string[];
  operatorName: string;
  durationDays: number;
  basePrice: number;
  currency: string;
  representativeScheduleId: string | null;
  departureAtUtc: string | null;
  availabilityStatus: string;
  remainingSlots: number | null;
  thumbnailUrl: string | null;
}

export interface PagedToursResponseDto {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  asOfUtc: string;
  items: TourSearchItemDto[];
}

export interface TourSearchState {
  destination: string;
  departureDate: string;
  minPrice: string;
  maxPrice: string;
  page: number;
  pageSize: number;
}

export interface TourScheduleDto {
  scheduleId: string;
  tourId: string;
  startDatetime: string;
  endDatetime: string;
  /** Only present on demo data: the real API exposes the remaining slots, not the raw capacity. */
  totalCapacity?: number;
  reservedCapacity?: number;
  remainingSlots: number;
  price: number;
  currency: string;
  status: 'Scheduled' | 'Available' | 'SoldOut' | 'Completed' | 'Cancelled';
  /** Fields below come from the real API (UC-26); demo fixtures may omit them. */
  meetingPoint?: string;
  registrationDeadline?: string;
  childPrice?: number;
  infantPrice?: number;
  /** Server decision: available capacity and registration still open (BR-59, BR-60). */
  bookable?: boolean;
}

export interface TourItineraryStopDto {
  sequenceNo: number;
  poiId: string;
  poiName: string;
  address?: string;
  /** "HH:mm" */
  plannedTime?: string;
  stayDurationMinutes: number;
  notes?: string;
}

export interface TourItineraryDayDto {
  dayNumber: number;
  title: string;
  description: string;
  activities: string[];
  meals?: string;
  /** Structured stops from the real API; demo data uses `activities` only. */
  stops?: TourItineraryStopDto[];
}

export interface TourCancellationRuleDto {
  daysBeforeDeparture: number;
  cancellationFeePercent: number;
}

export interface TourRatingDto {
  average: number | null;
  count: number;
}

export interface TourReviewDto {
  reviewId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface TourDetailDto {
  tourId: string;
  title: string;
  description: string;
  destinations: string[];
  operatorName: string;
  operatorContact?: string;
  durationDays: number;
  basePrice: number;
  currency: string;
  aggregateRating: number | null;
  reviewCount: number;
  images: string[];
  inclusions: string[];
  exclusions: string[];
  cancellationPolicy: string;
  meetingPoint: string;
  schedules: TourScheduleDto[];
  itinerary: TourItineraryDayDto[];
  reviews: TourReviewDto[];
  isDemo?: boolean;
  /** Fields below come from the real API (UC-26); demo fixtures may omit them. */
  destinationSummary?: string;
  rating?: TourRatingDto;
  cancellationRules?: TourCancellationRuleDto[];
  hasBookableSchedule?: boolean;
  /** When the slot counts were read (BR-59: a snapshot, not a reservation). */
  asOfUtc?: string;
}

export interface TourRecommendationDto {
  tour: TourSearchItemDto;
  matchingScore: number;
  matchingReasons: string[];
}

export interface ApiProblem {
  status?: number;
  title?: string;
  detail?: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
}

export class TourApiError extends Error {
  constructor(
    message: string,
    public readonly status: number = 0,
    public readonly problem?: ApiProblem,
  ) {
    super(message);
    this.name = 'TourApiError';
  }
}
