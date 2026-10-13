import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase } from '@/lib/authApi';

import {
  getTravelPreferenceOptions,
  getTravelPreferences,
  updateTravelPreferences,
} from '../travelPreferencesApi';
import { EMPTY_PREFERENCES, PREFERENCE_ERROR_CODES, toPayload } from '../travelPreferencesTypes';

const savedBody = {
  interests: ['Beach'],
  preferredTransportMode: 'Car',
  travelPace: null,
  riskTolerance: null,
  foodPreferences: [],
  defaultBudgetVnd: null,
  updatedAtUtc: '2026-10-13T06:00:00Z',
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('travelPreferencesApi', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(AuthStorage, 'getAccessToken').mockReturnValue('access-token');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('GETs preferences with the bearer token and parses the body', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, savedBody));

    const result = await getTravelPreferences();

    expect(fetchMock).toHaveBeenCalledWith(
      `${getApiBase()}/traveler/preferences`,
      expect.objectContaining({
        method: 'GET',
        cache: 'no-store',
        headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
      }),
    );
    expect(result).toEqual({ ok: true, data: savedBody });
  });

  it('GETs the option catalogue', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        interests: [],
        preferredTransportModes: ['Walking'],
        travelPaces: ['Relaxed'],
        foodPreferences: ['Vegan'],
        riskTolerances: ['Low'],
      }),
    );

    const result = await getTravelPreferenceOptions();

    expect(fetchMock.mock.calls[0][0]).toBe(`${getApiBase()}/traveler/preferences/options`);
    expect(result.ok).toBe(true);
  });

  it('PUTs the complete payload as JSON', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, savedBody));
    const payload = toPayload(EMPTY_PREFERENCES);

    await updateTravelPreferences(payload);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({
      interests: [],
      preferredTransportMode: null,
      travelPace: null,
      riskTolerance: null,
      foodPreferences: [],
    });
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('returns sessionExpired without calling fetch when there is no token', async () => {
    vi.mocked(AuthStorage.getAccessToken).mockReturnValue(null);

    const result = await getTravelPreferences();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, kind: 'sessionExpired' });
  });

  it.each([
    [401, 'sessionExpired'],
    [403, 'forbidden'],
    [500, 'failure'],
    [503, 'failure'],
  ])('maps HTTP %s to %s', async (status, kind) => {
    fetchMock.mockResolvedValue(jsonResponse(status, { title: 'x' }));

    const result = await getTravelPreferences();

    expect(result).toMatchObject({ ok: false, kind });
  });

  it('maps a network error to failure', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    expect(await getTravelPreferences()).toEqual({ ok: false, kind: 'failure' });
  });

  it('treats non-JSON or contract-breaking 200 bodies as failure', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html></html>', { status: 200 }));
    expect(await getTravelPreferences()).toEqual({ ok: false, kind: 'failure' });

    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ...savedBody, travelPace: 'Packed' }));
    expect(await getTravelPreferences()).toEqual({ ok: false, kind: 'failure' });
  });

  it('reads field codes from ValidationProblemDetails', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        title: 'One or more validation errors occurred.',
        errors: { foodPreferences: [PREFERENCE_ERROR_CODES.foodNoRestrictionExclusive] },
      }),
    );

    const result = await updateTravelPreferences(toPayload(EMPTY_PREFERENCES));

    expect(result).toEqual({
      ok: false,
      kind: 'validation',
      fieldErrors: { foodPreferences: PREFERENCE_ERROR_CODES.foodNoRestrictionExclusive },
      formErrorCode: undefined,
    });
  });

  it('reads errorCode + field from ProblemDetails', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        errorCode: PREFERENCE_ERROR_CODES.invalidOption,
        field: 'interests',
        invalidValues: ['Skydiving'],
      }),
    );

    const result = await updateTravelPreferences(toPayload(EMPTY_PREFERENCES));

    expect(result).toMatchObject({
      ok: false,
      kind: 'validation',
      fieldErrors: { interests: PREFERENCE_ERROR_CODES.invalidOption },
    });
  });

  it('keeps a framework binding error as a form-level error', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { errors: { $: ['The JSON value could not be converted.'] } }));

    const result = await updateTravelPreferences(toPayload(EMPTY_PREFERENCES));

    expect(result).toMatchObject({ ok: false, kind: 'validation', fieldErrors: {} });
  });

  it('never touches browser storage', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    fetchMock.mockResolvedValue(jsonResponse(200, savedBody));

    await getTravelPreferences();
    await updateTravelPreferences(toPayload(EMPTY_PREFERENCES));

    expect(setItem).not.toHaveBeenCalled();
    expect(getItem).not.toHaveBeenCalled();
  });
});
