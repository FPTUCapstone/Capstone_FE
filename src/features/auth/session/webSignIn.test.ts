import { afterEach, expect, it, vi } from 'vitest';
import { webLogin, webGoogleAuth } from '@/lib/authApi';
import { AuthStorage } from './authSession';
const data = { userId: 42, email: 'user@example.com', fullName: '', role: 'Traveler', status: 'Active', applicationStatus: null, accessToken: 'test-access', accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z' };
afterEach(() => { vi.unstubAllGlobals(); AuthStorage.clear(); });
it('uses the single server-owned web login route with cookies', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data }), { status: 200 })); vi.stubGlobal('fetch', fetchMock);
  await webLogin({ email: ' User@example.com ', password: ' unchanged ', keepMeSignedIn: true });
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toMatch(/\/auth\/web\/login$/);
  expect(options.credentials).toBe('include'); expect(JSON.parse(options.body)).toEqual({ email: 'user@example.com', password: ' unchanged ', keepMeSignedIn: true });
  expect(AuthStorage.getAccessToken()).toBe('test-access');
});
it('preserves A after B is rejected and exposes the stable ProblemDetails code', async () => {
  AuthStorage.accept(data, false);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ errorCode: 'auth.account_locked' }), { status: 403 })));
  await expect(webLogin({ email: 'b@example.com', password: 'b' })).rejects.toMatchObject({ status: 403, code: 'auth.account_locked' });
  expect(AuthStorage.getContext()?.userId).toBe(42);
});
it('validates Google additional response field and sends a body-only token with cookies', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { ...data, isNewAccount: false } }), { status: 200 })); vi.stubGlobal('fetch', fetchMock);
  expect((await webGoogleAuth('firebase-test', false)).isNewAccount).toBe(false);
  const [url, options] = fetchMock.mock.calls[0]; expect(url).toMatch(/\/auth\/web\/google$/); expect(options.credentials).toBe('include'); expect(options.headers.Authorization).toBeUndefined(); expect(JSON.parse(options.body)).toEqual({ idToken: 'firebase-test', keepMeSignedIn: false });
});
it('discards access on malformed success without claiming cookie revocation', async () => {
  AuthStorage.accept(data, false); vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { ...data, role: 'Unknown' } }), { status: 200 })));
  await expect(webLogin({ email: 'b@example.com', password: 'b' })).rejects.toThrow('INVALID_AUTH_CONTEXT'); expect(AuthStorage.getAccessToken()).toBeNull();
});

it('preserves session A on network failure', async () => {
  AuthStorage.accept(data, false);
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')));
  await expect(webLogin({ email: 'b@example.com', password: 'b' })).rejects.toThrow('network');
  expect(AuthStorage.getContext()?.userId).toBe(42);
});
