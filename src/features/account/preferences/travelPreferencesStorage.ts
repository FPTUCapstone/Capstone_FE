import {
  DEFAULT_PREFERENCES,
  isBudgetLevelId,
  isFoodPreferenceId,
  isPreferredTransportId,
  isTravelInterestId,
  isTravelPaceId,
  isTravelStyleId,
  TravelInterestId,
  TravelPreferencesData,
} from './travelPreferencesTypes';

export class LocalPreferencesStorageError extends Error {
  readonly code = 'LOCAL_PREFERENCES_STORAGE_FAILED';

  constructor(message = 'Không thể lưu sở thích trên thiết bị này.') {
    super(message);
    this.name = 'LocalPreferencesStorageError';
    Object.setPrototypeOf(this, LocalPreferencesStorageError.prototype);
  }
}

const STORAGE_KEY_PREFIX = 'tripmate_travel_preferences_';

export function getPreferencesStorageKey(userId?: string | number | null): string {
  if (userId) {
    return `${STORAGE_KEY_PREFIX}${userId}`;
  }
  return `${STORAGE_KEY_PREFIX}guest`;
}

export function sanitizeInterests(raw: unknown): TravelInterestId[] {
  if (!Array.isArray(raw)) {
    return [...DEFAULT_PREFERENCES.interests];
  }

  // If intentionally stored as an empty array, preserve []
  if (raw.length === 0) {
    return [];
  }

  // Filter to valid IDs and deduplicate while preserving order
  const validIds: TravelInterestId[] = [];
  const seen = new Set<TravelInterestId>();

  for (const item of raw) {
    if (isTravelInterestId(item) && !seen.has(item)) {
      seen.add(item);
      validIds.push(item);
    }
  }

  // For a non-empty corrupted list where no valid interests remain:
  // fallback to DEFAULT_PREFERENCES.interests
  if (validIds.length === 0) {
    return [...DEFAULT_PREFERENCES.interests];
  }

  return validIds;
}

export function sanitizePreferences(parsed: unknown): TravelPreferencesData {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      ...DEFAULT_PREFERENCES,
      interests: [...DEFAULT_PREFERENCES.interests],
    };
  }

  const record = parsed as Record<string, unknown>;

  const interests = sanitizeInterests(record.interests);

  const travelStyle = isTravelStyleId(record.travelStyle)
    ? record.travelStyle
    : DEFAULT_PREFERENCES.travelStyle;

  const budgetLevel = isBudgetLevelId(record.budgetLevel)
    ? record.budgetLevel
    : DEFAULT_PREFERENCES.budgetLevel;

  const preferredTransport = isPreferredTransportId(record.preferredTransport)
    ? record.preferredTransport
    : DEFAULT_PREFERENCES.preferredTransport;

  const travelPace = isTravelPaceId(record.travelPace)
    ? record.travelPace
    : DEFAULT_PREFERENCES.travelPace;

  const foodPreference = isFoodPreferenceId(record.foodPreference)
    ? record.foodPreference
    : DEFAULT_PREFERENCES.foodPreference;

  const autoApplyToPlans =
    typeof record.autoApplyToPlans === 'boolean'
      ? record.autoApplyToPlans
      : DEFAULT_PREFERENCES.autoApplyToPlans;

  const updatedAt =
    typeof record.updatedAt === 'string' && record.updatedAt.trim().length > 0
      ? record.updatedAt
      : undefined;

  const sanitized: TravelPreferencesData = {
    interests,
    travelStyle,
    budgetLevel,
    preferredTransport,
    travelPace,
    foodPreference,
    autoApplyToPlans,
  };

  if (updatedAt) {
    sanitized.updatedAt = updatedAt;
  }

  return sanitized;
}

export function loadStoredPreferences(userId?: string | number | null): TravelPreferencesData {
  if (typeof window === 'undefined') {
    return {
      ...DEFAULT_PREFERENCES,
      interests: [...DEFAULT_PREFERENCES.interests],
    };
  }

  try {
    const key = getPreferencesStorageKey(userId);
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return {
        ...DEFAULT_PREFERENCES,
        interests: [...DEFAULT_PREFERENCES.interests],
      };
    }

    const parsed: unknown = JSON.parse(raw);
    return sanitizePreferences(parsed);
  } catch {
    return {
      ...DEFAULT_PREFERENCES,
      interests: [...DEFAULT_PREFERENCES.interests],
    };
  }
}

export function saveStoredPreferences(
  data: TravelPreferencesData,
  userId?: string | number | null,
): TravelPreferencesData {
  const updated: TravelPreferencesData = {
    ...sanitizePreferences(data),
    updatedAt: new Date().toISOString(),
  };

  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('Storage unavailable');
    }
    const key = getPreferencesStorageKey(userId);
    window.localStorage.setItem(key, JSON.stringify(updated));
  } catch (err: unknown) {
    if (err instanceof LocalPreferencesStorageError) {
      throw err;
    }
    throw new LocalPreferencesStorageError(
      'Không thể lưu sở thích trên thiết bị này. Vui lòng kiểm tra dung lượng hoặc quyền lưu trữ của trình duyệt rồi thử lại.',
    );
  }

  return updated;
}
