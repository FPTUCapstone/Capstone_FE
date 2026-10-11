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
vi.mock('@/features/admin/active-trip-details/ActiveTripDetailsScreen', () => ({
  ActiveTripDetailsScreen: () => null,
}));

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';
import ActiveTripDetailsPage, { generateMetadata } from './page';

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

describe('UC-59 Active Trip Details protected route', () => {
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

  it('generates correct metadata', async () => {
    const validMeta = await generateMetadata({ params: Promise.resolve({ id: '42' }) });
    expect(validMeta.title).toBe('Active Trip TRIP-42 | TripMate Staff');

    const invalidMeta = await generateMetadata({ params: Promise.resolve({ id: 'invalid' }) });
    expect(invalidMeta.title).toBe('Active Trip Not Found');
  });

  it('triggers notFound on invalid trip id', async () => {
    await ActiveTripDetailsPage({ params: Promise.resolve({ id: 'invalid' }) });
    expect(mocks.notFound).toHaveBeenCalled();
  });

  it('redirects an unauthenticated request to login with the return URL', async () => {
    mocks.getCookie.mockReturnValue(undefined);

    await ActiveTripDetailsPage({ params: Promise.resolve({ id: '42' }) });

    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Ftrips%2Factive%2F42',
    );
  });

  it('renders the details screen when accessed with a valid Staff session', async () => {
    mockSealedCookies('Staff');

    const view = await ActiveTripDetailsPage({ params: Promise.resolve({ id: '42' }) });

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(view).toBeTruthy();
  });

  it('renders access denied when accessed with an Administrator session', async () => {
    mockSealedCookies('Administrator');

    const view = await ActiveTripDetailsPage({ params: Promise.resolve({ id: '42' }) });

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(view).toBeTruthy();
  });
});
