export type PoiStatus = 'Active' | 'Inactive';
export type EnvironmentSetting = 'Indoor' | 'Outdoor' | 'Mixed';

export interface OperatingScheduleDay {
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  day_name: string;
  open_time: string;
  close_time: string;
  is_open: boolean;
}

export interface PoiFormData {
  name: string;
  category_id: string;
  description: string;
  address: string;
  latitude: number | string;
  longitude: number | string;
  environment_setting: EnvironmentSetting;
  avg_visit_duration_minutes: number | string;
  has_shelter: boolean;
  tags: number[];
  operating_schedule: OperatingScheduleDay[];
}

export interface PoiCategoryOption {
  id: string;
  name: string;
}

export type SimulatorState =
  | 'valid'
  | 'empty'
  | 'errors'
  | 'submitting'
  | 'conflict409'
  | 'success'
  | 'notFound404';

export interface ValidationErrors {
  [field: string]: string | undefined;
  name?: string;
  category_id?: string;
  description?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  avg_visit_duration_minutes?: string;
}

export interface CatalogueOption { id: number; name: string }
export interface PoiCatalogue { categories: CatalogueOption[]; tags: CatalogueOption[] }

export interface PoiOpeningHour {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

export interface CreatePoiRequest {
  name: string;
  categoryId: number;
  latitude: number;
  longitude: number;
  address: string | null;
  description: string | null;
  indoorOutdoor: EnvironmentSetting;
  averageVisitDurationMinutes: number | null;
  hasShelter: boolean;
  openingHours: PoiOpeningHour[];
  tagIds: number[];
  confirmDuplicate: boolean;
}

export interface PoiResponse extends Omit<CreatePoiRequest, 'confirmDuplicate' | 'averageVisitDurationMinutes'> {
  id: number;
  averageVisitDurationMinutes: number;
  scenicScore: number | null;
  photoRating: number | null;
  status: PoiStatus;
  createdById: number;
  createdAtUtc: string;
  updatedAtUtc: string;
}
