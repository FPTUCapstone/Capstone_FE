import 'server-only';

import { cookies } from 'next/headers';
import { fetchBackend } from '@/lib/server/backend';
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  clearAdminSession,
  jsonNoStore,
  verifyAdminSessionFromCookies,
} from '@/lib/server/adminSession';
import {
  parsePoiManagementResponse,
  PoiManagementApiError,
  serializePoiManagementQuery,
} from './poi-management-api';
import type { PoiManagementQuery } from '../types/poi-management';

const QUERY_KEYS = ['page', 'pageSize', 'search', 'categoryId', 'status'] as const;
type QueryKey = typeof QUERY_KEYS[number];

const CANONICAL_QUERY_KEYS = new Map<string, QueryKey>(
  QUERY_KEYS.map(key => [key.toLowerCase(), key]),
);

class InvalidManagementQuery extends Error {}

function positiveInteger(value: string, max: number): number {
  if (!/^[1-9]\d*$/.test(value)) throw new InvalidManagementQuery();
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > max) throw new InvalidManagementQuery();
  return parsed;
}

function managementQuery(request: Request): string {
  const rawValues = new Map<QueryKey, string>();
  for (const [rawKey, value] of new URL(request.url).searchParams) {
    const key = CANONICAL_QUERY_KEYS.get(rawKey.toLowerCase());
    if (!key) continue;
    if (rawValues.has(key)) throw new InvalidManagementQuery();
    rawValues.set(key, value);
  }

  const query: PoiManagementQuery = {};
  const page = rawValues.get('page');
  const pageSize = rawValues.get('pageSize');
  const categoryId = rawValues.get('categoryId');
  const status = rawValues.get('status');
  const search = rawValues.get('search');

  if (page !== undefined) query.page = positiveInteger(page, 2147483647);
  if (pageSize !== undefined) query.pageSize = positiveInteger(pageSize, 100);
  if (categoryId !== undefined) query.categoryId = positiveInteger(categoryId, 2147483647);
  if (status !== undefined) {
    if (status !== 'Active' && status !== 'Inactive') throw new InvalidManagementQuery();
    query.status = status;
  }
  if (search !== undefined) query.search = search;

  try {
    return serializePoiManagementQuery(query);
  } catch (error) {
    if (error instanceof PoiManagementApiError && error.status === 400) {
      throw new InvalidManagementQuery();
    }
    throw error;
  }
}

function accessRequired(status: 401 | 403) {
  return jsonNoStore({ errorCode: 'POI_MANAGEMENT_ACCESS_REQUIRED' }, status);
}

function unavailable() {
  return jsonNoStore({ errorCode: 'POI_MANAGEMENT_UNAVAILABLE' }, 503);
}

function safeValidationErrors(value: unknown): Record<string, string[]> {
  const safe: Record<string, string[]> = {};
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return safe;
  const errors = (value as Record<string, unknown>).errors;
  if (typeof errors !== 'object' || errors === null || Array.isArray(errors)) return safe;
  for (const [rawKey, messages] of Object.entries(errors)) {
    const key = CANONICAL_QUERY_KEYS.get(rawKey.toLowerCase());
    if (key && Array.isArray(messages) && messages.length > 0 &&
      messages.every(message => typeof message === 'string')) {
      safe[key] = ['Review this filter value.'];
    }
  }
  return safe;
}

async function readJson(response: Response): Promise<unknown | null> {
  return response.json().catch(() => null);
}

export async function proxyPoiManagementList(request: Request): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return accessRequired(401);

  const session = verifyAdminSessionFromCookies(cookieStore);
  if (!session) return clearAdminSession(accessRequired(401));
  if (session.role !== 'Administrator' && session.role !== 'Staff') return accessRequired(403);

  let query: string;
  try {
    query = managementQuery(request);
  } catch {
    return jsonNoStore({ errorCode: 'POI_MANAGEMENT_INVALID_QUERY' }, 400);
  }

  try {
    const upstream = await fetchBackend(`/api/v1/admin/pois${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: request.signal,
    });
    if (upstream.status === 401) return clearAdminSession(accessRequired(401));
    if (upstream.status === 403) return accessRequired(403);
    if (upstream.status === 400) {
      const body = await readJson(upstream);
      if (body === null || typeof body !== 'object' || Array.isArray(body)) return unavailable();
      const record = body as Record<string, unknown>;
      const errorCode = record.errorCode === 'POI_MANAGEMENT_CATEGORY_NOT_FOUND'
        ? 'POI_MANAGEMENT_CATEGORY_NOT_FOUND' : 'POI_MANAGEMENT_INVALID_QUERY';
      const errors = safeValidationErrors(body);
      return jsonNoStore({ errorCode, ...(Object.keys(errors).length ? { errors } : {}) }, 400);
    }
    if (upstream.status !== 200) return unavailable();

    const body = await readJson(upstream);
    if (body === null) return unavailable();
    try {
      return jsonNoStore(parsePoiManagementResponse(body));
    } catch {
      return unavailable();
    }
  } catch {
    return unavailable();
  }
}
