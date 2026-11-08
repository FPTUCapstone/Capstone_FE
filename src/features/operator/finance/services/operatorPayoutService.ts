/**
 * Beneficiary bank account service for the Tour Operator's finance workspace.
 *
 * The UC-46 "Request Payout Settlement" model (available balance, settlement months, request
 * and cancel actions, payout history by request) was removed from SRS v11 and this file along
 * with it (DAILY-PAYOUT-TRANSFER). Only the bank-account functions survive: a Tour Operator must
 * still configure a beneficiary account to receive the new model's automatic daily transfer. The
 * live BFF route `/api/operator/payouts/bank-account` is unchanged and still forwards to
 * Capstone_BE's `/api/v1/operator/payouts/bank-account`.
 */

import {
  INITIAL_DEMO_BENEFICIARY_BANKS,
} from '../data/operatorPayoutDemoFixtures';
import { isFinanceDemoAllowedInCurrentEnv } from '../data/operatorRevenueDemoFixtures';
import type {
  BeneficiaryBankAccountDto,
  BeneficiaryBankAccountInput,
  PayoutActionResult,
} from '../types/payoutLifecycle';

export interface OperatorPayoutServiceOptions {
  isDemo?: boolean;
  demoActorUserId?: number | string;
}

/**
 * Thrown by the read function below on a non-ok response or a network failure, so a caller's
 * load effect can distinguish "the backend said there is nothing" from "the request failed"
 * instead of silently rendering an empty state on 401/403/500/network-down. `status` is the HTTP
 * status when known (401/403 lets the caller redirect to sign-in), or null for a network-level
 * failure.
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
let demoBeneficiaryBanks: Record<string, BeneficiaryBankAccountDto> = JSON.parse(
  JSON.stringify(INITIAL_DEMO_BENEFICIARY_BANKS)
);

export function resetDemoPayoutState(): void {
  demoBeneficiaryBanks = JSON.parse(JSON.stringify(INITIAL_DEMO_BENEFICIARY_BANKS));
}

async function parseErrorCode(response: Response): Promise<string> {
  const body = await response.json().catch(() => null) as { errorCode?: string } | null;
  return body?.errorCode ?? 'SYSTEM_ERROR';
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
      if (!response.ok) return { success: false, errorCode: await parseErrorCode(response) };
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
