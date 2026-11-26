import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase } from '@/lib/apiBase';

export class OperatorTourApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | undefined,
    message: string,
    public readonly fieldErrors?: Record<string, string[]>,
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

function extractFieldErrors(errors: unknown): Record<string, string[]> | undefined {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return undefined;
  const result: Record<string, string[]> = {};
  for (const [key, rawMessages] of Object.entries(errors as Record<string, unknown>)) {
    if (!Array.isArray(rawMessages)) continue;
    const messages = rawMessages.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    if (messages.length > 0) result[key] = messages;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function firstValidationMessage(fieldErrors: Record<string, string[]> | undefined): string | undefined {
  if (!fieldErrors) return undefined;
  for (const messages of Object.values(fieldErrors)) {
    if (messages[0]) return messages[0];
  }
  return undefined;
}

function isGenericServerMessage(message: string): boolean {
  return /^an unexpected error occurred\.?$/i.test(message.trim());
}

async function fail(response: Response): Promise<never> {
  let code: string | undefined;
  let fieldErrors: Record<string, string[]> | undefined;
  let message = response.status === 401
    ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    : response.status === 403
      ? 'Bạn không có quyền thực hiện thao tác này hoặc tài khoản chưa được phê duyệt.'
      : response.status === 404
        ? 'Không tìm thấy gói tour hoặc tính năng chưa khả dụng trên máy chủ.'
        : response.status === 409
          ? 'Trạng thái hoặc dữ liệu gói tour đã thay đổi. Vui lòng tải lại trang và thử lại.'
          : response.status >= 500
            ? 'Máy chủ gặp lỗi khi xử lý yêu cầu. Vui lòng thử lại sau hoặc kiểm tra log backend local.'
            : 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.';
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object') {
      const value = body as Record<string, unknown>;
      const extensions = value.extensions && typeof value.extensions === 'object'
        ? value.extensions as Record<string, unknown>
        : undefined;
      code = typeof value.errorCode === 'string' ? value.errorCode
        : typeof value.code === 'string' ? value.code
          : typeof extensions?.errorCode === 'string' ? extensions.errorCode
            : undefined;
      if (typeof value.title === 'string' && !isGenericServerMessage(value.title)) message = value.title;
      if (typeof value.detail === 'string' && !isGenericServerMessage(value.detail)) message = value.detail;
      fieldErrors = extractFieldErrors(value.errors);
      const firstFieldError = firstValidationMessage(fieldErrors);
      if (firstFieldError) message = firstFieldError;
    }
  } catch { /* Preserve safe fallback. */ }
  throw new OperatorTourApiError(response.status, code, message, fieldErrors);
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

export interface ApiTourListItem { id: number; title: string; status: string; basePrice: number; durationDays: number; versionNo?: number; updatedAtUtc: string; publishedAtUtc?: string | null; nextDepartureAtUtc: string | null; destination: string; upcomingDepartureCount?: number; completedDepartureCount?: number; totalDepartureCount?: number; }
export interface ApiTourListPage { items: ApiTourListItem[]; page: number; pageSize: number; totalCount: number; }
export interface ApiItineraryItem { dayNo: number; sequenceNo: number; poiId: number; poiName?: string | null; plannedTime: string | null; stayDurationMinutes: number; notes: string | null; }
export interface ApiDeparture { id: number; startAtUtc: string; endAtUtc: string; meetingPoint: string | null; minimumCapacity: number; totalCapacity: number; reservedCapacity: number; registrationDeadlineAtUtc: string | null; adultPrice: number | null; childPrice: number | null; infantPrice: number | null; status: string; meetingLatitude?: number | null; meetingLongitude?: number | null; isCompleted?: boolean; }
export interface ApiDestination { destinationId: number; name: string; }
export interface ApiTourVersion {
  tourId: number;
  versionNo: number;
  status: string;
  createdAtUtc: string;
  publishedAtUtc?: string | null;
  rejectionReason?: string | null;
}
export interface ApiTourDetail {
  submissionNote?: string | null; submittedAtUtc?: string | null; publishedAtUtc?: string | null;
  id: number; title: string; destination: string; description: string; categoryId: number | null;
  basePrice: number; durationDays: number; versionNo?: number; status: string; rejectionReason: string | null;
  inclusions: string | null; exclusions: string | null; destinations: ApiDestination[];
  cancellationPolicyTemplateId: number | null;
  itineraryItems: ApiItineraryItem[]; departures: ApiDeparture[];
  timeZoneId: string; highlights: string | null; travellerRequirements: string | null;
  allowDeposit?: boolean; depositPercent?: number | null; balanceDueDaysBeforeDeparture?: number | null;
  versions?: ApiTourVersion[];
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
  allowDeposit?: boolean; depositPercent?: number | null; balanceDueDaysBeforeDeparture?: number | null;
  itineraryItems: ApiItineraryItem[]; schedules: Omit<ApiDeparture, 'id' | 'reservedCapacity' | 'status' | 'isCompleted'>[]; sourceTourId?: number;
}
export interface ApiAddDepartureRequest {
  startAtUtc: string;
  endAtUtc: string;
  meetingPoint: string | null;
  totalCapacity: number;
  minimumCapacity: number;
  registrationDeadlineAtUtc: string | null;
  adultPrice: number | null;
  childPrice: number | null;
  infantPrice: number | null;
  meetingLatitude?: number | null;
  meetingLongitude?: number | null;
}
export interface ApiAddDepartureResponse {
  tourId: number;
  scheduleId: number;
  status: string;
  startAtUtc: string;
  endAtUtc: string;
  meetingPoint: string | null;
  totalCapacity: number;
  minimumCapacity: number;
  reservedCapacity: number;
  registrationDeadlineAtUtc: string | null;
  adultPrice: number;
  childPrice: number | null;
  infantPrice: number | null;
  meetingLatitude?: number | null;
  meetingLongitude?: number | null;
  isReplay?: boolean;
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
export const addTourDeparture = (tourId: number, body: ApiAddDepartureRequest, idempotencyKey: string) =>
  request<ApiAddDepartureResponse>(`/operator/tours/${tourId}/departures`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(body),
  });
export async function submitTour(id: number, submissionNote: string | null = null) {
  const result = await request<{ tourId: number; status: string; submittedAtUtc?: string | null }>(`/operator/tours/${id}/submit-review`, {
    method: 'POST', body: JSON.stringify({ submissionNote }),
  });
  if (!result || result.tourId !== id || result.status !== 'Pending' ||
    (result.submittedAtUtc != null && (typeof result.submittedAtUtc !== 'string' || !Number.isFinite(Date.parse(result.submittedAtUtc))))) {
    throw new OperatorTourApiError(0, 'INVALID_RESPONSE', 'Chưa xác định được kết quả gửi duyệt. Vui lòng tải lại tour để kiểm tra trạng thái trước khi gửi lại.');
  }
  return result;
}
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
  let response: Response;
  try {
    response = await fetch(`${getApiBase()}/operator/tours/${tourId}`, { method: 'DELETE', headers: headers() });
  } catch (error) {
    if (error instanceof OperatorTourApiError) throw error;
    throw new OperatorTourApiError(0, 'NETWORK', 'Không thể kết nối đến máy chủ để xóa tour. Vui lòng kiểm tra backend local rồi thử lại.');
  }
  if (!response.ok) await fail(response);
}
