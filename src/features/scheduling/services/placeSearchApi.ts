/**
 * Place search for the planning form (same sources as the mobile app):
 * - catalog places: GET /api/v1/points-of-interest/search (only POIs the planner can use);
 * - addresses: Mapbox Search Box (suggest → retrieve), only when a public Mapbox token is
 *   configured in NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.
 */

import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase } from '@/lib/authApi';
import { getMapboxPublicToken } from '@/lib/mapboxToken';

import { generateIdempotencyKey } from './schedulingApi';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface SelectablePoi extends GeoPoint {
  id: number;
  name: string;
  categoryName: string;
  address: string | null;
}

export interface AddressCandidate {
  id: string;
  name: string;
  fullAddress: string;
}

export interface ResolvedAddress extends GeoPoint {
  label: string;
}

export class PlaceSearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlaceSearchError';
  }
}

export async function searchSelectablePois(params: {
  query?: string;
  near?: GeoPoint | null;
  radiusKm?: number | null;
  pageSize?: number;
  /** Must-see places cannot be restaurants (Review 2, D2): the traveler adds food after generation. */
  excludeFoodAndDrink?: boolean;
}): Promise<SelectablePoi[]> {
  const search = new URLSearchParams({ page: '1', pageSize: String(params.pageSize ?? 30) });
  const query = params.query?.trim();
  if (query) search.set('query', query);
  if (params.excludeFoodAndDrink) search.set('excludeFoodAndDrink', 'true');
  if (params.near && params.radiusKm) {
    search.set('latitude', String(params.near.latitude));
    search.set('longitude', String(params.near.longitude));
    search.set('radiusKm', String(Math.round(params.radiusKm)));
  }

  const token = AuthStorage.getContext()?.accessToken;
  let response: Response;
  try {
    response = await fetch(`${getApiBase()}/points-of-interest/search?${search}`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new PlaceSearchError('Không thể kết nối máy chủ TripMate để tìm địa điểm.');
  }
  if (!response.ok) {
    throw new PlaceSearchError('Không tìm được địa điểm lúc này. Vui lòng thử lại.');
  }

  const body = (await response.json()) as { items?: unknown };
  const items = Array.isArray(body.items) ? body.items : [];
  return items.flatMap((raw) => {
    const item = raw as Record<string, unknown>;
    if (
      typeof item.id !== 'number' ||
      typeof item.name !== 'string' ||
      typeof item.latitude !== 'number' ||
      typeof item.longitude !== 'number'
    ) {
      return [];
    }
    return [{
      id: item.id,
      name: item.name,
      categoryName: typeof item.categoryName === 'string' ? item.categoryName : '',
      address: typeof item.address === 'string' ? item.address : null,
      latitude: item.latitude,
      longitude: item.longitude,
    }];
  });
}

const MAPBOX_BASE = 'https://api.mapbox.com/search/searchbox/v1';


export function isAddressSearchAvailable(): boolean {
  return getMapboxPublicToken() !== null;
}

/** Groups suggest calls and the final retrieve into one Mapbox session (billing unit). */
export function createAddressSession(): string {
  return generateIdempotencyKey();
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

// Mapbox leaves the ward out of the address in Vietnam ("Đào Tấn, Đà Nẵng, 50500"); put the
// ward from `context` back after the street so branches of one chain can be told apart.
function addressOf(feature: Record<string, unknown>): string | null {
  const address = text(feature.full_address) ?? text(feature.place_formatted);
  const context = feature.context as Record<string, Record<string, unknown> | undefined> | undefined;
  const ward = text(context?.neighborhood?.name) ?? text(context?.locality?.name);
  if (!address || !ward || address.includes(ward)) return address;
  const separator = address.indexOf(', ');
  return separator < 0
    ? `${address}, ${ward}`
    : `${address.slice(0, separator)}, ${ward}${address.slice(separator)}`;
}

export async function suggestAddresses(
  query: string,
  sessionToken: string,
  near?: GeoPoint | null,
): Promise<AddressCandidate[]> {
  const token = getMapboxPublicToken();
  if (!token || !query.trim()) return [];
  const search = new URLSearchParams({
    q: query.trim(),
    access_token: token,
    session_token: sessionToken,
    country: 'vn',
    language: 'vi',
    limit: '8',
  });
  if (near) search.set('proximity', `${near.longitude},${near.latitude}`);

  let response: Response;
  try {
    response = await fetch(`${MAPBOX_BASE}/suggest?${search}`);
  } catch {
    throw new PlaceSearchError('Không thể tìm địa chỉ lúc này.');
  }
  if (!response.ok) throw new PlaceSearchError('Không thể tìm địa chỉ lúc này.');

  const body = (await response.json()) as { suggestions?: unknown };
  const suggestions = Array.isArray(body.suggestions) ? body.suggestions : [];
  return suggestions.flatMap((raw) => {
    const item = raw as Record<string, unknown>;
    // Categories and brands stand for many places, not one location.
    if (item.feature_type === 'category' || item.feature_type === 'brand') return [];
    const id = text(item.mapbox_id);
    const name = text(item.name);
    if (!id || !name) return [];
    return [{ id, name, fullAddress: addressOf(item) ?? name }];
  });
}

export async function retrieveAddress(
  candidate: AddressCandidate,
  sessionToken: string,
): Promise<ResolvedAddress> {
  const token = getMapboxPublicToken();
  if (!token) throw new PlaceSearchError('Tìm địa chỉ chưa được cấu hình.');
  const search = new URLSearchParams({ access_token: token, session_token: sessionToken, language: 'vi' });

  let response: Response;
  try {
    response = await fetch(`${MAPBOX_BASE}/retrieve/${encodeURIComponent(candidate.id)}?${search}`);
  } catch {
    throw new PlaceSearchError('Không lấy được vị trí của địa chỉ này.');
  }
  if (!response.ok) throw new PlaceSearchError('Không lấy được vị trí của địa chỉ này.');

  const body = (await response.json()) as { features?: unknown };
  const feature = (Array.isArray(body.features) ? body.features[0] : null) as
    | { geometry?: { coordinates?: unknown }; properties?: Record<string, unknown> }
    | null;
  const coordinates = feature?.geometry?.coordinates;
  if (
    !Array.isArray(coordinates) ||
    typeof coordinates[0] !== 'number' ||
    typeof coordinates[1] !== 'number'
  ) {
    throw new PlaceSearchError('Địa chỉ này không có vị trí.');
  }
  const address = addressOf(feature?.properties ?? {}) ?? candidate.fullAddress;
  return {
    label: address.startsWith(candidate.name) ? address : `${candidate.name}, ${address}`,
    // GeoJSON points are [longitude, latitude].
    latitude: coordinates[1],
    longitude: coordinates[0],
  };
}

/** Browser location; rejects with a Vietnamese message the form can show. */
export function getBrowserLocation(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new PlaceSearchError('Trình duyệt không hỗ trợ lấy vị trí. Hãy chọn một địa điểm.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      (error) => reject(new PlaceSearchError(
        error.code === error.PERMISSION_DENIED
          ? 'Bạn chưa cho phép truy cập vị trí. Hãy chọn một địa điểm.'
          : 'Không lấy được vị trí hiện tại. Hãy chọn một địa điểm.',
      )),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  });
}
