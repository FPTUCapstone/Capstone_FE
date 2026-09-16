import { afterEach, expect, it, vi } from 'vitest';
import { webVerifyEmail } from '@/lib/authApi';
import { AuthStorage } from '../session/authSession';
afterEach(() => { vi.unstubAllGlobals(); AuthStorage.clear(); });
it('uses Web verify-only with fresh Bearer, no body/cookie and preserves memory A', async () => {
  AuthStorage.accept({ userId: 42, email: 'a@example.com', fullName: '', role: 'Traveler', status: 'Active', applicationStatus: null, accessToken: 'test-access', accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z' }, false);
  const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { emailVerified: true } }), { status: 200 })); vi.stubGlobal('fetch', request);
  expect(await webVerifyEmail('fresh-test')).toEqual({ emailVerified: true });
  const [url, options] = request.mock.calls[0]; expect(url).toMatch(/\/auth\/web\/verify-email$/);
  expect(options.headers.Authorization).toBe('Bearer fresh-test'); expect(options.body).toBeUndefined(); expect(options.credentials).toBe('omit'); expect(AuthStorage.getAccessToken()).toBe('test-access');
});
it.each([{ emailVerified: false }, { emailVerified: true, accessToken: 'legacy' }, { emailVerified: true, refreshToken: 'legacy' }, { emailVerified: true, role: 'Traveler' }])('rejects nonconforming verify response %j', async (data) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data }), { status: 200 })));
  await expect(webVerifyEmail('fresh-test')).rejects.toMatchObject({ code: 'INVALID_VERIFICATION_RESPONSE' });
});
it('retains endpoint-specific ProblemDetails code', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ errorCode: 'MSG14' }), { status: 401 })));
  await expect(webVerifyEmail('fresh-test')).rejects.toMatchObject({ code: 'MSG14', status: 401 });
});
