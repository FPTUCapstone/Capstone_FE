import { DEV_SEARCH_ERRORS, devTourSearchCopy } from '../resources/en';
import { isDevRecord, parseDevPagedTours, parseDevTourCategories } from './devTourContract';

async function request(path: string, signal?: AbortSignal): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(path, { signal, cache: 'no-store', headers: { Accept: 'application/json' } });
  } catch (error) {
    if ((error instanceof Error || error instanceof DOMException) && error.name === 'AbortError') throw error;
    throw new Error(devTourSearchCopy.unavailable);
  }
  let body: unknown;
  try { body = await response.json(); } catch { throw new Error(devTourSearchCopy.invalidResponse); }
  if (!response.ok) {
    const code = isDevRecord(body) && typeof body.errorCode === 'string' ? body.errorCode : '';
    throw new Error(Object.hasOwn(DEV_SEARCH_ERRORS, code) ? DEV_SEARCH_ERRORS[code] : response.status === 400 ? devTourSearchCopy.invalidFilters : devTourSearchCopy.requestFailed);
  }
  return body;
}

export async function searchDevTours(query: URLSearchParams, signal?: AbortSignal) {
  return parseDevPagedTours(await request(`/api/dev/tours/search${query.size ? `?${query}` : ''}`, signal));
}

export async function getDevTourCategories(signal?: AbortSignal) {
  return parseDevTourCategories(await request('/api/dev/tours/categories', signal));
}
