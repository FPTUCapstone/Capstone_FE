import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({ getCookie: vi.fn(), redirect: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: mocks.getCookie }) }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/features/admin/payout-settlements/PayoutSettlementsScreen', () => ({
  PayoutSettlementsScreen: ({ viewerRole }: { viewerRole: string }) => (
    <div data-testid="payout-settlements-screen-mock" data-viewer-role={viewerRole} />
  ),
}));

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';
import PayoutSettlementsPage from './page';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');
const EXPECTED_LOGIN_REDIRECT = '/admin/login?returnUrl=%2Fadmin%2Fpayout-settlements';

function setSessionCookies(cookiesMap: { accessToken?: string; sessionSeal?: string }) {
  mocks.getCookie.mockImplementation((name: string) => {
    if (name === ADMIN_ACCESS_TOKEN_COOKIE && cookiesMap.accessToken !== undefined) return { value: cookiesMap.accessToken };
    if (name === ADMIN_SESSION_SEAL_COOKIE && cookiesMap.sessionSeal !== undefined) return { value: cookiesMap.sessionSeal };
    return undefined;
  });
}

function mockValidSession(role: 'Administrator' | 'Staff', token = `${role.toLowerCase()}-token`) {
  const sealed = createAdminSessionSeal({ token, role, expiresAt: new Date(Date.now() + 600_000), secret: TEST_SECRET })!;
  setSessionCookies({ accessToken: token, sessionSeal: sealed.seal });
}

describe('PayoutSettlementsPage (UC-72 server guard)', () => {
  let priorSecret: string | undefined;

  beforeEach(() => {
    vi.resetAllMocks();
    priorSecret = process.env[ADMIN_SESSION_SECRET_ENV];
    process.env[ADMIN_SESSION_SECRET_ENV] = TEST_SECRET;
  });

  afterEach(() => {
    if (priorSecret === undefined) delete process.env[ADMIN_SESSION_SECRET_ENV];
    else process.env[ADMIN_SESSION_SECRET_ENV] = priorSecret;
  });

  it('redirects to sign-in with a returnUrl when there is no session', async () => {
    setSessionCookies({});
    await PayoutSettlementsPage();
    expect(mocks.redirect).toHaveBeenCalledWith(EXPECTED_LOGIN_REDIRECT);
  });

  it('redirects to sign-in when the session seal is missing or tampered', async () => {
    mockValidSession('Staff');
    const [version, payload] = mocks.getCookie(ADMIN_SESSION_SEAL_COOKIE).value.split('.');
    setSessionCookies({ accessToken: 'staff-token', sessionSeal: `${version}.${payload}.tampered` });
    await PayoutSettlementsPage();
    expect(mocks.redirect).toHaveBeenCalledWith(EXPECTED_LOGIN_REDIRECT);
  });

  it('renders the screen for a Staff session, passing its role through', async () => {
    mockValidSession('Staff');
    render(await PayoutSettlementsPage());
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByTestId('payout-settlements-screen-mock').getAttribute('data-viewer-role')).toBe('Staff');
  });

  it('renders the screen for an Administrator session, passing its role through', async () => {
    mockValidSession('Administrator');
    render(await PayoutSettlementsPage());
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByTestId('payout-settlements-screen-mock').getAttribute('data-viewer-role')).toBe('Administrator');
  });
});
