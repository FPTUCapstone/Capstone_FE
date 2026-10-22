/**
 * Service implementation for Request Payout Settlement (UC-46).
 * Production mode calls the live BFF routes under /api/operator/payouts/*, which forward to
 * Capstone_BE's /api/v1/operator/payouts/* endpoints. Demo mode uses deterministic fixtures
 * with strict actor isolation (BR-105), matching the pattern in operatorRevenueService.ts.
 */

import {
  INITIAL_DEMO_BENEFICIARY_BANKS,
  INITIAL_DEMO_PAYOUT_HISTORY,
  INITIAL_DEMO_SETTLEMENT_MONTHS,
} from '../data/operatorPayoutDemoFixtures';
import { isFinanceDemoAllowedInCurrentEnv } from '../data/operatorRevenueDemoFixtures';
import {
  PAYOUT_CONFIG,
  type AvailableBalanceDto,
  type BeneficiaryBankAccountDto,
  type BeneficiaryBankAccountInput,
  type PayoutActionResult,
  type PayoutHistoryResponse,
  type PayoutMonthBreakdownDto,
  type PayoutSummaryDto,
  type SettlementMonthDto,
} from '../types/payoutLifecycle';

export interface OperatorPayoutServiceOptions {
  isDemo?: boolean;
  demoActorUserId?: number | string;
}

/**
 * Thrown by the four read functions below on a non-ok response or a network failure, so a
 * caller's load effect can distinguish "the backend said there is nothing" from "the request
 * failed" instead of silently rendering an empty state on 401/403/500/network-down. `status` is
 * the HTTP status when known (401/403 lets the caller redirect to sign-in), or null for a
 * network-level failure.
 */
export class PayoutLoadError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null) {
    super(message);
    this.name = 'PayoutLoadError';
    this.status = status;
  }
}

function isValidActor(id?: number | string): boolean {
  return id !== undefined && id !== null && String(id).trim().length > 0;
}

// In-memory state for Demo testing, reset between tests via resetDemoPayoutState().
let demoSettlementMonths: Record<string, SettlementMonthDto[]> = JSON.parse(
  JSON.stringify(INITIAL_DEMO_SETTLEMENT_MONTHS)
);
let demoBeneficiaryBanks: Record<string, BeneficiaryBankAccountDto> = JSON.parse(
  JSON.stringify(INITIAL_DEMO_BENEFICIARY_BANKS)
);
let demoPayoutHistory: Record<string, Array<PayoutHistoryResponse['items'][number]>> = JSON.parse(
  JSON.stringify(INITIAL_DEMO_PAYOUT_HISTORY)
);
let demoPayoutSequence = 1000;

export function resetDemoPayoutState(): void {
  demoSettlementMonths = JSON.parse(JSON.stringify(INITIAL_DEMO_SETTLEMENT_MONTHS));
  demoBeneficiaryBanks = JSON.parse(JSON.stringify(INITIAL_DEMO_BENEFICIARY_BANKS));
  demoPayoutHistory = JSON.parse(JSON.stringify(INITIAL_DEMO_PAYOUT_HISTORY));
  demoPayoutSequence = 1000;
}

async function parseErrorCode(response: Response): Promise<string> {
  const body = await response.json().catch(() => null) as { errorCode?: string } | null;
  return body?.errorCode ?? 'SYSTEM_ERROR';
}

/**
 * Lists settlement months with payable amounts and request eligibility for the authenticated
 * operator (UC-46).
 */
export async function getSettlementMonths(
  year: number | undefined,
  options: OperatorPayoutServiceOptions = {}
): Promise<SettlementMonthDto[]> {
  const isDemoActive = Boolean(options.isDemo && isFinanceDemoAllowedInCurrentEnv());

  if (!isDemoActive) {
    try {
      const query = year ? `?year=${year}` : '';
      const response = await fetch(`/api/operator/payouts/settlement-months${query}`, { cache: 'no-store' });
      if (!response.ok) throw new PayoutLoadError('Failed to load settlement months.', response.status);
      const body = await response.json();
      return Array.isArray(body) ? (body as SettlementMonthDto[]) : [];
    } catch (error) {
      if (error instanceof PayoutLoadError) throw error;
      throw new PayoutLoadError('Network error while loading settlement months.', null);
    }
  }

  if (!isValidActor(options.demoActorUserId)) return [];
  const actorKey = String(options.demoActorUserId);
  const months = demoSettlementMonths[actorKey] ?? [];
  const filtered = year ? months.filter((m) => m.year === year) : months;
  return JSON.parse(JSON.stringify(filtered));
}

/**
 * Returns the beneficiary bank account for the authenticated operator, with the account number
 * masked. The full number is never returned by the server.
 */
export async function getBeneficiaryBankAccount(
  options: OperatorPayoutServiceOptions = {}
): Promise<BeneficiaryBankAccountDto> {
  const empty: BeneficiaryBankAccountDto = {
    bankName: null, accountHolderName: null, maskedAccountNumber: null, updatedAtUtc: null,
  };
  const isDemoActive = Boolean(options.isDemo && isFinanceDemoAllowedInCurrentEnv());

  if (!isDemoActive) {
    try {
      const response = await fetch('/api/operator/payouts/bank-account', { cache: 'no-store' });
      if (!response.ok) throw new PayoutLoadError('Failed to load the beneficiary bank account.', response.status);
      return (await response.json()) as BeneficiaryBankAccountDto;
    } catch (error) {
      if (error instanceof PayoutLoadError) throw error;
      throw new PayoutLoadError('Network error while loading the beneficiary bank account.', null);
    }
  }

  if (!isValidActor(options.demoActorUserId)) return empty;
  const actorKey = String(options.demoActorUserId);
  return JSON.parse(JSON.stringify(demoBeneficiaryBanks[actorKey] ?? empty));
}

/**
 * Updates the beneficiary bank account. The browser sends the plaintext account number once;
 * the server stores it protected and returns only the masked form.
 */
export async function updateBeneficiaryBankAccount(
  payload: BeneficiaryBankAccountInput,
  options: OperatorPayoutServiceOptions = {}
): Promise<PayoutActionResult<BeneficiaryBankAccountDto>> {
  const isDemoActive = Boolean(options.isDemo && isFinanceDemoAllowedInCurrentEnv());

  if (!payload.bankName.trim() || !payload.accountHolderName.trim() || !payload.accountNumber.trim()) {
    return { success: false, errorCode: 'VALIDATION_REQUIRED_FIELD' };
  }

  if (!isDemoActive) {
    try {
      const response = await fetch('/api/operator/payouts/bank-account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) return { success: false, errorCode: await parseErrorCode(response) as PayoutActionResult['errorCode'] };
      return { success: true, data: (await response.json()) as BeneficiaryBankAccountDto };
    } catch { return { success: false, errorCode: 'SYSTEM_ERROR' }; }
  }

  if (!isValidActor(options.demoActorUserId)) {
    return { success: false, errorCode: 'OPERATOR_NOT_APPROVED' };
  }

  const actorKey = String(options.demoActorUserId);
  const trimmedNumber = payload.accountNumber.trim();
  const masked = trimmedNumber.length <= 4
    ? '*'.repeat(trimmedNumber.length)
    : '*'.repeat(trimmedNumber.length - 4) + trimmedNumber.slice(-4);
  const updated: BeneficiaryBankAccountDto = {
    bankName: payload.bankName.trim(),
    accountHolderName: payload.accountHolderName.trim(),
    maskedAccountNumber: masked,
    updatedAtUtc: new Date().toISOString(),
  };
  demoBeneficiaryBanks[actorKey] = updated;
  return { success: true, data: JSON.parse(JSON.stringify(updated)) };
}

/**
 * Returns the operator's current claimable balance: every closed, eligible, not-yet-paid
 * settlement month aggregated into one figure, plus whether a request is currently allowed.
 */
export async function getAvailableBalance(
  options: OperatorPayoutServiceOptions = {}
): Promise<AvailableBalanceDto> {
  const empty: AvailableBalanceDto = {
    periodCount: 0, paymentsReceived: 0, discountsGiven: 0, refundedAmount: 0, netSales: 0,
    commissionAmount: 0, adjustmentsOutstanding: 0, payableNetAmount: 0,
    requestable: false, blockReason: 'NO_ELIGIBLE_BOOKING', activePayoutCode: null,
  };
  const isDemoActive = Boolean(options.isDemo && isFinanceDemoAllowedInCurrentEnv());

  if (!isDemoActive) {
    try {
      const response = await fetch('/api/operator/payouts/available-balance', { cache: 'no-store' });
      if (!response.ok) throw new PayoutLoadError('Failed to load the available balance.', response.status);
      return (await response.json()) as AvailableBalanceDto;
    } catch (error) {
      if (error instanceof PayoutLoadError) throw error;
      throw new PayoutLoadError('Network error while loading the available balance.', null);
    }
  }

  if (!isValidActor(options.demoActorUserId)) return empty;
  const actorKey = String(options.demoActorUserId);
  const history = demoPayoutHistory[actorKey] ?? [];
  const activePayout = history.find((item) => item.status !== 'Rejected' && item.status !== 'Cancelled' && item.status !== 'Settled');
  if (activePayout) {
    return JSON.parse(JSON.stringify({
      ...empty, requestable: false, blockReason: 'ACTIVE_PAYOUT_EXISTS', activePayoutCode: activePayout.payoutCode,
    }));
  }

  const months = (demoSettlementMonths[actorKey] ?? []).filter((m) => m.coverage === 'AvailableBalance');
  if (months.length === 0) return JSON.parse(JSON.stringify(empty));

  const totals = months.reduce((acc, m) => ({
    paymentsReceived: acc.paymentsReceived + m.paymentsReceived,
    discountsGiven: acc.discountsGiven + m.discountsGiven,
    refundedAmount: acc.refundedAmount + m.refundedAmount,
    commissionAmount: acc.commissionAmount + m.commissionAmount,
    payableNetAmount: acc.payableNetAmount + m.payableNetAmount,
  }), { paymentsReceived: 0, discountsGiven: 0, refundedAmount: 0, commissionAmount: 0, payableNetAmount: 0 });

  const requestable = totals.payableNetAmount >= PAYOUT_CONFIG.DEFAULT_MINIMUM_PAYOUT_AMOUNT;
  const balance: AvailableBalanceDto = {
    periodCount: months.length,
    paymentsReceived: totals.paymentsReceived,
    discountsGiven: totals.discountsGiven,
    refundedAmount: totals.refundedAmount,
    netSales: totals.paymentsReceived - totals.refundedAmount,
    commissionAmount: totals.commissionAmount,
    adjustmentsOutstanding: 0,
    payableNetAmount: totals.payableNetAmount,
    requestable,
    blockReason: requestable ? null : 'BELOW_MINIMUM_PAYOUT',
    activePayoutCode: null,
  };
  return JSON.parse(JSON.stringify(balance));
}

/**
 * Submits a payout request claiming the operator's entire available balance — every closed,
 * eligible, not-yet-paid settlement month at once (UC-46, "available balance" model).
 */
export async function requestPayout(
  options: OperatorPayoutServiceOptions = {}
): Promise<PayoutActionResult<PayoutSummaryDto>> {
  const isDemoActive = Boolean(options.isDemo && isFinanceDemoAllowedInCurrentEnv());

  if (!isDemoActive) {
    try {
      const response = await fetch('/api/operator/payouts', { method: 'POST' });
      if (!response.ok) return { success: false, errorCode: await parseErrorCode(response) as PayoutActionResult['errorCode'] };
      return { success: true, data: (await response.json()) as PayoutSummaryDto };
    } catch { return { success: false, errorCode: 'SYSTEM_ERROR' }; }
  }

  if (!isValidActor(options.demoActorUserId)) {
    return { success: false, errorCode: 'OPERATOR_NOT_APPROVED' };
  }

  const actorKey = String(options.demoActorUserId);
  const balance = await getAvailableBalance(options);
  if (!balance.requestable) {
    return { success: false, errorCode: balance.blockReason ?? 'PAYOUT_NOT_REQUESTABLE' };
  }

  const bank = demoBeneficiaryBanks[actorKey];
  if (!bank?.bankName || !bank.accountHolderName || !bank.maskedAccountNumber) {
    return { success: false, errorCode: 'VALIDATION_REQUIRED_FIELD' };
  }

  const months = (demoSettlementMonths[actorKey] ?? []).filter((m) => m.coverage === 'AvailableBalance');
  const ordered = [...months].sort((a, b) => (a.year - b.year) || (a.month - b.month));

  demoPayoutSequence += 1;
  const nowDate = new Date();
  const payoutCode = `PO-${nowDate.getUTCFullYear()}${String(nowDate.getUTCMonth() + 1).padStart(2, '0')}-${String(demoPayoutSequence).padStart(6, '0')}`;
  const nowIso = nowDate.toISOString();
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const periodStart = `${first.year}-${String(first.month).padStart(2, '0')}-01`;
  const lastDay = new Date(last.year, last.month, 0).getDate();
  const periodEnd = `${last.year}-${String(last.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  for (const m of ordered) {
    m.coverage = 'IncludedInPayout';
    m.payoutCode = payoutCode;
  }

  const historyItem = {
    payoutCode, periodCount: ordered.length, periodStart, periodEnd,
    payableNetAmount: balance.payableNetAmount,
    status: 'PendingReview' as const, requestedAtUtc: nowIso, settledAtUtc: null,
    rejectionReason: null, cancellable: true,
  };
  demoPayoutHistory[actorKey] = [historyItem, ...(demoPayoutHistory[actorKey] ?? [])];

  const monthBreakdowns: PayoutMonthBreakdownDto[] = ordered.map((m) => ({
    year: m.year, month: m.month, eligibleBookingCount: m.eligibleBookingCount,
    paymentsReceived: m.paymentsReceived, discountsGiven: m.discountsGiven,
    refundedAmount: m.refundedAmount, commissionAmount: m.commissionAmount,
    payableNetAmount: m.payableNetAmount,
  }));

  const summary: PayoutSummaryDto = {
    payoutCode, status: 'PendingReview', periodCount: ordered.length, periodStart, periodEnd,
    paymentsReceived: balance.paymentsReceived, discountsGiven: balance.discountsGiven,
    refundedAmount: balance.refundedAmount, netSales: balance.netSales,
    commissionAmount: balance.commissionAmount, adjustmentsApplied: 0,
    payableNetAmount: balance.payableNetAmount, requestedAtUtc: nowIso,
    bankName: bank.bankName, accountHolderName: bank.accountHolderName,
    maskedAccountNumber: bank.maskedAccountNumber, months: monthBreakdowns,
  };
  return { success: true, data: JSON.parse(JSON.stringify(summary)) };
}

/**
 * Returns the authenticated operator's payout request history, newest first.
 */
export async function getPayoutHistory(
  page: number,
  pageSize: number,
  options: OperatorPayoutServiceOptions = {}
): Promise<PayoutHistoryResponse> {
  const empty: PayoutHistoryResponse = { items: [], page, pageSize, totalCount: 0, totalPages: 0 };
  const isDemoActive = Boolean(options.isDemo && isFinanceDemoAllowedInCurrentEnv());

  if (!isDemoActive) {
    try {
      const response = await fetch(`/api/operator/payouts?page=${page}&pageSize=${pageSize}`, { cache: 'no-store' });
      if (!response.ok) throw new PayoutLoadError('Failed to load the payout history.', response.status);
      return (await response.json()) as PayoutHistoryResponse;
    } catch (error) {
      if (error instanceof PayoutLoadError) throw error;
      throw new PayoutLoadError('Network error while loading the payout history.', null);
    }
  }

  if (!isValidActor(options.demoActorUserId)) return empty;
  const actorKey = String(options.demoActorUserId);
  const items = demoPayoutHistory[actorKey] ?? [];
  return JSON.parse(JSON.stringify({ items, page, pageSize, totalCount: items.length, totalPages: 1 }));
}

/**
 * Cancels a payout request that is still PendingReview. The settlement month becomes
 * requestable again on success.
 */
export async function cancelPayout(
  payoutCode: string,
  options: OperatorPayoutServiceOptions = {}
): Promise<PayoutActionResult<{ payoutCode: string; status: string }>> {
  const isDemoActive = Boolean(options.isDemo && isFinanceDemoAllowedInCurrentEnv());

  if (!isDemoActive) {
    try {
      const response = await fetch(`/api/operator/payouts/${encodeURIComponent(payoutCode)}/cancel`, {
        method: 'POST',
      });
      if (!response.ok) return { success: false, errorCode: await parseErrorCode(response) as PayoutActionResult['errorCode'] };
      return { success: true, data: (await response.json()) as { payoutCode: string; status: string } };
    } catch { return { success: false, errorCode: 'SYSTEM_ERROR' }; }
  }

  if (!isValidActor(options.demoActorUserId)) {
    return { success: false, errorCode: 'OPERATOR_NOT_APPROVED' };
  }

  const actorKey = String(options.demoActorUserId);
  const history = demoPayoutHistory[actorKey] ?? [];
  const request = history.find((r) => r.payoutCode === payoutCode);
  if (!request) return { success: false, errorCode: 'PAYOUT_NOT_FOUND' };
  if (!request.cancellable || request.status !== 'PendingReview') {
    return { success: false, errorCode: 'PAYOUT_NOT_CANCELLABLE' };
  }

  request.status = 'Cancelled';
  request.cancellable = false;

  const months = demoSettlementMonths[actorKey] ?? [];
  for (const month of months) {
    if (month.payoutCode === payoutCode) {
      month.coverage = 'AvailableBalance';
      month.payoutCode = null;
    }
  }

  return { success: true, data: { payoutCode, status: 'Cancelled' } };
}

export { PAYOUT_CONFIG };
