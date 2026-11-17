import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  getCookie: vi.fn(),
  redirect: vi.fn(),
  notFound: vi.fn(),
  fetchBackend: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: mocks.getCookie }),
}));
vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
  notFound: mocks.notFound,
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: mocks.fetchBackend }));

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

describe('UC-46 User Account Detail page route', () => {
  let priorSecret: string | undefined;

  beforeEach(() => {
    vi.resetAllMocks();
    mocks.fetchBackend.mockResolvedValue(new Response(null, { status: 500 }));
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
      nowMs: Date.now() - 20 * 60 * 1000,
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

  it('renders detail when valid ID and session are provided', async () => {
    mockSealedCookies('Administrator');

    const view = await UserAccountDetailPage({ params: Promise.resolve({ userId: '4402' }) });

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.notFound).not.toHaveBeenCalled();
    expect(view).toBeTruthy();
  });

  it('accepts a valid Staff session', async () => {
    mockSealedCookies('Staff');

    const view = await UserAccountDetailPage({ params: Promise.resolve({ userId: '4402' }) });

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.notFound).not.toHaveBeenCalled();
    expect(view).toBeTruthy();
  });

  it.each([
    { role: 'Staff', actor: 'Administrator', bookingCount: null, expected: 'N/A' },
    { role: 'TourOperator', actor: 'Staff', bookingCount: 0, expected: '0' },
  ])('renders the metric and event attribution for a $role target', async ({ role, actor, bookingCount, expected }) => {
    mockSealedCookies(actor === 'Staff' ? 'Staff' : 'Administrator');
    mocks.fetchBackend.mockResolvedValue(Response.json({
      account: { userId: '4402', fullName: 'Test Account', email: null, role, status: 'Active',
        createdAtUtc: '2026-11-15T18:30:00Z', lastLoginAtUtc: null },
      bookingCount,
      moderationHistory: [{ action: 'TOUR_OPERATOR_AUTO_LOCKED', actorAttribution: 'System',
        reason: 'Outstanding balance', atUtc: '2026-11-15T18:30:00Z' }],
    }));
    const view = await UserAccountDetailPage({ params: Promise.resolve({ userId: '4402' }) });
    const markup = renderToStaticMarkup(view!);
    expect(markup).toContain(`<dt>Associated bookings</dt><dd>${expected}</dd>`);
    expect(markup).toContain('Automatically locked');
    expect(markup).toContain('System');
    expect(markup).toContain('Outstanding balance');
    expect(markup).toContain('16/11/2026');
    expect(markup).toContain('01:30');
    expect(markup).not.toContain('backend-access-token');
  });
});
