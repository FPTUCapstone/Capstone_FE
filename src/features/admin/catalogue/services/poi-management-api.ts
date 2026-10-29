import type {
  PoiManagementCategory, PoiManagementItem, PoiManagementOpeningHour, PoiManagementQuery,
  PoiManagementResponse, PoiManagementStatus,
} from '../types/poi-management';

const INT32_MAX = 2147483647;
const INT64_MAX = '9223372036854775807';
const QUERY_KEYS = ['page', 'pageSize', 'search', 'categoryId', 'status'] as const;
type ErrorCode = 'POI_MANAGEMENT_ACCESS_REQUIRED' | 'POI_MANAGEMENT_INVALID_QUERY' |
  'POI_MANAGEMENT_CATEGORY_NOT_FOUND' | 'POI_MANAGEMENT_UNAVAILABLE';

export class PoiManagementApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    public readonly errors: Record<string, string[]> = {},
  ) {
    super(status === 400 ? 'Some filters need attention. Review the highlighted fields.'
      : status === 401 ? 'Your session has expired. Sign in again to continue.'
        : status === 403 ? 'An active Administrator or Staff account is required.'
          : 'The POI list could not be loaded. Please try again.');
    this.name = 'PoiManagementApiError';
  }
}

function unavailable(): never {
  throw new PoiManagementApiError(503, 'POI_MANAGEMENT_UNAVAILABLE');
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return unavailable();
  return value as Record<string, unknown>;
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) return unavailable();
  return value;
}
function integer(value: unknown, min: number, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) return unavailable();
  return value;
}
function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return unavailable();
  return value;
}
function status(value: unknown): PoiManagementStatus {
  if (value !== 'Active' && value !== 'Inactive') return unavailable();
  return value;
}
function coordinate(value: unknown, bound: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > bound) return unavailable();
  return value;
}
function poiId(value: unknown): string {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || value.length > INT64_MAX.length ||
    (value.length === INT64_MAX.length && value > INT64_MAX)) return unavailable();
  return value;
}

// TimeOnly ticks fit safely in a JavaScript number; POI identifiers never enter this path.
function timeTicks(value: unknown): number {
  if (typeof value !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,7})?$/.test(value)) return unavailable();
  const [clock, fraction = ''] = value.split('.');
  const [hour, minute, second] = clock.split(':').map(Number);
  return ((hour * 60 + minute) * 60 + second) * 10000000 + Number(fraction.padEnd(7, '0'));
}
function openingHours(value: unknown): PoiManagementOpeningHour[] {
  let previousDay = -1;
  return array(value).map(raw => {
    const hour = record(raw);
    const dayOfWeek = integer(hour.dayOfWeek, 0, 6);
    if (dayOfWeek <= previousDay || typeof hour.isClosed !== 'boolean') return unavailable();
    previousDay = dayOfWeek;
    if (hour.isClosed) {
      if (hour.openTime !== null || hour.closeTime !== null) return unavailable();
      return { dayOfWeek, openTime: null, closeTime: null, isClosed: true };
    }
    if (timeTicks(hour.openTime) >= timeTicks(hour.closeTime)) return unavailable();
    return { dayOfWeek, openTime: hour.openTime as string, closeTime: hour.closeTime as string, isClosed: false };
  });
}

/** Validate the whole response and reconstruct only contract fields, including nested metadata. */
export function parsePoiManagementResponse(value: unknown): PoiManagementResponse {
  const body = record(value);
  const page = integer(body.page, 1, INT32_MAX);
  const pageSize = integer(body.pageSize, 1, 100);
  const offset = (page - 1) * pageSize;
  if (offset > INT32_MAX) return unavailable();
  const totalCount = integer(body.totalCount, 0);
  const totalPages = integer(body.totalPages, 0);
  if (totalPages !== Math.ceil(totalCount / pageSize)) return unavailable();

  const categoryNames = new Map<number, string>();
  const categories: PoiManagementCategory[] = array(record(body.metadata).categories).map(raw => {
    const category = record(raw);
    const id = integer(category.id, 1, INT32_MAX);
    const name = text(category.name);
    if (categoryNames.has(id)) return unavailable();
    categoryNames.set(id, name);
    return { id, name };
  });
  const itemIds = new Set<string>();
  const items: PoiManagementItem[] = array(body.items).map(raw => {
    const item = record(raw);
    const id = poiId(item.id);
    const categoryId = integer(item.categoryId, 1, INT32_MAX);
    const categoryName = text(item.categoryName);
    if (itemIds.has(id) || categoryNames.get(categoryId) !== categoryName) return unavailable();
    itemIds.add(id);
    if (item.address !== null && typeof item.address !== 'string') return unavailable();
    return {
      id, name: text(item.name), categoryId, categoryName, address: item.address,
      latitude: coordinate(item.latitude, 90), longitude: coordinate(item.longitude, 180),
      openingHours: openingHours(item.openingHours), status: status(item.status),
    };
  });
  if (items.length !== Math.min(pageSize, Math.max(0, totalCount - offset))) return unavailable();
  return { page, pageSize, totalCount, totalPages, metadata: { categories }, items };
}

function invalidQuery(field: typeof QUERY_KEYS[number]): never {
  throw new PoiManagementApiError(400, 'POI_MANAGEMENT_INVALID_QUERY', { [field]: ['Review this filter value.'] });
}

/** A typed browser query cannot carry duplicate keys; the BFF separately validates raw URL parameters. */
export function serializePoiManagementQuery(query: PoiManagementQuery): string {
  if (typeof query !== 'object' || query === null || Array.isArray(query) || Object.getPrototypeOf(query) !== Object.prototype) {
    throw new PoiManagementApiError(400, 'POI_MANAGEMENT_INVALID_QUERY');
  }
  const params = new URLSearchParams();
  const page = query.page === undefined ? 1 : query.page;
  const pageSize = query.pageSize === undefined ? 20 : query.pageSize;
  if (!Number.isInteger(page) || page < 1 || page > INT32_MAX) return invalidQuery('page');
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) return invalidQuery('pageSize');
  if ((page - 1) * pageSize > INT32_MAX) return invalidQuery('page');
  if (query.page !== undefined) params.set('page', String(page));
  if (query.pageSize !== undefined) params.set('pageSize', String(pageSize));
  if (query.search !== undefined) {
    if (typeof query.search !== 'string') return invalidQuery('search');
    const search = query.search.trim();
    if (search.length > 200) return invalidQuery('search');
    if (search) params.set('search', search);
  }
  if (query.categoryId !== undefined) {
    if (!Number.isInteger(query.categoryId) || query.categoryId < 1 || query.categoryId > INT32_MAX) return invalidQuery('categoryId');
    params.set('categoryId', String(query.categoryId));
  }
  if (query.status !== undefined) {
    if (query.status !== 'Active' && query.status !== 'Inactive') return invalidQuery('status');
    params.set('status', query.status);
  }
  return params.toString();
}

function validationErrors(value: unknown): Record<string, string[]> {
  // Preserve the affected field names, never upstream messages that may include internal details.
  const errors: Record<string, string[]> = {};
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return errors;
  const rawErrors = (value as Record<string, unknown>).errors;
  if (typeof rawErrors !== 'object' || rawErrors === null || Array.isArray(rawErrors)) return errors;
  for (const [key, messages] of Object.entries(rawErrors)) {
    const field = QUERY_KEYS.find(candidate => candidate.toLowerCase() === key.toLowerCase());
    if (field && Array.isArray(messages) && messages.length && messages.every(message => typeof message === 'string')) {
      errors[field] = ['Review this filter value.'];
    }
  }
  return errors;
}

export async function loadPoiManagement(query: PoiManagementQuery = {}, signal?: AbortSignal): Promise<PoiManagementResponse> {
  const encoded = serializePoiManagementQuery(query);
  let response: Response;
  let body: unknown;
  try {
    response = await fetch('/api/admin/pois' + (encoded ? '?' + encoded : ''), {
      method: 'GET', cache: 'no-store', credentials: 'same-origin', signal,
    });
    body = await response.json().catch(() => null);
  } catch (error) {
    if (signal?.aborted) throw error;
    return unavailable();
  }
  if (signal?.aborted) throw signal.reason;
  if (!response.ok) {
    if (response.status === 400) {
      const raw = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
      throw new PoiManagementApiError(400, raw.errorCode === 'POI_MANAGEMENT_CATEGORY_NOT_FOUND'
        ? 'POI_MANAGEMENT_CATEGORY_NOT_FOUND' : 'POI_MANAGEMENT_INVALID_QUERY', validationErrors(body));
    }
    if (response.status === 401 || response.status === 403) {
      throw new PoiManagementApiError(response.status, 'POI_MANAGEMENT_ACCESS_REQUIRED');
    }
    return unavailable();
  }
  if (response.status !== 200) return unavailable();
  const parsed = parsePoiManagementResponse(body);
  if (parsed.page !== (query.page ?? 1) || parsed.pageSize !== (query.pageSize ?? 20) ||
    (query.categoryId !== undefined && !parsed.metadata.categories.some(category => category.id === query.categoryId)) ||
    parsed.items.some(item => (query.categoryId !== undefined && item.categoryId !== query.categoryId) ||
      (query.status !== undefined && item.status !== query.status))) return unavailable();
  return parsed;
}

