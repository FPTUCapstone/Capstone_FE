import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  cancelPayout,
  getAvailableBalance,
  getBeneficiaryBankAccount,
  getPayoutHistory,
  getSettlementMonths,
  PayoutLoadError,
  requestPayout,
  resetDemoPayoutState,
  updateBeneficiaryBankAccount,
} from './operatorPayoutService';

describe('operatorPayoutService (UC-46)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      NEXT_PUBLIC_ENABLE_DEMO_FIXTURES: 'true',
    };
    resetDemoPayoutState();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  describe('Production BFF calls', () => {
    it('calls the settlement-months endpoint with the year query', async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
      vi.stubGlobal('fetch', fetchMock);

      await getSettlementMonths(2026, { isDemo: false });

      expect(fetchMock).toHaveBeenCalledWith('/api/operator/payouts/settlement-months?year=2026', { cache: 'no-store' });
    });

    it('calls the available-balance endpoint', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ periodCount: 0, requestable: false }), { status: 200 })
      );
      vi.stubGlobal('fetch', fetchMock);

      await getAvailableBalance({ isDemo: false });

      expect(fetchMock).toHaveBeenCalledWith('/api/operator/payouts/available-balance', { cache: 'no-store' });
    });

    it('calls the bank-account GET endpoint', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ bankName: null, accountHolderName: null, maskedAccountNumber: null, updatedAtUtc: null }), { status: 200 })
      );
      vi.stubGlobal('fetch', fetchMock);

      await getBeneficiaryBankAccount({ isDemo: false });

      expect(fetchMock).toHaveBeenCalledWith('/api/operator/payouts/bank-account', { cache: 'no-store' });
    });

    it('PUTs the bank-account endpoint with the submitted fields', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ bankName: 'VCB', accountHolderName: 'A', maskedAccountNumber: '****1234', updatedAtUtc: '2026-10-22T00:00:00Z' }), { status: 200 })
      );
      vi.stubGlobal('fetch', fetchMock);

      await updateBeneficiaryBankAccount(
        { bankName: 'VCB', accountHolderName: 'A', accountNumber: '1234567890' },
        { isDemo: false }
      );

      expect(fetchMock).toHaveBeenCalledWith('/api/operator/payouts/bank-account', expect.objectContaining({ method: 'PUT' }));
      const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(sentBody.accountNumber).toBe('1234567890');
    });

    it('POSTs a payout request with no body (claims the whole available balance)', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ payoutCode: 'PO-202610-000001', status: 'PendingReview' }), { status: 201 })
      );
      vi.stubGlobal('fetch', fetchMock);

      await requestPayout({ isDemo: false });

      expect(fetchMock).toHaveBeenCalledWith('/api/operator/payouts', { method: 'POST' });
    });

    it('maps a non-ok response to its backend errorCode', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ errorCode: 'ACTIVE_PAYOUT_EXISTS' }), { status: 409 })
      );
      vi.stubGlobal('fetch', fetchMock);

      const result = await requestPayout({ isDemo: false });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ACTIVE_PAYOUT_EXISTS');
    });

    it('calls the cancel endpoint for the given payout code', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ payoutCode: 'PO-202608-000001', status: 'Cancelled' }), { status: 200 })
      );
      vi.stubGlobal('fetch', fetchMock);

      await cancelPayout('PO-202608-000001', { isDemo: false });

      expect(fetchMock).toHaveBeenCalledWith('/api/operator/payouts/PO-202608-000001/cancel', expect.objectContaining({ method: 'POST' }));
    });

    it('throws a PayoutLoadError (not an empty result) when fetch rejects (network failure)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

      await expect(getSettlementMonths(2026, { isDemo: false })).rejects.toThrow(PayoutLoadError);
    });

    it('throws a PayoutLoadError carrying the status when the backend returns 401', async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
      vi.stubGlobal('fetch', fetchMock);

      await expect(getSettlementMonths(2026, { isDemo: false })).rejects.toMatchObject({ status: 401 });
    });

    it('throws a PayoutLoadError for the available-balance, bank-account, and history reads too', async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
      vi.stubGlobal('fetch', fetchMock);

      await expect(getAvailableBalance({ isDemo: false })).rejects.toThrow(PayoutLoadError);
      await expect(getBeneficiaryBankAccount({ isDemo: false })).rejects.toThrow(PayoutLoadError);
      await expect(getPayoutHistory(1, 20, { isDemo: false })).rejects.toThrow(PayoutLoadError);
    });
  });

  describe('Demo Mode Retrieval & Ownership Isolation (BR-105)', () => {
    it('returns nothing when demoActorUserId is missing', async () => {
      const months = await getSettlementMonths(2026, { isDemo: true });
      expect(months).toEqual([]);
    });

    it('enforces BR-105: operator 101 sees only owned settlement months', async () => {
      const months = await getSettlementMonths(2026, { isDemo: true, demoActorUserId: 101 });
      expect(months.length).toBeGreaterThan(0);
      expect(months.some((m) => m.month === 8)).toBe(true);
    });

    it('enforces BR-105: foreign operator 202 data is isolated from operator 101', async () => {
      const months202 = await getSettlementMonths(2026, { isDemo: true, demoActorUserId: 202 });
      const bank101 = await getBeneficiaryBankAccount({ isDemo: true, demoActorUserId: 101 });
      const bank202 = await getBeneficiaryBankAccount({ isDemo: true, demoActorUserId: 202 });

      expect(months202.length).toBe(2);
      expect(bank101.accountHolderName).toBe('NGUYEN VAN AN');
      expect(bank202.accountHolderName).toBe('LE THI MAI');
    });
  });

  describe('UC-46 Available Balance Aggregation (demo)', () => {
    it('aggregates every closed, unclaimed month into one balance (BR-111, BR-112)', async () => {
      const balance = await getAvailableBalance({ isDemo: true, demoActorUserId: 101 });

      expect(balance.periodCount).toBe(2);
      expect(balance.payableNetAmount).toBe(3_600_000 + 17_640_000);
      expect(balance.requestable).toBe(true);
    });

    it('excludes months already claimed by a live payout (BR-105 scoped to operator 202)', async () => {
      const balance = await getAvailableBalance({ isDemo: true, demoActorUserId: 202 });
      expect(balance.periodCount).toBe(1);
      expect(balance.payableNetAmount).toBe(43_200_000);
    });
  });

  describe('UC-46 Payout Request Submission (demo)', () => {
    it('successfully submits a payout claiming the entire available balance (BR-111, BR-112)', async () => {
      const res = await requestPayout({ isDemo: true, demoActorUserId: 101 });

      expect(res.success).toBe(true);
      expect(res.data?.status).toBe('PendingReview');
      expect(res.data?.periodCount).toBe(2);
      expect(res.data?.payableNetAmount).toBe(3_600_000 + 17_640_000);
      expect(res.data?.maskedAccountNumber).toBe('******4756');

      const months = await getSettlementMonths(2026, { isDemo: true, demoActorUserId: 101 });
      const august = months.find((m) => m.month === 8);
      expect(august?.coverage).toBe('IncludedInPayout');
      expect(august?.payoutCode).toBe(res.data?.payoutCode);
    });

    it('rejects a duplicate request while one is already active (ACTIVE_PAYOUT_EXISTS, BR-113)', async () => {
      const first = await requestPayout({ isDemo: true, demoActorUserId: 101 });
      expect(first.success).toBe(true);

      const second = await requestPayout({ isDemo: true, demoActorUserId: 101 });
      expect(second.success).toBe(false);
      expect(second.errorCode).toBe('ACTIVE_PAYOUT_EXISTS');
    });
  });

  describe('UC-46 Cancel Payout Request (demo)', () => {
    it('cancels a PendingReview request and returns its months to the available balance', async () => {
      const created = await requestPayout({ isDemo: true, demoActorUserId: 101 });
      const payoutCode = created.data!.payoutCode;

      const cancelRes = await cancelPayout(payoutCode, { isDemo: true, demoActorUserId: 101 });
      expect(cancelRes.success).toBe(true);
      expect(cancelRes.data?.status).toBe('Cancelled');

      const months = await getSettlementMonths(2026, { isDemo: true, demoActorUserId: 101 });
      const august = months.find((m) => m.month === 8);
      expect(august?.coverage).toBe('AvailableBalance');

      const reRequest = await requestPayout({ isDemo: true, demoActorUserId: 101 });
      expect(reRequest.success).toBe(true);
    });

    it('blocks cancelling a foreign operator payout (BR-105, PAYOUT_NOT_FOUND)', async () => {
      const res = await cancelPayout('PO-202606-000202', { isDemo: true, demoActorUserId: 101 });
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('PAYOUT_NOT_FOUND');
    });

    it('blocks cancelling an already-Settled request (PAYOUT_NOT_CANCELLABLE)', async () => {
      const res = await cancelPayout('PO-202606-000202', { isDemo: true, demoActorUserId: 202 });
      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('PAYOUT_NOT_CANCELLABLE');
    });
  });

  describe('Beneficiary Bank Account (demo)', () => {
    it('updates the bank account and returns only the masked number', async () => {
      // Uppercasing the account holder name is a UI-layer concern (BeneficiaryBankCard already
      // uppercases before calling this); the service stores and returns what it is given, trimmed.
      const res = await updateBeneficiaryBankAccount(
        { bankName: 'BIDV', accountHolderName: 'NGUYEN VAN AN TEST', accountNumber: '9988776655' },
        { isDemo: true, demoActorUserId: 101 }
      );

      expect(res.success).toBe(true);
      expect(res.data?.accountHolderName).toBe('NGUYEN VAN AN TEST');
      expect(res.data?.maskedAccountNumber).toBe('******6655');
      expect(JSON.stringify(res.data)).not.toContain('9988776655');
    });

    it('rejects an update with empty required fields (VALIDATION_REQUIRED_FIELD)', async () => {
      const res = await updateBeneficiaryBankAccount(
        { bankName: 'BIDV', accountHolderName: '   ', accountNumber: '' },
        { isDemo: true, demoActorUserId: 101 }
      );

      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('VALIDATION_REQUIRED_FIELD');
    });
  });

  describe('Payout history (demo)', () => {
    it('returns only the authenticated operator\'s history', async () => {
      const history = await getPayoutHistory(1, 20, { isDemo: true, demoActorUserId: 202 });
      expect(history.items.length).toBe(1);
      expect(history.items[0].payoutCode).toBe('PO-202606-000202');
    });
  });
});
