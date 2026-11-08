import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  getBeneficiaryBankAccount,
  PayoutLoadError,
  resetDemoPayoutState,
  updateBeneficiaryBankAccount,
} from './operatorPayoutService';

// The UC-46 "Request Payout Settlement" model (available balance, settlement months, request
// and cancel actions, payout history by request) was removed from SRS v11 (DAILY-PAYOUT-TRANSFER).
// Only the beneficiary bank account functions remain.
describe('operatorPayoutService (beneficiary bank account)', () => {
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

    it('throws a PayoutLoadError (not an empty result) when fetch rejects (network failure)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

      await expect(getBeneficiaryBankAccount({ isDemo: false })).rejects.toThrow(PayoutLoadError);
    });

    it('throws a PayoutLoadError carrying the status when the backend returns 401', async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
      vi.stubGlobal('fetch', fetchMock);

      await expect(getBeneficiaryBankAccount({ isDemo: false })).rejects.toMatchObject({ status: 401 });
    });
  });

  describe('Demo Mode Retrieval & Ownership Isolation (BR-105)', () => {
    it('returns the empty shape when demoActorUserId is missing', async () => {
      const bank = await getBeneficiaryBankAccount({ isDemo: true });
      expect(bank.bankName).toBeNull();
    });

    it('enforces BR-105: foreign operator 202 data is isolated from operator 101', async () => {
      const bank101 = await getBeneficiaryBankAccount({ isDemo: true, demoActorUserId: 101 });
      const bank202 = await getBeneficiaryBankAccount({ isDemo: true, demoActorUserId: 202 });

      expect(bank101.accountHolderName).toBe('NGUYEN VAN AN');
      expect(bank202.accountHolderName).toBe('LE THI MAI');
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
});
