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
vi.mock('@/features/admin/landing-content/LandingContentScreen', () => ({
  LandingContentScreen: () => null,
}));
vi.mock('@/lib/server/adminSession', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/server/adminSession')>();
  return { ...actual, verifyAdminSessionFromCookies: vi.fn(actual.verifyAdminSessionFromCookies) };
});

import { LandingContentScreen } from '@/features/admin/landing-content/LandingContentScreen';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
  verifyAdminSessionFromCookies,
} from '@/lib/server/adminSession';
import LandingContentPage from './page';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');
const LOGIN_REDIRECT = '/admin/login?returnUrl=%2Fadmin%2Flanding-content';

function mockCookies(options: {
  role?: 'Administrator' | 'Staff';
  token?: string;
  cookieToken?: string;
  expired?: boolean;
  tamper?: boolean;
}) {
  const token = options.token ?? 'backend-access-token';
  const sealed = createAdminSessionSeal({
    token,
    role: options.role ?? 'Administrator',
    // An already-expired seal can only be built by issuing it in the past.
    nowMs: options.expired ? Date.now() - 20 * 60 * 1000 : undefined,
    expiresAt: new Date(Date.now() + (options.expired ? -10 : 10) * 60 * 1000),
    secret: TEST_SECRET,
  })!;
  const seal = options.tamper ? sealed.seal.slice(0, -1) + (sealed.seal.endsWith('a') ? 'b' : 'a') : sealed.seal;
  mocks.getCookie.mockImplementation((name: string) => {
    if (name === ADMIN_ACCESS_TOKEN_COOKIE) return { value: options.cookieToken ?? token };
    if (name === ADMIN_SESSION_SEAL_COOKIE) return { value: seal };
    return undefined;
  });
}

describe('UC-66 Landing Page Content Management page route', () => {
  let priorSecret: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    priorSecret = process.env[ADMIN_SESSION_SECRET_ENV];
    process.env[ADMIN_SESSION_SECRET_ENV] = TEST_SECRET;
  });

  afterEach(() => {
    if (priorSecret === undefined) delete process.env[ADMIN_SESSION_SECRET_ENV];
    else process.env[ADMIN_SESSION_SECRET_ENV] = priorSecret;
  });

  it('redirects missing cookies to login with the exact returnUrl', async () => {
    mocks.getCookie.mockReturnValue(undefined);
    await LandingContentPage();
    expect(mocks.redirect).toHaveBeenCalledWith(LOGIN_REDIRECT);
  });

  it('redirects an unsealed token to login', async () => {
    mocks.getCookie.mockImplementation((name: string) =>
      name === ADMIN_ACCESS_TOKEN_COOKIE ? { value: 'unsealed-token' } : undefined,
    );
    await LandingContentPage();
    expect(mocks.redirect).toHaveBeenCalledWith(LOGIN_REDIRECT);
  });

  it('redirects an expired seal to login', async () => {
    mockCookies({ expired: true });
    await LandingContentPage();
    expect(mocks.redirect).toHaveBeenCalledWith(LOGIN_REDIRECT);
  });

  it('redirects a tampered seal to login', async () => {
    mockCookies({ tamper: true });
    await LandingContentPage();
    expect(mocks.redirect).toHaveBeenCalledWith(LOGIN_REDIRECT);
  });

  it('redirects an access token that does not match the seal', async () => {
    mockCookies({ token: 'original-token', cookieToken: 'different-token' });
    await LandingContentPage();
    expect(mocks.redirect).toHaveBeenCalledWith(LOGIN_REDIRECT);
  });

  it('redirects when reading cookies throws', async () => {
    mocks.getCookie.mockImplementation(() => {
      throw new Error('cookie failure');
    });
    await LandingContentPage();
    expect(mocks.redirect).toHaveBeenCalledWith(LOGIN_REDIRECT);
  });

  it('renders the screen for an Administrator session', async () => {
    mockCookies({ role: 'Administrator' });
    const result = await LandingContentPage();
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect((result as { type: unknown }).type).toBe(LandingContentScreen);
  });

  it('renders the screen for a Staff session', async () => {
    mockCookies({ role: 'Staff' });
    const result = await LandingContentPage();
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect((result as { type: unknown }).type).toBe(LandingContentScreen);
  });

  it('denies a verified session whose role is neither Administrator nor Staff', async () => {
    vi.mocked(verifyAdminSessionFromCookies).mockReturnValueOnce({
      role: 'Operator',
      userId: 1,
      issuedAtMs: 0,
      expiresAtMs: Date.now() + 60_000,
      tokenFingerprint: 'x',
    } as never);
    const result = await LandingContentPage();
    expect((result as { type: unknown }).type).toBe(AdminAccessDeniedView);
  });
});
