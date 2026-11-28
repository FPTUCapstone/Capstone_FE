import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const mocks = vi.hoisted(() => ({ accountSession: vi.fn(), fetchAccounts: vi.fn() }));
vi.mock('@/features/admin/user-accounts/server/accounts', () => mocks);

function moderate(action = 'unlock') {
  const origin = 'http://localhost:3000';
  const request = new Request(`${origin}/api/admin/users/42/${action}`, {
    method: 'POST',
    headers: { origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Resolved' }),
  });

  return POST(request, { params: Promise.resolve({ userId: '42', action }) });
}

describe('account moderation proxy', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.accountSession.mockResolvedValue({ role: 'Staff', token: 'test-session' });
  });

  it('forwards the safe MSG199 details to the Staff unlock form', async () => {
    mocks.fetchAccounts.mockResolvedValue(Response.json({
      title: 'This account cannot be unlocked until the balance is paid.',
      messageCode: 'MSG199',
      outstandingAmountVnd: 1250000,
      detail: 'Internal details',
    }, { status: 409 }));

    const response = await moderate();
    expect(response.status).toBe(409);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({
      title: 'The account cannot be updated in its current state.',
      messageCode: 'MSG199',
      outstandingAmountVnd: 1250000,
    });
  });

  it.each([
    ['unlock', { messageCode: 'OTHER', outstandingAmountVnd: 1250000 }],
    ['unlock', { messageCode: 'MSG199', outstandingAmountVnd: '1250000' }],
    ['lock', { messageCode: 'MSG199', outstandingAmountVnd: 1250000 }],
  ])('uses the existing conflict response for %s with unsupported details', async (action, problem) => {
    mocks.fetchAccounts.mockResolvedValue(Response.json(problem, { status: 409 }));

    const response = await moderate(action);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ title: 'The account cannot be updated in its current state.' });
  });
});
