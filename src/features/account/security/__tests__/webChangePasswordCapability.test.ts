import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthStorage } from '@/features/auth/session/authSession';

import { ChangePasswordApiError } from '../changePasswordCapability';
import { createWebChangePasswordCapability } from '../webChangePasswordCapability';

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

describe('createWebChangePasswordCapability', () => {
  it('reports available and never sends confirmPassword to the Backend', async () => {
    AuthStorage.accept(data, false);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { ...data, accessToken: 'next-access' } }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const capability = createWebChangePasswordCapability();
    expect(capability.status).toBe('available');

    await capability.execute({
      currentPassword: 'Current1!',
      newPassword: 'New2@aaaa',
      confirmPassword: 'New2@aaaa',
    });

    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      currentPassword: 'Current1!',
      newPassword: 'New2@aaaa',
    });
  });

  it('maps MSG17 to a currentPassword-field ChangePasswordApiError', async () => {
    AuthStorage.accept(data, false);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ errorCode: 'MSG17' }), { status: 400 }),
      ),
    );

    const capability = createWebChangePasswordCapability();
    await expect(
      capability.execute({ currentPassword: 'Wrong1!', newPassword: 'New2@aaaa', confirmPassword: 'New2@aaaa' }),
    ).rejects.toMatchObject({ field: 'currentPassword' });
  });

  it('maps MSG05 to a newPassword-field ChangePasswordApiError', async () => {
    AuthStorage.accept(data, false);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ errorCode: 'MSG05' }), { status: 400 }),
      ),
    );

    const capability = createWebChangePasswordCapability();
    await expect(
      capability.execute({ currentPassword: 'Current1!', newPassword: 'weak', confirmPassword: 'weak' }),
    ).rejects.toMatchObject({ field: 'newPassword' });
  });

  it('maps a 403 local-password-unavailable failure to a generic form error', async () => {
    AuthStorage.accept(data, false);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ errorCode: 'auth.local_password_unavailable' }), { status: 403 }),
      ),
    );

    const capability = createWebChangePasswordCapability();
    const error = await capability
      .execute({ currentPassword: 'Current1!', newPassword: 'New2@aaaa', confirmPassword: 'New2@aaaa' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ChangePasswordApiError);
    expect((error as ChangePasswordApiError).field).toBeUndefined();
  });
});
