// 'Awaiting Window' (BR-141): a paid booking is held 24h after payment confirmation before it
// is eligible for any run. No PayoutSettlement row exists for it yet — the backend synthesizes
// this status for UC-72. 'Resolved' (v2, backend spec v7, UC-73 [Mark as Resolved]) replaces the
// old 'Carried Over' status, which no longer exists on the backend.
export const PAYOUT_SETTLEMENT_STATUSES = [
  'Awaiting Window',
  'Scheduled',
  'Processing',
  'Settled',
  'SettlementFailed',
  'Resolved',
] as const;
// v2 (backend spec v7, BR-142/BR-177): Advance (70% after the Awaiting Window) and Final (20%
// after the tour ends) replace the old 'Main'/'Retained' kinds.
export const PAYOUT_SETTLEMENT_KINDS = ['Advance', 'Final'] as const;
export const PAYOUT_SETTLEMENT_ATTEMPT_OUTCOMES = ['Sent', 'Succeeded', 'Failed', 'Timeout', 'Rejected'] as const;

export type PayoutSettlementStatus = (typeof PAYOUT_SETTLEMENT_STATUSES)[number];
export type PayoutSettlementKind = (typeof PAYOUT_SETTLEMENT_KINDS)[number];
export type PayoutSettlementAttemptOutcome = (typeof PAYOUT_SETTLEMENT_ATTEMPT_OUTCOMES)[number];

export type PayoutSettlementListItem = {
  // null for a synthesized "Awaiting Window" row (UC-72, BE Task 10A): no PayoutSettlement
  // exists yet for it, so it has neither a settlement id nor an assigned run date.
  settlementId: number | null;
  // The UC-73 batch this settlement belongs to (PD-14: one batch gathers every booking for a
  // Tour Operator in one run) — never settlementId, which only coincides with it when a batch
  // has exactly one booking. Null for the same synthesized rows as settlementId.
  batchId: number | null;
  bookingId: number;
  tourOperatorUserId: number;
  runDate: string | null;
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
const isNullableSafeInteger = (value: unknown): value is number | null => value === null || isSafeInteger(value);
const isNullableRunDate = (value: unknown): value is string | null => value === null || isRunDate(value);

export function parsePayoutSettlementListItem(value: unknown): PayoutSettlementListItem {
  if (
    !isRecord(value) ||
    !isNullableSafeInteger(value.settlementId) ||
    !isNullableSafeInteger(value.batchId) ||
    !isSafeInteger(value.bookingId) ||
    !isSafeInteger(value.tourOperatorUserId) ||
    !isNullableRunDate(value.runDate) ||
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

/** UC-73 [Mark as Resolved]: non-blank after trim (backend: `daily_payout.resolution_reason_required`, MSG178). */
export function validateResolutionReason(value: unknown): { ok: true; value: string } | { ok: false } {
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

export const formatVnd = (value: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

/** UC-73 attempt history ("Sent At"): a real timestamp, shown in Vietnam local time. */
export const formatVietnamDateTime = (value: string): string =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

// Screen 1 filter state (admin list), kept in the URL so a reload or shared link preserves it.
export type PayoutSettlementsSearch = {
  status: PayoutSettlementStatus | '';
  runDateFrom: string;
  runDateTo: string;
  pageNumber: number;
};

export function defaultPayoutSettlementsSearch(): PayoutSettlementsSearch {
  return { status: '', runDateFrom: '', runDateTo: '', pageNumber: 1 };
}

export function parsePayoutSettlementsSearch(params: URLSearchParams): PayoutSettlementsSearch {
  const status = params.get('status');
  const runDateFrom = params.get('runDateFrom');
  const runDateTo = params.get('runDateTo');
  const pageNumber = Number(params.get('pageNumber'));
  return {
    status: status && (PAYOUT_SETTLEMENT_STATUSES as readonly string[]).includes(status) ? (status as PayoutSettlementStatus) : '',
    runDateFrom: isRunDate(runDateFrom) ? runDateFrom : '',
    runDateTo: isRunDate(runDateTo) ? runDateTo : '',
    pageNumber: Number.isSafeInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1,
  };
}

export function serializePayoutSettlementsSearch(search: PayoutSettlementsSearch): URLSearchParams {
  const query = new URLSearchParams();
  if (search.status) query.set('status', search.status);
  if (search.runDateFrom) query.set('runDateFrom', search.runDateFrom);
  if (search.runDateTo) query.set('runDateTo', search.runDateTo);
  if (search.pageNumber > 1) query.set('pageNumber', String(search.pageNumber));
  return query;
}

/** Awaiting Window rows have no runDate at all, so an inverted range is the only thing worth
 * blocking client-side before submit; the backend applies the actual filter. */
export function validRunDateRange(from: string, to: string): boolean {
  if (!from || !to) return true;
  return from <= to;
}
