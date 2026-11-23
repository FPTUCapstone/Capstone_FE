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

export interface PoiDeactivationReferences {
  poiId: number | string;
  poiName: string;
  status: string;
  activeItinerariesCount: number;
  activeRoutesCount: number;
  openCommercialBookingsCount: number;
  hasActiveReferences: boolean;
  referenceSnapshotToken: string;
  messageCode: string | null;
  message: string | null;
}

export interface DeactivatePoiRequest {
  poiId: number | string;
  reason: string;
  referenceSnapshotToken: string;
  idempotencyKey?: string;
}

export interface DeactivatePoiResponse {
  poiId: number | string;
  status: string;
  deactivatedConnectingRoutesCount: number;
  deactivatedAtUtc: string;
  messageCode: string;
  message: string;
}
