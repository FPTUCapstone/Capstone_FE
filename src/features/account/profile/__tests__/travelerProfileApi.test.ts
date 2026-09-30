import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthStorage } from '@/features/auth/session/authSession';
import {
  getTravelerProfile,
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

  it('fetches profile successfully when backend returns 200', async () => {
    const mockData = {
      fullName: 'Nguyễn Văn A',
      email: 'traveler@example.com',
      phoneNumber: '0912345678',
      dateOfBirth: '1995-05-20',
      gender: 'Male',
      address: 'Hà Nội',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: mockData }),
      }),
    );

    const profile = await getTravelerProfile({ accessToken: 'test-token' });
    expect(profile.fullName).toBe('Nguyễn Văn A');
    expect(profile.email).toBe('traveler@example.com');
    expect(profile.phoneNumber).toBe('0912345678');
  });

  it('falls back gracefully to AuthStorage context when backend returns 404 (PENDING_BE_INTEGRATION)', async () => {
    AuthStorage.accept(
      {
        userId: 101,
        email: 'fallback@example.com',
        fullName: 'Hồ Sơ Dự Phòng',
        role: 'Traveler',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'valid-token',
        accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(),
      },
      false,
    );

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    );

    const profile = await getTravelerProfile();
    expect(profile.email).toBe('fallback@example.com');
    expect(profile.fullName).toBe('Hồ Sơ Dự Phòng');
  });

  it('simulates update and synchronizes AuthStorage when backend returns 404', async () => {
    AuthStorage.accept(
      {
        userId: 101,
        email: 'traveler@example.com',
        fullName: 'Old Name',
        role: 'Traveler',
        status: 'Active',
        applicationStatus: null,
        applicationUnresolved: false,
        accessToken: 'valid-token',
        accessTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(),
      },
      false,
    );

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    );

    const payload: UpdateTravelerProfilePayload = {
      fullName: 'New Updated Name',
      phoneNumber: '0987654321',
      dateOfBirth: '1998-10-10',
      gender: 'Female',
      address: 'Đà Nẵng',
    };

    const res = await updateTravelerProfile(payload);
    expect(res.success).toBe(true);
    expect(res.isSimulatedFallback).toBe(true);
    expect(res.messageCode).toBe('MSG20');
    expect(res.profile.fullName).toBe('New Updated Name');

    // Context should be updated
    const updatedContext = AuthStorage.getContext();
    expect(updatedContext?.fullName).toBe('New Updated Name');
  });

  it('throws ApiError when backend returns 400 validation error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          errorCode: 'MSG01',
          message: 'Dữ liệu không hợp lệ.',
          errors: {
            fullName: ['Vui lòng nhập họ và tên.'],
          },
        }),
      }),
    );

    const payload: UpdateTravelerProfilePayload = {
      fullName: '',
    };

    await expect(updateTravelerProfile(payload)).rejects.toMatchObject({
      status: 400,
      code: 'MSG01',
      errors: {
        fullName: 'Vui lòng nhập họ và tên.',
      },
    });
  });
});
