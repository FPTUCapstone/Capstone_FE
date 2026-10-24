import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  fetchBackendMock: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import { resolveWebSession } from './webSession';

function withRefreshCookie(value: string | undefined) {
  const set = vi.fn();
  cookiesMock.mockResolvedValue({
    get: (name: string) => (name === 'tripmate_refresh' && value !== undefined ? { value } : undefined),
    set,
  });
  return set;
}

function refreshReturns(body: unknown, status = 200) {
  fetchBackendMock.mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('resolveWebSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null without calling the backend when there is no refresh cookie', async () => {
    withRefreshCookie(undefined);

    expect(await resolveWebSession()).toBeNull();
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('forwards the refresh cookie to the backend refresh endpoint, encoded', async () => {
    withRefreshCookie('abc+def/==');
    refreshReturns({ data: { accessToken: 'tok', role: 'Administrator', status: 'Active' } });

    await resolveWebSession();

    expect(fetchBackendMock).toHaveBeenCalledWith(
      '/api/v1/auth/web/refresh',
      expect.objectContaining({
        method: 'POST',
        headers: { Cookie: `tripmate_refresh=${encodeURIComponent('abc+def/==')}` },
      }),
    );
  });

  it('returns the access token for an active Administrator', async () => {
    withRefreshCookie('r');
    refreshReturns({ data: { accessToken: 'admin-token', role: 'Administrator', status: 'Active' } });

    expect(await resolveWebSession()).toEqual({ accessToken: 'admin-token', role: 'Administrator' });
  });

  it('returns the access token for an active Staff', async () => {
    withRefreshCookie('r');
    refreshReturns({ data: { accessToken: 'staff-token', role: 'Staff', status: 'Active' } });

    expect(await resolveWebSession()).toEqual({ accessToken: 'staff-token', role: 'Staff' });
  });

  it.each(['Traveler', 'TourOperator'])('returns null and no token for role %s', async (role) => {
    withRefreshCookie('r');
    refreshReturns({ data: { accessToken: 'other-token', role, status: 'Active' } });

    expect(await resolveWebSession()).toBeNull();
  });

  it.each(['Locked', 'Inactive', 'PendingEmailVerification', 'PendingApproval', 'Rejected'])('returns null for an administrator with status %s', async (status) => {
    withRefreshCookie('r');
    refreshReturns({ data: { accessToken: 'tok', role: 'Administrator', status } });

    expect(await resolveWebSession()).toBeNull();
  });

  it('returns null when the backend rejects the refresh (expired or revoked session)', async () => {
    withRefreshCookie('r');
    refreshReturns({ message: 'expired' }, 401);

    expect(await resolveWebSession()).toBeNull();
  });

  it('returns null when the backend is unreachable', async () => {
    withRefreshCookie('r');
    fetchBackendMock.mockRejectedValue(new Error('connect ECONNREFUSED'));

    expect(await resolveWebSession()).toBeNull();
  });

  it('returns null for a malformed success body', async () => {
    withRefreshCookie('r');
    refreshReturns({ data: { role: 'Administrator', status: 'Active' } });

    expect(await resolveWebSession()).toBeNull();
  });

  it('returns null for a non-JSON success body', async () => {
    withRefreshCookie('r');
    fetchBackendMock.mockResolvedValue(new Response('<html>oops</html>', { status: 200 }));

    expect(await resolveWebSession()).toBeNull();
  });

  it('never sets or clears a cookie, so the token cannot reach the browser', async () => {
    const set = withRefreshCookie('r');
    refreshReturns({ data: { accessToken: 'tok', role: 'Administrator', status: 'Active' } });

    await resolveWebSession();

    expect(set).not.toHaveBeenCalled();
  });
});
