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
vi.mock('@/features/admin/operator-application-queue/OperatorApplicationQueue', () => ({
  OperatorApplicationQueue: () => <p>pending operator application queue</p>,
}));

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';
import PendingOperatorApplicationsPage, { metadata } from './page';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');
const LOGIN_REDIRECT = '/admin/login?returnUrl=%2Fadmin%2Ftour-operator-applications';

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

describe('Screen #10 protected route', () => {
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

  it('exposes an English page title from the resource file', () => {
    expect(metadata.title).toBe('Pending Operator Applications');
  });

  it('redirects a missing session to login with the list return URL', async () => {
    mocks.getCookie.mockReturnValue(undefined);

    const view = await PendingOperatorApplicationsPage();

    expect(mocks.redirect).toHaveBeenCalledWith(LOGIN_REDIRECT);
    expect(view).toBeUndefined();
  });

  it('redirects an unsealed access-token cookie, which is not a trusted session', async () => {
    mocks.getCookie.mockImplementation((name: string) =>
      name === ADMIN_ACCESS_TOKEN_COOKIE ? { value: 'server-only-token' } : undefined,
    );

    await PendingOperatorApplicationsPage();

    expect(mocks.redirect).toHaveBeenCalledWith(LOGIN_REDIRECT);
  });

  it.each(['Staff', 'Administrator'] as const)('renders the queue for a signed %s session', async (role) => {
    mockSealedCookies(role);

    render(await PendingOperatorApplicationsPage());

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByText('pending operator application queue')).toBeTruthy();
  });
});
