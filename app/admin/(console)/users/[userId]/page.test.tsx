import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  getCookie: vi.fn(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: mocks.getCookie }),
}));
vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
  notFound: mocks.notFound,
}));

import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';
import UserAccountDetailPage from './page';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');

function mockSealedCookies(role: 'Administrator' | 'Staff' = 'Administrator', token = 'backend-access-token') {
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

describe('UC-47 User Account Detail page route', () => {
  let priorSecret: string | undefined;

  beforeEach(() => {
    vi.resetAllMocks();
    priorSecret = process.env[ADMIN_SESSION_SECRET_ENV];
    process.env[ADMIN_SESSION_SECRET_ENV] = TEST_SECRET;
  });

  afterEach(() => {
    if (priorSecret === undefined) {
      delete process.env[ADMIN_SESSION_SECRET_ENV];
    } else {
      process.env[ADMIN_SESSION_SECRET_ENV] = priorSecret;
    }
  });

  it('redirects missing session cookies to login with returnUrl', async () => {
    mocks.getCookie.mockReturnValue(undefined);

    await UserAccountDetailPage({ params: Promise.resolve({ userId: '4402' }) });

    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Fusers',
    );
  });

  it('redirects expired session seal to login', async () => {
    const expiredSealed = createAdminSessionSeal({
      token: 'backend-access-token',
      role: 'Administrator',
      expiresAt: new Date(Date.now() - 10 * 60 * 1000),
      secret: TEST_SECRET,
    })!;
    mocks.getCookie.mockImplementation((name: string) => {
      if (name === ADMIN_ACCESS_TOKEN_COOKIE) return { value: 'backend-access-token' };
      if (name === ADMIN_SESSION_SEAL_COOKIE) return { value: expiredSealed.seal };
      return undefined;
    });

    await UserAccountDetailPage({ params: Promise.resolve({ userId: '4402' }) });

    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Fusers',
    );
  });

  it('redirects tampered session seal to login', async () => {
    const validSealed = createAdminSessionSeal({
      token: 'backend-access-token',
      role: 'Administrator',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      secret: TEST_SECRET,
    })!;
    const tamperedSeal = validSealed.seal.slice(0, -1) + (validSealed.seal.endsWith('a') ? 'b' : 'a');
    mocks.getCookie.mockImplementation((name: string) => {
      if (name === ADMIN_ACCESS_TOKEN_COOKIE) return { value: 'backend-access-token' };
      if (name === ADMIN_SESSION_SEAL_COOKIE) return { value: tamperedSeal };
      return undefined;
    });

    await UserAccountDetailPage({ params: Promise.resolve({ userId: '4402' }) });

    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Fusers',
    );
  });

  it('redirects access token mismatch to login', async () => {
    const sealed = createAdminSessionSeal({
      token: 'original-backend-token',
      role: 'Administrator',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      secret: TEST_SECRET,
    })!;
    mocks.getCookie.mockImplementation((name: string) => {
      if (name === ADMIN_ACCESS_TOKEN_COOKIE) return { value: 'different-backend-token' };
      if (name === ADMIN_SESSION_SEAL_COOKIE) return { value: sealed.seal };
      return undefined;
    });

    await UserAccountDetailPage({ params: Promise.resolve({ userId: '4402' }) });

    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Fusers',
    );
  });

  it('triggers notFound() when route parameter is non-numeric or invalid', async () => {
    mockSealedCookies('Administrator');

    await UserAccountDetailPage({ params: Promise.resolve({ userId: 'invalid-id' }) });
    expect(mocks.notFound).toHaveBeenCalledTimes(1);

    mocks.notFound.mockClear();
    await UserAccountDetailPage({ params: Promise.resolve({ userId: '0' }) });
    expect(mocks.notFound).toHaveBeenCalledTimes(1);

    mocks.notFound.mockClear();
    await UserAccountDetailPage({ params: Promise.resolve({ userId: '-5' }) });
    expect(mocks.notFound).toHaveBeenCalledTimes(1);
  });

  it('renders detail unavailable shell when valid ID and session are provided', async () => {
    mockSealedCookies('Administrator');

    const view = await UserAccountDetailPage({ params: Promise.resolve({ userId: '4402' }) });

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.notFound).not.toHaveBeenCalled();
    expect(view).toBeTruthy();
  });

  it('renders access denied view when accessed with a valid Staff session', async () => {
    mockSealedCookies('Staff');

    const view = await UserAccountDetailPage({ params: Promise.resolve({ userId: '4402' }) });

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.notFound).not.toHaveBeenCalled();
    expect(view?.type).toBe(AdminAccessDeniedView);
  });
});
