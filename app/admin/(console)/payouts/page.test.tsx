import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  getCookie: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: mocks.getCookie }),
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/features/admin/payout-records/PayoutRecordsScreen', () => ({
  PayoutRecordsScreen: () => <div>PayoutRecordsScreenMock</div>,
}));

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';
import PayoutsPage from './page';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');

function mockSealedSession(role: 'Administrator' | 'Staff', token = 'valid-backend-token') {
  const sealed = createAdminSessionSeal({
    token,
    role,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    secret: TEST_SECRET,
  })!;
  mocks.getCookie.mockImplementation((name: string) => {
    if (name === ADMIN_ACCESS_TOKEN_COOKIE) return { value: token };
    if (name === ADMIN_SESSION_SEAL_COOKIE) return { value: sealed.seal };
    return undefined;
  });
}

describe('UC-63 protected payout review route', () => {
  let priorSecret: string | undefined;

  beforeEach(() => {
    vi.resetAllMocks();
    priorSecret = process.env[ADMIN_SESSION_SECRET_ENV];
    process.env[ADMIN_SESSION_SECRET_ENV] = TEST_SECRET;
  });

  afterEach(() => {
    if (priorSecret === undefined) delete process.env[ADMIN_SESSION_SECRET_ENV];
    else process.env[ADMIN_SESSION_SECRET_ENV] = priorSecret;
  });

  it('redirects missing, malformed, expired, or token-mismatched sessions before the Staff screen renders', async () => {
    mocks.getCookie.mockReturnValue(undefined);
    await PayoutsPage();
    expect(mocks.redirect).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Fpayouts');

    mocks.redirect.mockClear();
    const now = Date.now();
    const expired = createAdminSessionSeal({
      token: 'expired-token',
      role: 'Staff',
      expiresAt: new Date(now - 60_000),
      nowMs: now - 120_000,
      secret: TEST_SECRET,
    })!;
    mocks.getCookie.mockImplementation((name: string) => {
      if (name === ADMIN_ACCESS_TOKEN_COOKIE) return { value: 'expired-token' };
      if (name === ADMIN_SESSION_SEAL_COOKIE) return { value: expired.seal };
      return undefined;
    });
    await PayoutsPage();
    expect(mocks.redirect).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Fpayouts');

    mocks.redirect.mockClear();
    mocks.getCookie.mockImplementation((name: string) =>
      name === ADMIN_ACCESS_TOKEN_COOKIE ? { value: 'unsealed-token' } : undefined,
    );
    await PayoutsPage();
    expect(mocks.redirect).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Fpayouts');

    mocks.redirect.mockClear();
    mockSealedSession('Staff', 'sealed-token');
    mocks.getCookie.mockImplementation((name: string) => {
      if (name === ADMIN_ACCESS_TOKEN_COOKIE) return { value: 'modified-token' };
      const sealed = createAdminSessionSeal({
        token: 'sealed-token',
        role: 'Staff',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        secret: TEST_SECRET,
      })!;
      if (name === ADMIN_SESSION_SEAL_COOKIE) return { value: sealed.seal };
      return undefined;
    });
    await PayoutsPage();
    expect(mocks.redirect).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Fpayouts');
  });

  it('renders the Staff review screen for a valid Staff session', async () => {
    mockSealedSession('Staff');
    render(await PayoutsPage());
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByText('PayoutRecordsScreenMock')).toBeTruthy();
  });

  it('blocks a valid Administrator session before Staff data or actions render', async () => {
    mockSealedSession('Administrator');
    render(await PayoutsPage());
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Staff Access Required' })).toBeTruthy();
    expect(screen.queryByText('PayoutRecordsScreenMock')).toBeNull();
  });
});
