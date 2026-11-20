import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/server/backend', () => ({
  fetchBackend: vi.fn(async () => new Response(JSON.stringify({ items: [], totalPages: 1 }), {
    headers: { 'Content-Type': 'application/json' },
  })),
}));

const mocks = vi.hoisted(() => ({
  getCookie: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: mocks.getCookie }),
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';
import UserAccountsPage from './page';

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

describe('UC-47 User Accounts Directory page route', () => {
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

    await UserAccountsPage({});

    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Fusers',
    );
  });

  it('redirects unsealed or invalid token to login', async () => {
    mocks.getCookie.mockImplementation((name: string) =>
      name === ADMIN_ACCESS_TOKEN_COOKIE ? { value: 'unsealed-token' } : undefined,
    );

    await UserAccountsPage({});

    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Fusers',
    );
  });

  it('redirects expired session seal to login', async () => {
    const expiredSealed = createAdminSessionSeal({
      token: 'backend-access-token',
      role: 'Administrator',
      nowMs: Date.now() - 20 * 60 * 1000,
      expiresAt: new Date(Date.now() - 10 * 60 * 1000),
      secret: TEST_SECRET,
    })!;
    mocks.getCookie.mockImplementation((name: string) => {
      if (name === ADMIN_ACCESS_TOKEN_COOKIE) return { value: 'backend-access-token' };
      if (name === ADMIN_SESSION_SEAL_COOKIE) return { value: expiredSealed.seal };
      return undefined;
    });

    await UserAccountsPage({});

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

    await UserAccountsPage({});

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

    await UserAccountsPage({});

    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Fusers',
    );
  });

  it('renders directory when valid Administrator session is present', async () => {
    mockSealedCookies('Administrator');

    const view = await UserAccountsPage({});

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(view).toBeTruthy();
    render(view!);
    expect(screen.getByRole('link', { name: 'Create Staff Account' }).getAttribute('href'))
      .toBe('/admin/users/create-staff');
  });

  it('renders user management with the Staff provisioning entrypoint', async () => {
    mockSealedCookies('Staff');

    const view = await UserAccountsPage({});

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(view).toBeTruthy();
    render(view!);
    expect(screen.getByRole('link', { name: 'Create Service Provider Account' }).getAttribute('href'))
      .toBe('/admin/service-providers/create');
  });
});
