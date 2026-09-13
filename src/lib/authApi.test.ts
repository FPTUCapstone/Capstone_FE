import { afterEach, describe, expect, it, vi } from 'vitest';

import { googleAuth, isApiError, registerTraveler } from './authApi';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isApiError', () => {
  it('recognizes the structured Backend error shape', () => {
    expect(isApiError({ status: 409, code: 'MSG03', message: 'duplicate' })).toBe(true);
  });

  it('does not misclassify Firebase or transport errors as Backend responses', () => {
    expect(isApiError({ code: 'auth/network-request-failed' })).toBe(false);
    expect(isApiError(new TypeError('Failed to fetch'))).toBe(false);
  });

  it.each([
    ['registerTraveler', () => registerTraveler({ acceptedTerms: true, email: 'traveler@example.com', fullName: 'Traveler Name', password: 'Password1!' }, 'firebase-token')],
    ['googleAuth', () => googleAuth('google-token')],
  ])('normalizes a ProblemDetails business error for %s without fake field errors', async (_name, callApi) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
          title: 'An account with this email already exists. Please sign in or use another email.',
          status: 409,
          errorCode: 'MSG03',
        }),
        ok: false,
        status: 409,
      }),
    );

    await expect(callApi()).rejects.toMatchObject({
      code: 'MSG03',
      message: 'An account with this email already exists. Please sign in or use another email.',
      errors: undefined,
      status: 409,
    });
  });
});
