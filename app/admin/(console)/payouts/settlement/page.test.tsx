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
vi.mock('@/features/admin/payout-settlement/PayoutSettlementQueueScreen', () => ({
  PayoutSettlementQueueScreen: () => <div>PayoutSettlementQueueScreenMock</div>,
}));

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';
import PayoutSettlementPage from './page';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');

function mockSealedSession(role: 'Administrator' | 'Staff', token = 'valid-backend-token') {
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

describe('UC-65 Payout Settlement Route', () => {
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

  it('redirects unauthenticated or unsealed sessions to admin login with returnUrl', async () => {
    mocks.getCookie.mockReturnValue(undefined);
    await PayoutSettlementPage();
    expect(mocks.redirect).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Fpayouts%2Fsettlement');
  });

  it('renders AdminAccessDeniedView when accessed by Staff role', async () => {
    mockSealedSession('Staff');
    render(await PayoutSettlementPage());
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Administrator Access Required' })).toBeTruthy();
    expect(screen.queryByText('PayoutSettlementQueueScreenMock')).toBeNull();
  });

  it('renders the settlement queue when accessed by Administrator role', async () => {
    mockSealedSession('Administrator');
    render(await PayoutSettlementPage());
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByText('PayoutSettlementQueueScreenMock')).toBeTruthy();
    expect(screen.queryByText('Pending Backend Settlement Service')).toBeNull();
  });
});
