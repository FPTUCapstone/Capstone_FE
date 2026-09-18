export type PoiSort = 'name' | 'distance' | 'rating';

export interface PoiSearchState {
  search: string;
  categoryId: number | null;
  openNow: boolean;
  sort: PoiSort;
  page: number;
}

export interface PoiOrigin {
  latitude?: number;
  longitude?: number;
  maxDistanceKm?: number;
}

export interface PoiSummary {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  latitude: number;
  longitude: number;
  address: string | null;
  indoorOutdoor: string;
  averageVisitDurationMinutes: number;
  hasShelter: boolean;
  averageRating: number | null;
  reviewCount: number;
  thumbnailUrl: string | null;
  distanceKm: number | null;
  isOpenNow: boolean;
}

export interface PagedPois {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: PoiSummary[];
}

export interface PoiOpeningHour {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

export interface PoiPhoto {
  id: number;
  url: string;
  caption: string | null;
  sortOrder: number;
}

export interface PoiTag {
  id: number;
  name: string;
}

export interface PoiDetail extends Omit<PoiSummary, 'thumbnailUrl' | 'distanceKm'> {
  description: string;
  status: string;
  scenicScore: number | null;
  photoRating: number | null;
  openingHours: PoiOpeningHour[];
  photos: PoiPhoto[];
  tags: PoiTag[];
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface ApiProblem {
  status?: number;
  title?: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
}

export class PoiApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly problem?: ApiProblem,
  ) {
    super(message);
    this.name = 'PoiApiError';
  }
}
