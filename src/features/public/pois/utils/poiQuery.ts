import type { PoiOrigin, PoiSearchState, PoiSort } from '../types/poi';

export const POI_PAGE_SIZE = 20;

const ALLOWED_PROXY_QUERY = new Set([
  'search',
  'categoryId',
  'originLatitude',
  'originLongitude',
  'maxDistanceKm',
  'openNow',
  'sort',
  'page',
  'pageSize',
]);

const POI_SORTS: PoiSort[] = ['name', 'distance', 'rating'];

function positiveInteger(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function sanitizeProxyQuery(input: URLSearchParams): URLSearchParams {
  const output = new URLSearchParams();
  input.forEach((value, key) => {
    if (ALLOWED_PROXY_QUERY.has(key)) output.append(key, value);
  });
  return output;
}

export function parsePoiSearchState(params: URLSearchParams): PoiSearchState {
  const rawSort = params.get('sort');
  return {
    search: (params.get('search') ?? '').trim(),
    categoryId: positiveInteger(params.get('categoryId')),
    openNow: params.get('openNow') === 'true',
    sort: POI_SORTS.includes(rawSort as PoiSort) ? (rawSort as PoiSort) : 'name',
    page: positiveInteger(params.get('page')) ?? 1,
  };
}

export function buildPoiQuery(state: PoiSearchState, origin: PoiOrigin = {}): URLSearchParams {
  const query = new URLSearchParams();
  const search = state.search.trim();
  const hasOrigin = Number.isFinite(origin.latitude) && Number.isFinite(origin.longitude);
  const safeSort = state.sort === 'distance' && !hasOrigin ? 'name' : state.sort;

  if (search) query.set('search', search);
  if (state.categoryId) query.set('categoryId', String(state.categoryId));
  if (state.openNow) query.set('openNow', 'true');
  query.set('sort', safeSort);
  query.set('page', String(Math.max(1, state.page)));
  query.set('pageSize', String(POI_PAGE_SIZE));

  if (hasOrigin) {
    query.set('originLatitude', origin.latitude!.toFixed(6));
    query.set('originLongitude', origin.longitude!.toFixed(6));
    if (origin.maxDistanceKm && origin.maxDistanceKm > 0) {
      query.set('maxDistanceKm', String(origin.maxDistanceKm));
    }
  }

  return query;
}

export function toPublicUrlParams(state: PoiSearchState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.search) params.set('search', state.search);
  if (state.categoryId) params.set('categoryId', String(state.categoryId));
  if (state.openNow) params.set('openNow', 'true');
  if (state.sort !== 'name') params.set('sort', state.sort);
  if (state.page > 1) params.set('page', String(state.page));
  return params;
}
