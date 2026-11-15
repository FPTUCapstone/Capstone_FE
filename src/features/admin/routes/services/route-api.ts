export const routeMessages = {
  MSG01: 'This field is required.',
  MSG126: 'You do not have permission to access this function.',
  MSG127: 'TripMate is temporarily unable to process your request. Please check your connection and try again.',
  MSG139: 'Route created successfully.',
  MSG141: 'Select two different Active points of interest.',
  MSG143: 'Distance and estimated travel time must be positive values.',
} as const;

export const transportModes = ['Walking', 'Motorbike', 'Car', 'PublicTransit'] as const;
export type RouteTransportMode = (typeof transportModes)[number];
export const transportLabels: Record<RouteTransportMode, string> = { Walking: 'Walking', Motorbike: 'Motorbike', Car: 'Car', PublicTransit: 'Public Transit' };
export interface RoutePoi { id: number; name: string; latitude: number; longitude: number }
export interface RouteOptions { pois: RoutePoi[]; transportModes: RouteTransportMode[] }
export interface CreateRouteInput { fromPoiId: number | null; toPoiId: number | null; distanceKm: number | null; estimatedDurationMinutes: number | null; transportMode: RouteTransportMode | ''; routeNote: string | null }
export interface RouteDto { id: number; fromPoiId: number; toPoiId: number; fromPoiName: string; toPoiName: string; distanceKm: number; estimatedDurationMinutes: number; transportMode: RouteTransportMode; routeNote: string | null; status: 'Active' | 'Inactive'; createdAtUtc: string; messageCode?: string; message?: string }
export interface RouteList { items: RouteDto[]; page: number; pageSize: number; totalCount: number }
export type RouteFieldErrors = Partial<Record<keyof CreateRouteInput, string>>;

export class RouteApiError extends Error {
  constructor(public status: number, message: string, public errors: Record<string, string[]> = {}, public errorCode?: string) { super(message); this.name = 'RouteApiError'; }
}
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const positiveId = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const mode = (value: unknown): value is RouteTransportMode => transportModes.includes(value as RouteTransportMode);
const conflictMessages: Record<string, string> = {
  'Routes.DuplicateSubmission': 'This route creation has already been submitted. Check Routes List before retrying.',
  'Routes.DuplicateRoute': 'A route with these endpoints and transport mode already exists.',
};

export function validateRoute(input: CreateRouteInput): RouteFieldErrors {
  const errors: RouteFieldErrors = {};
  if (!input.fromPoiId) errors.fromPoiId = routeMessages.MSG01;
  if (!input.toPoiId) errors.toPoiId = routeMessages.MSG01;
  if (input.fromPoiId && input.fromPoiId === input.toPoiId) errors.toPoiId = routeMessages.MSG141;
  if (input.distanceKm === null) errors.distanceKm = routeMessages.MSG01;
  else if (!Number.isFinite(input.distanceKm) || input.distanceKm <= 0) errors.distanceKm = routeMessages.MSG143;
  else if (input.distanceKm > 9999.99 || Math.abs(input.distanceKm * 100 - Math.round(input.distanceKm * 100)) > 1e-8) errors.distanceKm = 'Enter up to 9,999.99 km with at most two decimal places.';
  if (input.estimatedDurationMinutes === null) errors.estimatedDurationMinutes = routeMessages.MSG01;
  else if (!Number.isFinite(input.estimatedDurationMinutes) || input.estimatedDurationMinutes <= 0) errors.estimatedDurationMinutes = routeMessages.MSG143;
  else if (!Number.isInteger(input.estimatedDurationMinutes) || input.estimatedDurationMinutes > 2147483647) errors.estimatedDurationMinutes = 'Enter a whole number of minutes up to 2,147,483,647.';
  if (!input.transportMode) errors.transportMode = routeMessages.MSG01;
  else if (!mode(input.transportMode)) errors.transportMode = 'Select a supported transport mode.';
  if ((input.routeNote?.length ?? 0) > 2000) errors.routeNote = 'Route Note cannot exceed 2,000 characters.';
  return errors;
}

async function request(path: string, init?: RequestInit): Promise<{ response: Response; body: unknown }> {
  let response: Response;
  try { response = await fetch(path, { ...init, credentials: 'same-origin', cache: 'no-store', signal: init?.signal ?? AbortSignal.timeout(30000) }); }
  catch { throw new RouteApiError(0, routeMessages.MSG127); }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const errorCode = record(body) && typeof body.errorCode === 'string' ? body.errorCode : undefined;
    const messageCode = record(body) && typeof body.messageCode === 'string' ? body.messageCode : errorCode;
    const errors: Record<string, string[]> = {};
    if (record(body) && record(body.errors)) for (const [field, messages] of Object.entries(body.errors)) {
      if (Array.isArray(messages) && messages.every(message => typeof message === 'string')) errors[field] = messages;
    }
    const known = messageCode && messageCode in routeMessages ? routeMessages[messageCode as keyof typeof routeMessages] : null;
    const validationMessage = Object.values(errors).flat().find(message => Object.values(routeMessages).includes(message as (typeof routeMessages)[keyof typeof routeMessages]));
    const conflict = response.status === 409 && errorCode && Object.hasOwn(conflictMessages, errorCode) ? conflictMessages[errorCode] : null;
    throw new RouteApiError(response.status, response.status === 403 ? routeMessages.MSG126 : known ?? conflict ?? validationMessage ?? routeMessages.MSG127, errors, errorCode);
  }
  return { response, body };
}

function isRoute(value: unknown): value is RouteDto {
  return record(value) && positiveId(value.id) && positiveId(value.fromPoiId) && positiveId(value.toPoiId) && value.fromPoiId !== value.toPoiId
    && typeof value.fromPoiName === 'string' && typeof value.toPoiName === 'string'
    && typeof value.distanceKm === 'number' && Number.isFinite(value.distanceKm) && value.distanceKm > 0
    && typeof value.estimatedDurationMinutes === 'number' && Number.isInteger(value.estimatedDurationMinutes) && value.estimatedDurationMinutes > 0
    && mode(value.transportMode) && ['Active', 'Inactive'].includes(String(value.status))
    && (value.routeNote === null || typeof value.routeNote === 'string') && typeof value.createdAtUtc === 'string';
}

export async function createRoute(input: CreateRouteInput, operationId: string): Promise<RouteDto> {
  const { response, body } = await request('/api/admin/routes', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': operationId }, body: JSON.stringify(input) });
  if (response.status !== 201 || !isRoute(body) || body.status !== 'Active' || body.messageCode !== 'MSG139') throw new RouteApiError(502, routeMessages.MSG127);
  return body;
}

export async function loadRouteOptions(signal?: AbortSignal): Promise<RouteOptions> {
  const { body } = await request('/api/admin/routes/options', { signal });
  if (!record(body) || !Array.isArray(body.pois) || !body.pois.every(poi => record(poi) && positiveId(poi.id) && typeof poi.name === 'string' && typeof poi.latitude === 'number' && Number.isFinite(poi.latitude) && Math.abs(poi.latitude) <= 90 && typeof poi.longitude === 'number' && Number.isFinite(poi.longitude) && Math.abs(poi.longitude) <= 180)
    || !Array.isArray(body.transportModes) || !body.transportModes.length || !body.transportModes.every(mode)) throw new RouteApiError(502, routeMessages.MSG127);
  return body as unknown as RouteOptions;
}

export async function loadRoutes(page = 1, signal?: AbortSignal): Promise<RouteList> {
  const { body } = await request(`/api/admin/routes?page=${page}&pageSize=20`, { signal });
  if (!record(body) || !Array.isArray(body.items) || !body.items.every(isRoute) || !positiveId(body.page) || !positiveId(body.pageSize) || typeof body.totalCount !== 'number' || !Number.isSafeInteger(body.totalCount) || body.totalCount < 0) throw new RouteApiError(502, routeMessages.MSG127);
  return body as unknown as RouteList;
}
