/**
 * Request Payout Settlement (UC-46) lifecycle contracts and data structures.
 * "Available balance" model (decided 2026-10-23): one request aggregates every closed, eligible,
 * not-yet-paid settlement month for the operator into a single payout, instead of one request per
 * month — so a low-revenue operator whose payable amount never individually crosses the minimum
 * is never stuck forever. Matches Capstone_BE/specs/UC-46-request-payout-settlement-be-spec.md.
 */

export type MonthCoverage = 'Open' | 'AvailableBalance' | 'IncludedInPayout';

export type PayoutStatus =
  | 'PendingReview'
  | 'ApprovedForSettlement'
  | 'SettlementProcessing'
  | 'Settled'
  | 'SettlementFailed'
  | 'Rejected'
  | 'Cancelled';

/** Backend errorCode values (UC-46 BE spec v3, Error contract). */
export type PayoutErrorCode =
  | 'VALIDATION_REQUIRED_FIELD'
  | 'OPERATOR_NOT_APPROVED'
  | 'NO_ELIGIBLE_BOOKING'
  | 'PAYOUT_NOT_REQUESTABLE'
  | 'ACTIVE_PAYOUT_EXISTS'
  | 'BELOW_MINIMUM_PAYOUT'
  | 'PAYOUT_NOT_FOUND'
  | 'PAYOUT_NOT_CANCELLABLE'
  | 'SYSTEM_ERROR';

/** One settlement month, informational only — the request action is global, not per-row. */
export interface SettlementMonthDto {
  year: number;
  month: number;
  monthStatus: 'Open' | 'Closed';
  eligibleBookingCount: number;
  paymentsReceived: number;
  discountsGiven: number;
  refundedAmount: number;
  netSales: number;
  commissionAmount: number;
  payableNetAmount: number;
  coverage: MonthCoverage;
  payoutCode: string | null;
}

/** The aggregate across every closed, eligible, not-yet-paid month — backs the single
 * "Request Payout" action and its enabled/disabled state. */
export interface AvailableBalanceDto {
  periodCount: number;
  paymentsReceived: number;
  discountsGiven: number;
  refundedAmount: number;
  netSales: number;
  commissionAmount: number;
  adjustmentsOutstanding: number;
  payableNetAmount: number;
  requestable: boolean;
  blockReason: PayoutErrorCode | null;
  activePayoutCode: string | null;
}

export interface BeneficiaryBankAccountDto {
  bankName: string | null;
  accountHolderName: string | null;
  maskedAccountNumber: string | null;
  updatedAtUtc: string | null;
}

/** Only used to submit a bank-account update; the full number never comes back from the server. */
export interface BeneficiaryBankAccountInput {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
}

export interface PayoutMonthBreakdownDto {
  year: number;
  month: number;
  eligibleBookingCount: number;
  paymentsReceived: number;
  discountsGiven: number;
  refundedAmount: number;
  commissionAmount: number;
  payableNetAmount: number;
}

export interface PayoutSummaryDto {
  payoutCode: string;
  status: PayoutStatus;
  periodCount: number;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  paymentsReceived: number;
  discountsGiven: number;
  refundedAmount: number;
  netSales: number;
  commissionAmount: number;
  adjustmentsApplied: number;
  payableNetAmount: number;
  requestedAtUtc: string;
  bankName: string;
  accountHolderName: string;
  maskedAccountNumber: string;
  months: PayoutMonthBreakdownDto[];
}

export interface PayoutHistoryItemDto {
  payoutCode: string;
  periodCount: number;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  payableNetAmount: number;
  status: PayoutStatus;
  requestedAtUtc: string | null;
  settledAtUtc: string | null;
  rejectionReason: string | null;
  cancellable: boolean;
}

export interface PayoutHistoryResponse {
  items: PayoutHistoryItemDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface PayoutActionResult<T = undefined> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: PayoutErrorCode | 'PENDING_BE_INTEGRATION';
}

export const PAYOUT_CONFIG = {
  /** Production default (UC-46 BE spec OPEN-5, confirmed 2026-10-23); the server is
   * authoritative, this is a display fallback only. */
  DEFAULT_MINIMUM_PAYOUT_AMOUNT: 1_000_000,
} as const;

/**
 * Maps backend errorCode to a display message key (UC-46 FE spec, "Error code to display mapping").
 * Never match on raw error strings elsewhere in the UI — always go through this table.
 */
export const PAYOUT_ERROR_DISPLAY: Record<string, string> = {
  VALIDATION_REQUIRED_FIELD: 'MSG01',
  OPERATOR_NOT_APPROVED: 'MSG126',
  NO_ELIGIBLE_BOOKING: 'MSG128',
  PAYOUT_NOT_FOUND: 'MSG128',
  SYSTEM_ERROR: 'MSG127',
  PENDING_BE_INTEGRATION: 'PENDING_BE_INTEGRATION',
  // Pending PO message-number assignment (UC-46 BE spec OPEN-4): shown with neutral placeholder
  // text until approved. Never MSG29/MSG31/MSG118/MSG119/MSG120/MSG131-136 (locked elsewhere).
  PAYOUT_NOT_REQUESTABLE: 'PAYOUT_PLACEHOLDER_NOT_REQUESTABLE',
  ACTIVE_PAYOUT_EXISTS: 'PAYOUT_PLACEHOLDER_ACTIVE_EXISTS',
  BELOW_MINIMUM_PAYOUT: 'PAYOUT_PLACEHOLDER_BELOW_MINIMUM',
  PAYOUT_NOT_CANCELLABLE: 'PAYOUT_PLACEHOLDER_NOT_CANCELLABLE',
};
