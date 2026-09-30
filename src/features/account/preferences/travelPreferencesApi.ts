import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase, type ApiError } from '@/lib/authApi';
import { loadStoredPreferences, saveStoredPreferences } from './travelPreferencesStorage';
import { DEFAULT_PREFERENCES, TravelPreferencesData } from './travelPreferencesTypes';

export interface UpdatePreferencesResult {
  success: boolean;
  messageCode: string;
  message: string;
  preferences: TravelPreferencesData;
  isSimulatedFallback?: boolean;
}

/**
 * UC-09 Get Travel Preferences
 *
 * ⚠️ PENDING_BE_INTEGRATION:
 * The backend endpoint GET /api/v1/traveler/preferences is NOT YET IMPLEMENTED in Capstone_BE.
 * When the backend endpoint is deployed, this function calls it with Bearer token.
 * In the interim, it falls back seamlessly to client-side scoped preferences storage.
 */
export async function getTravelPreferences(options?: {
  accessToken?: string;
  userId?: string | number | null;
}): Promise<TravelPreferencesData> {
  const context = AuthStorage.getContext();
  const userId = options?.userId ?? context?.userId;
  const token = options?.accessToken ?? context?.accessToken;
  const API_BASE = getApiBase();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/traveler/preferences`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });

    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      const preferences = (data.data ?? data) as TravelPreferencesData;
      saveStoredPreferences(preferences, userId);
      return preferences;
    }
  } catch {
    // Network or server unreachable; proceed to fallback
  }

  return loadStoredPreferences(userId);
}

/**
 * UC-09 Update Travel Preferences
 *
 * ⚠️ PENDING_BE_INTEGRATION:
 * The backend endpoint PUT /api/v1/traveler/preferences is NOT YET IMPLEMENTED in Capstone_BE.
 * This client provides the canonical contract derived from SRS §3.2.9 and database table dbo.TravelerProfiles.
 *
 * If backend returns 404 or fails to respond, a graceful simulated fallback is returned
 * and local scoped preferences are persisted so UI flows and subsequent trip planning work immediately.
 */
export async function updateTravelPreferences(
  payload: TravelPreferencesData,
  options?: { accessToken?: string; userId?: string | number | null },
): Promise<UpdatePreferencesResult> {
  const context = AuthStorage.getContext();
  const userId = options?.userId ?? context?.userId;
  const token = options?.accessToken ?? context?.accessToken;
  const API_BASE = getApiBase();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response | null = null;
  try {
    res = await fetch(`${API_BASE}/traveler/preferences`, {
      method: 'PUT',
      credentials: 'include',
      headers,
      body: JSON.stringify(payload),
    });
  } catch {
    // Network failure -> proceed to fallback
  }

  if (res && res.ok) {
    let responseBody: Record<string, unknown> = {};
    try {
      responseBody = (await res.json()) as Record<string, unknown>;
    } catch {
      // non-JSON
    }

    const updated = ((responseBody.data as TravelPreferencesData) ?? payload) as TravelPreferencesData;
    saveStoredPreferences(updated, userId);

    return {
      success: true,
      messageCode: 'MSG21',
      message: 'Sở thích du lịch đã được lưu thành công. TripMate sẽ cá nhân hóa gợi ý cho bạn!',
      preferences: updated,
      isSimulatedFallback: false,
    };
  }

  // Handle BE validation or business rule errors if endpoint exists and rejected
  if (res && !res.ok && res.status !== 404 && res.status !== 501) {
    let body: Record<string, unknown> = {};
    try {
      body = (await res.json()) as Record<string, unknown>;
    } catch {
      // non-JSON
    }

    const errorCode = (body.errorCode as string) ?? (body.code as string) ?? undefined;
    const title = (body.message as string) ?? (body.title as string) ?? undefined;
    const rawErrors = body.errors as Record<string, string | string[]> | undefined;
    let fieldErrors: Record<string, string> | undefined;

    if (rawErrors && typeof rawErrors === 'object') {
      fieldErrors = Object.fromEntries(
        Object.entries(rawErrors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
      );
    }

    throw {
      code: errorCode,
      message: title,
      errors: fieldErrors,
      status: res.status,
    } satisfies ApiError;
  }

  // Graceful fallback for 404 / 501 / Network unreachable (PENDING_BE_INTEGRATION)
  const saved = saveStoredPreferences(payload, userId);

  return {
    success: true,
    messageCode: 'MSG21',
    message: 'Sở thích du lịch đã được lưu thành công. TripMate sẽ cá nhân hóa gợi ý cho bạn!',
    preferences: saved,
    isSimulatedFallback: true,
  };
}

export function resetTravelPreferences(userId?: string | number | null): TravelPreferencesData {
  return saveStoredPreferences(DEFAULT_PREFERENCES, userId);
}
