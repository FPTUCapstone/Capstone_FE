export interface AlgorithmParameters {
  bufferTimeMinutes: number;
  defaultTravelSpeedKmh: number;
  reroutingSearchRadiusKm: number;
  weatherAlertThresholdSeverity: string;
}
export interface AlgorithmConfig extends AlgorithmParameters {
  updatedAtUtc: string | null;
  updatedAtLocal: string | null;
}
export const CONFIG_MESSAGES = {
  success: 'Algorithm parameters (buffer time, default travel speed, rerouting search radius, and weather thresholds) updated successfully.',
  invalid: 'Parameter value out of allowed range (e.g., buffer time must be 5-60 mins).',
  forbidden: 'You do not have permission to access this function.',
  unavailable: 'TripMate is temporarily unable to process your request. Please check your connection and try again.',
};
export const WEATHER_SEVERITIES = ['Moderate', 'Severe', 'Extreme'] as const;
export function validateParameters(value: AlgorithmParameters): Partial<Record<keyof AlgorithmParameters, string>> {
  const errors: Partial<Record<keyof AlgorithmParameters, string>> = {};
  if (!Number.isInteger(value.bufferTimeMinutes) || value.bufferTimeMinutes < 5 || value.bufferTimeMinutes > 60) errors.bufferTimeMinutes = CONFIG_MESSAGES.invalid;
  if (!Number.isFinite(value.defaultTravelSpeedKmh) || value.defaultTravelSpeedKmh < 10 || value.defaultTravelSpeedKmh > 120) errors.defaultTravelSpeedKmh = CONFIG_MESSAGES.invalid;
  if (!Number.isFinite(value.reroutingSearchRadiusKm) || value.reroutingSearchRadiusKm < 1 || value.reroutingSearchRadiusKm > 50) errors.reroutingSearchRadiusKm = CONFIG_MESSAGES.invalid;
  if (!WEATHER_SEVERITIES.some(severity => severity === value.weatherAlertThresholdSeverity)) errors.weatherAlertThresholdSeverity = CONFIG_MESSAGES.invalid;
  return errors;
}
export function isAlgorithmConfig(value: unknown): value is AlgorithmConfig {
  if (!value || typeof value !== 'object') return false;
  const data = value as AlgorithmConfig;
  return typeof data.bufferTimeMinutes === 'number' && typeof data.defaultTravelSpeedKmh === 'number' &&
    typeof data.reroutingSearchRadiusKm === 'number' && Object.keys(validateParameters(data)).length === 0 &&
    (data.updatedAtUtc === null || (typeof data.updatedAtUtc === 'string' && Number.isFinite(Date.parse(data.updatedAtUtc)))) &&
    (data.updatedAtLocal === null || (typeof data.updatedAtLocal === 'string' && /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/.test(data.updatedAtLocal)));
}
