import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  getCookie: vi.fn(),
  redirect: vi.fn(),
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND'); }),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: mocks.getCookie }),
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect, notFound: mocks.notFound }));
vi.mock('@/features/admin/payout-review/PayoutReviewScreen', () => ({
  PayoutReviewScreen: ({ payoutId }: { payoutId: string }) => <div>PayoutReviewScreenMock-{payoutId}</div>,
}));

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';
import PayoutReviewPage from './page';

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

describe('UC-64 protected payout review detail route', () => {
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

  it('calls notFound for a malformed payoutId before reading the session', async () => {
    await expect(PayoutReviewPage({ params: Promise.resolve({ payoutId: 'not-a-number' }) }))
      .rejects.toThrow('NEXT_NOT_FOUND');
    expect(mocks.notFound).toHaveBeenCalled();
    expect(mocks.getCookie).not.toHaveBeenCalled();
  });

  it('redirects to sign-in with the detail returnUrl when no valid session exists', async () => {
    mocks.getCookie.mockReturnValue(undefined);
    await PayoutReviewPage({ params: Promise.resolve({ payoutId: '123' }) });
    expect(mocks.redirect).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Fpayouts%2F123');
  });

  it('redirects an expired session to sign-in with the detail returnUrl', async () => {
    const now = Date.now();
    const expired = createAdminSessionSeal({
      token: 'expired-token',
      role: 'Staff',
      expiresAt: new Date(now - 60_000),
      nowMs: now - 120_000,
      secret: TEST_SECRET,
    })!;
    mocks.getCookie.mockImplementation((name: string) => {
      if (name === ADMIN_ACCESS_TOKEN_COOKIE) return { value: 'expired-token' };
      if (name === ADMIN_SESSION_SEAL_COOKIE) return { value: expired.seal };
      return undefined;
    });
    await PayoutReviewPage({ params: Promise.resolve({ payoutId: '123' }) });
    expect(mocks.redirect).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Fpayouts%2F123');
  });

  it('redirects a tampered (unsealed) session to sign-in', async () => {
    mocks.getCookie.mockImplementation((name: string) =>
      name === ADMIN_ACCESS_TOKEN_COOKIE ? { value: 'modified-token' } : undefined,
    );
    await PayoutReviewPage({ params: Promise.resolve({ payoutId: '123' }) });
    expect(mocks.redirect).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Fpayouts%2F123');
  });

  it('blocks a valid Administrator session before any detail data or actions render', async () => {
    mockSealedSession('Administrator');
    render(await PayoutReviewPage({ params: Promise.resolve({ payoutId: '123' }) }));
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Staff Access Required' })).toBeTruthy();
    expect(screen.queryByText('PayoutReviewScreenMock-123')).toBeNull();
  });

  it('renders the Staff review screen for a valid Staff session', async () => {
    mockSealedSession('Staff');
    render(await PayoutReviewPage({ params: Promise.resolve({ payoutId: '123' }) }));
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByText('PayoutReviewScreenMock-123')).toBeTruthy();
  });
});
