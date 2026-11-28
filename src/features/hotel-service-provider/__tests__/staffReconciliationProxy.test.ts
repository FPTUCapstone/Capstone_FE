import { beforeEach, describe, expect, it, vi } from 'vitest';
import { proxyStaffReconciliation } from '../server/workflowProxy';

vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({
  fetchBackend: vi.fn(),
  verifiedSession: vi.fn(),
}));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => ({ value: 'test-token' }) }) }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: mocks.fetchBackend }));
vi.mock('@/lib/server/adminSession', () => ({
  ADMIN_ACCESS_TOKEN_COOKIE: 'test-cookie',
  isSameOriginRequest: () => true,
  verifyAdminSessionFromCookies: mocks.verifiedSession,
}));

const origin = 'http://localhost:3000';
const statementsPath = '/api/admin/commercial-settlements/reconciliation';

function reconcile(reference?: string, receivedAmountVnd: unknown = 1250000) {
  return proxyStaffReconciliation(new Request(`${origin}${statementsPath}/42/reconcile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin },
    body: JSON.stringify({ bankTransferReference: reference, receivedAmountVnd }),
  }), '42', 'reconcile');
}

describe('Staff commission receipt proxy', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('rejects Administrator reads and confirmation before forwarding to the backend', async () => {
    mocks.verifiedSession.mockReturnValue({ role: 'Administrator' });
    expect((await proxyStaffReconciliation(new Request(`${origin}${statementsPath}`))).status).toBe(403);
    expect((await reconcile('BANK-421')).status).toBe(403);
    expect(mocks.fetchBackend).not.toHaveBeenCalled();
  });

  it('requires and forwards a verified bank reference and a positive whole-VND amount', async () => {
    mocks.verifiedSession.mockReturnValue({ role: 'Staff' });
    mocks.fetchBackend.mockResolvedValue(Response.json({ status: 'Paid' }));
    expect((await reconcile('  ')).status).toBe(400);
    expect((await reconcile('a'.repeat(101))).status).toBe(400);
    expect((await reconcile()).status).toBe(400);
    const invalidAmount = await reconcile('BANK-421', 123.5);
    expect(invalidAmount.status).toBe(400);
    expect(await invalidAmount.json()).toEqual({ errorCode: 'CommissionStatement.ReceiptAmountMismatch' });
    expect((await reconcile('BANK-421', '1250000')).status).toBe(400);
    expect((await reconcile('BANK-421', 0)).status).toBe(400);
    expect(mocks.fetchBackend).not.toHaveBeenCalled();
    expect((await reconcile(' BANK-421 ')).status).toBe(200);
    expect(mocks.fetchBackend).toHaveBeenCalledWith('/api/v1/admin/commercial-settlements/reconciliation/42/reconcile',
      expect.objectContaining({ body: JSON.stringify({ notes: null, bankTransferReference: 'BANK-421', receivedAmountVnd: 1250000 }) }));
  });

  it.each(['BankReferenceAlreadyUsed', 'ReceiptAmountMismatch'])('preserves the safe %s error for Staff', async (code) => {
    mocks.verifiedSession.mockReturnValue({ role: 'Staff' });
    const errorCode = `CommissionStatement.${code}`;
    mocks.fetchBackend.mockResolvedValue(Response.json({ errorCode }, { status: 409 }));
    const res = await reconcile('BANK-421');
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ errorCode });
  });
});
