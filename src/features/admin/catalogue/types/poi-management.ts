export type PoiManagementStatus = 'Active' | 'Inactive';

export interface PoiManagementQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: number;
  status?: PoiManagementStatus;
}

export interface PoiManagementCategory { id: number; name: string }
export interface PoiManagementOpeningHour {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}
export interface PoiManagementItem {
  id: string;
  name: string;
  categoryId: number;
  categoryName: string;
  address: string | null;
  latitude: number;
  longitude: number;
  openingHours: PoiManagementOpeningHour[];
  status: PoiManagementStatus;
}
export interface PoiManagementResponse {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  metadata: { categories: PoiManagementCategory[] };
  items: PoiManagementItem[];
}
