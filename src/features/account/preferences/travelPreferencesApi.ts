import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase } from '@/lib/authApi';

import {
  PREFERENCE_FIELDS,
  PreferencesContractError,
  parseTravelPreferenceOptions,
  parseTravelPreferences,
  type PreferenceField,
  type PreferenceFieldErrors,
  type TravelPreferenceOptions,
  type TravelPreferences,
  type TravelPreferencesPayload,
} from './travelPreferencesTypes';

/**
 * UC-09 API client. Follows the existing Traveler Web pattern (D-W1): the browser calls the
 * backend with the in-memory access token from AuthStorage. Nothing is cached in browser storage.
 */
export type PreferencesFailureKind = 'sessionExpired' | 'forbidden' | 'validation' | 'failure';

export type PreferencesResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      kind: PreferencesFailureKind;
      /** Field → backend error code (validation only). */
      fieldErrors?: PreferenceFieldErrors;
      /** Error code not tied to a known field (validation only). */
      formErrorCode?: string;
    };

const ROUTE = '/traveler/preferences';

function isPreferenceField(value: unknown): value is PreferenceField {
  return typeof value === 'string' && (PREFERENCE_FIELDS as readonly string[]).includes(value);
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/**
 * Maps both backend 400 shapes (spec §6.5): ValidationProblemDetails whose `errors[field]`
 * values are error codes, and ProblemDetails with `errorCode` + `field`.
 */
function readValidationErrors(body: unknown): { fieldErrors: PreferenceFieldErrors; formErrorCode?: string } {
  const fieldErrors: PreferenceFieldErrors = {};
  let formErrorCode: string | undefined;

  if (typeof body === 'object' && body !== null) {
    const record = body as Record<string, unknown>;
    const errors = record.errors;
    if (typeof errors === 'object' && errors !== null) {
      for (const [field, value] of Object.entries(errors as Record<string, unknown>)) {
        const first = Array.isArray(value) ? value.find((item) => typeof item === 'string') : value;
        const code = typeof first === 'string' ? first : undefined;
        if (isPreferenceField(field)) {
          fieldErrors[field] = code;
        } else {
          formErrorCode ??= code;
        }
      }
    }

    if (typeof record.errorCode === 'string') {
      if (isPreferenceField(record.field)) {
        fieldErrors[record.field] = record.errorCode;
      } else {
        formErrorCode ??= record.errorCode;
      }
    }
  }

  return { fieldErrors, formErrorCode };
}

async function request<T>(
  path: string,
  init: RequestInit,
  parse: (body: unknown) => T,
): Promise<PreferencesResult<T>> {
  const token = AuthStorage.getAccessToken();
  if (!token) {
    return { ok: false, kind: 'sessionExpired' };
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBase()}${path}`, {
      ...init,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    return { ok: false, kind: 'failure' };
  }

  if (response.status === 401) return { ok: false, kind: 'sessionExpired' };
  if (response.status === 403) return { ok: false, kind: 'forbidden' };

  const body = await readJson(response);

  if (response.status === 400) {
    return { ok: false, kind: 'validation', ...readValidationErrors(body) };
  }

  if (!response.ok) return { ok: false, kind: 'failure' };

  try {
    return { ok: true, data: parse(body) };
  } catch (error) {
    if (error instanceof PreferencesContractError) return { ok: false, kind: 'failure' };
    throw error;
  }
}

export function getTravelPreferenceOptions(): Promise<PreferencesResult<TravelPreferenceOptions>> {
  return request(`${ROUTE}/options`, { method: 'GET' }, parseTravelPreferenceOptions);
}

export function getTravelPreferences(): Promise<PreferencesResult<TravelPreferences>> {
  return request(ROUTE, { method: 'GET' }, parseTravelPreferences);
}

/** Sends the complete state (spec §6.3); success only after the backend returns 200. */
export function updateTravelPreferences(
  payload: TravelPreferencesPayload,
): Promise<PreferencesResult<TravelPreferences>> {
  return request(ROUTE, { method: 'PUT', body: JSON.stringify(payload) }, parseTravelPreferences);
}
