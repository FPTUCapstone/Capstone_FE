import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({ getCookie: vi.fn(), redirect: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: mocks.getCookie }) }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/features/admin/payout-settlements/FailedPayoutSettlementScreen', () => ({
  FailedPayoutSettlementScreen: ({ batchId }: { batchId: number }) => (
    <div data-testid="failed-payout-settlement-screen-mock" data-batch-id={batchId} />
  ),
}));

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';
import { adminStaffEn } from '@/features/admin/staff/resources/en';
import FailedPayoutSettlementPage from './page';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');

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

describe('FailedPayoutSettlementPage (UC-73 server guard)', () => {
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
    await FailedPayoutSettlementPage({ params: Promise.resolve({ batchId: '42' }) });
    expect(mocks.redirect).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Fpayout-settlements%2F42');
  });

  it('denies a Staff session (Administrator-only)', async () => {
    mockValidSession('Staff');
    render(await FailedPayoutSettlementPage({ params: Promise.resolve({ batchId: '42' }) }));
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 1, name: adminStaffEn.accessDenied.title })).toBeTruthy();
    expect(screen.queryByTestId('failed-payout-settlement-screen-mock')).toBeNull();
  });

  it('renders an invalid-ID message for a non-numeric batchId, without rendering the screen', async () => {
    mockValidSession('Administrator');
    render(await FailedPayoutSettlementPage({ params: Promise.resolve({ batchId: 'abc' }) }));
    expect(screen.getByText(/valid payout batch id/i)).toBeTruthy();
    expect(screen.queryByTestId('failed-payout-settlement-screen-mock')).toBeNull();
  });

  it('renders the screen for an Administrator session with a valid batchId', async () => {
    mockValidSession('Administrator');
    render(await FailedPayoutSettlementPage({ params: Promise.resolve({ batchId: '42' }) }));
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByTestId('failed-payout-settlement-screen-mock').getAttribute('data-batch-id')).toBe('42');
  });
});
