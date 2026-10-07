/**
 * Service implementation for Payout Settlement & Requests (UC-46).
 * Enforces production NO_BACKEND truthfulness, period eligibility, minimum payout thresholds,
 * server-authoritative payable amount calculations, and cancellation mechanics.
 */

import {
  INITIAL_DEMO_BENEFICIARY_BANKS,
  INITIAL_DEMO_PAYOUT_REQUESTS,
  INITIAL_DEMO_SETTLEMENT_PERIODS,
} from '../data/operatorPayoutDemoFixtures';
import { isFinanceDemoAllowedInCurrentEnv } from '../data/operatorRevenueDemoFixtures';
import {
  PAYOUT_CONFIG,
  PAYOUT_ERROR_CODES,
  PAYOUT_MESSAGES,
  type BeneficiaryBankDto,
  type PayoutActionResult,
  type PayoutRequestDto,
  type PayoutWorkspaceData,
  type RequestPayoutPayload,
  type SettlementPeriodDto,
} from '../types/payoutLifecycle';

export interface OperatorPayoutServiceOptions {
  isDemo?: boolean;
  demoActorUserId?: number | string;
}

function isValidActor(id?: number | string): boolean {
  return id !== undefined && id !== null && String(id).trim().length > 0;
}

// In-memory state for Demo testing
let inMemorySettlementPeriods: SettlementPeriodDto[] = JSON.parse(
  JSON.stringify(INITIAL_DEMO_SETTLEMENT_PERIODS)
);
let inMemoryBeneficiaryBanks: Record<string | number, BeneficiaryBankDto> = JSON.parse(
  JSON.stringify(INITIAL_DEMO_BENEFICIARY_BANKS)
);
let inMemoryPayoutRequests: PayoutRequestDto[] = JSON.parse(
  JSON.stringify(INITIAL_DEMO_PAYOUT_REQUESTS)
);

/**
 * Resets in-memory demo state for test isolation.
 */
export function resetDemoPayoutState(): void {
  inMemorySettlementPeriods = JSON.parse(
    JSON.stringify(INITIAL_DEMO_SETTLEMENT_PERIODS)
  );
  inMemoryBeneficiaryBanks = JSON.parse(
    JSON.stringify(INITIAL_DEMO_BENEFICIARY_BANKS)
  );
  inMemoryPayoutRequests = JSON.parse(
    JSON.stringify(INITIAL_DEMO_PAYOUT_REQUESTS)
  );
}

/**
 * Retrieves the payout workspace data (periods, bank details, and history) for UC-46.
 */
export async function getPayoutWorkspaceData(
  options: OperatorPayoutServiceOptions = {}
): Promise<PayoutWorkspaceData> {
  const isDemoActive = Boolean(options.isDemo && isFinanceDemoAllowedInCurrentEnv());

  // Production NO_BACKEND truthfulness
  if (!isDemoActive) {
    return {
      settlementPeriods: [],
      beneficiaryBank: {
        operatorUserId: 0,
        accountHolder: '',
        bankName: '',
        accountNumber: '',
      },
      payoutRequests: [],
      configuredMinimumPayoutAmount: PAYOUT_CONFIG.DEFAULT_MINIMUM_PAYOUT_AMOUNT,
      pendingBackendNotice: PAYOUT_MESSAGES.PENDING_BE_INTEGRATION,
      messageCode: PAYOUT_ERROR_CODES.PENDING_BE_INTEGRATION,
    };
  }

  // BR-105 Fail-closed if actor identity is missing in demo mode
  if (!isValidActor(options.demoActorUserId)) {
    return {
      settlementPeriods: [],
      beneficiaryBank: {
        operatorUserId: 0,
        accountHolder: '',
        bankName: '',
        accountNumber: '',
      },
      payoutRequests: [],
      configuredMinimumPayoutAmount: PAYOUT_CONFIG.DEFAULT_MINIMUM_PAYOUT_AMOUNT,
      errorMessage: PAYOUT_MESSAGES.MSG126,
      messageCode: PAYOUT_ERROR_CODES.UNAUTHORIZED,
    };
  }

  const actorKey = String(options.demoActorUserId);

  // Filter periods strictly owned by actor (BR-105)
  const periods = inMemorySettlementPeriods.filter(
    (p) => String(p.operatorUserId) === actorKey
  );

  // Retrieve bank account for actor
  const bank = inMemoryBeneficiaryBanks[actorKey] || {
    operatorUserId: options.demoActorUserId!,
    accountHolder: '',
    bankName: '',
    accountNumber: '',
  };

  // Filter payout requests strictly owned by actor (BR-105)
  const requests = inMemoryPayoutRequests.filter(
    (r) => String(r.operatorUserId) === actorKey
  );

  return {
    settlementPeriods: JSON.parse(JSON.stringify(periods)),
    beneficiaryBank: JSON.parse(JSON.stringify(bank)),
    payoutRequests: JSON.parse(JSON.stringify(requests)),
    configuredMinimumPayoutAmount: PAYOUT_CONFIG.DEFAULT_MINIMUM_PAYOUT_AMOUNT,
  };
}

/**
 * Updates beneficiary bank information for the authenticated Tour Operator.
 */
export async function updateBeneficiaryBank(
  payload: BeneficiaryBankDto,
  options: OperatorPayoutServiceOptions = {}
): Promise<PayoutActionResult> {
  const isDemoActive = Boolean(options.isDemo && isFinanceDemoAllowedInCurrentEnv());

  if (!isDemoActive) {
    return {
      success: false,
      message: PAYOUT_MESSAGES.PENDING_BE_INTEGRATION,
      messageCode: PAYOUT_ERROR_CODES.PENDING_BE_INTEGRATION,
    };
  }

  if (!isValidActor(options.demoActorUserId)) {
    return {
      success: false,
      message: PAYOUT_MESSAGES.MSG126,
      messageCode: PAYOUT_ERROR_CODES.UNAUTHORIZED,
    };
  }

  if (
    !payload.accountHolder.trim() ||
    !payload.bankName.trim() ||
    !payload.accountNumber.trim()
  ) {
    return {
      success: false,
      message: PAYOUT_MESSAGES.MSG01,
      messageCode: PAYOUT_ERROR_CODES.MISSING_BENEFICIARY_FIELD,
    };
  }

  const actorKey = String(options.demoActorUserId);
  inMemoryBeneficiaryBanks[actorKey] = {
    operatorUserId: options.demoActorUserId!,
    accountHolder: payload.accountHolder.trim().toUpperCase(),
    bankName: payload.bankName.trim(),
    accountNumber: payload.accountNumber.trim(),
  };

  return {
    success: true,
    message: 'Beneficiary bank details saved successfully.',
    messageCode: 'BANK_SAVED',
  };
}

/**
 * Submits a new payout request for an eligible closed settlement period (UC-46).
 */
export async function requestPayoutSettlement(
  payload: RequestPayoutPayload,
  options: OperatorPayoutServiceOptions = {}
): Promise<PayoutActionResult> {
  const isDemoActive = Boolean(options.isDemo && isFinanceDemoAllowedInCurrentEnv());

  // Production NO_BACKEND truthfulness
  if (!isDemoActive) {
    return {
      success: false,
      message: PAYOUT_MESSAGES.PENDING_BE_INTEGRATION,
      messageCode: PAYOUT_ERROR_CODES.PENDING_BE_INTEGRATION,
    };
  }

  // BR-105 Fail-closed if actor identity is missing in demo mode
  if (!isValidActor(options.demoActorUserId)) {
    return {
      success: false,
      message: PAYOUT_MESSAGES.MSG126,
      messageCode: PAYOUT_ERROR_CODES.UNAUTHORIZED,
    };
  }

  const actorKey = String(options.demoActorUserId);

  // Beneficiary bank completeness validation (MSG01)
  if (
    !payload.bankInfo ||
    !payload.bankInfo.accountHolder.trim() ||
    !payload.bankInfo.bankName.trim() ||
    !payload.bankInfo.accountNumber.trim()
  ) {
    return {
      success: false,
      message: PAYOUT_MESSAGES.MSG01,
      messageCode: PAYOUT_ERROR_CODES.MISSING_BENEFICIARY_FIELD,
    };
  }

  // Find the selected period
  const period = inMemorySettlementPeriods.find(
    (p) => p.id === payload.periodId && String(p.operatorUserId) === actorKey
  );

  if (!period) {
    return {
      success: false,
      message: PAYOUT_MESSAGES.MSG128,
      messageCode: PAYOUT_ERROR_CODES.PERIOD_INELIGIBLE,
    };
  }

  // Period eligibility validation (BR-111: Closed and completedToursCount > 0)
  if (period.status !== 'Closed' || period.completedToursCount <= 0) {
    return {
      success: false,
      message: PAYOUT_MESSAGES.MSG128,
      messageCode: PAYOUT_ERROR_CODES.PERIOD_INELIGIBLE,
    };
  }

  // Duplicate pending validation (BR-113 / MSG119)
  const existingPending = inMemoryPayoutRequests.find(
    (r) =>
      r.periodId === period.id &&
      String(r.operatorUserId) === actorKey &&
      r.status === 'Pending Confirmation'
  );
  if (period.hasPendingPayout || existingPending) {
    return {
      success: false,
      message: PAYOUT_MESSAGES.MSG119,
      messageCode: PAYOUT_ERROR_CODES.REQUEST_ALREADY_PENDING,
    };
  }

  // Minimum payout threshold validation (BR-112 / MSG120)
  if (period.payableNetAmount < PAYOUT_CONFIG.DEFAULT_MINIMUM_PAYOUT_AMOUNT) {
    return {
      success: false,
      message: PAYOUT_MESSAGES.MSG120,
      messageCode: PAYOUT_ERROR_CODES.BELOW_MINIMUM_AMOUNT,
    };
  }

  // Create Payout Request DTO (server-authoritative requested amount equals payableNetAmount)
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const requestCode = `PO-${dateStr}-${actorKey}-${Math.floor(100 + Math.random() * 900)}`;

  const newRequest: PayoutRequestDto = {
    id: `po-req-${Date.now()}`,
    requestCode,
    operatorUserId: options.demoActorUserId!,
    periodId: period.id,
    periodLabel: period.periodLabel,
    requestedAmount: period.payableNetAmount, // Server-calculated payable net amount (BR-112)
    status: 'Pending Confirmation',
    requestedAt: new Date().toISOString(),
    bankSnapshot: {
      operatorUserId: options.demoActorUserId!,
      accountHolder: payload.bankInfo.accountHolder.trim().toUpperCase(),
      bankName: payload.bankInfo.bankName.trim(),
      accountNumber: payload.bankInfo.accountNumber.trim(),
    },
  };

  // State transitions
  period.hasPendingPayout = true;
  inMemoryPayoutRequests.unshift(newRequest);

  return {
    success: true,
    payoutRequest: JSON.parse(JSON.stringify(newRequest)),
    message: PAYOUT_MESSAGES.MSG118,
    messageCode: PAYOUT_ERROR_CODES.REQUEST_SUBMITTED,
  };
}

/**
 * Cancels a pending payout request (Alternative Flow §3.8.5.3).
 * Allowed ONLY for requests with status 'Pending Confirmation'.
 * On cancellation, the associated settlement period becomes requestable again.
 */
export async function cancelPayoutRequest(
  requestId: string,
  options: OperatorPayoutServiceOptions = {}
): Promise<PayoutActionResult> {
  const isDemoActive = Boolean(options.isDemo && isFinanceDemoAllowedInCurrentEnv());

  // Production NO_BACKEND truthfulness
  if (!isDemoActive) {
    return {
      success: false,
      message: PAYOUT_MESSAGES.PENDING_BE_INTEGRATION,
      messageCode: PAYOUT_ERROR_CODES.PENDING_BE_INTEGRATION,
    };
  }

  // BR-105 Fail-closed if actor identity is missing in demo mode
  if (!isValidActor(options.demoActorUserId)) {
    return {
      success: false,
      message: PAYOUT_MESSAGES.MSG126,
      messageCode: PAYOUT_ERROR_CODES.UNAUTHORIZED,
    };
  }

  const actorKey = String(options.demoActorUserId);

  const request = inMemoryPayoutRequests.find(
    (r) => r.id === requestId && String(r.operatorUserId) === actorKey
  );

  if (!request) {
    return {
      success: false,
      message: PAYOUT_MESSAGES.MSG126,
      messageCode: PAYOUT_ERROR_CODES.UNAUTHORIZED,
    };
  }

  // Cancellation restriction: only Pending Confirmation can be cancelled
  if (request.status !== 'Pending Confirmation') {
    return {
      success: false,
      message: PAYOUT_MESSAGES.CANNOT_CANCEL_NON_PENDING,
      messageCode: PAYOUT_ERROR_CODES.CANNOT_CANCEL_NON_PENDING,
    };
  }

  // Transition request to Cancelled
  request.status = 'Cancelled';

  // Release period pending lock so the settlement period becomes requestable again
  const period = inMemorySettlementPeriods.find((p) => p.id === request.periodId);
  if (period) {
    period.hasPendingPayout = false;
  }

  return {
    success: true,
    payoutRequest: JSON.parse(JSON.stringify(request)),
    message: PAYOUT_MESSAGES.MSG129,
    messageCode: PAYOUT_ERROR_CODES.REQUEST_CANCELLED,
  };
}
