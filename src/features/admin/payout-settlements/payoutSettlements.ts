export const PAYOUT_SETTLEMENT_STATUSES = ['Scheduled', 'Processing', 'Settled', 'SettlementFailed', 'Carried Over'] as const;
export const PAYOUT_SETTLEMENT_KINDS = ['Main', 'Retained'] as const;
export const PAYOUT_SETTLEMENT_ATTEMPT_OUTCOMES = ['Sent', 'Succeeded', 'Failed', 'Timeout', 'Rejected'] as const;

export type PayoutSettlementStatus = (typeof PAYOUT_SETTLEMENT_STATUSES)[number];
export type PayoutSettlementKind = (typeof PAYOUT_SETTLEMENT_KINDS)[number];
export type PayoutSettlementAttemptOutcome = (typeof PAYOUT_SETTLEMENT_ATTEMPT_OUTCOMES)[number];

export type PayoutSettlementListItem = {
  settlementId: number;
  bookingId: number;
  tourOperatorUserId: number;
  runDate: string;
  kind: PayoutSettlementKind;
  payoutAmount: number;
  status: PayoutSettlementStatus;
  transferReference: string | null;
};

export type PayoutSettlementsResponse = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  items: PayoutSettlementListItem[];
};

export type PayoutSettlementAttempt = {
  attemptNumber: number;
  sentAtUtc: string;
  outcome: PayoutSettlementAttemptOutcome;
  failureReason: string | null;
};

export type FailedPayoutBatchDetail = {
  batchId: number;
  tourOperatorUserId: number;
  runDate: string;
  totalAmount: number;
  status: PayoutSettlementStatus;
  attemptCount: number;
  attempts: PayoutSettlementAttempt[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isSafeInteger = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value);
const isNonNegativeInteger = (value: unknown): value is number => isSafeInteger(value) && value >= 0;
const isMoney = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const isNullableString = (value: unknown): value is string | null => value === null || typeof value === 'string';
const isTimestamp = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
const isRunDate = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

export function parsePayoutSettlementListItem(value: unknown): PayoutSettlementListItem {
  if (
    !isRecord(value) ||
    !isSafeInteger(value.settlementId) ||
    !isSafeInteger(value.bookingId) ||
    !isSafeInteger(value.tourOperatorUserId) ||
    !isRunDate(value.runDate) ||
    !PAYOUT_SETTLEMENT_KINDS.includes(value.kind as PayoutSettlementKind) ||
    !isMoney(value.payoutAmount) ||
    !PAYOUT_SETTLEMENT_STATUSES.includes(value.status as PayoutSettlementStatus) ||
    !isNullableString(value.transferReference)
  ) {
    throw new Error('Invalid payout settlement item.');
  }
  return value as PayoutSettlementListItem;
}

export function parsePayoutSettlementsResponse(value: unknown): PayoutSettlementsResponse {
  if (
    !isRecord(value) ||
    !isSafeInteger(value.pageNumber) ||
    !isSafeInteger(value.pageSize) ||
    !isNonNegativeInteger(value.totalCount) ||
    !Array.isArray(value.items)
  ) {
    throw new Error('Invalid payout settlements response.');
  }
  return {
    pageNumber: value.pageNumber,
    pageSize: value.pageSize,
    totalCount: value.totalCount,
    items: value.items.map(parsePayoutSettlementListItem),
  };
}

function parsePayoutSettlementAttempt(value: unknown): PayoutSettlementAttempt {
  if (
    !isRecord(value) ||
    !isSafeInteger(value.attemptNumber) ||
    !isTimestamp(value.sentAtUtc) ||
    !PAYOUT_SETTLEMENT_ATTEMPT_OUTCOMES.includes(value.outcome as PayoutSettlementAttemptOutcome) ||
    !isNullableString(value.failureReason)
  ) {
    throw new Error('Invalid payout settlement attempt.');
  }
  return value as PayoutSettlementAttempt;
}

export function parseFailedPayoutBatchDetail(value: unknown): FailedPayoutBatchDetail {
  if (
    !isRecord(value) ||
    !isSafeInteger(value.batchId) ||
    !isSafeInteger(value.tourOperatorUserId) ||
    !isRunDate(value.runDate) ||
    !isMoney(value.totalAmount) ||
    !PAYOUT_SETTLEMENT_STATUSES.includes(value.status as PayoutSettlementStatus) ||
    !isNonNegativeInteger(value.attemptCount) ||
    !Array.isArray(value.attempts)
  ) {
    throw new Error('Invalid failed payout batch detail.');
  }
  return {
    batchId: value.batchId,
    tourOperatorUserId: value.tourOperatorUserId,
    runDate: value.runDate,
    totalAmount: value.totalAmount,
    status: value.status as PayoutSettlementStatus,
    attemptCount: value.attemptCount,
    attempts: value.attempts.map(parsePayoutSettlementAttempt),
  };
}

/** Non-blank after trim (backend: `daily_payout.manual_reference_required`). */
export function validateManualTransferReference(value: unknown): { ok: true; value: string } | { ok: false } {
  if (typeof value !== 'string') return { ok: false };
  const trimmed = value.trim();
  return trimmed ? { ok: true, value: trimmed } : { ok: false };
}

/** RunDate is a calendar date (no time-of-day), so this formats it as-is rather than converting
 * a timezone, which would risk shifting it to a different day. */
export function formatRunDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(`${value}T00:00:00Z`),
  );
}
