import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthStorage } from '@/features/auth/session/authSession';
import { googleAuth, isApiError, registerTraveler, webLogout, webLogoutAll } from './authApi';

afterEach(() => {
  vi.unstubAllGlobals();
  AuthStorage.clear();
});

const activeContext = () => ({
  userId: 42,
  email: 'user@example.com',
  fullName: 'Test User',
  role: 'Traveler',
  status: 'Active',
  applicationStatus: null,
  accessToken: 'test-access',
  accessTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
});

describe('web sign out requests', () => {
  it.each([
    ['current session', webLogout, '/auth/web/logout'],
    ['all devices', webLogoutAll, '/auth/web/logout-all'],
  ])('POSTs %s without a body and preserves local auth while pending', async (_name, operation, path) => {
    AuthStorage.accept(activeContext(), false);
    let resolveFetch!: (response: Response) => void;
    const fetchMock = vi.fn().mockReturnValue(new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    }));
    vi.stubGlobal('fetch', fetchMock);

    const pendingOperation = operation();

    expect(AuthStorage.getContext()?.userId).toBe(42);
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:5000/api/v1${path}`,
      { method: 'POST', credentials: 'include' },
    );
    expect(fetchMock.mock.calls[0]?.[1]).not.toHaveProperty('body');

    resolveFetch(new Response(
      JSON.stringify({ success: true, statusCode: 200, message: 'Signed out successfully.', data: true, errors: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ));
    await pendingOperation;

    // AuthStorage cleanup is owned by the UI after this request succeeds.
    expect(AuthStorage.getContext()?.userId).toBe(42);
  });

  it('preserves local auth after a current-session 500 and permits a successful retry', async () => {
    AuthStorage.accept(activeContext(), false);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ title: 'An unexpected error occurred.', status: 500 }),
        { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
      ))
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ success: true, statusCode: 200, message: 'Signed out successfully.', data: true, errors: null }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ));
    vi.stubGlobal('fetch', fetchMock);

    await expect(webLogout()).rejects.toMatchObject({ status: 500 });
    expect(AuthStorage.getContext()?.userId).toBe(42);

    await expect(webLogout()).resolves.toBeUndefined();
    expect(AuthStorage.getContext()?.userId).toBe(42);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([401, 500])('preserves local auth when logout-all returns %i', async (status) => {
    AuthStorage.accept(activeContext(), false);
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ title: 'Logout all failed.', status }),
      { status, headers: { 'Content-Type': 'application/problem+json' } },
    ));
    vi.stubGlobal('fetch', fetchMock);

    await expect(webLogoutAll()).rejects.toMatchObject({ status });

    expect(AuthStorage.getContext()?.userId).toBe(42);
  });
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
