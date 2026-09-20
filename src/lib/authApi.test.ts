import { afterEach, describe, expect, it, vi } from 'vitest';

import { confirmPasswordReset, googleAuth, isApiError, registerTraveler, requestPasswordReset } from './authApi';

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

// ─── UC-06 password reset endpoints ─────────────────────────────────────────

const resetFetchOk = (message: string) =>
  vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ message }),
  });

describe('requestPasswordReset', () => {
  it('POSTs the email to the password-reset request endpoint and returns the direct DTO', async () => {
    const fetchMock = resetFetchOk(
      'If an account exists for this email, reset instructions have been sent.',
    );
    vi.stubGlobal('fetch', fetchMock);

    // Normalization (trim/lowercase) is the recovery service's job (Task 3);
    // the API client is a thin transport and sends exactly what it is given.
    const result = await requestPasswordReset('user@example.com');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:5000/api/v1/auth/password-reset/request');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ email: 'user@example.com' });
    expect(result).toEqual({
      message: 'If an account exists for this email, reset instructions have been sent.',
    });
  });

  it('accepts the direct success DTO without requiring the legacy success envelope', async () => {
    vi.stubGlobal('fetch', resetFetchOk('If an account exists for this email, reset instructions have been sent.'));
    await expect(requestPasswordReset('user@example.com')).resolves.toMatchObject({
      message: 'If an account exists for this email, reset instructions have been sent.',
    });
  });

  it('normalizes a ProblemDetails MSG14 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
          title: 'Invalid reset request.',
          status: 400,
          errorCode: 'MSG14',
        }),
        ok: false,
        status: 400,
      }),
    );

    await expect(requestPasswordReset('user@example.com')).rejects.toMatchObject({
      code: 'MSG14',
      status: 400,
    });
  });

  it('propagates a network failure as a transport error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(requestPasswordReset('user@example.com')).rejects.toBeInstanceOf(TypeError);
  });
});

describe('confirmPasswordReset', () => {
  it('POSTs exactly email, code and newPassword to the confirm endpoint', async () => {
    const fetchMock = resetFetchOk('Your password has been reset. You can now sign in with your new password.');
    vi.stubGlobal('fetch', fetchMock);

    const result = await confirmPasswordReset({ email: 'user@example.com', code: '012345', newPassword: 'NewPassword1!' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:5000/api/v1/auth/password-reset/confirm');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({
      email: 'user@example.com',
      code: '012345',
      newPassword: 'NewPassword1!',
    });
    expect(result).toEqual({
      message: 'Your password has been reset. You can now sign in with your new password.',
    });
  });

  it('serializes a leading-zero OTP unchanged as a string', async () => {
    const fetchMock = resetFetchOk('Your password has been reset. You can now sign in with your new password.');
    vi.stubGlobal('fetch', fetchMock);

    await confirmPasswordReset({ email: 'user@example.com', code: '012345', newPassword: 'NewPassword1!' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.code).toBe('012345');
    expect(typeof body.code).toBe('string');
  });

  it('never sends confirmPassword or any other extra field', async () => {
    const fetchMock = resetFetchOk('Your password has been reset. You can now sign in with your new password.');
    vi.stubGlobal('fetch', fetchMock);

    await confirmPasswordReset({ email: 'user@example.com', code: '123456', newPassword: 'NewPassword1!' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(Object.keys(JSON.parse(String(init.body)) as Record<string, unknown>)).toEqual([
      'email',
      'code',
      'newPassword',
    ]);
  });

  it('normalizes a ProblemDetails MSG127 system failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          type: 'https://tools.ietf.org/html/rfc9110#section-15.6.1',
          title: 'An unexpected error occurred.',
          status: 500,
          errorCode: 'MSG127',
        }),
        ok: false,
        status: 500,
      }),
    );

    await expect(confirmPasswordReset({ email: 'user@example.com', code: '123456', newPassword: 'NewPassword1!' })).rejects.toMatchObject({
      code: 'MSG127',
      status: 500,
    });
  });

  it('normalizes a ValidationProblemDetails response into field errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
          title: 'One or more validation errors occurred.',
          status: 400,
          errors: { newPassword: ['MSG05'] },
        }),
        ok: false,
        status: 400,
      }),
    );

    await expect(confirmPasswordReset({ email: 'user@example.com', code: '123456', newPassword: 'weak' })).rejects.toMatchObject({
      status: 400,
      errors: { newPassword: expect.any(String) },
    });
  });

  it('normalizes an HTTP 429 rate limit even without a JSON body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => {
          throw new Error('no body');
        },
        ok: false,
        status: 429,
      }),
    );

    await expect(confirmPasswordReset({ email: 'user@example.com', code: '123456', newPassword: 'NewPassword1!' })).rejects.toMatchObject({
      status: 429,
    });
  });

  it('propagates a network failure as a transport error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(confirmPasswordReset({ email: 'user@example.com', code: '123456', newPassword: 'NewPassword1!' })).rejects.toBeInstanceOf(
      TypeError,
    );
  });
});
