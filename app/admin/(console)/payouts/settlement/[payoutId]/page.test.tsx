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
vi.mock('@/features/admin/payout-settlement/PayoutSettlementDetailScreen', () => ({
  PayoutSettlementDetailScreen: ({ payoutId }: { payoutId: string }) => <div>SettlementDetailMock-{payoutId}</div>,
}));

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';
import PayoutSettlementDetailPage, { generateMetadata } from './page';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');
const params = (payoutId: string) => ({ params: Promise.resolve({ payoutId }) });

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

describe('UC-65 protected payout settlement detail route', () => {
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

  it.each(['not-a-number', '0', '-1', '9223372036854775808'])(
    'calls notFound for the malformed payoutId %s before reading the session',
    async (payoutId) => {
      await expect(PayoutSettlementDetailPage(params(payoutId))).rejects.toThrow('NEXT_NOT_FOUND');
      expect(mocks.getCookie).not.toHaveBeenCalled();
    },
  );

  it('redirects a missing session to sign-in with the detail URL as return URL', async () => {
    mocks.getCookie.mockReturnValue(undefined);
    await PayoutSettlementDetailPage(params('123'));
    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Fpayouts%2Fsettlement%2F123',
    );
  });

  it('renders access denied for Staff without loading the detail screen', async () => {
    mockSealedSession('Staff');
    render(await PayoutSettlementDetailPage(params('123')));
    expect(screen.getByRole('heading', { name: 'Administrator Access Required' })).toBeTruthy();
    expect(screen.queryByText('SettlementDetailMock-123')).toBeNull();
  });

  it('renders the settlement detail for an Administrator', async () => {
    mockSealedSession('Administrator');
    render(await PayoutSettlementDetailPage(params('123')));
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByText('SettlementDetailMock-123')).toBeTruthy();
  });

  it('builds a title only for a valid id', async () => {
    expect(await generateMetadata(params('123'))).toMatchObject({ title: expect.stringContaining('PO-123') });
    expect(await generateMetadata(params('abc'))).toEqual({ title: 'Payout Not Found' });
  });
});
