import { DEFAULT_PREFERENCES, TravelPreferencesData } from './travelPreferencesTypes';

const STORAGE_KEY_PREFIX = 'tripmate_travel_preferences_';

export function getPreferencesStorageKey(userId?: string | number | null): string {
  if (userId) {
    return `${STORAGE_KEY_PREFIX}${userId}`;
  }
  return `${STORAGE_KEY_PREFIX}guest`;
}

export function loadStoredPreferences(userId?: string | number | null): TravelPreferencesData {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  try {
    const key = getPreferencesStorageKey(userId);
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<TravelPreferencesData>;
    return {
      interests: Array.isArray(parsed.interests) ? parsed.interests : DEFAULT_PREFERENCES.interests,
      travelStyle: parsed.travelStyle ?? DEFAULT_PREFERENCES.travelStyle,
      budgetLevel: parsed.budgetLevel ?? DEFAULT_PREFERENCES.budgetLevel,
      preferredTransport: parsed.preferredTransport ?? DEFAULT_PREFERENCES.preferredTransport,
      travelPace: parsed.travelPace ?? DEFAULT_PREFERENCES.travelPace,
      foodPreference: parsed.foodPreference ?? DEFAULT_PREFERENCES.foodPreference,
      autoApplyToPlans: typeof parsed.autoApplyToPlans === 'boolean' ? parsed.autoApplyToPlans : DEFAULT_PREFERENCES.autoApplyToPlans,
      updatedAt: parsed.updatedAt ?? undefined,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveStoredPreferences(
  data: TravelPreferencesData,
  userId?: string | number | null,
): TravelPreferencesData {
  const updated: TravelPreferencesData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const key = getPreferencesStorageKey(userId);
      window.localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // Storage unavailable or quota exceeded; return in-memory object
    }
  }

  return updated;
}
