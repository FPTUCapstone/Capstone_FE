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
}));
vi.mock('@/features/admin/reports/components/StatisticalReportsView', () => ({
  StatisticalReportsView: ({
    actorRole,
    initialMode,
  }: {
    actorRole?: string | null;
    initialMode?: string;
  }) => (
    <div
      data-testid="statistical-reports-view-mock"
      data-actor-role={actorRole ?? ''}
      data-initial-mode={initialMode ?? ''}
    />
  ),
}));

import { canAccessStatisticalReports } from '@/features/admin/reports/guards/statisticalReportAuth';
import { adminStaffEn } from '@/features/admin/staff/resources/en';
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';
import StatisticalReportsPage from './page';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');
const ATTACKER_SECRET = Buffer.from('fedcba9876543210fedcba9876543210', 'utf8').toString(
  'base64url',
);
const EXPECTED_LOGIN_REDIRECT = '/admin/login?returnUrl=%2Fadmin%2Freports';

function createJwt(payload: Record<string, unknown>, signature = 'fake-signature'): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.${signature}`;
}

function setSessionCookies(cookiesMap: {
  readonly accessToken?: string;
  readonly sessionSeal?: string;
}) {
  mocks.getCookie.mockImplementation((name: string) => {
    if (name === ADMIN_ACCESS_TOKEN_COOKIE && cookiesMap.accessToken !== undefined) {
      return { value: cookiesMap.accessToken };
    }
    if (name === ADMIN_SESSION_SEAL_COOKIE && cookiesMap.sessionSeal !== undefined) {
      return { value: cookiesMap.sessionSeal };
    }
    return undefined;
  });
}

function mockValidSealedSession(
  role: 'Administrator' | 'Staff',
  token = `${role.toLowerCase()}-backend-access-token`,
  expiresAt = new Date(Date.now() + 10 * 60 * 1000),
) {
  const sealed = createAdminSessionSeal({
    token,
    role,
    userId: role === 'Administrator' ? 1 : 2,
    expiresAt,
    secret: TEST_SECRET,
  })!;
  setSessionCookies({
    accessToken: token,
    sessionSeal: sealed.seal,
  });
  return { token, seal: sealed.seal };
}

describe('UC-67 /admin/reports protected route & BFF-signed session boundary', () => {
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
    vi.unstubAllEnvs();
  });

  it('redirects when the access-token cookie is missing (even if a session seal is present)', async () => {
    const sealed = createAdminSessionSeal({
      token: 'admin-token',
      role: 'Administrator',
      expiresAt: new Date(Date.now() + 60_000),
      secret: TEST_SECRET,
    })!;

    setSessionCookies({});
    await StatisticalReportsPage({});
    expect(mocks.redirect).toHaveBeenCalledWith(EXPECTED_LOGIN_REDIRECT);

    mocks.redirect.mockClear();
    setSessionCookies({ sessionSeal: sealed.seal });
    await StatisticalReportsPage({ searchParams: Promise.resolve({ demo: 'true' }) });
    expect(mocks.redirect).toHaveBeenCalledWith(EXPECTED_LOGIN_REDIRECT);
  });

  it('redirects when the session-seal cookie is missing', async () => {
    setSessionCookies({
      accessToken: createJwt({ sub: 'admin-1', role: 'Administrator' }),
    });

    await StatisticalReportsPage({});

    expect(mocks.redirect).toHaveBeenCalledWith(EXPECTED_LOGIN_REDIRECT);
  });

  it('redirects when the HMAC session seal is malformed or tampered', async () => {
    const { token, seal } = mockValidSealedSession('Administrator');
    const [version, payloadB64] = seal.split('.');

    for (const badSeal of [
      'not-a-valid-seal',
      `${version}.${payloadB64}.tampered-hmac-signature`,
    ]) {
      mocks.redirect.mockClear();
      setSessionCookies({
        accessToken: token,
        sessionSeal: badSeal,
      });

      await StatisticalReportsPage({});

      expect(mocks.redirect).toHaveBeenCalledWith(EXPECTED_LOGIN_REDIRECT);
    }
  });

  it('redirects on token fingerprint mismatch when the access-token cookie does not match the sealed token', async () => {
    const sealedForTokenA = createAdminSessionSeal({
      token: 'admin-token-a',
      role: 'Administrator',
      expiresAt: new Date(Date.now() + 60_000),
      secret: TEST_SECRET,
    })!;

    setSessionCookies({
      accessToken: 'admin-token-b',
      sessionSeal: sealedForTokenA.seal,
    });

    await StatisticalReportsPage({});

    expect(mocks.redirect).toHaveBeenCalledWith(EXPECTED_LOGIN_REDIRECT);
  });

  it('redirects when the signed administration session has expired', async () => {
    const nowMs = Date.now();
    const expiredSeal = createAdminSessionSeal({
      token: 'expired-admin-token',
      role: 'Administrator',
      expiresAt: new Date(nowMs + 1000),
      nowMs: nowMs - 60_000,
      secret: TEST_SECRET,
    })!;

    // Advance beyond expiry by creating a seal whose exp is in the past relative to current Date.now()
    const pastSeal = createAdminSessionSeal({
      token: 'expired-admin-token',
      role: 'Administrator',
      expiresAt: new Date(nowMs - 5000),
      nowMs: nowMs - 60_000,
      secret: TEST_SECRET,
    })!;

    expect(expiredSeal).not.toBeNull();
    setSessionCookies({
      accessToken: 'expired-admin-token',
      sessionSeal: pastSeal.seal,
    });

    await StatisticalReportsPage({});

    expect(mocks.redirect).toHaveBeenCalledWith(EXPECTED_LOGIN_REDIRECT);
  });

  it('CRITICAL REGRESSION: denies a forged JWT claiming role="Administrator" without a valid server-signed HMAC seal in both Production and Demo modes', async () => {
    const forgedAdminToken = createJwt({ sub: 'attacker', role: 'Administrator' }, 'fake-signature');
    const attackerSealed = createAdminSessionSeal({
      token: forgedAdminToken,
      role: 'Administrator',
      expiresAt: new Date(Date.now() + 60_000),
      secret: ATTACKER_SECRET,
    })!;

    // Case 1: Forged JWT with no seal
    setSessionCookies({ accessToken: forgedAdminToken });
    await StatisticalReportsPage({});
    expect(mocks.redirect).toHaveBeenCalledWith(EXPECTED_LOGIN_REDIRECT);

    // Case 2: Forged JWT with seal signed by wrong secret, even with ?demo=true
    mocks.redirect.mockClear();
    setSessionCookies({
      accessToken: forgedAdminToken,
      sessionSeal: attackerSealed.seal,
    });
    await StatisticalReportsPage({ searchParams: Promise.resolve({ demo: 'true' }) });
    expect(mocks.redirect).toHaveBeenCalledWith(EXPECTED_LOGIN_REDIRECT);
  });

  it('fails closed and redirects to login when TRIPMATE_ADMIN_SESSION_SECRET is missing or invalid', async () => {
    mockValidSealedSession('Administrator');

    for (const invalidSecret of ['', 'too-short', 'REPLACE_WITH_32_BYTE_BASE64URL_ADMIN_SESSION_SECRET']) {
      mocks.redirect.mockClear();
      process.env[ADMIN_SESSION_SECRET_ENV] = invalidSecret;

      await StatisticalReportsPage({});

      expect(mocks.redirect).toHaveBeenCalledWith(EXPECTED_LOGIN_REDIRECT);
    }

    mocks.redirect.mockClear();
    delete process.env[ADMIN_SESSION_SECRET_ENV];
    await StatisticalReportsPage({});
    expect(mocks.redirect).toHaveBeenCalledWith(EXPECTED_LOGIN_REDIRECT);
  });

  it('denies a valid signed Staff session by rendering AdminAccessDeniedView in both Production and Demo modes (BR-115)', async () => {
    mockValidSealedSession('Staff');

    const prodView = render(await StatisticalReportsPage({}));
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { level: 1, name: adminStaffEn.accessDenied.title }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: adminStaffEn.accessDenied.returnToStaffButton })
        .getAttribute('href'),
    ).toBe('/admin/staff');
    expect(screen.queryByTestId('statistical-reports-view-mock')).toBeNull();
    expect(canAccessStatisticalReports('Staff')).toBe(false);
    prodView.unmount();

    // Even with ?demo=true in development, Staff must remain blocked
    vi.stubEnv('NODE_ENV', 'development');
    const demoView = render(
      await StatisticalReportsPage({ searchParams: Promise.resolve({ demo: 'true' }) }),
    );
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { level: 1, name: adminStaffEn.accessDenied.title }),
    ).toBeTruthy();
    expect(screen.queryByTestId('statistical-reports-view-mock')).toBeNull();
    demoView.unmount();
  });

  it('allows a valid signed Administrator session and defaults workspace mode to PRODUCTION', async () => {
    mockValidSealedSession('Administrator');

    const view = render(await StatisticalReportsPage({}));

    expect(mocks.redirect).not.toHaveBeenCalled();
    const rendered = screen.getByTestId('statistical-reports-view-mock');
    expect(rendered.getAttribute('data-actor-role')).toBe('Administrator');
    expect(rendered.getAttribute('data-initial-mode')).toBe('PRODUCTION');
    expect(canAccessStatisticalReports('Administrator')).toBe(true);
    view.unmount();
  });

  it('enables DEMO mode only when explicit ?demo=true is provided in a non-production environment with a valid signed Administrator session', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    mockValidSealedSession('Administrator');

    const view = render(
      await StatisticalReportsPage({
        searchParams: Promise.resolve({ demo: 'true' }),
      }),
    );

    expect(mocks.redirect).not.toHaveBeenCalled();
    const rendered = screen.getByTestId('statistical-reports-view-mock');
    expect(rendered.getAttribute('data-actor-role')).toBe('Administrator');
    expect(rendered.getAttribute('data-initial-mode')).toBe('DEMO');
    view.unmount();
  });

  it('locks mode to PRODUCTION when NODE_ENV=production even if ?demo=true is passed with a valid signed Administrator session', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    mockValidSealedSession('Administrator');

    const view = render(
      await StatisticalReportsPage({
        searchParams: Promise.resolve({ demo: 'true' }),
      }),
    );

    expect(mocks.redirect).not.toHaveBeenCalled();
    const rendered = screen.getByTestId('statistical-reports-view-mock');
    expect(rendered.getAttribute('data-actor-role')).toBe('Administrator');
    expect(rendered.getAttribute('data-initial-mode')).toBe('PRODUCTION');
    view.unmount();
  });
});
