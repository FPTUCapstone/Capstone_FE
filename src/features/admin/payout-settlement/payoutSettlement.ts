import {
  isIsoDate,
  parsePayoutsPage,
  type PayoutsPageOf,
} from '../payout-records/payoutRecords';

// Statuses the Administrator settlement endpoints can return. Deliberately separate from the Staff
// PAYOUT_STATUSES, whose filter must keep offering only Staff-visible statuses.
export const SETTLEMENT_STATUSES = [
  'ApprovedForSettlement',
  'SettlementProcessing',
  'Settled',
  'SettlementFailed',
] as const;
export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];

export const DEFAULT_SETTLEMENT_STATUS: SettlementStatus = 'ApprovedForSettlement';
export const SETTLEMENT_PAGE_SIZE = 20;
export const SETTLEMENT_POLL_INTERVAL_MS = 15_000;

const STATUS_LABELS: Record<SettlementStatus, string> = {
  ApprovedForSettlement: 'Approved for settlement',
  SettlementProcessing: 'Settlement processing',
  Settled: 'Settled',
  SettlementFailed: 'Settlement failed',
};

export const SETTLEMENT_MESSAGES = {
  forbidden: 'You do not have permission to access this function.',
  notFound: 'The requested payout record was not found.',
  unavailable: 'TripMate is temporarily unable to process your request. Please check your connection and try again.',
  empty: 'No data is available for the selected criteria.',
  notAvailable: 'Not available',
  authorized: 'Settlement authorized. The transfer is being processed.',
  conflict: 'This payout is no longer waiting for authorization. The latest status has been reloaded.',
  beneficiaryIncomplete: 'The bank account details are incomplete. Ask the Tour Operator to complete them, then try again.',
  bankBinUnresolved: 'The bank name does not match the standard bank list. Ask the Tour Operator to correct the bank name, then try again.',
  amountInvalid: 'The payout amount cannot be sent. Contact the developers; the amount cannot be edited here.',
  authorizeFailed: 'The settlement could not be authorized.',
} as const;

export function formatSettlementStatus(status: SettlementStatus): string {
  return STATUS_LABELS[status];
}

export const isSettlementStatus = (value: unknown): value is SettlementStatus =>
  (SETTLEMENT_STATUSES as readonly unknown[]).includes(value);

// ----- search -----

export type SettlementSearch = {
  keyword: string;
  status: SettlementStatus;
  periodFrom: string;
  periodTo: string;
  pageNumber: number;
};

export function defaultSettlementSearch(): SettlementSearch {
  return { keyword: '', status: DEFAULT_SETTLEMENT_STATUS, periodFrom: '', periodTo: '', pageNumber: 1 };
}

export function parseSettlementSearch(params: URLSearchParams): SettlementSearch {
  const status = params.get('status');
  const rawPage = Number(params.get('pageNumber'));
  const from = params.get('periodFrom') ?? '';
  const to = params.get('periodTo') ?? '';
  return {
    keyword: (params.get('keyword') ?? '').trim().slice(0, 200),
    status: isSettlementStatus(status) ? status : DEFAULT_SETTLEMENT_STATUS,
    periodFrom: isIsoDate(from) ? from : '',
    periodTo: isIsoDate(to) ? to : '',
    pageNumber: Number.isSafeInteger(rawPage) && rawPage >= 1 ? rawPage : 1,
  };
}

export function serializeSettlementSearch(search: SettlementSearch): URLSearchParams {
  const params = new URLSearchParams();
  if (search.keyword) params.set('keyword', search.keyword);
  if (search.status !== DEFAULT_SETTLEMENT_STATUS) params.set('status', search.status);
  if (search.periodFrom) params.set('periodFrom', search.periodFrom);
  if (search.periodTo) params.set('periodTo', search.periodTo);
  if (search.pageNumber > 1) params.set('pageNumber', String(search.pageNumber));
  return params;
}

// ----- queue -----

export type SettlementQueue = PayoutsPageOf<SettlementStatus>;

export function parseSettlementQueue(value: unknown): SettlementQueue {
  return parsePayoutsPage(value, SETTLEMENT_STATUSES);
}

// ----- detail -----

export type SettlementOutcome = {
  gatewayState: string;
  failureCode: string | null;
  submittedAtUtc: string | null;
  reconciliationRequired: boolean;
};

export type SettlementDetail = {
  payoutId: string;
  payoutCode: string;
  status: SettlementStatus;
  settlementPeriod: { startDate: string; endDate: string };
  tourOperator: { operatorId: string; companyName: string };
  grossRevenue: number;
  commissionRate: number;
  commissionAmount: number;
  netPayoutAmount: number;
  requestedAtUtc: string | null;
  reviewedAtUtc: string | null;
  reviewedBy: string | null;
  settlementAuthorizedAtUtc: string | null;
  settlementAuthorizedBy: string | null;
  beneficiary: { bankName: string | null; accountHolder: string | null; maskedAccountNumber: string | null };
  bankBinResolved: boolean;
  outcome: SettlementOutcome | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string';
const isNullableString = (value: unknown): value is string | null => value === null || isString(value);
const isDecimalId = (value: unknown): value is string => isString(value) && /^\d+$/.test(value);
const isMoney = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

function parseOutcome(value: unknown): SettlementOutcome | null {
  if (value === null) return null;
  if (!isRecord(value) || !isString(value.gatewayState) || !isNullableString(value.failureCode) ||
      !isNullableString(value.submittedAtUtc) || typeof value.reconciliationRequired !== 'boolean') {
    throw new Error('The settlement detail response is invalid.');
  }
  return {
    gatewayState: value.gatewayState,
    failureCode: value.failureCode,
    submittedAtUtc: value.submittedAtUtc,
    reconciliationRequired: value.reconciliationRequired,
  };
}

export function parseSettlementDetail(value: unknown): SettlementDetail {
  const invalid = () => new Error('The settlement detail response is invalid.');
  if (!isRecord(value)) throw invalid();
  const { settlementPeriod, tourOperator, beneficiary } = value;
  if (!isRecord(settlementPeriod) || !isRecord(tourOperator) || !isRecord(beneficiary)) throw invalid();

  const { startDate, endDate } = settlementPeriod;
  const { operatorId, companyName } = tourOperator;
  const { bankName, accountHolder, maskedAccountNumber } = beneficiary;
  if (!isDecimalId(value.payoutId) || !isString(value.payoutCode) || !isSettlementStatus(value.status) ||
      !isString(startDate) || !isString(endDate) || !isDecimalId(operatorId) || !isString(companyName) ||
      !isMoney(value.grossRevenue) || !isMoney(value.commissionAmount) || !isMoney(value.netPayoutAmount) ||
      typeof value.commissionRate !== 'number' || !Number.isFinite(value.commissionRate) ||
      !isNullableString(value.requestedAtUtc) || !isNullableString(value.reviewedAtUtc) ||
      !isNullableString(value.reviewedBy) || !isNullableString(value.settlementAuthorizedAtUtc) ||
      !isNullableString(value.settlementAuthorizedBy) ||
      !isNullableString(bankName) || !isNullableString(accountHolder) || !isNullableString(maskedAccountNumber) ||
      typeof value.bankBinResolved !== 'boolean' || value.outcome === undefined) {
    throw invalid();
  }
  return {
    payoutId: value.payoutId,
    payoutCode: value.payoutCode,
    status: value.status,
    settlementPeriod: { startDate, endDate },
    tourOperator: { operatorId, companyName },
    grossRevenue: value.grossRevenue,
    commissionRate: value.commissionRate,
    commissionAmount: value.commissionAmount,
    netPayoutAmount: value.netPayoutAmount,
    requestedAtUtc: value.requestedAtUtc,
    reviewedAtUtc: value.reviewedAtUtc,
    reviewedBy: value.reviewedBy,
    settlementAuthorizedAtUtc: value.settlementAuthorizedAtUtc,
    settlementAuthorizedBy: value.settlementAuthorizedBy,
    beneficiary: { bankName, accountHolder, maskedAccountNumber },
    bankBinResolved: value.bankBinResolved,
    outcome: parseOutcome(value.outcome),
  };
}

// ----- authorize -----

export type AuthorizeResult = {
  payoutId: string;
  payoutCode: string;
  status: 'SettlementProcessing';
  authorizedAtUtc: string;
};

export function parseAuthorizeResult(value: unknown): AuthorizeResult {
  if (!isRecord(value) || !isDecimalId(value.payoutId) || !isString(value.payoutCode) ||
      value.status !== 'SettlementProcessing' || !isString(value.authorizedAtUtc)) {
    throw new Error('The authorize response is invalid.');
  }
  return {
    payoutId: value.payoutId,
    payoutCode: value.payoutCode,
    status: value.status,
    authorizedAtUtc: value.authorizedAtUtc,
  };
}

// ----- presentation helpers -----

const FAILURE_FALLBACK = 'The transfer could not be completed.';
const FAILURE_MESSAGES: Record<string, string> = {
  gateway_rejected: 'The bank or payment provider rejected the transfer.',
  gateway_failed: 'The transfer failed at the bank.',
  gateway_cancelled: 'The transfer was cancelled.',
  gateway_reversed: 'The transfer was returned by the bank.',
  gateway_insufficient_balance: 'The payout account does not have enough balance.',
  gateway_invalid_account: 'The beneficiary account was not accepted by the bank.',
  gateway_unauthorized: 'The payment provider refused our credentials. Contact the developers.',
  gateway_unavailable: 'The payment provider was unavailable.',
  beneficiary_incomplete: 'The beneficiary bank details are incomplete.',
  beneficiary_unreadable: 'The saved bank account could not be read. The Operator must save it again.',
};

export function failureMessage(code: string | null): string {
  return (code !== null && Object.hasOwn(FAILURE_MESSAGES, code) ? FAILURE_MESSAGES[code] : undefined) ?? FAILURE_FALLBACK;
}

const GATEWAY_STATE_TEXT: Record<string, string> = {
  NotQueued: 'Not queued for transfer',
  Pending: 'Waiting to be sent to the bank',
  Submitting: 'Being sent to the bank',
  Submitted: "Sent. Waiting for the bank's confirmation",
  Completed: 'Transfer completed',
  ManualReconciliation: 'Needs manual reconciliation',
};

export function gatewayStateText(state: string): string {
  return Object.hasOwn(GATEWAY_STATE_TEXT, state) ? GATEWAY_STATE_TEXT[state] : 'Status unavailable';
}

const hasText = (value: string | null): value is string => value !== null && value.trim() !== '';

/** Why the Authorize button must stay disabled, or null when it is allowed or does not apply. The server stays
 *  the authority; this only avoids a guaranteed 422. */
export function authorizeBlockedReason(detail: SettlementDetail): string | null {
  if (detail.status !== 'ApprovedForSettlement') return null;
  const { bankName, accountHolder, maskedAccountNumber } = detail.beneficiary;
  if (!hasText(bankName) || !hasText(accountHolder) || !hasText(maskedAccountNumber)) {
    return 'The Tour Operator has not completed the bank account details. Ask the Operator to update them before authorizing.';
  }
  if (!detail.bankBinResolved) {
    return 'The bank name does not match the standard bank list. Ask the Operator to correct the bank name before authorizing.';
  }
  return null;
}

export function canAuthorize(detail: SettlementDetail): boolean {
  return detail.status === 'ApprovedForSettlement' && authorizeBlockedReason(detail) === null;
}
