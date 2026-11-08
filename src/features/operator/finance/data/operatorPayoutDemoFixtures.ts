/**
 * Deterministic Demo fixtures for the Tour Operator beneficiary bank account.
 *
 * The UC-46 settlement-month and payout-history fixtures were removed along with the rest of
 * that model (DAILY-PAYOUT-TRANSFER). Models Operator 101 and foreign Operator 202 for BR-105
 * actor-isolation tests.
 */

import type { BeneficiaryBankAccountDto } from '../types/payoutLifecycle';

export const INITIAL_DEMO_BENEFICIARY_BANKS: Record<string, BeneficiaryBankAccountDto> = {
  '101': {
    bankName: 'Vietcombank (VCB)',
    accountHolderName: 'NGUYEN VAN AN',
    maskedAccountNumber: '******4756',
    updatedAtUtc: '2026-07-01T03:00:00.000Z',
  },
  '202': {
    bankName: 'Techcombank (TCB)',
    accountHolderName: 'LE THI MAI',
    maskedAccountNumber: '******3210',
    updatedAtUtc: '2026-07-01T03:00:00.000Z',
  },
};
