import { AuthStorage } from '@/features/auth/session/authSession';
import {
  LocalPreferencesStorageError,
  loadStoredPreferences,
  saveStoredPreferences,
} from './travelPreferencesStorage';
import { DEFAULT_PREFERENCES, TravelPreferencesData } from './travelPreferencesTypes';

export { LocalPreferencesStorageError };

export interface UpdatePreferencesResult {
  success: boolean;
  messageCode: 'LOCAL_DEVICE_PREFERENCES';
  message: string;
  notice: string;
  preferences: TravelPreferencesData;
  storageMode: 'LOCAL_DEVICE_PREFERENCES';
  integrationStatus: 'PENDING_BE_INTEGRATION';
}

/**
 * UC-09 Get Travel Preferences
 *
 * ⚠️ PENDING_BE_INTEGRATION:
 * The backend endpoint GET /api/v1/traveler/preferences is NOT YET IMPLEMENTED in Capstone_BE.
 * In accordance with TripMate integration policy, phantom HTTP calls are omitted.
 * Preferences are loaded from local device storage (LOCAL_DEVICE_PREFERENCES)
 * to allow client-side preference customization and UC-10 plan prefilling.
 */
export async function getTravelPreferences(options?: {
  accessToken?: string;
  userId?: string | number | null;
}): Promise<TravelPreferencesData> {
  const context = AuthStorage.getContext();
  const userId = options?.userId ?? context?.userId;

  return loadStoredPreferences(userId);
}

/**
 * UC-09 Update Travel Preferences
 *
 * ⚠️ PENDING_BE_INTEGRATION:
 * The backend endpoint PUT /api/v1/traveler/preferences is NOT YET IMPLEMENTED in Capstone_BE.
 * In accordance with TripMate integration policy, phantom HTTP calls are omitted.
 * Preferences are saved locally on the device (LOCAL_DEVICE_PREFERENCES).
 * They are immediately available for UC-10 scheduling requests while server sync is pending.
 */
export async function updateTravelPreferences(
  payload: TravelPreferencesData,
  options?: { accessToken?: string; userId?: string | number | null },
): Promise<UpdatePreferencesResult> {
  const context = AuthStorage.getContext();
  const userId = options?.userId ?? context?.userId;

  const saved = saveStoredPreferences(payload, userId);

  return {
    success: true,
    messageCode: 'LOCAL_DEVICE_PREFERENCES',
    message: 'Sở thích du lịch đã được lưu trên thiết bị này.',
    notice: 'Đồng bộ sở thích du lịch với máy chủ đang chờ tích hợp.',
    preferences: saved,
    storageMode: 'LOCAL_DEVICE_PREFERENCES',
    integrationStatus: 'PENDING_BE_INTEGRATION',
  };
}

export function resetTravelPreferences(userId?: string | number | null): TravelPreferencesData {
  return saveStoredPreferences(DEFAULT_PREFERENCES, userId);
}
