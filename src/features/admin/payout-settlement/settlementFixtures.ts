import type { SettlementDetail } from './payoutSettlement';

export const approved: SettlementDetail = {
  payoutId: '123', payoutCode: 'PO-000123', status: 'ApprovedForSettlement',
  settlementPeriod: { startDate: '2026-09-01', endDate: '2026-09-30' },
  tourOperator: { operatorId: '7', companyName: 'Hoi An Tours' },
  grossRevenue: 12000000, commissionRate: 0.1, commissionAmount: 1200000, netPayoutAmount: 10800000,
  requestedAtUtc: '2026-10-03T08:15:00+00:00',
  reviewedAtUtc: '2026-10-04T08:15:00+00:00', reviewedBy: '5',
  settlementAuthorizedAtUtc: null, settlementAuthorizedBy: null,
  beneficiary: { bankName: 'Vietcombank', accountHolder: 'Nguyen Van A', maskedAccountNumber: '****1234' },
  bankBinResolved: true, outcome: null,
};

export const withOutcome = (
  status: SettlementDetail['status'],
  outcome: NonNullable<SettlementDetail['outcome']>,
): SettlementDetail => ({
  ...approved, status, settlementAuthorizedAtUtc: '2026-11-01T09:00:00+00:00', settlementAuthorizedBy: '2', outcome,
});

export const processing = withOutcome('SettlementProcessing', {
  gatewayState: 'Submitted', failureCode: null, submittedAtUtc: '2026-11-01T09:00:05+00:00', reconciliationRequired: false,
});
