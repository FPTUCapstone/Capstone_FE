import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthStorage } from '@/features/auth/session/authSession';
import {
  getLocalProfileDraft,
  getTravelerProfile,
  getUserProfileDraftKey,
  LEGACY_STORAGE_KEYS,
  LocalProfileStorageError,
  saveLocalProfileDraft,
  updateTravelerProfile,
  type UpdateTravelerProfilePayload,
} from '../travelerProfileApi';

describe('travelerProfileApi', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    AuthStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retrieves profile draft from AuthStorage session when no local draft exists', async () => {
    AuthStorage.accept(
      {
        userId: 101,
        email: 'traveler@example.com',
        fullName: 'Nguyễn Văn A',
        role: 'Traveler',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'valid-token',
        accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(),
      },
      false,
    );

    const profile = await getTravelerProfile();
    expect(profile.userId).toBe(101);
    expect(profile.fullName).toBe('Nguyễn Văn A');
    expect(profile.email).toBe('traveler@example.com');
    expect(profile.phoneNumber).toBe('');
  });

  it('retrieves previously saved user-scoped draft for the same user', () => {
    saveLocalProfileDraft(101, {
      fullName: 'Trần Văn B',
      email: 'b@example.com',
      phoneNumber: '0901234567',
      address: 'Hà Nội',
    });

    const draft = getLocalProfileDraft(101, 'b@example.com', 'Trần Văn B');
    expect(draft.userId).toBe(101);
    expect(draft.fullName).toBe('Trần Văn B');
    expect(draft.phoneNumber).toBe('0901234567');
    expect(draft.address).toBe('Hà Nội');
  });

  it('enforces cross-user isolation: Traveler B cannot see Traveler A draft after logout/login', async () => {
    // 1. Traveler A (userId=101) logs in and saves a profile draft
    AuthStorage.accept(
      {
        userId: 101,
        email: 'travelerA@example.com',
        fullName: 'Traveler A Name',
        role: 'Traveler',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'token-A',
        accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(),
      },
      false,
    );

    await updateTravelerProfile({
      fullName: 'A Custom Fullname',
      phoneNumber: '0901111111',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      address: 'Address of Traveler A',
      avatarUrl: 'data:image/png;base64,secretAAvatar',
    });

    // Verify A can read A's draft
    const draftA = await getTravelerProfile();
    expect(draftA.fullName).toBe('A Custom Fullname');
    expect(draftA.phoneNumber).toBe('0901111111');
    expect(draftA.address).toBe('Address of Traveler A');

    // 2. Traveler A logs out
    AuthStorage.clear();

    // 3. Traveler B (userId=202) logs in
    AuthStorage.accept(
      {
        userId: 202,
        email: 'travelerB@example.com',
        fullName: 'Traveler B Canonical',
        role: 'Traveler',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'token-B',
        accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(),
      },
      false,
    );

    // 4. Traveler B retrieves profile: MUST NOT see Traveler A's draft
    const draftB = await getTravelerProfile();
    expect(draftB.userId).toBe(202);
    expect(draftB.fullName).toBe('Traveler B Canonical');
    expect(draftB.email).toBe('travelerB@example.com');
    expect(draftB.phoneNumber).toBe('');
    expect(draftB.dateOfBirth).toBe('');
    expect(draftB.address).toBe('');
    expect(draftB.avatarUrl).toBe('');
  });

  it('rejects and removes a draft envelope if ownerUserId mismatches the authenticated user', () => {
    // Malicious or mismatched envelope stored under user 101's key with owner 999
    localStorage.setItem(
      getUserProfileDraftKey(101),
      JSON.stringify({
        ownerUserId: 999,
        profile: {
          fullName: 'Intruder Data',
          phoneNumber: '0999999999',
        },
      }),
    );

    const draft = getLocalProfileDraft(101, 'user101@example.com', 'Legit User 101');
    expect(draft.fullName).toBe('Legit User 101');
    expect(draft.phoneNumber).toBe('');

    // Envelope must have been deleted
    expect(localStorage.getItem(getUserProfileDraftKey(101))).toBeNull();
  });

  it('purges and does not adopt legacy unverified generic drafts', () => {
    // Populate legacy keys
    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.setItem(
        key,
        JSON.stringify({
          fullName: 'Stale Unverified Name',
          phoneNumber: '0123456789',
        }),
      );
    }

    const draft = getLocalProfileDraft(101, 'traveler@example.com', 'Canonical Name');
    expect(draft.fullName).toBe('Canonical Name');
    expect(draft.phoneNumber).toBe('');

    // Legacy keys must be purged
    for (const key of LEGACY_STORAGE_KEYS) {
      expect(localStorage.getItem(key)).toBeNull();
    }
  });

  it('does NOT persist Base64 / data: avatarUrl in localStorage and strips it on read', async () => {
    AuthStorage.accept(
      {
        userId: 101,
        email: 'traveler@example.com',
        fullName: 'Canonical Name',
        role: 'Traveler',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'valid-token',
        accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(),
      },
      false,
    );

    const dataUrl = 'data:image/jpeg;base64,' + 'A'.repeat(5000);
    const res = await updateTravelerProfile({
      fullName: 'Updated Name',
      avatarUrl: dataUrl,
    });

    expect(res.success).toBe(true);
    // Returned in-memory profile has preview avatar for session
    expect(res.profile.avatarUrl).toBe(dataUrl);

    // Stored localStorage JSON MUST NOT contain data: avatar
    const raw = localStorage.getItem(getUserProfileDraftKey(101));
    expect(raw).not.toBeNull();
    expect(raw).not.toContain(dataUrl);
    expect(raw).not.toContain('data:image');

    // On read from localStorage, avatarUrl is empty
    const loaded = getLocalProfileDraft(101, 'traveler@example.com', 'Canonical Name');
    expect(loaded.avatarUrl).toBe('');
  });

  it('throws LocalProfileStorageError when localStorage quota is exceeded and does not report success', async () => {
    AuthStorage.accept(
      {
        userId: 101,
        email: 'traveler@example.com',
        fullName: 'Canonical Server Name',
        role: 'Traveler',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'valid-token',
        accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(),
      },
      false,
    );

    // Simulate quota exceeded
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });

    await expect(
      updateTravelerProfile({
        fullName: 'New Name That Fails',
      }),
    ).rejects.toThrow(LocalProfileStorageError);

    // AuthStorage session must remain intact
    expect(AuthStorage.getContext()?.fullName).toBe('Canonical Server Name');
  });

  it('saves edits as LOCAL_DRAFT with PENDING_BE_INTEGRATION and does NOT mutate AuthStorage', async () => {
    AuthStorage.accept(
      {
        userId: 101,
        email: 'traveler@example.com',
        fullName: 'Canonical Server Name',
        role: 'Traveler',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'valid-token',
        accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(),
      },
      false,
    );

    const payload: UpdateTravelerProfilePayload = {
      fullName: 'Edited Local Draft Name',
      phoneNumber: '0987654321',
      dateOfBirth: '1998-10-10',
      gender: 'Female',
      address: 'Đà Nẵng',
    };

    const res = await updateTravelerProfile(payload);
    expect(res.success).toBe(true);
    expect(res.storageMode).toBe('LOCAL_DRAFT');
    expect(res.integrationStatus).toBe('PENDING_BE_INTEGRATION');
    expect(res.message).toBe('Thông tin tạm thời đã được lưu trên thiết bị này.');
    expect(res.notice).toBe('Đồng bộ hồ sơ với máy chủ đang chờ tích hợp.');
    expect(res.profile.fullName).toBe('Edited Local Draft Name');
    expect(res.profile.phoneNumber).toBe('0987654321');
    expect((res as unknown as Record<string, unknown>).isSimulatedFallback).toBeUndefined();

    // Canonical AuthStorage session MUST NOT be mutated by local draft
    const session = AuthStorage.getContext();
    expect(session?.fullName).toBe('Canonical Server Name');

    // Saved draft in localStorage matches updated values
    const draft = getLocalProfileDraft(101, 'traveler@example.com', 'Canonical Server Name');
    expect(draft.fullName).toBe('Edited Local Draft Name');
  });
});
