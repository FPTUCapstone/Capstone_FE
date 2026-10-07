/**
 * Deterministic Demo fixtures for Settlement & Payouts (UC-46).
 * Explicitly models settlement periods, beneficiary bank details, and payout requests
 * for Operator 101 and foreign Operator 202 (BR-105 isolation).
 */

import type {
  BeneficiaryBankDto,
  PayoutRequestDto,
  SettlementPeriodDto,
} from '../types/payoutLifecycle';

export const INITIAL_DEMO_BENEFICIARY_BANKS: Record<string | number, BeneficiaryBankDto> = {
  101: {
    operatorUserId: 101,
    accountHolder: 'NGUYEN VAN AN',
    bankName: 'Vietcombank (VCB)',
    accountNumber: '1029384756',
  },
  202: {
    operatorUserId: 202,
    accountHolder: 'LE THI MAI',
    bankName: 'Techcombank (TCB)',
    accountNumber: '9876543210',
  },
};

export const INITIAL_DEMO_SETTLEMENT_PERIODS: SettlementPeriodDto[] = [
  // Operator 101 - Eligible closed period (August 2026)
  {
    id: 'per-101-08-2026',
    operatorUserId: 101,
    periodCode: 'PER-2026-08',
    periodLabel: '01/08/2026 - 31/08/2026',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    completedToursCount: 2,
    grossRevenue: 19600000,
    commission: 1960000,
    payableNetAmount: 17640000,
    status: 'Closed',
    hasPendingPayout: false,
  },
  // Operator 101 - Past closed period (July 2026) already settled
  {
    id: 'per-101-07-2026',
    operatorUserId: 101,
    periodCode: 'PER-2026-07',
    periodLabel: '01/07/2026 - 31/07/2026',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    completedToursCount: 3,
    grossRevenue: 25000000,
    commission: 2500000,
    payableNetAmount: 22500000,
    status: 'Closed',
    hasPendingPayout: false,
  },
  // Operator 101 - Open / ongoing period (September 2026) -> Ineligible (BR-111)
  {
    id: 'per-101-09-2026',
    operatorUserId: 101,
    periodCode: 'PER-2026-09',
    periodLabel: '01/09/2026 - 30/09/2026',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    completedToursCount: 2,
    grossRevenue: 14000000,
    commission: 1400000,
    payableNetAmount: 12600000,
    status: 'Open',
    hasPendingPayout: false,
  },
  // Operator 101 - Closed period with 0 completed tours -> Ineligible (BR-111)
  {
    id: 'per-101-06-2026',
    operatorUserId: 101,
    periodCode: 'PER-2026-06',
    periodLabel: '01/06/2026 - 30/06/2026',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    completedToursCount: 0,
    grossRevenue: 0,
    commission: 0,
    payableNetAmount: 0,
    status: 'Closed',
    hasPendingPayout: false,
  },
  // Operator 101 - Closed period below 5,000,000 minimum threshold -> Ineligible (MSG120)
  {
    id: 'per-101-05-2026',
    operatorUserId: 101,
    periodCode: 'PER-2026-05',
    periodLabel: '01/05/2026 - 31/05/2026',
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    completedToursCount: 1,
    grossRevenue: 4000000,
    commission: 400000,
    payableNetAmount: 3600000,
    status: 'Closed',
    hasPendingPayout: false,
  },

  // Foreign Operator 202 settlement periods (BR-105 isolation)
  {
    id: 'per-202-08-2026',
    operatorUserId: 202,
    periodCode: 'PER-2026-08',
    periodLabel: '01/08/2026 - 31/08/2026',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    completedToursCount: 4,
    grossRevenue: 48000000,
    commission: 4800000,
    payableNetAmount: 43200000,
    status: 'Closed',
    hasPendingPayout: false,
  },
];

export const INITIAL_DEMO_PAYOUT_REQUESTS: PayoutRequestDto[] = [
  // Operator 101 settled request
  {
    id: 'po-req-0101',
    requestCode: 'PO-20260805-0101',
    operatorUserId: 101,
    periodId: 'per-101-07-2026',
    periodLabel: '01/07/2026 - 31/07/2026',
    requestedAmount: 22500000,
    status: 'Settled',
    requestedAt: '2026-08-05T09:15:00.000Z',
    settledAt: '2026-08-08T14:30:00.000Z',
    bankSnapshot: INITIAL_DEMO_BENEFICIARY_BANKS[101],
  },
  // Foreign Operator 202 request (BR-105 isolation)
  {
    id: 'po-req-0202',
    requestCode: 'PO-20260901-0202',
    operatorUserId: 202,
    periodId: 'per-202-08-2026',
    periodLabel: '01/08/2026 - 31/08/2026',
    requestedAmount: 43200000,
    status: 'Pending Confirmation',
    requestedAt: '2026-09-01T10:00:00.000Z',
    bankSnapshot: INITIAL_DEMO_BENEFICIARY_BANKS[202],
  },
];
