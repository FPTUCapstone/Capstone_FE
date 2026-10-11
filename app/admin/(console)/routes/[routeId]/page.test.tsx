import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  getCookie: vi.fn(),
  redirect: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: mocks.getCookie }),
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
  notFound: mocks.notFound,
}));

import RouteDetailPage from './page';
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');

function mockSealedSession(role: 'Administrator' | 'Staff' = 'Administrator') {
  const token = 'valid-token';
  const sealed = createAdminSessionSeal({
    token,
    role,
    userId: 1,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    secret: TEST_SECRET,
  })!;
  mocks.getCookie.mockImplementation((name: string) => {
    if (name === ADMIN_ACCESS_TOKEN_COOKIE) return { value: token };
    if (name === ADMIN_SESSION_SEAL_COOKIE) return { value: sealed.seal };
    return undefined;
  });
}

describe('RouteDetailPage (/admin/routes/[routeId])', () => {
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

  it('redirects unauthenticated sessions to admin login with returnUrl', async () => {
    mocks.getCookie.mockReturnValue(undefined);

    await RouteDetailPage({ params: Promise.resolve({ routeId: '42' }) });

    expect(mocks.redirect).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Froutes');
  });

  it('calls notFound() for invalid route IDs', async () => {
    mockSealedSession('Administrator');

    for (const invalid of ['0', '-1', 'abc', '1.5']) {
      await expect(
        RouteDetailPage({ params: Promise.resolve({ routeId: invalid }) }),
      ).rejects.toThrow('NEXT_NOT_FOUND');
      expect(mocks.notFound).toHaveBeenCalled();
      mocks.notFound.mockClear();
    }
  });

  it('renders Update Route view with valid route ID context for Administrator', async () => {
    mockSealedSession('Administrator');

    render(await RouteDetailPage({ params: Promise.resolve({ routeId: '108' }) }));

    expect(screen.getByRole('heading', { level: 1, name: 'Update Route' })).toBeTruthy();
    expect(screen.getByText('108')).toBeTruthy();
  });

  it('renders Update Route view with valid route ID context for Staff', async () => {
    mockSealedSession('Staff');

    render(await RouteDetailPage({ params: Promise.resolve({ routeId: '256' }) }));

    expect(screen.getByRole('heading', { level: 1, name: 'Update Route' })).toBeTruthy();
    expect(screen.getByText('256')).toBeTruthy();
  });
});
