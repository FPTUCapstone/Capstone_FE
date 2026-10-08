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
vi.mock('@/features/admin/audit-logs/components/AuditLogManagementView', () => ({
  AuditLogManagementView: () => null,
}));

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';
import AuditLogsPage from './page';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');

function mockSealedCookies(role: 'Administrator' | 'Staff', token = 'backend-access-token') {
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

describe('UC-68 protected route', () => {
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

  it('redirects a missing or unsealed Admin cookie to login with the audit-list return URL', async () => {
    mocks.getCookie.mockReturnValue(undefined);

    await AuditLogsPage();

    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Faudit-logs',
    );

    mocks.redirect.mockClear();
    mocks.getCookie.mockImplementation((name: string) =>
      name === ADMIN_ACCESS_TOKEN_COOKIE ? { value: 'server-only-token' } : undefined,
    );

    await AuditLogsPage();

    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Faudit-logs',
    );
  });

  it('renders the route when a valid BFF-signed Administrator session is present', async () => {
    mockSealedCookies('Administrator');

    await AuditLogsPage();

    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('renders the Administrator-only access denied view when accessed with a valid BFF-signed Staff session', async () => {
    mockSealedCookies('Staff');

    const view = await AuditLogsPage();

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(view).toBeTruthy();
  });
});
