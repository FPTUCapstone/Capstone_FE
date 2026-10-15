import { afterEach, expect, it, vi } from 'vitest';

import { webChangePassword } from '@/lib/authApi';

import { AuthStorage } from './authSession';

const data = {
  userId: 42,
  email: 'user@example.com',
  fullName: 'User Name',
  role: 'Traveler',
  status: 'Active',
  applicationStatus: null,
  accessToken: 'original-access',
  accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
};

afterEach(() => {
  vi.unstubAllGlobals();
  AuthStorage.clear();
});

it('rejects without a network call when no session is in memory', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);

  await expect(
    webChangePassword({ currentPassword: 'Current1!', newPassword: 'New2@aaaa' }),
  ).rejects.toMatchObject({ status: 401, code: 'AUTH_REQUIRED' });
  expect(fetchMock).not.toHaveBeenCalled();
});

it('sends the Bearer access token with credentials and an allow-listed body', async () => {
  AuthStorage.accept(data, false);
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ success: true, data: { ...data, accessToken: 'replacement-access' } }), {
      status: 200,
    }),
  );
  vi.stubGlobal('fetch', fetchMock);

  await webChangePassword({ currentPassword: 'Current1!', newPassword: 'New2@aaaa' });

  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toMatch(/\/auth\/web\/change-password$/);
  expect(options.credentials).toBe('include');
  expect(options.headers.Authorization).toBe('Bearer original-access');
  expect(JSON.parse(options.body)).toEqual({
    currentPassword: 'Current1!',
    newPassword: 'New2@aaaa',
  });
});

it('replaces the in-memory session with the Backend-issued replacement access token', async () => {
  AuthStorage.accept(data, false);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { ...data, accessToken: 'replacement-access' } }), {
        status: 200,
      }),
    ),
  );

  await webChangePassword({ currentPassword: 'Current1!', newPassword: 'New2@aaaa' });

  expect(AuthStorage.getAccessToken()).toBe('replacement-access');
});

it('preserves the existing session and surfaces MSG17 on an incorrect current password', async () => {
  AuthStorage.accept(data, false);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ errorCode: 'MSG17', title: 'Current password does not match our records.' }), {
        status: 400,
      }),
    ),
  );

  await expect(
    webChangePassword({ currentPassword: 'Wrong1!', newPassword: 'New2@aaaa' }),
  ).rejects.toMatchObject({ status: 400, code: 'MSG17' });
  expect(AuthStorage.getAccessToken()).toBe('original-access');
});

it('clears the session on a 401 — the access token itself is no longer accepted', async () => {
  AuthStorage.accept(data, false);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ title: 'Unauthorized' }), { status: 401 }),
    ),
  );

  await expect(
    webChangePassword({ currentPassword: 'Current1!', newPassword: 'New2@aaaa' }),
  ).rejects.toMatchObject({ status: 401 });
  expect(AuthStorage.getContext()).toBeNull();
  expect(AuthStorage.getAccessToken()).toBeNull();
});

it('preserves the existing session on a network failure', async () => {
  AuthStorage.accept(data, false);
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')));

  await expect(
    webChangePassword({ currentPassword: 'Current1!', newPassword: 'New2@aaaa' }),
  ).rejects.toMatchObject({ code: 'NETWORK' });
  expect(AuthStorage.getAccessToken()).toBe('original-access');
});

it('discards the session on a malformed success body rather than claiming success', async () => {
  AuthStorage.accept(data, false);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { ...data, role: 'Unknown' } }), { status: 200 }),
    ),
  );

  await expect(
    webChangePassword({ currentPassword: 'Current1!', newPassword: 'New2@aaaa' }),
  ).rejects.toThrow('INVALID_AUTH_CONTEXT');
  expect(AuthStorage.getAccessToken()).toBeNull();
});
