import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  cancelPayoutRequest,
  getPayoutWorkspaceData,
  requestPayoutSettlement,
  resetDemoPayoutState,
  updateBeneficiaryBank,
} from './operatorPayoutService';
import {
  PAYOUT_ERROR_CODES,
  PAYOUT_MESSAGES,
} from '../types/payoutLifecycle';

describe('operatorPayoutService (UC-46)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      NEXT_PUBLIC_ENABLE_DEMO_FIXTURES: 'true',
    };
    resetDemoPayoutState();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Production NO_BACKEND Truthfulness', () => {
    it('returns empty workspace and PENDING_BE_INTEGRATION notice when isDemo is false', async () => {
      const data = await getPayoutWorkspaceData({ isDemo: false });
      expect(data.settlementPeriods).toEqual([]);
      expect(data.payoutRequests).toEqual([]);
      expect(data.pendingBackendNotice).toBe(PAYOUT_MESSAGES.PENDING_BE_INTEGRATION);
      expect(data.messageCode).toBe(PAYOUT_ERROR_CODES.PENDING_BE_INTEGRATION);
    });

    it('rejects payout submission in production mode', async () => {
      const res = await requestPayoutSettlement(
        {
          periodId: 'per-101-08-2026',
          bankInfo: {
            operatorUserId: 101,
            accountHolder: 'NGUYEN VAN AN',
            bankName: 'VCB',
            accountNumber: '1029384756',
          },
        },
        { isDemo: false }
      );
      expect(res.success).toBe(false);
      expect(res.message).toBe(PAYOUT_MESSAGES.PENDING_BE_INTEGRATION);
    });

    it('rejects payout cancellation in production mode', async () => {
      const res = await cancelPayoutRequest('po-req-0101', { isDemo: false });
      expect(res.success).toBe(false);
      expect(res.message).toBe(PAYOUT_MESSAGES.PENDING_BE_INTEGRATION);
    });
  });

  describe('Demo Mode Retrieval & Ownership Isolation (BR-105)', () => {
    it('fails closed with MSG126 when demoActorUserId is missing', async () => {
      const data = await getPayoutWorkspaceData({ isDemo: true });
      expect(data.errorMessage).toBe(PAYOUT_MESSAGES.MSG126);
      expect(data.messageCode).toBe(PAYOUT_ERROR_CODES.UNAUTHORIZED);
    });

    it('enforces BR-105: operator 101 retrieves only owned periods and requests', async () => {
      const data = await getPayoutWorkspaceData({
        isDemo: true,
        demoActorUserId: 101,
      });

      expect(data.settlementPeriods.length).toBe(5);
      expect(data.settlementPeriods.every((p) => p.operatorUserId === 101)).toBe(true);
      expect(data.settlementPeriods.some((p) => p.operatorUserId === 202)).toBe(false);

      expect(data.beneficiaryBank.accountHolder).toBe('NGUYEN VAN AN');
      expect(data.payoutRequests.length).toBe(1);
      expect(data.payoutRequests[0].id).toBe('po-req-0101');
    });

    it('enforces BR-105: foreign operator 202 data is isolated from operator 101', async () => {
      const data = await getPayoutWorkspaceData({
        isDemo: true,
        demoActorUserId: 202,
      });

      expect(data.settlementPeriods.length).toBe(1);
      expect(data.settlementPeriods[0].operatorUserId).toBe(202);
      expect(data.beneficiaryBank.accountHolder).toBe('LE THI MAI');
      expect(data.payoutRequests.length).toBe(1);
      expect(data.payoutRequests[0].id).toBe('po-req-0202');
    });
  });

  describe('UC-46 Payout Request Eligibility & Submission', () => {
    const validBank = {
      operatorUserId: 101,
      accountHolder: 'NGUYEN VAN AN',
      bankName: 'Vietcombank',
      accountNumber: '1029384756',
    };

    it('successfully submits payout request for an eligible closed period (BR-111, BR-112)', async () => {
      const res = await requestPayoutSettlement(
        {
          periodId: 'per-101-08-2026', // Closed, 2 completed tours, payable 17,640,000 >= 5,000,000
          bankInfo: validBank,
        },
        { isDemo: true, demoActorUserId: 101 }
      );

      expect(res.success).toBe(true);
      expect(res.message).toBe(PAYOUT_MESSAGES.MSG118);
      expect(res.payoutRequest).toBeDefined();
      expect(res.payoutRequest?.status).toBe('Pending Confirmation');
      expect(res.payoutRequest?.requestedAmount).toBe(17640000); // Demo-calculated payable amount estimate
      expect(res.payoutRequest?.bankSnapshot.accountNumber).toBe('1029384756');

      // Verify that settlement period is now marked as hasPendingPayout
      const workspace = await getPayoutWorkspaceData({
        isDemo: true,
        demoActorUserId: 101,
      });
      const period = workspace.settlementPeriods.find(
        (p) => p.id === 'per-101-08-2026'
      );
      expect(period?.hasPendingPayout).toBe(true);
    });

    it('rejects payout request when period is Open / ongoing -> MSG128 (BR-111)', async () => {
      const res = await requestPayoutSettlement(
        {
          periodId: 'per-101-09-2026', // Open status
          bankInfo: validBank,
        },
        { isDemo: true, demoActorUserId: 101 }
      );

      expect(res.success).toBe(false);
      expect(res.message).toBe(PAYOUT_MESSAGES.MSG128);
      expect(res.messageCode).toBe(PAYOUT_ERROR_CODES.PERIOD_INELIGIBLE);
    });

    it('rejects payout request when period has 0 completed tours -> MSG128 (BR-111)', async () => {
      const res = await requestPayoutSettlement(
        {
          periodId: 'per-101-06-2026', // Closed, completedToursCount = 0
          bankInfo: validBank,
        },
        { isDemo: true, demoActorUserId: 101 }
      );

      expect(res.success).toBe(false);
      expect(res.message).toBe(PAYOUT_MESSAGES.MSG128);
    });

    it('rejects payout request when payable amount is below minimum threshold -> MSG120', async () => {
      const res = await requestPayoutSettlement(
        {
          periodId: 'per-101-05-2026', // Closed, payable 3,600,000 < 5,000,000
          bankInfo: validBank,
        },
        { isDemo: true, demoActorUserId: 101 }
      );

      expect(res.success).toBe(false);
      expect(res.message).toBe(PAYOUT_MESSAGES.MSG120);
      expect(res.messageCode).toBe(PAYOUT_ERROR_CODES.BELOW_MINIMUM_AMOUNT);
    });

    it('rejects duplicate pending payout request for the same period -> MSG119 (BR-113)', async () => {
      // First submission succeeds
      const first = await requestPayoutSettlement(
        {
          periodId: 'per-101-08-2026',
          bankInfo: validBank,
        },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(first.success).toBe(true);

      // Second submission on same period is blocked
      const second = await requestPayoutSettlement(
        {
          periodId: 'per-101-08-2026',
          bankInfo: validBank,
        },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(second.success).toBe(false);
      expect(second.message).toBe(PAYOUT_MESSAGES.MSG119);
      expect(second.messageCode).toBe(PAYOUT_ERROR_CODES.REQUEST_ALREADY_PENDING);
    });

    it('rejects payout request when beneficiary bank details are incomplete -> MSG01', async () => {
      const res = await requestPayoutSettlement(
        {
          periodId: 'per-101-08-2026',
          bankInfo: {
            operatorUserId: 101,
            accountHolder: '',
            bankName: 'VCB',
            accountNumber: '',
          },
        },
        { isDemo: true, demoActorUserId: 101 }
      );

      expect(res.success).toBe(false);
      expect(res.message).toBe(PAYOUT_MESSAGES.MSG01);
      expect(res.messageCode).toBe(PAYOUT_ERROR_CODES.MISSING_BENEFICIARY_FIELD);
    });
  });

  describe('UC-46 Cancel Payout Request', () => {
    it('cancels pending confirmation payout request and restores period eligibility', async () => {
      // Create a pending request
      const createRes = await requestPayoutSettlement(
        {
          periodId: 'per-101-08-2026',
          bankInfo: {
            operatorUserId: 101,
            accountHolder: 'NGUYEN VAN AN',
            bankName: 'Vietcombank',
            accountNumber: '1029384756',
          },
        },
        { isDemo: true, demoActorUserId: 101 }
      );
      const reqId = createRes.payoutRequest!.id;

      // Cancel the pending request
      const cancelRes = await cancelPayoutRequest(reqId, {
        isDemo: true,
        demoActorUserId: 101,
      });

      expect(cancelRes.success).toBe(true);
      expect(cancelRes.message).toBe(PAYOUT_MESSAGES.MSG129);
      expect(cancelRes.payoutRequest?.status).toBe('Cancelled');

      // Verify that settlement period hasPendingPayout is released so it can be requested again
      const workspace = await getPayoutWorkspaceData({
        isDemo: true,
        demoActorUserId: 101,
      });
      const period = workspace.settlementPeriods.find(
        (p) => p.id === 'per-101-08-2026'
      );
      expect(period?.hasPendingPayout).toBe(false);

      // Period can now be requested again
      const reRequest = await requestPayoutSettlement(
        {
          periodId: 'per-101-08-2026',
          bankInfo: {
            operatorUserId: 101,
            accountHolder: 'NGUYEN VAN AN',
            bankName: 'Vietcombank',
            accountNumber: '1029384756',
          },
        },
        { isDemo: true, demoActorUserId: 101 }
      );
      expect(reRequest.success).toBe(true);
    });

    it('blocks cancellation of Settled payout requests', async () => {
      const res = await cancelPayoutRequest('po-req-0101', {
        isDemo: true,
        demoActorUserId: 101,
      });

      expect(res.success).toBe(false);
      expect(res.message).toBe(PAYOUT_MESSAGES.CANNOT_CANCEL_NON_PENDING);
      expect(res.messageCode).toBe(PAYOUT_ERROR_CODES.CANNOT_CANCEL_NON_PENDING);
    });

    it('blocks cancellation of foreign operator payout requests (BR-105)', async () => {
      // Operator 101 attempting to cancel operator 202 request po-req-0202
      const res = await cancelPayoutRequest('po-req-0202', {
        isDemo: true,
        demoActorUserId: 101,
      });

      expect(res.success).toBe(false);
      expect(res.message).toBe(PAYOUT_MESSAGES.MSG126);
    });
  });

  describe('Beneficiary Bank Details Update', () => {
    it('updates beneficiary bank account successfully and sanitizes uppercase account holder', async () => {
      const updateRes = await updateBeneficiaryBank(
        {
          operatorUserId: 101,
          accountHolder: 'nguyen van an test',
          bankName: 'BIDV',
          accountNumber: '9988776655',
        },
        { isDemo: true, demoActorUserId: 101 }
      );

      expect(updateRes.success).toBe(true);

      const workspace = await getPayoutWorkspaceData({
        isDemo: true,
        demoActorUserId: 101,
      });
      expect(workspace.beneficiaryBank.accountHolder).toBe('NGUYEN VAN AN TEST');
      expect(workspace.beneficiaryBank.bankName).toBe('BIDV');
      expect(workspace.beneficiaryBank.accountNumber).toBe('9988776655');
    });

    it('rejects bank update with empty fields -> MSG01', async () => {
      const updateRes = await updateBeneficiaryBank(
        {
          operatorUserId: 101,
          accountHolder: '   ',
          bankName: 'BIDV',
          accountNumber: '',
        },
        { isDemo: true, demoActorUserId: 101 }
      );

      expect(updateRes.success).toBe(false);
      expect(updateRes.message).toBe(PAYOUT_MESSAGES.MSG01);
    });
  });
});
