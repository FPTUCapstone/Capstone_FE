/** Small runtime guards for validating API bodies at the service boundary. */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Missing (`undefined`) or `null` passes; anything else must satisfy `check`. */
export function isOptional(value: unknown, check: (value: unknown) => boolean): boolean {
  return value === undefined || value === null || check(value);
}

export const isString = (value: unknown): value is string => typeof value === 'string';

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

/** Guard for a closed set of string values (an API enum). */
export function isOneOf<T extends string>(values: readonly T[]) {
  return (value: unknown): value is T => values.includes(value as T);
}
