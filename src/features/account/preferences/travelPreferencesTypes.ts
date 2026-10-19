/**
 * UC-09 Update Travel Preferences — Web contract (Capstone_BE/specs/UC-09-spec.md v3).
 * Option keys are English and come from the backend; labels live in ./resources (D-01, D-W2).
 */

export const PREFERRED_TRANSPORT_MODES = ['Walking', 'Motorbike', 'Car', 'PublicTransit'] as const;
export const TRAVEL_PACES = ['Relaxed', 'Moderate', 'Fast'] as const;
export const RISK_TOLERANCES = ['Low', 'Medium', 'High'] as const;
export const FOOD_PREFERENCES = ['NoRestriction', 'Vegetarian', 'Vegan', 'Halal', 'NoSeafood'] as const;

export type PreferredTransportMode = (typeof PREFERRED_TRANSPORT_MODES)[number];
export type TravelPace = (typeof TRAVEL_PACES)[number];
export type RiskTolerance = (typeof RISK_TOLERANCES)[number];
export type FoodPreference = (typeof FOOD_PREFERENCES)[number];

export const FOOD_NO_RESTRICTION: FoodPreference = 'NoRestriction';
export const MAX_INTERESTS = 10;

/** Backend error codes (spec §7.2). Visible text comes from the message catalog (D-04). */
export const PREFERENCE_ERROR_CODES = {
  invalidOption: 'TRAVEL_PREFERENCES.INVALID_OPTION',
  tooManyInterests: 'TRAVEL_PREFERENCES.TOO_MANY_INTERESTS',
  foodNoRestrictionExclusive: 'TRAVEL_PREFERENCES.FOOD_NO_RESTRICTION_EXCLUSIVE',
  valueTooLong: 'TRAVEL_PREFERENCES.VALUE_TOO_LONG',
  forbidden: 'TRAVEL_PREFERENCES.FORBIDDEN',
} as const;

export type PreferenceErrorCode = (typeof PREFERENCE_ERROR_CODES)[keyof typeof PREFERENCE_ERROR_CODES];

export const PREFERENCE_FIELDS = [
  'interests',
  'preferredTransportMode',
  'travelPace',
  'riskTolerance',
  'foodPreferences',
] as const;

export type PreferenceField = (typeof PREFERENCE_FIELDS)[number];

/** Field → error code. Values are backend codes, never display text. */
export type PreferenceFieldErrors = Partial<Record<PreferenceField, string>>;

export interface InterestOption {
  key: string;
  source: 'Category' | 'Tag';
}

export interface TravelPreferenceOptions {
  interests: InterestOption[];
  preferredTransportModes: PreferredTransportMode[];
  travelPaces: TravelPace[];
  foodPreferences: FoodPreference[];
  riskTolerances: RiskTolerance[];
}

export interface TravelPreferences {
  interests: string[];
  preferredTransportMode: PreferredTransportMode | null;
  travelPace: TravelPace | null;
  riskTolerance: RiskTolerance | null;
  foodPreferences: FoodPreference[];
  updatedAtUtc: string | null;
}

/** Body of PUT /api/v1/traveler/preferences: the complete state, never partial. */
export type TravelPreferencesPayload = Omit<TravelPreferences, 'updatedAtUtc'>;

export const EMPTY_PREFERENCES: TravelPreferences = Object.freeze({
  interests: [],
  preferredTransportMode: null,
  travelPace: null,
  riskTolerance: null,
  foodPreferences: [],
  updatedAtUtc: null,
}) as TravelPreferences;

export class PreferencesContractError extends Error {
  constructor(detail: string) {
    super(`PREFERENCES_CONTRACT: ${detail}`);
    this.name = 'PreferencesContractError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function includes<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (values as readonly string[]).includes(value);
}

function requireStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new PreferencesContractError(`${field} must be a string array`);
  }
  return value as string[];
}

function requireKeyArray<T extends string>(value: unknown, allowed: readonly T[], field: string): T[] {
  const items = requireStringArray(value, field);
  if (!items.every((item) => includes(allowed, item))) {
    throw new PreferencesContractError(`${field} contains an unknown key`);
  }
  return items as T[];
}

function optionalKey<T extends string>(value: unknown, allowed: readonly T[], field: string): T | null {
  if (value === null || value === undefined) return null;
  if (!includes(allowed, value)) {
    throw new PreferencesContractError(`${field} is not a known key`);
  }
  return value;
}

/** Strictly parses GET /api/v1/traveler/preferences/options. */
export function parseTravelPreferenceOptions(value: unknown): TravelPreferenceOptions {
  if (!isRecord(value)) throw new PreferencesContractError('options must be an object');

  if (!Array.isArray(value.interests)) throw new PreferencesContractError('interests must be an array');
  const interests = value.interests.map((item): InterestOption => {
    if (
      !isRecord(item) ||
      typeof item.key !== 'string' ||
      item.key.trim() === '' ||
      (item.source !== 'Category' && item.source !== 'Tag')
    ) {
      throw new PreferencesContractError('interest option is malformed');
    }
    return { key: item.key, source: item.source };
  });

  return {
    interests,
    preferredTransportModes: requireKeyArray(value.preferredTransportModes, PREFERRED_TRANSPORT_MODES, 'preferredTransportModes'),
    travelPaces: requireKeyArray(value.travelPaces, TRAVEL_PACES, 'travelPaces'),
    foodPreferences: requireKeyArray(value.foodPreferences, FOOD_PREFERENCES, 'foodPreferences'),
    riskTolerances: requireKeyArray(value.riskTolerances, RISK_TOLERANCES, 'riskTolerances'),
  };
}

/** Strictly parses GET/PUT /api/v1/traveler/preferences responses. Optional fields accept null. */
export function parseTravelPreferences(value: unknown): TravelPreferences {
  if (!isRecord(value)) throw new PreferencesContractError('preferences must be an object');

  const updatedAt = value.updatedAtUtc;
  if (updatedAt !== null && updatedAt !== undefined && (typeof updatedAt !== 'string' || Number.isNaN(Date.parse(updatedAt)))) {
    throw new PreferencesContractError('updatedAtUtc must be an ISO timestamp or null');
  }

  return {
    interests: requireStringArray(value.interests, 'interests'),
    preferredTransportMode: optionalKey(value.preferredTransportMode, PREFERRED_TRANSPORT_MODES, 'preferredTransportMode'),
    travelPace: optionalKey(value.travelPace, TRAVEL_PACES, 'travelPace'),
    riskTolerance: optionalKey(value.riskTolerance, RISK_TOLERANCES, 'riskTolerance'),
    foodPreferences: requireKeyArray(value.foodPreferences, FOOD_PREFERENCES, 'foodPreferences'),
    updatedAtUtc: typeof updatedAt === 'string' ? updatedAt : null,
  };
}

/** Builds the complete PUT body from a draft (empty → [] / null). */
export function toPayload(draft: TravelPreferences): TravelPreferencesPayload {
  return {
    interests: [...draft.interests],
    preferredTransportMode: draft.preferredTransportMode,
    travelPace: draft.travelPace,
    riskTolerance: draft.riskTolerance,
    foodPreferences: [...draft.foodPreferences],
  };
}

/** Client-side mirror of the backend rules for early feedback; the backend stays authoritative. */
export function validatePreferencesDraft(draft: TravelPreferencesPayload): PreferenceFieldErrors {
  const errors: PreferenceFieldErrors = {};

  if (new Set(draft.interests).size > MAX_INTERESTS) {
    errors.interests = PREFERENCE_ERROR_CODES.tooManyInterests;
  }

  if (draft.foodPreferences.includes(FOOD_NO_RESTRICTION) && new Set(draft.foodPreferences).size > 1) {
    errors.foodPreferences = PREFERENCE_ERROR_CODES.foodNoRestrictionExclusive;
  }

  return errors;
}

/** Order-insensitive comparison used for dirty tracking. */
export function samePreferences(a: TravelPreferencesPayload, b: TravelPreferencesPayload): boolean {
  const sameSet = (x: readonly string[], y: readonly string[]) =>
    x.length === y.length && x.every((item) => y.includes(item));
  return (
    sameSet(a.interests, b.interests) &&
    sameSet(a.foodPreferences, b.foodPreferences) &&
    a.preferredTransportMode === b.preferredTransportMode &&
    a.travelPace === b.travelPace &&
    a.riskTolerance === b.riskTolerance
  );
}
