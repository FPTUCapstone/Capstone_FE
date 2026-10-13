import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../travelerProfileApi';
import { AUTH_ERROR_MESSAGES } from '@/lib/authErrorMapper';
import { useTravelerProfile, validateAvatarFile, validateDateOfBirth,
  validateFullName, validatePhoneNumber } from '../useTravelerProfile';

vi.mock('../travelerProfileApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../travelerProfileApi')>();
  return { ...actual, getTravelerProfile: vi.fn(), updateTravelerProfile: vi.fn() };
});

const profile = { userId: 7, fullName: 'Nguyễn An', email: 'an@example.com',
  phoneNumber: null, dateOfBirth: null, avatarUrl: null };

describe('profile validation', () => {
  it('validates only retained fields', () => {
    expect(validateFullName(' ')).toBeDefined();
    expect(validatePhoneNumber('')).toBeUndefined();
    expect(validatePhoneNumber('123')).toBeDefined();
    expect(validateDateOfBirth('2000-02-30')).toBeDefined();
    expect(validateDateOfBirth('2000-02-29')).toBeUndefined();
    expect(validateAvatarFile(new File(['a'], 'a.pdf', { type: 'application/pdf' }))).toBeDefined();
  });
});

describe('useTravelerProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getTravelerProfile).mockResolvedValue(profile);
  });

  it('blocks editing after GET fails', async () => {
    vi.mocked(api.getTravelerProfile).mockRejectedValue(new api.TravelerProfileApiError(503, 'MSG127'));
    const { result } = renderHook(() => useTravelerProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.loadError).toBeTruthy();
    await act(async () => { expect(await result.current.handleSubmit()).toBe(false); });
    expect(api.updateTravelerProfile).not.toHaveBeenCalled();
  });

  it('saves optional phone and reports success only after server response', async () => {
    vi.mocked(api.updateTravelerProfile).mockResolvedValue({
      messageCode: 'MSG20', message: 'Saved', profile,
    });
    const { result } = renderHook(() => useTravelerProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { expect(await result.current.handleSubmit()).toBe(true); });
    expect(api.updateTravelerProfile).toHaveBeenCalledWith(expect.objectContaining({
      fullName: 'Nguyễn An', phoneNumber: '', removeAvatar: false,
    }));
    expect(result.current.success).toBe(true);
  });

  it('shows the catalog duplicate-phone message beside the phone field', async () => {
    vi.mocked(api.updateTravelerProfile).mockRejectedValue(
      new api.TravelerProfileApiError(409, 'MSG_PHONE_DUP'));
    const { result } = renderHook(() => useTravelerProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setField('phoneNumber', '0912345678'));
    await act(async () => { expect(await result.current.handleSubmit()).toBe(false); });
    expect(result.current.errors.phoneNumber).toBe(AUTH_ERROR_MESSAGES.MSG_PHONE_DUP);
    expect(result.current.errors.form).toBeUndefined();
  });
});
