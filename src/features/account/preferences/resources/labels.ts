import type { FoodPreference, PreferredTransportMode, RiskTolerance, TravelPace } from '../travelPreferencesTypes';

/**
 * English display labels for UC-09 option keys (D-W2). The shared preference catalogue uses
 * English across Web, Mobile, and the backend. Labels are presentation only and are never sent
 * to the backend; unknown keys fall back to the key itself.
 */
export const transportLabels: Record<PreferredTransportMode, string> = {
  Walking: 'Walking',
  Motorbike: 'Motorbike',
  Car: 'Car / Taxi',
  PublicTransit: 'Public transit',
};

export const paceLabels: Record<TravelPace, string> = {
  Relaxed: 'Relaxed',
  Moderate: 'Moderate',
  Fast: 'Fast',
};

export const riskLabels: Record<RiskTolerance, string> = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
};

export const foodLabels: Record<FoodPreference, string> = {
  NoRestriction: 'No restriction',
  Vegetarian: 'Vegetarian',
  Vegan: 'Vegan',
  Halal: 'Halal',
  NoSeafood: 'No seafood',
};

/** Interest keys are already the canonical English catalogue labels. */
export function interestLabel(key: string): string {
  return key;
}

export function optionLabel<K extends string>(labels: Record<K, string>, key: K): string {
  return labels[key] ?? key;
}
