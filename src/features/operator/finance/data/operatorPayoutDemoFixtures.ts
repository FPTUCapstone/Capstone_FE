/**
 * Deterministic Demo fixtures for Request Payout Settlement (UC-46).
 * "Available balance" model (2026-10-23): a single request aggregates every closed, eligible,
 * not-yet-paid settlement month into one payout. Models two months of unclaimed revenue for
 * Operator 101 (so the demo shows the aggregation in action) and one already-settled payout for
 * foreign Operator 202 (BR-105 isolation).
 */

import type {
  BeneficiaryBankAccountDto,
  PayoutHistoryItemDto,
  SettlementMonthDto,
} from '../types/payoutLifecycle';

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

export const INITIAL_DEMO_SETTLEMENT_MONTHS: Record<string, SettlementMonthDto[]> = {
  '101': [
    // Two closed, unclaimed months — together they form the available balance.
    {
      year: 2026, month: 7, monthStatus: 'Closed', eligibleBookingCount: 1,
      paymentsReceived: 4_000_000, discountsGiven: 0, refundedAmount: 0, netSales: 4_000_000,
      commissionAmount: 400_000, payableNetAmount: 3_600_000,
      coverage: 'AvailableBalance', payoutCode: null,
    },
    {
      year: 2026, month: 8, monthStatus: 'Closed', eligibleBookingCount: 2,
      paymentsReceived: 19_600_000, discountsGiven: 0, refundedAmount: 0, netSales: 19_600_000,
      commissionAmount: 1_960_000, payableNetAmount: 17_640_000,
      coverage: 'AvailableBalance', payoutCode: null,
    },
    // Open / ongoing month -> not closed yet, excluded from the balance.
    {
      year: 2026, month: 9, monthStatus: 'Open', eligibleBookingCount: 2,
      paymentsReceived: 14_000_000, discountsGiven: 0, refundedAmount: 0, netSales: 14_000_000,
      commissionAmount: 1_400_000, payableNetAmount: 12_600_000,
      coverage: 'Open', payoutCode: null,
    },
  ],
  '202': [
    // Already claimed by a settled payout from a prior request.
    {
      year: 2026, month: 6, monthStatus: 'Closed', eligibleBookingCount: 2,
      paymentsReceived: 15_000_000, discountsGiven: 0, refundedAmount: 0, netSales: 15_000_000,
      commissionAmount: 1_500_000, payableNetAmount: 13_500_000,
      coverage: 'IncludedInPayout', payoutCode: 'PO-202606-000202',
    },
    {
      year: 2026, month: 8, monthStatus: 'Closed', eligibleBookingCount: 4,
      paymentsReceived: 48_000_000, discountsGiven: 0, refundedAmount: 0, netSales: 48_000_000,
      commissionAmount: 4_800_000, payableNetAmount: 43_200_000,
      coverage: 'AvailableBalance', payoutCode: null,
    },
  ],
};

export const INITIAL_DEMO_PAYOUT_HISTORY: Record<string, PayoutHistoryItemDto[]> = {
  '101': [],
  '202': [
    {
      payoutCode: 'PO-202606-000202', periodCount: 1, periodStart: '2026-06-01', periodEnd: '2026-06-30',
      payableNetAmount: 13_500_000, status: 'Settled',
      requestedAtUtc: '2026-07-01T10:00:00.000Z', settledAtUtc: '2026-07-04T14:30:00.000Z',
      rejectionReason: null, cancellable: false,
    },
  ],
};
