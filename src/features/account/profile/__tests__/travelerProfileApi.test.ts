import { afterEach, describe, expect, it, vi } from 'vitest';

import { getTravelerProfile, TravelerProfileApiError, updateTravelerProfile } from '../travelerProfileApi';

afterEach(() => vi.unstubAllGlobals());

describe('travelerProfileApi', () => {
  it('loads canonical profile from the same-origin API', async () => {
    const profile = { userId: 3, fullName: 'Nguyễn An', email: 'an@example.com',
      phoneNumber: null, dateOfBirth: null, avatarUrl: null };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(profile));
    vi.stubGlobal('fetch', fetchMock);
    expect(await getTravelerProfile()).toEqual(profile);
    expect(fetchMock).toHaveBeenCalledWith('/api/traveler/profile', { cache: 'no-store' });
  });

  it('sends multipart including avatar and no editable email', async () => {
    const profile = { userId: 3, fullName: 'Nguyễn An', email: 'an@example.com',
      phoneNumber: null, dateOfBirth: null, avatarUrl: 'https://example.com/avatar.png' };
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ messageCode: 'MSG20', message: 'Saved', profile }));
    vi.stubGlobal('fetch', fetchMock);
    const avatarFile = new File(['image'], 'avatar.png', { type: 'image/png' });
    await updateTravelerProfile({ fullName: 'Nguyễn An', avatarFile });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('PUT');
    expect(init.body.get('avatar')).toBe(avatarFile);
    expect(init.body.get('email')).toBeNull();
    expect(init.body.get('removeAvatar')).toBe('false');
  });

  it('does not report success on a failed request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      Response.json({ errorCode: 'MSG19' }, { status: 400 })));
    await expect(updateTravelerProfile({ fullName: 'An' }))
      .rejects.toMatchObject({ status: 400, code: 'MSG19' } satisfies Partial<TravelerProfileApiError>);
  });

  it('uses the existing catalog message for a duplicate phone response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      Response.json({ errorCode: 'MSG_PHONE_DUP' }, { status: 409 })));
    await expect(updateTravelerProfile({ fullName: 'An', phoneNumber: '0912345678' }))
      .rejects.toMatchObject({ status: 409, code: 'MSG_PHONE_DUP',
        message: 'This phone number is already registered to another account.' });
  });
});
