import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStorage, parseWebAuthContext } from './authSession';
const data = { userId: 42, email: 'user@example.com', fullName: '', role: 'Traveler', status: 'Active', applicationStatus: null, accessToken: 'test-access', accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z' };
describe('Web authentication session', () => {
  beforeEach(() => { AuthStorage.clear(); localStorage.clear(); sessionStorage.clear(); });

  it('notifies subscribers when the in-memory context changes', () => {
    const listener = vi.fn();
    const unsubscribe = AuthStorage.subscribe(listener);
    try {
      AuthStorage.accept(data, false);
      expect(listener).toHaveBeenCalledTimes(1);
      AuthStorage.clear();
      expect(listener).toHaveBeenCalledTimes(2);
    } finally {
      unsubscribe();
    }
  });

  it('keeps credentials in memory and saves display context in the selected mode', () => {
    localStorage.setItem('tripmate_refresh_token', 'obsolete'); sessionStorage.setItem('tripmate_access_token', 'obsolete'); localStorage.setItem('unrelated', 'keep');
    AuthStorage.accept(data, true);
    expect(AuthStorage.getAccessToken()).toBe('test-access');
    expect(localStorage.getItem('tripmate_refresh_token')).toBeNull(); expect(sessionStorage.getItem('tripmate_access_token')).toBeNull();
    expect(localStorage.getItem('tripmate_user')).toContain('user@example.com');
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain('test-access'); expect(localStorage.getItem('unrelated')).toBe('keep');
    AuthStorage.accept({ ...data, userId: 43 }, false);
    expect(localStorage.getItem('tripmate_user')).toBeNull(); expect(sessionStorage.getItem('tripmate_user')).toContain('43');
  });
  it('never restores authentication from saved metadata', () => {
    sessionStorage.setItem('tripmate_user', JSON.stringify(data)); expect(AuthStorage.getContext()).toBeNull(); expect(AuthStorage.getAccessToken()).toBeNull();
  });
  it.each([null, '', 'FutureStatus', undefined])('retains operator auth with unresolved application %s', (applicationStatus) => {
    const context = parseWebAuthContext({ ...data, role: 'TourOperator', applicationStatus }); expect(context.applicationStatus).toBeNull(); expect(context.applicationUnresolved).toBe(true);
  });
  it.each(['Approved', 'PendingApproval', 'Rejected'])('uses current operator profile %s', (applicationStatus) => {
    expect(parseWebAuthContext({ ...data, role: 'TourOperator', applicationStatus }).applicationStatus).toBe(applicationStatus);
  });
  it.each([{ role: 1 }, { status: 'PendingApproval' }, { accessToken: '' }, { userId: '42' }, { fullName: null }, { accessTokenExpiresAtUtc: 'bad' }, { refreshToken: 'forbidden' }])('rejects invalid auth context %j', (change) => {
    AuthStorage.accept(data, false); expect(() => AuthStorage.accept({ ...data, ...change }, false)).toThrow('INVALID_AUTH_CONTEXT'); expect(AuthStorage.getContext()).toBeNull(); expect(AuthStorage.getAccessToken()).toBeNull();
  });
});

it('does not expose an expired credential', async () => {
  const { vi } = await import('vitest');
  vi.useFakeTimers();
  try {
    vi.setSystemTime(new Date('2098-12-31T23:59:59Z'));
    AuthStorage.accept(data, false);
    vi.setSystemTime(new Date('2099-01-01T00:00:00Z'));
    expect(AuthStorage.getAccessToken()).toBeNull();
    expect(AuthStorage.getContext()).toBeNull();
  } finally { vi.useRealTimers(); AuthStorage.clear(); }
});

it('does not store a session in a server process', async () => {
  const { vi } = await import('vitest');
  vi.stubGlobal('window', undefined);
  try { expect(() => AuthStorage.accept(data, false)).toThrow('INVALID_AUTH_CONTEXT'); }
  finally { vi.unstubAllGlobals(); AuthStorage.clear(); }
});
