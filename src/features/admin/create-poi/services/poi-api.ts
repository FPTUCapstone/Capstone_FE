import type { CatalogueOption, CreatePoiRequest, PoiCatalogue, PoiResponse } from '../types/poi';

export class PoiApiError extends Error {
  constructor(public status: number, message: string, public errors: Record<string, string[]> = {}, public existingPoiId?: number, public errorCode?: string) { super(message); }
}

function messageFor(status: number): string {
  switch (status) {
    case 400: return 'Some fields need attention. Review the highlighted fields.';
    case 401: return 'Your session has expired. Sign in again to continue.';
    case 403: return 'An active Administrator account is required.';
    case 404: return 'The selected category or tags are no longer available. Reload the catalogue and review your selections.';
    case 409: return 'An active POI with the same name and coordinates already exists.';
    default: return 'The save could not be confirmed. Check whether the POI was created before trying again.';
  }
}

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

async function request(path: string, init?: RequestInit): Promise<{ response: Response; body: unknown }> {
  let response: Response;
  try { response = await fetch(path, { ...init, cache: 'no-store', credentials: 'same-origin', signal: init?.signal ?? AbortSignal.timeout(30000) }); }
  catch { throw new PoiApiError(0, messageFor(0)); }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const errorCode = record(body) && typeof body.errorCode === 'string' ? body.errorCode : undefined;
    const errors: Record<string, string[]> = {};
    if (response.status === 400 && record(body) && record(body.errors)) {
      for (const [key, messages] of Object.entries(body.errors)) {
        if (Array.isArray(messages) && messages.every(m => typeof m === 'string')) errors[key] = messages;
      }
    }
    const id = record(body) && typeof body.existingPoiId === 'number' && Number.isSafeInteger(body.existingPoiId) && body.existingPoiId > 0 ? body.existingPoiId : undefined;
    throw new PoiApiError(response.status, response.status === 404 && errorCode !== 'Poi.ReferenceNotFound' ? 'The POI service endpoint is unavailable. Contact your administrator.' : messageFor(response.status), errors, id, errorCode);
  }
  return { response, body };
}

export async function createPoi(dto: CreatePoiRequest): Promise<PoiResponse> {
  const { response, body } = await request('/api/admin/pois', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) });
  if (response.status !== 201 || !record(body) || typeof body.id !== 'number' || !Number.isSafeInteger(body.id) || body.id <= 0 || typeof body.name !== 'string' || !body.name.trim() || !['Active', 'Inactive'].includes(String(body.status))) throw new PoiApiError(502, messageFor(502));
  return body as unknown as PoiResponse;
}

export async function loadCatalogue(signal?: AbortSignal): Promise<PoiCatalogue> {
  let body: unknown;
  try { ({ body } = await request('/api/admin/pois/catalogue', { signal })); }
  catch (error) {
    if (error instanceof PoiApiError && (error.status === 0 || error.status >= 500)) throw new PoiApiError(error.status, 'The catalogue could not be loaded. Please reload it or try again later.');
    throw error;
  }
  const options = (value: unknown): value is CatalogueOption[] => Array.isArray(value) && value.every(v => record(v) && typeof v.id === 'number' && Number.isInteger(v.id) && v.id > 0 && typeof v.name === 'string');
  if (!record(body) || !options(body.categories) || !options(body.tags)) throw new PoiApiError(502, 'The catalogue response could not be read. Please try reloading it.');
  return { categories: body.categories, tags: body.tags };
}
