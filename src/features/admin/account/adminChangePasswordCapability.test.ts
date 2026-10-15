import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChangePasswordApiError } from '@/features/account/security/changePasswordCapability';

import { createAdminChangePasswordCapability } from './adminChangePasswordCapability';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAdminChangePasswordCapability', () => {
  it('posts only currentPassword/newPassword to the same-origin BFF proxy', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const capability = createAdminChangePasswordCapability();
    await capability.execute({
      currentPassword: 'Current1!',
      newPassword: 'New2@aaaa',
      confirmPassword: 'New2@aaaa',
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/account/security/change-password');
    expect(JSON.parse(options.body)).toEqual({ currentPassword: 'Current1!', newPassword: 'New2@aaaa' });
  });

  it('maps a proxied MSG17 to a currentPassword-field error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ errorCode: 'MSG17' }), { status: 400 })),
    );

    const capability = createAdminChangePasswordCapability();
    await expect(
      capability.execute({ currentPassword: 'Wrong1!', newPassword: 'New2@aaaa', confirmPassword: 'New2@aaaa' }),
    ).rejects.toMatchObject({ field: 'currentPassword' });
  });

  it('maps a proxied MSG05 to a newPassword-field error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ errorCode: 'MSG05' }), { status: 400 })),
    );

    const capability = createAdminChangePasswordCapability();
    await expect(
      capability.execute({ currentPassword: 'Current1!', newPassword: 'weak', confirmPassword: 'weak' }),
    ).rejects.toMatchObject({ field: 'newPassword' });
  });

  it('maps a network failure to a generic ChangePasswordApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')));

    const capability = createAdminChangePasswordCapability();
    const error = await capability
      .execute({ currentPassword: 'Current1!', newPassword: 'New2@aaaa', confirmPassword: 'New2@aaaa' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ChangePasswordApiError);
    expect((error as ChangePasswordApiError).field).toBeUndefined();
  });
});
