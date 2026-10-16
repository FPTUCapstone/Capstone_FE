import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase } from '@/lib/authApi';

export class OperatorTourApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = 'OperatorTourApiError';
  }
}

function headers(extra?: HeadersInit): HeadersInit {
  const token = AuthStorage.getAccessToken();
  if (!token) throw new OperatorTourApiError(401, 'AUTH_REQUIRED', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...extra };
}

function firstValidationMessage(errors: unknown): string | undefined {
  if (!errors || typeof errors !== 'object') return undefined;
  for (const messages of Object.values(errors as Record<string, unknown>)) {
    if (Array.isArray(messages) && typeof messages[0] === 'string' && messages[0]) return messages[0];
  }
  return undefined;
}

async function fail(response: Response): Promise<never> {
  let code: string | undefined;
  let message = response.status === 403
    ? 'Chỉ nhà điều hành tour đã được phê duyệt mới có thể quản lý gói tour.'
    : 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.';
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object') {
      const value = body as Record<string, unknown>;
      code = typeof value.errorCode === 'string' ? value.errorCode : typeof value.code === 'string' ? value.code : undefined;
      if (typeof value.title === 'string') message = value.title;
      if (typeof value.detail === 'string') message = value.detail;
      const firstFieldError = firstValidationMessage(value.errors);
      if (firstFieldError) message = firstFieldError;
    }
  } catch { /* Preserve safe fallback. */ }
  throw new OperatorTourApiError(response.status, code, message);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${getApiBase()}${path}`, { ...init, headers: headers(init?.headers) });
  } catch (error) {
    if (error instanceof OperatorTourApiError) throw error;
    throw new OperatorTourApiError(0, 'NETWORK', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.');
  }
  if (!response.ok) return fail(response);
  return await response.json() as T;
}

export interface ApiTourListItem { id: number; title: string; status: string; basePrice: number; durationDays: number; versionNo?: number; updatedAtUtc: string; nextDepartureAtUtc: string | null; destination: string; }
export interface ApiTourListPage { items: ApiTourListItem[]; page: number; pageSize: number; totalCount: number; }
export interface ApiItineraryItem { dayNo: number; sequenceNo: number; poiId: number; plannedTime: string | null; stayDurationMinutes: number; notes: string | null; }
export interface ApiDeparture { id: number; startAtUtc: string; endAtUtc: string; meetingPoint: string | null; minimumCapacity: number; totalCapacity: number; reservedCapacity: number; registrationDeadlineAtUtc: string | null; adultPrice: number | null; childPrice: number | null; infantPrice: number | null; status: string; }
export interface ApiDestination { destinationId: number; name: string; }
export interface ApiTourDetail {
  id: number; title: string; destination: string; description: string; categoryId: number | null;
  basePrice: number; durationDays: number; versionNo?: number; status: string; rejectionReason: string | null;
  inclusions: string | null; exclusions: string | null; destinations: ApiDestination[];
  cancellationPolicyTemplateId: number | null;
  itineraryItems: ApiItineraryItem[]; departures: ApiDeparture[];
  timeZoneId: string; highlights: string | null; travellerRequirements: string | null;
  mediaCount: number; hasPrimaryImage: boolean; canSubmitForReview: boolean;
  reviewBlockers: string[]; warnings: ApiTourWarning[];
}
export interface ApiTourWarning { code: string; dayNo: number | null; sequenceNo: number | null; poiId: number | null; }
export interface ApiTourMedia { tourMediaId: number; tourId: number; deliveryUrl: string; caption: string | null; altText: string; sortOrder: number; isPrimary: boolean; }
/** Create/update body. The backend requires destinationIds and cancellationPolicyTemplateId (BR-101). */
export interface ApiCreateTour {
  title: string; description: string; categoryId?: number; basePrice: number; durationDays: number;
  destinationIds: number[]; cancellationPolicyTemplateId: number; inclusions?: string; exclusions?: string;
  highlights?: string; travellerRequirements?: string; timeZoneId?: string;
  itineraryItems: ApiItineraryItem[]; schedules: Omit<ApiDeparture, 'id' | 'reservedCapacity' | 'status'>[]; sourceTourId?: number;
}
export interface ApiPolicy { id: number; name: string; description: string | null; rules: { daysBeforeDeparture: number; cancellationFeePercent: number }[]; }
export interface ApiCategory { categoryId: number; code: string; name: string; }
export interface ApiPoi { id: number; name: string; categoryName: string; address: string | null; averageVisitDurationMinutes: number; }

export const listToursPage = (page: number, pageSize = 100) =>
  request<ApiTourListPage>(`/operator/tours?page=${page}&pageSize=${pageSize}`);

/** Reads every page so the client-side status tabs and counts cover the operator's whole catalogue. */
export async function listTours(): Promise<ApiTourListItem[]> {
  const items: ApiTourListItem[] = [];
  for (let page = 1; ; page += 1) {
    const result = await listToursPage(page);
    items.push(...result.items);
    if (result.items.length === 0 || items.length >= result.totalCount) return items;
  }
}
export const getTour = (id: number) => request<ApiTourDetail>(`/operator/tours/${id}`);
export const createTour = (body: ApiCreateTour, idempotencyKey: string) => request<{ tourId: number; status: string }>('/operator/tours', { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(body) });
export const updateTour = (id: number, body: ApiCreateTour) => request<{ tourId: number; status: string }>(`/operator/tours/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const submitTour = (id: number) => request<{ tourId: number; status: string }>(`/operator/tours/${id}/submit-review`, { method: 'POST' });
export const listCancellationPolicies = () => request<ApiPolicy[]>('/operator/tours/cancellation-policies');
export const listCategories = () => request<ApiCategory[]>('/tour-categories');
export const listDestinations = () => request<ApiDestination[]>('/destinations');
export async function searchSelectablePois(query = ''): Promise<ApiPoi[]> {
  const params = new URLSearchParams({ page: '1', pageSize: '50' });
  if (query.trim()) params.set('query', query.trim());
  const result = await request<{ items: ApiPoi[] }>(`/points-of-interest/search?${params}`);
  return result.items;
}

const mediaPath = (tourId: number) => `/operator/tours/${tourId}/media`;
export const listTourMedia = (tourId: number) => request<ApiTourMedia[]>(mediaPath(tourId));

/** Multipart upload: the browser sets the boundary, so no JSON content type is sent. */
export async function uploadTourMedia(
  tourId: number,
  file: File,
  altText: string,
  isPrimary: boolean,
  idempotencyKey: string,
): Promise<ApiTourMedia> {
  const form = new FormData();
  form.append('file', file);
  form.append('altText', altText);
  form.append('isPrimary', String(isPrimary));
  const base = headers({ 'Idempotency-Key': idempotencyKey }) as Record<string, string>;
  delete base['Content-Type'];
  let response: Response;
  try {
    response = await fetch(`${getApiBase()}${mediaPath(tourId)}`, { method: 'POST', headers: base, body: form });
  } catch (error) {
    if (error instanceof OperatorTourApiError) throw error;
    throw new OperatorTourApiError(0, 'NETWORK', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.');
  }
  if (!response.ok) return fail(response);
  return await response.json() as ApiTourMedia;
}

export const reorderTourMedia = (tourId: number, mediaIds: number[], primaryMediaId: number) =>
  request<ApiTourMedia[]>(`${mediaPath(tourId)}/order`, {
    method: 'PUT',
    body: JSON.stringify({ mediaIds, primaryMediaId }),
  });

export async function deleteTourMedia(tourId: number, mediaId: number): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${getApiBase()}${mediaPath(tourId)}/${mediaId}`, { method: 'DELETE', headers: headers() });
  } catch (error) {
    if (error instanceof OperatorTourApiError) throw error;
    throw new OperatorTourApiError(0, 'NETWORK', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.');
  }
  if (!response.ok) await fail(response);
}

export async function deleteOperatorTour(tourId: number): Promise<void> {
  const response = await fetch(`${getApiBase()}/operator/tours/${tourId}`, { method: 'DELETE', headers: headers() });
  if (!response.ok) await fail(response);
}
