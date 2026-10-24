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
vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
  usePathname: () => '/admin/catalogue/points-of-interest',
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

import AdminPoiCatalogPage from './page';
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');

function mockSealedSession(role: 'Administrator' | 'Staff', token = 'valid-backend-token') {
  const sealed = createAdminSessionSeal({
    token,
    role,
    userId: role === 'Administrator' ? 1 : 2,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    secret: TEST_SECRET,
  })!;
  mocks.getCookie.mockImplementation((name: string) => {
    if (name === ADMIN_ACCESS_TOKEN_COOKIE) return { value: token };
    if (name === ADMIN_SESSION_SEAL_COOKIE) return { value: sealed.seal };
    return undefined;
  });
}

describe('AdminPoiCatalogPage (/admin/catalogue/points-of-interest, Screen #16)', () => {
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

  it('redirects unauthenticated or unsealed requests to login with returnUrl', async () => {
    mocks.getCookie.mockReturnValue(undefined);
    await AdminPoiCatalogPage();
    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Fcatalogue%2Fpoints-of-interest',
    );
  });

  it('renders for authenticated Staff session with single AdminConsoleShell', async () => {
    mockSealedSession('Staff');
    const result = await AdminPoiCatalogPage();
    render(result);

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 1, name: 'Points of Interest Catalog' })).toBeTruthy();
    expect(screen.getByText('Master Data Management')).toBeTruthy();
  });

  it('renders for authenticated Administrator session per SRS Table 5 master data permission', async () => {
    mockSealedSession('Administrator');
    const result = await AdminPoiCatalogPage();
    render(result);

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 1, name: 'Points of Interest Catalog' })).toBeTruthy();
  });
});
