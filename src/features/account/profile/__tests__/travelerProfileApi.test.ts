import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthStorage } from '@/features/auth/session/authSession';
import {
  getLocalProfileDraft,
  getTravelerProfile,
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
    expect(profile.fullName).toBe('Nguyễn Văn A');
    expect(profile.email).toBe('traveler@example.com');
    expect(profile.phoneNumber).toBe('');
  });

  it('retrieves previously saved local draft', () => {
    saveLocalProfileDraft({
      fullName: 'Trần Văn B',
      email: 'b@example.com',
      phoneNumber: '0901234567',
      address: 'Hà Nội',
    });

    const draft = getLocalProfileDraft('b@example.com', 'Trần Văn B');
    expect(draft.fullName).toBe('Trần Văn B');
    expect(draft.phoneNumber).toBe('0901234567');
    expect(draft.address).toBe('Hà Nội');
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

    // Canonical AuthStorage session MUST NOT be mutated by local draft
    const session = AuthStorage.getContext();
    expect(session?.fullName).toBe('Canonical Server Name');

    // Saved draft in localStorage matches updated values
    const draft = getLocalProfileDraft('traveler@example.com', 'Canonical Server Name');
    expect(draft.fullName).toBe('Edited Local Draft Name');
  });
});
