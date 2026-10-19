/**
 * Settlement History and Payout Request (UC-46) lifecycle contracts and data structures.
 * Based strictly on Report 3 V2 §3.8.5.3.
 */

export type SettlementPeriodStatus = 'Open' | 'Closed';

export type PayoutRequestStatus =
  | 'Pending Confirmation'
  | 'Settled'
  | 'Rejected'
  | 'Cancelled';

export interface SettlementPeriodDto {
  id: string;
  operatorUserId: number | string;
  periodCode: string; // e.g. "PER-2026-08"
  periodLabel: string; // e.g. "01/08/2026 - 31/08/2026"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  completedToursCount: number;
  grossRevenue: number;
  commission: number;
  payableNetAmount: number;
  status: SettlementPeriodStatus;
  hasPendingPayout: boolean;
}

export interface BeneficiaryBankDto {
  operatorUserId: number | string;
  accountHolder: string;
  bankName: string;
  accountNumber: string;
}

export interface PayoutRequestDto {
  id: string;
  requestCode: string; // e.g. "PO-20260901-0101"
  operatorUserId: number | string;
  periodId: string;
  periodLabel: string;
  requestedAmount: number;
  status: PayoutRequestStatus;
  requestedAt: string; // ISO date-time
  settledAt?: string; // ISO date-time
  rejectionReason?: string;
  bankSnapshot: BeneficiaryBankDto;
}

export interface RequestPayoutPayload {
  periodId: string;
  bankInfo: BeneficiaryBankDto;
}

export interface PayoutActionResult {
  success: boolean;
  payoutRequest?: PayoutRequestDto;
  message?: string;
  messageCode?: string;
}

export interface PayoutWorkspaceData {
  settlementPeriods: SettlementPeriodDto[];
  beneficiaryBank: BeneficiaryBankDto;
  payoutRequests: PayoutRequestDto[];
  configuredMinimumPayoutAmount: number;
  pendingBackendNotice?: string;
  errorMessage?: string;
  messageCode?: string;
}

export const PAYOUT_CONFIG = {
  DEFAULT_MINIMUM_PAYOUT_AMOUNT: 5000000, // 5,000,000 VND Demo configuration threshold
} as const;

export const PAYOUT_ERROR_CODES = {
  UNAUTHORIZED: 'MSG126',
  MISSING_BENEFICIARY_FIELD: 'MSG01',
  PERIOD_INELIGIBLE: 'MSG128',
  REQUEST_ALREADY_PENDING: 'MSG119',
  BELOW_MINIMUM_AMOUNT: 'MSG120',
  REQUEST_SUBMITTED: 'MSG118',
  REQUEST_CANCELLED: 'MSG129',
  SYSTEM_FAILURE: 'MSG127',
  CANNOT_CANCEL_NON_PENDING: 'CANNOT_CANCEL_NON_PENDING',
  PENDING_BE_INTEGRATION: 'PENDING_BE_INTEGRATION',
} as const;

export const PAYOUT_MESSAGES = {
  PENDING_BE_INTEGRATION:
    'Payout settlement and banking integration is pending. No financial requests are processed in production.',
  MSG126: 'Access denied. You can only view and manage payouts for your own tour operator account.',
  MSG01: 'Please provide complete beneficiary bank account information (Account Holder, Bank Name, Account Number).',
  MSG128: 'The selected settlement period is not eligible (must be closed and contain at least one completed tour).',
  MSG119: 'A payout request for this settlement period is already pending confirmation.',
  MSG120: 'The payable amount is below the configured minimum payout threshold of 5,000,000 ₫.',
  MSG118: 'Payout request submitted successfully and queued for administrator confirmation.',
  MSG129: 'Payout request cancelled successfully. The settlement period is now requestable again.',
  MSG127: 'Unable to record payout request due to a system error. Please retry.',
  CANNOT_CANCEL_NON_PENDING: 'Only payout requests with Pending Confirmation status can be cancelled.',
} as const;
