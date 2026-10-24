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
vi.mock('@/features/admin/account/AdminChangePasswordView', () => ({
  AdminChangePasswordView: () => <div>Admin UC-07</div>,
}));

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';
import AdminAccountSecurityPage from './page';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');

describe('/admin/account/security protected route', () => {
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

  it('redirects a missing or unsealed Admin session cookie through the canonical guard', async () => {
    mocks.getCookie.mockReturnValue(undefined);

    await AdminAccountSecurityPage();

    expect(mocks.redirect).toHaveBeenCalledWith('/admin/login');

    mocks.redirect.mockClear();
    mocks.getCookie.mockImplementation((name: string) =>
      name === ADMIN_ACCESS_TOKEN_COOKIE ? { value: 'server-only-token' } : undefined,
    );

    await AdminAccountSecurityPage();

    expect(mocks.redirect).toHaveBeenCalledWith('/admin/login');
  });

  it.each(['Administrator', 'Staff'] as const)(
    'remains accessible when a valid BFF-signed %s session cookie is present',
    async (role) => {
      const token = `${role.toLowerCase()}-backend-token`;
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

      render(await AdminAccountSecurityPage());

      expect(mocks.redirect).not.toHaveBeenCalled();
      expect(screen.getByText('Admin UC-07')).toBeDefined();
    },
  );
});
