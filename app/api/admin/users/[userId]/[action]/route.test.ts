import { beforeEach, describe, expect, it, vi } from 'vitest';

const { accountSessionMock, fetchAccountsMock } = vi.hoisted(() => ({
  accountSessionMock: vi.fn(),
  fetchAccountsMock: vi.fn(),
}));

vi.mock('@/features/admin/user-accounts/server/accounts', () => ({
  accountSession: accountSessionMock,
  fetchAccounts: fetchAccountsMock,
}));
vi.mock('@/lib/server/adminSession', () => ({
  isSameOriginRequest: () => true,
  jsonNoStore: (body: unknown, status = 200) => Response.json(body, { status }),
}));

import { adminUserAccountsEn } from '@/features/admin/user-accounts/resources/en';
import { POST } from './route';

const { MSG126, MSG127, MSG133 } = adminUserAccountsEn.moderation.messages;

function call(action: 'lock' | 'unlock', reason: unknown = 'x') {
  return POST(
    new Request(`http://localhost/api/admin/users/42/${action}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
    { params: Promise.resolve({ userId: '42', action }) },
  );
}

async function expectResponse(response: Response, status: number, title: string) {
  expect(response.status).toBe(status);
  expect(await response.json()).toEqual({ title });
}

describe('/api/admin/users/[userId]/[action] route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    accountSessionMock.mockResolvedValue({ role: 'Staff', token: 'tok' });
  });

  describe('lock', () => {
    it('maps backend 403 to MSG126', async () => {
      fetchAccountsMock.mockResolvedValue({ ok: false, status: 403 });
      await expectResponse(await call('lock'), 403, MSG126);
    });

    it('maps backend 409 to MSG133', async () => {
      fetchAccountsMock.mockResolvedValue({ ok: false, status: 409 });
      await expectResponse(await call('lock'), 409, MSG133);
    });

    it('maps an unmapped backend status to MSG127 with 503', async () => {
      fetchAccountsMock.mockResolvedValue({ ok: false, status: 500 });
      await expectResponse(await call('lock'), 503, MSG127);
    });

    it('maps a network failure to MSG127 with 503', async () => {
      fetchAccountsMock.mockRejectedValue(new Error('network'));
      await expectResponse(await call('lock'), 503, MSG127);
    });

    it('keeps the existing 400/401/404 titles', async () => {
      fetchAccountsMock.mockResolvedValue({ ok: false, status: 400 });
      await expectResponse(await call('lock'), 400, 'Check the supplied reason.');
      fetchAccountsMock.mockResolvedValue({ ok: false, status: 401 });
      await expectResponse(await call('lock'), 401, 'Sign in again to continue.');
      fetchAccountsMock.mockResolvedValue({ ok: false, status: 404 });
      await expectResponse(await call('lock'), 404, 'Account unavailable.');
    });
  });

  describe('unlock', () => {
    it('keeps the existing 409 title', async () => {
      fetchAccountsMock.mockResolvedValue({ ok: false, status: 409 });
      await expectResponse(await call('unlock'), 409, 'The account cannot be updated in its current state.');
    });

    it('keeps the existing 403 title', async () => {
      fetchAccountsMock.mockResolvedValue({ ok: false, status: 403 });
      await expectResponse(await call('unlock'), 403, 'Access denied.');
    });

    it('keeps the existing network failure title', async () => {
      fetchAccountsMock.mockRejectedValue(new Error('network'));
      await expectResponse(await call('unlock'), 503, 'Account management is temporarily unavailable.');
    });

    it('keeps the existing unmapped-status title', async () => {
      fetchAccountsMock.mockResolvedValue({ ok: false, status: 500 });
      await expectResponse(await call('unlock'), 503, 'Account management is temporarily unavailable.');
    });
  });

  it('rejects a reason longer than 200 characters without calling the backend', async () => {
    await expectResponse(await call('lock', 'a'.repeat(201)), 400, 'Enter a reason of up to 200 characters.');
    expect(fetchAccountsMock).not.toHaveBeenCalled();
  });

  it('forwards the trimmed reason and returns updated: true on success', async () => {
    fetchAccountsMock.mockResolvedValue({ ok: true, status: 200 });
    const response = await call('lock', '  x  ');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ updated: true });
    expect(fetchAccountsMock).toHaveBeenCalledWith('tok', '/42/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'x' }),
    });
  });
});
